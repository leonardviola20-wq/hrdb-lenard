"use client";

import { BanknotesIcon, EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { formatMoney } from "./format";
import { monthNames } from "./constants";
import type { Report } from "./types";

type Props = {
  displayedPagibigReports: Report[];
  pagedReports: Report[];
  reportPageSize: number;
  currentReportPage: number;
  reportPageCount: number;
  canEditPayments: boolean;
  reportMenuOpen: number | null;
  setReportMenuOpen: (value: number | null) => void;
  reportMenuRef: React.RefObject<HTMLDivElement | null>;
  openUpdateReport: (report: Report) => void | Promise<void>;
  setDeleteReportTarget: (report: Report) => void;
  openPayment: (report: Report) => void;
  onViewReport: (report: Report) => void;
  setReportPage: (page: number) => void;
};

export function ReportsTable({
  displayedPagibigReports,
  pagedReports,
  reportPageSize,
  currentReportPage,
  reportPageCount,
  canEditPayments,
  reportMenuOpen,
  setReportMenuOpen,
  reportMenuRef,
  openUpdateReport,
  setDeleteReportTarget,
  openPayment,
  onViewReport,
  setReportPage,
}: Props) {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-hidden overscroll-contain">
        <table className="benefit-report-table w-full table-fixed text-left text-sm text-slate-900">
          <colgroup>
            <col style={{ width: "13%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead className="sticky top-0 z-10 text-sm font-bold">
            <tr><th className="bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">Period</th><th className="bg-slate-100 px-3 py-2 text-right text-sm font-bold text-slate-800">Emp</th><th data-report-accent className="bg-sky-100 px-3 py-2 text-right text-sm font-bold text-sky-900">EE+ER</th><th data-report-accent className="bg-sky-100 px-3 py-2 text-right text-sm font-bold text-sky-900">MP2</th><th data-report-accent className="bg-amber-100 px-3 py-2 text-right text-sm font-bold text-amber-900">Loans</th><th className="bg-slate-100 px-3 py-2 text-right text-sm font-bold text-slate-800">Total</th><th className="bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">Status</th><th className="bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">Type</th><th className="bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">Date</th><th className="bg-slate-100 px-3 py-2 text-right text-sm font-bold text-slate-800">Amount</th><th className="bg-slate-100 px-3 py-2 text-right text-sm font-bold text-slate-800">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedPagibigReports.map((report) => {
              const paid = report.amountPaid !== null && report.payDate !== null;
              const loans = Number(report.calamityLoanTotal) + Number(report.mplLoanTotal) + Number(report.emergencyLoanTotal) + Number(report.safeLoanTotal);
              return (
                <tr key={report.id < 0 ? `month-${-report.id}` : report.id} className="hover:bg-slate-50">
                  <td className="px-3 py-1 font-semibold text-slate-900">{monthNames[report.applicableMonth - 1]} {report.applicableYear}</td>
                  <td className="px-3 py-1 text-right tabular-nums text-slate-700">{report.entries.length}</td>
                  <td className="bg-sky-50 px-3 py-1 text-right font-medium tabular-nums text-sky-950">{formatMoney(Number(report.employeeSavingsTotal) + Number(report.employerSavingsTotal))}</td>
                  <td className="bg-sky-50 px-3 py-1 text-right font-medium tabular-nums text-sky-950">{formatMoney(report.mp2Total)}</td>
                  <td className="bg-amber-50 px-3 py-1 text-right font-medium tabular-nums text-amber-950">{formatMoney(loans)}</td>
                  <td className="px-3 py-1 text-right font-bold tabular-nums text-slate-950">{formatMoney(report.amountDue)}</td>
                  <td className="px-3 py-1"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{report.id < 0 ? "n/a" : (paid ? "Paid" : "Unpaid")}</span></td>
                  <td className="px-3 py-1 text-sm text-slate-700">{paid ? report.paymentType : "-"}</td>
                  <td className="px-3 py-1 text-sm text-slate-700">{paid && report.payDate ? `${report.payDate.slice(5, 7)}/${report.payDate.slice(8, 10)}/${report.payDate.slice(2, 4)}` : "-"}</td>
                  <td className="px-3 py-1 text-right font-medium tabular-nums text-slate-950">{paid ? formatMoney(report.amountPaid) : "-"}</td>
                  <td className="px-3 py-1"><div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => onViewReport(report)} disabled={report.id < 0} aria-label={`View ${monthNames[report.applicableMonth - 1]} ${report.applicableYear} report`} title="View report and payment details" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-violet-700 hover:bg-violet-100 disabled:opacity-40"><EyeIcon className="h-4 w-4" /></button>


                    {!paid && report.id > 0 && <button type="button" onClick={() => openPayment(report)} aria-label={`Record payment for ${monthNames[report.applicableMonth - 1]} ${report.applicableYear}`} title="Record payment" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"><BanknotesIcon className="h-4 w-4" /></button>}
                    {canEditPayments ? (
                      <div ref={reportMenuOpen === report.id ? reportMenuRef : null} className="relative">
                        <button type="button" onClick={() => setReportMenuOpen(reportMenuOpen === report.id ? null : report.id)} disabled={report.id < 0} aria-label={`Actions for ${monthNames[report.applicableMonth - 1]} ${report.applicableYear} report`} title="Report actions" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-40"><EllipsisVerticalIcon className="h-4 w-4" /></button>
                        {reportMenuOpen === report.id && <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                          <button type="button" onClick={() => { setReportMenuOpen(null); void openUpdateReport(report); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><PencilSquareIcon className="h-4 w-4" />Update report</button>
                          <button type="button" onClick={() => { setReportMenuOpen(null); setDeleteReportTarget(report); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"><TrashIcon className="h-4 w-4" />Delete report</button>
                        </div>}
                      </div>
                    ) : null}
                  </div></td>
                </tr>
              );
              })}
              {pagedReports.length === 0 && <tr><td colSpan={11} className="px-4 py-12 text-center text-sm text-slate-700">No result for the selected view.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="benefit-report-footer"><span>Showing {pagedReports.length ? (currentReportPage - 1) * reportPageSize + 1 : 0}-{Math.min(currentReportPage * reportPageSize, displayedPagibigReports.length)} of {displayedPagibigReports.length} reports · Total {formatMoney(displayedPagibigReports.reduce((sum, report) => sum + Number(report.amountDue), 0))}</span><div className="flex items-center gap-2"><button type="button" onClick={() => setReportPage(currentReportPage - 1)} disabled={currentReportPage === 1} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><span className="tabular-nums">Page {currentReportPage} of {reportPageCount}</span><button type="button" onClick={() => setReportPage(currentReportPage + 1)} disabled={currentReportPage === reportPageCount} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button></div></div>
      </>
  );
}
