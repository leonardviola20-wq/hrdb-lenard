export const OPEN_DIRECT_CHAT_EVENT = "hrdb-open-direct-chat";

export type OnlineUser = {
  id: string;
  name: string;
  role: "ADMIN" | "USER";
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

export type DirectMessageReaction = {
  emoji: string;
  userIds: string[];
};

export type JsonRecord = Record<string, unknown>;

export function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export class ChatApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatApiError";
  }
}

export async function requestChatJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store", ...init });
  let payload: unknown;
  try {
    payload = response.status === 204 ? null : await response.json();
  } catch {
    throw new ChatApiError("The chat service returned an unreadable response.");
  }
  if (!response.ok) {
    throw new ChatApiError(
      isJsonRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : "Unable to update chat.",
    );
  }
  return payload;
}

export function parseOnlineUser(value: unknown): OnlineUser {
  if (
    !isJsonRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    (value.role !== "ADMIN" && value.role !== "USER")
  ) {
    throw new ChatApiError("The chat service returned an invalid online user.");
  }
  return { id: value.id, name: value.name, role: value.role };
}

export function parseDirectMessage(value: unknown): DirectMessage {
  const reactions = isJsonRecord(value) && Array.isArray(value.reactions)
    ? value.reactions.map((reaction) => {
      if (
        !isJsonRecord(reaction) ||
        typeof reaction.emoji !== "string" ||
        !Array.isArray(reaction.userIds) ||
        !reaction.userIds.every((userId): userId is string => typeof userId === "string")
      ) {
        throw new ChatApiError("The chat service returned invalid message reactions.");
      }
      return { emoji: reaction.emoji, userIds: reaction.userIds };
    })
    : null;
  if (
    !isJsonRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.senderId !== "string" ||
    typeof value.recipientId !== "string" ||
    typeof value.senderName !== "string" ||
    typeof value.text !== "string" ||
    typeof value.createdAt !== "string" ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    typeof value.sequence !== "number" ||
    !Number.isSafeInteger(value.sequence) ||
    value.sequence < 1 ||
    !reactions
  ) {
    throw new ChatApiError("The chat service returned an invalid message.");
  }
  return {
    id: value.id,
    senderId: value.senderId,
    recipientId: value.recipientId,
    senderName: value.senderName,
    text: value.text,
    createdAt: value.createdAt,
    sequence: value.sequence,
    reactions,
  };
}

export function openDirectChat(user: OnlineUser) {
  window.dispatchEvent(new CustomEvent<OnlineUser>(OPEN_DIRECT_CHAT_EVENT, { detail: user }));
}
