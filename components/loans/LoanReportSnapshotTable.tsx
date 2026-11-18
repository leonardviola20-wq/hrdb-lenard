"use client";

import type { Dispatch, SetStateAction } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import type { SnapshotEditorEntry } from "./loanReportSnapshotEditorTypes";
import {
  formatLoanReportMonthlyAmount,
  normalizeLoanReportMonthlyAmount,
} from "@/lib/loanReportMonthly";

type Props = {
  entries: SnapshotEditorEntry[];
  filteredEntries: SnapshotEditorEntry[];
  isSaving: boolean;
  focusedMonthlyEntryId: string | null;
  setFocusedMonthlyEntryId: Dispatch<SetStateAction<string | null>>;
  setEntries: Dispatch<SetStateAction<SnapshotEditorEntry[]>>;
  onRemove: (id: string) => void;
};

export default function LoanReportSnapshotTable({
  entries,
  filteredEntries,
  isSaving,
  focusedMonthlyEntryId,
  setFocusedMonthlyEntryId,
  setEntries,
  onRemove,
}: Props) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-800">
          <tr>
            <th className="w-10 px-3 py-2.5"><span className="sr-only">Remove</span></th>
            <th className="px-3 py-2.5">Employee</th>
            <th className="px-3 py-2.5">Loan Type</th>
            <th className="px-3 py-2.5">No.</th>
            <th className="px-3 py-2.5">Loan Date</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5 text-right">Monthly</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredEntries.map((entry) => (
            <tr key={entry.id} className="text-slate-900">
              <td className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  disabled={isSaving || entries.length <= 1}
                  aria-label={`Delete ${entry.employeeName} loan entry`}
                  title={entries.length <= 1 ? "A report must contain at least one loan entry." : "Delete loan entry"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <TrashIcon aria-hidden="true" className="h-4 w-4" />
                </button>
              </td>
              <td className="min-w-[220px] px-3 py-2.5 font-medium">{entry.employeeName}</td>
              <td className="px-3 py-2.5">{entry.loanType}</td>
              <td className="px-3 py-2.5 font-mono text-xs">{entry.loanAccountNumber}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{entry.loanDate ?? "—"}</td>
              <td className="px-3 py-2.5">{entry.status === "INACTIVE" ? "Inactive" : "Active"}</td>
              <td className="px-3 py-2.5 text-right">
                <div className="ml-auto flex h-9 w-36 overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-2 text-xs text-slate-600">₱</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`Monthly amount for ${entry.employeeName}`}
                    value={focusedMonthlyEntryId === entry.id
                      ? entry.monthlyAmortization
                      : formatLoanReportMonthlyAmount(entry.monthlyAmortization)}
                    onFocus={() => setFocusedMonthlyEntryId(entry.id)}
                    onBlur={() => {
                      setFocusedMonthlyEntryId((current) => current === entry.id ? null : current);
                      setEntries((current) => current.map((item) => {
                        if (item.id !== entry.id) return item;
                        try {
                          return { ...item, monthlyAmortization: normalizeLoanReportMonthlyAmount(item.monthlyAmortization) };
                        } catch {
                          return item;
                        }
                      }));
                    }}
                    onChange={(event) => {
                      const clean = event.target.value.replace(/,/g, "").replace(/[^\d.]/g, "");
                      const dot = clean.indexOf(".");
                      const value = dot < 0
                        ? clean
                        : `${clean.slice(0, dot)}.${clean.slice(dot + 1).replace(/\./g, "").slice(0, 2)}`;
                      setEntries((current) => current.map((item) =>
                        item.id === entry.id ? { ...item, monthlyAmortization: value } : item,
                      ));
                    }}
                    disabled={isSaving}
                    className="min-w-0 flex-1 px-2 text-right text-sm tabular-nums text-slate-900 outline-none disabled:bg-slate-100"
                  />
                </div>
              </td>
            </tr>
          ))}
          {filteredEntries.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-sm font-medium text-slate-700">
                No report entries match the search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
