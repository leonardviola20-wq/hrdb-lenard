"use client";

import type { Report } from "@/components/philhealth-reports/types";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { period } from "@/components/philhealth-reports/format";

type DeleteReportDialogProps = {
  open: boolean;
  report: Report | null;
  saving: boolean;
  onClose: () => void;
  onDelete: () => void;
};

export function DeleteReportDialog({ open, report, saving, onClose, onDelete }: DeleteReportDialogProps) {
  if (!open || !report) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900">Delete PhilHealth report?</h2>
        <p className="mt-2 text-sm text-slate-600">This will permanently delete the {period(report)} report and its payment details. This action cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button>
          <button type="button" onClick={onDelete} disabled={saving} className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Deleting..." : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}
