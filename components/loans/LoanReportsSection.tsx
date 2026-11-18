"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { PlusIcon, PrinterIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { HistoricalSssLoanReport, LoanEmployee, LoanReportRow } from "@/app/actions/loans";
import {
  deleteLoanReport,
  updateLoanReportPaymentDetails,
} from "@/app/actions/loans";
import LoanReportList from "@/components/loans/LoanReportList";
import HistoricalSssLoanReportDialog from "@/components/loans/HistoricalSssLoanReportDialog";
import LoanReportSnapshotEditor from "@/components/loans/LoanReportSnapshotEditor";
import { peso } from "@/components/loans/shared/format";
import {
  formatLoanReportBillingMonth,
  getLoanReportPreviewTitle,
  isLoanReportPosted,
} from "@/lib/loanReportDisplay";

function getReportEmployers(report: LoanReportRow) {
  if (report.employerName?.trim()) {
    return [{
      name: report.employerName.trim(),
      sssNumber: report.employerSssNumber?.trim() || "—",
      address: report.employerAddress?.trim() || "Address not set",
    }];
  }
  return Array.from(
    new Map(
      report.entries
        .filter((entry) => entry.employerName.trim())
        .map((entry) => [
          `${entry.employerName.trim().toLocaleLowerCase()}\u0000${entry.employerSssNumber ?? ""}`,
          {
            name: entry.employerName.trim(),
            sssNumber: entry.employerSssNumber?.trim() || "—",
            address: entry.employerAddress?.trim() || "Address not set",
          },
        ]),
    ).values(),
  );
}

function formatLoanReportPrintDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatLoanReportPrintAmount(value: string | null | undefined) {
  if (!value) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatLoanReportPrintType(value: string) {
  const abbreviations: Record<string, string> = {
    Salary: "S",
    Calamity: "C",
    Emergency: "E",
  };
  return abbreviations[value] ?? value;
}

/** Saved loan reports list used by the dedicated /loans/reports page. */
export default function LoanReportsSection({
  reports,
  employees = [],
  title = "Generated Reports",
  description = "Saved snapshots of loans per applicable date, kept for reference against actual payment reports.",
  className = "min-w-0",
  onCreateReport,
  showEmployer = false,
  summaryProvider,
  hideOutstanding = false,
  hideOutstandingSummary = false,
  largePrn = false,
  hideHeaderWhenPopulated = false,
  canManageReports = true,
  canEditReports = true,
  emptyMessage,
  emptyDescription,
}: {
  reports: LoanReportRow[];
  employees?: LoanEmployee[];
  title?: string;
  description?: string;
  className?: string;
  onCreateReport?: () => void;
  showEmployer?: boolean;
  summaryProvider?: "SSS" | "PAGIBIG";
  hideOutstanding?: boolean;
  hideOutstandingSummary?: boolean;
  largePrn?: boolean;
  hideHeaderWhenPopulated?: boolean;
  canManageReports?: boolean;
  canEditReports?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
}) {
  const router = useRouter();
  const [viewingReport, setViewingReport] = useState<LoanReportRow | null>(null);
  const [viewingHistoricalReport, setViewingHistoricalReport] = useState<HistoricalSssLoanReport | null>(null);
  const [editingReport, setEditingReport] = useState<LoanReportRow | null>(null);
  const [payingReport, setPayingReport] = useState<LoanReportRow | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    amountPaid: "",
    paymentBranch: "",
    paymentDate: "",
    transactionReference: "",
    prn: "",
  });
  const [isSavingPaymentDetails, setIsSavingPaymentDetails] = useState(false);
  const [paymentDetailsError, setPaymentDetailsError] = useState("");

  const openPaymentDetails = (report: LoanReportRow) => {
    setPayingReport(report);
    setPaymentDetails({
      amountPaid:
        typeof report.amountPaid === "string" && /^\d+(?:\.\d{1,2})?$/.test(report.amountPaid)
          ? report.amountPaid
          : "",
      paymentBranch: report.paymentBranch ?? "",
      paymentDate: report.paymentDate ?? "",
      transactionReference: report.transactionReference ?? "",
      prn: report.prn ?? "",
    });
    setPaymentDetailsError("");
  };

  const savePaymentDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!payingReport) return;

    setPaymentDetailsError("");
    const requiredFields: [keyof typeof paymentDetails, string][] = [
      ["amountPaid", "Amount Paid"],
      ["paymentBranch", "Payment Branch"],
      ["paymentDate", "Pay Date"],
      ["transactionReference", "Trans Ref#"],
      ["prn", "PRN"],
    ];
    const missingField = requiredFields.find(([field]) => !paymentDetails[field].trim());
    if (missingField) {
      setPaymentDetailsError(`${missingField[1]} is required.`);
      return;
    }

    setIsSavingPaymentDetails(true);
    try {
      await updateLoanReportPaymentDetails(payingReport.id, paymentDetails);
      setPayingReport(null);
      router.refresh();
    } catch (error) {
      setPaymentDetailsError(
        error instanceof Error ? error.message : "Unable to update report payment details.",
      );
    } finally {
      setIsSavingPaymentDetails(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    await deleteLoanReport(reportId);
    setViewingReport((current) => (current && current.id === reportId ? null : current));
    router.refresh();
  };
  const handleViewReport = (report: LoanReportRow) => {
    if (report.historicalSssReport) {
      setViewingHistoricalReport(report.historicalSssReport);
      return;
    }
    setViewingReport(report);
  };
  const providerTotals = reports.reduce(
    (totals, report) => {
      if (report.historicalSssReport) {
        totals.SSS.count += report.entries.length;
        return totals;
      }
      report.entries.forEach((entry) => {
        const provider = entry.provider === "PAGIBIG" ? "PAGIBIG" : entry.provider === "SSS" ? "SSS" : null;
        if (!provider) return;
        totals[provider].count += 1;
        totals[provider].monthly += Number(entry.monthlyAmortization || 0);
        totals[provider].outstanding += Number(entry.outstandingBalance || 0);
      });
      return totals;
    },
    {
      SSS: { count: 0, monthly: 0, outstanding: 0 },
      PAGIBIG: { count: 0, monthly: 0, outstanding: 0 },
    },
  );
  const paymentEmployers = payingReport ? getReportEmployers(payingReport) : [];
  const viewingEmployers = viewingReport ? getReportEmployers(viewingReport) : [];
  const isSssPreview = Boolean(
    viewingReport &&
    viewingReport.entries.length > 0 &&
    viewingReport.entries.every((entry) => entry.provider === "SSS"),
  );
  const isPostedReport = viewingReport ? isLoanReportPosted(viewingReport) : false;
  const hasTransactionReference = Boolean(viewingReport?.transactionReference?.trim());
  const amountPaid =
    viewingReport?.amountPaid && /^\d+(?:\.\d{1,2})?$/.test(viewingReport.amountPaid)
      ? peso(viewingReport.amountPaid)
      : "—";

  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      {!(hideHeaderWhenPopulated && reports.length > 0) && (
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      )}
      {hideHeaderWhenPopulated && reports.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {onCreateReport && (
              <button
                type="button"
                onClick={onCreateReport}
                aria-label="Generate loan report"
                title="Generate loan report"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <PlusIcon aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-700">
            Showing {reports.length} report{reports.length === 1 ? "" : "s"}
          </span>
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <LoanReportList
            reports={reports}
            onView={handleViewReport}
            onAddPayment={openPaymentDetails}
            onEdit={canEditReports ? setEditingReport : undefined}
            onDelete={handleDeleteReport}
            canManageReports={canManageReports}
            onCreateReport={onCreateReport}
            showEmployer={showEmployer}
            hideOutstanding={hideOutstanding}
            largePrn={largePrn}
            standalone={hideHeaderWhenPopulated && reports.length > 0}
            emptyMessage={emptyMessage}
            emptyDescription={emptyDescription}
          />
        </div>
        {hideHeaderWhenPopulated && reports.length > 0 && (
          <footer className="grid shrink-0 gap-3 border-t border-slate-200 bg-white px-4 py-3 text-xs sm:grid-cols-2">
            {(summaryProvider ? [summaryProvider] : ["SSS", "PAGIBIG"] as const).map((provider) => {
              const totals = providerTotals[provider];
              const providerLabel = provider === "PAGIBIG" ? "Pag-IBIG" : "SSS";
              return (
                <div key={provider} className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {providerLabel} · {totals.count} loan {totals.count === 1 ? "entry" : "entries"}
                  </p>
                  <p className="mt-1 text-slate-700">
                    Monthly {peso(totals.monthly)}
                    {!hideOutstandingSummary && ` · Outstanding ${peso(totals.outstanding)}`}
                  </p>
                </div>
              );
            })}
          </footer>
        )}
      </div>

      {viewingHistoricalReport && (
        <HistoricalSssLoanReportDialog
          report={viewingHistoricalReport}
          onClose={() => setViewingHistoricalReport(null)}
        />
      )}
      {viewingReport && (
        <div
          id="loan-report-print-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewingReport(null);
          }}
        >
          <div className={`loan-report-print-dialog flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${isSssPreview ? "sss-loan-report-print-dialog" : ""} ${isSssPreview && isPostedReport && hasTransactionReference ? "sss-loan-report-posted-has-reference" : ""}`}>
            <header className={`loan-report-preview-header page-header-surface flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 ${isSssPreview ? "sss-loan-report-print-header" : ""}`}>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {getLoanReportPreviewTitle(viewingReport.entries)}
                </h2>
                <div className="mt-2 space-y-1 text-sm">
                  {viewingEmployers.length > 0 ? viewingEmployers.map((employer) => (
                    <div key={`${employer.name}-${employer.sssNumber}`} className={`loan-report-preview-employer space-y-0.5 ${isSssPreview ? "sss-loan-report-print-employer" : ""}`}>
                      <p className="font-semibold text-slate-900"><span className="sss-loan-report-print-label">Employer Name: </span>{employer.name}</p>
                      <p className="text-slate-700"><span className="sss-loan-report-print-label">SS Number: </span>{employer.sssNumber}</p>
                      <p className="text-slate-700"><span className="sss-loan-report-print-label">Address: </span>{employer.address}</p>
                    </div>
                  )) : (
                    <p className="text-slate-700">Employer information is unavailable.</p>
                  )}
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
            <div className={`loan-report-print-content min-h-0 flex-1 overflow-y-auto px-5 py-4 ${isSssPreview ? "sss-loan-report-print-content" : ""}`}>
              <div className={`loan-report-preview-details mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 ${isSssPreview ? "sss-loan-report-print-details" : ""} ${isSssPreview && isPostedReport && !hasTransactionReference ? "sss-loan-report-print-no-reference" : ""}`}>
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="loan-report-preview-detail sss-loan-report-print-month">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700"><span className="sss-loan-report-screen-label">Applicable Month</span><span className="sss-loan-report-print-label">Applicable Month</span></dt>
                    <dd className="mt-1 font-semibold text-slate-900">{formatLoanReportBillingMonth(viewingReport.applicableDate)}</dd>
                  </div>
                  <div className="loan-report-preview-detail sss-loan-report-print-employees">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700"><span className="sss-loan-report-screen-label">Number of Employees</span><span className="sss-loan-report-print-label">Emp</span></dt>
                    <dd className="mt-1 font-semibold tabular-nums text-slate-900">{viewingReport.entries.length}</dd>
                  </div>
                  <div className="loan-report-preview-detail sss-loan-report-print-prn">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700"><span className="sss-loan-report-screen-label">PRN</span><span className="sss-loan-report-print-label">PRN</span></dt>
                    <dd className="mt-1 font-semibold text-slate-900">{viewingReport.prn || "—"}</dd>
                  </div>
                  <div className="loan-report-preview-detail sss-loan-report-print-amount">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700"><span className="sss-loan-report-screen-label">Amount Paid</span><span className="sss-loan-report-print-label">Amount Paid</span></dt>
                    <dd className="mt-1 font-semibold tabular-nums text-slate-900"><span className="sss-loan-report-screen-value">{amountPaid}</span><span className="sss-loan-report-print-value">{formatLoanReportPrintAmount(viewingReport.amountPaid)}</span></dd>
                  </div>
                  <div className="loan-report-preview-detail sss-loan-report-print-branch">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700"><span className="sss-loan-report-screen-label">Payment Branch</span><span className="sss-loan-report-print-label">Branch</span></dt>
                    <dd className="mt-1 font-semibold text-slate-900">{viewingReport.paymentBranch || "—"}</dd>
                  </div>
                  <div className="loan-report-preview-detail sss-loan-report-print-reference">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700"><span className="sss-loan-report-screen-label">Trans Ref#</span><span className="sss-loan-report-print-label">Trans Ref#</span></dt>
                    <dd className="mt-1 font-semibold text-slate-900">{viewingReport.transactionReference || "—"}</dd>
                  </div>
                </dl>
              </div>
              <div className={`loan-report-preview-table overflow-x-auto rounded-xl border border-slate-200 ${isSssPreview ? "sss-loan-report-table" : ""}`}>
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
                    {viewingReport.entries.map((entry) => (
                      <tr key={entry.id} className="text-slate-900">
                        <td className="px-4 py-3 font-medium text-slate-900">{entry.employeeName}</td>
                        <td className="px-4 py-3"><span className="sss-loan-report-screen-value">{entry.loanType}</span><span className="sss-loan-report-print-value">{formatLoanReportPrintType(entry.loanType)}</span></td>
                        <td className="px-4 py-3 font-mono text-xs">{entry.loanAccountNumber}</td>
                        <td className="px-4 py-3"><span className="sss-loan-report-screen-value">{entry.loanDate ?? "—"}</span><span className="sss-loan-report-print-value">{formatLoanReportPrintDate(entry.loanDate)}</span></td>
                        <td className="px-4 py-3">{entry.status === "INACTIVE" ? `Inactive${entry.statusReason ? ` — ${entry.statusReason}` : ""}` : "Active"}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums"><span className="sss-loan-report-screen-value">{peso(entry.monthlyAmortization)}</span><span className="sss-loan-report-print-value">{formatLoanReportPrintAmount(entry.monthlyAmortization)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <footer className={`loan-report-preview-footer shrink-0 border-t border-slate-200 px-5 py-3 ${isSssPreview ? "sss-loan-report-print-footer" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="loan-report-preview-totals flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-slate-900">
                  <p>Total Amount Due: <span className="tabular-nums">{peso(viewingReport.totalMonthly)}</span></p>
                </div>
                <p className="loan-report-preview-created text-xs text-slate-500">
                  Created {new Date(viewingReport.createdAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
                  {viewingReport.createdBy ? ` by ${viewingReport.createdBy}` : ""}
                </p>
              </div>
              <div className="sss-loan-report-print-total">
                <span>Total</span>
                <strong className="tabular-nums">{formatLoanReportPrintAmount(viewingReport.totalMonthly)}</strong>
              </div>
              <div className="loan-report-preview-actions mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingReport(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {payingReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingPaymentDetails) setPayingReport(null);
          }}
        >
          <form
            onSubmit={savePaymentDetails}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="loan-report-payment-title"
          >
            <header className="page-header-surface flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <h2 id="loan-report-payment-title" className="text-lg font-bold text-slate-900">
                  Employer Loans Payment
                </h2>
                <div className="mt-2 space-y-1 text-sm">
                  {paymentEmployers.length > 0 ? paymentEmployers.map((employer) => (
                    <div key={`${employer.name}-${employer.sssNumber}`} className="space-y-0.5">
                      <p className="font-semibold text-slate-900">{employer.name}</p>
                      <p className="text-slate-700">{employer.sssNumber}</p>
                      <p className="text-slate-700">{employer.address}</p>
                    </div>
                  )) : (
                    <p className="text-slate-700">Employer information is unavailable.</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayingReport(null)}
                disabled={isSavingPaymentDetails}
                aria-label="Close"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>
            <div className="min-h-0 space-y-4 overflow-y-auto px-5 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-800">
                  Amount Paid
                  <input
                    type="text"
                    inputMode="decimal"
                    maxLength={15}
                    required
                    value={paymentDetails.amountPaid}
                    onChange={(event) => setPaymentDetails((current) => ({ ...current, amountPaid: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-800">
                  Payment Branch
                  <input
                    type="text"
                    maxLength={200}
                    required
                    value={paymentDetails.paymentBranch}
                    onChange={(event) => setPaymentDetails((current) => ({ ...current, paymentBranch: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-800">
                  Pay Date
                  <input
                    type="date"
                    required
                    value={paymentDetails.paymentDate}
                    onChange={(event) => setPaymentDetails((current) => ({ ...current, paymentDate: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-800">
                  Trans Ref#
                  <input
                    type="text"
                    maxLength={100}
                    required
                    value={paymentDetails.transactionReference}
                    onChange={(event) => setPaymentDetails((current) => ({ ...current, transactionReference: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-800">
                  PRN
                  <input
                    type="text"
                    maxLength={100}
                    required
                    value={paymentDetails.prn}
                    onChange={(event) => setPaymentDetails((current) => ({ ...current, prn: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-800">
                  Applicable Month
                  <input
                    type="text"
                    value={formatLoanReportBillingMonth(payingReport.applicableDate)}
                    readOnly
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-normal text-slate-700 outline-none"
                  />
                </label>
              </div>
              {paymentDetailsError && (
                <p role="alert" className="text-sm font-medium text-rose-700">{paymentDetailsError}</p>
              )}
            </div>
            <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setPayingReport(null)}
                disabled={isSavingPaymentDetails}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPaymentDetails}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingPaymentDetails ? "Saving..." : "Save"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {editingReport && (
        <LoanReportSnapshotEditor
          key={editingReport.id}
          report={editingReport}
          employees={employees}
          onClose={() => setEditingReport(null)}
          onSaved={() => {
            setEditingReport(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
