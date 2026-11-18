"use client";

import { PrinterIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { HistoricalSssLoanReport } from "@/app/actions/loans";
import {
  formatHistoricalSssMoney,
  formatHistoricalSssPeriod,
} from "@/components/loans/historicalSssReportFormat";

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-900">{value?.trim() || "—"}</dd>
    </div>
  );
}

function formatPrintAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function HistoricalSssLoanReportDialog({
  report,
  onClose,
}: {
  report: HistoricalSssLoanReport;
  onClose: () => void;
}) {
  if (report.sourceSystem === "imported") {
    return (
      <div
        id="sss-loan-report-print-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="historical-sss-report-title"
          className="sss-loan-report-print-dialog flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <header className="loan-report-preview-header page-header-surface sss-loan-report-print-header flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 id="historical-sss-report-title" className="text-lg font-bold text-slate-900">
                SSS Loan Report Preview
              </h2>
              <div className="loan-report-preview-employer sss-loan-report-print-employer mt-2 space-y-0.5 text-sm">
                <p className="font-semibold text-slate-900">
                  <span className="sss-loan-report-print-label">Employer Name: </span>{report.employerName}
                </p>
                <p className="text-slate-700">
                  <span className="sss-loan-report-print-label">SS Number: </span>{report.employerSssNumber || "—"}
                </p>
                <p className="text-slate-700">
                  <span className="sss-loan-report-print-label">Address: </span>{report.employerAddress || "—"}
                </p>
              </div>
            </div>
            <div className="loan-report-preview-actions flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <PrinterIcon aria-hidden="true" className="h-4 w-4" />
                Print
              </button>
            </div>
          </header>

          <div className="loan-report-print-content sss-loan-report-print-content min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="loan-report-preview-details sss-loan-report-print-details mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="loan-report-preview-detail sss-loan-report-print-month">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    <span className="sss-loan-report-screen-label">Applicable Month</span>
                    <span className="sss-loan-report-print-label">Applicable Month</span>
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">{formatHistoricalSssPeriod(report.applicableMonth, report.applicableYear)}</dd>
                </div>
                <div className="loan-report-preview-detail sss-loan-report-print-employees">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    <span className="sss-loan-report-screen-label">Number of Employees</span>
                    <span className="sss-loan-report-print-label">Emp</span>
                  </dt>
                  <dd className="mt-1 font-semibold tabular-nums text-slate-900">{report.entries.length}</dd>
                </div>
                <div className="loan-report-preview-detail sss-loan-report-print-prn">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    <span className="sss-loan-report-screen-label">PRN</span>
                    <span className="sss-loan-report-print-label">PRN</span>
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">{report.prn || "—"}</dd>
                </div>
                <div className="loan-report-preview-detail sss-loan-report-print-amount">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    <span className="sss-loan-report-screen-label">Amount Paid</span>
                    <span className="sss-loan-report-print-label">Amount Paid</span>
                  </dt>
                  <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                    <span className="sss-loan-report-screen-value">{formatHistoricalSssMoney(report.amountPaid)}</span>
                    <span className="sss-loan-report-print-value">{formatPrintAmount(report.amountPaid ?? "")}</span>
                  </dd>
                </div>
                <div className="loan-report-preview-detail sss-loan-report-print-branch">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    <span className="sss-loan-report-screen-label">Payment Branch</span>
                    <span className="sss-loan-report-print-label">Branch</span>
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">{report.sssBranch || "—"}</dd>
                </div>
                <div className="loan-report-preview-detail sss-loan-report-print-reference">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    <span className="sss-loan-report-screen-label">Trans Ref#</span>
                    <span className="sss-loan-report-print-label">Trans Ref#</span>
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">{report.transactionReference || "—"}</dd>
                </div>
              </dl>
            </div>

            <div className="loan-report-preview-table sss-loan-report-table overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-800">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3"><span className="sss-loan-report-screen-label">Loan Type</span><span className="sss-loan-report-print-label">Type</span></th>
                    <th className="px-4 py-3">No.</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.entries.map((entry) => (
                    <tr key={entry.id} className="text-slate-900">
                      <td className="px-4 py-3 font-medium text-slate-900">{entry.employeeName}</td>
                      <td className="px-4 py-3">—</td>
                      <td className="px-4 py-3 font-mono text-xs">{entry.loanAccountNumber || "—"}</td>
                      <td className="px-4 py-3">—</td>
                      <td className="px-4 py-3">—</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        <span className="sss-loan-report-screen-value">{formatHistoricalSssMoney(entry.loanAmountDue)}</span>
                        <span className="sss-loan-report-print-value">{formatPrintAmount(entry.loanAmountDue)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <footer className="loan-report-preview-footer sss-loan-report-print-footer shrink-0 border-t border-slate-200 px-5 py-3">
            <div className="loan-report-preview-totals flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-slate-900">
              <p>Total Amount Due: <span className="tabular-nums">{formatHistoricalSssMoney(report.amountDue)}</span></p>
            </div>
            <div className="sss-loan-report-print-total">
              <span>Total</span>
              <strong className="tabular-nums">{formatPrintAmount(report.amountDue)}</strong>
            </div>
            <div className="loan-report-preview-actions mt-3 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </footer>
        </section>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="historical-sss-report-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Historical SSS Loan Report · Read-only</p>
            <h2 id="historical-sss-report-title" className="mt-1 text-lg font-bold text-slate-900">
              {report.employerName} · {formatHistoricalSssPeriod(report.applicableMonth, report.applicableYear)}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Original saved report #{report.sourceReportId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close historical SSS loan report"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <XMarkIcon aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <dl className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Employer" value={report.employerName} />
            <Detail label="Employer SSS Number" value={report.employerSssNumber} />
            <Detail label="Employer Address" value={report.employerAddress} />
            <Detail label="Applicable Period" value={formatHistoricalSssPeriod(report.applicableMonth, report.applicableYear)} />
            <Detail label="PRN" value={report.prn} />
            <Detail label="Amount Due" value={formatHistoricalSssMoney(report.amountDue)} />
            <Detail label="Amount Paid" value={formatHistoricalSssMoney(report.amountPaid)} />
            <Detail label="Payment Type" value={report.paymentType} />
            <Detail label="Pay Date" value={report.payDate} />
            <Detail label="SSS Branch" value={report.sssBranch} />
            <Detail label="Transaction Reference" value={report.transactionReference} />
          </dl>

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-700">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">SS Number</th>
                  <th className="px-4 py-3">Loan Account Number</th>
                  <th className="px-4 py-3 text-right">Loan Amount Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{entry.employeeName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{entry.employeeSssNumber || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{entry.loanAccountNumber || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatHistoricalSssMoney(entry.loanAmountDue)}</td>
                  </tr>
                ))}
                {report.entries.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-600">This report has no saved loan entries.</td></tr>
                )}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <th colSpan={3} className="px-4 py-3 text-left font-semibold text-slate-800">Saved report amount due</th>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">{formatHistoricalSssMoney(report.amountDue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <footer className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
