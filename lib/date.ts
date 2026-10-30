/**
 * Returns today's date as YYYY-MM-DD in Asia/Kolkata timezone.
 * Single source of truth for "today" — testable by mocking this function.
 */
export const today = (): string => {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
  return fmt.format(new Date());
};

/** Parse YYYY-MM-DD to Date (midnight UTC, for arithmetic only) */
export const parseDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

/** Format Date back to YYYY-MM-DD */
export const formatDate = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Days between two YYYY-MM-DD strings (positive = a is after b) */
export const daysBetween = (a: string, b: string): number => {
  const ms = parseDate(a).getTime() - parseDate(b).getTime();
  return Math.round(ms / 86_400_000);
};

/** Add days to a YYYY-MM-DD string */
export const addDays = (date: string, days: number): string => {
  const d = parseDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
};

/** Format money in INR */
export const formatINR = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
