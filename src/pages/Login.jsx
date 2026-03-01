import { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const googleProvider = new GoogleAuthProvider();

/* ── Password strength checker ── */
function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'WEAK',   color: '#ff4444' };
  if (score <= 2) return { score, label: 'FAIR',   color: '#ffb020' };
  if (score <= 3) return { score, label: 'GOOD',   color: '#38bdf8' };
  return              { score, label: 'STRONG', color: '#00ff88' };
}

/* ── Animated orbital canvas ── */
function OrbitalCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const particles = Array.from({ length: 80 }, () => ({
      x:    Math.random(),
      y:    Math.random(),
      r:    Math.random() * 1.5 + 0.3,
      spd:  Math.random() * 0.00015 + 0.00005,
      alpha:Math.random() * 0.6 + 0.1,
    }));

    // Orbitals config
    const orbitals = [
      { rx: 0.38, ry: 0.18, tilt: -20, speed: 0.0004, color: '#00ff88', alpha: 0.25, dash: [6,4] },
      { rx: 0.28, ry: 0.13, tilt:  15, speed: 0.0007, color: '#38bdf8', alpha: 0.20, dash: [4,8] },
      { rx: 0.20, ry: 0.09, tilt: -35, speed: 0.001,  color: '#00ff88', alpha: 0.15, dash: [2,6] },
    ];

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const cx = W * 0.5;
      const cy = H * 0.52;

      ctx.clearRect(0, 0, W, H);

      // Stars
      particles.forEach(p => {
        p.y -= p.spd;
        if (p.y < 0) { p.y = 1; p.x = Math.random(); }
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
      });

      // Central glow
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.22);
      grd.addColorStop(0,   'rgba(0,255,136,0.08)');
      grd.addColorStop(0.5, 'rgba(0,255,136,0.03)');
      grd.addColorStop(1,   'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, W * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Orbitals (tilted ellipses)
      orbitals.forEach((orb, i) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((orb.tilt * Math.PI) / 180);
        ctx.beginPath();
        ctx.ellipse(0, 0, W * orb.rx, H * orb.ry, 0, 0, Math.PI * 2);
        ctx.setLineDash(orb.dash);
        ctx.strokeStyle = orb.color.replace(')', `,${orb.alpha})`).replace('rgb', 'rgba').replace('#00ff88', `rgba(0,255,136,${orb.alpha})`).replace('#38bdf8', `rgba(56,189,248,${orb.alpha})`);
        ctx.strokeStyle = i === 1 ? `rgba(56,189,248,${orb.alpha})` : `rgba(0,255,136,${orb.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Dot on orbital
        const angle = t * orb.speed * 1000;
        const dotX  = Math.cos(angle) * W * orb.rx;
        const dotY  = Math.sin(angle) * H * orb.ry;
        const dotC  = i === 1 ? '56,189,248' : '0,255,136';

        // Dot glow
        const dg = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 12);
        dg.addColorStop(0,   `rgba(${dotC},0.9)`);
        dg.addColorStop(0.4, `rgba(${dotC},0.3)`);
        dg.addColorStop(1,   'transparent');
        ctx.beginPath();
        ctx.arc(dotX, dotY, 12, 0, Math.PI * 2);
        ctx.fillStyle = dg;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotC},1)`;
        ctx.fill();

        ctx.restore();
      });

      // Center dot
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
      cg.addColorStop(0,   'rgba(0,255,136,1)');
      cg.addColorStop(0.3, 'rgba(0,255,136,0.4)');
      cg.addColorStop(1,   'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff88';
      ctx.fill();

      t++;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

/* ── Typewriter component ── */
function Typewriter({ lines, speed = 55 }) {
  const [displayed, setDisplayed] = useState('');
  const [lineIdx, setLineIdx]     = useState(0);
  const [charIdx, setCharIdx]     = useState(0);
  const [blinking, setBlinking]   = useState(true);

  useEffect(() => {
    if (lineIdx >= lines.length) return;
    const current = lines[lineIdx];
    if (charIdx < current.length) {
      const t = setTimeout(() => {
        setDisplayed(d => d + current[charIdx]);
        setCharIdx(c => c + 1);
        setBlinking(false);
      }, speed + Math.random() * 30);
      return () => clearTimeout(t);
    } else if (lineIdx < lines.length - 1) {
      const t = setTimeout(() => {
        setDisplayed(d => d + '\n');
        setLineIdx(l => l + 1);
        setCharIdx(0);
        setBlinking(true);
      }, 600);
      return () => clearTimeout(t);
    } else {
      setBlinking(true);
    }
  }, [charIdx, lineIdx, lines, speed]);

  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '13px',
      color: 'rgba(0,255,136,0.85)',
      letterSpacing: '0.03em',
      lineHeight: 1.8,
      whiteSpace: 'pre',
      minHeight: '80px',
    }}>
      {displayed}
      <span style={{
        display: 'inline-block',
        width: '8px',
        height: '14px',
        background: '#00ff88',
        marginLeft: '2px',
        verticalAlign: 'middle',
        animation: blinking ? 'blink-cur 1s step-end infinite' : 'none',
        opacity: blinking ? 1 : 0,
      }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN LOGIN COMPONENT
══════════════════════════════════════════════════════════════ */
export function Login() {
  const [mode,      setMode]      = useState('login');   // 'login' | 'signup' | 'reset'
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [gLoading,  setGLoading]  = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [mounted,   setMounted]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const strength = mode === 'signup' ? getStrength(password) : null;

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setSuccess('');
    setPassword('');
  };

  // ── Email/password ──
  const submit = async () => {
    setError(''); setSuccess('');
    if (!email.trim()) { setError('Email is required.'); return; }

    if (mode === 'reset') {
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccess('Reset link sent! Check your inbox.');
      } catch (e) {
        setError(e.message.replace('Firebase: ', ''));
      } finally { setLoading(false); }
      return;
    }

    if (!password) { setError('Password is required.'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      navigate('/dashboard');
    } catch (e) {
      const msg = e.message.replace('Firebase: ', '');
      setError(
        msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')
          ? 'Invalid email or password.'
          : msg.includes('email-already-in-use')
          ? 'An account with this email already exists.'
          : msg
      );
    } finally { setLoading(false); }
  };

  // ── Google ──
  const signInWithGoogle = async () => {
    setError(''); setGLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError(e.message.replace('Firebase: ', ''));
      }
    } finally { setGLoading(false); }
  };

  const modeLabel = mode === 'login' ? 'SIGN IN' : mode === 'signup' ? 'CREATE ACCOUNT' : 'RESET PASSWORD';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@300;400;500;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        @keyframes blink-cur {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes aurora-login {
          0%   { opacity: 1; transform: scale(1) rotate(0deg); }
          50%  { opacity: 0.7; transform: scale(1.08) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes float-orb {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33%  { transform: translateY(-20px) translateX(10px); }
          66%  { transform: translateY(10px) translateX(-8px); }
        }

        .login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 500px;
          background: #02040a;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 52px 56px;
        }

        /* Aurora orbs in left panel */
        .login-left::before {
          content: '';
          position: absolute;
          top: -100px; left: -100px;
          width: 600px; height: 600px;
          background: radial-gradient(ellipse, rgba(0,255,136,0.12) 0%, transparent 70%);
          pointer-events: none;
          animation: float-orb 12s ease-in-out infinite;
        }

        .login-left::after {
          content: '';
          position: absolute;
          bottom: -80px; right: -60px;
          width: 500px; height: 400px;
          background: radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 70%);
          pointer-events: none;
          animation: float-orb 16s ease-in-out infinite reverse;
        }

        .login-left-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(2,4,10,0.3) 0%,
            rgba(2,4,10,0.65) 100%
          );
          pointer-events: none;
          z-index: 1;
        }

        .login-left-content {
          position: relative;
          z-index: 2;
          animation: fadeUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s both;
        }

        .login-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0,255,136,0.08);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,255,136,0.22);
          border-radius: 6px;
          padding: 7px 16px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #00ff88;
          margin-bottom: 22px;
          box-shadow: inset 0 1px 0 rgba(0,255,136,0.1), 0 0 20px rgba(0,255,136,0.06);
        }

        .login-tag-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #00ff88;
          box-shadow: 0 0 8px #00ff88, 0 0 20px rgba(0,255,136,0.5);
          animation: blink-cur 2s ease-in-out infinite;
        }

        .login-hero-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(56px, 7.5vw, 90px);
          letter-spacing: 0.04em;
          color: #f0f4f8;
          line-height: 0.93;
          margin-bottom: 18px;
        }

        .login-hero-title span {
          color: #00ff88;
          display: block;
          text-shadow: 0 0 40px rgba(0,255,136,0.4);
        }

        .login-hero-sub {
          font-size: 15px;
          color: rgba(148,163,184,0.8);
          margin-bottom: 32px;
          line-height: 1.7;
          max-width: 420px;
        }

        .login-stats-row {
          display: flex;
          gap: 0;
          flex-wrap: wrap;
        }

        .login-stat {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 14px 20px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          margin-right: -1px;
          margin-bottom: -1px;
        }

        .login-stat:first-child { border-radius: 10px 0 0 10px; }
        .login-stat:last-child  { border-radius: 0 10px 10px 0; margin-right: 0; }

        .login-stat-val {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 30px;
          color: #f0f4f8;
          line-height: 1;
        }

        .login-stat-lbl {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(74,85,104,1);
        }

        /* ── RIGHT PANEL — Glass auth panel ── */
        .login-right {
          background: rgba(2,4,10,0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-left: 1px solid rgba(255,255,255,0.07);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 52px 48px;
          position: relative;
          overflow: hidden;
          box-shadow: -20px 0 60px rgba(0,0,0,0.4);
        }

        /* Top gradient line scan */
        .login-right::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,255,136,0.7), rgba(56,189,248,0.5), transparent);
        }

        /* Corner bracket decorations */
        .login-right::after {
          content: '';
          position: absolute;
          top: 24px; right: 24px;
          width: 28px; height: 28px;
          border-top: 1px solid rgba(0,255,136,0.35);
          border-right: 1px solid rgba(0,255,136,0.35);
          pointer-events: none;
        }

        .login-corner-bl {
          position: absolute;
          bottom: 24px; left: 24px;
          width: 28px; height: 28px;
          border-bottom: 1px solid rgba(0,255,136,0.2);
          border-left: 1px solid rgba(0,255,136,0.2);
          pointer-events: none;
        }

        .login-form-header {
          margin-bottom: 28px;
          animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both;
        }

        .login-form-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #00ff88;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .login-form-eyebrow::before {
          content: '';
          width: 16px; height: 1px;
          background: linear-gradient(90deg, #00ff88, transparent);
          box-shadow: 0 0 6px #00ff88;
        }

        .login-form-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 38px;
          letter-spacing: 0.05em;
          color: #f0f4f8;
          line-height: 1;
        }

        /* Mode tabs */
        .login-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 28px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s both;
        }

        .login-tab {
          padding: 10px 18px 12px;
          border: none;
          background: transparent;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          color: rgba(74,85,104,1);
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.2s;
        }

        .login-tab:hover { color: rgba(148,163,184,0.8); }
        .login-tab.active { color: #00ff88; border-bottom-color: #00ff88; text-shadow: 0 0 12px rgba(0,255,136,0.4); }

        /* Fields */
        .lf-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
          animation: slideIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }

        .lf-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(74,85,104,1);
        }

        .lf-input-wrap { position: relative; }

        .lf-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: #f0f4f8;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          padding: 12px 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
        }

        .lf-input:focus {
          border-color: rgba(0,255,136,0.4);
          background: rgba(0,255,136,0.04);
          box-shadow: 0 0 0 3px rgba(0,255,136,0.08), 0 0 20px rgba(0,255,136,0.05);
        }

        .lf-input::placeholder { color: rgba(45,55,72,1); }
        .lf-input.has-btn { padding-right: 46px; }

        .lf-pw-toggle {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(74,85,104,1);
          padding: 4px;
          font-size: 15px;
          transition: color 0.15s;
          line-height: 1;
          display: flex;
          align-items: center;
        }

        .lf-pw-toggle:hover { color: rgba(148,163,184,0.8); }

        /* Strength bar */
        .pw-strength { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
        .pw-strength-bars { display: flex; gap: 3px; flex: 1; }
        .pw-bar { height: 3px; flex: 1; border-radius: 2px; background: rgba(255,255,255,0.06); transition: background 0.3s; }
        .pw-strength-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; min-width: 44px; text-align: right; }

        /* Forgot link */
        .lf-forgot { text-align: right; margin-top: -6px; margin-bottom: 14px; }
        .lf-forgot button { background: none; border: none; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.08em; color: rgba(74,85,104,1); transition: color 0.15s; padding: 2px 0; }
        .lf-forgot button:hover { color: #00ff88; }

        /* Alert */
        .lf-alert {
          border-radius: 10px;
          padding: 11px 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          line-height: 1.5;
          letter-spacing: 0.02em;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 16px;
          animation: slideIn 0.3s ease both;
          backdrop-filter: blur(8px);
        }

        .lf-alert-error   {
          background: linear-gradient(135deg, rgba(255,68,68,0.08), rgba(255,68,68,0.04));
          border: 1px solid rgba(255,68,68,0.22);
          color: #ff4444;
          box-shadow: inset 0 1px 0 rgba(255,68,68,0.1);
        }
        .lf-alert-success {
          background: linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,255,136,0.04));
          border: 1px solid rgba(0,255,136,0.22);
          color: #00ff88;
          box-shadow: inset 0 1px 0 rgba(0,255,136,0.1);
        }

        /* Primary button */
        .lf-btn-primary {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #00ff88, #00cc66);
          border: none;
          border-radius: 10px;
          color: #02040a;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
          position: relative;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 4px 20px rgba(0,255,136,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
        }

        .lf-btn-primary::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.5s;
        }

        .lf-btn-primary:hover:not(:disabled)::after { left: 100%; }

        .lf-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #1aff99, #00ff88);
          box-shadow: 0 6px 32px rgba(0,255,136,0.55), 0 0 50px rgba(0,255,136,0.15), inset 0 1px 0 rgba(255,255,255,0.4);
          transform: translateY(-2px);
        }

        .lf-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .lf-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Divider */
        .lf-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .lf-divider-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); }
        .lf-divider-text { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(45,55,72,1); }

        /* Google button */
        .lf-btn-google {
          width: 100%;
          padding: 12px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          color: #f0f4f8;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          margin-bottom: 24px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .lf-btn-google:hover:not(:disabled) {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.07);
          transform: translateY(-1px);
        }

        .lf-btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Bottom link */
        .lf-bottom { text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.06em; color: rgba(74,85,104,1); }
        .lf-bottom button { background: none; border: none; cursor: pointer; color: #00ff88; font-family: inherit; font-size: inherit; letter-spacing: inherit; text-decoration: underline; text-underline-offset: 3px; transition: opacity 0.15s; }
        .lf-bottom button:hover { opacity: 0.7; }

        /* Spinners */
        .lf-spinner      { width: 16px; height: 16px; border: 2px solid rgba(5,7,9,0.3); border-top-color: #050709; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        .lf-spinner-dark { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.08); border-top-color: #00ff88; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }

        @media (max-width: 860px) {
          .login-root { grid-template-columns: 1fr; }
          .login-left { display: none; }
          .login-right { padding: 36px 28px; }
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT: Visual panel ── */}
        <div className="login-left">
          <OrbitalCanvas />
          <div className="login-left-overlay" />
          <div className="login-left-content">

            <div className="login-tag">
              <span className="login-tag-dot" />
              PROS — Placement Readiness System
            </div>

            <h1 className="login-hero-title">
              MISSION<br />
              <span>CONTROL</span>
            </h1>

            <p className="login-hero-sub">
              Your 100-day preparation engine for Mechanical Engineering placements.
              Track, optimize, and dominate.
            </p>

            <div style={{ marginBottom: '32px' }}>
              <Typewriter lines={[
                '> Initializing PROS v2.0...',
                '> Loading subject modules...',
                '> Readiness engine: ONLINE',
                '> Welcome, Engineer.',
              ]} />
            </div>

            <div className="login-stats-row">
              {[
                { v: String(Math.max(0,Math.ceil((new Date(2026,6,1)-new Date())/86400000))), l: 'Days Left' },
                { v: '8',   l: 'Core Subjects'   },
                { v: '680h',l: 'Target Hours'    },
                { v: '🎯',  l: 'Your Deadline'   },
              ].map(s => (
                <div key={s.l} className="login-stat">
                  <div className="login-stat-val">{s.v}</div>
                  <div className="login-stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Auth panel ── */}
        <div className="login-right">
          <div className="login-corner-bl" />

          {/* Header */}
          <div className="login-form-header">
            <div className="login-form-eyebrow">{modeLabel}</div>
            <div className="login-form-title">
              {mode === 'reset' ? 'Password Reset' : mode === 'login' ? 'Welcome Back' : 'Join the Mission'}
            </div>
          </div>

          {/* Mode tabs (not shown in reset mode) */}
          {mode !== 'reset' && (
            <div className="login-tabs">
              <button className={`login-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
              <button className={`login-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchMode('signup')}>Create Account</button>
            </div>
          )}

          {/* Google (not shown in reset mode) */}
          {mode !== 'reset' && (
            <>
              <button className="lf-btn-google" onClick={signInWithGoogle} disabled={gLoading || loading}>
                {gLoading
                  ? <span className="lf-spinner-dark" />
                  : <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                }
                {gLoading ? 'Signing in...' : 'Continue with Google'}
              </button>

              <div className="lf-divider">
                <div className="lf-divider-line" />
                <span className="lf-divider-text">or</span>
                <div className="lf-divider-line" />
              </div>
            </>
          )}

          {/* Email */}
          <div className="lf-group" style={{ animationDelay: '0.05s' }}>
            <label className="lf-label">Email Address</label>
            <div className="lf-input-wrap">
              <input
                className="lf-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                autoFocus
              />
            </div>
          </div>

          {/* Password (hidden in reset mode) */}
          {mode !== 'reset' && (
            <div className="lf-group" style={{ animationDelay: '0.1s' }}>
              <label className="lf-label">Password</label>
              <div className="lf-input-wrap">
                <input
                  className="lf-input has-btn"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
                <button className="lf-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>

              {/* Strength meter — only in signup */}
              {mode === 'signup' && password && (
                <div className="pw-strength">
                  <div className="pw-strength-bars">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className="pw-bar"
                        style={{ background: i <= strength.score ? strength.color : undefined }}
                      />
                    ))}
                  </div>
                  <span className="pw-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Forgot password link */}
          {mode === 'login' && (
            <div className="lf-forgot">
              <button onClick={() => switchMode('reset')}>Forgot password?</button>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="lf-alert lf-alert-error">
              <span>⚠</span><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="lf-alert lf-alert-success">
              <span>✓</span><span>{success}</span>
            </div>
          )}

          {/* Submit */}
          <button
            className="lf-btn-primary"
            onClick={submit}
            disabled={loading || gLoading}
            style={{ animationDelay: '0.15s' }}
          >
            {loading
              ? <span className="lf-spinner" />
              : mode === 'login'  ? '→  Sign In'
              : mode === 'signup' ? '→  Create Account'
              : '→  Send Reset Link'
            }
          </button>

          {/* Bottom links */}
          <div className="lf-bottom">
            {mode === 'login' && (
              <>No account?&nbsp;<button onClick={() => switchMode('signup')}>Create one</button></>
            )}
            {mode === 'signup' && (
              <>Already have an account?&nbsp;<button onClick={() => switchMode('login')}>Sign in</button></>
            )}
            {mode === 'reset' && (
              <>Remember it?&nbsp;<button onClick={() => switchMode('login')}>Back to sign in</button></>
            )}
          </div>

        </div>
      </div>
    </>
  );
}