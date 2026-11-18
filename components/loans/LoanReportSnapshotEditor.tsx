"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import type { LoanEmployee, LoanReportRow } from "@/app/actions/loans";
import LoanDialog from "@/components/loans/LoanDialog";
import LoanReportSnapshotControls from "./LoanReportSnapshotControls";
import LoanReportSnapshotFooter from "./LoanReportSnapshotFooter";
import LoanReportSnapshotTable from "./LoanReportSnapshotTable";
import useLoanReportSnapshotEditor from "./useLoanReportSnapshotEditor";

export default function LoanReportSnapshotEditor({
  report,
  employees,
  onClose,
  onSaved,
}: {
  report: LoanReportRow;
  employees: LoanEmployee[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editor = useLoanReportSnapshotEditor(report, onSaved);
  const [addingLoan, setAddingLoan] = useState(false);
  const [accountRefreshKey, setAccountRefreshKey] = useState(0);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !editor.isSaving && !addingLoan) onClose();
        }}
      >
        <form
          onSubmit={editor.saveSnapshot}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-loan-report-title"
          className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <header className="page-header-surface flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 id="edit-loan-report-title" className="text-lg font-bold text-slate-900">Edit Loan Report</h2>
              <p className="text-sm text-slate-600">Update this saved snapshot. Source loan accounts will not be changed.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={editor.isSaving || addingLoan}
              aria-label="Close"
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <XMarkIcon aria-hidden="true" className="h-5 w-5" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <LoanReportSnapshotControls
              report={report}
              entries={editor.entries}
              month={editor.month}
              year={editor.year}
              yearOptions={editor.yearOptions}
              search={editor.search}
              isSaving={editor.isSaving}
              refreshKey={accountRefreshKey}
              employeesAvailable={employees.length > 0}
              onMonthChange={editor.setMonth}
              onYearChange={editor.setYear}
              onSearchChange={editor.setSearch}
              onNewAccount={() => setAddingLoan(true)}
              onAddAccount={editor.addAccount}
            />
            <LoanReportSnapshotTable
              entries={editor.entries}
              filteredEntries={editor.filteredEntries}
              isSaving={editor.isSaving}
              focusedMonthlyEntryId={editor.focusedMonthlyEntryId}
              setFocusedMonthlyEntryId={editor.setFocusedMonthlyEntryId}
              setEntries={editor.setEntries}
              onRemove={editor.removeEntry}
            />
          </div>
          <LoanReportSnapshotFooter
            entryCount={editor.entries.length}
            totalMonthly={editor.totalMonthly}
            totalOutstanding={editor.totalOutstanding}
            error={editor.error}
            isSaving={editor.isSaving}
            onClose={onClose}
          />
        </form>
      </div>
      {addingLoan && (
        <LoanDialog
          employees={employees}
          provider="SSS"
          onClose={() => setAddingLoan(false)}
          onSaved={() => {
            setAddingLoan(false);
            setAccountRefreshKey((current) => current + 1);
          }}
        />
      )}
    </>
  );
}
