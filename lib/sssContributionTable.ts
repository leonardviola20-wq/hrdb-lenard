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

const money = (value: number) => Math.round(value * 100) / 100;
const pesos = (value: number) => value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function compensationRange(monthlySalaryCredit: number) {
  if (monthlySalaryCredit === 5_000) return `Below ${pesos(5_250)}`;
  if (monthlySalaryCredit === 35_000) return `${pesos(34_750)} and over`;
  const minimum = monthlySalaryCredit - 250;
  const maximum = monthlySalaryCredit + 249.99;
  return `${pesos(minimum)} – ${pesos(maximum)}`;
}

function buildSssContributionTable(maxMonthlySalaryCredit: number): SssContributionBracket[] {
  return Array.from({ length: (maxMonthlySalaryCredit - 5_000) / 500 + 1 }, (_, index) => {
    const monthlySalaryCredit = 5_000 + index * 500;
    const regularSsCredit = Math.min(monthlySalaryCredit, 20_000);
    const mpfCredit = Math.max(monthlySalaryCredit - 20_000, 0);
    const employerSs = money(regularSsCredit * 0.095);
    const employeeSs = money(regularSsCredit * 0.045);
    const employerMpf = money(mpfCredit * 0.095);
    const employeeMpf = money(mpfCredit * 0.045);
    const ec = monthlySalaryCredit <= 14_500 ? 10 : 30;

    return {
      key: monthlySalaryCredit,
      range: compensationRange(monthlySalaryCredit),
      monthlySalaryCredit,
      employerSs,
      employeeSs,
      employerMpf,
      employeeMpf,
      ec,
      total: money(employerSs + employeeSs + employerMpf + employeeMpf + ec),
    };
  });
}

export const SSS_CONTRIBUTION_TABLE_2025: SssContributionBracket[] = buildSssContributionTable(20_000);

export const SSS_CONTRIBUTION_TABLE_2023_2024: SssContributionBracket[] = buildSssContributionTable(35_000);

export function sssContributionTableForYear(year: number): SssContributionBracket[] {
  if (year >= 2025) return SSS_CONTRIBUTION_TABLE_2025;
  return SSS_CONTRIBUTION_TABLE_2023_2024;
}

export function getSssContributionBracket(monthlySalaryCredit: number) {
  return SSS_CONTRIBUTION_TABLE_2025.find((bracket) => bracket.monthlySalaryCredit === monthlySalaryCredit) ?? null;
}

export function getSssContributionBracketForYear(year: number, monthlySalaryCredit: number) {
  const table = sssContributionTableForYear(year);
  return table.find((bracket) => bracket.monthlySalaryCredit === monthlySalaryCredit) ?? null;
}

export function toSssMoney(value: number) {
  return money(value).toFixed(2);
}
