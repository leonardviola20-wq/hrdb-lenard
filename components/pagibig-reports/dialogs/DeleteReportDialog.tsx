import { monthNames } from '@/components/pagibig-reports/shared/constants';
import type { Report } from '@/components/pagibig-reports/shared/types';

export function DeleteReportDialog({
  report,
  deleting,
  onCancel,
  onDelete,
}: {
  report: Report;
  deleting: boolean;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
      <section className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900">Delete Pag-IBIG Report?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">Delete the report for <strong>{report.employerName}</strong> covering <strong>{monthNames[report.applicableMonth - 1]} {report.applicableYear}</strong>? Its {report.entries.length} employee {report.entries.length === 1 ? "entry" : "entries"} and any recorded payment details will also be removed. This action cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={deleting} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onDelete} disabled={deleting} className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{deleting ? "Deleting..." : "Delete Report"}</button>
        </div>
      </section>
    </div>
  );
}
