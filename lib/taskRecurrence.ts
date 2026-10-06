export const RECURRENCE_OPTIONS = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

export type TaskRecurrence = (typeof RECURRENCE_OPTIONS)[number];

export function isTaskRecurrence(value: unknown): value is TaskRecurrence {
  return typeof value === "string" && RECURRENCE_OPTIONS.includes(value as TaskRecurrence);
}

export function isValidRepeatDay(month: number, day: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1) return false;
  const lastDay = new Date(Date.UTC(2000, month, 0)).getUTCDate();
  return day <= lastDay;
}

export function getRecurrenceAnchor(
  recurrence: TaskRecurrence,
  dueDate: Date | null,
  repeatDay?: number,
  repeatMonth?: number,
) {
  if (recurrence === "NONE" || !dueDate) return null;
  if (recurrence === "MONTHLY" && repeatDay) return new Date(Date.UTC(2000, 0, repeatDay));
  if (recurrence === "YEARLY" && repeatDay && repeatMonth) return new Date(Date.UTC(2000, repeatMonth - 1, repeatDay));
  return new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate()));
}

function dateWithClampedDay(year: number, monthIndex: number, day: number) {
  const normalizedMonth = new Date(Date.UTC(year, monthIndex, 1));
  const normalizedYear = normalizedMonth.getUTCFullYear();
  const normalizedMonthIndex = normalizedMonth.getUTCMonth();
  const lastDay = new Date(Date.UTC(normalizedYear, normalizedMonthIndex + 1, 0)).getUTCDate();
  return new Date(Date.UTC(normalizedYear, normalizedMonthIndex, Math.min(day, lastDay)));
}

export function getNextOccurrence(
  date: Date,
  recurrence: Exclude<TaskRecurrence, "NONE">,
  anchor: Date | null = null,
) {
  const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (recurrence === "DAILY") {
    current.setUTCDate(current.getUTCDate() + 1);
    return current;
  }
  if (recurrence === "WEEKLY") {
    const targetWeekday = anchor?.getUTCDay() ?? current.getUTCDay();
    let daysUntil = (targetWeekday - current.getUTCDay() + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;
    current.setUTCDate(current.getUTCDate() + daysUntil);
    return current;
  }
  if (recurrence === "MONTHLY") {
    const day = anchor?.getUTCDate() ?? current.getUTCDate();
    let next = dateWithClampedDay(current.getUTCFullYear(), current.getUTCMonth(), day);
    if (next <= current) next = dateWithClampedDay(current.getUTCFullYear(), current.getUTCMonth() + 1, day);
    return next;
  }

  const month = anchor?.getUTCMonth() ?? current.getUTCMonth();
  const day = anchor?.getUTCDate() ?? current.getUTCDate();
  let next = dateWithClampedDay(current.getUTCFullYear(), month, day);
  if (next <= current) next = dateWithClampedDay(current.getUTCFullYear() + 1, month, day);
  return next;
}
