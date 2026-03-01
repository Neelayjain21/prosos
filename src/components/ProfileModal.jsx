import { useState } from 'react';
import { useProfile } from '../UserContext';
import { GRADIENT_PRESETS, TARGET_COMPANIES } from '../utils/constants';

const EMOJI_GRID = [
  ['🚀','⚡','🔥','🎯','💡','🛠','⚙','🧪','🌊','🏔'],
  ['🦁','🐉','🦅','🐺','🦊','🌟','💎','🏆','⚔','🛡'],
  ['🤖','👨‍💻','👷','🔬','📐','🧮','💻','🎓','🏋','✈'],
  ['🎸','🎵','🏄','🧗','🏇','⚽','🎮','🎲','🌍','🔭'],
];
const ALL_EMOJIS = EMOJI_GRID.flat();

const S = {
  label: { fontFamily:'var(--ff-mono)', fontSize:'10px', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--t3)', marginBottom:'8px', display:'block' },
  input: { width:'100%', background:'rgba(255,255,255,0.04)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'var(--t0)', fontFamily:'var(--ff-body)', fontSize:'14px', padding:'11px 14px', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s, background 0.2s' },
  field: { display:'flex', flexDirection:'column', gap:'6px' },
};

function Field({ label, children }) {
  return <div style={S.field}><span style={S.label}>{label}</span>{children}</div>;
}

export function ProfileModal({ onClose }) {
  const { profile, updateProfile } = useProfile();
  const [tab,    setTab]    = useState('avatar');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');

  const [form, setForm] = useState({
    name:            profile?.name            || '',
    nickname:        profile?.nickname        || '',
    phone:           profile?.phone           || '',
    linkedin:        profile?.linkedin        || '',
    college:         profile?.college         || '',
    branch:          profile?.branch          || 'Mechanical Engineering',
    year:            profile?.year            || '3rd Year',
    cgpa:            profile?.cgpa            || '',
    backlogs:        profile?.backlogs        || '0',
    targetRole:      profile?.targetRole      || '',
    targetCompanies: profile?.targetCompanies || [],
    targetCTC:       profile?.targetCTC       || '',
    motivation:      profile?.motivation      || '',
    avatarEmoji:     profile?.avatarEmoji     || '',
    avatarGradient:  profile?.avatarGradient  || 'g1',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleCompany = (c) => set('targetCompanies',
    form.targetCompanies.includes(c)
      ? form.targetCompanies.filter(x => x !== c)
      : [...form.targetCompanies, c]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } catch(e) { console.error(e); setSaving(false); }
  };

  const TABS = [
    { id:'avatar',   icon:'🎨', label:'Avatar'    },
    { id:'personal', icon:'👤', label:'Personal'  },
    { id:'academic', icon:'🎓', label:'Academic'  },
    { id:'targets',  icon:'🎯', label:'Targets'   },
  ];

  const initials = form.name.trim().split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?';
  const grad = GRADIENT_PRESETS.find(g => g.id === form.avatarGradient) || GRADIENT_PRESETS[0];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'rgba(2,4,10,0.9)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.1)', borderTop:'1px solid rgba(255,255,255,0.12)', borderRadius:'24px', width:'100%', maxWidth:'640px', maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

        {/* ── Header ── */}
        <div style={{ padding:'24px 28px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'20px', marginBottom:'20px' }}>

            {/* Live preview avatar */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{
                width:72, height:72, borderRadius:'50%',
                background: form.avatarEmoji ? grad.bg : 'linear-gradient(135deg, rgba(0,255,136,0.3), rgba(56,189,248,0.3))',
                border:`2px solid ${form.avatarEmoji ? grad.border+'88' : 'rgba(0,255,136,0.4)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: form.avatarEmoji ? '34px' : '22px',
                fontFamily:'var(--ff-mono)', fontWeight:700, color:'#00ff88',
                boxShadow:`0 0 28px ${form.avatarEmoji ? grad.border+'44' : 'rgba(0,255,136,0.15)'}`,
                transition:'all 0.25s',
                cursor: 'pointer',
              }} onClick={() => setTab('avatar')} title="Change avatar">
                {form.avatarEmoji || initials}
              </div>
              <div style={{ position:'absolute', bottom:0, right:0, width:22, height:22, borderRadius:'50%', background:'var(--signal)', border:'2px solid #0a0d12', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', cursor:'pointer' }}
                onClick={() => setTab('avatar')}>✏</div>
            </div>

            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--ff-display)', fontSize:'28px', color:'var(--t0)', letterSpacing:'0.04em', lineHeight:1 }}>
                {form.name || 'Your Profile'}
              </div>
              {form.nickname && <div style={{ fontFamily:'var(--ff-mono)', fontSize:'11px', color:'var(--signal)', marginTop:'4px', letterSpacing:'0.08em' }}>"{form.nickname}"</div>}
              {form.college && <div style={{ fontFamily:'var(--ff-mono)', fontSize:'10px', color:'var(--t3)', marginTop:'3px' }}>{form.college} · {form.year}</div>}
            </div>

            <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'var(--bg2)', border:'1px solid var(--b1)', color:'var(--t2)', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--b1)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex:1, padding:'10px 8px 12px', border:'none', background:'transparent',
                fontFamily:'var(--ff-mono)', fontSize:'9px', letterSpacing:'0.12em',
                textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s',
                color: tab === t.id ? 'var(--signal)' : 'var(--t3)',
                borderBottom: tab === t.id ? '2px solid var(--signal)' : '2px solid transparent',
                marginBottom:'-1px', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
              }}>
                <span style={{ fontSize:'16px' }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding:'24px 28px', overflowY:'auto', flex:1 }}>

          {/* AVATAR TAB */}
          {tab === 'avatar' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
              <div>
                <span style={S.label}>Pick an Emoji</span>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:'5px', marginBottom:'12px' }}>
                  {ALL_EMOJIS.map(e => (
                    <button key={e} onClick={() => set('avatarEmoji', form.avatarEmoji === e ? '' : e)}
                      style={{ fontSize:'20px', aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'8px', cursor:'pointer', border:'none', transition:'all 0.12s',
                        background: form.avatarEmoji === e ? 'rgba(0,255,136,0.15)' : 'var(--bg2)',
                        outline: form.avatarEmoji === e ? '1.5px solid rgba(0,255,136,0.5)' : '1px solid var(--b1)',
                        transform: form.avatarEmoji === e ? 'scale(1.12)' : 'scale(1)',
                      }}>
                      {e}
                    </button>
                  ))}
                </div>
                {/* Custom emoji input */}
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <input
                    style={{ ...S.input, flex:1, fontSize:'20px', textAlign:'center' }}
                    placeholder="Or paste any emoji here... 🧲"
                    value={customEmoji}
                    onChange={e => setCustomEmoji(e.target.value)}
                    onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.4)'}
                    onBlur={e => e.target.style.borderColor='var(--b1)'}
                  />
                  <button onClick={() => { if(customEmoji.trim()) { set('avatarEmoji', customEmoji.trim()[0]); setCustomEmoji(''); } }}
                    style={{ padding:'11px 18px', background:'var(--signal)', border:'none', borderRadius:'8px', color:'var(--bg)', fontFamily:'var(--ff-mono)', fontSize:'11px', fontWeight:700, cursor:'pointer', letterSpacing:'0.08em' }}>
                    USE
                  </button>
                </div>
              </div>

              {form.avatarEmoji && (
                <div>
                  <span style={S.label}>Background Gradient</span>
                  <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                    {GRADIENT_PRESETS.map(g => (
                      <button key={g.id} onClick={() => set('avatarGradient', g.id)}
                        style={{ width:48, height:48, borderRadius:'12px', background:g.bg, cursor:'pointer', transition:'all 0.15s', border:'none',
                          outline: form.avatarGradient === g.id ? '2px solid #00ff88' : '2px solid transparent',
                          outlineOffset:'2px',
                          transform: form.avatarGradient === g.id ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: form.avatarGradient === g.id ? `0 0 16px ${g.border}66` : 'none',
                        }} />
                    ))}
                  </div>
                </div>
              )}

              {!form.avatarEmoji && (
                <div style={{ padding:'16px', background:'rgba(0,255,136,0.04)', border:'1px solid rgba(0,255,136,0.1)', borderRadius:'10px', fontFamily:'var(--ff-mono)', fontSize:'11px', color:'var(--t2)', lineHeight:1.6 }}>
                  No emoji selected — your initials will be shown with a gradient background.<br/>
                  Pick any emoji above, or paste one into the input box.
                </div>
              )}
            </div>
          )}

          {/* PERSONAL TAB */}
          {tab === 'personal' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div style={{ gridColumn:'span 2' }}>
                <Field label="Full Name">
                  <input style={S.input} placeholder="Arjun Sharma" value={form.name}
                    onChange={e => set('name', e.target.value)}
                    onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.4)'}
                    onBlur={e => e.target.style.borderColor='var(--b1)'} />
                </Field>
              </div>
              <Field label="Nickname / Callsign">
                <input style={S.input} placeholder="How we address you" value={form.nickname}
                  onChange={e => set('nickname', e.target.value)}
                  onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.4)'}
                  onBlur={e => e.target.style.borderColor='var(--b1)'} />
              </Field>
              <Field label="Phone">
                <input style={S.input} placeholder="+91 98765 43210" value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.4)'}
                  onBlur={e => e.target.style.borderColor='var(--b1)'} />
              </Field>
              <div style={{ gridColumn:'span 2' }}>
                <Field label="LinkedIn URL">
                  <input style={S.input} placeholder="linkedin.com/in/yourprofile" value={form.linkedin}
                    onChange={e => set('linkedin', e.target.value)}
                    onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.4)'}
                    onBlur={e => e.target.style.borderColor='var(--b1)'} />
                </Field>
              </div>
            </div>
          )}

          {/* ACADEMIC TAB */}
          {tab === 'academic' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div style={{ gridColumn:'span 2' }}>
                <Field label="College / Institute">
                  <input style={S.input} placeholder="NIT Surat, IIT Bombay..." value={form.college}
                    onChange={e => set('college', e.target.value)}
                    onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.4)'}
                    onBlur={e => e.target.style.borderColor='var(--b1)'} />
                </Field>
              </div>
              <Field label="Branch">
                <select style={{ ...S.input, cursor:'pointer' }} value={form.branch} onChange={e => set('branch', e.target.value)}>
                  {['Mechanical Engineering','Mechanical + Minor (Data Science)','Mechatronics','Industrial Engineering','Manufacturing Engineering'].map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Current Year">
                <select style={{ ...S.input, cursor:'pointer' }} value={form.year} onChange={e => set('year', e.target.value)}>
                  {['1st Year','2nd Year','3rd Year','4th Year','Final Semester'].map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="CGPA">
                <input style={S.input} type="number" min="0" max="10" step="0.01" placeholder="9.57" value={form.cgpa}
                  onChange={e => set('cgpa', e.target.value)}
                  onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.4)'}
                  onBlur={e => e.target.style.borderColor='var(--b1)'} />
              </Field>
              <Field label="Active Backlogs">
                <select style={{ ...S.input, cursor:'pointer' }} value={form.backlogs} onChange={e => set('backlogs', e.target.value)}>
                  {['0','1','2','3','4','5+'].map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
            </div>
          )}

          {/* TARGETS TAB */}
          {tab === 'targets' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                <Field label="Target Role">
                  <input style={S.input} placeholder="Graduate Engineer Trainee..." value={form.targetRole}
                    onChange={e => set('targetRole', e.target.value)}
                    onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.4)'}
                    onBlur={e => e.target.style.borderColor='var(--b1)'} />
                </Field>
                <Field label="Expected CTC (LPA)">
                  <input style={S.input} type="number" placeholder="12" value={form.targetCTC}
                    onChange={e => set('targetCTC', e.target.value)}
                    onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.4)'}
                    onBlur={e => e.target.style.borderColor='var(--b1)'} />
                </Field>
              </div>

              <Field label={`Target Companies (${form.targetCompanies.length} selected)`}>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {TARGET_COMPANIES.map(c => (
                    <button key={c} onClick={() => toggleCompany(c)} style={{
                      padding:'5px 11px', borderRadius:'6px', cursor:'pointer', transition:'all 0.12s',
                      fontFamily:'var(--ff-mono)', fontSize:'10px', letterSpacing:'0.05em',
                      background: form.targetCompanies.includes(c) ? 'rgba(0,255,136,0.1)' : 'var(--bg2)',
                      border:`1px solid ${form.targetCompanies.includes(c) ? 'rgba(0,255,136,0.4)' : 'var(--b1)'}`,
                      color: form.targetCompanies.includes(c) ? 'var(--signal)' : 'var(--t3)',
                    }}>
                      {form.targetCompanies.includes(c) ? '✓ ' : ''}{c}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="What Drives You">
                <textarea
                  style={{ ...S.input, resize:'vertical', minHeight:'80px', lineHeight:1.6 }}
                  placeholder="Why you want to crack placements..."
                  value={form.motivation} onChange={e => set('motivation', e.target.value)}
                  onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.4)'}
                  onBlur={e => e.target.style.borderColor='var(--b1)'}
                />
              </Field>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:'16px 28px', borderTop:'1px solid var(--b1)', display:'flex', gap:'10px', flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'11px 22px', background:'transparent', border:'1px solid var(--b2)', borderRadius:'8px', color:'var(--t2)', fontFamily:'var(--ff-mono)', fontSize:'11px', letterSpacing:'0.08em', cursor:'pointer', textTransform:'uppercase' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || saved}
            style={{ flex:1, padding:'11px', background: saved ? '#00cc66' : 'var(--signal)', border:'none', borderRadius:'8px', color:'#050709', fontFamily:'var(--ff-mono)', fontSize:'12px', fontWeight:700, letterSpacing:'0.1em', cursor: saving||saved ? 'not-allowed' : 'pointer', textTransform:'uppercase', transition:'all 0.2s', opacity: saving ? 0.7 : 1 }}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : '→ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}