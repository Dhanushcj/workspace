import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Code, Grid, Activity, Layers } from 'lucide-react';

// Pages to be migrated
import ManagerDashboard from './pages/ManagerDashboard';
import LeadDashboard from './pages/LeadDashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';

import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import NotificationDrawer from './components/NotificationDrawer';
import { ToastContainer } from './components/ToastContainer';

function Layout({ auth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      <TopHeader onOpenNotifications={() => setIsNotificationsOpen(true)} />
      
      <aside className="fixed top-0 left-0 bottom-0 w-[var(--sidebar-w)] bg-white border-r border-slate-100 flex flex-col z-[50]">
        <div className="h-14 shrink-0" />
        <Sidebar />
      </aside>

      <main className="flex-1 ml-[var(--sidebar-w)] h-screen flex flex-col overflow-y-auto custom-scrollbar">
        <div className="flex-1 flex flex-col pt-14 relative">
          <Routes>
            <Route path="/" element={<Navigate to={`/${(auth?.role || 'DEVELOPER').toLowerCase().replace('team_lead', 'lead')}`} replace />} />
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/lead" element={<LeadDashboard />} />
            <Route path="/developer" element={<DeveloperDashboard />} />
          </Routes>
        </div>
        <NotificationDrawer 
          isOpen={isNotificationsOpen} 
          onClose={() => setIsNotificationsOpen(false)} 
        />
      </main>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState(null);
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    // Notify shell that MFE is ready to receive auth
    window.parent.postMessage({ type: 'MFE_READY', mfeId: 'tasks' }, '*');

    const handleMessage = (event) => {
      if (event.data?.type === 'AUTH_INIT') {
        console.log('[Tasks MFE] Received AUTH_INIT from shell', event.data.auth);
        setToken(event.data.token);
        setAuth(event.data.auth);
        setIsReady(true);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Fallback if accessed directly without shell (dev mode)
    const fallbackTimeout = setTimeout(() => {
      if (!isReady) {
         console.warn('[Tasks MFE] Shell handshake timeout, using fallback local storage');
         const localToken = localStorage.getItem('token');
         const localAuth = localStorage.getItem('auth');
         if (localToken && localAuth) {
           setToken(localToken);
           setAuth(JSON.parse(localAuth));
         } else {
           // Provide mock auth for standalone development if needed
           setAuth({ role: 'DEVELOPER', user: 'Dev User' });
         }
         setIsReady(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(fallbackTimeout);
    };
  }, [isReady]);

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#090d16] text-zinc-400 font-sans">
         <div className="flex flex-col items-center gap-4">
           <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
           <span className="text-xs font-bold uppercase tracking-widest">Initializing Tasks MFE...</span>
         </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout auth={auth} />
    </BrowserRouter>
  );
}

