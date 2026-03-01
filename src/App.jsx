import { useState, useEffect }                         from 'react';
import { BrowserRouter, Routes, Route, Navigate }     from 'react-router-dom';
import { onAuthStateChanged }                         from 'firebase/auth';
import { auth }                                       from './firebase';
import { LogsProvider }                               from './LogsContext';
import { UserProvider, useProfile }                   from './UserContext';
import { Sidebar }                                    from './components/Sidebar';
import { Loader }                                     from './components/Loader';
import { Login }                                      from './pages/Login';
import { Onboarding }                                 from './pages/Onboarding';
import { Dashboard }                                  from './pages/Dashboard';
import { DailyLog }                                   from './pages/DailyLog';
import { Subjects }                                   from './pages/Subjects';
import { Analytics }                                  from './pages/Analytics';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function Protected({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Inner app that has access to UserProvider context
function InnerApp({ user }) {
  const { profileLoading, needsOnboarding } = useProfile();

  if (profileLoading) return <Loader text="LOADING PROFILE" />;

  // New user — collect profile before anything else
  if (user && needsOnboarding) return <Onboarding />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route path="/dashboard" element={
        <Protected user={user}>
          <AppLayout><Dashboard /></AppLayout>
        </Protected>
      } />
      <Route path="/log" element={
        <Protected user={user}>
          <AppLayout><DailyLog /></AppLayout>
        </Protected>
      } />
      <Route path="/subjects" element={
        <Protected user={user}>
          <AppLayout><Subjects /></AppLayout>
        </Protected>
      } />
      <Route path="/analytics" element={
        <Protected user={user}>
          <AppLayout><Analytics /></AppLayout>
        </Protected>
      } />

      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  const [user,        setUser]        = useState(undefined);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  if (!authChecked) return <Loader text="INITIALIZING SYSTEM" />;

  return (
    <BrowserRouter>
      <UserProvider user={user}>
        <LogsProvider user={user}>
          <InnerApp user={user} />
        </LogsProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
