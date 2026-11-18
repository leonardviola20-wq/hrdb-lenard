import assert from "node:assert/strict";
import test from "node:test";
import { isContributionAnalyticsData } from "./contributionAnalytics";

const providerComparison = {
  previousYear: { paid: "125.50", reportCount: 2 },
  currentYear: { paid: "80.00", reportCount: 1 },
};

function makeAnalytics() {
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    providers: { sss: providerComparison, pagibig: providerComparison, philhealth: providerComparison },
  }));
  return {
    previousYear: 2025,
    currentYear: 2026,
    currentMonth: 11,
    months,
    totals: { sss: providerComparison, pagibig: providerComparison, philhealth: providerComparison },
  };
}

test("annual comparison accepts full previous year and current year-to-date provider data", () => {
  assert.equal(isContributionAnalyticsData(makeAnalytics()), true);
});

test("annual comparison rejects missing months, providers, and invalid periods", () => {
  const analytics = makeAnalytics();
  assert.equal(isContributionAnalyticsData({ ...analytics, months: analytics.months.slice(1) }), false);
  assert.equal(isContributionAnalyticsData({
    ...analytics,
    months: [{ ...analytics.months[0], month: 2 }, ...analytics.months.slice(1)],
  }), false);
  assert.equal(isContributionAnalyticsData({
    ...analytics,
    totals: { ...analytics.totals, pagibig: undefined },
  }), false);
  assert.equal(isContributionAnalyticsData({ ...analytics, currentYear: 2027 }), false);
  assert.equal(isContributionAnalyticsData({ ...analytics, currentMonth: 13 }), false);
  assert.equal(isContributionAnalyticsData({
    ...analytics,
    totals: {
      ...analytics.totals,
      sss: { ...providerComparison, currentYear: { paid: "-1.00", reportCount: 1 } },
    },
  }), false);
});
