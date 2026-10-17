export type EmployeeServiceSummary = {
  duration: string | null;
  years: number | null;
  durationState: "in-service" | "not-active" | "not-set" | "invalid-range";
  expiryDaysRemaining: number | null;
};

const ACTIVE_STATUSES = new Set(["Regular", "Contractual", "Trainee", "Leave"]);

function parseDateOnly(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

type CalendarParts = { years: number; months: number; days: number };

function calendarParts(start: Date, end: Date): CalendarParts | null {
  if (end < start) return null;
  const addMonths = (monthCount: number) => {
    const monthIndex = start.getMonth() + monthCount;
    const year = start.getFullYear() + Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    const day = Math.min(start.getDate(), new Date(year, month + 1, 0).getDate());
    return new Date(year, month, day);
  };
  let monthsTotal = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  if (addMonths(monthsTotal) > end) monthsTotal -= 1;
  const anchor = addMonths(monthsTotal);
  return {
    years: Math.floor(monthsTotal / 12),
    months: monthsTotal % 12,
    days: wholeDaysBetween(anchor, end),
  };
}

function formatCalendarDuration(parts: CalendarParts) {
  const formatUnit = (value: number, singular: string, plural: string) =>
    `${String(value).padStart(2, "0")} ${value === 1 ? singular : plural}`;
  return `${formatUnit(parts.years, "year", "years")} ${formatUnit(parts.months, "month", "months")} ${formatUnit(parts.days, "day", "days")}`;
}

function wholeDaysBetween(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000);
}

export function getEmployeeServiceSummary(
  status: string | null,
  dateStarted: string | null,
  endDate: string | null,
  today = new Date(),
): EmployeeServiceSummary {
  const start = parseDateOnly(dateStarted);
  const end = parseDateOnly(endDate);
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isActive = ACTIVE_STATUSES.has(status || "");
  const serviceEnd = isActive
    ? end && end < currentDay ? end : currentDay
    : end;
  const parts = start && serviceEnd ? calendarParts(start, serviceEnd) : null;
  const duration = parts ? formatCalendarDuration(parts) : null;
  const durationState = !start
    ? "not-set"
    : !serviceEnd
      ? "not-active"
      : duration
        ? "in-service"
        : "invalid-range";
  const expiryDaysRemaining = status === "Contractual" && end
    ? wholeDaysBetween(currentDay, end)
    : null;

  return { duration, years: parts ? parts.years : null, durationState, expiryDaysRemaining };
}
