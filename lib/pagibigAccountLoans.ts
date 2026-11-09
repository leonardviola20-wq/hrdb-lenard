import type { LoanDetail } from "@/components/pagibig-reports/shared/types";
import { PAGIBIG_LOAN_TYPES, type PagibigLoanType } from "@/lib/pagibigLoanTypes";

export type PagibigLoanDetails = Record<PagibigLoanType, LoanDetail>;

export function isDuplicateLoanApplication(
  loanDetails: PagibigLoanDetails,
  currentType: string,
  applicationNo: string
): boolean {
  const trimmed = applicationNo.trim();
  if (!trimmed) return false;
  return PAGIBIG_LOAN_TYPES.some(
    (type) => type !== currentType && loanDetails[type]?.applicationNo?.trim() === trimmed
  );
}

export function validateLoanDetail(detail: LoanDetail, reason: string): boolean {
  const amount = Number(detail.amount);
  const trimmedAppNo = detail.applicationNo.trim();
  if (!trimmedAppNo) return false;
  if (!detail.loanTermDate) return false;
  if (!Number.isInteger(Number(detail.termYears))) return false;
  if (Number(detail.termYears) < 1 || Number(detail.termYears) > 50) return false;
  if (!Number.isFinite(amount) || amount < 0) return false;
  if (!["ACTIVE", "INACTIVE"].includes(detail.status)) return false;
  if (detail.status === "INACTIVE" && !["RESIGNED", "PAID", "NEW_LOAN", "HOLD"].includes(reason)) return false;
  return true;
}

export function loanStatusValue(detail: LoanDetail, reason: string): string {
  return detail.status === "INACTIVE" ? `INACTIVE_${reason}` : "ACTIVE";
}

export function availableLoanTypes(loanDetails: PagibigLoanDetails): PagibigLoanType[] {
  return PAGIBIG_LOAN_TYPES.filter((type) => {
    const detail = loanDetails[type];
    return !detail?.applicationNo?.trim() || detail.status !== "ACTIVE";
  });
}

export function visibleAccountLoanTypes(loanDetails: PagibigLoanDetails, statusFilter: "ACTIVE" | "INACTIVE"): PagibigLoanType[] {
  return PAGIBIG_LOAN_TYPES.filter((type) => {
    const detail = loanDetails[type];
    if (!detail?.applicationNo?.trim()) return false;
    if (statusFilter === "ACTIVE") return detail.status === "ACTIVE";
    return detail.status.startsWith("INACTIVE");
  });
}

export function accountLoanCounts(loanDetails: PagibigLoanDetails): { ACTIVE: number; INACTIVE: number } {
  return {
    ACTIVE: PAGIBIG_LOAN_TYPES.filter((type) => loanDetails[type]?.applicationNo?.trim() && loanDetails[type]?.status === "ACTIVE").length,
    INACTIVE: PAGIBIG_LOAN_TYPES.filter((type) => loanDetails[type]?.applicationNo?.trim() && loanDetails[type]?.status?.startsWith("INACTIVE")).length,
  };
}