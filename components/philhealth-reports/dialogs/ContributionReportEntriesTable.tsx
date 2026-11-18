"use client";

import { money } from "@/lib/philHealthReportHelpers";
import ScrollableListTable from "@/components/ScrollableListTable";

type EntryRow = {
  id: number;
  employeeName: string;
  employeePhilHealthNumber?: string | null;
  amountCents: number;
  psCents: number;
  esCents: number;
};

export default function ContributionReportEntriesTable({
  rows, psTotalCents, esTotalCents, totalCents,
}: {
  rows: EntryRow[];
  psTotalCents: number;
  esTotalCents: number;
  totalCents: number;
}) {
  const columns = "grid-cols-[1.4fr_1.2fr_1fr_1fr_1.2fr]";
  return (
    <ScrollableListTable
      ariaLabel="PhilHealth contribution report entries"
      className="min-h-0 max-h-[55dvh] shrink rounded-lg border border-slate-200"
      contentClassName="min-w-[640px] text-left text-sm"
      header={
        <div role="row" className={`grid ${columns} text-xs font-bold uppercase tracking-wide text-slate-700`}>
          <div role="columnheader" className="bg-slate-100 px-3 py-3">Employee</div>
          <div role="columnheader" className="bg-slate-100 px-3 py-3">PhilHealth Number</div>
          <div role="columnheader" className="bg-slate-100 px-3 py-3 text-right">PS</div>
          <div role="columnheader" className="bg-slate-100 px-3 py-3 text-right">ES</div>
          <div role="columnheader" className="bg-slate-100 px-3 py-3 text-right">Total (PS + ES)</div>
        </div>
      }
      rowsClassName="divide-y divide-slate-100"
      footer={
        <div role="row" className={`grid ${columns} border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-950`}>
          <div role="cell" className="col-span-2 px-3 py-3">Totals</div>
          <div role="cell" className="px-3 py-3 text-right tabular-nums">{money(psTotalCents / 100)}</div>
          <div role="cell" className="px-3 py-3 text-right tabular-nums">{money(esTotalCents / 100)}</div>
          <div role="cell" className="px-3 py-3 text-right tabular-nums">{money(totalCents / 100)}</div>
        </div>
      }
    >
      {rows.map((row) => (
        <div key={row.id} role="row" className={`grid ${columns} text-slate-900`}>
          <div role="cell" className="px-3 py-3 font-medium">{row.employeeName}</div>
          <div role="cell" className="px-3 py-3 tabular-nums">{row.employeePhilHealthNumber || "—"}</div>
          <div role="cell" className="px-3 py-3 text-right tabular-nums">{money(row.psCents / 100)}</div>
          <div role="cell" className="px-3 py-3 text-right tabular-nums">{money(row.esCents / 100)}</div>
          <div role="cell" className="px-3 py-3 text-right font-semibold tabular-nums">{money(row.amountCents / 100)}</div>
        </div>
      ))}
      {!rows.length && <div role="row" className={`grid ${columns}`}><div role="cell" className="col-span-5 px-3 py-8 text-center text-slate-600">No employee contributions are recorded.</div></div>}
    </ScrollableListTable>
  );
}
