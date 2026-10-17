export type SssContributionEntryInput = {
  id: number;
  reportId: number;
  employerName: string;
  prn: string;
  payDate?: string | null;
  totalAmount: string | number;
  salaryRange: string | null;
  monthlySalaryCredit: string | number | null;
  employerSs: string | number;
  employeeSs: string | number;
  employerMpf: string | number;
  employeeMpf: string | number;
  ec: string | number;
  employeeEmployerName: string | null;
  applicableYear: number;
  applicableMonth: number;
};

export type SssContributionEntry = {
  id: number;
  reportId: number;
  employerName: string;
  prn: string;
  payDate: string | null;
  totalAmount: string;
  salaryRange: string | null;
  monthlySalaryCredit: number | null;
  employerSs: number;
  employeeSs: number;
  employerMpf: number;
  employeeMpf: number;
  ec: number;
  employeeEmployerName: string | null;
};

export type SssContributionMonth = {
  year: number;
  month: number;
  totalAmount: string;
  entries: SssContributionEntry[];
};

export type SssContributionHistory = {
  totalAmount: string;
  entryCount: number;
  months: SssContributionMonth[];
};

const toCents = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

const toMoney = (cents: number) => Number(cents / 100).toFixed(2);

/**
 * Groups saved SSS contribution entries into a year-by-month history with a
 * per-month total and an overall total. Months are returned newest first.
 */
export function buildSssContributionHistory(entries: SssContributionEntryInput[]): SssContributionHistory {
  const monthKeyed = new Map<string, { year: number; month: number; totalCents: number; entries: SssContributionEntry[] }>();
  let overallTotalCents = 0;

  for (const entry of entries) {
    const totalCents = toCents(entry.totalAmount);
    overallTotalCents += totalCents;
    const key = `${entry.applicableYear}-${entry.applicableMonth}`;
    const bucket = monthKeyed.get(key) ?? { year: entry.applicableYear, month: entry.applicableMonth, totalCents: 0, entries: [] };
    bucket.totalCents += totalCents;
    bucket.entries.push({
      id: entry.id,
      reportId: entry.reportId,
      employerName: entry.employerName,
      prn: entry.prn,
      payDate: entry.payDate ?? null,
      totalAmount: toMoney(totalCents),
      salaryRange: entry.salaryRange,
      monthlySalaryCredit: entry.monthlySalaryCredit === null ? null : toCents(entry.monthlySalaryCredit) / 100,
      employerSs: toCents(entry.employerSs) / 100,
      employeeSs: toCents(entry.employeeSs) / 100,
      employerMpf: toCents(entry.employerMpf) / 100,
      employeeMpf: toCents(entry.employeeMpf) / 100,
      ec: toCents(entry.ec) / 100,
      employeeEmployerName: entry.employeeEmployerName,
    });
    monthKeyed.set(key, bucket);
  }

  const months = [...monthKeyed.values()]
    .sort((left, right) => (right.year - left.year) || (right.month - left.month))
    .map((bucket) => ({
      year: bucket.year,
      month: bucket.month,
      totalAmount: toMoney(bucket.totalCents),
      entries: bucket.entries,
    }));

  return { totalAmount: toMoney(overallTotalCents), entryCount: entries.length, months };
}

export type SssContributionMatrixRow = {
  year: number;
  months: string[];
};

/**
 * Pivots a contribution history into one row per year with twelve month cells
 * (January at index 0). Only years that actually have entries are included,
 * newest year first, and months without contributions are filled with "0.00".
 */
export function buildSssContributionMatrix(history: SssContributionHistory): SssContributionMatrixRow[] {
  const rows = new Map<number, string[]>();

  for (const month of history.months) {
    const cells = rows.get(month.year) ?? Array.from({ length: 12 }, () => "0.00");
    cells[month.month - 1] = month.totalAmount;
    rows.set(month.year, cells);
  }

  return [...rows.entries()]
    .sort(([leftYear], [rightYear]) => rightYear - leftYear)
    .map(([year, months]) => ({ year, months }));
}
