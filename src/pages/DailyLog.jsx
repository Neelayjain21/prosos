import { useState }          from 'react';
import { useNavigate }        from 'react-router-dom';
import { useLogs }            from '../hooks/useLogs';
import { useProfile }         from '../UserContext';
import { useToast }           from '../hooks/useToast';
import { ToastContainer }     from '../components/Toast';
import { Loader }             from '../components/Loader';
import { SUBJECT_LIST, MOOD_OPTIONS, MOOD_MAP } from '../utils/constants';
import { toISO }              from '../utils/dateUtils';

const EMPTY_FORM = {
  mechanicalHours: '',
  codingHours:     '',
  subject:         SUBJECT_LIST[0],
  topics:          '',
  numericals:      '',
  notes:           '',
  mood:            3,
};

export function DailyLog() {
  const navigate          = useNavigate();
  const { toast, toasts } = useToast();
  const { logs, loading, addLog, updateLog, deleteLog } = useLogs();
  const { profile } = useProfile();
  const firstName = profile?.nickname || profile?.name?.split(' ')[0] || 'Engineer';

  const [view,      setView]      = useState('form');    // 'form' | 'history'
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [editEntry, setEditEntry] = useState(null);      // null | { id, ...fields }
  const [deleting,  setDeleting]  = useState(null);      // id being confirmed

  const todayStr    = toISO();
  const todayLogged = logs.some(l => l.date === todayStr);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Submit new log ──
  const handleSubmit = async () => {
    if (!form.mechanicalHours && !form.codingHours) {
      toast('Enter at least one hours field', 'error'); return;
    }
    setSaving(true);
    try {
      await addLog({
        date:            todayStr,
        mechanicalHours: Number(form.mechanicalHours) || 0,
        codingHours:     Number(form.codingHours)     || 0,
        subject:         form.subject,
        topics:          form.topics,
        numericals:      Number(form.numericals) || 0,
        notes:           form.notes,
        mood:            Number(form.mood),
      });
      toast('Day logged successfully!');
      setForm(EMPTY_FORM);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      console.error('[addLog]', err);
      toast('Error saving log: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Save edit ──
  const handleEditSave = async () => {
    setSaving(true);
    try {
      const { id, ...fields } = editEntry;
      await updateLog(id, {
        ...fields,
        mechanicalHours: Number(fields.mechanicalHours) || 0,
        codingHours:     Number(fields.codingHours)     || 0,
        numericals:      Number(fields.numericals)      || 0,
        mood:            Number(fields.mood),
      });
      toast('Entry updated');
      setEditEntry(null);
    } catch (err) {
      console.error('[updateLog]', err);
      toast('Error updating: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    await deleteLog(id);
    toast('Entry deleted');
    setDeleting(null);
  };

  if (loading) return <Loader />;

  return (
    <div className="page">
      <ToastContainer toasts={toasts} />

      {/* Edit Modal */}
      {editEntry && (
        <div className="modal-overlay" onClick={() => setEditEntry(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '12px', letterSpacing: '0.12em', color: 'var(--signal)', marginBottom: '20px', textTransform: 'uppercase' }}>
              Edit Entry — {editEntry.date}
            </div>
            <LogForm
              form={editEntry}
              setField={(k, v) => setEditEntry(e => ({ ...e, [k]: v }))}
            />
            <div className="row" style={{ marginTop: '20px', gap: '10px' }}>
              <button className="btn btn-primary flex-1" onClick={handleEditSave} disabled={saving}>
                {saving ? '...' : '✓ Save Changes'}
              </button>
              <button className="btn btn-ghost" onClick={() => setEditEntry(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="row-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="page-eyebrow">Data Entry — {firstName}</div>
            <h1 className="page-title">Daily Log</h1>
            <p className="page-sub">{todayStr}</p>
          </div>
          <div style={{ display: 'flex', background: 'var(--bg1)', borderRadius: 'var(--r)', padding: '3px', border: '1px solid var(--b1)' }}>
            {[['form', '+ New Entry'], ['history', 'All Logs']].map(([v, lbl]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '8px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontFamily: 'var(--ff-mono)', fontSize: '11px', letterSpacing: '0.08em',
                  textTransform: 'uppercase', transition: 'all 0.15s',
                  background: view === v ? 'var(--bg3)' : 'transparent',
                  color: view === v ? 'var(--signal)' : 'var(--t3)',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form View ── */}
      {view === 'form' && (
        <div className="card card-signal">
          {todayLogged && (
            <div className="alert alert-warn" style={{ marginBottom: '20px' }}>
              ⚠ Already logged today. Submitting will add another entry — edit existing from All Logs.
            </div>
          )}
          <LogForm form={form} setField={setField} />
          {(form.mechanicalHours || form.codingHours) && (
            <div className="alert alert-info" style={{ margin: '16px 0' }}>
              Logging {(+form.mechanicalHours || 0) + (+form.codingHours || 0)}h total for {todayStr}
            </div>
          )}
          <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={saving} style={{ marginTop: '4px' }}>
            {saving ? 'Saving...' : '✓ Save Today\'s Log'}
          </button>
        </div>
      )}

      {/* ── History View ── */}
      {view === 'history' && (
        <div className="stack" style={{ gap: '8px' }}>
          {logs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--t2)' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '13px' }}>No logs yet. Switch to New Entry.</div>
            </div>
          ) : logs.map(log => (
            <LogHistoryRow
              key={log.id}
              log={log}
              onEdit={() => setEditEntry({ ...log })}
              onDelete={() => setDeleting(log.id)}
              confirmDelete={deleting === log.id}
              onConfirmDelete={() => handleDelete(log.id)}
              onCancelDelete={() => setDeleting(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── LogForm — shared between new entry and edit modal ── */
function LogForm({ form, setField }) {
  return (
    <div className="form-grid">
      <div className="form-group">
        <label className="form-label">⚙ Mechanical Hours</label>
        <input className="form-input" type="number" min="0" step="0.5" placeholder="2.5"
          value={form.mechanicalHours} onChange={e => setField('mechanicalHours', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">⌨ Coding Hours</label>
        <input className="form-input" type="number" min="0" step="0.5" placeholder="1.5"
          value={form.codingHours} onChange={e => setField('codingHours', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Subject</label>
        <select className="form-input" value={form.subject} onChange={e => setField('subject', e.target.value)}>
          {SUBJECT_LIST.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Numericals Solved</label>
        <input className="form-input" type="number" min="0" placeholder="12"
          value={form.numericals} onChange={e => setField('numericals', e.target.value)} />
      </div>
      <div className="form-group full">
        <label className="form-label">Topics Covered</label>
        <input className="form-input" placeholder="e.g. Bernoulli equation, boundary layer..."
          value={form.topics} onChange={e => setField('topics', e.target.value)} />
      </div>
      <div className="form-group full">
        <label className="form-label">Notes / Blockers</label>
        <textarea className="form-input" placeholder="What clicked? What to revisit?"
          value={form.notes} onChange={e => setField('notes', e.target.value)} />
      </div>
      <div className="form-group full">
        <label className="form-label">Energy Level</label>
        <div className="mood-grid">
          {MOOD_OPTIONS.map(m => (
            <button
              key={m.val}
              className={`mood-btn ${Number(form.mood) === m.val ? 'selected' : ''}`}
              onClick={() => setField('mood', m.val)}
            >
              <span className="mood-emoji">{m.emoji}</span>
              <span className="mood-label">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Log History Row ── */
function LogHistoryRow({ log, onEdit, onDelete, confirmDelete, onConfirmDelete, onCancelDelete }) {
  const total = (log.mechanicalHours || 0) + (log.codingHours || 0);
  return (
    <div className="log-row" style={{ gridTemplateColumns: '70px 1fr auto' }}>
      <div className="log-date-badge">
        <div className="log-day-num">{log.date?.slice(8)}</div>
        <div className="log-month">{log.date?.slice(5, 7)}/{log.date?.slice(2, 4)}</div>
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '5px', color: 'var(--t0)' }}>
          {log.subject}
          {log.topics && <span style={{ color: 'var(--t2)', fontWeight: 400 }}> · {log.topics}</span>}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
          {log.mechanicalHours > 0 && <Chip c="var(--amber)">⚙ {log.mechanicalHours}h</Chip>}
          {log.codingHours     > 0 && <Chip c="var(--cyan)">⌨ {log.codingHours}h</Chip>}
          {log.numericals      > 0 && <Chip c="var(--signal)">◈ {log.numericals} nums</Chip>}
          <Chip c="var(--t2)">{MOOD_MAP[log.mood] || '—'}</Chip>
        </div>
        {log.notes && <div style={{ fontSize: '12px', color: 'var(--t2)' }}>{log.notes}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
        <div style={{ fontFamily: 'var(--ff-display)', fontSize: '22px', color: 'var(--signal)' }}>
          {total.toFixed(1)}<span style={{ fontSize: '12px', color: 'var(--t2)' }}>h</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn btn-ghost btn-sm" onClick={onEdit} style={{ padding: '4px 10px', fontSize: '11px' }}>Edit</button>
          {confirmDelete
            ? <>
                <button className="btn btn-danger btn-sm" onClick={onConfirmDelete} style={{ padding: '4px 10px', fontSize: '11px' }}>Sure?</button>
                <button className="btn btn-ghost btn-sm" onClick={onCancelDelete} style={{ padding: '4px 10px', fontSize: '11px' }}>×</button>
              </>
            : <button className="btn btn-ghost btn-sm" onClick={onDelete} style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--red)' }}>Del</button>
          }
        </div>
      </div>
    </div>
  );
}

function Chip({ children, c }) {
  return (
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: `${c}18`, color: c, letterSpacing: '0.03em' }}>
      {children}
    </span>
  );
}
