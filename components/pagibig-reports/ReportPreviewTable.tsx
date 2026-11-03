"use client";

import { PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { formatMoney, formatEmployeeName } from "./format";
import type { Account, Member } from "./types";

type Props = {
  filteredPreviewMembers: Member[];
  previewFilter: string;
  showSavingsColumns: boolean;
  showLoanColumns: boolean;
  previewColumnCount: number;
  reportYear: string;
  previewTotal: (field: keyof Account) => number;
  previewOverall: number;
  onEditAccount: (member: Member, fromPreview: boolean) => void;
  onRemoveEmployee: (employeeId: number) => void;
};

export function ReportPreviewTable({
  filteredPreviewMembers,
  previewFilter,
  showSavingsColumns,
  showLoanColumns,
  previewColumnCount,
  reportYear,
  previewTotal,
  previewOverall,
  onEditAccount,
  onRemoveEmployee,
}: Props) {
  return (
    <div className="h-[24rem] overflow-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[850px] text-sm text-slate-900">
        <thead className="sticky top-0 z-10 text-sm font-bold">
          <tr>
            <th className="bg-slate-100 px-3 py-3 text-left text-sm font-bold text-slate-800">Employee Name</th>
            <th className="bg-slate-100 px-3 py-3 text-left text-sm font-bold text-slate-800">Pag-IBIG Number</th>
            {showSavingsColumns && <><th className="bg-sky-100 px-3 py-3 text-right text-sm font-bold text-sky-900">Savings</th><th className="bg-sky-100 px-3 py-3 text-right text-sm font-bold text-sky-900">MP2</th></>}
            {showLoanColumns && <th className="bg-amber-100 px-3 py-3 text-right text-sm font-bold text-amber-900">Loans</th>}
            <th className="bg-slate-100 px-3 py-3 text-right text-sm font-bold text-slate-800">Total</th>
            <th className="bg-slate-100 px-3 py-3 text-right text-sm font-bold text-slate-800">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredPreviewMembers.map((member) => {
            const account = member.pagIbigAccount;
            const rowFields = [...(showSavingsColumns ? ["employeeSavings", "employerSavings", "mp2Amount"] : []), ...(showLoanColumns ? ["calamityLoanAmount", "mplLoanAmount", "emergencyLoanAmount", "safeLoanAmount"] : [])];
            const rowTotal = account ? rowFields.reduce((sum, field) => sum + Number(account[field as keyof Account] ?? 0), 0) : 0;
            const mid = member.pagIbigNumber || "Not set";
            return (
              <tr key={member.id}>
                <td className="px-3 py-3 font-medium text-slate-900">{formatEmployeeName(member)}</td>
                <td className="px-3 py-3 text-sm text-slate-600">{account ? mid : `No account for ${reportYear}`}</td>
                {showSavingsColumns && (
                  <>
                    <td className="bg-sky-50 px-3 py-3 text-right font-medium tabular-nums text-sky-950">{account ? formatMoney(["employeeSavings", "employerSavings"].reduce((sum, field) => sum + Number(account[field as keyof Account] ?? 0), 0)) : "-"}</td>
                    <td className="bg-sky-50 px-3 py-3 text-right font-medium tabular-nums text-sky-950">{account ? formatMoney(Number(account.mp2Amount ?? 0)) : "-"}</td>
                  </>
                )}
                {showLoanColumns && <td className="bg-amber-50 px-3 py-3 text-right font-medium tabular-nums text-amber-950">{account ? formatMoney(["calamityLoanAmount", "mplLoanAmount", "emergencyLoanAmount", "safeLoanAmount"].reduce((sum, field) => sum + Number(account[field as keyof Account] ?? 0), 0)) : "-"}</td>}
                <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-950">{account ? formatMoney(rowTotal) : "-"}</td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={() => onEditAccount(member, true)} aria-label={account ? "Edit account" : "Set up account"} className={account ? "rounded p-1 text-violet-700 hover:bg-violet-50" : "text-xs font-semibold text-violet-700 hover:underline"}>
                      {account ? <PencilSquareIcon className="h-4 w-4" /> : "Set Up Account"}
                    </button>
                    <button type="button" onClick={() => onRemoveEmployee(member.id)} aria-label="Remove employee from report" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-rose-700"><XMarkIcon className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
          {filteredPreviewMembers.length === 0 && <tr><td colSpan={previewColumnCount} className="px-4 py-10 text-center text-sm text-slate-600">{previewFilter === "ALL" ? "No employees are in this report form yet. Use Add Employee to select one." : previewFilter === "READY" ? "No employee accounts with a MID number are ready for this report." : previewFilter === "EXCLUDED" ? "No excluded accounts." : previewFilter === "MISSING_MID" ? "No employees missing a MID number." : "No employees need account setup for this year."}</td></tr>}
        </tbody>
        <tfoot className="sticky bottom-0 z-10 border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-950">
          <tr>
            <td className="bg-slate-50 px-3 py-3">Total ({filteredPreviewMembers.length} employees)</td>
            <td className="bg-slate-50 px-3 py-3" />
            {showSavingsColumns && (
              <>
                <td className="bg-sky-50 px-3 py-3 text-right tabular-nums text-sky-950">{formatMoney(["employeeSavings", "employerSavings"].reduce((sum, field) => sum + previewTotal(field as keyof Account), 0))}</td>
                <td className="bg-sky-50 px-3 py-3 text-right tabular-nums text-sky-950">{formatMoney(previewTotal("mp2Amount" as keyof Account))}</td>
              </>
            )}
            {showLoanColumns && <td className="bg-amber-50 px-3 py-3 text-right tabular-nums text-amber-950">{formatMoney(["calamityLoanAmount", "mplLoanAmount", "emergencyLoanAmount", "safeLoanAmount"].reduce((sum, field) => sum + previewTotal(field as keyof Account), 0))}</td>}
            <td className="bg-slate-50 px-3 py-3 text-right tabular-nums">{formatMoney(previewOverall)}</td>
            <td className="bg-slate-50" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
