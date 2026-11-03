import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { DirectMessage } from "@/lib/directChatClient";

type IncomingMessageToastProps = {
  message: DirectMessage | null;
  isWidgetOpen: boolean;
  onOpen: (message: DirectMessage) => void;
  onDismiss: () => void;
};

export function IncomingMessageToast({ message, isWidgetOpen, onOpen, onDismiss }: IncomingMessageToastProps) {
  if (!message || isWidgetOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[60] w-[min(22rem,calc(100vw-2rem))] sm:right-6">
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl">
        <button
          type="button"
          onClick={() => onOpen(message)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-900">
            <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900">{message.senderName}</span>
            <span className="mt-1 block truncate text-sm text-slate-600">{message.text}</span>
          </span>
        </button>
        <button
          type="button"
          aria-label="Dismiss message notification"
          onClick={onDismiss}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
