'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Clock, ExternalLink } from 'lucide-react';
import { useNavigate as useRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

interface Notification {
  id: string;
  type: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  read: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      // Requirement: GET /api/notifications?is_read=false&limit=10
      const res = await api.get('/notifications?is_read=false&limit=10');
      const data = res.data;
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      // Requirement: PATCH /api/notifications/:id/read
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    setIsOpen(false);

    // Entity Navigation Logic
    if (notif.entity_type === 'task') {
      router(`/dashboard/lead?taskId=${notif.entity_id}`);
    } else if (notif.entity_type === 'pr') {
      router('/dashboard/lead/code-review');
    } else if (notif.entity_type === 'blocker') {
      router('/dashboard/lead/blockers');
    } else if (notif.entity_type === 'bug') {
      router('/dashboard/developer/bugs');
    } else if (notif.entity_type === 'test') {
      router('/dashboard/tester');
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-white/5 text-slate-400 hover:text-[#FFC107] rounded-xl border border-white/5 transition-all relative group"
      >
        <Bell size={20} className="group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0f172a] shadow-lg animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-[#1A1F2E] border border-white/10 rounded-[24px] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#FFC107]">Notifications</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center gap-3 opacity-20">
                  <Bell size={32} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No new alerts</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="p-4 border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-all group relative"
                  >
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#FFC107] mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-slate-200 leading-relaxed mb-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} /> {formatTimeAgo(notif.createdAt)}
                          </span>
                          <ExternalLink size={10} className="text-[#FFC107] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-white/[0.02] border-t border-white/5 text-center">
                <button 
                  onClick={() => router('/dashboard/activity')}
                  className="text-[9px] font-black uppercase tracking-widest text-[#FFC107] hover:underline"
                >
                  View All Activity
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

