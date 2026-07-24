

import { useState } from 'react';
import { useNavigate as useRouter } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkflowStore } from '../store/workflowStore';
import api from '../lib/api';
import { useNotificationStore } from '../store/notificationStore';

export const useLogout = () => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const performLogout = async () => {
    setIsLoggingOut(true);
    
    // Prefetch login for instant transition
    router.prefetch('/login');

    try {
      // 1. Notify Backend
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Backend logout sync failed', err);
    } finally {
      // 2. Client Side Cleanup (Always run even if API fails)
      
      // Clear Auth State
      logout();
      
      // Clear cached data from other stores if needed
      // (Assuming store.setState is available or reset methods exist)
      useWorkflowStore.setState({ tasks: [], currentProject: null, currentSprint: null });
      
      setIsLoggingOut(false);
      
      // 3. Redirect
      router.push('/login');
      
      addNotification({
        title: 'Logged Out',
        message: 'Your session has been securely terminated.',
        type: 'SUCCESS'
      });
    }
  };

  return { performLogout, isLoggingOut };
};

