// ═══════════════════════════════════════════════════════════════
//  AGGREGATION ENGINE
//  All data crunching lives here. Zero UI. Pure functions.
//  Components import pre-computed results — never raw logs.
// ═══════════════════════════════════════════════════════════════

import {
  SUBJECTS,
  SUBJECT_LIST,
  NEGLECT_THRESHOLD_DAYS,
  WEEKLY_TARGETS,
} from './constants';
import { toDateOnly, parseDate, diffDays, weekKey, toISO } from './dateUtils';

// ─────────────────────────────────────────────────────────────
//  1. SUBJECT AGGREGATION
//     Returns per-subject stats: completedHours, pct, lastSeen, neglected
// ─────────────────────────────────────────────────────────────

/**
 * @param {Array} logs - array of Firestore log documents
 * @returns {Object} { Thermodynamics: { completedHours, pct, lastSeen, neglected }, ... }
 */
export function aggregateSubjects(logs) {
  const today = toDateOnly();

  // Initialize every subject to zero
  const result = {};
  for (const subj of SUBJECT_LIST) {
    result[subj] = {
      completedHours: 0,
      pct:            0,
      lastSeen:       null,   // Date or null
      neglected:      false,
      target:         SUBJECTS[subj].target,
      color:          SUBJECTS[subj].color,
      abbr:           SUBJECTS[subj].abbr,
    };
  }

  for (const log of logs) {
    const subj = log.subject;
    if (!result[subj]) continue;
    const logDate = parseDate(log.date);
    const hours   = (log.mechanicalHours || 0) + (log.codingHours || 0);
    result[subj].completedHours += hours;
    if (!result[subj].lastSeen || logDate > result[subj].lastSeen) {
      result[subj].lastSeen = logDate;
    }
  }

  // Compute derived values
  for (const subj of SUBJECT_LIST) {
    const s  = result[subj];
    s.pct    = Math.min(100, (s.completedHours / s.target) * 100);
    s.neglected = s.lastSeen
      ? diffDays(today, s.lastSeen) > NEGLECT_THRESHOLD_DAYS
      : logs.length > 0; // if logs exist but subject never touched, it's neglected
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
//  2. WEEKLY AGGREGATION
//     Returns array of { weekLabel, mech, coding } sorted oldest→newest
// ─────────────────────────────────────────────────────────────

/**
 * @param {Array} logs
 * @returns {Array} weekly data for charts
 */
export function aggregateWeekly(logs) {
  const map = {}; // weekKey → { mech, coding }

  for (const log of logs) {
    const key = weekKey(parseDate(log.date));
    if (!map[key]) map[key] = { week: key, mech: 0, coding: 0 };
    map[key].mech   += log.mechanicalHours || 0;
    map[key].coding += log.codingHours     || 0;
  }

  return Object.values(map)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map(w => ({
      ...w,
      // Label as "DD Mon" of the week start
      weekLabel: (() => {
        const d = parseDate(w.week);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      })(),
    }));
}

// ─────────────────────────────────────────────────────────────
//  3. THIS-WEEK STATS
// ─────────────────────────────────────────────────────────────

/**
 * @param {Array} logs
 * @returns {{ weeklyMech, weeklyCoding, daysIntoWeek, todayStr }}
 */
export function thisWeekStats(logs) {
  const today   = toDateOnly();
  const todayStr = toISO(today);

  // Monday of current week
  const monday  = new Date(today);
  const dow     = today.getDay() === 0 ? 7 : today.getDay();
  monday.setDate(today.getDate() - (dow - 1));

  const weekLogs = logs.filter(l => parseDate(l.date) >= monday);

  const weeklyMech   = weekLogs.reduce((s, l) => s + (l.mechanicalHours || 0), 0);
  const weeklyCoding = weekLogs.reduce((s, l) => s + (l.codingHours     || 0), 0);
  const daysIntoWeek = diffDays(today, monday) + 1; // 1–7

  return { weeklyMech, weeklyCoding, daysIntoWeek, todayStr };
}

// ─────────────────────────────────────────────────────────────
//  4. STREAK CALCULATION
//     Counts consecutive days (ending today or yesterday)
// ─────────────────────────────────────────────────────────────

/**
 * @param {Array} logs
 * @returns {number} streak length
 */
export function calcStreak(logs) {
  if (!logs.length) return 0;

  const today    = toDateOnly();
  const dateSet  = new Set(logs.map(l => l.date));

  let streak = 0;
  let cursor = toDateOnly();

  // Allow cursor to start from yesterday if today not yet logged
  if (!dateSet.has(toISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dateSet.has(toISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// ─────────────────────────────────────────────────────────────
//  5. MOOD TREND
//     Last N days of mood data for chart
// ─────────────────────────────────────────────────────────────

/**
 * @param {Array} logs
 * @param {number} days
 * @returns {Array} [{ date, mood }]
 */
export function moodTrend(logs, days = 21) {
  return logs
    .filter(l => l.mood)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days)
    .map(l => ({
      date: l.date.slice(5), // "MM-DD"
      mood: l.mood,
    }));
}

// ─────────────────────────────────────────────────────────────
//  6. HEATMAP DATA
//     react-calendar-heatmap expects { date: "YYYY-MM-DD", count }
// ─────────────────────────────────────────────────────────────

/**
 * @param {Array} logs
 * @returns {Array} [{ date, count }]
 */
export function heatmapValues(logs) {
  const map = {};
  for (const log of logs) {
    const total = (log.mechanicalHours || 0) + (log.codingHours || 0);
    map[log.date] = (map[log.date] || 0) + total;
  }
  return Object.entries(map).map(([date, total]) => ({
    date,
    count: total === 0 ? 0 : total < 2 ? 1 : total <= 4 ? 2 : total < 6 ? 3 : 4,
  }));
}

// ─────────────────────────────────────────────────────────────
//  7. TOTAL HOURS
// ─────────────────────────────────────────────────────────────

export function totalHours(logs) {
  return logs.reduce((s, l) => s + (l.mechanicalHours || 0) + (l.codingHours || 0), 0);
}

export function totalMech(logs) {
  return logs.reduce((s, l) => s + (l.mechanicalHours || 0), 0);
}

export function totalCoding(logs) {
  return logs.reduce((s, l) => s + (l.codingHours || 0), 0);
}
