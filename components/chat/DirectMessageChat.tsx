"use client";

import {
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import {
  ChatApiError,
  isJsonRecord,
  openDirectChat,
  parseOnlineUser,
  requestChatJson,
  type OnlineUser,
} from "@/lib/directChatClient";

const PRESENCE_REFRESH_MS = 15_000;

export function DirectMessageChat() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let timer = 0;

    const refreshPresence = async () => {
      try {
        const payload = await requestChatJson("/api/chat/presence");
        if (!isJsonRecord(payload) || !Array.isArray(payload.users)) {
          throw new ChatApiError("The chat service returned an invalid online-user list.");
        }
        const users = payload.users.map(parseOnlineUser);
        if (!active) return;
        setOnlineUsers(users);
        setError("");
      } catch (presenceError) {
        if (active) {
          setError(presenceError instanceof Error ? presenceError.message : "Unable to load online users.");
        }
      } finally {
        if (active) {
          setLoadingUsers(false);
          timer = window.setTimeout(() => { void refreshPresence(); }, PRESENCE_REFRESH_MS);
        }
      }
    };

    void refreshPresence();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const visibleUsers = showAllUsers ? onlineUsers : onlineUsers.slice(0, 3);

  return (
    <main className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Direct messages</p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Chat with your team</h2>
            <p className="text-sm leading-6 text-slate-600">
              Choose someone who&apos;s online to open a conversation in the floating chat widget. Messages are temporary and stay on this local server.
            </p>
          </div>
        </section>

        <section aria-labelledby="online-users-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <h3 id="online-users-heading" className="text-sm font-bold text-slate-900">Online now</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{onlineUsers.length}</span>
            </div>
            {onlineUsers.length > 3 && (
              <button
                type="button"
                aria-expanded={showAllUsers}
                onClick={() => setShowAllUsers((value) => !value)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                {showAllUsers ? "Show fewer" : "View all"}
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${showAllUsers ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
            )}
          </div>

          {loadingUsers ? (
            <p className="mt-4 text-sm text-slate-500" role="status">Checking who&apos;s online...</p>
          ) : onlineUsers.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No teammates are online right now. This list updates automatically.
            </p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-3">
              {visibleUsers.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => openDirectChat(user)}
                    aria-label={`Chat with ${user.name}${user.role === "ADMIN" ? ", admin" : ""}`}
                    className="group flex min-w-44 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-900">
                      {user.name.slice(0, 1).toUpperCase()}
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-800 group-hover:text-blue-900">{user.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{user.role === "ADMIN" ? "Admin · Online" : "Online"}</span>
                    </span>
                    <ChatBubbleLeftRightIcon className="ml-auto h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-700" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        )}

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
            <ChatBubbleLeftRightIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">Your chats, all in one place</h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            The floating chat widget stays available as you work on other pages. Choose an online teammate above to start chatting without leaving this page.
          </p>
        </section>
      </div>
    </main>
  );
}
