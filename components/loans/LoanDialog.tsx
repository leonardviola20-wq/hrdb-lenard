"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import type { LoanRow } from "@/app/actions/loans";
import LoanDetailsForm from "@/components/loans/LoanDetailsForm";

type Props = {
  employees: { id: number; fullName: string }[];
  provider: LoanRow["provider"];
  editingLoan?: LoanRow;
  onClose: () => void;
  onSaved: () => void;
};

export default function LoanDialog({ employees, provider, editingLoan, onClose, onSaved }: Props) {
  const providerName = provider === "PAGIBIG" ? "Pag-IBIG" : "SSS";
  // Names for employees no longer in the active lookup, so edit mode can still
  // show and keep their selection instead of silently resetting it.
  const extraEmployeeNames = new Map<number, string>(
    editingLoan?.employeeId && !employees.some((employee) => employee.id === editingLoan.employeeId)
      ? [[editingLoan.employeeId, editingLoan.employeeName]]
      : [],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="page-header-surface flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingLoan ? "Edit Loan" : `Add ${providerName} Loan`}
            </h2>
            <p className="text-sm text-slate-600">
              {editingLoan ? "Update the loan details below." : `Enter the ${providerName} loan details below.`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <LoanDetailsForm
            employees={employees}
            provider={provider}
            editingLoan={editingLoan}
            extraEmployeeNames={extraEmployeeNames}
            onSaved={onSaved}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
