import type { ContributionAnalyticsMonth, ContributionProviderKey } from "@/lib/contributionAnalytics";

const width = 480;
const height = 210;
const left = 58;
const right = 8;
const top = 18;
const bottom = 30;
const plotHeight = height - top - bottom;
const plotWidth = width - left - right;
const providerDetails: Record<ContributionProviderKey, {
  label: string;
  color: string;
  contrastColor: string;
  contrastClass: string;
  darkClass: string;
}> = {
  sss: { label: "SSS", color: "#2563eb", contrastColor: "#1d4ed8", contrastClass: "border-blue-700", darkClass: "border-blue-600" },
  pagibig: { label: "PagIBIG", color: "#059669", contrastColor: "#047857", contrastClass: "border-emerald-700", darkClass: "border-emerald-600" },
  philhealth: { label: "PhilHealth", color: "#7c3aed", contrastColor: "#6d28d9", contrastClass: "border-violet-700", darkClass: "border-violet-600" },
};
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCurrency(value: number) {
  return value.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return `₱${Math.round(value)}`;
}

export default function ContributionGroupedChart({
  months,
  provider,
  previousYear,
  currentYear,
  currentMonth,
}: {
  months: ContributionAnalyticsMonth[];
  provider: ContributionProviderKey;
  previousYear: number;
  currentYear: number;
  currentMonth: number;
}) {
  const details = providerDetails[provider];
  const largestAmount = Math.max(0, ...months.flatMap((month) => [
    Number(month.providers[provider].previousYear.paid),
    Number(month.providers[provider].currentYear.paid),
  ]));
  const magnitude = largestAmount > 0 ? 10 ** Math.floor(Math.log10(largestAmount)) : 1;
  const scale = largestAmount > 0 ? Math.ceil(largestAmount / magnitude) * magnitude : 1;
  const plotBottom = top + plotHeight;
  const ticks = [0, scale / 2, scale];
  const series = [
    { year: previousYear, field: "previousYear" as const, color: details.color, markerClass: details.darkClass, dash: undefined },
    { year: currentYear, field: "currentYear" as const, color: details.contrastColor, markerClass: details.contrastClass, dash: "5 4" },
  ];
  const yFor = (value: number) => plotBottom - (value / scale) * plotHeight;
  const xFor = (index: number) => left + (months.length <= 1 ? plotWidth / 2 : (index / (months.length - 1)) * plotWidth);
  const pointsFor = (field: "previousYear" | "currentYear") =>
    months.map((month, index) => `${xFor(index)},${yFor(Number(month.providers[provider][field].paid))}`).join(" ");

  return (
    <div role="region" aria-label={`${details.label} yearly comparison chart`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-slate-800">Monthly paid</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1" aria-label={`${details.label} chart legend`}>
          {series.map((item) => (
            <span key={item.year} className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600">
              <span aria-hidden="true" className={`h-0 w-3 border-t-2 ${item.markerClass} ${item.dash ? "border-dashed" : ""}`} />
              {item.year}{item.field === "currentYear" ? " YTD" : ""}
            </span>
          ))}
        </div>
      </div>
      <svg
        className="h-auto w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${provider}-chart-title ${provider}-chart-description`}
      >
        <title id={`${provider}-chart-title`}>{details.label} monthly paid contributions by year</title>
        <desc id={`${provider}-chart-description`}>
          Two lines compare {details.label} paid contribution amounts for {previousYear} and {currentYear} year to date, by applicable month.
        </desc>
        {ticks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray={tick === 0 ? undefined : "4 4"} />
              <text x={left - 6} y={y + 3} textAnchor="end" className="fill-slate-500 text-[9px]">
                {formatCompactCurrency(tick)}
              </text>
            </g>
          );
        })}
        {series.map((item) => (
          <g key={item.year}>
            <polyline
              points={pointsFor(item.field)}
              fill="none"
              stroke={item.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={item.dash}
            />
            {months.map((month, index) => {
              const metric = month.providers[provider][item.field];
              const amount = Number(metric.paid);
              return (
                <circle key={month.month} cx={xFor(index)} cy={yFor(amount)} r="2.5" fill={item.color} tabIndex={0}>
                  <title>{`${details.label}, ${monthNames[month.month - 1]} ${item.year}: ${formatCurrency(amount)}, ${metric.reportCount} paid reports`}</title>
                </circle>
              );
            })}
          </g>
        ))}
        {months.map((month, index) => (
          <text key={month.month} x={xFor(index)} y={height - 10} textAnchor="middle" className="fill-slate-500 text-[9px]">
            {monthNames[month.month - 1]}
          </text>
        ))}
      </svg>
      <div className="sr-only">
        <table>
          <caption>{details.label} monthly paid contributions by year</caption>
          <thead>
            <tr><th scope="col">Month</th><th scope="col">{previousYear}</th><th scope="col">{currentYear} YTD</th></tr>
          </thead>
          <tbody>
            {months.map((month) => (
              <tr key={month.month}>
                <th scope="row">{monthNames[month.month - 1]}</th>
                <td>{formatCurrency(Number(month.providers[provider].previousYear.paid))}, {month.providers[provider].previousYear.reportCount} paid reports</td>
                <td>{month.month <= currentMonth
                  ? `${formatCurrency(Number(month.providers[provider].currentYear.paid))}, ${month.providers[provider].currentYear.reportCount} paid reports`
                  : "Not included in year-to-date total"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
