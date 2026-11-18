"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  updateLoanReportSnapshot,
  type LoanReportEntry,
  type LoanReportRow,
  type LoanRow,
} from "@/app/actions/loans";
import { sumLoanReportMonthlyAmounts } from "@/lib/loanReportMonthly";
import type { UpdateLoanReportSnapshotInput } from "@/lib/loanReportSnapshot";
import type { SnapshotEditorEntry } from "./loanReportSnapshotEditorTypes";

function toSnapshotEditorEntry(entry: LoanReportEntry): SnapshotEditorEntry {
  return {
    id: entry.id,
    entryId: entry.id,
    sourceLoanId: entry.loanId,
    employeeName: entry.employeeName,
    loanType: entry.loanType,
    loanAccountNumber: entry.loanAccountNumber,
    loanDate: entry.loanDate,
    status: entry.status,
    monthlyAmortization: entry.monthlyAmortization,
    outstandingBalance: entry.outstandingBalance,
  };
}

export default function useLoanReportSnapshotEditor(
  report: LoanReportRow,
  onSaved: () => void,
) {
  const [month, setMonth] = useState(report.applicableDate.slice(5, 7));
  const [year, setYear] = useState(report.applicableDate.slice(0, 4));
  const [entries, setEntries] = useState(() => report.entries.map(toSnapshotEditorEntry));
  const [focusedMonthlyEntryId, setFocusedMonthlyEntryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const reportYear = Number(report.applicableDate.slice(0, 4));
    const entryYears = entries.flatMap((entry) => {
      const entryYear = Number((entry.loanDate ?? "").slice(0, 4));
      return Number.isInteger(entryYear) && entryYear > 0 ? [entryYear] : [];
    });
    const firstYear = Math.min(currentYear - 10, reportYear, ...entryYears);
    const lastYear = Math.max(currentYear, reportYear, ...entryYears);
    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) =>
      String(lastYear - index),
    );
  }, [entries, report.applicableDate]);
  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((entry) =>
      entry.employeeName.toLowerCase().includes(term) ||
      entry.loanAccountNumber.toLowerCase().includes(term) ||
      entry.loanType.toLowerCase().includes(term),
    );
  }, [entries, search]);

  let totalMonthly: string | null;
  try {
    totalMonthly = sumLoanReportMonthlyAmounts(entries.map((entry) => entry.monthlyAmortization));
  } catch {
    totalMonthly = null;
  }
  const totalOutstanding = entries.reduce((total, entry) => total + Number(entry.outstandingBalance), 0);

  const removeEntry = (entryId: string) => {
    if (entries.length > 1) setEntries((current) => current.filter((entry) => entry.id !== entryId));
  };
  const addAccount = (loan: LoanRow) => {
    setEntries((current) => current.some((entry) => entry.sourceLoanId === loan.id)
      ? current
      : [...current, {
          id: `new:${loan.id}`,
          entryId: null,
          sourceLoanId: loan.id,
          employeeName: loan.employeeName,
          loanType: loan.loanType,
          loanAccountNumber: loan.loanAccountNumber,
          loanDate: loan.loanDate,
          status: loan.status,
          monthlyAmortization: loan.monthlyAmortization,
          outstandingBalance: loan.outstandingBalance || "0",
        }]);
  };
  const saveSnapshot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (entries.length === 0) {
      setError("A report must contain at least one loan entry.");
      return;
    }

    setIsSaving(true);
    setError("");
    const input: UpdateLoanReportSnapshotInput = {
      applicableDate: `${year}-${month}-01`,
      entries: entries.map(({ entryId, sourceLoanId, monthlyAmortization }) =>
        entryId
          ? { id: entryId, monthlyAmortization }
          : { loanId: sourceLoanId, monthlyAmortization },
      ),
    };
    try {
      await updateLoanReportSnapshot(report.id, input);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update the saved loan report.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    month,
    setMonth,
    year,
    setYear,
    entries,
    setEntries,
    focusedMonthlyEntryId,
    setFocusedMonthlyEntryId,
    search,
    setSearch,
    isSaving,
    error,
    yearOptions,
    filteredEntries,
    totalMonthly,
    totalOutstanding,
    removeEntry,
    addAccount,
    saveSnapshot,
  };
}
