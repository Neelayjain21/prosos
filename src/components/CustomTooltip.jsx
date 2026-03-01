/**
 * CustomTooltip — consistent tooltip style for all Recharts charts.
 */
export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   'var(--bg2)',
      border:       '1px solid var(--b2)',
      borderRadius: 'var(--r)',
      padding:      '10px 14px',
      boxShadow:    'var(--sh)',
    }}>
      {label && (
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '10px', color: 'var(--t2)', marginBottom: '6px', letterSpacing: '0.06em' }}>
          {label}
        </div>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--ff-mono)', fontSize: '12px', marginBottom: '2px' }}>
          <span style={{ color: p.color, fontSize: '8px' }}>■</span>
          <span style={{ color: 'var(--t1)' }}>{p.name}:</span>
          <span style={{ color: 'var(--t0)', fontWeight: 700 }}>
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
