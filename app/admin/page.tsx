"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: number;
  username: string | null;
  name: string | null;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  _count: { tasks: number };
};

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

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

  const updateVerification = async (user: AdminUser) => {
    setBusyUserId(user.id);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerified: !user.emailVerified }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update account");
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? { ...item, emailVerified: data.user.emailVerified }
            : item
        )
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update account");
    } finally {
      setBusyUserId(null);
    }
  };

  const verifiedCount = users.filter((user) => user.emailVerified).length;
  const adminCount = users.filter((user) => user.role === "ADMIN").length;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-purple-600">HRDB-Lenard</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">Admin dashboard</h1>
            <p className="mt-2 text-gray-600">Manage user access and account verification.</p>
          </div>
          <Link href="/dashboard" className="rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100">
            User dashboard
          </Link>
        </header>

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
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
