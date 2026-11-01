import type { LocalDate } from './types';

/** Local-time calendar day of `date` as `YYYY-MM-DD`. */
export function toLocalDate(date: Date): LocalDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(now: Date = new Date()): LocalDate {
  return toLocalDate(now);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Calendar parts of a `YYYY-MM-DD` string that names a real day, or `null` (e.g. `2026-02-30`). */
function parseLocalDate(value: string): { year: number; month: number; day: number } | null {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(year, month - 1, day));
  const roundTrips = utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
  return roundTrips ? { year, month, day } : null;
}

/** Whether `value` is a valid `LocalDate`; guards untrusted input such as the `?date=` param (US-04). */
export function isLocalDate(value: string): value is LocalDate {
  return parseLocalDate(value) !== null;
}

/**
 * Readable page title, e.g. `Sunday, 27 Sep 2026` (US-03). Fixed English names rather than `Intl`,
 * so the title is identical in every browser and locale. The weekday is computed in UTC from the
 * calendar parts, so neither the time zone nor DST can shift it. Throws on an invalid date.
 */
export function formatPageTitle(date: LocalDate): string {
  const parts = parseLocalDate(date);
  if (!parts) throw new RangeError(`Invalid LocalDate: ${date}`);
  const { year, month, day } = parts;
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${day} ${MONTHS[month - 1]} ${year}`;
}
