"use client";

import { useEffect } from "react";

export default function LoanToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onDismiss, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed right-4 top-4 z-[70] flex max-w-[calc(100vw-2rem)] items-center gap-4 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800 shadow-lg"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-xs font-semibold text-emerald-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
      >
        Dismiss
      </button>
    </div>
  );
}
