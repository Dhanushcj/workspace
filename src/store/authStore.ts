import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isOnline?: boolean;
  lastSeen?: string;
  workspaceId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  currentWorkspaceId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setWorkspace: (workspaceId: string) => void;
  logout: () => Promise<void>;
  setPresence: (isOnline: boolean) => void;
}

// Clear all demo/mock data keys from localStorage to prevent API interception
const clearMockData = () => {
  if (typeof window === 'undefined') return;
  const keysToRemove = [
    'nexus-demo-mode',
    'forge-demo-mode',
    'nexus-workflow',
    'forge-workflow',
  ];
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('[AUTH] Cleared all demo/mock localStorage data');
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: JSON.parse(localStorage.getItem('auth') || 'null'),
      isAuthenticated: !!localStorage.getItem('token'),
      currentWorkspaceId: JSON.parse(localStorage.getItem('auth') || '{}')?.workspaceId || null,
      accessToken: localStorage.getItem('token') || null,
      refreshToken: localStorage.getItem('refreshToken') || null,
      setAuth: (user, accessToken, refreshToken) => {
        // Always clear mock/demo data on real login
        clearMockData();
        set({ 
          user, 
          isAuthenticated: true,
          accessToken, 
          refreshToken,
          currentWorkspaceId: user.workspaceId || null 
        });
      },
      setWorkspace: (workspaceId) => set({ currentWorkspaceId: workspaceId }),
      logout: async () => {
        try {
          const { unregisterWebPush } = await import('../utils/webPushHelper');
          await unregisterWebPush();
        } catch (e) {
          console.warn('[authStore] Push unregistration failed:', e);
        }
        clearMockData();
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null, currentWorkspaceId: null });
        window.location.href = '/';
      },
      setPresence: (isOnline) => set((state) => ({
        user: state.user ? { ...state.user, isOnline, lastSeen: new Date().toISOString() } : null
      })),
    }),

    {
      name: 'forge-auth',
    }
  )
);

