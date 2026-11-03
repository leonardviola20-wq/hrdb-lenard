export function monthEnd(month: number, year: number): string {
  return new Date(Date.UTC(year, month, 0)).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function localDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dateOnly(value: string | null): string {
  return value ? value.slice(0, 10) : "—";
}

export function creatorLabel(report: { creator?: { name: string | null; email: string } | null }): string {
  return report.creator?.name?.trim() || report.creator?.email || "Unknown";
}

export function formatReportCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function formatLoanDateMdy(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "numeric", timeZone: "UTC" }).format(date);
}

export function formatAmountDue(value: string): string {
  if (!value || !Number.isFinite(Number(value))) return "";
  return Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}