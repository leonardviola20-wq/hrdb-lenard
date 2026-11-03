export const SSS_CONTRIBUTION_EFFECTIVE_DATE = "2025-01-01";

export type SssContributionBracket = {
  key: number;
  range: string;
  monthlySalaryCredit: number;
  employerSs: number;
  employeeSs: number;
  employerMpf: number;
  employeeMpf: number;
  ec: number;
  total: number;
};

type SssScheduleConfig = {
  minYear: number;
  maxYear: number;
  employerRate: number;
  employeeRate: number;
  minMsc: number;
  maxMsc: number;
};

const SSS_SCHEDULES: SssScheduleConfig[] = [
  { minYear: 2019, maxYear: 2020, employerRate: 0.08, employeeRate: 0.04, minMsc: 2_000, maxMsc: 20_000 },
  { minYear: 2021, maxYear: 2022, employerRate: 0.085, employeeRate: 0.045, minMsc: 3_000, maxMsc: 25_000 },
  { minYear: 2023, maxYear: 2024, employerRate: 0.095, employeeRate: 0.045, minMsc: 4_000, maxMsc: 30_000 },
  { minYear: 2025, maxYear: 2025, employerRate: 0.1, employeeRate: 0.05, minMsc: 5_000, maxMsc: 35_000 },
];

const money = (value: number) => Math.round(value * 100) / 100;

const pesos = (value: number) =>
  value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const compensationRange = (msc: number, minMsc: number, maxMsc: number) => {
  if (msc === minMsc) return `Below ${pesos(minMsc + 250)}`;
  if (msc === maxMsc) return `${pesos(maxMsc - 250)} and over`;
  return `${pesos(msc - 250)} - ${pesos(msc + 249.99)}`;
};

function buildTable(config: SssScheduleConfig): SssContributionBracket[] {
  const rows: SssContributionBracket[] = [];
  for (let msc = config.minMsc; msc <= config.maxMsc; msc += 500) {
    const regular = Math.min(msc, 20_000);
    const mpf = Math.max(msc - 20_000, 0);
    const employerSs = money(regular * config.employerRate);
    const employeeSs = money(regular * config.employeeRate);
    const employerMpf = money(mpf * config.employerRate);
    const employeeMpf = money(mpf * config.employeeRate);
    const ec = msc <= 14_500 ? 10 : 30;
    rows.push({
      key: msc,
      range: compensationRange(msc, config.minMsc, config.maxMsc),
      monthlySalaryCredit: msc,
      employerSs,
      employeeSs,
      employerMpf,
      employeeMpf,
      ec,
      total: money(employerSs + employeeSs + employerMpf + employeeMpf + ec),
    });
  }
  return rows;
}

const TABLES = new Map<number, SssContributionBracket[]>();
for (const config of SSS_SCHEDULES) {
  const table = buildTable(config);
  for (let year = config.minYear; year <= config.maxYear; year++) {
    TABLES.set(year, table);
  }
}

export function sssContributionTableForYear(year: number): SssContributionBracket[] {
  return TABLES.get(year) ?? TABLES.get(2025)!;
}

export function getSssContributionBracket(monthlySalaryCredit: number) {
  return sssContributionTableForYear(2025).find((b) => b.monthlySalaryCredit === monthlySalaryCredit) ?? null;
}

export function getSssContributionBracketForYear(year: number, monthlySalaryCredit: number) {
  return sssContributionTableForYear(year).find((b) => b.monthlySalaryCredit === monthlySalaryCredit) ?? null;
}

export const SSS_AVAILABLE_YEARS = SSS_SCHEDULES.flatMap((c) =>
  Array.from({ length: c.maxYear - c.minYear + 1 }, (_, i) => c.minYear + i),
);

export function toSssMoney(value: number) {
  return money(value).toFixed(2);
}
