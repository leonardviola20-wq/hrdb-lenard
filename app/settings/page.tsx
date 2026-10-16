"use client";

import Link from "next/link";
import { ArrowUpRightIcon, EyeIcon, EyeSlashIcon, KeyIcon, ShieldCheckIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

const fieldClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

type User = {
  username: string | null;
  name: string | null;
  email: string;
  role: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameMessage, setNameMessage] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordVisibility, setPasswordVisibility] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load account");
        setUser(data.user);
        setDisplayName(data.user.name || "");
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, []);

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNameError("");
    setNameMessage("");
    setSavingName(true);

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save name");
      setUser(data.user);
      setDisplayName(data.user.name || "");
      setNameMessage("Name updated.");
      window.dispatchEvent(new Event("hrdb-profile-updated"));
    } catch (saveError) {
      setNameError(saveError instanceof Error ? saveError.message : "Unable to save name");
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    setChangingPassword(true);

    try {
      const response = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to change password");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage(data.message || "Password changed successfully");
    } catch (changeError) {
      setPasswordError(changeError instanceof Error ? changeError.message : "Unable to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <main className="min-h-[calc(100dvh-5rem)] bg-gradient-to-b from-slate-50 to-slate-100/70 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Account center</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Profile &amp; security</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">Manage your personal details, sign-in credentials, and workspace access.</p>
          </div>
          {user && <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800">
              <UserCircleIcon className="h-7 w-7" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900">{user.name || user.username || "Your account"}</span>
              <span className="block truncate text-xs text-slate-500">{user.email}</span>
            </span>
            <span className="ml-2 hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
              <ShieldCheckIcon className="h-4 w-4" /> {user.role}
            </span>
          </div>}
        </header>

        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

        <div className="grid items-stretch gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800 ring-1 ring-blue-100">
                <UserCircleIcon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Profile</h3>
                <p className="mt-0.5 text-sm text-slate-500">Your name and account details</p>
              </div>
            </div>

            <form onSubmit={saveName} className="space-y-3">
              <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                <span>Display name</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    autoComplete="name"
                    maxLength={80}
                    required
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Enter your name"
                    className={fieldClass}
                  />
                  <button type="submit" disabled={savingName || !user || displayName.trim() === (user.name || "")} className="shrink-0 rounded-lg bg-[#172554] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    {savingName ? "Saving..." : "Save name"}
                  </button>
                </div>
              </label>
              {nameError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{nameError}</p>}
              {nameMessage && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{nameMessage}</p>}
            </form>

            <dl className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl bg-slate-50 p-3.5">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Username</dt>
                <dd className="mt-1 truncate text-sm font-semibold text-slate-900">{user?.username || "Not set"}</dd>
              </div>
              <div className="min-w-0 rounded-xl bg-slate-50 p-3.5">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Role</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{user?.role || "Loading..."}</dd>
              </div>
              <div className="min-w-0 rounded-xl bg-slate-50 p-3.5 sm:col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email address</dt>
                <dd className="mt-1 break-all text-sm font-semibold text-slate-900">{user?.email || "Loading..."}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100">
                <KeyIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Password</h3>
                <p className="mt-0.5 text-sm text-slate-500">Update your sign-in credentials</p>
              </div>
            </div>

            <form onSubmit={changePassword} className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                <span>Current password</span>
                <span className="relative block">
                  <input type={passwordVisibility.currentPassword ? "text" : "password"} autoComplete="current-password" required value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} className={`${fieldClass} pr-11`} />
                  <button type="button" onClick={() => setPasswordVisibility((current) => ({ ...current, currentPassword: !current.currentPassword }))} aria-label={passwordVisibility.currentPassword ? "Hide current password" : "Show current password"} aria-pressed={passwordVisibility.currentPassword} title={passwordVisibility.currentPassword ? "Hide password" : "Show password"} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300">
                    {passwordVisibility.currentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                  <span>New password</span>
                  <span className="relative block">
                    <input type={passwordVisibility.newPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={72} required value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} className={`${fieldClass} pr-11`} />
                    <button type="button" onClick={() => setPasswordVisibility((current) => ({ ...current, newPassword: !current.newPassword }))} aria-label={passwordVisibility.newPassword ? "Hide new password" : "Show new password"} aria-pressed={passwordVisibility.newPassword} title={passwordVisibility.newPassword ? "Hide password" : "Show password"} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300">
                      {passwordVisibility.newPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </span>
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                  <span>Confirm new password</span>
                  <span className="relative block">
                    <input type={passwordVisibility.confirmPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={72} required value={passwords.confirmPassword} onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))} className={`${fieldClass} pr-11`} />
                    <button type="button" onClick={() => setPasswordVisibility((current) => ({ ...current, confirmPassword: !current.confirmPassword }))} aria-label={passwordVisibility.confirmPassword ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={passwordVisibility.confirmPassword} title={passwordVisibility.confirmPassword ? "Hide password" : "Show password"} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300">
                      {passwordVisibility.confirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </span>
                </label>
              </div>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">Use at least 8 characters, including an uppercase letter, a number, and a special character.</p>
              {passwordError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{passwordError}</p>}
              {passwordMessage && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{passwordMessage}</p>}
              <button type="submit" disabled={changingPassword} className="w-fit rounded-lg bg-[#172554] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                {changingPassword ? "Updating..." : "Change password"}
              </button>
            </form>
          </section>
        </div>

        {user?.role === "ADMIN" && (
          <Link href="/admin" className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <span>
              <span className="block text-sm font-bold">Administration</span>
              <span className="mt-1 block text-sm text-slate-500">Manage users and workspace access</span>
            </span>
            <ArrowUpRightIcon className="h-5 w-5 shrink-0 text-blue-800" />
          </Link>
        )}

      </div>
    </main>
  );
}
