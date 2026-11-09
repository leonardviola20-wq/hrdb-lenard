"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { monthNames } from "./constants";
import { formatMoney } from "./format";
import type { Report } from "./types";

function ReportDetails({ report, onClose, onPayment, employerAddress }: { report: Report; onClose: () => void; onPayment: (report: Report) => void; employerAddress?: string | null }) {
  const totalSavings = report.entries.reduce((sum, entry) => sum + Number(entry.employeeSavings) + Number(entry.employerSavings), 0);
  const totalMp2 = report.entries.reduce((sum, entry) => sum + Number(entry.mp2Amount), 0);
  const totalLoans = report.entries.reduce((sum, entry) => sum + Number(entry.calamityLoanAmount) + Number(entry.mplLoanAmount) + Number(entry.emergencyLoanAmount) + Number(entry.safeLoanAmount), 0);
  const paid = report.amountPaid !== null && report.payDate !== null;
  const [loansExpanded, setLoansExpanded] = useState(false);
  const showSavingsColumns = !report.manual || report.kind == "CONTRIBUTION";
  const showLoanColumns = !report.manual || report.kind == "LOAN";
  return (
    <div id="pagibig-report-print-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="pagibig-report-title" className="pagibig-report-print-dialog flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0 space-y-0.5">
            <h2 id="pagibig-report-title" className="text-xl font-bold text-slate-900">{report.employerName}</h2>
            <p className="text-sm font-normal text-slate-900">{report.employerPagibigNumber || "-"}</p>
            <p className="text-sm font-normal text-slate-900">{employerAddress || report.employerAddress || "Address not set"}</p>
          </div>
          <div className="pagibig-report-interactive ml-3 flex shrink-0 items-center gap-2">
            {showLoanColumns && (<button type="button" onClick={() => setLoansExpanded((current) => !current)} aria-expanded={loansExpanded} aria-label={loansExpanded ? "Collapse loan columns" : "Expand loan columns"} title={loansExpanded ? "Collapse loan columns" : "Expand loan columns"} className="h-9 inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-900 hover:bg-amber-100">{loansExpanded ? <><ChevronLeftIcon className="h-4 w-4" /> Collapse</> : <><ChevronRightIcon className="h-4 w-4" /> Expand</>}</button>)}
            <button type="button" onClick={() => window.print()} className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Print</button>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button>
          </div>
        </header>
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div className="pagibig-report-summary-cards grid gap-4 sm:grid-cols-5">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-3">
              <div className="pagibig-report-details-grid grid gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <p className="font-semibold text-slate-500">Applicable Month</p>
                <p className="font-bold text-slate-900">{monthNames[report.applicableMonth - 1]} {report.applicableYear}</p>
{showSavingsColumns && (<>
                <p className="font-semibold text-slate-500">Regular Savings</p>
                <p className="font-semibold text-slate-900">{formatMoney(Number(report.employeeSavingsTotal) + Number(report.employerSavingsTotal))}</p>
                </>)}
                <p className="font-semibold text-slate-500">PIN / Invoice No.</p>
                <p className="font-bold text-slate-900">{report.pin}</p>
{showSavingsColumns && (<>
                <p className="font-semibold text-slate-500">MP2 Savings</p>
                <p className="font-semibold text-slate-900">{formatMoney(Number(report.mp2Total))}</p>
                </>)}
                <p className="font-semibold text-slate-500">Members</p>
                <p className="font-semibold text-slate-900">{report.entries.length}</p>
{showLoanColumns && (<>
                <p className="font-semibold text-slate-500">Loans</p>
                <p className="font-semibold text-slate-900">{formatMoney(Number(report.calamityLoanTotal) + Number(report.mplLoanTotal) + Number(report.emergencyLoanTotal) + Number(report.safeLoanTotal))}</p>
                </>)}
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <p className="font-semibold text-slate-500">Amount Due</p>
                <p className="text-base font-bold tabular-nums text-slate-950">{formatMoney(report.amountDue)}</p>
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
              <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                <p className="font-semibold text-slate-500">Payment Type</p>
                <p className="font-semibold text-slate-900">{report.paymentType || "-"}</p>
                <p className="font-semibold text-slate-500">Reference No</p>
                <p className="font-semibold text-slate-900">{report.transactionReference || "-"}</p>
                <p className="font-semibold text-slate-500">Payment Date</p>
                <p className="font-semibold text-slate-900">{report.payDate ? report.payDate.slice(0, 10) : "-"}</p>
                <p className="font-semibold text-slate-500">Amount Paid</p>
                <p className="text-base font-bold tabular-nums text-slate-950">{report.amountPaid !== null ? formatMoney(report.amountPaid) : "-"}</p>
              </div>
            </section>
          </div>
        </div>
        <div className="pagibig-report-print-table min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <article className="pagibig-report-card overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className={`w-full ${loansExpanded ? "min-w-[1050px]" : "min-w-[820px]"} text-sm text-slate-900`}>
                <thead className="text-sm font-bold text-slate-800">
                  <tr>
                    <th className="bg-slate-100 px-3 py-3 text-left text-sm font-bold text-slate-800">Employee Name</th>
<th className="bg-slate-100 px-3 py-3 text-left text-sm font-bold text-slate-800">Pag-IBIG Number</th>
{showSavingsColumns && (<>
                    <th className="bg-sky-100 px-3 py-3 text-right text-sm font-bold text-sky-900">Savings</th>
                    <th className="bg-sky-100 px-3 py-3 text-right text-sm font-bold text-sky-900">MP2</th>
                    </>)}
             {showLoanColumns && (loansExpanded ? (<><th className="bg-amber-100 px-3 py-3 text-right text-sm font-bold text-amber-900">Cal</th><th className="bg-amber-100 px-3 py-3 text-right text-sm font-bold text-amber-900">MPL</th><th className="bg-amber-100 px-3 py-3 text-right text-sm font-bold text-amber-900">EMER</th><th className="bg-amber-100 px-3 py-3 text-right text-sm font-bold text-amber-900">SAFE</th></>) : (<th className="bg-amber-100 px-3 py-3 text-right text-sm font-bold text-amber-900">Loans</th>))}
                    <th className="bg-slate-100 px-3 py-3 text-right text-sm font-bold text-slate-800">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.entries.map((entry, index) => (
                    <tr key={entry.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-3 py-3 font-medium text-slate-900">{entry.employeeName}</td><td className="px-3 py-3 text-sm text-slate-600">{entry.midNumber || "-"}</td>
{showSavingsColumns && (<>
                      <td className="bg-sky-50 px-3 py-3 text-right font-medium tabular-nums text-sky-950">{formatMoney(Number(entry.employeeSavings) + Number(entry.employerSavings))}</td>
                      <td className="bg-sky-50 px-3 py-3 text-right font-medium tabular-nums text-sky-950">{formatMoney(Number(entry.mp2Amount))}</td>
                      </>)}
                      {showLoanColumns && (loansExpanded ? (<><td className="bg-amber-50 px-3 py-3 text-right font-medium tabular-nums text-amber-950">{formatMoney(Number(entry.calamityLoanAmount))}</td><td className="bg-amber-50 px-3 py-3 text-right font-medium tabular-nums text-amber-950">{formatMoney(Number(entry.mplLoanAmount))}</td><td className="bg-amber-50 px-3 py-3 text-right font-medium tabular-nums text-amber-950">{formatMoney(Number(entry.emergencyLoanAmount))}</td><td className="bg-amber-50 px-3 py-3 text-right font-medium tabular-nums text-amber-950">{formatMoney(Number(entry.safeLoanAmount))}</td></>) : (<td className="bg-amber-50 px-3 py-3 text-right font-medium tabular-nums text-amber-950">{formatMoney(Number(entry.calamityLoanAmount) + Number(entry.mplLoanAmount) + Number(entry.emergencyLoanAmount) + Number(entry.safeLoanAmount))}</td>))}
                      <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-950">{formatMoney(entry.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-950">
                  <tr>
                    <td className="px-3 py-3">Total</td>
                    <td className="px-3 py-3" />
{showSavingsColumns && (<>
                    <td className="bg-sky-50 px-3 py-3 text-right tabular-nums text-sky-950">{formatMoney(totalSavings)}</td>
                    <td className="bg-sky-50 px-3 py-3 text-right tabular-nums text-sky-950">{formatMoney(totalMp2)}</td>
                    </>)}
                    {showLoanColumns && (loansExpanded ? (<><td className="bg-amber-50 px-3 py-3 text-right tabular-nums text-amber-950">{formatMoney(report.entries.reduce((sum, entry) => sum + Number(entry.calamityLoanAmount), 0))}</td><td className="bg-amber-50 px-3 py-3 text-right tabular-nums text-amber-950">{formatMoney(report.entries.reduce((sum, entry) => sum + Number(entry.mplLoanAmount), 0))}</td><td className="bg-amber-50 px-3 py-3 text-right tabular-nums text-amber-950">{formatMoney(report.entries.reduce((sum, entry) => sum + Number(entry.emergencyLoanAmount), 0))}</td><td className="bg-amber-50 px-3 py-3 text-right tabular-nums text-amber-950">{formatMoney(report.entries.reduce((sum, entry) => sum + Number(entry.safeLoanAmount), 0))}</td></>) : (<td className="bg-amber-50 px-3 py-3 text-right tabular-nums text-amber-950">{formatMoney(totalLoans)}</td>))}
                    <td className="px-3 py-3 text-right tabular-nums">{formatMoney(report.amountDue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </article>
        </div>
        <footer className="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="pagibig-report-interactive flex gap-2">
            <button type="button" onClick={() => onPayment(report)} className="h-10 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800">{paid ? "Update Payment" : "Record Payment"}</button>
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export { ReportDetails };
