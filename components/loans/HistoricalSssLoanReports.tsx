"use client";

import { useMemo, useState } from "react";
import { EyeIcon } from "@heroicons/react/24/outline";
import type { HistoricalSssLoanReport } from "@/app/actions/loans";
import ScrollableListTable from "@/components/ScrollableListTable";
import HistoricalSssLoanReportDialog from "@/components/loans/HistoricalSssLoanReportDialog";
import HistoricalSssLoanPaymentsCompact from "@/components/loans/HistoricalSssLoanPaymentsCompact";
import {
  formatHistoricalSssMoney,
  formatHistoricalSssPeriod,
} from "@/components/loans/historicalSssReportFormat";

const filterClass = "h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900";

export default function HistoricalSssLoanReports({
  reports,
  variant = "reports",
  compact = false,
  className = "flex-1",
  initialEmployerFilter = "",
}: {
  reports: HistoricalSssLoanReport[];
  variant?: "reports" | "payments";
  compact?: boolean;
  className?: string;
  initialEmployerFilter?: string;
}) {
  const [employerFilter, setEmployerFilter] = useState(initialEmployerFilter);
  const [yearFilter, setYearFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState<HistoricalSssLoanReport | null>(null);
  const employers = useMemo(
    () => Array.from(new Set([...reports.map((report) => report.employerName), initialEmployerFilter].filter(Boolean)))
      .sort((a, b) => a.localeCompare(b)),
    [initialEmployerFilter, reports],
  );
  const years = useMemo(
    () => Array.from(new Set(reports.map((report) => report.applicableYear))).sort((a, b) => b - a),
    [reports],
  );
  const filteredReports = reports.filter((report) =>
    (!employerFilter || report.employerName === employerFilter) &&
    (!yearFilter || String(report.applicableYear) === yearFilter),
  );

  const isPaymentsView = variant === "payments";
  const title = isPaymentsView ? "Historical SSS Payments" : "Historical SSS Loan Reports";
  const headingId = isPaymentsView ? "historical-sss-payments-heading" : "historical-sss-reports-heading";

  return (
    <section aria-labelledby={headingId} className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <header className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id={headingId} className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-600">Original and imported historical reports · read-only · {reports.length} total</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-auto">
          <select aria-label="Filter historical reports by employer" value={employerFilter} onChange={(event) => setEmployerFilter(event.target.value)} className={filterClass}>
            <option value="">All Employers</option>
            {employers.map((employer) => <option key={employer} value={employer}>{employer}</option>)}
          </select>
          <select aria-label="Filter historical reports by year" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className={filterClass}>
            <option value="">All Years</option>
            {years.map((year) => <option key={year} value={String(year)}>{year}</option>)}
          </select>
        </div>
      </header>
      <p className="shrink-0 border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-900">
        {isPaymentsView && compact
          ? "Complete historical SSS payments · read-only."
          : isPaymentsView
            ? "Only reports with complete saved payment details are shown. Historical loan amounts and payment data remain read-only and separate from new loan snapshots."
            : "These entries preserve the original SSS report amounts and payment details. They are not editable loan-balance snapshots."}
      </p>
      {filteredReports.length === 0 ? (
        <p role="status" className="min-h-0 flex-1 px-4 py-10 text-center text-sm text-slate-600">
          {isPaymentsView ? "No historical SSS payments match these filters." : "No historical reports match these filters."}
        </p>
      ) : compact && isPaymentsView ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <HistoricalSssLoanPaymentsCompact reports={filteredReports} onView={setSelectedReport} />
        </div>
      ) : (
        <ScrollableListTable
          ariaLabel={title}
          className="min-h-0 flex-1"
          contentClassName={`text-left text-sm ${isPaymentsView ? "min-w-[1220px]" : "min-w-[960px]"}`}
          header={
            <div role="row" className={`grid border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-700 ${isPaymentsView ? "grid-cols-[1.7fr_1fr_0.7fr_1.1fr_1fr_1.1fr_0.8fr_1.1fr_0.6fr]" : "grid-cols-[1.7fr_1fr_0.7fr_1.1fr_1.3fr_0.9fr_0.6fr]"}`}>
              <div role="columnheader" className="px-4 py-3">Employer</div>
              <div role="columnheader" className="px-4 py-3">Period</div>
              <div role="columnheader" className="px-4 py-3 text-right">Entries</div>
              <div role="columnheader" className="px-4 py-3 text-right">{isPaymentsView ? "Amount Paid" : "Amount Due"}</div>
              {isPaymentsView && <div role="columnheader" className="px-4 py-3">Payment Branch</div>}
              <div role="columnheader" className="px-4 py-3">PRN</div>
              <div role="columnheader" className="px-4 py-3">Pay Date</div>
              {isPaymentsView && <div role="columnheader" className="px-4 py-3">Transaction Reference</div>}
              <div role="columnheader" className="px-4 py-3 text-right">Action</div>
            </div>
          }
          rowsClassName="divide-y divide-slate-100"
        >
          {filteredReports.map((report) => (
            <div key={`${report.sourceSystem}:${report.sourceReportId}`} role="row" className={`grid text-slate-900 ${isPaymentsView ? "grid-cols-[1.7fr_1fr_0.7fr_1.1fr_1fr_1.1fr_0.8fr_1.1fr_0.6fr]" : "grid-cols-[1.7fr_1fr_0.7fr_1.1fr_1.3fr_0.9fr_0.6fr]"}`}>
              <div role="cell" className="px-4 py-3 font-medium">{report.employerName}</div>
              <div role="cell" className="whitespace-nowrap px-4 py-3">{formatHistoricalSssPeriod(report.applicableMonth, report.applicableYear)}</div>
              <div role="cell" className="px-4 py-3 text-right tabular-nums">{report.entries.length}</div>
              <div role="cell" className="px-4 py-3 text-right tabular-nums">{formatHistoricalSssMoney(isPaymentsView ? report.amountPaid : report.amountDue)}</div>
              {isPaymentsView && <div role="cell" className="px-4 py-3">{report.sssBranch || "—"}</div>}
              <div role="cell" className="truncate px-4 py-3 font-mono text-xs">{report.prn || "—"}</div>
              <div role="cell" className="whitespace-nowrap px-4 py-3">{report.payDate || "—"}</div>
              {isPaymentsView && <div role="cell" className="truncate px-4 py-3 font-mono text-xs">{report.transactionReference || "—"}</div>}
              <div role="cell" className="px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  aria-label={`View ${formatHistoricalSssPeriod(report.applicableMonth, report.applicableYear)} historical SSS ${isPaymentsView ? "payment" : "report"}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <EyeIcon aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </ScrollableListTable>
      )}
      {selectedReport && <HistoricalSssLoanReportDialog report={selectedReport} onClose={() => setSelectedReport(null)} />}
    </section>
  );
}
