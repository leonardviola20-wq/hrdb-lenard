import { CheckIcon, FaceSmileIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import type { FormEvent, RefObject } from "react";
import type { OnlineUser } from "@/lib/directChatClient";

type ChatMessageComposerProps = {
  activeUser: OnlineUser;
  draft: string;
  emojiPickerOpen: boolean;
  sending: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDraftChange: (value: string, caretPosition: number) => void;
  onSelectionChange: (caretPosition: number) => void;
  onInsertEmoji: (emoji: string) => void;
  onToggleEmojiPicker: () => void;
  onStopTyping: () => void;
};

const MAX_MESSAGE_LENGTH = 2_000;

export function ChatMessageComposer({
  activeUser,
  draft,
  emojiPickerOpen,
  sending,
  textareaRef,
  onSubmit,
  onDraftChange,
  onSelectionChange,
  onInsertEmoji,
  onToggleEmojiPicker,
  onStopTyping,
}: ChatMessageComposerProps) {
  return (
    <form onSubmit={onSubmit} className="relative shrink-0 border-t border-slate-200 bg-slate-50 p-3">
      {emojiPickerOpen && (
        <div id="chat-emoji-picker" className="absolute bottom-full right-3 z-10 mb-2 overflow-hidden rounded-xl shadow-xl">
          <EmojiPicker
            onEmojiClick={(emoji: EmojiClickData) => onInsertEmoji(emoji.emoji)}
            width="min(320px, calc(100vw - 56px))"
            height={380}
            searchPlaceHolder="Search emojis"
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis
          />
        </div>
      )}
      <div className="flex items-end gap-2">
        <label className="flex min-w-0 flex-1 items-end">
          <span className="sr-only">Message {activeUser.name}</span>
          <textarea
            ref={textareaRef}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value, event.target.selectionStart)}
            onSelect={(event) => onSelectionChange(event.currentTarget.selectionStart)}
            onBlur={(event) => onSelectionChange(event.currentTarget.selectionStart)}
            onKeyUp={(event) => onSelectionChange(event.currentTarget.selectionStart)}
            onBlurCapture={onStopTyping}
            onKeyDown={(event) => {
              if (event.key === "Escape" && emojiPickerOpen) {
                onToggleEmojiPicker();
                return;
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Write a message..."
            className="block max-h-28 min-h-11 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <button
          type="button"
          aria-label={emojiPickerOpen ? "Close emoji picker" : "Open emoji picker"}
          aria-expanded={emojiPickerOpen}
          aria-controls={emojiPickerOpen ? "chat-emoji-picker" : undefined}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onToggleEmojiPicker}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <FaceSmileIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? <CheckIcon className="h-5 w-5" aria-hidden="true" /> : <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-slate-500">Enter to send · Shift + Enter for a new line</p>
    </form>
  );
}
