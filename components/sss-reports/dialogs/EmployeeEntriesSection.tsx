"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { EntriesTable } from "../tables/ReportsTables";
import { formatMoney } from "../shared/format";
import type { DraftEntry, DraftFormState, PaymentKind } from "../shared/types";

/** Subcomponent: the employee-entries editor section of the create-report form. */
export function EmployeeEntriesSection(props: {
  kind: PaymentKind;
  draft: DraftFormState;
  entries: DraftEntry[];
  employeeTotal: (entry: DraftEntry, year: number) => number;
  calculatedTotal: number;
  amountDue: string;
  isTally: boolean;
  hasUnconfiguredEntries: boolean;
  hasLegacyLoanEntries: boolean;
  loadingEmployerEmployees: boolean;
  loadingPreviousEntries: boolean;
  hasEmployer: boolean;
  setRangePickerTarget: (target: "new" | number | null) => void;
  updateLoanEntry: (sssLoanId: number, changes: Partial<DraftEntry>) => void;
  removeEntry: (index: number, entry: DraftEntry) => void;
  onAddPrevious: () => void;
  onAddAll: () => void;
  onOpenEmployeePicker: () => void;
  onOpenContributionTable: () => void;
}) {
  const disableAddButtons = !props.hasEmployer || props.loadingEmployerEmployees || props.loadingPreviousEntries || props.hasLegacyLoanEntries;
  return (
    <section className="mt-5 flex max-h-[58dvh] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Employee Entries</h3>
          <p className="mt-0.5 text-xs text-slate-500">{props.kind === "CONTRIBUTION" ? "Add employees of any status from the full database." : "Add current-month active loan accounts for this employer. Past-due active accounts are available in Add Entry; future loans and inactive employees are excluded."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={disableAddButtons} onClick={props.onAddPrevious} className="h-9 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50">{props.loadingPreviousEntries ? "Loading previous..." : "Add Prev"}</button>
          <button type="button" disabled={disableAddButtons} onClick={props.onAddAll} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">{props.loadingEmployerEmployees ? "Loading employees..." : "Add All"}</button>
          <button type="button" disabled={disableAddButtons} onClick={props.onOpenEmployeePicker} className="inline-flex h-9 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><PlusIcon className="h-4 w-4" /> Add Entry</button>
        </div>
      </div>
      {props.hasLegacyLoanEntries && <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">This older draft has employee-only loan rows. Remove those rows, then re-add saved loan accounts to continue; account numbers are required for a new loan report.</p>}
      <EntriesTable
        kind={props.kind}
        draftYear={props.draft.year}
        entries={props.entries}
        employeeTotal={props.employeeTotal}
        updateLoanEntry={props.updateLoanEntry}
        removeEntry={props.removeEntry}
        setRangePickerTarget={props.setRangePickerTarget}
      />
      <div className="sticky bottom-0 z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <button type="button" onClick={props.onOpenContributionTable} className="text-xs font-semibold text-blue-700 hover:underline">Open official contribution table</button>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-slate-700">
          <span>{props.kind === "LOAN" ? "Loan Accounts" : "Employees"}: <strong className="text-slate-950">{props.entries.length}</strong></span>
          <span>Calculated total: <strong className="text-slate-950">{formatMoney(props.calculatedTotal)}</strong></span>
          <span>Amount Due: <strong className="text-slate-950">{formatMoney(props.amountDue)}</strong></span>
          <span className={`font-bold ${props.isTally ? "text-emerald-700" : "text-amber-700"}`}>{props.isTally ? "Totals tally" : props.hasUnconfiguredEntries ? "Complete every employee entry" : "Totals do not tally"}</span>
        </div>
      </div>
    </section>
  );
}
