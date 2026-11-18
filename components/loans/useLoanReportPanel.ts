"use client";

import { useMemo, useState } from "react";
import type { GenerateLoanReportInput, LoanReportRow, LoanRow } from "@/app/actions/loans";
import { sumLoanReportMonthlyAmounts } from "@/lib/loanReportMonthly";
import {
  getExistingLoanReportMonths,
  getPreviousLoanEntriesForAvailableLoans,
  getLatestPreviousLoanReportForEmployer,
  sortLoanRowsByEmployee,
} from "@/lib/loanReportGeneration";

type Props = {
  provider: LoanRow["provider"];
  loans: LoanRow[];
  employers: { id: number; name: string }[];
  previousReports: LoanReportRow[];
  initialEmployerId?: string;
  onGenerate: (
    employerId: number,
    applicableDate: string,
    entries: GenerateLoanReportInput["entries"],
  ) => Promise<void>;
};

export default function useLoanReportPanel({
  provider,
  loans,
  employers,
  previousReports,
  initialEmployerId,
  onGenerate,
}: Props) {
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [employerId, setEmployerId] = useState(initialEmployerId ?? "");
  const [monthlyAmounts, setMonthlyAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(loans.map((loan) => [loan.id, loan.monthlyAmortization])),
  );
  const [focusedMonthlyLoanId, setFocusedMonthlyLoanId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedEmployer = employers.find((employer) => employer.id === Number(employerId));
  const selectedEmployerName = selectedEmployer?.name ?? "";
  const occupiedMonths = getExistingLoanReportMonths(
    previousReports,
    selectedEmployerName,
    provider,
  );
  const duplicateMonth = occupiedMonths.includes(`${year}-${month}`);
  const latestPreviousReport = getLatestPreviousLoanReportForEmployer(
    previousReports,
    selectedEmployerName,
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const employerLoans = loans.filter((loan) => !selectedEmployerName || loan.employerName === selectedEmployerName);
    const matches = term
      ? employerLoans.filter((loan) =>
          loan.employeeName.toLowerCase().includes(term) ||
          loan.loanAccountNumber.toLowerCase().includes(term) ||
          loan.loanType.toLowerCase().includes(term),
        )
      : employerLoans;
    return sortLoanRowsByEmployee(matches);
  }, [loans, search, selectedEmployerName]);
  const yearOptions = useMemo(() => {
    const loanYears = loans.flatMap((loan) => {
      const loanYear = Number((loan.loanDate ?? "").slice(0, 4));
      return Number.isInteger(loanYear) && loanYear > 0 ? [loanYear] : [];
    });
    const firstYear = Math.min(currentYear - 10, ...loanYears);
    const lastYear = Math.max(currentYear, ...loanYears);
    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) =>
      String(lastYear - index),
    );
  }, [currentYear, loans]);
  const selectedLoans = loans.filter((loan) => selected.has(loan.id));
  let totalMonthly: string | null;
  try {
    totalMonthly = sumLoanReportMonthlyAmounts(
      selectedLoans.map((loan) => monthlyAmounts[loan.id] ?? loan.monthlyAmortization),
    );
  } catch {
    totalMonthly = null;
  }

  const loadPreviousReport = () => {
    if (!latestPreviousReport) return;
    try {
      const entries = getPreviousLoanEntriesForAvailableLoans(
        latestPreviousReport.entries,
        new Set(loans.map((loan) => loan.id)),
      );
      setSelected(new Set(entries.map((entry) => entry.loanId)));
      setMonthlyAmounts({
        ...Object.fromEntries(loans.map((loan) => [loan.id, loan.monthlyAmortization])),
        ...Object.fromEntries(entries.map((entry) => [entry.loanId, entry.monthlyAmortization])),
      });
      setSearch("");
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the previous report.");
    }
  };
  const submit = async () => {
    setError("");
    if (!employerId) {
      setError("Select an employer before choosing loans.");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one loan to include.");
      return;
    }
    if (duplicateMonth) {
      const providerName = provider === "SSS" ? "SSS" : "Pag-IBIG";
      setError(
        `A ${providerName} report for ${selectedEmployerName} already exists for ${month}/${year}. Select another month.`,
      );
      return;
    }
    setBusy(true);
    try {
      await onGenerate(
        Number(employerId),
        `${year}-${month}-01`,
        selectedLoans.map((loan) => ({
          loanId: loan.id,
          monthlyAmortization: monthlyAmounts[loan.id] ?? loan.monthlyAmortization,
        })),
      );
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Unable to generate the report.");
    } finally {
      setBusy(false);
    }
  };
  const changeEmployer = (value: string) => {
    setEmployerId(value);
    setSelected(new Set());
    setMonthlyAmounts(Object.fromEntries(loans.map((loan) => [loan.id, loan.monthlyAmortization])));
    setError("");
  };

  return {
    busy,
    changeEmployer,
    duplicateMonth,
    employerId,
    error,
    filtered,
    focusedMonthlyLoanId,
    hasPreviousReport: Boolean(latestPreviousReport),
    occupiedMonths,
    month,
    monthlyAmounts,
    search,
    selected,
    selectedCount: selected.size,
    selectedEmployerName,
    setFocusedMonthlyLoanId,
    setMonth,
    setMonthlyAmounts,
    setSearch,
    setSelected,
    setYear,
    submit,
    totalMonthly,
    year,
    yearOptions,
    loadPreviousReport,
  };
}
