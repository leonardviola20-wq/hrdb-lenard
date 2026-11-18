"use client";

import type { LoanReportRow } from "@/app/actions/loans";
import LoanReportTable from "./LoanReportTable";

export default function LoanReportList({
  reports,
  onView,
  onEdit,
  onAddPayment,
  onDelete,
  canManageReports = true,
  onCreateReport,
  showEmployer = false,
  hideOutstanding = false,
  largePrn = false,
  standalone = false,
  emptyMessage = "No reports generated yet.",
  emptyDescription,
}: {
  reports: LoanReportRow[];
  onView: (report: LoanReportRow) => void;
  onEdit?: (report: LoanReportRow) => void;
  onAddPayment: (report: LoanReportRow) => void;
  onDelete: (reportId: string) => Promise<void>;
  canManageReports?: boolean;
  onCreateReport?: () => void;
  showEmployer?: boolean;
  hideOutstanding?: boolean;
  largePrn?: boolean;
  standalone?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
}) {
  if (reports.length === 0) {
    return (
      <div role="status" className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-700">
        <p>{emptyMessage}</p>
        {onCreateReport ? (
          <button
            type="button"
            onClick={onCreateReport}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Generate Report
          </button>
        ) : emptyDescription !== undefined ? (
          emptyDescription && <p className="mt-1">{emptyDescription}</p>
        ) : (
          <p className="mt-1">Use Generate Report from a provider loan page to create a snapshot.</p>
        )}
      </div>
    );
  }

  return (
    <LoanReportTable
      reports={reports}
      onView={onView}
      onEdit={onEdit}
      onAddPayment={onAddPayment}
      onDelete={onDelete}
      canManageReports={canManageReports}
      showEmployer={showEmployer}
      hideOutstanding={hideOutstanding}
      largePrn={largePrn}
      standalone={standalone}
    />
  );
}
