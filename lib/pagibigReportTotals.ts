export const PAGIBIG_AMOUNT_FIELDS = [
  "employeeSavings",
  "employerSavings",
  "mp2Amount",
  "calamityLoanAmount",
  "mplLoanAmount",
  "emergencyLoanAmount",
  "safeLoanAmount",
] as const;

export type PagIbigAmountField = (typeof PAGIBIG_AMOUNT_FIELDS)[number];
export type PagIbigMoneyValues = Record<PagIbigAmountField, unknown>;
export const MAX_PAGIBIG_AMOUNT_CENTS = 999_999_999_999;

export function parsePagIbigMoneyCents(value: unknown) {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 999_999_999.99) return null;
  return Math.round(amount * 100);
}

export function calculatePagIbigReportTotals(rows: readonly PagIbigMoneyValues[]) {
  const totals = Object.fromEntries(PAGIBIG_AMOUNT_FIELDS.map((field) => [field, 0])) as Record<PagIbigAmountField, number>;
  const entries: Array<Record<PagIbigAmountField, number> & { totalCents: number }> = [];

  for (const row of rows) {
    const amounts = {} as Record<PagIbigAmountField, number>;
    let totalCents = 0;
    for (const field of PAGIBIG_AMOUNT_FIELDS) {
      const cents = parsePagIbigMoneyCents(row[field]);
      if (cents === null) return null;
      amounts[field] = cents;
      totals[field] += cents;
      totalCents += cents;
    }
    entries.push({ ...amounts, totalCents });
  }

  const amountDueCents = Object.values(totals).reduce((sum, cents) => sum + cents, 0);
  if (amountDueCents > MAX_PAGIBIG_AMOUNT_CENTS || Object.values(totals).some((cents) => cents > MAX_PAGIBIG_AMOUNT_CENTS)) return null;
  return { entries, totals, amountDueCents };
}
