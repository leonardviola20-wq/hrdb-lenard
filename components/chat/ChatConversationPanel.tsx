import { ChatBubbleLeftRightIcon, ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { FormEvent, ReactNode, RefObject } from "react";
import type { DirectMessage, OnlineUser } from "@/lib/directChatClient";
import { ChatMessageComposer } from "./ChatMessageComposer";
import { ChatMessageList } from "./ChatMessageList";

type ChatConversationPanelProps = {
  activeUser: OnlineUser | null;
  onlineCount: number;
  error: string;
  messages: DirectMessage[];
  selfPublicId: string;
  reactionMessageId: string | null;
  messageListRef: RefObject<HTMLDivElement | null>;
  otherUserTyping: boolean;
  draft: string;
  emojiPickerOpen: boolean;
  sending: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  rosterPanel: ReactNode;
  onBack: () => void;
  onMinimize: () => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onToggleReactionPicker: (messageId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDraftChange: (value: string, caretPosition: number) => void;
  onSelectionChange: (caretPosition: number) => void;
  onInsertEmoji: (emoji: string) => void;
  onToggleEmojiPicker: () => void;
  onStopTyping: () => void;
};

export function ChatConversationPanel({
  activeUser,
  onlineCount,
  error,
  messages,
  selfPublicId,
  reactionMessageId,
  messageListRef,
  otherUserTyping,
  draft,
  emojiPickerOpen,
  sending,
  textareaRef,
  rosterPanel,
  onBack,
  onMinimize,
  onToggleReaction,
  onToggleReactionPicker,
  onSubmit,
  onDraftChange,
  onSelectionChange,
  onInsertEmoji,
  onToggleEmojiPicker,
  onStopTyping,
}: ChatConversationPanelProps) {
  return (
    <section
      aria-label="Team chat widget"
      className="fixed bottom-24 right-4 z-50 flex h-[min(36rem,calc(100dvh-8rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-6"
    >
      <header className="flex shrink-0 items-center gap-3 bg-[#172554] px-4 py-3 text-white">
        {activeUser ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to team chat"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-100 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-300/20">
            <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{activeUser?.name ?? "Team chat"}</span>
          <span className="block text-xs text-blue-200">
            {activeUser
              ? activeUser.role === "ADMIN" ? "Admin · Direct message" : "Direct message"
              : `${onlineCount} online`}
          </span>
        </span>
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize chat widget"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-100 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {error && (
        <p role="alert" className="mx-3 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </p>
      )}

      {activeUser && (
        <>
          <ChatMessageList
            activeUser={activeUser}
            messages={messages}
            selfPublicId={selfPublicId}
            reactionMessageId={reactionMessageId}
            messageListRef={messageListRef}
            otherUserTyping={otherUserTyping}
            onToggleReaction={onToggleReaction}
            onToggleReactionPicker={onToggleReactionPicker}
          />
          <ChatMessageComposer
            activeUser={activeUser}
            draft={draft}
            emojiPickerOpen={emojiPickerOpen}
            sending={sending}
            textareaRef={textareaRef}
            onSubmit={onSubmit}
            onDraftChange={onDraftChange}
            onSelectionChange={onSelectionChange}
            onInsertEmoji={onInsertEmoji}
            onToggleEmojiPicker={onToggleEmojiPicker}
            onStopTyping={onStopTyping}
          />
        </>
      )}
      {!activeUser && rosterPanel}
    </section>
  );
}
