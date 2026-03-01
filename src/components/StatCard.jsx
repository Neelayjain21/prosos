/**
 * StatCard — displays a single metric with label and optional sublabel.
 */
export function StatCard({ label, value, sub, accentClass = '', colorVar = 'var(--t0)', cardClass = '' }) {
  return (
    <div className={`card card-sm ${cardClass}`}>
      <div className="label" style={{ marginBottom: '10px' }}>{label}</div>
      <div
        className="big-num"
        style={{ color: colorVar, lineHeight: 1, marginBottom: sub ? '4px' : 0 }}
      >
        {value}
      </div>
      {sub && <div className="mono-xs" style={{ color: 'var(--t2)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}
