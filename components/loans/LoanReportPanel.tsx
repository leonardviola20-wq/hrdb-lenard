"use client";

import { useId } from "react";
import type { GenerateLoanReportInput, LoanReportRow, LoanRow } from "@/app/actions/loans";
import LoanReportPanelControls from "@/components/loans/LoanReportPanelControls";
import LoanReportPanelFooter from "@/components/loans/LoanReportPanelFooter";
import LoanReportPanelHeader from "@/components/loans/LoanReportPanelHeader";
import LoanReportSelectionTable from "@/components/loans/LoanReportSelectionTable";
import useLoanReportPanel from "@/components/loans/useLoanReportPanel";

type Props = {
  provider?: LoanRow["provider"];
  loans: LoanRow[];
  employers: { id: number; name: string }[];
  previousReports: LoanReportRow[];
  initialEmployerId?: string;
  onClose: () => void;
  onGenerate: (
    employerId: number,
    applicableDate: string,
    entries: GenerateLoanReportInput["entries"],
  ) => Promise<void>;
  className?: string;
  fillAvailableHeight?: boolean;
  hideFooterBackButton?: boolean;
};

export default function LoanReportPanel({
  provider,
  loans,
  employers,
  previousReports,
  initialEmployerId,
  onClose,
  onGenerate,
  className = "",
  fillAvailableHeight = false,
  hideFooterBackButton = false,
}: Props) {
  const idPrefix = useId();
  const reportProvider = provider ?? loans[0]?.provider ?? "SSS";
  const state = useLoanReportPanel({
    provider: reportProvider,
    loans,
    employers,
    previousReports,
    initialEmployerId,
    onGenerate,
  });

  return (
    <section
      aria-labelledby={`${idPrefix}-heading`}
      className={`flex ${fillAvailableHeight ? "min-h-0" : "min-h-[480px]"} min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <LoanReportPanelHeader id={`${idPrefix}-heading`} />
      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        <LoanReportPanelControls
          idPrefix={idPrefix}
          provider={reportProvider}
          employers={employers}
          employerId={state.employerId}
          busy={state.busy}
          hasPreviousReport={state.hasPreviousReport}
          occupiedMonths={state.occupiedMonths}
          selectedEmployerName={state.selectedEmployerName}
          duplicateMonth={state.duplicateMonth}
          month={state.month}
          year={state.year}
          yearOptions={state.yearOptions}
          search={state.search}
          onEmployerChange={state.changeEmployer}
          onLoadPrevious={state.loadPreviousReport}
          onMonthChange={state.setMonth}
          onYearChange={state.setYear}
          onSearchChange={state.setSearch}
        />
        <LoanReportSelectionTable
          filtered={state.filtered}
          selected={state.selected}
          setSelected={state.setSelected}
          monthlyAmounts={state.monthlyAmounts}
          setMonthlyAmounts={state.setMonthlyAmounts}
          focusedMonthlyLoanId={state.focusedMonthlyLoanId}
          setFocusedMonthlyLoanId={state.setFocusedMonthlyLoanId}
          busy={state.busy}
          selectionDisabled={!state.employerId}
        />
      </div>
      <LoanReportPanelFooter
        selectedCount={state.selectedCount}
        totalMonthly={state.totalMonthly}
        canSubmit={Boolean(state.employerId && state.selectedCount > 0 && !state.duplicateMonth)}
        error={state.error}
        busy={state.busy}
        hideBackButton={hideFooterBackButton}
        onBack={onClose}
        onSubmit={state.submit}
      />
    </section>
  );
}
