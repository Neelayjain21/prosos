// ═══════════════════════════════════════════════════════════════
//  Onboarding — Enhanced glassmorphism + custom deadline picker
//  Multi-step: Step 1 = identity, Step 2 = academic + deadline
//              Step 3 = mission targets
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useProfile } from '../UserContext';
import { auth } from '../firebase';
import { TARGET_COMPANIES } from '../utils/constants';

const STEPS = [
  { num: 1, label: 'Identity',  icon: '◈' },
  { num: 2, label: 'Academic',  icon: '◉' },
  { num: 3, label: 'Targets',   icon: '✦' },
];

const DEADLINE_PRESETS = [
  { id: 'campus_aug', label: 'Campus Placements', sublabel: 'Aug season', icon: '🎓',
    getDate: () => { const d = new Date(); d.setFullYear(d.getFullYear() + (d.getMonth() >= 6 ? 1 : 0)); d.setMonth(6, 1); return d; } },
  { id: 'campus_nov', label: 'Campus Season 2',   sublabel: 'Oct–Nov',    icon: '🏫',
    getDate: () => { const d = new Date(); d.setFullYear(d.getFullYear() + (d.getMonth() >= 9 ? 1 : 0)); d.setMonth(9, 1); return d; } },
  { id: 'offcampus',  label: 'Off-Campus Drive',  sublabel: '3 months',   icon: '🏢',
    getDate: () => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d; } },
  { id: 'internship', label: 'Internship Season',  sublabel: '6 weeks',    icon: '💼',
    getDate: () => { const d = new Date(); d.setDate(d.getDate() + 42); return d; } },
];

function DeadlinePicker({ value, onChange }) {
  const today = new Date();
  const selected = value ? new Date(value) : null;
  const daysLeft = selected ? Math.ceil((selected - today) / 86400000) : null;
  const urgency = daysLeft === null ? null
    : daysLeft < 30  ? { color: '#ff4444', label: 'CRITICAL' }
    : daysLeft < 60  ? { color: '#ffb020', label: 'URGENT' }
    : daysLeft < 120 ? { color: '#38bdf8', label: 'MODERATE' }
    :                  { color: '#00ff88', label: 'COMFORTABLE' };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {DEADLINE_PRESETS.map(p => (
          <button key={p.id} className="dl-preset-card"
            onClick={() => onChange(p.getDate().toISOString().split('T')[0])}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{p.icon}</span>
            <div>
              <div className="dl-preset-name">{p.label}</div>
              <div className="dl-preset-sub">{p.sublabel}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input type="date" className="ob-input" value={value}
          min={today.toISOString().split('T')[0]}
          onChange={e => onChange(e.target.value)}
          style={{ flex: 1 }} />
        {urgency && (
          <div className="dl-urgency-badge" style={{ '--uc': urgency.color }}>
            <span className="dl-urgency-dot" style={{ background: urgency.color, boxShadow: `0 0 8px ${urgency.color}` }} />
            <span style={{ color: urgency.color }}>{urgency.label}</span>
          </div>
        )}
      </div>

      {selected && daysLeft > 0 && (
        <div className="dl-countdown">
          {[
            { n: daysLeft,             c: urgency?.color,  l: 'days remaining'  },
            { n: Math.ceil(daysLeft * 4.5), c: '#38bdf8',  l: 'target hours'   },
            { n: Math.floor(daysLeft/7), c: '#ffb020',     l: 'weeks to grind'  },
          ].map((item, i) => (
            <div key={i} className="dl-countdown-inner">
              <div className="dl-countdown-num" style={{ color: item.c }}>{item.n}</div>
              <div className="dl-countdown-label">{item.l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Onboarding() {
  const { saveProfile } = useProfile();
  const [step,   setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [form,   setForm]   = useState({
    name: '', nickname: '',
    college: '', branch: 'Mechanical Engineering', cgpa: '', year: '3rd Year',
    placementDeadline: '',
    targetCompanies: [], targetRole: '', motivation: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleCompany = (c) => setForm(f => ({
    ...f,
    targetCompanies: f.targetCompanies.includes(c)
      ? f.targetCompanies.filter(x => x !== c)
      : [...f.targetCompanies, c],
  }));

  const next = () => {
    setError('');
    if (step === 1 && !form.name.trim()) { setError('Name is required.'); return; }
    if (step === 2 && !form.college.trim()) { setError('College is required.'); return; }
    if (step < 3) setStep(s => s + 1);
  };

  const finish = async () => {
    if (!form.motivation.trim()) { setError('Tell us what drives you!'); return; }
    setSaving(true);
    try {
      const deadline = form.placementDeadline
        ? new Date(form.placementDeadline).toISOString()
        : new Date(2026, 6, 1).toISOString();
      await saveProfile({
        ...form, placementDeadline: deadline,
        email: auth.currentUser?.email || '',
        photoURL: auth.currentUser?.photoURL || '',
        joinedAt: new Date().toISOString(),
      });
    } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

        :root {
          --ff-mono: 'IBM Plex Mono', monospace;
          --ff-display: 'Bebas Neue', sans-serif;
          --ff-body: 'DM Sans', sans-serif;
        }
        @keyframes ob-in    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ob-step  { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,.3)} 50%{box-shadow:0 0 0 8px rgba(0,255,136,0)} }
        @keyframes aurora   { 0%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes count-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .ob-root {
          min-height:100vh; background:#02040a;
          display:flex; align-items:center; justify-content:center;
          padding:24px; font-family:var(--ff-body); position:relative; overflow:hidden;
        }
        .ob-aurora {
          position:fixed; inset:0; pointer-events:none;
          background:
            radial-gradient(ellipse 70% 50% at 15% 10%,rgba(0,255,136,.09) 0%,transparent 55%),
            radial-gradient(ellipse 50% 40% at 85% 80%,rgba(56,189,248,.07) 0%,transparent 55%),
            radial-gradient(ellipse 40% 30% at 50% 50%,rgba(167,139,250,.05) 0%,transparent 60%);
          animation:aurora 18s ease-in-out infinite alternate;
        }
        .ob-grid {
          position:fixed; inset:0; pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px);
          background-size:40px 40px;
          mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%);
          -webkit-mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%);
        }
        .ob-wrap {
          width:100%; max-width:580px; position:relative; z-index:1;
          animation:ob-in .7s cubic-bezier(.22,1,.36,1) both;
        }
        .ob-steps { display:flex; align-items:center; margin-bottom:32px; }
        .ob-step { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; position:relative; }
        .ob-step:not(:last-child)::after {
          content:''; position:absolute; top:18px; left:50%; width:100%; height:1px;
          background:rgba(255,255,255,.06); transition:background .4s;
        }
        .ob-step.done:not(:last-child)::after,
        .ob-step.active:not(:last-child)::after {
          background:linear-gradient(90deg,rgba(0,255,136,.5),rgba(0,255,136,.1));
        }
        .ob-step-dot {
          width:36px; height:36px; border-radius:50%;
          background:rgba(255,255,255,.03); backdrop-filter:blur(10px);
          border:1px solid rgba(255,255,255,.07);
          display:flex; align-items:center; justify-content:center;
          font-family:var(--ff-mono); font-size:13px; color:rgba(74,85,104,1);
          position:relative; z-index:1;
          transition:all .35s cubic-bezier(.22,1,.36,1);
        }
        .ob-step.active .ob-step-dot {
          border-color:rgba(0,255,136,.55); background:rgba(0,255,136,.1); color:#00ff88;
          box-shadow:0 0 0 4px rgba(0,255,136,.1),0 0 24px rgba(0,255,136,.3);
          animation:pulse-glow 2.5s ease-in-out infinite;
        }
        .ob-step.done .ob-step-dot { border-color:rgba(0,255,136,.3); background:rgba(0,255,136,.07); color:#00ff88; }
        .ob-step-label { font-family:var(--ff-mono); font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:rgba(45,55,72,1); transition:color .3s; }
        .ob-step.active .ob-step-label { color:#00ff88; }
        .ob-step.done .ob-step-label  { color:rgba(74,85,104,1); }

        .ob-card {
          background:rgba(6,10,18,.8); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
          border:1px solid rgba(255,255,255,.08); border-top:2px solid #00ff88;
          border-radius:20px; padding:36px;
          animation:ob-step .4s cubic-bezier(.22,1,.36,1) both;
          box-shadow:0 24px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.07),0 -2px 24px rgba(0,255,136,.07);
          position:relative; overflow:hidden;
        }
        .ob-card::before {
          content:''; position:absolute; top:0; left:-100%; right:-100%; height:1px;
          background:linear-gradient(90deg,transparent,rgba(0,255,136,.8),rgba(56,189,248,.5),transparent);
          background-size:200% 100%; animation:shimmer 4s linear infinite; pointer-events:none;
        }
        .ob-card::after {
          content:''; position:absolute; bottom:18px; right:18px;
          width:22px; height:22px;
          border-bottom:1px solid rgba(0,255,136,.15); border-right:1px solid rgba(0,255,136,.15);
          pointer-events:none;
        }
        .ob-eyebrow {
          font-family:var(--ff-mono); font-size:10px; letter-spacing:.2em; text-transform:uppercase;
          color:#00ff88; display:flex; align-items:center; gap:8px; margin-bottom:8px;
        }
        .ob-eyebrow::before { content:''; width:16px; height:1px; background:linear-gradient(90deg,#00ff88,transparent); box-shadow:0 0 6px #00ff88; }
        .ob-title { font-family:var(--ff-display); font-size:34px; letter-spacing:.04em; color:#f0f4f8; margin-bottom:6px; }
        .ob-sub { font-size:13px; color:rgba(148,163,184,.65); margin-bottom:28px; line-height:1.6; }

        .ob-field { display:flex; flex-direction:column; gap:7px; margin-bottom:16px; }
        .ob-label {
          font-family:var(--ff-mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase;
          color:rgba(74,85,104,1); display:flex; align-items:center; gap:6px;
        }
        .ob-label-badge {
          padding:1px 7px; background:rgba(0,255,136,.08); border:1px solid rgba(0,255,136,.2);
          border-radius:4px; font-size:8px; color:#00ff88; letter-spacing:.1em;
        }
        .ob-input {
          width:100%; background:rgba(255,255,255,.035); backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.07); border-radius:10px;
          color:#f0f4f8; font-family:var(--ff-body); font-size:14px; padding:12px 14px;
          outline:none; transition:border-color .2s,box-shadow .2s,background .2s; box-sizing:border-box;
        }
        .ob-input:focus { border-color:rgba(0,255,136,.4); background:rgba(0,255,136,.03); box-shadow:0 0 0 3px rgba(0,255,136,.07); }
        .ob-input::placeholder { color:rgba(45,55,72,1); }
        select.ob-input option { background:#0b1120; }
        input[type="date"].ob-input::-webkit-calendar-picker-indicator { filter:invert(.3) sepia(1) hue-rotate(100deg); cursor:pointer; }
        .ob-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

        /* Deadline presets */
        .dl-preset-card {
          display:flex; align-items:center; gap:10px; padding:10px 12px;
          background:rgba(255,255,255,.03); backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.07); border-radius:10px;
          cursor:pointer; transition:all .2s cubic-bezier(.22,1,.36,1); text-align:left;
        }
        .dl-preset-card:hover {
          border-color:rgba(0,255,136,.3); background:rgba(0,255,136,.05);
          transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,255,136,.08);
        }
        .dl-preset-name { font-family:var(--ff-mono); font-size:11px; color:rgba(148,163,184,.85); letter-spacing:.04em; }
        .dl-preset-sub  { font-family:var(--ff-mono); font-size:9px; color:rgba(74,85,104,1); letter-spacing:.08em; text-transform:uppercase; }
        .dl-urgency-badge {
          display:flex; align-items:center; gap:5px; padding:5px 10px;
          background:rgba(0,0,0,.3); backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.1); border-radius:6px;
          font-family:var(--ff-mono); font-size:9px; letter-spacing:.12em; white-space:nowrap;
          animation:count-in .3s ease both;
        }
        .dl-urgency-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
        .dl-countdown {
          display:flex; gap:0; margin-top:12px; border-radius:10px; overflow:hidden;
          border:1px solid rgba(255,255,255,.07); animation:count-in .4s ease both;
        }
        .dl-countdown-inner {
          flex:1; padding:10px 12px; background:rgba(255,255,255,.025); backdrop-filter:blur(4px);
          display:flex; flex-direction:column; align-items:center; gap:3px;
          border-right:1px solid rgba(255,255,255,.06);
        }
        .dl-countdown-inner:last-child { border-right:none; }
        .dl-countdown-num { font-family:var(--ff-display); font-size:26px; letter-spacing:.06em; line-height:1; transition:color .3s; }
        .dl-countdown-label { font-family:var(--ff-mono); font-size:8px; letter-spacing:.12em; text-transform:uppercase; color:rgba(74,85,104,1); }

        /* Divider */
        .ob-divider { display:flex; align-items:center; gap:10px; margin:20px 0 16px; }
        .ob-divider-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent); }
        .ob-divider-text { font-family:var(--ff-mono); font-size:8px; letter-spacing:.18em; text-transform:uppercase; color:rgba(74,85,104,.7); white-space:nowrap; }

        /* Company chips */
        .ob-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; }
        .ob-chip {
          padding:6px 12px; background:rgba(255,255,255,.035); backdrop-filter:blur(4px);
          border:1px solid rgba(255,255,255,.07); border-radius:20px;
          font-family:var(--ff-mono); font-size:10px; letter-spacing:.06em; color:rgba(74,85,104,1);
          cursor:pointer; transition:all .15s cubic-bezier(.22,1,.36,1);
        }
        .ob-chip:hover { border-color:rgba(255,255,255,.16); color:rgba(148,163,184,.8); background:rgba(255,255,255,.07); transform:translateY(-1px); }
        .ob-chip.selected { background:rgba(0,255,136,.1); border-color:rgba(0,255,136,.35); color:#00ff88; box-shadow:0 0 12px rgba(0,255,136,.1); }

        .ob-textarea {
          width:100%; background:rgba(255,255,255,.035); backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.07); border-radius:10px;
          color:#f0f4f8; font-family:var(--ff-body); font-size:14px; padding:12px 14px;
          outline:none; resize:vertical; min-height:80px; line-height:1.6;
          transition:border-color .2s,box-shadow .2s; box-sizing:border-box;
        }
        .ob-textarea:focus { border-color:rgba(0,255,136,.4); background:rgba(0,255,136,.03); box-shadow:0 0 0 3px rgba(0,255,136,.07); }
        .ob-textarea::placeholder { color:rgba(45,55,72,1); }

        .ob-alert {
          background:linear-gradient(135deg,rgba(255,68,68,.07),rgba(255,68,68,.03));
          backdrop-filter:blur(8px); border:1px solid rgba(255,68,68,.2); border-radius:10px;
          padding:10px 14px; font-family:var(--ff-mono); font-size:11px; color:#ff4444;
          margin-bottom:16px; display:flex; align-items:center; gap:8px;
        }
        .ob-btn-row { display:flex; gap:10px; margin-top:24px; }
        .ob-btn-primary {
          flex:1; padding:13px;
          background:linear-gradient(135deg,#00ff88,#00cc66);
          border:none; border-radius:10px; color:#02040a;
          font-family:var(--ff-mono); font-size:12px; font-weight:700;
          letter-spacing:.1em; text-transform:uppercase; cursor:pointer;
          transition:all .2s cubic-bezier(.22,1,.36,1);
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 4px 20px rgba(0,255,136,.4),inset 0 1px 0 rgba(255,255,255,.3);
          position:relative; overflow:hidden;
        }
        .ob-btn-primary::after {
          content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
          transition:left .5s;
        }
        .ob-btn-primary:hover:not(:disabled)::after { left:100%; }
        .ob-btn-primary:hover:not(:disabled) {
          background:linear-gradient(135deg,#1aff99,#00ff88);
          box-shadow:0 6px 32px rgba(0,255,136,.55),inset 0 1px 0 rgba(255,255,255,.4);
          transform:translateY(-2px);
        }
        .ob-btn-primary:disabled { opacity:.5; cursor:not-allowed; }
        .ob-btn-back {
          padding:13px 20px; background:rgba(255,255,255,.035); backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.09); border-radius:10px;
          color:rgba(74,85,104,1); font-family:var(--ff-mono); font-size:12px;
          letter-spacing:.08em; cursor:pointer; transition:all .15s;
        }
        .ob-btn-back:hover { border-color:rgba(255,255,255,.2); color:rgba(148,163,184,.8); background:rgba(255,255,255,.07); }
        .ob-spinner { width:16px; height:16px; border:2px solid rgba(5,7,9,.3); border-top-color:#050709; border-radius:50%; animation:spin .7s linear infinite; }
        .ob-skip { text-align:center; margin-top:10px; font-family:var(--ff-mono); font-size:10px; letter-spacing:.06em; color:rgba(45,55,72,1); }
        .ob-skip button { background:none; border:none; cursor:pointer; color:rgba(74,85,104,1); font-family:inherit; font-size:inherit; text-decoration:underline; text-underline-offset:3px; transition:color .15s; }
        .ob-skip button:hover { color:rgba(148,163,184,.7); }
      `}</style>

      <div className="ob-root">
        <div className="ob-aurora" />
        <div className="ob-grid" />

        <div className="ob-wrap">
          {/* Step indicators */}
          <div className="ob-steps">
            {STEPS.map(s => (
              <div key={s.num} className={`ob-step ${step === s.num ? 'active' : step > s.num ? 'done' : ''}`}>
                <div className="ob-step-dot">{step > s.num ? '✓' : s.icon}</div>
                <div className="ob-step-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="ob-card" key={step}>

            {/* STEP 1 */}
            {step === 1 && <>
              <div className="ob-eyebrow">Step 1 of 3 — Identity</div>
              <div className="ob-title">Who Are You, Engineer?</div>
              <div className="ob-sub">Let's personalize your mission control.</div>
              <div className="ob-field">
                <label className="ob-label">Full Name <span style={{color:'#ff4444'}}>*</span></label>
                <input className="ob-input" placeholder="Arjun Sharma" value={form.name}
                  onChange={e => set('name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && next()} autoFocus />
              </div>
              <div className="ob-field">
                <label className="ob-label">Callsign <span className="ob-label-badge">Optional</span></label>
                <input className="ob-input" placeholder="How we address you in the cockpit" value={form.nickname}
                  onChange={e => set('nickname', e.target.value)} />
              </div>
            </>}

            {/* STEP 2 — Academic + Deadline */}
            {step === 2 && <>
              <div className="ob-eyebrow">Step 2 of 3 — Academic Profile</div>
              <div className="ob-title">Your Academic Base</div>
              <div className="ob-sub">Calibrates your readiness engine and daily study targets.</div>
              <div className="ob-field">
                <label className="ob-label">College / Institute <span style={{color:'#ff4444'}}>*</span></label>
                <input className="ob-input" placeholder="e.g. NIT Surat, IIT Bombay..." value={form.college}
                  onChange={e => set('college', e.target.value)} autoFocus />
              </div>
              <div className="ob-grid-2">
                <div className="ob-field">
                  <label className="ob-label">Branch</label>
                  <select className="ob-input" value={form.branch} onChange={e => set('branch', e.target.value)}>
                    {['Mechanical Engineering','Mechanical + Minor (Data Science)','Mechatronics','Industrial Engineering','Manufacturing Engineering'].map(b => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="ob-field">
                  <label className="ob-label">Current Year</label>
                  <select className="ob-input" value={form.year} onChange={e => set('year', e.target.value)}>
                    {['1st Year','2nd Year','3rd Year','4th Year','Final Semester'].map(y => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="ob-field">
                <label className="ob-label">CGPA</label>
                <input className="ob-input" type="number" min="0" max="10" step="0.01"
                  placeholder="9.57" value={form.cgpa} onChange={e => set('cgpa', e.target.value)} />
              </div>

              {/* ── DEADLINE PICKER ── */}
              <div className="ob-divider">
                <div className="ob-divider-line" />
                <span className="ob-divider-text">⏱ Your Placement Deadline</span>
                <div className="ob-divider-line" />
              </div>
              <div className="ob-field">
                <label className="ob-label">
                  When is your placement drive?
                  <span className="ob-label-badge">Sets your countdown</span>
                </label>
                <DeadlinePicker value={form.placementDeadline} onChange={v => set('placementDeadline', v)} />
              </div>
            </>}

            {/* STEP 3 */}
            {step === 3 && <>
              <div className="ob-eyebrow">Step 3 of 3 — Mission Targets</div>
              <div className="ob-title">Define Your Mission</div>
              <div className="ob-sub">What are you gunning for?</div>
              <div className="ob-field">
                <label className="ob-label">Target Role</label>
                <input className="ob-input" placeholder="e.g. Graduate Engineer Trainee, R&D Engineer..." value={form.targetRole}
                  onChange={e => set('targetRole', e.target.value)} autoFocus />
              </div>
              <div className="ob-field">
                <label className="ob-label">Target Companies <span className="ob-label-badge">Multi-select</span></label>
                <div className="ob-chips">
                  {TARGET_COMPANIES.map(c => (
                    <button key={c} className={`ob-chip ${form.targetCompanies.includes(c) ? 'selected' : ''}`}
                      onClick={() => toggleCompany(c)}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="ob-field">
                <label className="ob-label">What Drives You? <span style={{color:'#ff4444'}}>*</span></label>
                <textarea className="ob-textarea"
                  placeholder="e.g. I want to work on real engineering problems that impact millions of people..."
                  value={form.motivation} onChange={e => set('motivation', e.target.value)} />
              </div>
            </>}

            {error && <div className="ob-alert"><span>⚠</span><span>{error}</span></div>}

            <div className="ob-btn-row">
              {step > 1 && (
                <button className="ob-btn-back" onClick={() => { setStep(s => s - 1); setError(''); }}>← Back</button>
              )}
              {step < 3 ? (
                <button className="ob-btn-primary" onClick={next}>Continue →</button>
              ) : (
                <button className="ob-btn-primary" onClick={finish} disabled={saving}>
                  {saving ? <span className="ob-spinner" /> : '🚀  Launch Mission'}
                </button>
              )}
            </div>

            {step === 2 && !form.placementDeadline && (
              <div className="ob-skip">
                No deadline yet? <button onClick={next}>Skip — set it later in settings</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
