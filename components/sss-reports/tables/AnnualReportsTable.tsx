"use client";

import { BanknotesIcon, EllipsisVerticalIcon, EyeIcon } from "@heroicons/react/24/outline";
import { dateOnly, formatMoney, monthNames } from "../shared/format";

import type { Report } from "../shared/types";

export type AnnualReportsTableProps = {
  annualReports: Array<Report | null>;
  yearFilter: string;
  currentYear: number;
  loading: boolean;
  canEditPayments: boolean;
  onViewReport: (report: Report) => void;
  onAddPayment: (report: Report) => void;
  onEditReport: (report: Report) => void;
  onDeleteReport: (report: Report) => void;
  reportMenu: { openId: number | null; setOpenId: (value: number | null) => void; ref: React.RefObject<HTMLDivElement | null> };
};

const cell = "px-1.5 py-1.5 sm:px-2 md:px-3";
const noWrap = "whitespace-nowrap ";

function statusBadge(report: Report) {
  const paid = report.amountPaid ? Number(report.amountPaid) : 0;
  const due = Number(report.amountDue);
  const cls = report.amountPaid ? (paid >= due ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800") : "bg-slate-100 text-slate-600";
  const label = report.amountPaid ? (paid >= due ? "Paid" : "Partial") : "Unpaid";
  return <span className={`rounded-full px-1.5 py-1 text-[10px] font-semibold sm:px-2 sm:text-xs ${cls}`}>{label}</span>;
}

/** Component: the main annual SSS reports table with toolbar. */
export function AnnualReportsTable(props: AnnualReportsTableProps) {
  const missingRow = (index: number) => {
    const selectedYear = props.yearFilter || String(props.currentYear);
    return <tr key={`missing-${index}`} className="text-slate-400">
      <td className={`${noWrap}${cell}`}>{monthNames[index]} {selectedYear}</td>
      <td className={cell}>—</td>
      <td className={`${noWrap}tabular-nums ${cell}`}>0</td>
      <td className={`${noWrap}tabular-nums ${cell}`}>₱0.00</td>
      <td className={cell}>—</td>
      <td className={cell}>—</td>
      <td className={cell}>—</td>
      <td className={`${cell}text-right`}>—</td>
    </tr>;
  };

  return (
    <>
      <div className="min-w-0 flex-1 overflow-x-auto">
        <table className="benefit-report-table min-w-[880px] w-full table-fixed text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 sm:text-[11px]">
            <tr>
              <th className="w-[14%] whitespace-nowrap px-1.5 py-2 font-semibold sm:px-2 md:px-3">Period</th>
              <th className="w-[18%] px-1.5 py-2 font-semibold sm:px-2 md:px-3">PRN</th>
              <th className="w-[5%] whitespace-nowrap px-1.5 py-2 font-semibold sm:px-2 md:px-3">Emp</th>
              <th className="w-[15%] whitespace-nowrap px-1.5 py-2 font-semibold sm:px-2 md:px-3">Due</th>
              <th className="w-[10%] whitespace-nowrap px-1.5 py-2 font-semibold sm:px-2 md:px-3">Status</th>
              <th className="w-[14%] whitespace-nowrap px-1.5 py-2 font-semibold sm:px-2 md:px-3">Pay Date</th>
              <th className="w-[14%] px-1.5 py-2 font-semibold sm:px-2 md:px-3">Trans Ref#</th>
              <th className="w-[10%] px-1.5 py-2 text-right font-semibold sm:px-2 md:px-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {props.annualReports.map((report, index) => report ? (
              <tr key={report.id} className="text-slate-700 hover:bg-blue-50/40">
                <td className={`${noWrap}${cell}`}>{monthNames[report.applicableMonth - 1]} {report.applicableYear}</td>
                <td className={cell}><span className="block break-all font-mono text-xs">{report.prn}</span></td>
                <td className={`${noWrap}tabular-nums ${cell}`}>{report.entries.length}</td>
                <td className={`${noWrap}tabular-nums ${cell} font-semibold`}>{formatMoney(report.amountDue)}</td>
                <td className={`${noWrap}${cell}`}>{statusBadge(report)}</td>
                <td className={`${noWrap}tabular-nums ${cell}`}>{dateOnly(report.payDate)}</td>
                <td className={`${cell}break-all font-mono text-xs`}>{report.transactionReference || "—"}</td>
                <td className={`${cell}text-right`}>
                  <div className="inline-flex flex-wrap items-center justify-end gap-1">
                    <button type="button" onClick={() => props.onViewReport(report)} aria-label={`View ${report.employerName} report`} title="View report and payment details" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"><EyeIcon className="h-4 w-4" /></button>
                    {props.canEditPayments ? (
                      <div ref={props.reportMenu.openId === report.id ? props.reportMenu.ref : null} className="relative">
                        <button type="button" onClick={() => props.reportMenu.setOpenId(props.reportMenu.openId === report.id ? null : report.id)} aria-label={`Actions for ${report.employerName} report`} title="Report actions" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                        </button>
                        {props.reportMenu.openId === report.id && <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white shadow-lg">
                          <button type="button" onClick={() => { props.reportMenu.setOpenId(null); props.onAddPayment(report); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">{report.amountPaid ? "Edit payment" : "Add payment"}</button>
                          <button type="button" onClick={() => { props.reportMenu.setOpenId(null); props.onEditReport(report); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Edit report</button>
                          <button type="button" onClick={() => { props.reportMenu.setOpenId(null); props.onDeleteReport(report); }} className="w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50">Delete report</button>
                        </div>}
                      </div>
                    ) : !report.amountPaid && (
                      <button type="button" onClick={() => props.onAddPayment(report)} aria-label={`Add payment for ${report.employerName}`} title="Add payment" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"><BanknotesIcon className="h-4 w-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ) : missingRow(index))}
            {props.loading && <tr><td colSpan={8} className="px-5 py-14 text-center text-sm text-slate-500">Loading SSS reports…</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
