export type ContributionProviderKey = "sss" | "pagibig" | "philhealth";

export type ContributionProviderTotal = {
  paid: string;
  reportCount: number;
};

export type ContributionYearComparison = {
  previousYear: ContributionProviderTotal;
  currentYear: ContributionProviderTotal;
};

export type ContributionAnalyticsMonth = {
  month: number;
  providers: Record<ContributionProviderKey, ContributionYearComparison>;
};

export type ContributionAnalyticsData = {
  previousYear: number;
  currentYear: number;
  currentMonth: number;
  months: ContributionAnalyticsMonth[];
  totals: Record<ContributionProviderKey, ContributionYearComparison>;
};

const providers: ContributionProviderKey[] = ["sss", "pagibig", "philhealth"];

function isProviderTotal(value: unknown): value is ContributionProviderTotal {
  if (!value || typeof value !== "object") return false;
  const total = value as Record<string, unknown>;
  return typeof total.paid === "string"
    && Number.isFinite(Number(total.paid))
    && Number(total.paid) >= 0
    && Number.isInteger(total.reportCount)
    && Number(total.reportCount) >= 0;
}

function isProviderYearComparison(value: unknown): value is ContributionYearComparison {
  if (!value || typeof value !== "object") return false;
  const comparison = value as Record<string, unknown>;
  return isProviderTotal(comparison.previousYear) && isProviderTotal(comparison.currentYear);
}

function isProviderComparisons(value: unknown): value is Record<ContributionProviderKey, ContributionYearComparison> {
  if (!value || typeof value !== "object") return false;
  const comparisons = value as Record<string, unknown>;
  return providers.every((provider) => isProviderYearComparison(comparisons[provider]));
}

export function isContributionAnalyticsData(value: unknown): value is ContributionAnalyticsData {
  if (!value || typeof value !== "object") return false;
  const analytics = value as Record<string, unknown>;
  if (!Number.isInteger(analytics.previousYear)
    || !Number.isInteger(analytics.currentYear)
    || Number(analytics.currentYear) !== Number(analytics.previousYear) + 1
    || !Number.isInteger(analytics.currentMonth)
    || Number(analytics.currentMonth) < 1
    || Number(analytics.currentMonth) > 12
    || !Array.isArray(analytics.months)
    || analytics.months.length !== 12
    || !isProviderComparisons(analytics.totals)) {
    return false;
  }

  return analytics.months.every((value, index) => {
    if (!value || typeof value !== "object") return false;
    const point = value as Record<string, unknown>;
    return Number(point.month) === index + 1 && isProviderComparisons(point.providers);
  });
}
