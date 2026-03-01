// ═══════════════════════════════════════════════════════════════
//  DATE UTILITIES — pure functions, zero side effects
// ═══════════════════════════════════════════════════════════════

/**
 * Returns a Date with time zeroed out (midnight local).
 */
export const toDateOnly = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Parses a "YYYY-MM-DD" string into a local midnight Date.
 * Avoids UTC offset bugs that `new Date("YYYY-MM-DD")` causes.
 */
export const parseDate = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Formats a date as "YYYY-MM-DD" for Firestore storage.
 */
export const toISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/**
 * Returns whole-day difference: floor((a - b) / 86400000).
 * Positive when a > b (a is later).
 */
export const diffDays = (a, b) =>
  Math.floor((toDateOnly(a) - toDateOnly(b)) / 86400000);

/**
 * Returns the Monday of the week containing `date`.
 */
export const weekStart = (date = new Date()) => {
  const d = toDateOnly(date);
  const day = d.getDay() === 0 ? 7 : d.getDay(); // 1=Mon … 7=Sun
  d.setDate(d.getDate() - (day - 1));
  return d;
};

/**
 * Returns a "YYYY-MM-DD" string representing the Monday of `date`'s week.
 * Used as a stable week key for aggregation maps.
 */
export const weekKey = (date = new Date()) => toISO(weekStart(date));

/**
 * Formats for display: "15 Jun", "01 Jan", etc.
 */
export const fmtShort = (dateOrStr) => {
  const d = typeof dateOrStr === 'string' ? parseDate(dateOrStr) : dateOrStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

/**
 * Formats month/year: "Jun 2025"
 */
export const fmtMonthYear = (d) =>
  d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
