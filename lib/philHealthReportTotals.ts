export const MAX_PHILHEALTH_AMOUNT_CENTS = 99_999_999_999;

export function parsePhilHealthMoneyCents(value: unknown) {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_PHILHEALTH_AMOUNT_CENTS / 100) return null;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function sumPhilHealthContributionCents(values: readonly (number | null)[]) {
  let total = 0;
  for (const cents of values) {
    if (cents === null || !Number.isSafeInteger(cents) || cents < 0) return null;
    total += cents;
  }
  return Number.isSafeInteger(total) && total <= MAX_PHILHEALTH_AMOUNT_CENTS ? total : null;
}
