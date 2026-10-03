export const RECURRENCE_OPTIONS = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

export type TaskRecurrence = (typeof RECURRENCE_OPTIONS)[number];

export function isTaskRecurrence(value: unknown): value is TaskRecurrence {
  return typeof value === "string" && RECURRENCE_OPTIONS.includes(value as TaskRecurrence);
}

export function getNextOccurrence(date: Date, recurrence: Exclude<TaskRecurrence, "NONE">) {
  const nextDate = new Date(date);
  if (recurrence === "DAILY") nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  if (recurrence === "WEEKLY") nextDate.setUTCDate(nextDate.getUTCDate() + 7);
  if (recurrence === "MONTHLY") {
    const day = nextDate.getUTCDate();
    nextDate.setUTCDate(1);
    nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
    const lastDay = new Date(Date.UTC(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, 0)).getUTCDate();
    nextDate.setUTCDate(Math.min(day, lastDay));
  }
  if (recurrence === "YEARLY") {
    const month = nextDate.getUTCMonth();
    const day = nextDate.getUTCDate();
    nextDate.setUTCDate(1);
    nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1);
    nextDate.setUTCMonth(month);
    const lastDay = new Date(Date.UTC(nextDate.getUTCFullYear(), month + 1, 0)).getUTCDate();
    nextDate.setUTCDate(Math.min(day, lastDay));
  }
  return nextDate;
}