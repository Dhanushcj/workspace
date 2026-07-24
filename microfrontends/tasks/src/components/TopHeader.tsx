

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Zap, 
  CheckCircle, 
  GitPullRequest, 
  Bug, 
  ShieldAlert, 
  UserPlus,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import ProjectSelector from './ProjectSelector';

interface TopHeaderProps {
  onOpenNotifications: () => void;
}

export default function TopHeader({ onOpenNotifications }: TopHeaderProps) {
  const { user } = useAuthStore();
  const { notifications, markAsRead, clearAll } = useNotificationStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const hasUnread = notifications.some(n => !n.read);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PR': return { icon: GitPullRequest, bg: 'bg-indigo-50', text: 'text-indigo-600' };
      case 'BUG': return { icon: Bug, bg: 'bg-rose-50', text: 'text-rose-600' };
      case 'BLOCKER': return { icon: ShieldAlert, bg: 'bg-amber-50', text: 'text-amber-600' };
      case 'SPRINT': return { icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600' };
      default: return { icon: UserPlus, bg: 'bg-blue-50', text: 'text-blue-600' };
    }
  };

  // Mocking some high-fidelity notifications for the design
  const displayNotifications = notifications.length > 0 ? notifications : [
    { id: '1', title: 'PR #14 submitted', message: 'Dev Vikram submitted a hotfix PR for your review', type: 'PR', timestamp: '1h ago', read: false },
    { id: '2', title: 'Bug #9 logged', message: 'Priya Rao logged a bug on your task T-22 — Cart total mismatch', type: 'BUG', timestamp: '2h ago', read: false },
    { id: '3', title: 'Blocker raised', message: 'Nexus Dev raised a blocker on task T-19 — API key not provisioned', type: 'BLOCKER', timestamp: '6h ago', read: false },
    { id: '4', title: 'Sprint 2 completed', message: 'Admin Portal sprint 2 completed with velocity 44 pts', type: 'SPRINT', timestamp: 'Yesterday', read: true },
    { id: '5', title: 'New team member', message: 'Kiran Shah joined the E-Commerce Platform project', type: 'USER', timestamp: '2 days ago', read: true },
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center fixed top-0 left-0 right-0 z-[100] shadow-sm shadow-slate-100/50">
      {/* BRANDING */}
      <div className="w-[var(--sidebar-w)] h-full flex items-center px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-100 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer">
             <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
          </div>
          <div>
            <h1 className="text-[12px] font-semibold text-slate-900 tracking-tighter leading-none uppercase">
              FORGE <span className="text-blue-600">INDIA</span>
            </h1>
            <p className="text-[7px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5 leading-none">PMT APP</p>
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-100" />

      {/* PROJECT SELECTOR & RIGHT UTILITIES */}
      <div className="flex-1 flex items-center justify-between px-4">
        <div className="flex items-center">
          <ProjectSelector />
        </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative group hidden lg:block">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search Project Data..." 
            className="pl-9 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all w-56 group-hover:bg-white"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded-md shadow-sm pointer-events-none">
             <span className="text-[10px] font-black text-slate-400">⌘</span>
             <span className="text-[10px] font-black text-slate-400">K</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 relative" ref={dropdownRef}>
          {/* Notifications Bell */}
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative border border-transparent active:scale-95 ${showDropdown ? 'bg-slate-50 text-blue-600 border-slate-100' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
          >
            <Bell size={20} />
            {hasUnread && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
            )}
          </button>

          {/* Premium Notification Dropdown */}
          {showDropdown && (
            <div className="absolute top-full right-0 mt-3 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-[14px] font-semibold text-slate-900">Notifications</h3>
                <button 
                  onClick={() => clearAll()}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  Mark all read
                </button>
              </div>
              
              <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                {displayNotifications.map((notif: any) => {
                  const { icon: Icon, bg, text } = getNotificationIcon(notif.type || 'USER');
                  return (
                    <div 
                      key={notif.id} 
                      className="px-5 py-4 border-b border-slate-50 hover:bg-slate-50/80 transition-all cursor-pointer group relative"
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                          <Icon size={18} className={text} />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-[13px] font-semibold text-slate-900 truncate tracking-tight">{notif.title}</h4>
                            {!notif.read && <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />}
                          </div>
                          <p className="text-[12px] text-slate-500 font-normal leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2 text-slate-400">
                            <Clock size={10} />
                            <span className="text-[10px] font-medium uppercase tracking-wider">{notif.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button 
                onClick={() => { setShowDropdown(false); onOpenNotifications(); }}
                className="w-full py-3 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 transition-all border-t border-slate-100"
              >
                View all notifications
              </button>
            </div>
          )}

          {/* Neural Pulse (Sync) */}
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all border border-transparent hover:border-orange-100 active:scale-95 group">
            <Zap size={20} className="group-hover:fill-current" />
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#F8F9FA] border border-slate-200 rounded-xl transition-all hover:bg-white cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-[#E6F4F1] flex items-center justify-center text-[#006D5B] font-semibold text-[11px] shrink-0">
            {user?.name?.split(' ').map((n:any)=>n[0]).join('') || 'RK'}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 leading-tight truncate">
              {user?.name || 'Ravi Kumar'}
            </p>
            <p className="text-[10px] font-medium text-slate-400 leading-tight capitalize">
              {user?.role?.toLowerCase().replace('_', ' ') || 'team lead'}
            </p>
          </div>
        </div>
      </div>
      </div>
    </header>
  );
}
