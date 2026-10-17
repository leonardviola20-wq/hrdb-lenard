export const PAGIBIG_LOAN_TYPES = ["CAL", "MPL", "EMER", "SAFE"] as const;

export type PagibigLoanType = (typeof PAGIBIG_LOAN_TYPES)[number];

const loanTypeAliases: Record<PagibigLoanType, string[]> = {
  CAL: ["CAL", "CALAMITY", "CALAMITY_LOAN"],
  MPL: ["MPL", "MULTI_PURPOSE", "MULTIPURPOSE", "MULTI_PURPOSE_LOAN"],
  EMER: ["EMER", "EMERGENCY", "EMERGENCY_LOAN"],
  SAFE: ["SAFE", "SAFE_LOAN"],
};

export function normalizePagibigLoanType(value: string): PagibigLoanType | null {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return PAGIBIG_LOAN_TYPES.find((type) => loanTypeAliases[type].includes(normalized)) ?? null;
}

export function getPagibigLoanTypeAliases(type: PagibigLoanType) {
  return loanTypeAliases[type];
}

export function getPagibigLoanTermEndDate(startDate: Date, years: number) {
  const targetYear = startDate.getUTCFullYear() + years;
  const month = startDate.getUTCMonth();
  const day = Math.min(startDate.getUTCDate(), new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate());
  return new Date(Date.UTC(targetYear, month, day));
}
