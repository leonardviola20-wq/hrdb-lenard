export const PAGIBIG_MIN_YEAR = 2020;
export const PAGIBIG_MAX_YEAR = 2200;

export function validPagibigYear(value: unknown): number | null {
  const year = Number(value);
  return Number.isInteger(year) && year >= PAGIBIG_MIN_YEAR && year <= PAGIBIG_MAX_YEAR ? year : null;
}

export function getPagibigAccountYears(currentYear = new Date().getFullYear()): number[] {
  const latestYear = Math.min(Math.max(Math.trunc(currentYear), PAGIBIG_MIN_YEAR), PAGIBIG_MAX_YEAR);
  return Array.from(
    { length: latestYear - PAGIBIG_MIN_YEAR + 1 },
    (_, index) => latestYear - index,
  );
}
