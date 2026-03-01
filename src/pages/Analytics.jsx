import { useMemo, useState }  from 'react';
import { useLogs }             from '../hooks/useLogs';
import { useProfile }          from '../UserContext';
import { Loader }              from '../components/Loader';
import { CustomTooltip }       from '../components/CustomTooltip';
import { SUBJECTS, SUBJECT_LIST, MOOD_MAP } from '../utils/constants';
import { toISO, toDateOnly }   from '../utils/dateUtils';
import CalendarHeatmap         from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

/* ─── Animated number ─── */
function Num({ value, suffix = '', decimals = 0 }) {
  const display = typeof value === 'number'
    ? decimals ? value.toFixed(decimals) : Math.round(value)
    : value;
  return <>{display}{suffix}</>;
}

/* ─── Radial gauge bar ─── */
function RadialBar({ pct, color, size = 56 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray 1s cubic-bezier(.22,1,.36,1)' }}
      />
    </svg>
  );
}

/* ─── Stat Chip ─── */
function StatChip({ label, value, color, icon, sub }) {
  return (
    <div className="an-stat-chip">
      <div className="an-stat-icon" style={{ color }}>{icon}</div>
      <div className="an-stat-value" style={{ color }}>{value}</div>
      <div className="an-stat-label">{label}</div>
      {sub && <div className="an-stat-sub">{sub}</div>}
    </div>
  );
}

/* ─── Section header ─── */
function SectionHead({ eyebrow, title, accent }) {
  return (
    <div className="an-section-head">
      <div className="an-section-eyebrow" style={{ color: accent || 'var(--signal)' }}>
        <span className="an-section-dot" style={{ background: accent || 'var(--signal)' }} />
        {eyebrow}
      </div>
      <div className="an-section-title">{title}</div>
    </div>
  );
}

function EmptyState({ message = 'NO DATA · LOG ENTRIES TO UNLOCK CHARTS' }) {
  return (
    <div className="an-empty">
      <div className="an-empty-icon">◎</div>
      <div>{message}</div>
    </div>
  );
}

export function Analytics() {
  const { logs, loading, weeklyData, moods, heatmap, tMech, tCoding, tHours, subjectStats } = useLogs();
  const { profile } = useProfile();
  const firstName = profile?.nickname || profile?.name?.split(' ')[0] || 'Engineer';

  const subjectChartData = useMemo(() =>
    SUBJECT_LIST.map(s => ({
      name: SUBJECTS[s].abbr, full: s,
      hours: subjectStats[s].completedHours,
      pct: subjectStats[s].pct, color: SUBJECTS[s].color,
    })).sort((a, b) => b.hours - a.hours),
    [subjectStats]
  );

  // Radar chart data — coverage %
  const radarData = useMemo(() =>
    SUBJECT_LIST.map(s => ({
      subject: SUBJECTS[s].abbr,
      coverage: Math.min(100, subjectStats[s].pct),
      fullMark: 100,
    })),
    [subjectStats]
  );

  const pieData = [
    { name: 'Mechanical', value: +tMech.toFixed(1), color: '#ffb020' },
    { name: 'Coding',     value: +tCoding.toFixed(1), color: '#38bdf8' },
  ];

  const totalNumericals = logs.reduce((s, l) => s + (l.numericals || 0), 0);
  const avgMood = logs.filter(l => l.mood).reduce((s, l, _, a) => s + l.mood / a.length, 0);
  const studyDays = new Set(logs.map(l => l.date)).size;
  const codingRatio = tHours > 0 ? (tCoding / tHours * 100) : 0;

  const heatEndDate   = toDateOnly();
  const heatStartDate = new Date(heatEndDate);
  heatStartDate.setFullYear(heatStartDate.getFullYear() - 1);

  if (loading) return <Loader text="COMPUTING ANALYTICS" />;

  return (
    <>
      <style>{`
        /* ── Analytics Page Styles ── */
        .an-page { padding: 28px 28px 80px; max-width: 1100px; }

        /* Page header */
        .an-header {
          margin-bottom: 36px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .an-header-left {}
        .an-eyebrow {
          font-family: var(--ff-mono);
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--signal);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .an-eyebrow::before {
          content: '';
          width: 20px; height: 1px;
          background: linear-gradient(90deg, var(--signal), transparent);
          box-shadow: 0 0 6px var(--signal);
        }
        .an-title {
          font-family: var(--ff-display);
          font-size: clamp(36px, 5vw, 54px);
          letter-spacing: 0.04em;
          color: var(--t0);
          line-height: 0.95;
        }
        .an-title span { color: var(--signal); }
        .an-sub { font-size: 13px; color: var(--t2); margin-top: 6px; line-height: 1.5; }

        /* Live signal badge */
        .an-live-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(0,255,136,0.06);
          border: 1px solid rgba(0,255,136,0.2);
          border-radius: 8px;
          font-family: var(--ff-mono);
          font-size: 10px;
          letter-spacing: 0.14em;
          color: var(--signal);
        }
        .an-live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--signal);
          box-shadow: 0 0 8px var(--signal);
          animation: an-pulse 2s ease-in-out infinite;
        }
        @keyframes an-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        @keyframes an-fade-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes an-scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          20%  { opacity: .6; }
          80%  { opacity: .6; }
          100% { transform: translateY(100%); opacity: 0; }
        }

        /* ── Stat chips strip ── */
        .an-chips-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-bottom: 28px;
        }
        .an-stat-chip {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 16px 14px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all 0.25s cubic-bezier(.22,1,.36,1);
          animation: an-fade-up 0.5s ease both;
          position: relative;
          overflow: hidden;
        }
        .an-stat-chip::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }
        .an-stat-chip:hover {
          border-color: rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.05);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .an-stat-icon { font-size: 18px; line-height: 1; margin-bottom: 2px; }
        .an-stat-value {
          font-family: var(--ff-display);
          font-size: 26px;
          line-height: 1;
          letter-spacing: 0.04em;
        }
        .an-stat-label {
          font-family: var(--ff-mono);
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--t3);
        }
        .an-stat-sub {
          font-family: var(--ff-mono);
          font-size: 10px;
          color: var(--t2);
        }

        /* ── Section heads ── */
        .an-section-head { margin-bottom: 14px; }
        .an-section-eyebrow {
          font-family: var(--ff-mono);
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 4px;
        }
        .an-section-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
        }
        .an-section-title {
          font-family: var(--ff-display);
          font-size: 20px;
          color: var(--t0);
          letter-spacing: 0.06em;
        }

        /* ── Chart cards ── */
        .an-card {
          background: rgba(6,10,18,0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 22px;
          position: relative;
          overflow: hidden;
          animation: an-fade-up 0.5s ease both;
        }
        .an-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        }
        .an-card-accent-tl {
          position: absolute;
          top: 14px; left: 14px;
          width: 18px; height: 18px;
          border-top: 1px solid rgba(0,255,136,0.2);
          border-left: 1px solid rgba(0,255,136,0.2);
        }

        /* Scan line effect inside chart cards */
        .an-card-scan::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 45%, rgba(0,255,136,0.015) 50%, transparent 55%);
          pointer-events: none;
          animation: an-scan 8s ease-in-out infinite;
        }

        /* ── Chart grid layouts ── */
        .an-grid-2-1 {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .an-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .an-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .an-full { margin-bottom: 14px; }

        /* ── Heatmap ── */
        .an-heatmap-wrap { margin-top: 8px; }
        .an-heatmap-wrap .react-calendar-heatmap text {
          font-family: var(--ff-mono) !important;
          font-size: 8px !important;
          fill: var(--t3) !important;
        }
        .an-heatmap-wrap .color-empty { fill: rgba(255,255,255,0.03); }
        .an-heatmap-wrap .color-scale-1 { fill: rgba(0,255,136,0.18); }
        .an-heatmap-wrap .color-scale-2 { fill: rgba(0,255,136,0.42); }
        .an-heatmap-wrap .color-scale-3 { fill: rgba(0,255,136,0.68); }
        .an-heatmap-wrap .color-scale-4 { fill: rgba(0,255,136,1); filter: drop-shadow(0 0 3px rgba(0,255,136,0.6)); }
        .an-heatmap-legend {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 14px;
          font-family: var(--ff-mono);
          font-size: 9px;
          color: var(--t3);
          letter-spacing: 0.06em;
        }

        /* ── Distribution donut center label ── */
        .an-pie-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .an-pie-total {
          font-family: var(--ff-display);
          font-size: 22px;
          color: var(--t0);
          letter-spacing: 0.04em;
        }
        .an-pie-label {
          font-family: var(--ff-mono);
          font-size: 8px;
          letter-spacing: 0.14em;
          color: var(--t3);
          text-transform: uppercase;
        }
        .an-pie-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 10px;
        }
        .an-pie-legend-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: var(--ff-mono);
          font-size: 11px;
          color: var(--t1);
        }
        .an-pie-legend-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
        }

        /* ── Empty state ── */
        .an-empty {
          height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--t3);
          font-family: var(--ff-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .an-empty-icon {
          font-size: 28px;
          opacity: 0.3;
        }

        /* ── Horizontal subject bars ── */
        .an-subject-bars { display: flex; flex-direction: column; gap: 8px; }
        .an-subject-bar-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
        }
        .an-subject-bar-label {
          font-family: var(--ff-mono);
          font-size: 10px;
          color: var(--t2);
          width: 32px;
          flex-shrink: 0;
          text-align: right;
        }
        .an-subject-bar-track {
          flex: 1;
          height: 6px;
          background: rgba(255,255,255,0.04);
          border-radius: 3px;
          overflow: visible;
          position: relative;
        }
        .an-subject-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 1.2s cubic-bezier(.22,1,.36,1);
          position: relative;
        }
        .an-subject-bar-fill::after {
          content: '';
          position: absolute;
          right: -1px; top: -2px;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: inherit;
          filter: blur(3px);
          opacity: 0.7;
        }
        .an-subject-bar-val {
          font-family: var(--ff-mono);
          font-size: 10px;
          color: var(--t2);
          width: 36px;
          flex-shrink: 0;
          text-align: right;
        }

        /* ── Mood dots timeline ── */
        .an-mood-timeline { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 4px; align-items: flex-end; }
        .an-mood-dot { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .an-mood-dot-bar {
          width: 20px;
          border-radius: 2px 2px 0 0;
          background: var(--signal);
          opacity: 0.8;
          transition: opacity 0.15s;
        }
        .an-mood-dot-bar:hover { opacity: 1; }
        .an-mood-dot-label { font-size: 9px; line-height: 1; }

        /* Responsive */
        @media (max-width: 900px) {
          .an-chips-row { grid-template-columns: repeat(3, 1fr); }
          .an-grid-2-1, .an-grid-2, .an-grid-3 { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .an-chips-row { grid-template-columns: repeat(2, 1fr); }
          .an-page { padding: 16px 12px 80px; }
        }
      `}</style>

      <div className="an-page">

        {/* ── Header ── */}
        <div className="an-header">
          <div className="an-header-left">
            <div className="an-eyebrow">Performance Intelligence</div>
            <div className="an-title">
              ANALYTICS<br /><span>COMMAND</span>
            </div>
            <div className="an-sub">Full-spectrum preparation data — {firstName}'s mission intel</div>
          </div>
          <div className="an-live-badge">
            <span className="an-live-dot" />
            LIVE DATA FEED
          </div>
        </div>

        {/* ── Stat chips ── */}
        <div className="an-chips-row">
          {[
            { icon: '⚡', label: 'Total Hours',  value: <Num value={tHours} suffix="h" />, color: '#00ff88', sub: `${studyDays} study days` },
            { icon: '⚙', label: 'Mechanical',   value: <Num value={tMech} suffix="h" />, color: '#ffb020' },
            { icon: '💻', label: 'Coding',       value: <Num value={tCoding} suffix="h" />, color: '#38bdf8' },
            { icon: '🔢', label: 'Numericals',   value: totalNumericals, color: '#a78bfa' },
            { icon: '🎯', label: 'Avg Energy',   value: MOOD_MAP[Math.round(avgMood)] || '—', color: '#f472b6', sub: avgMood ? avgMood.toFixed(1)+'/5' : '' },
          ].map((s, i) => (
            <div key={s.label} className="an-stat-chip" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="an-stat-icon">{s.icon}</div>
              <div className="an-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="an-stat-label">{s.label}</div>
              {s.sub && <div className="an-stat-sub" style={{ color: s.color, opacity: 0.7 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── Row 1: Weekly bars + Radar ── */}
        <div className="an-grid-2-1">
          <div className="an-card an-card-scan" style={{ animationDelay: '0.1s' }}>
            <div className="an-card-accent-tl" />
            <SectionHead eyebrow="Weekly Breakdown" title="Hours by Week" accent="#ffb020" />
            {weeklyData.length === 0 ? <EmptyState /> :
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyData} barGap={3} barSize={9}>
                  <defs>
                    <linearGradient id="mechGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffb020" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ffb020" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="codeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="weekLabel" tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="mech"   name="Mechanical" fill="url(#mechGrad)" radius={[3,3,0,0]} />
                  <Bar dataKey="coding" name="Coding"     fill="url(#codeGrad)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            }
          </div>

          <div className="an-card" style={{ animationDelay: '0.15s' }}>
            <SectionHead eyebrow="Coverage Radar" title="Subject Web" accent="#a78bfa" />
            {subjectStats && Object.values(subjectStats).some(s => s.completedHours > 0)
              ? <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <defs>
                      <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.05} />
                      </radialGradient>
                    </defs>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(148,163,184,0.6)', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Coverage" dataKey="coverage" stroke="#a78bfa" fill="url(#radarFill)" strokeWidth={1.5}
                      dot={{ fill: '#a78bfa', r: 3, strokeWidth: 0 }}
                    />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div style={{ background: 'rgba(11,17,32,0.95)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 8, padding: '8px 12px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#a78bfa' }}>
                          {payload[0]?.payload?.subject}: {payload[0]?.value?.toFixed(0)}%
                        </div>
                      );
                    }} />
                  </RadarChart>
                </ResponsiveContainer>
              : <EmptyState />
            }
          </div>
        </div>

        {/* ── Row 2: Donut + Mood area ── */}
        <div className="an-grid-2">
          {/* Donut */}
          <div className="an-card" style={{ animationDelay: '0.2s' }}>
            <SectionHead eyebrow="Time Split" title="Mech vs Coding" accent="#38bdf8" />
            {tHours === 0 ? <EmptyState /> :
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <defs>
                      <filter id="pieGlow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <Pie data={pieData} dataKey="value" nameKey="name"
                      outerRadius={88} innerRadius={52} paddingAngle={3}
                      strokeWidth={0}
                    >
                      {pieData.map((p, i) => <Cell key={i} fill={p.color} style={{ filter: `drop-shadow(0 0 6px ${p.color}60)` }} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0];
                      return (
                        <div style={{ background: 'rgba(11,17,32,0.95)', border: `1px solid ${p.payload.color}40`, borderRadius: 8, padding: '8px 12px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: p.payload.color }}>
                          {p.name}: {p.value}h ({(p.payload.value / tHours * 100).toFixed(0)}%)
                        </div>
                      );
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center overlay */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--ff-display)', fontSize: '24px', color: 'var(--t0)' }}>{tHours.toFixed(0)}h</div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '8px', color: 'var(--t3)', letterSpacing: '0.14em' }}>TOTAL</div>
                  </div>
                </div>
              </div>
            }
            <div className="an-pie-legend">
              {pieData.map(p => (
                <div key={p.name} className="an-pie-legend-item">
                  <div className="an-pie-legend-dot" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}60` }} />
                  {p.name}: {p.value}h
                </div>
              ))}
            </div>
          </div>

          {/* Mood area */}
          <div className="an-card an-card-scan" style={{ animationDelay: '0.25s' }}>
            <SectionHead eyebrow="Energy Tracking" title="Mood / Energy — 21 Days" accent="#00ff88" />
            {moods.length === 0 ? <EmptyState /> :
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={moods} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#00ff88" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#00ff88" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 8, fontFamily: 'IBM Plex Mono, monospace' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} ticks={[1,2,3,4,5]}
                    tickFormatter={v => ['','😴','😐','⚡','😊','🔥'][v] || v}
                    tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const m = payload[0]?.value;
                    return (
                      <div style={{ background: 'rgba(11,17,32,0.95)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 8, padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace' }}>
                        <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.5)', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 22 }}>{MOOD_MAP[m] || m}</div>
                      </div>
                    );
                  }} />
                  <Area type="monotone" dataKey="mood" stroke="#00ff88" strokeWidth={2}
                    fill="url(#moodGrad)"
                    dot={{ fill: '#00ff88', r: 3, strokeWidth: 0, filter: 'drop-shadow(0 0 4px #00ff88)' }}
                    activeDot={{ r: 5, fill: '#00ff88', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            }
          </div>
        </div>

        {/* ── Row 3: Subject bars (custom) ── */}
        <div className="an-card an-full" style={{ animationDelay: '0.3s' }}>
          <div className="an-card-accent-tl" />
          <SectionHead eyebrow="Subject Progress" title="Coverage by Subject" accent="#ffb020" />
          {subjectChartData.every(s => s.hours === 0) ? <EmptyState message="NO HOURS LOGGED · START STUDYING" /> :
            <div className="an-subject-bars" style={{ marginTop: '8px' }}>
              {subjectChartData.map((s, i) => (
                <div key={s.name} className="an-subject-bar-row" style={{ animationDelay: `${0.3 + i * 0.05}s` }}>
                  <div className="an-subject-bar-label">{s.name}</div>
                  <div className="an-subject-bar-track">
                    <div className="an-subject-bar-fill"
                      style={{ width: `${Math.min(100, s.pct)}%`, background: `linear-gradient(90deg, ${s.color}bb, ${s.color})`, boxShadow: `0 0 8px ${s.color}40` }}
                    />
                  </div>
                  <div className="an-subject-bar-val">{s.hours.toFixed(1)}h</div>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '10px', color: s.color, width: '36px', textAlign: 'right', flexShrink: 0 }}>
                    {s.pct.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        {/* ── Row 4: Heatmap ── */}
        <div className="an-card an-full" style={{ animationDelay: '0.35s' }}>
          <SectionHead eyebrow="Consistency" title="Daily Activity — Last 365 Days" accent="#00ff88" />
          <div className="an-heatmap-wrap">
            <CalendarHeatmap
              startDate={heatStartDate}
              endDate={heatEndDate}
              values={heatmap}
              classForValue={val => {
                if (!val || val.count === 0) return 'color-empty';
                return `color-scale-${val.count}`;
              }}
              tooltipDataAttrs={val => ({
                'data-tip': val?.date
                  ? `${val.date}: ${val.count === 0 ? '0h' : val.count === 1 ? '<2h' : val.count === 2 ? '2–4h' : val.count === 3 ? '4–6h' : '6h+'}`
                  : '',
              })}
              showWeekdayLabels
            />
          </div>
          <div className="an-heatmap-legend">
            <span>Less</span>
            {[
              'rgba(255,255,255,0.03)',
              'rgba(0,255,136,0.18)',
              'rgba(0,255,136,0.42)',
              'rgba(0,255,136,0.68)',
              'rgba(0,255,136,1)',
            ].map((c, i) => (
              <svg key={i} width="12" height="12" viewBox="0 0 12 12">
                <rect width="12" height="12" rx="2" fill={c} />
              </svg>
            ))}
            <span>More</span>
            <span style={{ marginLeft: 12 }}>0h · &lt;2h · 2–4h · 4–6h · 6h+</span>
          </div>
        </div>

        {/* ── Row 5: Numericals ── */}
        <div className="an-card an-full" style={{ animationDelay: '0.4s' }}>
          <SectionHead eyebrow="Practice Depth" title="Numericals Solved per Subject" accent="#a78bfa" />
          {(() => {
            const numData = SUBJECT_LIST
              .map(s => ({
                name: SUBJECTS[s].abbr, full: s,
                nums: logs.filter(l => l.subject === s).reduce((a, l) => a + (l.numericals || 0), 0),
                color: SUBJECTS[s].color,
              }))
              .filter(s => s.nums > 0)
              .sort((a, b) => b.nums - a.nums);
            if (!numData.length)
              return <EmptyState message="No numericals logged yet" />;
            return (
              <div className="an-subject-bars" style={{ marginTop: '8px' }}>
                {numData.map(s => {
                  const max = numData[0].nums;
                  return (
                    <div key={s.name} className="an-subject-bar-row">
                      <div className="an-subject-bar-label">{s.name}</div>
                      <div className="an-subject-bar-track">
                        <div className="an-subject-bar-fill"
                          style={{ width: `${(s.nums / max) * 100}%`, background: `linear-gradient(90deg, ${s.color}bb, ${s.color})`, boxShadow: `0 0 8px ${s.color}40` }}
                        />
                      </div>
                      <div className="an-subject-bar-val">{s.nums}</div>
                      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', color: 'var(--t3)', width: '60px', flexShrink: 0 }}>problems</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

      </div>
    </>
  );
}
