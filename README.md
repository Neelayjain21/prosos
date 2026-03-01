# PROS — Placement Readiness Optimization System

A production-grade intelligent preparation engine for mechanical engineering campus placements.

---

## Folder Structure

```
src/
├── components/
│   ├── CustomTooltip.jsx     # Recharts tooltip (shared)
│   ├── Loader.jsx            # Loading spinner
│   ├── ProgressBar.jsx       # Reusable progress bar
│   ├── ReadinessGauge.jsx    # SVG ring score gauge
│   ├── Sidebar.jsx           # Navigation sidebar
│   ├── StatCard.jsx          # Single metric card
│   ├── Toast.jsx             # Toast notifications
│   └── WeeklyWarningBanner.jsx # Smart nudge alerts
│
├── hooks/
│   ├── useLogs.js            # Central Firestore data hook
│   └── useToast.js           # Toast state hook
│
├── pages/
│   ├── Analytics.jsx         # 5 charts + heatmap
│   ├── Dashboard.jsx         # Command center
│   ├── DailyLog.jsx          # Log entry + history
│   ├── Login.jsx             # Auth page
│   └── Subjects.jsx          # Subject completion module
│
├── utils/
│   ├── aggregation.js        # All data crunching (pure functions)
│   ├── constants.js          # Subjects, targets, weights
│   ├── dateUtils.js          # Date helpers (pure functions)
│   └── scoring.js            # Readiness Score formula
│
├── App.jsx                   # Router + auth protection
├── firebase.js               # Firebase init
├── index.css                 # Full design system
└── main.jsx                  # Entry point
```

---

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Create a **Firestore Database** (start in production mode)
5. Go to **Project Settings** → **Your apps** → Add Web App
6. Copy the config object

### 3. Configure Firebase

Open `src/firebase.js` and replace the config:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
```

### 4. Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /logs/{logId} {
      allow read, update, delete: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 5. Run

```bash
npm run dev
```

---

## Readiness Score Formula

```
Score = (Subject Completion × 0.40)
      + (Weekly Consistency × 0.30)
      + (Coding Focus       × 0.20)
      + (Mood Stability     × 0.10)
```

- **Subject Completion** — average completion % across all 8 subjects
- **Weekly Consistency** — average of (actual/target) across all logged weeks
- **Coding Focus** — coding hours / total hours (ideal ≥ 40%)
- **Mood Stability** — average mood scaled from 1–5 to 0–100

All computed in `src/utils/scoring.js`.

---

## Subject Targets

| Subject              | Target Hours |
|---------------------|-------------|
| Thermodynamics       | 120h        |
| Heat Transfer        | 90h         |
| Fluid Mechanics      | 110h        |
| Strength of Materials| 100h        |
| Machine Design       | 80h         |
| Manufacturing        | 60h         |
| Control Systems      | 70h         |
| Numerical Methods    | 50h         |

A subject is flagged **neglected** if not studied in 10+ days.

---

## Heatmap Intensity Scale

| Hours/day | Level  |
|-----------|--------|
| 0         | Empty  |
| < 2h      | Low    |
| 2–4h      | Medium |
| 4–6h      | High   |
| 6h+       | Peak   |
