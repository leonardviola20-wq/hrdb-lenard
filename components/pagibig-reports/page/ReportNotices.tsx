"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * Notice banners shared by both views: the "select an employer" prompt,
 * error alerts, and transient success notices.
 */
export function ReportNotices({
  selectedEmployerId,
  error,
  notice,
  onDismissError,
  onDismissNotice,
}: {
  selectedEmployerId: string;
  error: string;
  notice: string;
  onDismissError: () => void;
  onDismissNotice: () => void;
}) {
  return (
    <>
      {!selectedEmployerId && <p role="status" className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Select an employer from the Reports dashboard to view Pag-IBIG records.</p>}
      {error && <div role="alert" className="benefit-report-notice benefit-report-notice-error shrink-0 flex items-center gap-2"><span>{error}</span><button type="button" onClick={onDismissError} aria-label="Dismiss error" className="shrink-0 rounded-md p-1 text-rose-800 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-600"><XMarkIcon className="h-4 w-4" /></button></div>}
      {notice && <div role="status" className="benefit-report-notice benefit-report-notice-success shrink-0"><span>{notice}</span><button type="button" onClick={onDismissNotice} aria-label="Dismiss confirmation" className="shrink-0 rounded-md p-1 text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"><XMarkIcon className="h-4 w-4" /></button></div>}
    </>
  );
}
