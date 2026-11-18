"use client";

import type { HistoricalSssLoanReport } from "@/app/actions/loans";
import {
  formatHistoricalSssMoney,
  formatHistoricalSssPeriod,
} from "@/components/loans/historicalSssReportFormat";

export default function HistoricalSssLoanPaymentsCompact({
  reports,
  onView,
}: {
  reports: HistoricalSssLoanReport[];
  onView: (report: HistoricalSssLoanReport) => void;
}) {
  return (
    <ul className="divide-y divide-slate-100">
      {reports.map((report) => (
        <li key={`${report.sourceSystem}:${report.sourceReportId}`} className="space-y-2 px-3 py-3 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{report.employerName}</p>
              <p className="text-slate-600">{formatHistoricalSssPeriod(report.applicableMonth, report.applicableYear)}</p>
            </div>
            <button
              type="button"
              onClick={() => onView(report)}
              aria-label={`View ${formatHistoricalSssPeriod(report.applicableMonth, report.applicableYear)} historical SSS payment`}
              className="shrink-0 rounded px-2 py-1 font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              View
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700">
            <div>
              <dt className="text-slate-500">Amount Paid</dt>
              <dd className="font-medium tabular-nums">{formatHistoricalSssMoney(report.amountPaid)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Pay Date</dt>
              <dd>{report.payDate}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Branch</dt>
              <dd className="truncate">{report.sssBranch}</dd>
            </div>
            <div>
              <dt className="text-slate-500">PRN</dt>
              <dd className="truncate font-mono">{report.prn}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Transaction Reference</dt>
              <dd className="truncate font-mono">{report.transactionReference}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
