import type { IsoDate } from "../types";

/**
 * All rental dates are calendar dates in this timezone. "Today" is computed
 * here so the same rule applies everywhere (UI, demo store, tests).
 */
export const APP_TIMEZONE = "Europe/London";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== "string" || !ISO_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function todayInAppTz(now: Date = new Date()): IsoDate {
  // en-CA formats as YYYY-MM-DD.
  return now.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive day count: a same-day rental is one day. */
export function rentalDays(start: IsoDate, end: IsoDate): number {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

export const MAX_RENTAL_DAYS = 30;

/** Returns a user-facing error, or null when the range is valid. */
export function validateRentalDates(start: unknown, end: unknown, today: IsoDate): string | null {
  if (!start || !end) return "Choose a start and end date.";
  if (!isIsoDate(start) || !isIsoDate(end)) return "Enter valid dates.";
  if (start < today) return "The start date can't be in the past.";
  if (end < start) return "The end date can't be before the start date.";
  if (rentalDays(start, end) > MAX_RENTAL_DAYS) return `Rentals can be at most ${MAX_RENTAL_DAYS} days.`;
  return null;
}

/** Inclusive ranges overlap when each starts on or before the other ends. */
export function rangesOverlap(aStart: IsoDate, aEnd: IsoDate, bStart: IsoDate, bEnd: IsoDate): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}
