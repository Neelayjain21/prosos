import { createContext, useContext, useState, useEffect } from 'react';
import {
  collection, query, where,
  onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  aggregateSubjects, aggregateWeekly, thisWeekStats,
  calcStreak, moodTrend, heatmapValues,
  totalHours, totalMech, totalCoding,
} from './utils/aggregation';
import { computeReadinessScore } from './utils/scoring';

const LogsCtx = createContext(null);

export function LogsProvider({ user, children }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const uid = user?.uid ?? null; // stable primitive — safe as useEffect dependency

  useEffect(() => {
    // No user logged in — clear everything
    if (!uid) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // IMPORTANT: We only use `where`, NOT `orderBy`.
    // where + orderBy together require a Firestore composite index.
    // Without the index Firestore returns nothing (silently).
    // We sort in JS instead — no index needed.
    const q = query(
      collection(db, 'logs'),
      where('userId', '==', uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
        setLogs(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        // Surface the real error in console so you can see exactly what failed
        console.error('[Firestore] onSnapshot error:', err.code, err.message);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe when uid changes or component unmounts
    return () => unsub();

  }, [uid]); // ← uid (string) not user (object) — avoids infinite re-subscription

  // ── Mutations ───────────────────────────────────────────────
  // onSnapshot auto-updates `logs` after each write — no manual refetch.

  const addLog = async (entry) => {
    if (!uid) throw new Error('Not authenticated');
    await addDoc(collection(db, 'logs'), {
      ...entry,
      userId:    uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateLog = async (id, fields) => {
    await updateDoc(doc(db, 'logs', id), fields);
  };

  const deleteLog = async (id) => {
    await deleteDoc(doc(db, 'logs', id));
  };

  // ── Derived computations (run whenever logs changes) ────────
  const subjectStats = aggregateSubjects(logs);
  const weeklyData   = aggregateWeekly(logs);
  const weekStats    = thisWeekStats(logs);
  const streak       = calcStreak(logs);
  const moods        = moodTrend(logs);
  const heatmap      = heatmapValues(logs);
  const tHours       = totalHours(logs);
  const tMech        = totalMech(logs);
  const tCoding      = totalCoding(logs);

  const { score, breakdown } = computeReadinessScore({
    subjectStats, weeklyData,
    codingHrs: tCoding,
    allHrs:    tHours,
    logs,
  });

  return (
    <LogsCtx.Provider value={{
      logs, loading, error,
      addLog, updateLog, deleteLog,
      subjectStats, weeklyData, weekStats,
      streak, moods, heatmap,
      tHours, tMech, tCoding,
      readinessScore: score,
      scoreBreakdown: breakdown,
    }}>
      {children}
    </LogsCtx.Provider>
  );
}

export function useLogs() {
  const ctx = useContext(LogsCtx);
  if (!ctx) throw new Error('useLogs must be used inside <LogsProvider>');
  return ctx;
}