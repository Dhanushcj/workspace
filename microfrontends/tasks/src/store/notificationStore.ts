import { create } from 'zustand';
import api from '../lib/api';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAsReadAPI: (id: string) => Promise<void>;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (n) => {
    const newNotification: Notification = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({ notifications: [newNotification, ...state.notifications] }));
  },
  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications?isRead=false');
      if (res.status === 200) {
        const rawData = res.data?.data || res.data;
        const data = Array.isArray(rawData) ? rawData : [];
        
        // Transform API notification to store format if needed
        const mapped = data.map((n: any) => ({
          id: n.id,
          title: n.title || 'System Notification',
          message: n.message || n.content || '',
          type: (n.type as NotificationType) || 'INFO',
          timestamp: n.createdAt,
          read: n.isRead || false
        }));
        set({ notifications: mapped, unreadCount: mapped.length });
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  },
  fetchUnreadCount: async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      const count = res.data?.data?.count || res.data?.count || 0;
      set({ unreadCount: count });
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  },
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  markAsReadAPI: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      get().markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  },
  clearAll: async () => {
    try {
      await api.put('/notifications/read-all'); 
      set({ notifications: [] });
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  },
}));

