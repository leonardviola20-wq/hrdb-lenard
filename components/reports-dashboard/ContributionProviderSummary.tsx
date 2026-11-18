import type { ContributionProviderKey, ContributionYearComparison } from "@/lib/contributionAnalytics";

const providerDetails: Record<ContributionProviderKey, { label: string; accent: string; tint: string }> = {
  sss: { label: "SSS", accent: "border-blue-600", tint: "bg-blue-50" },
  pagibig: { label: "PagIBIG", accent: "border-emerald-600", tint: "bg-emerald-50" },
  philhealth: { label: "PhilHealth", accent: "border-violet-600", tint: "bg-violet-50" },
};

function formatCurrency(value: string) {
  return Number(value).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

export default function ContributionProviderSummary({
  provider,
  comparison,
  previousYear,
  currentYear,
  currentMonthName,
}: {
  provider: ContributionProviderKey;
  comparison: ContributionYearComparison;
  previousYear: number;
  currentYear: number;
  currentMonthName: string;
}) {
  const details = providerDetails[provider];
  const currentLabel = `${currentYear} YTD (Jan–${currentMonthName})`;
  const cards = [
    { key: "previousYear", label: `${previousYear} total`, metric: comparison.previousYear },
    { key: "currentYear", label: currentLabel, metric: comparison.currentYear },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map(({ key, label, metric }) => (
        <article key={key} className={`min-w-0 rounded-lg border-2 ${details.accent} ${details.tint} p-2.5 shadow-sm`}>
          <h4 className="min-h-8 text-xs font-semibold leading-4 text-slate-700">{label}</h4>
          <p className="mt-1 break-all text-base font-bold tabular-nums text-slate-950">
            {formatCurrency(metric.paid)}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-slate-600">
            {metric.reportCount} paid {metric.reportCount === 1 ? "report" : "reports"}
          </p>
        </article>
      ))}
    </div>
  );
}
