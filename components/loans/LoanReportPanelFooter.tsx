import { peso } from "@/components/loans/shared/format";
import BackButton from "@/components/BackButton";

type Props = {
  selectedCount: number;
  totalMonthly: string | null;
  canSubmit: boolean;
  error: string;
  busy: boolean;
  hideBackButton: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

export default function LoanReportPanelFooter({
  selectedCount,
  totalMonthly,
  canSubmit,
  error,
  busy,
  hideBackButton,
  onBack,
  onSubmit,
}: Props) {
  return (
    <footer className="shrink-0 border-t border-slate-200 px-5 py-3">
      {error && <p role="alert" className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {selectedCount} selected · Monthly {totalMonthly === null ? "—" : peso(totalMonthly)}
        </p>
        <div className="flex gap-3">
          {!hideBackButton && (
            <BackButton onClick={onBack} disabled={busy} label="Back to Loan List" />
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || !canSubmit}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>
    </footer>
  );
}
