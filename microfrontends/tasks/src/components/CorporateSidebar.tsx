import React from 'react';
import { Power, ShieldAlert } from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  badge?: number;
}

interface CorporateSidebarProps {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  userName: string;
  roleLabel: string;
  brand?: string;
  onLogout: () => void;
}

export const CorporateSidebar: React.FC<CorporateSidebarProps> = ({
  navItems, activeTab, onTabChange, userName, roleLabel, brand = 'FORGE INDIA', onLogout,
}) => (
  <aside className="w-64 border-r border-slate-200 bg-white flex flex-col z-20 shadow-sm shrink-0">
    <div className="p-6 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
          {brand} <span className="text-[#F7B500]">PMT</span>
        </h1>
      </div>
    </div>

    <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
            activeTab === item.id
              ? 'bg-blue-50 text-blue-600 font-bold'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <item.icon size={18} className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'} />
            <span className="text-[13px]">{item.label}</span>
          </div>
          {item.badge !== undefined && activeTab !== item.id && (
            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>

    <div className="p-4 border-t border-slate-100">
      <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
          {userName?.[0] || 'N'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate leading-none mb-1">{userName || 'User'}</p>
          <p className="text-[10px] font-medium text-slate-400 truncate leading-none uppercase tracking-widest">{roleLabel}</p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
      >
        <Power size={14} /> Log Out
      </button>
    </div>
  </aside>
);

