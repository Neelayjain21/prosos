// ═══════════════════════════════════════════════════════════════
//  CONSTANTS — single source of truth for all configuration
// ═══════════════════════════════════════════════════════════════

/**
 * Default placement deadline (fallback if user hasn't set one).
 * The user's personal deadline is stored in their profile as `placementDeadline`.
 * Use getPlacementDeadline(profile) to get the right deadline dynamically.
 */
export const PLACEMENT_DEADLINE = new Date(2026, 6, 1); // July 1 2026 (fallback)

/**
 * Returns the placement deadline for a user.
 * Uses their custom deadline if set during onboarding, else falls back to default.
 */
export function getPlacementDeadline(profile) {
  if (profile?.placementDeadline) {
    const d = new Date(profile.placementDeadline);
    if (!isNaN(d.getTime())) return d;
  }
  return PLACEMENT_DEADLINE;
}

/** Weekly study targets (hours) */
export const WEEKLY_TARGETS = {
  mechanical: 17.5, // 2.5h × 7 days
  coding:     14.0, // 2.0h × 7 days
};

/**
 * Subjects with their required mastery hours.
 */
export const SUBJECTS = {
  Thermodynamics:         { target: 120, color: '#ffb020', abbr: 'TD' },
  'Heat Transfer':        { target: 90,  color: '#f97316', abbr: 'HT' },
  'Fluid Mechanics':      { target: 110, color: '#38bdf8', abbr: 'FM' },
  'Strength of Materials':{ target: 100, color: '#00ff88', abbr: 'SOM'},
  'Machine Design':       { target: 80,  color: '#a78bfa', abbr: 'MD' },
  Manufacturing:          { target: 60,  color: '#fb923c', abbr: 'MFG'},
  'Control Systems':      { target: 70,  color: '#f472b6', abbr: 'CS' },
  'Numerical Methods':    { target: 50,  color: '#34d399', abbr: 'NM' },
};

export const SUBJECT_LIST = Object.keys(SUBJECTS);

export const NEGLECT_THRESHOLD_DAYS = 10;

export const SCORE_WEIGHTS = {
  subjectCompletion: 0.40,
  weeklyConsistency: 0.30,
  codingFocus:       0.20,
  moodStability:     0.10,
};

export const IDEAL_CODING_RATIO = 0.40;

export const GRADIENT_PRESETS = [
  { id:'g1', bg:'linear-gradient(135deg,#0f3460,#533483)', border:'#533483' },
  { id:'g2', bg:'linear-gradient(135deg,#1b4332,#2d6a4f)', border:'#2d6a4f' },
  { id:'g3', bg:'linear-gradient(135deg,#3d0000,#7b0000)', border:'#7b0000' },
  { id:'g4', bg:'linear-gradient(135deg,#0d2137,#1e3a5f)', border:'#1e3a5f' },
  { id:'g5', bg:'linear-gradient(135deg,#1a0533,#4a1942)', border:'#4a1942' },
  { id:'g6', bg:'linear-gradient(135deg,#1a2f1a,#2a4a2a)', border:'#2a4a2a' },
  { id:'g7', bg:'linear-gradient(135deg,#2a1a00,#4a3000)', border:'#4a3000' },
  { id:'g8', bg:'linear-gradient(135deg,#001a2a,#003355)', border:'#003355' },
];

export const TARGET_COMPANIES = [
  'L&T', 'Tata Motors', 'Reliance', 'Adani', 'Mahindra',
  'BHEL', 'ISRO', 'DRDO', 'Accenture', 'Infosys',
  'TCS', 'Wipro', 'Bosch', 'Siemens', 'ABB',
  'Caterpillar', 'Cummins', 'Shell', 'ONGC', 'IOCL',
  'Emerson', 'Honeywell', 'GE', '3M', 'Atlas Copco',
];

export const MOOD_OPTIONS = [
  { val: 1, emoji: '😴', label: 'Drained'  },
  { val: 2, emoji: '😐', label: 'Low'      },
  { val: 3, emoji: '⚡', label: 'Normal'   },
  { val: 4, emoji: '😊', label: 'Good'     },
  { val: 5, emoji: '🔥', label: 'On Fire'  },
];

export const MOOD_MAP = Object.fromEntries(MOOD_OPTIONS.map(m => [m.val, m.emoji]));
