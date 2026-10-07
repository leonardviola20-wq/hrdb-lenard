"use client";

import { useEffect, useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PAGE_ACCESS_OPTIONS, type PageAccessHref } from "@/lib/pageAccess";

type AdminUser = {
  id: number;
  username: string | null;
  name: string | null;
  email: string;
  role: string;
  emailVerified: boolean;
  accessiblePages: PageAccessHref[];
  createdAt: string;
  _count: { tasks: number };
};

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [accessUser, setAccessUser] = useState<AdminUser | null>(null);
  const [selectedPages, setSelectedPages] = useState<PageAccessHref[]>([]);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load users");
        setUsers(data.users);
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter(
      (user) =>
        !normalized ||
        user.email.toLowerCase().includes(normalized) ||
        user.username?.toLowerCase().includes(normalized) ||
        user.name?.toLowerCase().includes(normalized)
    );
  }, [query, users]);

  const patchUser = async (userId: number, payload: Record<string, unknown>) => {
    setBusyUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update account");
      setUsers((current) => current.map((item) => item.id === userId ? { ...item, ...data.user } : item));
      return data.user as AdminUser;
    } finally {
      setBusyUserId(null);
    }
  };

  const updateVerification = async (user: AdminUser) => {
    setMessage("");
    try {
      await patchUser(user.id, { emailVerified: !user.emailVerified });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update account");
    }
  };

  const openAccessDialog = (user: AdminUser) => {
    setAccessUser(user);
    setSelectedPages(user.accessiblePages);
    setAccessError("");
  };

  const togglePageAccess = (page: PageAccessHref) => {
    setSelectedPages((current) => current.includes(page)
      ? current.filter((item) => item !== page)
      : [...current, page]);
  };

  const savePageAccess = async () => {
    if (!accessUser || selectedPages.length === 0) return;
    setAccessError("");
    try {
      await patchUser(accessUser.id, { accessiblePages: selectedPages });
      setMessage(`Page access updated for ${accessUser.name || accessUser.username || accessUser.email}. Changes apply at the next sign-in.`);
      setAccessUser(null);
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Unable to update page access");
    }
  };

  const verifiedCount = users.filter((user) => user.emailVerified).length;
  const adminCount = users.filter((user) => user.role === "ADMIN").length;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {message && <p className="mb-4 text-red-600">{message}</p>}

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-5 shadow"><p className="text-sm text-gray-500">Total users</p><p className="mt-1 text-3xl font-bold text-gray-900">{users.length}</p></div>
          <div className="rounded-lg bg-green-50 p-5 shadow"><p className="text-sm text-green-700">Verified accounts</p><p className="mt-1 text-3xl font-bold text-green-900">{verifiedCount}</p></div>
          <div className="rounded-lg bg-purple-50 p-5 shadow"><p className="text-sm text-purple-700">Administrators</p><p className="mt-1 text-3xl font-bold text-purple-900">{adminCount}</p></div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-xl font-semibold text-gray-900">Registered users</h2>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users..." className="w-full rounded border border-gray-400 p-2 text-gray-900 placeholder:text-gray-500 sm:max-w-xs" />
          </div>
          {loading ? <p className="text-gray-600">Loading users...</p> : filteredUsers.length === 0 ? <p className="text-gray-600">No users found.</p> : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <article key={user.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-gray-900">{user.name || user.username || "Unnamed user"}</h3>
                      <p className="truncate text-sm text-gray-600">{user.email}</p>
                      <p className="mt-1 text-xs text-gray-500">{user.role} · {user._count.tasks} task{user._count.tasks === 1 ? "" : "s"} · Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${user.emailVerified ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>{user.emailVerified ? "Verified" : "Needs verification"}</span>
                      <button type="button" disabled={busyUserId === user.id} onClick={() => updateVerification(user)} className="rounded border border-gray-500 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">{busyUserId === user.id ? "Saving..." : user.emailVerified ? "Unverify" : "Verify account"}</button>
                      {user.role !== "ADMIN" ? (
                        <button type="button" onClick={() => openAccessDialog(user)} className="rounded border border-blue-700 bg-white px-3 py-2 text-sm font-medium text-blue-900 transition hover:bg-blue-50">
                          Manage access · {user.accessiblePages.length}
                        </button>
                      ) : <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">Full access</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {accessUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setAccessUser(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="page-access-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id="page-access-title" className="text-lg font-semibold text-gray-950">Page access</h2>
                <p className="mt-1 truncate text-sm text-gray-500">{accessUser.name || accessUser.username || accessUser.email}</p>
              </div>
              <button type="button" onClick={() => setAccessUser(null)} aria-label="Close page access dialog" title="Close" className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>
            <div className="px-5 py-4 sm:px-6">
              <p className="mb-3 text-sm text-gray-600">Choose which sidebar pages this user can open.</p>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {PAGE_ACCESS_OPTIONS.map(({ href, label }) => (
                  <label key={href} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-800">{label}</span>
                    <input type="checkbox" checked={selectedPages.includes(href)} onChange={() => togglePageAccess(href)} className="h-4 w-4 shrink-0 accent-blue-800" />
                  </label>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">{selectedPages.length} of {PAGE_ACCESS_OPTIONS.length} pages enabled</p>
                {selectedPages.length === 0 && <p className="text-xs font-medium text-amber-700">Select at least one page.</p>}
              </div>
              {accessError && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{accessError}</p>}
            </div>
            <footer className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 sm:px-6">
              <button type="button" onClick={() => setAccessUser(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={() => void savePageAccess()} disabled={busyUserId === accessUser.id || selectedPages.length === 0} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50">
                {busyUserId === accessUser.id ? "Saving..." : "Save access"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
