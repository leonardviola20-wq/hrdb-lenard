import { FaceSmileIcon } from "@heroicons/react/24/outline";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import type { RefObject } from "react";
import type { DirectMessage, OnlineUser } from "@/lib/directChatClient";

type ChatMessageListProps = {
  activeUser: OnlineUser;
  messages: DirectMessage[];
  selfPublicId: string;
  reactionMessageId: string | null;
  messageListRef: RefObject<HTMLDivElement | null>;
  otherUserTyping: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onToggleReactionPicker: (messageId: string) => void;
};

export function ChatMessageList({
  activeUser,
  messages,
  selfPublicId,
  reactionMessageId,
  messageListRef,
  otherUserTyping,
  onToggleReaction,
  onToggleReactionPicker,
}: ChatMessageListProps) {
  return (
    <div
      ref={messageListRef}
      role="log"
      aria-label="Conversation messages"
      aria-live="polite"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
    >
      {messages.length === 0 ? (
        <div className="m-auto max-w-60 text-center">
          <p className="text-sm font-semibold text-slate-800">Say hello to {activeUser.name}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Messages are temporary and clear when the local server restarts.</p>
        </div>
      ) : messages.map((message) => {
        const own = message.senderId !== activeUser.id;
        return (
          <article key={message.id} className={`flex flex-col ${own ? "items-end" : "items-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${own ? "rounded-br-md bg-blue-900 text-white" : "rounded-bl-md bg-slate-100 text-slate-900"}`}>
              {!own && <p className="mb-1 text-xs font-semibold text-slate-600">{message.senderName}</p>}
              <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.text}</p>
              <time dateTime={message.createdAt} className={`mt-1 block text-right text-[10px] ${own ? "text-blue-200" : "text-slate-500"}`}>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </time>
            </div>
            <div className={`mt-1 flex max-w-[85%] flex-wrap gap-1 ${own ? "justify-end" : "justify-start"}`}>
              {message.reactions.map((reaction) => {
                const selected = reaction.userIds.includes(selfPublicId);
                return (
                  <button
                    key={reaction.emoji}
                    type="button"
                    aria-label={`${reaction.emoji}, ${reaction.userIds.length} ${reaction.userIds.length === 1 ? "reaction" : "reactions"}`}
                    aria-pressed={selected}
                    onClick={() => onToggleReaction(message.id, reaction.emoji)}
                    className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700 ${
                      selected ? "border-blue-500 bg-blue-100 text-blue-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span aria-hidden="true">{reaction.emoji}</span>
                    <span>{reaction.userIds.length}</span>
                  </button>
                );
              })}
              <button
                type="button"
                aria-label={`Add reaction to message from ${own ? "you" : message.senderName}`}
                aria-expanded={reactionMessageId === message.id}
                onClick={() => onToggleReactionPicker(message.id)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700"
              >
                <FaceSmileIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {reactionMessageId === message.id && (
              <div
                role="group"
                aria-label={`Choose a reaction for message from ${own ? "you" : message.senderName}`}
                className={`mt-2 ${own ? "self-end" : "self-start"}`}
              >
                <EmojiPicker
                  onEmojiClick={(emoji: EmojiClickData) => onToggleReaction(message.id, emoji.emoji)}
                  width="min(280px, calc(100vw - 72px))"
                  height={350}
                  searchPlaceHolder="Search emojis"
                  previewConfig={{ showPreview: false }}
                  lazyLoadEmojis
                />
              </div>
            )}
          </article>
        );
      })}
      {otherUserTyping && (
        <div role="status" aria-live="polite" className="flex items-center gap-2 self-start rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2.5 text-xs text-slate-600">
          <span>{activeUser.name} is typing</span>
          <span className="flex gap-0.5" aria-hidden="true">
            <span className="h-1 w-1 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.2s]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.1s]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-slate-500" />
          </span>
        </div>
      )}
    </div>
  );
}
