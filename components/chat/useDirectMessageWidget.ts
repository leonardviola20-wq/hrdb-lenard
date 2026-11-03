import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ChatApiError,
  isJsonRecord,
  OPEN_DIRECT_CHAT_EVENT,
  parseDirectMessage,
  parseOnlineUser,
  requestChatJson,
  type DirectMessage,
  type OnlineUser,
} from "@/lib/directChatClient";

const PRESENCE_REFRESH_MS = 15_000;
const INBOX_REFRESH_MS = 2_000;
const CONVERSATION_REFRESH_MS = 2_000;
const TOAST_DURATION_MS = 8_000;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_VISIBLE_UNREAD = 50;
const TYPING_REFRESH_MS = 2_500;
const TYPING_IDLE_MS = 3_000;

type InboxPayload = {
  messages: DirectMessage[];
  nextCursor: number;
};

function mergeMessages(current: DirectMessage[], incoming: DirectMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((left, right) => left.sequence - right.sequence);
}

function parseInbox(value: unknown): InboxPayload {
  if (
    !isJsonRecord(value) ||
    !Array.isArray(value.messages) ||
    typeof value.nextCursor !== "number" ||
    !Number.isSafeInteger(value.nextCursor) ||
    value.nextCursor < 0
  ) {
    throw new ChatApiError("The chat service returned an invalid inbox.");
  }
  return {
    messages: value.messages.map(parseDirectMessage),
    nextCursor: value.nextCursor,
  };
}

function contactForMessage(message: DirectMessage, onlineUsers: OnlineUser[]): OnlineUser {
  return onlineUsers.find((user) => user.id === message.senderId) ?? {
    id: message.senderId,
    name: message.senderName,
    role: "USER",
  };
}

export function useDirectMessageWidget() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<OnlineUser | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selfPublicId, setSelfPublicId] = useState("");
  const [reactionMessageId, setReactionMessageId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<DirectMessage[]>([]);
  const [toastMessage, setToastMessage] = useState<DirectMessage | null>(null);
  const [draft, setDraft] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messageListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const caretPositionRef = useRef(0);
  const activeUserRef = useRef<OnlineUser | null>(null);
  const onlineUsersRef = useRef<OnlineUser[]>([]);
  const isOpenRef = useRef(false);
  const inboxCursorRef = useRef<number | null>(null);
  const typingRecipientRef = useRef<string | null>(null);
  const typingHeartbeatRef = useRef<number | null>(null);
  const typingIdleTimeoutRef = useRef<number | null>(null);

  const publishTypingStatus = useCallback((recipientId: string, isTyping: boolean) => {
    void requestChatJson("/api/chat/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, isTyping }),
    }).catch((typingError: unknown) => {
      if (isTyping && activeUserRef.current?.id === recipientId) {
        setError(typingError instanceof Error ? typingError.message : "Unable to update typing status.");
      } else if (!isTyping) {
        console.error("Clear chat typing status failed:", typingError);
      }
    });
  }, []);

  const stopTyping = useCallback(() => {
    if (typingHeartbeatRef.current !== null) {
      window.clearInterval(typingHeartbeatRef.current);
      typingHeartbeatRef.current = null;
    }
    if (typingIdleTimeoutRef.current !== null) {
      window.clearTimeout(typingIdleTimeoutRef.current);
      typingIdleTimeoutRef.current = null;
    }
    const recipientId = typingRecipientRef.current;
    typingRecipientRef.current = null;
    if (recipientId) publishTypingStatus(recipientId, false);
  }, [publishTypingStatus]);

  const startTyping = useCallback((recipientId: string) => {
    if (typingRecipientRef.current !== recipientId) stopTyping();
    if (!typingRecipientRef.current) {
      typingRecipientRef.current = recipientId;
      publishTypingStatus(recipientId, true);
      typingHeartbeatRef.current = window.setInterval(
        () => publishTypingStatus(recipientId, true),
        TYPING_REFRESH_MS,
      );
    }
    if (typingIdleTimeoutRef.current !== null) window.clearTimeout(typingIdleTimeoutRef.current);
    typingIdleTimeoutRef.current = window.setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [publishTypingStatus, stopTyping]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  useEffect(() => {
    const handleOpenConversation = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      try {
        const user = parseOnlineUser(detail);
        stopTyping();
        activeUserRef.current = user;
        setActiveUser(user);
        setMessages([]);
        setReactionMessageId(null);
        setDraft("");
        setEmojiPickerOpen(false);
        setOtherUserTyping(false);
        setError("");
        setUnreadMessages((current) => current.filter((message) => message.senderId !== user.id));
        setToastMessage((current) => current?.senderId === user.id ? null : current);
        isOpenRef.current = true;
        setIsOpen(true);
      } catch (eventError) {
        console.error("Could not open direct chat:", eventError);
      }
    };

    window.addEventListener(OPEN_DIRECT_CHAT_EVENT, handleOpenConversation);
    return () => window.removeEventListener(OPEN_DIRECT_CHAT_EVENT, handleOpenConversation);
  }, [stopTyping]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    let active = true;
    let timer = 0;

    const refreshPresence = async () => {
      try {
        const payload = await requestChatJson("/api/chat/presence");
        if (
          !isJsonRecord(payload) ||
          typeof payload.selfId !== "string" ||
          !Array.isArray(payload.users)
        ) {
          throw new ChatApiError("The chat service returned an invalid online-user list.");
        }
        const users = payload.users.map(parseOnlineUser);
        if (!active) return;
        setSelfPublicId(payload.selfId);
        onlineUsersRef.current = users;
        setOnlineUsers(users);

        const current = activeUserRef.current;
        const refreshedContact = current && users.find((user) => user.id === current.id);
        if (current && refreshedContact) {
          activeUserRef.current = refreshedContact;
          setActiveUser(refreshedContact);
        }
      } catch (presenceError) {
        if (active) {
          setError(presenceError instanceof Error ? presenceError.message : "Unable to load online users.");
        }
      } finally {
        if (active) timer = window.setTimeout(() => { void refreshPresence(); }, PRESENCE_REFRESH_MS);
      }
    };

    void refreshPresence();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timer = 0;

    const refreshInbox = async () => {
      try {
        const cursor = inboxCursorRef.current;
        const query = cursor === null ? "" : `?after=${cursor}`;
        const payload = parseInbox(await requestChatJson(`/api/chat/messages/inbox${query}`));
        if (!active) return;
        if (cursor !== null && payload.nextCursor < cursor) {
          throw new ChatApiError("The chat service returned an outdated inbox cursor.");
        }
        inboxCursorRef.current = payload.nextCursor;

        if (cursor !== null && payload.messages.length > 0) {
          const currentConversationId = activeUserRef.current?.id;
          const messagesToNotify = payload.messages.filter((message) => (
            !(isOpenRef.current && currentConversationId === message.senderId)
          ));
          if (messagesToNotify.length > 0) {
            setUnreadMessages((current) => {
              const knownIds = new Set(current.map((message) => message.id));
              const unique = messagesToNotify.filter((message) => !knownIds.has(message.id));
              return [...current, ...unique].slice(-MAX_VISIBLE_UNREAD);
            });
            setToastMessage(messagesToNotify[messagesToNotify.length - 1]);
          }
        }
      } catch (inboxError) {
        if (active) {
          setError(inboxError instanceof Error ? inboxError.message : "Unable to load new messages.");
        }
      } finally {
        if (active) timer = window.setTimeout(() => { void refreshInbox(); }, INBOX_REFRESH_MS);
      }
    };

    void refreshInbox();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const activeUserId = activeUser?.id;
  const visibleOnlineUsers = showAllUsers ? onlineUsers : onlineUsers.slice(0, 3);

  useEffect(() => {
    if (!activeUserId) return;

    let active = true;
    let timer = 0;
    const refreshConversation = async () => {
      try {
        const query = new URLSearchParams({ with: activeUserId });
        const [payload, typingPayload] = await Promise.all([
          requestChatJson(`/api/chat/messages?${query}`),
          requestChatJson(`/api/chat/typing?${query}`),
        ]);
        if (!isJsonRecord(payload) || !Array.isArray(payload.messages)) {
          throw new ChatApiError("The chat service returned an invalid conversation.");
        }
        if (!isJsonRecord(typingPayload) || typeof typingPayload.isTyping !== "boolean") {
          throw new ChatApiError("The chat service returned an invalid typing status.");
        }
        const incoming = payload.messages.map(parseDirectMessage);
        if (active) {
          setMessages((current) => mergeMessages(current, incoming));
          setOtherUserTyping(typingPayload.isTyping);
          setError("");
        }
      } catch (conversationError) {
        if (active) {
          setError(conversationError instanceof Error ? conversationError.message : "Unable to load this conversation.");
        }
      } finally {
        if (active) timer = window.setTimeout(() => { void refreshConversation(); }, CONVERSATION_REFRESH_MS);
      }
    };

    void refreshConversation();
    return () => {
      active = false;
      window.clearTimeout(timer);
      stopTyping();
    };
  }, [activeUserId, stopTyping]);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, otherUserTyping]);

  const openConversation = (user: OnlineUser) => {
    stopTyping();
    activeUserRef.current = user;
    setActiveUser(user);
    setMessages([]);
    setReactionMessageId(null);
    setDraft("");
    setEmojiPickerOpen(false);
    setOtherUserTyping(false);
    setError("");
    setUnreadMessages((current) => current.filter((message) => message.senderId !== user.id));
    setToastMessage((current) => current?.senderId === user.id ? null : current);
  };

  const closeConversation = () => {
    stopTyping();
    activeUserRef.current = null;
    setActiveUser(null);
    setMessages([]);
    setReactionMessageId(null);
    setDraft("");
    setEmojiPickerOpen(false);
    setOtherUserTyping(false);
    setError("");
  };

  const dismissWidget = () => {
    stopTyping();
    isOpenRef.current = false;
    setIsOpen(false);
  };

  const showToastConversation = (message: DirectMessage) => {
    const user = contactForMessage(message, onlineUsersRef.current);
    isOpenRef.current = true;
    setIsOpen(true);
    openConversation(user);
  };

  const openUnreadMessage = (message: DirectMessage) => {
    openConversation(contactForMessage(message, onlineUsersRef.current));
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeUser || sending) return;
    const recipientId = activeUser.id;
    const text = draft.trim();
    if (!text || text.length > MAX_MESSAGE_LENGTH) return;

    stopTyping();
    setSending(true);
    setError("");
    try {
      const payload = await requestChatJson("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, text }),
      });
      if (!isJsonRecord(payload)) throw new ChatApiError("The chat service returned an invalid message.");
      const message = parseDirectMessage(payload.message);
      if (activeUserRef.current?.id === recipientId) {
        setMessages((current) => mergeMessages(current, [message]));
        setDraft("");
      }
    } catch (sendError) {
      if (activeUserRef.current?.id === recipientId) {
        setError(sendError instanceof Error ? sendError.message : "Unable to send this message.");
      }
    } finally {
      setSending(false);
    }
  };

  const toggleMessageReaction = async (messageId: string, emoji: string) => {
    const conversationId = activeUser?.id;
    if (!conversationId) return;
    try {
      const payload = await requestChatJson("/api/chat/messages/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      if (!isJsonRecord(payload)) throw new ChatApiError("The chat service returned an invalid reaction.");
      const updatedMessage = parseDirectMessage(payload.message);
      if (activeUserRef.current?.id === conversationId) {
        setMessages((current) => current.map((message) => (
          message.id === updatedMessage.id ? updatedMessage : message
        )));
      }
      setReactionMessageId(null);
      setError("");
    } catch (reactionError) {
      if (activeUserRef.current?.id === conversationId) {
        setError(reactionError instanceof Error ? reactionError.message : "Unable to update this reaction.");
      }
    }
  };

  const updateDraft = (value: string, caretPosition: number) => {
    setDraft(value);
    caretPositionRef.current = caretPosition;
    if (activeUser && value.trim()) startTyping(activeUser.id);
    else stopTyping();
  };

  const recordCaretPosition = (caretPosition: number) => {
    caretPositionRef.current = caretPosition;
  };

  const insertEmoji = (emoji: string) => {
    const currentDraft = draft;
    const input = textareaRef.current;
    const start = Math.min(input?.selectionStart ?? caretPositionRef.current, currentDraft.length);
    const end = Math.max(start, Math.min(input?.selectionEnd ?? start, currentDraft.length));
    const nextDraft = `${currentDraft.slice(0, start)}${emoji}${currentDraft.slice(end)}`;
    if (nextDraft.length > MAX_MESSAGE_LENGTH) {
      setError(`Messages can be up to ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }
    const nextCaret = start + emoji.length;
    setDraft(nextDraft);
    caretPositionRef.current = nextCaret;
    setEmojiPickerOpen(false);
    if (activeUser && nextDraft.trim()) startTyping(activeUser.id);
    window.requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const toggleWidget = () => {
    isOpenRef.current = !isOpen;
    setIsOpen((current) => !current);
  };

  return {
    onlineUsers,
    visibleOnlineUsers,
    showAllUsers,
    setShowAllUsers,
    isOpen,
    activeUser,
    messages,
    selfPublicId,
    reactionMessageId,
    setReactionMessageId,
    unreadMessages,
    toastMessage,
    setToastMessage,
    draft,
    emojiPickerOpen,
    setEmojiPickerOpen,
    otherUserTyping,
    sending,
    error,
    messageListRef,
    textareaRef,
    openConversation,
    closeConversation,
    dismissWidget,
    showToastConversation,
    openUnreadMessage,
    sendMessage,
    toggleMessageReaction,
    updateDraft,
    recordCaretPosition,
    insertEmoji,
    stopTyping,
    toggleWidget,
  };
}
