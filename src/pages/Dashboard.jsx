import { useMemo, useState, useEffect } from 'react';
import { useNavigate }                  from 'react-router-dom';
import { useLogs }                      from '../hooks/useLogs';
import { useProfile }                   from '../UserContext';
import { Loader }                       from '../components/Loader';
import { ProgressBar }                  from '../components/ProgressBar';
import { ReadinessGauge }               from '../components/ReadinessGauge';
import { WeeklyWarningBanner }          from '../components/WeeklyWarningBanner';
import { ProfileModal }                 from '../components/ProfileModal';
import { PLACEMENT_DEADLINE, getPlacementDeadline, MOOD_MAP, WEEKLY_TARGETS, SUBJECTS, SUBJECT_LIST, GRADIENT_PRESETS } from '../utils/constants';
import { toDateOnly, diffDays, toISO }  from '../utils/dateUtils';
import { scoreTier }                    from '../utils/scoring';

/* ─── helpers ─── */

function getGreeting(name) {
  const h = new Date().getHours();
  const first = name?.split(' ')[0] || 'Engineer';
  if (h < 5)  return { time:'Still grinding,', name:first, tail:'The late hours count double.' };
  if (h < 12) return { time:'Good morning,',   name:first, tail:"Let's make today count." };
  if (h < 17) return { time:'Good afternoon,', name:first, tail:'Stay locked in.' };
  if (h < 21) return { time:'Good evening,',   name:first, tail:'Evening session activated.' };
  return             { time:'Night mode,',      name:first, tail:'Discipline defines champions.' };
}

function getBestStreak(logs) {
  if (!logs.length) return 0;
  const dates = [...new Set(logs.map(l => l.date))].sort();
  let best = 1, curr = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]) - new Date(dates[i-1])) / 86400000;
    curr = diff === 1 ? curr + 1 : 1;
    best = Math.max(best, curr);
  }
  return best;
}

function getProjection(logs, deadline, target = 680) {
  if (logs.length < 3) return null;
  const sorted = [...logs].sort((a,b) => a.date.localeCompare(b.date));
  const days  = Math.max(1, (new Date(sorted.at(-1).date) - new Date(sorted[0].date)) / 86400000);
  const done  = logs.reduce((s,l) => s + (l.mechanicalHours||0) + (l.codingHours||0), 0);
  const rate  = done / days;
  if (rate <= 0) return null;
  const daysLeft = Math.ceil((target - done) / rate);
  const proj = new Date(); proj.setDate(proj.getDate() + daysLeft);
  return { date: proj.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}), onTime: deadline ? proj <= deadline : true, rate: rate.toFixed(1) };
}

function getRecommendation(subjectStats, logs) {
  if (!logs.length) return { subject:SUBJECT_LIST[0], reason:'Start your journey with this core subject.' };
  const top = SUBJECT_LIST
    .map(s => ({ subject:s, urgency:(100-subjectStats[s].pct)*(subjectStats[s].neglected?2:1), ...subjectStats[s] }))
    .sort((a,b) => b.urgency - a.urgency)[0];
  return {
    subject: top.subject,
    reason: top.neglected ? 'Not studied in 10+ days — urgent!' : `${top.pct.toFixed(0)}% done — keep pushing.`,
    pct: top.pct,
  };
}

/* ─── sub-components ─── */
function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()),1000); return ()=>clearInterval(id); },[]);
  return <span style={{ fontFamily:'var(--ff-mono)', fontSize:'11px', color:'var(--t3)', letterSpacing:'0.08em' }}>
    {t.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
  </span>;
}

function MiniChip({ children, color }) {
  return <span style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:`${color}18`, color, letterSpacing:'0.03em' }}>{children}</span>;
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
      <div style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--t3)' }}>{children}</div>
      {action}
    </div>
  );
}

function StatTile({ label, value, sub, color='var(--t0)', accent, size='lg' }) {
  return (
    <div className="card" style={{ borderTop:`2px solid ${accent||'transparent'}`, padding:'14px' }}>
      <div style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--t3)', marginBottom:'8px' }}>{label}</div>
      <div style={{ fontFamily:'var(--ff-display)', fontSize: size==='lg'?'32px':'24px', color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', color:'var(--t3)', marginTop:'5px' }}>{sub}</div>}
    </div>
  );
}

/* ─── Burndown mini chart ─── */
function BurndownBar({ done, target, label, color }) {
  const pct = Math.min(100, (done/target)*100);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
      <div style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', color:'var(--t3)', width:'36px', flexShrink:0 }}>{label}</div>
      <div style={{ flex:1, height:'6px', background:'var(--bg3)', borderRadius:'3px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:'3px', transition:'width 0.5s ease' }} />
      </div>
      <div style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', color:'var(--t2)', width:'32px', textAlign:'right' }}>{pct.toFixed(0)}%</div>
    </div>
  );
}

/* ─── calendar strip: last 14 days ─── */
function CalendarStrip({ logs }) {
  const today = toDateOnly();
  const days = Array.from({length:14}, (_,i) => {
    const d = new Date(today); d.setDate(d.getDate() - (13-i));
    const dateStr = toISO(d);
    const dayLogs = logs.filter(l => l.date === dateStr);
    const hrs = dayLogs.reduce((s,l) => s+(l.mechanicalHours||0)+(l.codingHours||0), 0);
    const isToday = dateStr === toISO(today);
    return { d, dateStr, hrs, isToday, logged: hrs > 0 };
  });

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(14,1fr)', gap:'4px' }}>
      {days.map(({ d, hrs, isToday, logged }) => (
        <div key={d.toISOString()} title={`${d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}: ${hrs.toFixed(1)}h`}>
          <div style={{ fontFamily:'var(--ff-mono)', fontSize:'8px', color:'var(--t3)', textAlign:'center', marginBottom:'3px' }}>
            {d.toLocaleDateString('en-IN',{weekday:'narrow'})}
          </div>
          <div style={{
            height:'28px', borderRadius:'5px', transition:'all 0.2s',
            background: !logged ? 'var(--bg3)' : hrs < 2 ? 'rgba(0,255,136,0.2)' : hrs < 4 ? 'rgba(0,255,136,0.45)' : 'rgba(0,255,136,0.8)',
            outline: isToday ? '1.5px solid var(--signal)' : 'none',
            outlineOffset:'1px',
          }} />
          <div style={{ fontFamily:'var(--ff-mono)', fontSize:'8px', color: isToday?'var(--signal)':'var(--t3)', textAlign:'center', marginTop:'3px' }}>
            {d.getDate()}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── subject radar mini ─── */
function SubjectGrid({ subjectStats }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
      {SUBJECT_LIST.map(s => {
        const stat = subjectStats[s];
        const color = SUBJECTS[s].color;
        return (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 8px', background:'var(--bg2)', borderRadius:'6px', border:`1px solid ${stat.neglected?'rgba(255,68,68,0.2)':'var(--b1)'}` }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0, boxShadow:`0 0 6px ${color}` }} />
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{SUBJECTS[s].abbr}</div>
              <div style={{ height:'3px', background:'var(--bg3)', borderRadius:'2px', marginTop:'3px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${stat.pct}%`, background:color, borderRadius:'2px' }} />
              </div>
            </div>
            <div style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', color: stat.pct >= 100 ? 'var(--signal)' : 'var(--t3)', flexShrink:0 }}>
              {stat.pct.toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [showProfile, setShowProfile] = useState(false);
  const {
    logs, loading, subjectStats, weekStats,
    streak, tHours, tMech, tCoding,
    readinessScore, scoreBreakdown,
  } = useLogs();

  const userDeadline  = useMemo(() => getPlacementDeadline(profile), [profile]);
  const daysLeft      = useMemo(() => Math.max(0, diffDays(userDeadline, toDateOnly())), [userDeadline]);
  const { weeklyMech, weeklyCoding, daysIntoWeek, todayStr } = weekStats;
  const todayLogged   = logs.some(l => l.date === todayStr);
  const mechWeekPct   = Math.min(100,(weeklyMech/WEEKLY_TARGETS.mechanical)*100);
  const codingWeekPct = Math.min(100,(weeklyCoding/WEEKLY_TARGETS.coding)*100);
  const tier          = scoreTier(readinessScore);
  const greeting      = getGreeting(profile?.name);
  const bestStreak    = useMemo(() => getBestStreak(logs), [logs]);
  const totalNums     = logs.reduce((s,l) => s+(l.numericals||0), 0);
  const totalDays     = useMemo(() => new Set(logs.map(l=>l.date)).size, [logs]);
  const avgMood       = logs.filter(l=>l.mood).reduce((s,l,_,a)=>s+l.mood/a.length, 0);
  const projection    = useMemo(() => getProjection(logs, userDeadline), [logs, userDeadline]);
  const recommend     = useMemo(() => getRecommendation(subjectStats, logs), [subjectStats, logs]);
  const todayLogs     = logs.filter(l => l.date === todayStr);
  const todayHours    = todayLogs.reduce((s,l)=>s+(l.mechanicalHours||0)+(l.codingHours||0),0);
  const neglectedCount= SUBJECT_LIST.filter(s=>subjectStats[s].neglected).length;
  const masteredCount = SUBJECT_LIST.filter(s=>subjectStats[s].pct>=100).length;

  const avatarEmoji   = profile?.avatarEmoji || '';
  const grad          = GRADIENT_PRESETS.find(g=>g.id===profile?.avatarGradient) || GRADIENT_PRESETS[0];
  const initials      = profile?.name?.trim().split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?';

  if (loading) return <Loader text="LOADING MISSION DATA" />;

  return (
    <div className="page">
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {/* ══ HEADER ══ */}
      <div className="page-header" style={{ marginBottom:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>

          {/* Clickable Avatar */}
          <div onClick={() => setShowProfile(true)} title="Edit Profile" style={{ position:'relative', cursor:'pointer', flexShrink:0 }}>
            <div style={{
              width:58, height:58, borderRadius:'50%',
              background: avatarEmoji ? grad.bg : 'linear-gradient(135deg,rgba(0,255,136,0.25),rgba(56,189,248,0.25))',
              border:`2px solid ${avatarEmoji ? grad.border+'99' : 'rgba(0,255,136,0.4)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize: avatarEmoji ? '26px' : '18px', fontFamily:'var(--ff-mono)', fontWeight:700, color:'#00ff88',
              boxShadow:`0 0 24px ${avatarEmoji ? grad.border+'33' : 'rgba(0,255,136,0.1)'}`,
              transition:'all 0.2s',
            }}>
              {avatarEmoji || initials}
            </div>
            <div style={{ position:'absolute', bottom:0, right:0, width:18, height:18, borderRadius:'50%', background:'var(--signal)', border:'2px solid var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:700 }}>✏</div>
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', color:'var(--t3)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'2px' }}>
              {greeting.time}
            </div>
            <h1 style={{ fontFamily:'var(--ff-display)', fontSize:'32px', letterSpacing:'0.04em', lineHeight:1, margin:0 }}>
              <span style={{ color:'var(--signal)' }}>{greeting.name} </span>
              <span style={{ color:'var(--t0)' }}>— Dashboard</span>
            </h1>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'3px', flexWrap:'wrap' }}>
              <span style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', color:'var(--t2)' }}>{greeting.tail}</span>
              <span style={{ color:'var(--b2)' }}>·</span>
              <LiveClock />
              {profile?.college && <><span style={{ color:'var(--b2)' }}>·</span><span style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', color:'var(--t3)' }}>{profile.college}</span></>}
            </div>
          </div>

          {/* Top-right actions */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px' }}>
            {profile?.targetCompanies?.length > 0 && (
              <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', justifyContent:'flex-end', maxWidth:'300px' }}>
                {profile.targetCompanies.slice(0,5).map(c => (
                  <span key={c} style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', padding:'2px 7px', borderRadius:'4px', background:'rgba(0,255,136,0.06)', border:'1px solid rgba(0,255,136,0.15)', color:'var(--signal)', letterSpacing:'0.06em' }}>{c}</span>
                ))}
                {profile.targetCompanies.length > 5 && <span style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', color:'var(--t3)', padding:'2px 4px' }}>+{profile.targetCompanies.length-5}</span>}
              </div>
            )}
            <div style={{ display:'flex', gap:'8px' }}>
              {!todayLogged && <div className="alert alert-warn" style={{ fontSize:'11px', padding:'7px 12px' }}>⏰ Not logged today</div>}
              <button className="btn btn-ghost btn-sm" onClick={() => setShowProfile(true)}>⚙ Profile</button>
              <button className="btn btn-primary" onClick={() => navigate('/log')}>+ Log Today</button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ WEEKLY WARNING ══ */}
      <div style={{ marginBottom:'16px' }}>
        <WeeklyWarningBanner weeklyMech={weeklyMech} weeklyCoding={weeklyCoding} daysIntoWeek={daysIntoWeek} />
      </div>

      {/* ══ ROW 1: 6 KEY STATS ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'10px', marginBottom:'14px' }}>
        <StatTile label="Days Left"    value={daysLeft}                sub="to July 1, 2026"       color="var(--signal)" accent="var(--signal)" />
        <StatTile label="🔥 Streak"    value={streak}                  sub={`best: ${bestStreak}`}  color="var(--amber)"  accent="var(--amber)" />
        <StatTile label="Days Logged"  value={totalDays}               sub={`${logs.length} entries`} color="var(--cyan)" />
        <StatTile label="Mech Hrs"     value={`${tMech.toFixed(0)}h`}  sub="of 350h"               color="var(--amber)" />
        <StatTile label="Code Hrs"     value={`${tCoding.toFixed(0)}h`} sub="of 280h"              color="var(--cyan)" />
        <StatTile label="Numericals"   value={totalNums}               sub={`avg ${logs.length ? (totalNums/logs.length).toFixed(1) : 0}/day`} color="var(--signal)" />
      </div>

      {/* ══ ROW 2: READINESS + PROFILE DETAILS ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:'14px', marginBottom:'14px' }}>
        <div className="card" style={{ borderTop:`2px solid ${tier.color}` }}>
          <div className="card-title">Readiness Score</div>
          <ReadinessGauge score={readinessScore} breakdown={scoreBreakdown} />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {/* Profile card */}
          <div className="card" style={{ cursor:'pointer' }} onClick={() => setShowProfile(true)}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <div className="card-title" style={{ margin:0 }}>Profile</div>
              <span style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', color:'var(--signal)', letterSpacing:'0.1em' }}>EDIT →</span>
            </div>
            {profile ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                {[
                  { l:'CGPA', v:profile.cgpa, big:true },
                  { l:'Year', v:profile.year?.replace(' Year','') },
                  { l:'Branch', v:profile.branch?.split(' ').slice(0,1).join('') },
                  { l:'Target', v:profile.targetRole?.split(' ').slice(0,2).join(' ') || '—' },
                ].filter(i=>i.v).map(item => (
                  <div key={item.l} style={{ padding:'8px 10px', background:'var(--bg2)', borderRadius:'6px' }}>
                    <div style={{ fontFamily:'var(--ff-mono)', fontSize:'8px', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--t3)', marginBottom:'2px' }}>{item.l}</div>
                    <div style={{ fontFamily: item.big ? 'var(--ff-display)' : 'var(--ff-body)', fontSize: item.big ? '22px' : '12px', fontWeight: item.big?400:600, color: item.big?'var(--signal)':'var(--t0)', lineHeight:1.2 }}>{item.v}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily:'var(--ff-mono)', fontSize:'11px', color:'var(--t3)', textAlign:'center', padding:'16px' }}>
                Click to complete your profile
              </div>
            )}
          </div>

          {/* CTC target if set */}
          {profile?.targetCTC && (
            <div className="card" style={{ background:'rgba(0,255,136,0.02)', borderColor:'rgba(0,255,136,0.15)', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ fontSize:'24px' }}>💰</div>
              <div>
                <div style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', letterSpacing:'0.12em', color:'var(--t3)', marginBottom:'2px' }}>TARGET CTC</div>
                <div style={{ fontFamily:'var(--ff-display)', fontSize:'22px', color:'var(--signal)' }}>{profile.targetCTC} LPA</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ ROW 3: TODAY + NEXT SUBJECT + PROJECTION ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px', marginBottom:'14px' }}>

        {/* Today's session */}
        <div className="card">
          <div className="card-title">Today's Session</div>
          {todayLogged ? (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                <div style={{ fontFamily:'var(--ff-display)', fontSize:'40px', color:'var(--signal)', lineHeight:1 }}>{todayHours.toFixed(1)}<span style={{ fontFamily:'var(--ff-mono)', fontSize:'13px', color:'var(--t3)' }}>h</span></div>
                <div style={{ fontSize:'28px' }}>{MOOD_MAP[todayLogs[0]?.mood] || ''}</div>
              </div>
              <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'10px' }}>
                {[...new Set(todayLogs.map(l=>l.subject))].map(s => (
                  <span key={s} style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', padding:'3px 8px', borderRadius:'4px', background:`${SUBJECTS[s]?.color||'#00ff88'}18`, color:SUBJECTS[s]?.color||'#00ff88', letterSpacing:'0.04em' }}>{s}</span>
                ))}
              </div>
              {todayLogs[0]?.topics && <div style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', color:'var(--t2)', lineHeight:1.5 }}>{todayLogs[0].topics}</div>}
              <div style={{ display:'flex', gap:'4px', marginTop:'8px' }}>
                {todayLogs[0]?.mechanicalHours > 0 && <MiniChip color="var(--amber)">⚙ {todayLogs[0].mechanicalHours}h</MiniChip>}
                {todayLogs[0]?.codingHours > 0 && <MiniChip color="var(--cyan)">⌨ {todayLogs[0].codingHours}h</MiniChip>}
                {todayLogs[0]?.numericals > 0 && <MiniChip color="var(--signal)">◈ {todayLogs[0].numericals}</MiniChip>}
              </div>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:'32px', marginBottom:'10px' }}>◎</div>
              <div style={{ fontFamily:'var(--ff-mono)', fontSize:'11px', color:'var(--t3)', marginBottom:'14px' }}>No entry yet today</div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/log')} style={{ width:'100%' }}>+ Log Now</button>
            </div>
          )}
        </div>

        {/* Study next */}
        <div className="card" style={{ background:'rgba(56,189,248,0.02)', borderColor:'rgba(56,189,248,0.18)' }}>
          <div style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--cyan)', marginBottom:'12px' }}>◈ Study Next</div>
          <div style={{ fontFamily:'var(--ff-display)', fontSize:'22px', color:'var(--t0)', marginBottom:'6px', lineHeight:1.1 }}>{recommend.subject}</div>
          <div style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', color:'var(--t2)', lineHeight:1.6, marginBottom:'12px' }}>{recommend.reason}</div>
          <div style={{ height:'4px', background:'var(--bg3)', borderRadius:'2px', overflow:'hidden', marginBottom:'12px' }}>
            <div style={{ height:'100%', width:`${recommend.pct}%`, background:'var(--cyan)', borderRadius:'2px' }} />
          </div>
          <div style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', color:'var(--t3)', marginBottom:'10px' }}>
            {recommend.pct?.toFixed(0)}% complete · {subjectStats[recommend.subject]?.completedHours?.toFixed(1)}h / {subjectStats[recommend.subject]?.target}h target
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width:'100%', fontSize:'10px' }} onClick={() => navigate('/subjects')}>All Subjects →</button>
        </div>

        {/* Projection + mood */}
        <div className="card">
          <div className="card-title">Mission Intel</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {projection && (
              <div style={{ padding:'10px 12px', background:'var(--bg2)', borderRadius:'8px' }}>
                <div style={{ fontFamily:'var(--ff-mono)', fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--t3)', marginBottom:'4px' }}>Projected Finish</div>
                <div style={{ fontFamily:'var(--ff-body)', fontWeight:700, fontSize:'13px', color: projection.onTime ? 'var(--signal)' : 'var(--red)', marginBottom:'2px' }}>
                  {projection.date} {projection.onTime ? '✓' : '✗'}
                </div>
                <div style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', color:'var(--t3)' }}>
                  {projection.rate}h/day pace · {projection.onTime ? 'Before deadline' : 'After deadline!'}
                </div>
              </div>
            )}
            <div style={{ padding:'10px 12px', background:'var(--bg2)', borderRadius:'8px' }}>
              <div style={{ fontFamily:'var(--ff-mono)', fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--t3)', marginBottom:'4px' }}>Mood Average</div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'22px' }}>{avgMood ? MOOD_MAP[Math.round(avgMood)] : '—'}</span>
                <span style={{ fontFamily:'var(--ff-display)', fontSize:'22px', color:'var(--t0)' }}>{avgMood ? avgMood.toFixed(1) : '—'}</span>
                <span style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', color:'var(--t3)' }}>/ 5</span>
              </div>
            </div>
            <div style={{ padding:'10px 12px', background:'var(--bg2)', borderRadius:'8px' }}>
              <div style={{ fontFamily:'var(--ff-mono)', fontSize:'8px', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--t3)', marginBottom:'6px' }}>Subject Status</div>
              <div style={{ display:'flex', gap:'10px' }}>
                <div>
                  <div style={{ fontFamily:'var(--ff-display)', fontSize:'22px', color:'var(--signal)' }}>{masteredCount}</div>
                  <div style={{ fontFamily:'var(--ff-mono)', fontSize:'8px', color:'var(--t3)' }}>Mastered</div>
                </div>
                <div>
                  <div style={{ fontFamily:'var(--ff-display)', fontSize:'22px', color:'var(--red)' }}>{neglectedCount}</div>
                  <div style={{ fontFamily:'var(--ff-mono)', fontSize:'8px', color:'var(--t3)' }}>Neglected</div>
                </div>
                <div>
                  <div style={{ fontFamily:'var(--ff-display)', fontSize:'22px', color:'var(--t0)' }}>{SUBJECT_LIST.length - masteredCount - neglectedCount}</div>
                  <div style={{ fontFamily:'var(--ff-mono)', fontSize:'8px', color:'var(--t3)' }}>In Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ROW 4: WEEKLY PROGRESS + SUBJECT GRID ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:'14px', marginBottom:'14px' }}>

        {/* Weekly progress */}
        <div className="card card-amber">
          <div className="card-title">This Week</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <span style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', color:'var(--t2)' }}>⚙ Mechanical</span>
                <span style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', color:'var(--t0)' }}>{weeklyMech.toFixed(1)}h / {WEEKLY_TARGETS.mechanical}h</span>
              </div>
              <ProgressBar pct={mechWeekPct} colorClass="prog-amber" thick />
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <span style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', color:'var(--t2)' }}>⌨ Coding</span>
                <span style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', color:'var(--t0)' }}>{weeklyCoding.toFixed(1)}h / {WEEKLY_TARGETS.coding}h</span>
              </div>
              <ProgressBar pct={codingWeekPct} colorClass="prog-cyan" thick />
            </div>
            <div style={{ borderTop:'1px solid var(--b1)', paddingTop:'10px' }}>
              <div style={{ fontFamily:'var(--ff-mono)', fontSize:'9px', color:'var(--t3)', marginBottom:'8px' }}>Total Target Progress</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                <BurndownBar done={tMech}   target={350} label="Mech"  color="var(--amber)" />
                <BurndownBar done={tCoding} target={280} label="Code"  color="var(--cyan)" />
                <BurndownBar done={tHours}  target={680} label="Total" color="var(--signal)" />
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--ff-mono)', fontSize:'9px', color:'var(--t3)' }}>
              <span>Day {daysIntoWeek} of 7</span>
              <span style={{ color:'var(--signal)' }}>{((weeklyMech+weeklyCoding)/Math.max(1,daysIntoWeek)).toFixed(1)}h/day this week</span>
            </div>
          </div>
        </div>

        {/* Subject grid */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <div className="card-title" style={{ margin:0 }}>Subjects</div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize:'10px' }} onClick={() => navigate('/subjects')}>Full View →</button>
          </div>
          <SubjectGrid subjectStats={subjectStats} />
        </div>
      </div>

      {/* ══ ROW 5: 14-DAY CALENDAR ══ */}
      <div className="card" style={{ marginBottom:'14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
          <div className="card-title" style={{ margin:0 }}>Last 14 Days</div>
          <button className="btn btn-ghost btn-sm" style={{ fontSize:'10px' }} onClick={() => navigate('/analytics')}>Full Analytics →</button>
        </div>
        <CalendarStrip logs={logs} />
      </div>

      {/* ══ ROW 6: RECENT LOGS ══ */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
          <div className="card-title" style={{ margin:0 }}>Recent Entries</div>
          <button className="btn btn-ghost btn-sm" style={{ fontSize:'10px' }} onClick={() => navigate('/log')}>All Logs →</button>
        </div>
        {logs.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'40px' }}>
            <div style={{ fontSize:'28px', marginBottom:'10px' }}>◎</div>
            <div style={{ fontFamily:'var(--ff-mono)', fontSize:'13px', color:'var(--t2)', marginBottom:'16px' }}>
              No entries yet, {profile?.nickname || profile?.name?.split(' ')[0] || 'Engineer'}. Start logging!
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/log')}>+ Log First Entry</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {logs.slice(0,5).map(log => <MiniLogRow key={log.id} log={log} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniLogRow({ log }) {
  const total = (log.mechanicalHours||0)+(log.codingHours||0);
  return (
    <div className="log-row">
      <div className="log-date-badge">
        <div className="log-day-num">{log.date?.slice(8)}</div>
        <div className="log-month">{log.date?.slice(5,7)}/{log.date?.slice(0,4)}</div>
      </div>
      <div>
        <div style={{ fontWeight:600, fontSize:'14px', marginBottom:'4px', color:'var(--t0)' }}>
          {log.subject}{log.topics ? <span style={{ color:'var(--t2)', fontWeight:400 }}> — {log.topics}</span> : ''}
        </div>
        <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
          {log.mechanicalHours>0 && <MiniChip color="var(--amber)">⚙ {log.mechanicalHours}h</MiniChip>}
          {log.codingHours>0     && <MiniChip color="var(--cyan)">⌨ {log.codingHours}h</MiniChip>}
          {log.numericals>0      && <MiniChip color="var(--signal)">◈ {log.numericals} nums</MiniChip>}
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:'var(--ff-display)', fontSize:'22px', color:'var(--signal)' }}>
          {total.toFixed(1)}<span style={{ fontFamily:'var(--ff-mono)', fontSize:'11px', color:'var(--t3)' }}>h</span>
        </div>
        <div style={{ fontSize:'16px' }}>{MOOD_MAP[log.mood]||''}</div>
      </div>
    </div>
  );
}