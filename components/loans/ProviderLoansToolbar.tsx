"use client";

import Link from "next/link";
import { ArchiveBoxIcon, DocumentChartBarIcon, PlusIcon } from "@heroicons/react/24/outline";
import BackButton from "@/components/BackButton";

type Props = {
  addDisabled: boolean;
  reportsDisabled: boolean;
  showBack?: boolean;
  showLoanActions?: boolean;
  showGeneratedReports?: boolean;
  showBackToLoanList?: boolean;
  historicalReportsCount?: number;
  onAddLoan: () => void;
  onOpenReports: () => void;
  onOpenHistoricalReports?: () => void;
  onBackToLoanList?: () => void;
};

export default function ProviderLoansToolbar({
  addDisabled,
  reportsDisabled,
  showBack = true,
  showLoanActions = true,
  showGeneratedReports = true,
  showBackToLoanList = false,
  historicalReportsCount,
  onAddLoan,
  onOpenReports,
  onOpenHistoricalReports,
  onBackToLoanList,
}: Props) {
  return (
    <>
      {showBack && (
        <BackButton fallbackHref="/loans" label="Back to Loans Monitoring" />
      )}
      {showBackToLoanList && onBackToLoanList && (
        <BackButton onClick={onBackToLoanList} label="Back to Loan List" />
      )}
      {showLoanActions && (
        <>
          <button
            type="button"
            onClick={onAddLoan}
            disabled={addDisabled}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon aria-hidden="true" className="h-4 w-4" />
            Add Loan
          </button>
          <button
            type="button"
            onClick={onOpenReports}
            disabled={reportsDisabled}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <DocumentChartBarIcon aria-hidden="true" className="h-4 w-4" />
            Generate Report
          </button>
          {historicalReportsCount !== undefined && historicalReportsCount > 0 && onOpenHistoricalReports && (
            <button
              type="button"
              onClick={onOpenHistoricalReports}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArchiveBoxIcon aria-hidden="true" className="h-4 w-4" />
              Historical SSS Reports ({historicalReportsCount})
            </button>
          )}
        </>
      )}
      {showGeneratedReports && (
        <Link
          href="/loans/reports"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          <DocumentChartBarIcon aria-hidden="true" className="h-4 w-4" />
          Generated Reports
        </Link>
      )}
    </>
  );
}
