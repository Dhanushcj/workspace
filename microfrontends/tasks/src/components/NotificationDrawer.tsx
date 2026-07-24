

import React from 'react';
import { X, Bell, Trash2, Check, Info, AlertCircle, CircleCheck as CircleCheck, Zap } from 'lucide-react';
import { useNotificationStore, NotificationType } from '../store/notificationStore';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { notifications, markAsRead, clearAll } = useNotificationStore();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'SUCCESS': return <CircleCheck size={18} className="text-emerald-500" />;
      case 'WARNING': return <Zap size={18} className="text-amber-500" />;
      case 'ERROR': return <AlertCircle size={18} className="text-red-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  const getBg = (type: NotificationType) => {
    switch (type) {
      case 'SUCCESS': return 'bg-emerald-50';
      case 'WARNING': return 'bg-amber-50';
      case 'ERROR': return 'bg-red-50';
      default: return 'bg-blue-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                 <Bell size={20} />
              </div>
              <div>
                 <h2 className="text-lg font-black tracking-tight">Forge Alerts</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notifications.filter(n => !n.read).length} Unread</p>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={clearAll}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                title="Clear All"
              >
                 <Trash2 size={18} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 text-slate-400 rounded-xl transition-all"
              >
                 <X size={20} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
           {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 rounded-2xl border border-slate-100 cursor-pointer transition-all hover:translate-x-1 ${n.read ? 'opacity-60 grayscale-[0.5]' : 'shadow-lg shadow-slate-200/50'}`}
                >
                   <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${getBg(n.type)}`}>
                         {getIcon(n.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                         <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-black text-slate-900 truncate">{n.title}</h4>
                            {!n.read && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                         </div>
                         <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2 line-clamp-2">
                            {n.message}
                         </p>
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                      </div>
                   </div>
                </div>
              ))
           ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                 <Bell size={48} className="mb-4" />
                 <p className="text-sm font-black uppercase tracking-widest">No Alerts Found</p>
              </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100">
           <button 
             onClick={clearAll}
             className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10"
           >
              Mark All as Read
           </button>
        </div>
      </div>
    </div>
  );
}

