"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { money, period } from "@/lib/philHealthReportHelpers";

type ReportEntry = { id: number; employeeId: number | null; employeeCode: string; employeeName: string; employeePhilHealthNumber: string | null; amount: string };
type Payment = { id: number; payorName: string; pen: string; spa: string | null; applicablePeriod: string; amountPaid: string; accreditedCollectingAgent: string | null; transactionConfirmationNumber: string | null; transactionDate: string; eparNumber: string | null; eparDate: string | null };
type Report = { id: number; employerName: string; employerPhicNumber: string | null; applicableMonth: number; applicableYear: number; amountDue: string; payment: Payment | null; entries: ReportEntry[] };

export function PhilHealthReportDetails({ report, canEditPayments, onClose, onPayment }: { report: Report; canEditPayments: boolean; onClose: () => void; onPayment: (report: Report) => void }) {
  const payment = report.payment;
  const paid = payment !== null;
  const amountPaid = Number(payment?.amountPaid ?? 0);
  const amountDue = Number(report.amountDue);
  const status = !paid ? "Unpaid" : amountPaid >= amountDue ? "Paid" : "Partial";
  const statusClass = !paid ? "bg-slate-100 text-slate-700" : amountPaid >= amountDue ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
  const entryTotal = report.entries.reduce((sum, entry) => sum + Number(entry.amount), 0);

  return (
    <div id="philhealth-report-print-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="philhealth-report-title" className="philhealth-report-print-dialog flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="philhealth-report-title" className="text-lg font-bold text-slate-900">PhilHealth Monthly Contribution Report</h2>
            <p className="text-sm text-slate-600">{period(report)} · {report.employerName}</p>
          </div>
          <div className="philhealth-report-interactive flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => window.print()} className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Print</button>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button>
          </div>
        </header>
        <div className="philhealth-report-print-content min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <article className="philhealth-report-card overflow-hidden rounded-xl border border-slate-200">
            <div className="border-b border-slate-200 bg-white p-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-950">{report.employerName}</h3>
                <p className="text-sm font-medium text-slate-600">PhilHealth Employer Number (PHIC): {report.employerPhicNumber || "—"}</p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applicable Period</p><p className="mt-0.5 text-base font-bold text-slate-950">{period(report)}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount Due</p><p className="mt-0.5 text-base font-bold tabular-nums text-slate-950">{money(report.amountDue)}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount Paid</p><p className="mt-0.5 text-base font-bold tabular-nums text-slate-950">{paid ? money(payment!.amountPaid) : "—"}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Status</p><p className="mt-1"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{status}</span></p></div>
              </div>
            </div>
            <div className="philhealth-report-print-table overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm text-slate-900">
                <thead><tr><th className="bg-slate-100 px-3 py-2 text-left">Employee</th><th className="bg-slate-100 px-3 py-2 text-right">PS</th><th className="bg-slate-100 px-3 py-2 text-right">ES</th><th className="bg-slate-100 px-3 py-2 text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {report.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-3 py-3 font-medium text-slate-900">{entry.employeeName}<div className="text-xs font-normal text-slate-600">{entry.employeePhilHealthNumber || "—"}</div></td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-900">{money(Number(entry.amount) / 2)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-950">{money(Number(entry.amount) / 2)}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-950">{money(entry.amount)}</td>
                    </tr>
                  ))}
                  {!report.entries.length && <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-600">This report has no employee entries.</td></tr>}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-950">
                  <tr>
                    <td colSpan={3} className="px-3 py-3">Total ({report.entries.length} {report.entries.length === 1 ? "employee" : "employees"})</td>
                    <td className="px-3 py-3 text-right tabular-nums">{money(entryTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="border-t border-slate-200 p-4">
              <h4 className="text-sm font-bold text-slate-900">Payment Details</h4>
              {paid && payment ? (
                <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                  {([
                    ["Payor Name", payment.payorName],
                    ["PEN (PhilHealth Employer Number)", payment.pen],
                    ["SPA", payment.spa || "—"],
                    ["Applicable Period", payment.applicablePeriod || "—"],
                    ["Amount Paid", money(payment.amountPaid)],
                    ["Accredited Collecting Agent", payment.accreditedCollectingAgent || "—"],
                    ["Transaction Confirmation No.", payment.transactionConfirmationNumber || "—"],
                    ["Transaction Date", payment.transactionDate || "—"],
                    ["ePAR No.", payment.eparNumber || "—"],
                    ["ePAR Date", payment.eparDate || "—"],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                      <dd className="mt-0.5 break-words font-medium text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No payment has been recorded for this report yet.</p>
              )}
            </div>
          </article>
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-slate-900">
            <span>Overall Amount Due: {money(report.amountDue)}</span>
            {paid && <span>Adjustments: {money(Math.max(0, amountPaid - amountDue))}</span>}
            {paid && <span>Total Paid: {money(amountPaid)}</span>}
          </div>
          <div className="philhealth-report-interactive flex gap-2">
            {(!paid || canEditPayments) && <button type="button" onClick={() => onPayment(report)} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">{paid ? "Update Payment" : "Record Payment"}</button>}
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
          </div>
        </footer>
      </section>
    </div>
  );
}