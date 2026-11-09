"use client";

import { EyeIcon, EllipsisVerticalIcon, TrashIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import type { Report } from "@/components/philhealth-reports/types";
import { money, period } from "@/components/philhealth-reports/format";

type ReportsTableProps = {
  displayedReports: Report[];
  filteredReports: Report[];
  canEditPayments: boolean;
  reportMenuOpen: number | null;
  setReportMenuOpen: (open: number | null) => void;
  reportMenuRef: React.RefObject<HTMLDivElement | null>;
  onViewReport: (report: Report) => void;
  onOpenPayment: (report: Report) => void;
  onDeleteReport: (report: Report) => void;
  reportYearFilter: string;
  currentReportPage: number;
  reportPageCount: number;
  reportPageSize: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function ReportsTable({
  displayedReports,
  filteredReports,
  canEditPayments,
  reportMenuOpen,
  setReportMenuOpen,
  reportMenuRef,
  onViewReport,
  onOpenPayment,
  onDeleteReport,
  reportYearFilter,
  currentReportPage,
  reportPageCount,
  reportPageSize,
  onPrevPage,
  onNextPage,
}: ReportsTableProps) {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-hidden overscroll-contain">
        <table className="benefit-report-table w-full table-fixed text-left text-sm text-slate-900">
          <colgroup>
            <col style={{ width: "16%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="bg-slate-100 px-3 py-2 font-bold">Applicable Period</th>
              <th className="bg-slate-100 px-3 py-2 text-right font-bold">Employees</th>
              <th className="bg-slate-100 px-3 py-2 text-right font-bold">Adjustments</th>
              <th className="bg-slate-100 px-3 py-2 text-right font-bold">Amount Due</th>
              <th className="bg-slate-100 px-3 py-2 font-bold">Transaction</th>
              <th className="bg-slate-100 px-3 py-2 font-bold">ePAR</th>
              <th className="bg-slate-100 px-3 py-2 text-right font-bold">Amount Paid</th>
              <th className="bg-slate-100 px-3 py-2 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedReports.map((report) => (
              <tr key={report.id < 0 ? `month-${-report.id}` : report.id} className="hover:bg-slate-50">
                <td className="px-3 py-1 font-semibold">{period(report)}</td>
                <td className="px-3 py-1 text-right tabular-nums">{report.entries.length}</td>
                <td className="px-3 py-1 text-right tabular-nums">{report.payment ? money(Math.max(0, Number(report.payment.amountPaid) - Number(report.amountDue))) : "â€”"}</td>
                <td className="px-3 py-1 text-right font-bold tabular-nums">{money(report.amountDue)}</td>
                <td className="px-3 py-1 text-xs text-slate-600">{report.id < 0 ? "Not created" : (report.payment ? (report.payment.transactionDate || "â€”") : "Unpaid")}</td>
                <td className="px-3 py-1 text-xs text-slate-600">{report.payment ? (report.payment.eparNumber || report.payment.transactionConfirmationNumber || "â€”") : "â€”"}</td>
                <td className="px-3 py-1 text-right font-semibold tabular-nums">{report.payment ? money(report.payment.amountPaid) : "â€”"}</td>
                <td className="px-3 py-1 text-right"><div className="relative inline-block text-left" ref={reportMenuOpen === report.id ? reportMenuRef : null}>
                <button type="button" onClick={() => onViewReport(report)} disabled={report.id < 0} aria-label={`View ${period(report)} report`} title="View report and payment details" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"><EyeIcon className="h-4 w-4" /></button><button type="button" onClick={() => setReportMenuOpen(reportMenuOpen === report.id ? null : report.id)} disabled={report.id < 0} aria-label="Report actions" title="Report actions" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40"><EllipsisVerticalIcon className="h-4 w-4" /></button>{report.id > 0 && reportMenuOpen === report.id && <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"><button type="button" onClick={() => { setReportMenuOpen(null); onViewReport(report); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><EyeIcon className="h-4 w-4" />View report</button><button type="button" onClick={() => { setReportMenuOpen(null); onOpenPayment(report); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><BanknotesIcon className="h-4 w-4" />{report.payment ? "View or edit payment" : "Record payment"}</button>{canEditPayments && <button type="button" onClick={() => { setReportMenuOpen(null); onDeleteReport(report); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"><TrashIcon className="h-4 w-4" />Delete report</button>}</div>}</div></td>
              </tr>
            ))}
            {!filteredReports.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-600">No monthly contribution reports have been created yet.</td></tr>}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold"><tr><td className="px-3 py-2">Totals</td><td className="px-3 py-2 text-right tabular-nums">{displayedReports.filter((report) => report.id > 0).reduce((sum, report) => sum + report.entries.length, 0)}</td><td /><td className="px-3 py-2 text-right tabular-nums">{money(displayedReports.filter((report) => report.id > 0).reduce((sum, report) => sum + Number(report.amountDue), 0))}</td><td /><td /><td className="px-3 py-2 text-right tabular-nums">{money(displayedReports.filter((report) => report.id > 0).reduce((sum, report) => sum + Number(report.payment?.amountPaid ?? 0), 0))}</td><td /></tr></tfoot>
        </table>
      </div>
      <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-700"><span>{displayedReports.length} records{displayedReports.length > reportPageSize ? ` Â· Page ${currentReportPage} of ${reportPageCount}` : ""}</span><div className="flex items-center gap-2">{reportYearFilter === "ALL" && displayedReports.length > reportPageSize && <><button type="button" onClick={onPrevPage} disabled={currentReportPage === 1} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><button type="button" onClick={onNextPage} disabled={currentReportPage >= reportPageCount} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button></>}</div></footer>
    </>
  );
}