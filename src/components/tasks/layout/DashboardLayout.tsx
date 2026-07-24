'use client';

import { Sidebar } from '../../components/layout/Sidebar';
import { useAuthStore } from '../../store/authStore';
import { useNavigate as useRouter } from 'react-router-dom';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      // router('/login'); // Temporarily commented for development
    }
  }, [user, router]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto relative h-full">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-40">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Project Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

