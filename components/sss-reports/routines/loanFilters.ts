import { getSssLoanReportCategory, parseSssLoanDateFromApi } from "@/lib/sssLoanBalance";
import type { ActiveLoanReport, SssLoan } from "../shared/types";

export type LoanListFilters = {
  selectedEmployerId: string;
  loanListSearch: string;
  loanAccountFilter: string;
  loanListStatus: string;
};

/** Routine: filter the employer's loan records for the loan list dialog. */
export function filterLoanRecords(loanRecords: SssLoan[], filters: LoanListFilters): SssLoan[] {
  const needle = filters.loanListSearch.trim().toLocaleLowerCase();
  const accountNeedle = filters.loanAccountFilter.trim().toLocaleLowerCase();
  return loanRecords.filter((loan) => {
    const matchesStatus = filters.loanListStatus === "ACTIVE" ? loan.status === "ACTIVE" : loan.status !== "ACTIVE";
    const matchesEmployer = String(loan.employerId) === filters.selectedEmployerId;
    const matchesSearch = !needle || [loan.employeeName, loan.employeeSssNumber ?? ""].some((value) => value.toLocaleLowerCase().includes(needle));
    const matchesAccount = !accountNeedle || loan.loanAccountNumber.toLocaleLowerCase().includes(accountNeedle);
    return matchesStatus && matchesEmployer && matchesSearch && matchesAccount;
  });
}

export type ActiveLoanReportFilterInput = {
  activeLoanReport: ActiveLoanReport | null;
  activeLoanReportFilter: string;
  applicableYear: number;
  applicableMonth: number;
};

/** Routine: loans that belong in the active-loan report for the given period. */
export function filterActiveLoanReportLoans(input: ActiveLoanReportFilterInput): SssLoan[] {
  if (!input.activeLoanReport) return [];
  const applicableDate = new Date(Date.UTC(input.applicableYear, input.applicableMonth - 1, 1));
  return input.activeLoanReport.loans.filter((loan) => {
    const loanDate = parseSssLoanDateFromApi(loan.loanDate);
    if (!loanDate) return false;
    const category = getSssLoanReportCategory({
      status: loan.status,
      employeeId: loan.employeeId,
      employeeStatus: loan.employeeStatus ?? null,
      loanDate,
      loanType: loan.loanType,
    }, applicableDate);
    return input.activeLoanReportFilter === "ALL" ? category !== null : category === input.activeLoanReportFilter;
  });
}
