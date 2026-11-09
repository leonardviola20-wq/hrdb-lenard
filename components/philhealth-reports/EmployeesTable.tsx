"use client";

import type { Employee } from "@/components/philhealth-reports/types";
import { fullName, money } from "@/components/philhealth-reports/format";
import { employeePageSize } from "@/components/philhealth-reports/constants";

type EmployeesTableProps = {
  visibleEmployees: Employee[];
  filteredEmployees: Employee[];
  defaultPs: string;
  defaultEs: string;
  activeCount: number;
  inactiveCount: number;
  currentEmployeePage: number;
  employeePageCount: number;
  firstEmployeeResult: number;
  lastEmployeeResult: number;
  onSetAccountActive: (accountId: number, active: boolean) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function EmployeesTable({
  visibleEmployees,
  filteredEmployees,
  defaultPs,
  defaultEs,
  activeCount,
  inactiveCount,
  currentEmployeePage,
  employeePageCount,
  firstEmployeeResult,
  lastEmployeeResult,
  onSetAccountActive,
  onPrevPage,
  onNextPage,
}: EmployeesTableProps) {
  const activeCountMemo = activeCount;

  return (
    <>
      <div className="min-h-0 flex-1 overflow-hidden overscroll-contain">
        <table className="benefit-report-table w-full table-fixed text-left text-sm text-slate-900">
          <colgroup>
            <col style={{ width: "24%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2">Employee Name</th>
              <th className="px-3 py-2">PhilHealth No.</th>
              <th className="px-3 py-2 text-right">PS</th>
              <th className="px-3 py-2 text-right">ES</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 whitespace-nowrap text-center">Account Status</th>
              <th className="px-3 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleEmployees.map((employee) => {
              const account = employee.philHealthAccount;
              const total = account?.active ? Number(defaultPs) + Number(defaultEs) : 0;
              return (
                <tr key={employee.id} className="hover:bg-slate-50 h-8">
                  <td className="px-3 py-1 font-semibold">{fullName(employee)}</td>
                  <td className="px-3 py-1 tabular-nums">{employee.philHealth || "—"}</td>
                  <td className="px-3 py-1 text-right tabular-nums">{account?.active ? money(defaultPs) : "—"}</td>
                  <td className="px-3 py-1 text-right tabular-nums">{account?.active ? money(defaultEs) : "—"}</td>
                  <td className="px-3 py-1 text-right font-semibold tabular-nums">
                    {account?.active ? money(total.toFixed(2)) : "—"}
                  </td>
                  <td className="px-3 py-1 text-center">
                    {account ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${account.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                        {account.active ? "Active" : "Inactive"}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Not added</span>
                    )}
                  </td>
                  <td className="px-3 py-1 text-center">
                    {account ? (
                      <button
                        type="button"
                        onClick={() => void onSetAccountActive(account.id, !account.active)}
                        aria-label={account.active ? "Set inactive" : "Set active"}
                        title={account.active ? "Set inactive" : "Set active"}
                        className="inline-flex h-7 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {account.active ? "Set inactive" : "Set active"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Add account</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!visibleEmployees.length && (
              <tr>
                <td colSpan={7} className="h-11 px-4 text-center text-sm text-slate-600">
                  No employees match your search.
                </td>
              </tr>
            )}
            {Array.from({ length: employeePageSize - Math.max(visibleEmployees.length, 1) }, (_, index) => (
              <tr key={`empty-${index}`} aria-hidden="true" className="h-8">
                <td colSpan={7} className="h-8 p-0" />
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold">
            <tr>
              <td colSpan={2} className="px-3 py-2 text-slate-800">Employer Employee List</td>
              <td className="px-3 py-2 text-right tabular-nums">{money(activeCountMemo * Number(defaultPs))}</td>
              <td className="px-3 py-2 text-right tabular-nums">{money(activeCountMemo * Number(defaultEs))}</td>
              <td className="px-3 py-2 text-right tabular-nums">{money(activeCountMemo * (Number(defaultPs) + Number(defaultEs)))}</td>
              <td className="px-3 py-2 text-center text-emerald-800">{activeCountMemo} active</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <footer className="benefit-report-footer">
        <span>Showing {firstEmployeeResult}-{lastEmployeeResult} of {filteredEmployees.length} employees</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentEmployeePage === 1}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="tabular-nums">Page {currentEmployeePage} of {employeePageCount}</span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={currentEmployeePage >= employeePageCount}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </footer>
    </>
  );
}