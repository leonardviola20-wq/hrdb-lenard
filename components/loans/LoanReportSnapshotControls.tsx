"use client";

import type { LoanReportRow, LoanRow } from "@/app/actions/loans";
import LoanReportAddAccountPicker from "@/components/loans/LoanReportAddAccountPicker";
import type { SnapshotEditorEntry } from "./loanReportSnapshotEditorTypes";

type Props = {
  report: LoanReportRow;
  entries: SnapshotEditorEntry[];
  month: string;
  year: string;
  yearOptions: string[];
  search: string;
  isSaving: boolean;
  refreshKey: number;
  employeesAvailable: boolean;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onNewAccount: () => void;
  onAddAccount: (loan: LoanRow) => void;
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function LoanReportSnapshotControls({
  report,
  entries,
  month,
  year,
  yearOptions,
  search,
  isSaving,
  refreshKey,
  employeesAvailable,
  onMonthChange,
  onYearChange,
  onSearchChange,
  onNewAccount,
  onAddAccount,
}: Props) {
  return (
    <>
      <LoanReportAddAccountPicker
        reportId={report.id}
        excludedLoanIds={new Set(entries.map((entry) => entry.sourceLoanId))}
        disabled={isSaving}
        refreshKey={refreshKey}
        newDisabled={!employeesAvailable || isSaving}
        onNew={onNewAccount}
        onAdd={onAddAccount}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-800">
              Month
              <select
                value={month}
                onChange={(event) => onMonthChange(event.target.value)}
                disabled={isSaving}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              >
                {months.map((monthName, index) => (
                  <option key={monthName} value={String(index + 1).padStart(2, "0")}>{monthName}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Year
              <select
                value={year}
                onChange={(event) => onYearChange(event.target.value)}
                disabled={isSaving}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              >
                {yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
        </div>
        <label className="block text-sm font-semibold text-slate-800">
          Search
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Employee, account no., or loan type"
            disabled={isSaving}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
          />
        </label>
      </div>
    </>
  );
}
