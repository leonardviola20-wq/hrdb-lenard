export default function LoanReportPanelHeader({ id }: { id: string }) {
  return (
    <header className="page-header-surface shrink-0 border-b border-slate-200 px-5 py-4">
      <h2 id={id} className="text-lg font-bold text-slate-900">Generate Loan Report</h2>
      <p className="text-sm text-slate-600">Snapshot the selected loans as of an applicable date for later reference against actual payments.</p>
      <p className="mt-1 text-xs font-medium text-slate-600">Monthly edits apply to this report snapshot only; loan accounts are unchanged.</p>
    </header>
  );
}
