'use client';

import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Lock, 
  Save, 
  Shield, 
  Mail,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const SettingsView = () => {
  const { user } = useAuthStore();
  const [notifs, setNotifs] = useState({
    taskAssigned: true,
    prSubmitted: true,
    bugLogged: true,
    sprintUpdate: true,
    blockerRaised: true
  });

  const toggleNotif = (key: keyof typeof notifs) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="px-8 pt-2">
        <h1 className="text-[28px] font-medium text-slate-900 tracking-tight">Settings</h1>
      </div>

      <div className="px-8 max-w-[800px] flex flex-col gap-8">
        {/* Profile Section */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
          <h3 className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em] mb-8">Profile</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-700">Display name</label>
              <input 
                type="text" 
                defaultValue={user?.name || 'Ravi Kumar'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-normal outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-700">Email</label>
              <input 
                type="email" 
                defaultValue={user?.email || 'rk@forgeindia.com'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-normal outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-700">Role</label>
              <input 
                type="text" 
                defaultValue="Team Lead"
                disabled
                className="w-full px-4 py-3 bg-slate-100/50 border border-slate-100 rounded-xl text-[14px] font-normal text-slate-500 cursor-not-allowed"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#0D5F46] text-white rounded-xl text-[13px] font-medium hover:opacity-90 transition-all shadow-md mt-2">
               Save Profile
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
          <h3 className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em] mb-8">Notifications</h3>
          <div className="space-y-5">
            {[
              { id: 'taskAssigned', label: 'Task assigned to me' },
              { id: 'prSubmitted', label: 'PR submitted for review' },
              { id: 'bugLogged', label: 'Bug logged on my task' },
              { id: 'sprintUpdate', label: 'Sprint started / completed' },
              { id: 'blockerRaised', label: 'Blocker raised' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1">
                <p className="text-[14px] font-normal text-slate-700">{item.label}</p>
                <div 
                  onClick={() => toggleNotif(item.id as keyof typeof notifs)}
                  className={`w-11 h-6 rounded-full cursor-pointer transition-all relative ${notifs[item.id as keyof typeof notifs] ? 'bg-[#0D5F46]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notifs[item.id as keyof typeof notifs] ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
          <h3 className="text-[11px] font-normal text-slate-400 uppercase tracking-[0.2em] mb-8">Change Password</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-700">Current password</label>
              <input 
                type="password" 
                placeholder="Enter current password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-normal outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-700">New password</label>
              <input 
                type="password" 
                placeholder="Enter new password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-normal outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#0D5F46] text-white rounded-xl text-[13px] font-medium hover:opacity-90 transition-all shadow-md mt-2">
               Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
