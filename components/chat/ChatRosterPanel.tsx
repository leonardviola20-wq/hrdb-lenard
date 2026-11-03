import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import type { DirectMessage, OnlineUser } from "@/lib/directChatClient";

type ChatRosterPanelProps = {
  onlineUsers: OnlineUser[];
  visibleOnlineUsers: OnlineUser[];
  showAllUsers: boolean;
  unreadMessages: DirectMessage[];
  onToggleShowAll: () => void;
  onOpenUser: (user: OnlineUser) => void;
  onOpenUnreadMessage: (message: DirectMessage) => void;
};

export function ChatRosterPanel({
  onlineUsers,
  visibleOnlineUsers,
  showAllUsers,
  unreadMessages,
  onToggleShowAll,
  onOpenUser,
  onOpenUnreadMessage,
}: ChatRosterPanelProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {unreadMessages.length > 0 && (
        <section aria-labelledby="unread-messages-heading" className="border-b border-slate-100 p-3">
          <h3 id="unread-messages-heading" className="px-1 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">New messages</h3>
          <ul className="space-y-1">
            {[...unreadMessages].reverse().map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => onOpenUnreadMessage(message)}
                  className="w-full rounded-xl bg-blue-50 px-3 py-2 text-left transition hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <span className="block truncate text-sm font-semibold text-slate-900">{message.senderName}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-600">{message.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="widget-online-users-heading" className="p-3">
        <div className="flex items-center justify-between gap-2 px-1 pb-2">
          <h3 id="widget-online-users-heading" className="text-xs font-bold uppercase tracking-wide text-slate-500">Online now</h3>
          {onlineUsers.length > 3 && (
            <button
              type="button"
              aria-expanded={showAllUsers}
              onClick={onToggleShowAll}
              className="rounded px-1.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              {showAllUsers ? "Show fewer" : "View all"}
            </button>
          )}
        </div>
        {onlineUsers.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-5 text-center text-sm text-slate-500">No teammates are online right now.</p>
        ) : (
          <ul className="space-y-1">
            {visibleOnlineUsers.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => onOpenUser(user)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-900">
                    {user.name.slice(0, 1).toUpperCase()}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{user.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{user.role === "ADMIN" ? "Admin · Online" : "Online"}</span>
                  </span>
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="px-4 pb-4 text-center text-[11px] leading-5 text-slate-400">Messages are temporary and stay on this local server.</p>
    </div>
  );
}
