import { useMemo, useState } from 'react';
import { useLogs }            from '../hooks/useLogs';
import { useProfile }         from '../UserContext';
import { Loader }             from '../components/Loader';
import { SUBJECTS, SUBJECT_LIST } from '../utils/constants';
import { fmtShort }           from '../utils/dateUtils';

/* ─── Radial arc SVG ─── */
function ArcProgress({ pct, color, size = 88 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
      {/* Background glow track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7" opacity="0.06"
        strokeDasharray={`${circ} ${circ}`}
      />
      {/* Fill */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 5px ${color}80)`, transition: 'stroke-dasharray 1.2s cubic-bezier(.22,1,.36,1)' }}
      />
      {/* Tick marks every 25% */}
      {[0, 25, 50, 75].map(p => {
        const angle = (p / 100) * Math.PI * 2;
        const x1 = cx + (r - 4) * Math.cos(angle);
        const y1 = cy + (r - 4) * Math.sin(angle);
        const x2 = cx + (r + 4) * Math.cos(angle);
        const y2 = cy + (r + 4) * Math.sin(angle);
        return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
      })}
    </svg>
  );
}

/* ─── Days since indicator ─── */
function DaysSince({ lastSeen }) {
  if (!lastSeen) return (
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', color: 'rgba(255,68,68,0.7)', letterSpacing: '0.08em' }}>
      NEVER STUDIED
    </span>
  );
  const days = Math.floor((Date.now() - new Date(lastSeen)) / 86400000);
  const color = days === 0 ? '#00ff88' : days < 3 ? '#00ff88' : days < 7 ? '#ffb020' : days < 10 ? '#f97316' : '#ff4444';
  const label = days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days}d ago`;
  return (
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', color, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}` }} />
      {label}
    </span>
  );
}

/* ─── Subject card ─── */
function SubjectCard({ name, stats, index }) {
  const { completedHours, pct, lastSeen, neglected, target } = stats;
  const color = SUBJECTS[name].color;
  const abbr  = SUBJECTS[name].abbr;
  const isComplete = pct >= 100;
  const remaining = Math.max(0, target - completedHours);
  const days = lastSeen ? Math.floor((Date.now() - new Date(lastSeen)) / 86400000) : 999;

  const urgencyLevel = neglected ? 'critical' : days > 7 ? 'warning' : isComplete ? 'done' : 'normal';

  return (
    <div className={`sj-card sj-card--${urgencyLevel}`}
      style={{
        animationDelay: `${index * 0.06}s`,
        '--accent': color,
      }}
    >
      {/* Left accent bar */}
      <div className="sj-card-bar" style={{ background: color, boxShadow: `0 0 12px ${color}60` }} />

      {/* Card body */}
      <div className="sj-card-body">

        {/* Top: name + badges */}
        <div className="sj-card-top">
          <div>
            <div className="sj-card-name">{name}</div>
            <div className="sj-card-abbr" style={{ color }}>
              {abbr} · {target}h target
            </div>
          </div>
          <div className="sj-badges">
            {neglected && (
              <span className="sj-badge sj-badge--critical">
                ⚠ NEGLECTED
              </span>
            )}
            {isComplete && (
              <span className="sj-badge sj-badge--done">
                ✓ MASTERED
              </span>
            )}
            {!neglected && !isComplete && days === 0 && (
              <span className="sj-badge sj-badge--active">
                ◉ ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Middle: arc + stats */}
        <div className="sj-card-mid">
          {/* Arc progress */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArcProgress pct={pct} color={color} size={80} />
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--ff-display)', fontSize: '17px', color, lineHeight: 1 }}>
                {pct.toFixed(0)}
              </div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '7px', color: 'rgba(148,163,184,0.5)', letterSpacing: '0.1em' }}>PCT</div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="sj-stat-grid">
            <div className="sj-stat">
              <div className="sj-stat-val" style={{ color }}>{completedHours.toFixed(1)}h</div>
              <div className="sj-stat-lbl">logged</div>
            </div>
            <div className="sj-stat">
              <div className="sj-stat-val" style={{ color: remaining > 0 ? 'var(--t1)' : 'var(--signal)' }}>
                {remaining > 0 ? remaining.toFixed(1) + 'h' : '✓'}
              </div>
              <div className="sj-stat-lbl">remaining</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="sj-prog-track">
          <div className="sj-prog-fill"
            style={{
              width: `${Math.min(100, pct)}%`,
              background: `linear-gradient(90deg, ${color}80, ${color})`,
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
          {/* Target markers at 25%, 50%, 75% */}
          {[25, 50, 75].map(m => (
            <div key={m} className="sj-prog-mark" style={{ left: `${m}%` }} />
          ))}
        </div>

        {/* Bottom: last seen */}
        <div className="sj-card-footer">
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', color: 'var(--t3)', letterSpacing: '0.06em' }}>
            Last studied:
          </div>
          <DaysSince lastSeen={lastSeen} />
        </div>
      </div>
    </div>
  );
}

/* ─── Summary hexagon chip ─── */
function HexChip({ label, value, color, sub }) {
  return (
    <div className="sj-hex-chip">
      <div className="sj-hex-value" style={{ color }}>{value}</div>
      <div className="sj-hex-label">{label}</div>
      {sub && <div className="sj-hex-sub">{sub}</div>}
    </div>
  );
}

/* ─── Mastery ladder ─── */
function MasteryLadder({ subjectStats }) {
  const sorted = SUBJECT_LIST
    .map(s => ({ name: s, abbr: SUBJECTS[s].abbr, pct: subjectStats[s].pct, color: SUBJECTS[s].color }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="sj-ladder">
      {sorted.map((s, i) => (
        <div key={s.name} className="sj-ladder-row">
          <div className="sj-ladder-rank" style={{ color: i < 3 ? s.color : 'var(--t3)' }}>
            {i === 0 ? '▲' : i === 1 ? '◆' : i === 2 ? '●' : String(i + 1).padStart(2, '0')}
          </div>
          <div className="sj-ladder-abbr" style={{ color: s.color }}>{s.abbr}</div>
          <div className="sj-ladder-name">{s.name}</div>
          <div className="sj-ladder-track">
            <div className="sj-ladder-fill"
              style={{ width: `${Math.min(100, s.pct)}%`, background: s.color, boxShadow: `0 0 6px ${s.color}50` }}
            />
          </div>
          <div className="sj-ladder-pct" style={{ color: s.pct >= 100 ? '#00ff88' : s.color }}>
            {s.pct.toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════ MAIN ═══════════════════════ */
export function Subjects() {
  const { subjectStats, loading, tHours } = useLogs();
  const { profile } = useProfile();
  const [sortBy, setSortBy] = useState('default'); // default | pct | neglected
  const firstName = profile?.nickname || profile?.name?.split(' ')[0] || 'Engineer';

  if (loading) return <Loader text="COMPUTING SUBJECT DATA" />;

  const neglectedCount  = SUBJECT_LIST.filter(s => subjectStats[s]?.neglected).length;
  const masteredCount   = SUBJECT_LIST.filter(s => subjectStats[s]?.pct >= 100).length;
  const totalCompletion = (SUBJECT_LIST.reduce((sum, s) => sum + subjectStats[s].pct, 0) / SUBJECT_LIST.length);
  const activeToday     = SUBJECT_LIST.filter(s => {
    const ls = subjectStats[s]?.lastSeen;
    return ls && Math.floor((Date.now() - new Date(ls)) / 86400000) === 0;
  }).length;

  const sortedSubjects = useMemo(() => {
    const list = [...SUBJECT_LIST];
    if (sortBy === 'pct')       return list.sort((a, b) => subjectStats[a].pct - subjectStats[b].pct);
    if (sortBy === 'pct-desc')  return list.sort((a, b) => subjectStats[b].pct - subjectStats[a].pct);
    if (sortBy === 'neglected') return list.sort((a, b) => (subjectStats[b].neglected ? 1 : 0) - (subjectStats[a].neglected ? 1 : 0));
    if (sortBy === 'hours')     return list.sort((a, b) => subjectStats[b].completedHours - subjectStats[a].completedHours);
    return list;
  }, [sortBy, subjectStats]);

  return (
    <>
      <style>{`
        @keyframes sj-fade-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sj-glow-pulse {
          0%,100% { box-shadow: 0 0 0 0 var(--accent, rgba(0,255,136,0.3)); }
          50%      { box-shadow: 0 0 0 6px transparent; }
        }
        @keyframes sj-scan {
          0%   { top: 0; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        /* ── Page layout ── */
        .sj-page { padding: 28px 28px 80px; max-width: 1100px; }

        /* ── Header ── */
        .sj-header { margin-bottom: 32px; }
        .sj-eyebrow {
          font-family: var(--ff-mono); font-size: 10px; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--cyan);
          display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
        }
        .sj-eyebrow::before {
          content: ''; width: 20px; height: 1px;
          background: linear-gradient(90deg, var(--cyan), transparent);
          box-shadow: 0 0 6px var(--cyan);
        }
        .sj-title {
          font-family: var(--ff-display); font-size: clamp(36px, 5vw, 54px);
          letter-spacing: 0.04em; color: var(--t0); line-height: 0.95;
        }
        .sj-title span { color: var(--cyan); }
        .sj-sub { font-size: 13px; color: var(--t2); margin-top: 6px; }

        /* ── Summary chips ── */
        .sj-chips {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 10px; margin-bottom: 28px;
        }
        .sj-hex-chip {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 16px 14px;
          text-align: center; display: flex; flex-direction: column;
          align-items: center; gap: 4px;
          animation: sj-fade-up 0.5s ease both;
          position: relative; overflow: hidden;
          transition: all 0.25s cubic-bezier(.22,1,.36,1);
        }
        .sj-hex-chip::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }
        .sj-hex-chip:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.05); }
        .sj-hex-value { font-family: var(--ff-display); font-size: 30px; line-height: 1; letter-spacing: 0.04em; }
        .sj-hex-label { font-family: var(--ff-mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--t3); }
        .sj-hex-sub   { font-family: var(--ff-mono); font-size: 10px; color: var(--t2); }

        /* ── Alert ── */
        .sj-alert {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 18px;
          background: rgba(255,68,68,0.06); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,68,68,0.22);
          border-left: 3px solid #ff4444;
          border-radius: 12px; margin-bottom: 24px;
          font-family: var(--ff-mono); font-size: 11px; color: #ff4444;
          letter-spacing: 0.04em; line-height: 1.6;
          animation: sj-fade-up 0.4s ease both;
        }
        .sj-alert-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

        /* ── Sort controls ── */
        .sj-controls {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
        }
        .sj-section-title { font-family: var(--ff-display); font-size: 22px; letter-spacing: 0.06em; color: var(--t0); }
        .sj-sort-row { display: flex; gap: 6px; }
        .sj-sort-btn {
          padding: 5px 12px; border-radius: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          font-family: var(--ff-mono); font-size: 9px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--t3);
          cursor: pointer; transition: all 0.15s;
        }
        .sj-sort-btn:hover { border-color: rgba(255,255,255,0.15); color: var(--t1); }
        .sj-sort-btn.active { background: rgba(56,189,248,0.1); border-color: rgba(56,189,248,0.3); color: var(--cyan); }

        /* ── Subject cards grid ── */
        .sj-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 28px; }

        .sj-card {
          background: rgba(6,10,18,0.75);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; overflow: hidden;
          display: flex;
          animation: sj-fade-up 0.5s ease both;
          transition: all 0.25s cubic-bezier(.22,1,.36,1);
          position: relative;
        }
        .sj-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
        }
        .sj-card:hover {
          border-color: rgba(255,255,255,0.13);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
        }
        .sj-card--critical {
          border-color: rgba(255,68,68,0.2);
          background: rgba(255,68,68,0.03);
        }
        .sj-card--critical:hover { border-color: rgba(255,68,68,0.35); }
        .sj-card--done {
          border-color: rgba(0,255,136,0.15);
        }

        .sj-card-bar {
          width: 3px; flex-shrink: 0;
          border-radius: 0;
          transition: width 0.2s;
        }
        .sj-card:hover .sj-card-bar { width: 4px; }

        .sj-card-body { flex: 1; padding: 18px 18px 14px; display: flex; flex-direction: column; gap: 12px; }

        .sj-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .sj-card-name { font-size: 15px; font-weight: 600; color: var(--t0); line-height: 1.2; margin-bottom: 3px; }
        .sj-card-abbr { font-family: var(--ff-mono); font-size: 10px; letter-spacing: 0.08em; }

        .sj-badges { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
        .sj-badge {
          font-family: var(--ff-mono); font-size: 9px; letter-spacing: 0.1em;
          padding: 2px 8px; border-radius: 4px;
        }
        .sj-badge--critical { background: rgba(255,68,68,0.12); color: #ff4444; border: 1px solid rgba(255,68,68,0.25); }
        .sj-badge--done     { background: rgba(0,255,136,0.1);  color: #00ff88; border: 1px solid rgba(0,255,136,0.25); }
        .sj-badge--active   { background: rgba(0,255,136,0.07); color: #00ff88; border: 1px solid rgba(0,255,136,0.18); }

        .sj-card-mid { display: flex; align-items: center; gap: 16px; }

        .sj-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; flex: 1; }
        .sj-stat { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 8px 10px; }
        .sj-stat-val { font-family: var(--ff-display); font-size: 18px; letter-spacing: 0.04em; line-height: 1; }
        .sj-stat-lbl { font-family: var(--ff-mono); font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--t3); margin-top: 2px; }

        /* Progress bar */
        .sj-prog-track {
          height: 4px; background: rgba(255,255,255,0.04); border-radius: 2px;
          position: relative; overflow: visible;
        }
        .sj-prog-fill { height: 100%; border-radius: 2px; transition: width 1.2s cubic-bezier(.22,1,.36,1); }
        .sj-prog-mark {
          position: absolute; top: -3px; width: 1px; height: 10px;
          background: rgba(255,255,255,0.1);
        }

        .sj-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: -4px; }

        /* ── Mastery ladder ── */
        .sj-ladder-card {
          background: rgba(6,10,18,0.75); backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 22px;
          animation: sj-fade-up 0.5s ease 0.3s both;
          position: relative; overflow: hidden;
        }
        .sj-ladder-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(56,189,248,0.2), transparent);
        }
        .sj-ladder-head {
          font-family: var(--ff-display); font-size: 20px;
          letter-spacing: 0.06em; color: var(--t0); margin-bottom: 18px;
        }
        .sj-ladder { display: flex; flex-direction: column; gap: 10px; }
        .sj-ladder-row {
          display: flex; align-items: center; gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .sj-ladder-row:last-child { border-bottom: none; }
        .sj-ladder-rank {
          font-family: var(--ff-mono); font-size: 11px; width: 20px;
          text-align: center; flex-shrink: 0;
        }
        .sj-ladder-abbr {
          font-family: var(--ff-mono); font-size: 10px; letter-spacing: 0.06em;
          width: 32px; flex-shrink: 0;
        }
        .sj-ladder-name {
          font-size: 12px; color: var(--t1); flex: 0 0 160px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sj-ladder-track {
          flex: 1; height: 4px; background: rgba(255,255,255,0.04);
          border-radius: 2px; overflow: hidden;
        }
        .sj-ladder-fill { height: 100%; border-radius: 2px; transition: width 1.2s cubic-bezier(.22,1,.36,1); }
        .sj-ladder-pct { font-family: var(--ff-mono); font-size: 11px; width: 36px; text-align: right; flex-shrink: 0; }

        /* ── Target ref strip ── */
        .sj-ref-card {
          background: rgba(6,10,18,0.75); backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 22px;
          margin-top: 14px; animation: sj-fade-up 0.5s ease 0.4s both;
        }
        .sj-ref-head { font-family: var(--ff-display); font-size: 20px; letter-spacing: 0.06em; color: var(--t0); margin-bottom: 16px; }
        .sj-ref-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; }
        .sj-ref-item { text-align: center; padding: 10px 6px; background: rgba(255,255,255,0.025); border-radius: 8px; }
        .sj-ref-hrs { font-family: var(--ff-display); font-size: 20px; line-height: 1; }
        .sj-ref-abbr { font-family: var(--ff-mono); font-size: 8px; letter-spacing: 0.1em; color: var(--t3); margin-top: 3px; }

        /* Responsive */
        @media (max-width: 900px) {
          .sj-grid   { grid-template-columns: 1fr; }
          .sj-chips  { grid-template-columns: repeat(2, 1fr); }
          .sj-ref-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 600px) {
          .sj-page { padding: 16px 12px 80px; }
          .sj-ladder-name { flex: 0 0 100px; }
        }
      `}</style>

      <div className="sj-page">

        {/* ── Header ── */}
        <div className="sj-header">
          <div className="sj-eyebrow">Mission Intel</div>
          <div className="sj-title">SUBJECT<br /><span>COMMAND</span></div>
          <div className="sj-sub">{firstName}'s mastery status across all 8 core subjects</div>
        </div>

        {/* ── Summary chips ── */}
        <div className="sj-chips">
          {[
            { label: 'Avg Completion', value: totalCompletion.toFixed(0) + '%', color: 'var(--cyan)', animDelay: '0s', sub: `${tHours.toFixed(0)}h total` },
            { label: 'Mastered',       value: masteredCount,                    color: 'var(--signal)', animDelay: '0.06s', sub: `of 8 subjects` },
            { label: 'Neglected',      value: neglectedCount,                   color: neglectedCount > 0 ? 'var(--red)' : 'var(--signal)', animDelay: '0.12s', sub: neglectedCount > 0 ? '10+ days idle' : 'All active' },
            { label: 'Active Today',   value: activeToday,                      color: 'var(--amber)', animDelay: '0.18s', sub: activeToday > 0 ? 'subjects' : '—' },
          ].map((c, i) => (
            <div key={c.label} className="sj-hex-chip" style={{ animationDelay: c.animDelay }}>
              <div className="sj-hex-value" style={{ color: c.color }}>{c.value}</div>
              <div className="sj-hex-label">{c.label}</div>
              <div className="sj-hex-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Neglect alert ── */}
        {neglectedCount > 0 && (
          <div className="sj-alert">
            <span className="sj-alert-icon">⚠</span>
            <div>
              <strong>{neglectedCount} subject{neglectedCount > 1 ? 's' : ''} neglected</strong> — not studied in 10+ days.
              Neglected subjects carry a −20% penalty on your Readiness Score. Log a session to recover.
            </div>
          </div>
        )}

        {/* ── Sort controls + section title ── */}
        <div className="sj-controls">
          <div className="sj-section-title">Subject Intel Cards</div>
          <div className="sj-sort-row">
            {[
              { id: 'default',   label: 'Default' },
              { id: 'pct',       label: '↑ Weakest' },
              { id: 'pct-desc',  label: '↓ Strongest' },
              { id: 'neglected', label: '⚠ Neglected' },
              { id: 'hours',     label: '↓ Hours' },
            ].map(s => (
              <button key={s.id}
                className={`sj-sort-btn ${sortBy === s.id ? 'active' : ''}`}
                onClick={() => setSortBy(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Subject grid ── */}
        <div className="sj-grid">
          {sortedSubjects.map((subj, i) => (
            <SubjectCard key={subj} name={subj} stats={subjectStats[subj]} index={i} />
          ))}
        </div>

        {/* ── Two column: Ladder + Ref ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
          {/* Mastery ladder */}
          <div className="sj-ladder-card">
            <div className="sj-ladder-head">🏆 Mastery Leaderboard</div>
            <MasteryLadder subjectStats={subjectStats} />
          </div>

          {/* Target hours reference */}
          <div className="sj-ref-card">
            <div className="sj-ref-head">📌 Target Hours</div>
            <div className="sj-ref-grid">
              {SUBJECT_LIST.map(s => (
                <div key={s} className="sj-ref-item">
                  <div className="sj-ref-hrs" style={{ color: SUBJECTS[s].color }}>{SUBJECTS[s].target}h</div>
                  <div className="sj-ref-abbr">{SUBJECTS[s].abbr}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
