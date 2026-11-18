export function normalizeLoanReportMonthlyAmount(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Monthly amount must be a non-negative amount with up to 2 decimal places.");
  }

  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) {
    throw new Error("Monthly amount must be a non-negative amount with up to 2 decimal places.");
  }

  const whole = match[1].replace(/^0+(?=\d)/, "");
  if (whole.length > 10) {
    throw new Error("Monthly amount exceeds the supported maximum.");
  }

  return `${whole}.${(match[2] ?? "").padEnd(2, "0")}`;
}

export function formatLoanReportMonthlyAmount(value: string): string {
  if (!value) return "";
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value;
}

export function sumLoanReportMonthlyAmounts(values: readonly string[]): string {
  const totalCents = values.reduce((total, value) => {
    const [whole, fraction] = normalizeLoanReportMonthlyAmount(value).split(".");
    const nextTotal = total + Number(whole) * 100 + Number(fraction);
    if (nextTotal > 99_999_999_999_999) {
      throw new Error("The report monthly total exceeds the supported maximum.");
    }
    return nextTotal;
  }, 0);
  const whole = Math.floor(totalCents / 100);

  return `${whole}.${String(totalCents % 100).padStart(2, "0")}`;
}
