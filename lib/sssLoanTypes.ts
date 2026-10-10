export const sssLoanTypes = [
  { code: "S", label: "Salary Loan" },
  { code: "C", label: "Calamity Loan" },
  { code: "R", label: "Emergency Loan" },
] as const;

export type SssLoanType = (typeof sssLoanTypes)[number]["code"];

const loanTypeLabels: Record<SssLoanType, string> = {
  S: "Salary Loan",
  C: "Calamity Loan",
  R: "Emergency Loan",
};

export function isSssLoanType(value: unknown): value is SssLoanType {
  return sssLoanTypes.some((loanType) => loanType.code === value);
}

export function getSssLoanTypeLabel(value: SssLoanType) {
  return `${loanTypeLabels[value]} (${value})`;
}

export function getSssLoanTypeListLabel(value: SssLoanType) {
  return `${value}-${loanTypeLabels[value].split(" ")[0]}`;
}
