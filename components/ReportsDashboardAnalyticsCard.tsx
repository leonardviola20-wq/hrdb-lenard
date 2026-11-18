"use client";

import { useEffect, useState } from "react";
import {
  isContributionAnalyticsData,
  type ContributionAnalyticsData,
  type ContributionProviderKey,
} from "@/lib/contributionAnalytics";
import ContributionGroupedChart from "@/components/reports-dashboard/ContributionGroupedChart";
import ContributionProviderSummary from "@/components/reports-dashboard/ContributionProviderSummary";

const providers: Array<{ key: ContributionProviderKey; label: string }> = [
  { key: "sss", label: "SSS" },
  { key: "pagibig", label: "PagIBIG" },
  { key: "philhealth", label: "PhilHealth" },
];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; analytics: ContributionAnalyticsData };

export default function ReportsDashboardAnalyticsCard() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/reports/contributions/analytics", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data: unknown = await response.json();
        if (!response.ok) {
          const message = data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Unable to load contribution analytics";
          throw new Error(message);
        }
        if (!isContributionAnalyticsData(data)) throw new Error("Contribution analytics response is invalid");
        return data;
      })
      .then((analytics) => {
        if (!controller.signal.aborted) setState({ status: "ready", analytics });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Unable to load contribution analytics",
        });
      });

    return () => controller.abort();
  }, []);

  return (
    <section aria-labelledby="contribution-analytics-title" className="mt-4 w-full">
      <div className="mb-3">
        <h2 id="contribution-analytics-title" className="text-lg font-bold text-slate-900">Contribution Analytics</h2>
      </div>
      {state.status === "loading" && <p role="status" className="rounded-xl border bg-white p-5 text-sm text-slate-600">Loading contribution analytics...</p>}
      {state.status === "error" && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{state.message}</p>}
      {state.status === "ready" && <ContributionAnalyticsView analytics={state.analytics} />}
    </section>
  );
}

function ContributionAnalyticsView({ analytics }: { analytics: ContributionAnalyticsData }) {
  const currentMonthName = monthNames[analytics.currentMonth - 1];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {providers.map(({ key, label }) => {
        const comparison = analytics.totals[key];
        const hasPaidReports = comparison.previousYear.reportCount + comparison.currentYear.reportCount > 0;
        return (
          <section key={key} aria-labelledby={`${key}-contributions-title`} className="min-w-0 space-y-2">
            <h2 id={`${key}-contributions-title`} className="text-base font-bold text-slate-900">{label} Contributions</h2>
            <ContributionProviderSummary
              provider={key}
              comparison={comparison}
              previousYear={analytics.previousYear}
              currentYear={analytics.currentYear}
              currentMonthName={currentMonthName}
            />
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <ContributionGroupedChart
                months={analytics.months}
                provider={key}
                previousYear={analytics.previousYear}
                currentYear={analytics.currentYear}
                currentMonth={analytics.currentMonth}
              />
              {!hasPaidReports && <p className="text-center text-xs text-slate-500">No paid {label} contributions found.</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
