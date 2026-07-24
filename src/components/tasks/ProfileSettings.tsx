'use client';

import React, { useState } from 'react';
import { 
  User, Shield, Bell, Zap, 
  Settings, Camera, CircleCheck, 
  Clock, Globe, Lock, LogOut
} from 'lucide-react';
import { useNavigate as useRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProfileSettings() {
  const router = useRouter();
  const { user, setPresence, logout } = useAuthStore();
  const [isOnline, setIsOnline] = useState(user?.isOnline ?? true);
  
  const handleLogout = () => {
    logout();
    router('/login');
  };
  
  const handlePresenceToggle = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    setPresence(nextState);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
       <div className="flex items-center justify-between">
          <div>
             <h2 className="text-3xl font-black tracking-tighter text-slate-900">Workspace Settings</h2>
             <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your identity and preferences</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-100 transition-all"
          >
             <LogOut size={16} /> Logout Session
          </button>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Identity Card */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-yellow-500" />
                <div className="relative inline-block group mb-6">
                   <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl font-black shadow-2xl group-hover:scale-105 transition-transform">
                      {user?.name?.[0] || 'U'}
                   </div>
                   <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border border-slate-100 flex items-center justify-center text-slate-400 shadow-lg hover:text-blue-600 transition-colors">
                      <Camera size={14} />
                   </button>
                </div>
                <h3 className="text-xl font-black text-slate-900">{user?.name || 'Anonymous User'}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{user?.role || 'DEVELOPER'}</p>
                
                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between px-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visibility</span>
                   <button 
                     onClick={handlePresenceToggle}
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                       isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                     }`}
                   >
                      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
                   </button>
                </div>
             </div>

             <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
                <div className="flex items-center gap-3">
                   <Shield size={20} className="text-indigo-400" />
                   <h4 className="text-xs font-black uppercase tracking-widest">Access Level</h4>
                </div>
                <div className="space-y-4">
                   <PermissionItem label="Full Repository Access" granted={true} />
                   <PermissionItem label="Status Transitions" granted={true} />
                   <PermissionItem label="Sprint Management" granted={user?.role === 'MANAGER' || user?.role === 'TEAM_LEAD'} />
                   <PermissionItem label="Member Overrides" granted={user?.role === 'MANAGER'} />
                </div>
             </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-2 space-y-8">
             <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-10">
                <section className="space-y-6">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 border-l-4 border-blue-600 pl-4">Account Details</h3>
                   <div className="grid grid-cols-2 gap-6">
                      <SettingsField label="Full Name" value={user?.name || ''} placeholder="John Doe" />
                      <SettingsField label="Work Email" value={user?.email || ''} placeholder="john@forge.com" disabled />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <SettingsField label="Designation" value="Senior Software Engineer" placeholder="e.g. Lead Designer" />
                      <SettingsField label="Timezone" value="GMT +05:30 (IST)" placeholder="Select Timezone" />
                   </div>
                </section>

                <section className="space-y-6 pt-10 border-t border-slate-50">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 border-l-4 border-slate-200 pl-4">Notifications</h3>
                   <div className="space-y-4">
                      <ToggleItem icon={Bell} title="Email Alerts" desc="Receive daily summaries of your assigned tasks." active={true} />
                      <ToggleItem icon={Zap} title="System Toasts" desc="Real-time notifications for status updates and mentions." active={true} />
                      <ToggleItem icon={Globe} title="Web Push" desc="Stay synchronized even when the Forge is in the background." active={false} />
                   </div>
                </section>

                <div className="pt-6 flex justify-end">
                   <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-900/20 hover:bg-indigo-600 transition-all hover:-translate-y-1 active:scale-95">
                      Save Changes
                   </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function PermissionItem({ label, granted }: { label: string; granted: boolean }) {
  return (
    <div className="flex items-center justify-between">
       <span className={`text-[11px] font-bold ${granted ? 'text-slate-300' : 'text-slate-500 line-through'}`}>{label}</span>
       {granted ? <CircleCheck size={14} className="text-emerald-400" /> : <Lock size={14} className="text-slate-600" />}
    </div>
  );
}

function SettingsField({ label, value, placeholder, disabled }: any) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
       <input 
         defaultValue={value}
         disabled={disabled}
         placeholder={placeholder}
         className={`w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all ${
           disabled ? 'opacity-50 cursor-not-allowed' : ''
         }`}
       />
    </div>
  );
}

function ToggleItem({ icon: Icon, title, desc, active }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-white transition-all group border border-transparent hover:border-slate-100">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
             <Icon size={20} />
          </div>
          <div>
             <h4 className="text-sm font-black text-slate-700">{title}</h4>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{desc}</p>
          </div>
       </div>
       <div className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${active ? 'bg-indigo-600' : 'bg-slate-200'}`}>
          <div className={`w-4 h-4 bg-white rounded-full transition-all ${active ? 'translate-x-6' : 'translate-x-0'}`} />
       </div>
    </div>
  );
}

