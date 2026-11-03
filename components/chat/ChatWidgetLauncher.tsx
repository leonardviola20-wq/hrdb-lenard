import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

type ChatWidgetLauncherProps = {
  isOpen: boolean;
  unreadCount: number;
  onToggle: () => void;
};

export function ChatWidgetLauncher({ isOpen, unreadCount, onToggle }: ChatWidgetLauncherProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isOpen ? "Minimize chat widget" : `Open team chat${unreadCount ? `, ${unreadCount} unread` : ""}`}
      aria-expanded={isOpen}
      className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-900 text-white shadow-xl transition hover:scale-105 hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:right-6"
    >
      <ChatBubbleLeftRightIcon className="h-6 w-6" aria-hidden="true" />
      {unreadCount > 0 && (
        <span aria-label={`${unreadCount} unread messages`} className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-rose-600 px-1 text-xs font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
