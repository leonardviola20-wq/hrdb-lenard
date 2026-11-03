"use client";

import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import { formatAmount, formatEmployeeName, memberAmountColumns } from "./format";
import type { Member } from "./types";

type Props = {
  visibleMembers: Member[];
  filteredMembers: Member[];
  memberTotals: number[];
  memberSavingsTotal: number;
  memberOverallTotal: number;
  memberFirstResult: number;
  memberLastResult: number;
  currentMemberPage: number;
  memberPageCount: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onOpenAccount: (member: Member) => void;
};

export function MembersTable({
  visibleMembers,
  filteredMembers,
  memberTotals,
  memberSavingsTotal,
  memberOverallTotal,
  memberFirstResult,
  memberLastResult,
  currentMemberPage,
  memberPageCount,
  onPrevPage,
  onNextPage,
  onOpenAccount,
}: Props) {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-hidden overscroll-contain">
        <table className="benefit-report-table w-full table-fixed text-left text-sm text-slate-900">
          <colgroup>
            <col style={{ width: "22%" }} />
            {memberAmountColumns.map((_, index) => <col key={index} style={{ width: "8%" }} />)}
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead><tr><th className="bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">Employee / Pag-IBIG Number</th>{memberAmountColumns.map((column) => <th key={column.label} data-report-accent className={`px-3 py-2 text-right text-sm font-bold ${column.headerClass}`}>{column.label}</th>)}<th className="bg-slate-100 px-3 py-2 text-right text-sm font-bold text-slate-800">Grand Total</th><th className="bg-slate-100 px-3 py-2 text-right text-sm font-bold text-slate-800">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {visibleMembers.map((member) => {
              const account = member.pagIbigAccount;
              const setup = !Boolean(account);
              const rowTotal = memberAmountColumns.reduce((total, column) => total + Number(account?.[column.field] ?? 0), 0);
              return (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-3 py-1 font-semibold text-slate-900">{formatEmployeeName(member)} <div className="text-xs font-medium text-slate-700">{member.pagIbigNumber || "Pag-IBIG number not set"} - <span className={account?.excludedFromReport ? "text-red-700" : "text-emerald-700"}>{account?.excludedFromReport ? "Inactive" : "Active"}</span></div></td>
                  {memberAmountColumns.map((column) => <td key={column.label} className={`px-3 py-1 text-right font-medium tabular-nums ${column.cellClass}`}>{account ? formatAmount(account[column.field]) : "-"}</td>)}
                  <td className="px-3 py-1 text-right font-bold tabular-nums text-slate-950">{account ? formatAmount(rowTotal) : "-"}</td>
                  <td className="px-3 py-1 text-right"><button type="button" onClick={() => onOpenAccount(member)} aria-label={setup ? "Set up Pag-IBIG account" : "Edit Pag-IBIG account"} title={setup ? "Set up Pag-IBIG account" : "Edit Pag-IBIG account"} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500">{setup ? <PlusIcon className="h-4 w-4" /> : <PencilSquareIcon className="h-4 w-4" />}</button></td>
                </tr>
              );
            })}
            {visibleMembers.length === 0 && <tr><td colSpan={10} className="h-11 px-4 text-center text-sm font-medium text-slate-600">No employees match your search.</td></tr>}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold">
            <tr>
              <td className="px-3 py-2 text-slate-800">Totals ({filteredMembers.length} employees)</td>
              <td colSpan={2} className="bg-sky-50 px-3 py-2 text-right tabular-nums text-sky-950">{formatAmount(memberSavingsTotal)}</td>
              <td className="bg-sky-50 px-3 py-2 text-right tabular-nums text-sky-950">{formatAmount(memberTotals[2])}</td>
              {memberTotals.slice(3).map((total, index) => <td key={memberAmountColumns[index + 3].field} className="bg-amber-50 px-3 py-2 text-right tabular-nums text-amber-950">{formatAmount(total)}</td>)}
              <td className="px-3 py-2 text-right tabular-nums text-slate-950">{formatAmount(memberOverallTotal)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="benefit-report-footer">
        <span>Showing {memberFirstResult}-{memberLastResult} of {filteredMembers.length} employees</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onPrevPage} disabled={currentMemberPage === 1} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
          <span className="tabular-nums">Page {currentMemberPage} of {memberPageCount}</span>
          <button type="button" onClick={onNextPage} disabled={currentMemberPage >= memberPageCount} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
        </div>
      </div>
    </>
  );
}
