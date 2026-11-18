"use client";

import type { Dispatch, SetStateAction } from "react";
import type { LoanRow } from "@/app/actions/loans";
import {
  formatLoanReportMonthlyAmount,
  normalizeLoanReportMonthlyAmount,
} from "@/lib/loanReportMonthly";

type Props = {
  filtered: LoanRow[];
  selected: Set<string>;
  setSelected: Dispatch<SetStateAction<Set<string>>>;
  monthlyAmounts: Record<string, string>;
  setMonthlyAmounts: Dispatch<SetStateAction<Record<string, string>>>;
  focusedMonthlyLoanId: string | null;
  setFocusedMonthlyLoanId: Dispatch<SetStateAction<string | null>>;
  busy: boolean;
  selectionDisabled: boolean;
};

export default function LoanReportSelectionTable({
  filtered,
  selected,
  setSelected,
  monthlyAmounts,
  setMonthlyAmounts,
  focusedMonthlyLoanId,
  setFocusedMonthlyLoanId,
  busy,
  selectionDisabled,
}: Props) {
  const allFilteredSelected = filtered.length > 0 && filtered.every((loan) => selected.has(loan.id));
  const toggle = (loanId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(loanId)) next.delete(loanId);
      else next.add(loanId);
      return next;
    });
  };

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-800">
          <tr>
            <th className="w-10 px-3 py-2.5">
              <input
                type="checkbox"
                aria-label="Select all loans"
                checked={allFilteredSelected && !selectionDisabled}
                disabled={selectionDisabled || busy}
                onChange={() => {
                  setSelected((current) => {
                    const next = new Set(current);
                    if (allFilteredSelected) filtered.forEach((loan) => next.delete(loan.id));
                    else filtered.forEach((loan) => next.add(loan.id));
                    return next;
                  });
                }}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
              />
            </th>
            <th className="px-3 py-2.5">Employee</th>
            <th className="px-3 py-2.5">Loan Type</th>
            <th className="px-3 py-2.5">No.</th>
            <th className="px-3 py-2.5">Loan Date</th>
            <th className="px-3 py-2.5 text-right">Monthly</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.map((loan) => (
            <tr key={loan.id} className={`text-slate-900 ${selected.has(loan.id) ? "bg-blue-50/60" : ""}`}>
              <td className="px-3 py-2.5">
                <input
                  type="checkbox"
                  aria-label={`Include loan for ${loan.employeeName}`}
                  checked={selected.has(loan.id)}
                  onChange={() => toggle(loan.id)}
                  disabled={selectionDisabled || busy}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
              </td>
              <td className="min-w-[220px] px-3 py-2.5 font-medium">{loan.employeeName}</td>
              <td className="px-3 py-2.5">{loan.loanType}</td>
              <td className="px-3 py-2.5 font-mono text-xs">{loan.loanAccountNumber}</td>
              <td className="px-3 py-2.5">{loan.loanDate ?? "—"}</td>
              <td className="px-3 py-2.5 text-right">
                <div className="ml-auto flex h-9 w-36 overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-2 text-xs text-slate-600">₱</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`Monthly amortization for ${loan.employeeName}`}
                    value={focusedMonthlyLoanId === loan.id
                      ? monthlyAmounts[loan.id] ?? loan.monthlyAmortization
                      : formatLoanReportMonthlyAmount(monthlyAmounts[loan.id] ?? loan.monthlyAmortization)}
                    onFocus={() => setFocusedMonthlyLoanId(loan.id)}
                    onBlur={() => {
                      setFocusedMonthlyLoanId((current) => current === loan.id ? null : current);
                      setMonthlyAmounts((current) => {
                        const value = current[loan.id] ?? loan.monthlyAmortization;
                        if (!value) return current;
                        try {
                          return { ...current, [loan.id]: normalizeLoanReportMonthlyAmount(value) };
                        } catch {
                          return current;
                        }
                      });
                    }}
                    onChange={(event) => {
                      const clean = event.target.value.replace(/,/g, "").replace(/[^\d.]/g, "");
                      const dot = clean.indexOf(".");
                      const value = dot < 0
                        ? clean
                        : `${clean.slice(0, dot)}.${clean.slice(dot + 1).replace(/\./g, "").slice(0, 2)}`;
                      setMonthlyAmounts((current) => ({ ...current, [loan.id]: value }));
                    }}
                    disabled={busy || selectionDisabled}
                    className="min-w-0 flex-1 px-2 text-right text-sm tabular-nums text-slate-900 outline-none disabled:bg-slate-100"
                  />
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-sm font-medium text-slate-700">
                No loans match the search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
