export const MAX_PHILHEALTH_AMOUNT_CENTS = 99_999_999_999;

export const PHILHEALTH_MINIMUM_CONTRIBUTION_CENTS_BY_YEAR: Record<number, number> = {
  2019: 27500,
  2020: 30000,
  2021: 35000,
  2022: 40000,
  2023: 40000,
  2024: 50000,
  2025: 50000,
  2026: 50000,
};

export function getPhilHealthMinimumContributionCents(year: number): number | null {
  if (!Number.isInteger(year) || year < 2019) return null;
  const cents = PHILHEALTH_MINIMUM_CONTRIBUTION_CENTS_BY_YEAR[year] ?? PHILHEALTH_MINIMUM_CONTRIBUTION_CENTS_BY_YEAR[2026];
  return cents ?? null;
}

export function getPhilHealthShares(year: number): { psCents: number; esCents: number; totalCents: number } | null {
  const minimumCents = getPhilHealthMinimumContributionCents(year);
  if (minimumCents === null) return null;
  const half = Math.round(minimumCents / 2);
  return { psCents: half, esCents: half, totalCents: half + half };
}

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
