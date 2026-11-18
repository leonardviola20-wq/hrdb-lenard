"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SessionExpiredDialog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const hasExpiredSession = searchParams.get("reason") === "session-expired";
  if (!hasExpiredSession || dismissed) return null;
  const dismiss = () => {
    setDismissed(true);
    router.replace("/login", { scroll: false });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="session-expired-title" className="text-lg font-bold text-slate-900">
              You have been logged out
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Your one-hour sign-in session has expired. Please sign in again to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close session-expired message"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            <XMarkIcon aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Continue to sign in
          </button>
        </div>
      </section>
    </div>
  );
}
