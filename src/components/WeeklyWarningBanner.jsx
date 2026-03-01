import { weeklyWarning } from '../utils/scoring';

/**
 * WeeklyWarningBanner
 * Computes and displays smart nudges about weekly pace.
 */
export function WeeklyWarningBanner({ weeklyMech, weeklyCoding, daysIntoWeek }) {
  const { status, messages } = weeklyWarning(weeklyMech, weeklyCoding, daysIntoWeek);

  const alertClass = {
    ok:     'alert-signal',
    warn:   'alert-warn',
    behind: 'alert-danger',
  }[status];

  const icon = {
    ok:     '✓',
    warn:   '⚠',
    behind: '↓',
  }[status];

  return (
    <div className="stack-sm">
      {messages.map((msg, i) => (
        <div key={i} className={`alert ${alertClass}`}>
          <span style={{ fontWeight: 700, flexShrink: 0 }}>{icon}</span>
          <span>{msg}</span>
        </div>
      ))}
    </div>
  );
}
