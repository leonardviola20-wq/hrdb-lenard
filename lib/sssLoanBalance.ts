export function parseSssLoanDateOnly(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function calculateSssLoanOutstandingBalanceCents(
  loanAmountCents: number | null,
  actualPaymentsCents = 0,
) {
  if (loanAmountCents === null) return null;
  return Math.max(0, loanAmountCents - Math.max(0, actualPaymentsCents));
}

export function calculateSssLoanPaymentAmountCents(
  monthlyAmortizationCents: number,
  loanDate: Date,
  applicableDate: Date,
) {
  const loanMonth = loanDate.getUTCFullYear() * 12 + loanDate.getUTCMonth();
  const applicableMonth = applicableDate.getUTCFullYear() * 12 + applicableDate.getUTCMonth();
  if (applicableMonth < loanMonth + 2) return 0;
  return monthlyAmortizationCents;
}

export function getSssLoanFirstAmortizationDate(loanDate: Date) {
  return new Date(Date.UTC(loanDate.getUTCFullYear(), loanDate.getUTCMonth() + 2, 1));
}
