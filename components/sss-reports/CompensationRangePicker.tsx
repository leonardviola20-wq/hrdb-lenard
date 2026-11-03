"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { sssContributionTableForYear } from "@/lib/sssContributionTable";
import { inputClass, formatMoney } from "./constants";

export function CompensationRangePicker({
  employeeName,
  onClose,
  onSelect,
  year,
}: {
  employeeName: string;
  onClose: () => void;
  onSelect: (monthlySalaryCredit: number) => void;
  year: number;
}) {
  const [search, setSearch] = useState("");
  const filteredRows = sssContributionTableForYear(year).filter((row) =>
    `${row.range} ${row.monthlySalaryCredit} ${formatMoney(row.monthlySalaryCredit)}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="compensation-range-title" className="flex max-h-[86dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 id="compensation-range-title" className="text-lg font-bold text-slate-900">Select Compensation Range</h3>
            <p className="mt-1 text-sm text-slate-600">Choose the employee's compensation range.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 border-b border-slate-200 px-5 py-4">
          <div className="rounded-lg bg-blue-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Applying range to</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{employeeName}</p>
          </div>
          <label className="block">
            <span className="sr-only">Search compensation ranges</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass} placeholder="Search compensation range or MSC..." />
          </label>
        </div>
        <div className="h-60 overflow-y-auto p-3 overscroll-contain" role="listbox" aria-label="Compensation ranges">
          {filteredRows.slice(0, 100).map((row) => (
            <button type="button" role="option" aria-selected="false" key={row.key} onClick={() => onSelect(row.monthlySalaryCredit)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
              <span>{row.range}</span>
              <span className="ml-2 text-slate-600">{formatMoney(row.total)}</span>
            </button>
          ))}
          {filteredRows.length === 0 && <p className="px-3 py-8 text-center text-sm text-slate-500">No compensation ranges match your search.</p>}
        </div>
      </section>
    </div>
  );
}