// ═══════════════════════════════════════════════════════════════
//  UserContext — stores and provides user profile globally
//  Profile is saved to Firestore: users/{uid}
//  Fetched once on login, available everywhere via useProfile()
// ═══════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const UserCtx = createContext(null);

export function UserProvider({ user, children }) {
  const [profile,        setProfile]        = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [needsOnboarding,setNeedsOnboarding]= useState(false);

  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setProfileLoading(false);
      setNeedsOnboarding(false);
      return;
    }

    (async () => {
      setProfileLoading(true);
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          setProfile(snap.data());
          setNeedsOnboarding(false);
        } else {
          // New user — needs onboarding
          setProfile(null);
          setNeedsOnboarding(true);
        }
      } catch (e) {
        console.error('[UserContext] fetch error:', e);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [uid]);

  const saveProfile = async (data) => {
    if (!uid) return;
    const payload = { ...data, uid, updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'users', uid), payload, { merge: true });
    setProfile(payload);
    setNeedsOnboarding(false);
  };

  const updateProfile = async (fields) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid), fields);
    setProfile(p => ({ ...p, ...fields }));
  };

  return (
    <UserCtx.Provider value={{
      profile, profileLoading, needsOnboarding,
      saveProfile, updateProfile,
    }}>
      {children}
    </UserCtx.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error('useProfile must be used inside <UserProvider>');
  return ctx;
}
