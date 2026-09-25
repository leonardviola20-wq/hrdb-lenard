"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  username: string | null;
  name: string | null;
  email: string;
  role: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load account");
        setUser(data.user);
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-blue-600">HRDB-Lenard</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-2 text-gray-600">View your account details and workspace access.</p>

        {error && <p className="mt-6 text-red-600">{error}</p>}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Account</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="mt-1 text-gray-900">{user?.name || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Username</dt>
              <dd className="mt-1 text-gray-900">{user?.username || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="mt-1 break-all text-gray-900">{user?.email || "Loading..."}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Role</dt>
              <dd className="mt-1 text-gray-900">{user?.role || "Loading..."}</dd>
            </div>
            </dl>
          </section>

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="group rounded-lg bg-[#172554] p-6 text-white shadow transition hover:-translate-y-0.5 hover:bg-blue-900 hover:shadow-md"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-300">Administration</p>
              <h2 className="mt-3 text-2xl font-bold">Admin Dashboard</h2>
              <p className="mt-2 text-sm text-blue-100">
                Manage user access, verification, and administrative accounts.
              </p>
              <span className="mt-6 inline-block text-sm font-semibold text-white group-hover:underline">
                Open admin dashboard →
              </span>
            </Link>
          )}
        </div>

        <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
