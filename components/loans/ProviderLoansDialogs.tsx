"use client";

import type { LoanRow } from "@/app/actions/loans";
import LoanDialog from "@/components/loans/LoanDialog";

type Props = {
  provider: "SSS" | "PAGIBIG";
  employees: { id: number; fullName: string }[];
  addingLoan: boolean;
  editingLoan: LoanRow | null;
  deletingLoan: LoanRow | null;
  deleteBusy: boolean;
  deleteError: string;
  onCloseAdd: () => void;
  onAddSaved: () => void;
  onCloseEdit: () => void;
  onEditSaved: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

export default function ProviderLoansDialogs({
  provider,
  employees,
  addingLoan,
  editingLoan,
  deletingLoan,
  deleteBusy,
  deleteError,
  onCloseAdd,
  onAddSaved,
  onCloseEdit,
  onEditSaved,
  onCancelDelete,
  onConfirmDelete,
}: Props) {
  return (
    <>
      {addingLoan && (
        <LoanDialog
          employees={employees}
          provider={provider}
          onClose={onCloseAdd}
          onSaved={onAddSaved}
        />
      )}
      {editingLoan && (
        <LoanDialog
          employees={employees}
          provider={provider}
          editingLoan={editingLoan}
          onClose={onCloseEdit}
          onSaved={onEditSaved}
        />
      )}
      {deletingLoan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleteBusy) onCancelDelete();
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Delete Loan</h2>
            <p className="mt-2 text-sm text-slate-600">
              Delete the {deletingLoan.provider === "PAGIBIG" ? "Pag-IBIG" : "SSS"} {deletingLoan.loanType} loan
              (“{deletingLoan.loanAccountNumber}”) for <span className="font-semibold">{deletingLoan.employeeName}</span>?
              Recorded payments on this loan are removed as well. This cannot be undone.
            </p>
            {deleteError && (
              <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{deleteError}</p>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancelDelete}
                disabled={deleteBusy}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={deleteBusy}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
              >
                {deleteBusy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
