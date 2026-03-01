// ═══════════════════════════════════════════════════════════════
//  READINESS SCORE ENGINE
//
//  Formula:
//    Score = (SubjectCompletion × 0.40)
//          + (WeeklyConsistency × 0.30)
//          + (CodingFocus      × 0.20)
//          + (MoodStability    × 0.10)
//
//  All components are independently computed on a 0–100 scale,
//  then weighted and summed. Final output is clamped [0, 100].
// ═══════════════════════════════════════════════════════════════

import { SCORE_WEIGHTS, IDEAL_CODING_RATIO, SUBJECT_LIST, WEEKLY_TARGETS } from './constants';

/**
 * Component A — Subject Completion (0–100)
 *
 * For each subject: pct = min(100, completedHours / target * 100)
 * Completion = arithmetic mean across all 8 subjects.
 *
 * @param {Object} subjectStats - output of aggregateSubjects()
 * @returns {number} 0–100
 */
export function scoreSubjectCompletion(subjectStats) {
  const pcts = SUBJECT_LIST.map(s => subjectStats[s]?.pct ?? 0);
  const avg  = pcts.reduce((a, b) => a + b, 0) / pcts.length;
  return Math.min(100, avg);
}

/**
 * Component B — Weekly Consistency (0–100)
 *
 * Measures how well the user is meeting their weekly targets ON AVERAGE
 * across all logged weeks.
 *
 * For each week:
 *   mechPct   = min(1, weekMech / 17.5)
 *   codingPct = min(1, weekCoding / 14.0)
 *   weekScore = avg(mechPct, codingPct) × 100
 *
 * Consistency = mean(weekScores)
 *
 * @param {Array} weeklyData - output of aggregateWeekly()
 * @returns {number} 0–100
 */
export function scoreWeeklyConsistency(weeklyData) {
  if (!weeklyData.length) return 0;
  const scores = weeklyData.map(w => {
    const mechPct   = Math.min(1, w.mech   / WEEKLY_TARGETS.mechanical);
    const codingPct = Math.min(1, w.coding / WEEKLY_TARGETS.coding);
    return ((mechPct + codingPct) / 2) * 100;
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Component C — Coding Focus Ratio (0–100)
 *
 * codingRatio = totalCodingHours / totalHours
 * Ideal ratio ≥ 40% → full score.
 * Below ideal: score scales linearly from 0 at ratio=0 to 100 at ratio=0.40.
 * Above ideal: capped at 100.
 *
 * @param {number} codingHrs - total coding hours
 * @param {number} allHrs    - total hours (mech + coding)
 * @returns {number} 0–100
 */
export function scoreCodingFocus(codingHrs, allHrs) {
  if (allHrs === 0) return 0;
  const ratio = codingHrs / allHrs;
  return Math.min(100, (ratio / IDEAL_CODING_RATIO) * 100);
}

/**
 * Component D — Mood Stability (0–100)
 *
 * avgMood is on 1–5 scale.
 * Scaled to 0–100: (avgMood - 1) / 4 × 100
 *
 * @param {Array} logs - all log entries
 * @returns {number} 0–100
 */
export function scoreMoodStability(logs) {
  const moods = logs.filter(l => l.mood).map(l => l.mood);
  if (!moods.length) return 0;
  const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
  return Math.min(100, ((avg - 1) / 4) * 100);
}

/**
 * FINAL READINESS SCORE (0–100)
 *
 * Aggregates all 4 components with their weights.
 * Returns both the final score and a breakdown object for display.
 *
 * @param {Object} subjectStats - from aggregateSubjects()
 * @param {Array}  weeklyData   - from aggregateWeekly()
 * @param {number} codingHrs
 * @param {number} allHrs
 * @param {Array}  logs
 * @returns {{ score: number, breakdown: Object }}
 */
export function computeReadinessScore({ subjectStats, weeklyData, codingHrs, allHrs, logs }) {
  const A = scoreSubjectCompletion(subjectStats);
  const B = scoreWeeklyConsistency(weeklyData);
  const C = scoreCodingFocus(codingHrs, allHrs);
  const D = scoreMoodStability(logs);

  const score = Math.min(100, Math.max(0,
    A * SCORE_WEIGHTS.subjectCompletion +
    B * SCORE_WEIGHTS.weeklyConsistency +
    C * SCORE_WEIGHTS.codingFocus       +
    D * SCORE_WEIGHTS.moodStability
  ));

  return {
    score:     Math.round(score * 10) / 10, // 1 decimal place
    breakdown: {
      subjectCompletion: { score: A, weight: SCORE_WEIGHTS.subjectCompletion },
      weeklyConsistency: { score: B, weight: SCORE_WEIGHTS.weeklyConsistency },
      codingFocus:       { score: C, weight: SCORE_WEIGHTS.codingFocus       },
      moodStability:     { score: D, weight: SCORE_WEIGHTS.moodStability     },
    },
  };
}

/**
 * Human-readable score tier.
 */
export function scoreTier(score) {
  if (score >= 80) return { label: 'MISSION READY',    color: '#00ff88' };
  if (score >= 60) return { label: 'ON TRACK',         color: '#38bdf8' };
  if (score >= 40) return { label: 'DEVELOPING',       color: '#ffb020' };
  if (score >= 20) return { label: 'NEEDS ATTENTION',  color: '#fb923c' };
  return               { label: 'CRITICAL',            color: '#ff4444' };
}

/**
 * Smart weekly warning message.
 *
 * @param {number} weeklyMech
 * @param {number} weeklyCoding
 * @param {number} daysIntoWeek - 1–7 (how many days of the week have passed)
 * @returns {{ status: 'ok'|'warn'|'behind', messages: string[] }}
 */
export function weeklyWarning(weeklyMech, weeklyCoding, daysIntoWeek) {
  // Pro-rate targets to current position in the week
  const factor = daysIntoWeek / 7;
  const expectedMech   = WEEKLY_TARGETS.mechanical * factor;
  const expectedCoding = WEEKLY_TARGETS.coding     * factor;

  const mechGap   = expectedMech   - weeklyMech;
  const codingGap = expectedCoding - weeklyCoding;

  const messages = [];
  let   status   = 'ok';

  if (mechGap > 0.5) {
    messages.push(`Mechanical behind by ${mechGap.toFixed(1)}h (expected ${expectedMech.toFixed(1)}h)`);
    status = 'warn';
  }
  if (codingGap > 0.5) {
    messages.push(`Coding behind by ${codingGap.toFixed(1)}h (expected ${expectedCoding.toFixed(1)}h)`);
    status = status === 'warn' ? 'behind' : 'warn';
  }

  if (status === 'ok') messages.push('On track this week. Keep the pace.');

  return { status, messages };
}
