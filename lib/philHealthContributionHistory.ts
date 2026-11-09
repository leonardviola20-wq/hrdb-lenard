import { parsePhilHealthMoneyCents, sumPhilHealthContributionCents } from "@/lib/philHealthReportTotals";

export type PhilHealthContributionHistoryEntry = {
  id: number;
  reportId: number;
  employerName: string;
  applicableYear: number;
  applicableMonth: number;
  amount: string;
  payDate: string | null;
  eparNumber: string | null;
  eparDate: string | null;
};

export type PhilHealthContributionHistoryMonth = {
  year: number;
  month: number;
  totalAmount: string;
  entries: PhilHealthContributionHistoryEntry[];
};

function formatCents(cents: number) {
  return (cents / 100).toFixed(2);
}

export function buildPhilHealthContributionHistory(entries: PhilHealthContributionHistoryEntry[]) {
  const sortedEntries = [...entries].sort((left, right) =>
    right.applicableYear - left.applicableYear
    || right.applicableMonth - left.applicableMonth
    || left.employerName.localeCompare(right.employerName)
    || left.id - right.id,
  );
  const grouped = new Map<string, { year: number; month: number; cents: number; entries: PhilHealthContributionHistoryEntry[] }>();
  const allCents: number[] = [];

  for (const entry of sortedEntries) {
    if (!Number.isInteger(entry.applicableYear) || !Number.isInteger(entry.applicableMonth)
      || entry.applicableMonth < 1 || entry.applicableMonth > 12) {
      throw new RangeError("Invalid PhilHealth contribution report period");
    }

    const cents = parsePhilHealthMoneyCents(entry.amount);
    if (cents === null) throw new RangeError("Invalid PhilHealth contribution amount");
    allCents.push(cents);

    const key = `${entry.applicableYear}-${entry.applicableMonth}`;
    const month = grouped.get(key) ?? {
      year: entry.applicableYear,
      month: entry.applicableMonth,
      cents: 0,
      entries: [],
    };
    const total = sumPhilHealthContributionCents([month.cents, cents]);
    if (total === null) throw new RangeError("PhilHealth contribution total is too large");
    month.cents = total;
    month.entries.push({ ...entry, amount: formatCents(cents) });
    grouped.set(key, month);
  }

  const totalCents = sumPhilHealthContributionCents(allCents);
  if (totalCents === null) throw new RangeError("PhilHealth contribution total is too large");

  return {
    entryCount: sortedEntries.length,
    totalAmount: formatCents(totalCents),
    months: [...grouped.values()].map(({ year, month, cents, entries: monthEntries }) => ({
      year,
      month,
      totalAmount: formatCents(cents),
      entries: monthEntries,
    })),
  };
}
