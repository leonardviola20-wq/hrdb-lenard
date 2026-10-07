import type { ReactNode } from "react";

export const EMPTY_DURATION = "—";

/**
 * Converts a duration in minutes into a "1h 30m" style React node,
 * bolding the numeric values while leaving the unit letters at normal weight.
 *
 * Returns the EMPTY_DURATION placeholder for null, undefined, NaN or negative
 * input so callers never render "NaNh" or an empty cell.
 */
export function formatDuration(minutes: number | null | undefined): ReactNode {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes < 0) {
    return EMPTY_DURATION;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!remainingMinutes) {
    return (
      <>
        <span className="font-bold">{hours}</span>h
      </>
    );
  }

  return (
    <>
      <span className="font-bold">{hours}</span>h <span className="font-bold">{remainingMinutes}</span>m
    </>
  );
}

/**
 * Plain-text variant of the same duration format ("1h 30m"), for use in
 * titles, aria-labels, CSV exports and anywhere a string is required.
 */
export function formatDurationText(minutes: number | null | undefined): string {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes < 0) {
    return EMPTY_DURATION;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Compact "HH:MM" duration used by the printable attendance report table.
 */
export function formatDurationClock(minutes: number | null | undefined): string {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes < 0) {
    return EMPTY_DURATION;
  }

  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}
