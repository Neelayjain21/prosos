import { NavLink, useNavigate } from 'react-router-dom';
import { signOut }              from 'firebase/auth';
import { auth }                 from '../firebase';
import { useProfile }           from '../UserContext';
import { GRADIENT_PRESETS }     from '../utils/constants';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/log',       icon: '✦', label: 'Daily Log' },
  { to: '/subjects',  icon: '◉', label: 'Subjects'  },
  { to: '/analytics', icon: '◫', label: 'Analytics' },
];

// Avatar — shows emoji if set, otherwise initials, matching Dashboard style
function Avatar({ profile, size = 36 }) {
  const initials = profile?.name
    ? profile.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const emoji = profile?.avatarEmoji || '';
  const grad  = GRADIENT_PRESETS.find(g => g.id === profile?.avatarGradient) || GRADIENT_PRESETS[0];

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: emoji
        ? grad.bg
        : 'linear-gradient(135deg, rgba(0,255,136,0.3), rgba(56,189,248,0.3))',
      border: `1px solid ${emoji ? grad.border + '88' : 'rgba(0,255,136,0.3)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--ff-mono)',
      fontSize: emoji ? Math.round(size * 0.55) + 'px' : Math.round(size * 0.35) + 'px',
      fontWeight: 700,
      color: '#00ff88',
      flexShrink: 0,
      letterSpacing: '0.05em',
    }}>
      {emoji || initials}
    </div>
  );
}

export function Sidebar() {
  const navigate        = useNavigate();
  const { profile }     = useProfile();
  const name            = profile?.nickname || profile?.name?.split(' ')[0] || 'Engineer';
  const cgpa            = profile?.cgpa;
  const college         = profile?.college;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark"><span>PROS</span></div>
        <div className="sidebar-title">Placement<br/>Readiness<br/>System</div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile card */}
      <div style={{
        margin: '12px',
        padding: '12px',
        background: 'var(--bg2)',
        border: '1px solid var(--b1)',
        borderRadius: 'var(--r)',
        cursor: 'default',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: cgpa ? '10px' : 0 }}>
          <Avatar profile={profile} />
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{
              fontFamily: 'var(--ff-body)',
              fontWeight: 600,
              fontSize: '13px',
              color: 'var(--t0)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {name}
            </div>
            {college && (
              <div style={{
                fontFamily: 'var(--ff-mono)',
                fontSize: '9px',
                color: 'var(--t3)',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '1px',
              }}>
                {college}
              </div>
            )}
          </div>
        </div>

        {cgpa && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg3)',
            borderRadius: '6px',
            padding: '6px 10px',
          }}>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--t3)', textTransform: 'uppercase' }}>
              CGPA
            </span>
            <span style={{ fontFamily: 'var(--ff-display)', fontSize: '18px', color: 'var(--signal)', lineHeight: 1 }}>
              {cgpa}
            </span>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={handleLogout}
          style={{ color: 'var(--t3)', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span className="nav-item-icon">⏻</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
