export type SssLoanStatus = "ACTIVE" | "PAID" | "NOT_CONNECTED" | "ON_HOLD";
export type SssLoanStatusReason = "APPLIED_FOR_NEW_LOAN" | "FULLY_PAID" | "RESIGNED";

export function isSssLoanStatus(value: unknown): value is SssLoanStatus {
  return value === "ACTIVE" || value === "PAID" || value === "NOT_CONNECTED" || value === "ON_HOLD";
}

export function normalizeSssLoanStatus(
  status: unknown,
  reason: unknown,
): { status: SssLoanStatus; reason: SssLoanStatusReason | null } | null {
  if (status === "ACTIVE" && (reason === null || reason === undefined || reason === "")) {
    return { status, reason: null };
  }
  if (status === "ON_HOLD" && (reason === null || reason === undefined || reason === "")) {
    return { status, reason: null };
  }
  if (status === "PAID" && (reason === "APPLIED_FOR_NEW_LOAN" || reason === "FULLY_PAID")) {
    return { status, reason };
  }
  if (status === "NOT_CONNECTED" && (reason === "RESIGNED" || reason === undefined || reason === null || reason === "")) {
    return { status, reason: "RESIGNED" };
  }
  return null;
}

export function getSssLoanStatusLabel(status: SssLoanStatus, reason: string | null) {
  if (status === "PAID") return `Paid · ${reason === "FULLY_PAID" ? "Fully paid" : "Applied for new loan"}`;
  if (status === "NOT_CONNECTED") return "Not connected · Resigned";
  if (status === "ON_HOLD") return "On-Hold";
  return "Active";
}
