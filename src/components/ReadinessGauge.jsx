import { scoreTier } from '../utils/scoring';

/**
 * ReadinessGauge — SVG arc ring showing the readiness score.
 * Rendered at the top of the Dashboard.
 */
export function ReadinessGauge({ score, breakdown }) {
  const R        = 80;
  const stroke   = 10;
  const cx       = 100;
  const cy       = 100;
  const circumf  = 2 * Math.PI * R;
  const pct      = Math.min(100, Math.max(0, score)) / 100;
  const dash     = pct * circumf;
  const { label, color } = scoreTier(score);

  const BREAKDOWN_LABELS = {
    subjectCompletion: 'Subjects',
    weeklyConsistency: 'Consistency',
    codingFocus:       'Coding Focus',
    moodStability:     'Mood',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
      {/* Ring */}
      <div className="score-ring" style={{ width: 200, height: 200 }}>
        <svg width="200" height="200">
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke="var(--bg3)"
            strokeWidth={stroke}
          />
          {/* Fill */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumf}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}55)`, transition: 'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        {/* Center text */}
        <div className="score-center">
          <div
            style={{
              fontFamily: 'var(--ff-display)',
              fontSize: '52px',
              lineHeight: 1,
              color,
              filter: `drop-shadow(0 0 10px ${color}66)`,
            }}
          >
            {Math.round(score)}
          </div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', letterSpacing: '0.2em', color: 'var(--t2)', textTransform: 'uppercase', marginTop: '4px' }}>
            / 100
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '10px', letterSpacing: '0.2em', color, textTransform: 'uppercase', marginBottom: '6px' }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--t1)', marginBottom: '20px' }}>
          Placement Readiness Score
        </div>
        <div className="stack-sm">
          {Object.entries(breakdown).map(([key, { score: s, weight }]) => (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 60px', gap: '10px', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '10px', color: 'var(--t2)', letterSpacing: '0.04em' }}>
                {BREAKDOWN_LABELS[key]}
              </div>
              <div className="prog-track">
                <div
                  className="prog-fill"
                  style={{ width: `${s}%`, background: color }}
                />
              </div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '11px', color: 'var(--t1)', textAlign: 'right' }}>
                {s.toFixed(0)}<span style={{ color: 'var(--t3)', fontSize: '9px' }}> ×{weight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
