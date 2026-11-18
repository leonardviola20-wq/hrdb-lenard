import { peso } from "@/components/loans/shared/format";

type Props = {
  entryCount: number;
  totalMonthly: string | null;
  totalOutstanding: number;
  error: string;
  isSaving: boolean;
  onClose: () => void;
};

export default function LoanReportSnapshotFooter({
  entryCount,
  totalMonthly,
  totalOutstanding,
  error,
  isSaving,
  onClose,
}: Props) {
  return (
    <footer className="shrink-0 border-t border-slate-200 px-5 py-3">
      {error && <p role="alert" className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {entryCount} entries · Monthly {totalMonthly === null ? "—" : peso(totalMonthly)} · Outstanding {peso(totalOutstanding)}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </footer>
  );
}
