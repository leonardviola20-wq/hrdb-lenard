"use client";

import type { LoanReportRow } from "@/app/actions/loans";
import {
  formatLoanReportShortBillingMonth,
  formatLoanReportPaymentDate,
  getLoanReportEmployerName,
} from "@/lib/loanReportDisplay";
import ScrollableListTable from "@/components/ScrollableListTable";
import { peso } from "@/components/loans/shared/format";
import LoanReportActionsMenu from "./LoanReportActionsMenu";

type Props = {
  reports: LoanReportRow[];
  onView: (report: LoanReportRow) => void;
  onEdit?: (report: LoanReportRow) => void;
  onAddPayment: (report: LoanReportRow) => void;
  onDelete: (reportId: string) => Promise<void>;
  canManageReports: boolean;
  showEmployer: boolean;
  hideOutstanding: boolean;
  largePrn: boolean;
  standalone: boolean;
};

export default function LoanReportTable({
  reports,
  onView,
  onEdit,
  onAddPayment,
  onDelete,
  canManageReports,
  showEmployer,
  hideOutstanding,
  largePrn,
  standalone,
}: Props) {
  const columnClass = showEmployer
    ? hideOutstanding
      ? "grid-cols-[22fr_15fr_8fr_12fr_18fr_14fr_11fr]"
      : "grid-cols-[18fr_14fr_8fr_12fr_12fr_18fr_11fr_7fr]"
    : hideOutstanding
      ? "grid-cols-[20fr_10fr_14fr_24fr_17fr_15fr]"
      : "grid-cols-[18fr_8fr_13fr_13fr_22fr_14fr_12fr]";
  const minWidthClass = showEmployer
    ? hideOutstanding ? "min-w-[920px]" : "min-w-[1020px]"
    : hideOutstanding ? "min-w-[780px]" : "min-w-[880px]";

  return (
    <ScrollableListTable
      ariaLabel="Loan reports"
      className={`min-h-0 flex-1 ${standalone ? "" : "rounded-xl border border-slate-200 bg-white shadow-sm"}`}
      contentClassName={`${minWidthClass} text-left text-sm`}
      header={
        <div role="row" className={`grid ${columnClass} border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-800`}>
          {showEmployer && <div role="columnheader" className="px-4 py-3">Employer</div>}
          <div role="columnheader" className="px-4 py-3">Billing Month</div>
          <div role="columnheader" className="px-4 py-3 text-right">EMP</div>
          {!hideOutstanding && <div role="columnheader" className="px-4 py-3 text-right">Outstanding</div>}
          <div role="columnheader" className="px-4 py-3 text-right">Due</div>
          <div role="columnheader" className="px-4 py-3">PRN</div>
          <div role="columnheader" className="px-4 py-3">Pay Date</div>
          <div role="columnheader" className="px-4 py-3 text-right">Action</div>
        </div>
      }
      rowsClassName="divide-y divide-slate-100"
    >
      {reports.map((report) => (
        <div key={report.id} role="row" className={`grid ${columnClass} text-slate-900`}>
          {showEmployer && <div role="cell" className="px-4 py-3 font-medium text-slate-900">{getLoanReportEmployerName(report.entries, report.employerName)}</div>}
          <div role="cell" className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{formatLoanReportShortBillingMonth(report.applicableDate)}</div>
          <div role="cell" className="px-4 py-3 text-right tabular-nums">{report.loanCount}</div>
          {!hideOutstanding && <div role="cell" className="px-4 py-3 text-right tabular-nums">{peso(report.totalOutstanding)}</div>}
          <div role="cell" className="px-4 py-3 text-right tabular-nums">{peso(report.totalMonthly)}</div>
          <div role="cell" className={`px-4 py-3 font-mono ${largePrn ? "text-[13px]" : "text-xs"}`}>{report.prn || "—"}</div>
          <div role="cell" className="whitespace-nowrap px-4 py-3">{formatLoanReportPaymentDate(report.paymentDate)}</div>
          <div role="cell" className="px-4 py-3 text-right">
            <LoanReportActionsMenu
              report={report}
              onView={onView}
              onEdit={onEdit}
              onAddPayment={onAddPayment}
              onDelete={onDelete}
              canManageReports={canManageReports && !report.historicalSssReport}
            />
          </div>
        </div>
      ))}
    </ScrollableListTable>
  );
}
