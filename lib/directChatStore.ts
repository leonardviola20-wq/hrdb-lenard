import { randomUUID } from "node:crypto";

export const CHAT_PRESENCE_TTL_MS = 60_000;
export const CHAT_THREAD_TTL_MS = 60 * 60 * 1_000;
export const CHAT_TYPING_TTL_MS = 5_000;
export const MAX_CHAT_PRESENCE_SESSIONS = 2_000;
export const MAX_CHAT_THREADS = 5_000;
export const MAX_CHAT_MESSAGES_PER_THREAD = 100;
export const MAX_CHAT_INBOX_BATCH_SIZE = 50;
export const MAX_DIRECT_MESSAGE_LENGTH = 2_000;
export const MAX_CHAT_REACTIONS_PER_MESSAGE = 20;

export type OnlineUser = {
  id: string;
  userId: number;
};

export type DirectMessageReaction = {
  emoji: string;
  userIds: string[];
};

export type DirectMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  text: string;
  createdAt: string;
  sequence: number;
  reactions: DirectMessageReaction[];
};

export type DirectChatInbox = {
  messages: DirectMessage[];
  nextCursor: number;
};

type Presence = {
  id: string;
  sessions: Map<string, number>;
};

type Thread = {
  key: string;
  userIds: [number, number];
  messages: DirectMessage[];
  updatedAt: number;
};

type TypingActivity = {
  expiresAt: number;
};

type DirectChatStoreOptions = {
  now?: () => number;
  createId?: () => string;
};

export type DirectChatError =
  | "capacity"
  | "recipient-not-found"
  | "recipient-offline"
  | "thread-not-found"
  | "invalid-reaction"
  | "reaction-limit";
export type DirectChatResult<T> = { ok: true; value: T } | { ok: false; error: DirectChatError };

const emojiCodePointPattern = /^[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Component}\u200d\u20e3\ufe0e\ufe0f]+$/u;
const emojiPresencePattern = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u;

export function isChatEmoji(value: string) {
  if (!value || value.length > 32 || !emojiPresencePattern.test(value) || !emojiCodePointPattern.test(value)) {
    return false;
  }
  return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value)].length === 1;
}

export class DirectChatStore {
  private readonly presenceByUser = new Map<number, Presence>();
  private readonly publicIdByUser = new Map<number, string>();
  private readonly userByPublicId = new Map<string, number>();
  private readonly threads = new Map<string, Thread>();
  private readonly typingByConversation = new Map<string, TypingActivity>();
  private readonly now: () => number;
  private readonly createId: () => string;
  private messageSequence = 0;

  constructor(options: DirectChatStoreOptions = {}) {
    this.now = options.now ?? Date.now;
    this.createId = options.createId ?? randomUUID;
  }

  heartbeat(userId: number, sessionId: string): DirectChatResult<OnlineUser> {
    this.prunePresence();
    const now = this.now();
    let presence = this.presenceByUser.get(userId);
    if (!presence) {
      if (this.presenceSessionCount() >= MAX_CHAT_PRESENCE_SESSIONS) {
        return { ok: false, error: "capacity" };
      }
      const id = this.publicId(userId);
      presence = { id, sessions: new Map() };
      this.presenceByUser.set(userId, presence);
    }

    const isNewSession = !presence.sessions.has(sessionId);
    if (isNewSession && this.presenceSessionCount() >= MAX_CHAT_PRESENCE_SESSIONS) {
      return { ok: false, error: "capacity" };
    }
    presence.sessions.set(sessionId, now);
    return { ok: true, value: { id: presence.id, userId } };
  }

  leave(userId: number, sessionId: string): void {
    const presence = this.presenceByUser.get(userId);
    if (!presence) return;
    presence.sessions.delete(sessionId);
    if (presence.sessions.size === 0) this.presenceByUser.delete(userId);
  }

  listOnline(excludeUserId: number): OnlineUser[] {
    this.prunePresence();
    return [...this.presenceByUser.entries()]
      .filter(([userId]) => userId !== excludeUserId)
      .map(([userId, presence]) => ({ id: presence.id, userId }));
  }

  getPublicUserId(userId: number): string {
    return this.publicId(userId);
  }

  resolvePublicUserId(publicUserId: string): number | undefined {
    return this.userByPublicId.get(publicUserId);
  }

  sendMessage(
    senderUserId: number,
    recipientPublicId: string,
    senderName: string,
    text: string,
  ): DirectChatResult<DirectMessage> {
    this.pruneThreads();
    const recipientUserId = this.resolvePublicUserId(recipientPublicId);
    if (recipientUserId === undefined || recipientUserId === senderUserId) {
      return { ok: false, error: "recipient-not-found" };
    }
    if (!this.isOnline(recipientUserId)) return { ok: false, error: "recipient-offline" };

    const thread = this.getOrCreateThread(senderUserId, recipientUserId);
    if (!thread) return { ok: false, error: "capacity" };
    const message: DirectMessage = {
      id: this.createId(),
      senderId: this.getPublicUserId(senderUserId),
      recipientId: recipientPublicId,
      senderName,
      text,
      createdAt: new Date(this.now()).toISOString(),
      sequence: ++this.messageSequence,
      reactions: [],
    };
    thread.messages.push(message);
    if (thread.messages.length > MAX_CHAT_MESSAGES_PER_THREAD) {
      thread.messages.splice(0, thread.messages.length - MAX_CHAT_MESSAGES_PER_THREAD);
    }
    thread.updatedAt = this.now();
    return { ok: true, value: message };
  }

  getConversation(userId: number, otherPublicId: string): DirectChatResult<DirectMessage[]> {
    this.pruneThreads();
    const otherUserId = this.resolvePublicUserId(otherPublicId);
    if (otherUserId === undefined || otherUserId === userId) {
      return { ok: false, error: "recipient-not-found" };
    }
    const key = this.threadKey(userId, otherUserId);
    return { ok: true, value: this.threads.get(key)?.messages.slice() ?? [] };
  }

  toggleReaction(userId: number, messageId: string, emoji: string): DirectChatResult<DirectMessage> {
    this.pruneThreads();
    if (!isChatEmoji(emoji)) return { ok: false, error: "invalid-reaction" };

    for (const thread of this.threads.values()) {
      const message = thread.messages.find((candidate) => candidate.id === messageId);
      if (!message) continue;
      if (!thread.userIds.includes(userId)) return { ok: false, error: "thread-not-found" };

      const userPublicId = this.getPublicUserId(userId);
      const existing = message.reactions.find((reaction) => reaction.emoji === emoji);
      if (existing?.userIds.includes(userPublicId)) {
        existing.userIds = existing.userIds.filter((id) => id !== userPublicId);
        if (existing.userIds.length === 0) {
          message.reactions = message.reactions.filter((reaction) => reaction.emoji !== emoji);
        }
      } else {
        if (!existing && message.reactions.length >= MAX_CHAT_REACTIONS_PER_MESSAGE) {
          return { ok: false, error: "reaction-limit" };
        }
        if (existing) existing.userIds.push(userPublicId);
        else message.reactions.push({ emoji, userIds: [userPublicId] });
      }

      thread.updatedAt = this.now();
      return {
        ok: true,
        value: {
          ...message,
          reactions: message.reactions.map((reaction) => ({ ...reaction, userIds: [...reaction.userIds] })),
        },
      };
    }

    return { ok: false, error: "thread-not-found" };
  }

  setTypingStatus(
    senderUserId: number,
    recipientPublicId: string,
    isTyping: boolean,
  ): DirectChatResult<void> {
    this.pruneTypingActivity();
    const recipientUserId = this.resolvePublicUserId(recipientPublicId);
    if (recipientUserId === undefined || recipientUserId === senderUserId) {
      return { ok: false, error: "recipient-not-found" };
    }

    const key = this.typingKey(senderUserId, recipientUserId);
    if (!isTyping) {
      this.typingByConversation.delete(key);
      return { ok: true, value: undefined };
    }
    if (!this.isOnline(recipientUserId)) return { ok: false, error: "recipient-offline" };

    this.typingByConversation.set(key, { expiresAt: this.now() + CHAT_TYPING_TTL_MS });
    return { ok: true, value: undefined };
  }

  getTypingStatus(userId: number, otherPublicId: string): DirectChatResult<boolean> {
    this.pruneTypingActivity();
    const otherUserId = this.resolvePublicUserId(otherPublicId);
    if (otherUserId === undefined || otherUserId === userId) {
      return { ok: false, error: "recipient-not-found" };
    }

    const key = this.typingKey(otherUserId, userId);
    const activity = this.typingByConversation.get(key);
    if (!activity) return { ok: true, value: false };
    if (activity.expiresAt <= this.now()) {
      this.typingByConversation.delete(key);
      return { ok: true, value: false };
    }
    return { ok: true, value: true };
  }

  getInbox(userId: number, afterSequence: number | null): DirectChatInbox {
    if (afterSequence === null) {
      return { messages: [], nextCursor: this.messageSequence };
    }

    this.pruneThreads();
    const messages = [...this.threads.values()]
      .flatMap((thread) => thread.messages)
      .filter((message) => (
        message.sequence > afterSequence &&
        this.resolvePublicUserId(message.recipientId) === userId
      ))
      .sort((left, right) => left.sequence - right.sequence);
    const batch = messages.slice(0, MAX_CHAT_INBOX_BATCH_SIZE);
    const hasMore = messages.length > batch.length;
    return {
      messages: batch,
      nextCursor: hasMore
        ? batch[batch.length - 1].sequence
        : this.messageSequence,
    };
  }

  private getOrCreateThread(userA: number, userB: number): Thread | undefined {
    const key = this.threadKey(userA, userB);
    const existing = this.threads.get(key);
    if (existing) return existing;
    if (this.threads.size >= MAX_CHAT_THREADS) return undefined;
    const thread: Thread = {
      key,
      userIds: userA < userB ? [userA, userB] : [userB, userA],
      messages: [],
      updatedAt: this.now(),
    };
    this.threads.set(key, thread);
    return thread;
  }

  private isOnline(userId: number) {
    const presence = this.presenceByUser.get(userId);
    return Boolean(presence?.sessions.size);
  }

  private publicId(userId: number) {
    let id = this.publicIdByUser.get(userId);
    if (id) return id;
    id = this.createId();
    this.publicIdByUser.set(userId, id);
    this.userByPublicId.set(id, userId);
    return id;
  }

  private prunePresence() {
    const cutoff = this.now() - CHAT_PRESENCE_TTL_MS;
    for (const [userId, presence] of this.presenceByUser) {
      for (const [sessionId, lastSeenAt] of presence.sessions) {
        if (lastSeenAt < cutoff) presence.sessions.delete(sessionId);
      }
      if (presence.sessions.size === 0) this.presenceByUser.delete(userId);
    }
  }

  private pruneThreads() {
    const cutoff = this.now() - CHAT_THREAD_TTL_MS;
    for (const [key, thread] of this.threads) {
      if (thread.updatedAt < cutoff) this.threads.delete(key);
    }
  }

  private pruneTypingActivity() {
    const now = this.now();
    for (const [key, activity] of this.typingByConversation) {
      if (activity.expiresAt <= now) this.typingByConversation.delete(key);
    }
  }

  private presenceSessionCount() {
    let count = 0;
    for (const presence of this.presenceByUser.values()) count += presence.sessions.size;
    return count;
  }

  private threadKey(userA: number, userB: number) {
    return userA < userB ? `${userA}:${userB}` : `${userB}:${userA}`;
  }

  private typingKey(senderUserId: number, recipientUserId: number) {
    return `${senderUserId}:${recipientUserId}`;
  }
}

const DIRECT_CHAT_STORE_VERSION = 3;

export function getVersionedDirectChatStore(globalChatState: {
  __hrdbDirectChatStore?: DirectChatStore;
  __hrdbDirectChatStoreVersion?: number;
}) {
  const existingStore = globalChatState.__hrdbDirectChatStore;
  if (
    globalChatState.__hrdbDirectChatStoreVersion !== DIRECT_CHAT_STORE_VERSION ||
    !existingStore ||
    typeof existingStore.getInbox !== "function" ||
    typeof existingStore.setTypingStatus !== "function" ||
    typeof existingStore.toggleReaction !== "function"
  ) {
    const newStore = new DirectChatStore();
    globalChatState.__hrdbDirectChatStore = newStore;
    globalChatState.__hrdbDirectChatStoreVersion = DIRECT_CHAT_STORE_VERSION;
    return newStore;
  }
  return existingStore;
}

const globalChatState = globalThis as typeof globalThis & {
  __hrdbDirectChatStore?: DirectChatStore;
  __hrdbDirectChatStoreVersion?: number;
};

export const directChatStore = getVersionedDirectChatStore(globalChatState);
