// ═══════════════════════════════════════════════════════════════
//  FIREBASE CONFIGURATION
//
//  SETUP: Replace the firebaseConfig object with your project's
//  config from Firebase Console → Project Settings → Your apps.
//
//  Firestore rules (paste in Firebase Console → Firestore → Rules):
//  ─────────────────────────────────────────────────────────────
//  rules_version = '2';
//  service cloud.firestore {
//    match /databases/{database}/documents {
//      match /logs/{logId} {
//        allow read, write: if request.auth != null
//          && request.auth.uid == resource.data.userId;
//        allow create: if request.auth != null
//          && request.auth.uid == request.resource.data.userId;
//      }
//    }
//  }
//  ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

import { initializeApp }    from 'firebase/app';
import { getAuth }          from 'firebase/auth';
import { getFirestore }     from 'firebase/firestore';

// ⚠️  Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyBIvEyWU5A3FIwhRhBIYbM3KCqYvc14rvo",
  authDomain: "placement-command-center.firebaseapp.com",
  projectId: "placement-command-center",
  storageBucket: "placement-command-center.firebasestorage.app",
  messagingSenderId: "694716208504",
  appId: "1:694716208504:web:35c1b7a1acaa993436e48d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
