"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAvailableSssLoansForLoanReport,
  type LoanRow,
} from "@/app/actions/loans";

export default function LoanReportAddAccountPicker({
  reportId,
  excludedLoanIds,
  disabled,
  refreshKey,
  newDisabled,
  onNew,
  onAdd,
}: {
  reportId: string;
  excludedLoanIds: ReadonlySet<string>;
  disabled: boolean;
  refreshKey: number;
  newDisabled: boolean;
  onNew: () => void;
  onAdd: (loan: LoanRow) => void;
}) {
  const requestKey = `${reportId}:${refreshKey}`;
  const [loadState, setLoadState] = useState<{
    key: string;
    loans: LoanRow[];
    error: string;
  }>({ key: "", loans: [], error: "" });
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const isLoading = loadState.key !== requestKey;
  const loans = loadState.loans;
  const error = loadState.key === requestKey ? loadState.error : "";

  useEffect(() => {
    let active = true;
    getAvailableSssLoansForLoanReport(reportId)
      .then((result) => {
        if (active) setLoadState({ key: requestKey, loans: result, error: "" });
      })
      .catch((loadError: unknown) => {
        if (active) {
          setLoadState((current) => ({
            key: requestKey,
            loans: current.loans,
            error: loadError instanceof Error ? loadError.message : "Unable to load SSS loan accounts.",
          }));
        }
      });
    return () => {
      active = false;
    };
  }, [requestKey, reportId]);

  const availableLoans = useMemo(
    () => loans.filter((loan) => !excludedLoanIds.has(loan.id)),
    [excludedLoanIds, loans],
  );
  const selectedLoan = availableLoans.find((loan) => loan.id === selectedLoanId);

  return (
    <section aria-label="Add an SSS loan account" className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
      <label className="block text-sm font-semibold text-slate-800">
        SSS Loan Account
        <select
          value={selectedLoanId}
          onChange={(event) => setSelectedLoanId(event.target.value)}
          disabled={disabled || isLoading || availableLoans.length === 0}
          className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        >
          <option value="">
            {isLoading ? "Loading SSS loan accounts..." : "Select an SSS loan account"}
          </option>
          {availableLoans.map((loan) => (
            <option key={loan.id} value={loan.id}>
              {loan.employeeName} · {loan.loanType} · {loan.loanAccountNumber} · {loan.status === "INACTIVE" ? "Inactive" : "Active"}
            </option>
          ))}
        </select>
        {!isLoading && !error && availableLoans.length === 0 && (
          <span className="mt-1 block text-xs font-normal text-slate-600">
            No other SSS loan accounts are available for this report.
          </span>
        )}
        {error && <span role="alert" className="mt-1 block text-sm font-medium text-rose-700">{error}</span>}
      </label>
      <button
        type="button"
        onClick={() => {
          if (!selectedLoan) return;
          onAdd(selectedLoan);
          setSelectedLoanId("");
        }}
        disabled={disabled || !selectedLoan}
        className="h-11 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add
      </button>
      <button
        type="button"
        onClick={onNew}
        disabled={disabled || newDisabled}
        className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        New
      </button>
      {isLoading && <p role="status" className="text-sm font-normal text-slate-700 sm:col-span-2">Loading SSS loan accounts...</p>}
    </section>
  );
}
