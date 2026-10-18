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
