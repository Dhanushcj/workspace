import React, { useEffect, useState } from 'react';
import { ClipboardList, Zap, AlertCircle, Eye, Bug, AlertTriangle, Code2, Activity, ArrowRight } from 'lucide-react';

interface Props {
  developerName: string;
  stats: {
    todo: number;
    inProgress: number;
    blocked: number;
    inReview: number;
    done: number;
    total: number;
    completion: number; // 0-100
    activeBugs: number;
  };
}

export const DeveloperHeader: React.FC<Props> = ({ developerName, stats }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(stats.completion);
    }, 100);
    return () => clearTimeout(timer);
  }, [stats.completion]);

  return (
    <div className="w-full space-y-6">
      <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-200 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
        <div className="relative z-10 space-y-8">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-blue-50 rounded-lg flex items-center gap-2 border border-blue-100">
                  <Code2 size={14} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Developer Workspace</span>
                </div>
                <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Online</span>
                </div>
              </div>
              
              <div className="space-y-1">
                 <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                   Welcome back, <span className="text-blue-600">{developerName.split(' ')[0]}</span>
                 </h1>
                 <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                   You have <span className="text-slate-900 font-bold">{stats.todo} assigned tasks</span> remaining in this cycle.
                 </p>
              </div>
            </div>

            <div className="text-right">
               <div className="text-5xl font-black text-blue-600 leading-none tracking-tighter">
                 {stats.completion}%
               </div>
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                 Completion Rate
               </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: 'Pending', value: stats.todo, icon: ClipboardList, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
               { label: 'Active', value: stats.inProgress, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
               { label: 'Blocked', value: stats.blocked, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
               { label: 'In Review', value: stats.inReview, icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
             ].map((stat, idx) => (
               <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl bg-white border ${stat.border} hover:border-blue-300 transition-all shadow-sm group/stat`}>
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                     <stat.icon size={18} />
                  </div>
                  <div>
                     <div className="text-xl font-black text-slate-900 leading-none">{stat.value}</div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
                  </div>
               </div>
             ))}
          </div>

          {/* Progress Bar Visualization */}
          <div className="space-y-2">
             <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-1000 ease-out" 
                  style={{ width: `${progress}%` }} 
                />
             </div>
          </div>
        </div>
      </div>

      {/* Active Bugs Alert */}
      {stats.activeBugs > 0 && (
        <button 
          onClick={() => {
            const el = document.getElementById('bug-queue');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-full bg-white border border-red-200 p-5 rounded-[24px] flex items-center gap-4 hover:bg-red-50 transition-all group shadow-sm"
        >
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 block">Critical Issue Alert</span>
            <span className="text-sm font-semibold text-slate-700">You have {stats.activeBugs} active bug report(s) requiring immediate attention.</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-red-600 opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            View Details <ArrowRight size={12} />
          </div>
        </button>
      )}
    </div>
  );
};

const StatMiniCard = ({ icon: Icon, label, value, color, isDark }: any) => (
  <div className={`inline-flex items-center gap-3 p-3 ${isDark ? 'bg-[#1E293B] border-white/5' : 'bg-slate-50 border-slate-200'} border rounded-[8px] shadow-sm hover:border-blue-400 transition-all`}>
    <Icon size={14} style={{ color }} />
    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{label}:</span>
    <span className={`text-[13px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
  </div>
);

