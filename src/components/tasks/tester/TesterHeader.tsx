import React from 'react';
import { Beaker, CircleCheck, AlertCircle, Clock, Zap } from 'lucide-react';

interface TesterHeaderProps {
  name: string;
  stats: {
    pending: number;
    inProgress: number;
    passed: number;
    failed: number;
    passRate: number;
  };
}

export const TesterHeader: React.FC<TesterHeaderProps> = ({ name, stats }) => {
  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm overflow-hidden relative group">
      <div className="relative z-10 space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-emerald-50 rounded-lg flex items-center gap-2 border border-emerald-100">
                <Beaker size={14} className="text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Quality Assurance</span>
              </div>
              <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Operational</span>
              </div>
            </div>
            
            <div className="space-y-1">
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                 Welcome back, <span className="text-blue-600">{name.split(' ')[0]}</span>
               </h1>
               <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                 Analyzing <span className="text-slate-900 font-bold">{stats.pending} pending assignments</span> in the verification queue.
               </p>
            </div>
          </div>

          <div className="text-right">
             <div className="text-5xl font-black text-emerald-600 leading-none tracking-tighter">
               {Math.round(stats.passRate)}%
             </div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
               Cycle Integrity
             </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-4">
           {[
             { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
             { label: 'In Review', value: stats.inProgress, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
             { label: 'Success', value: stats.passed, icon: CircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
             { label: 'Failures', value: stats.failed, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
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
        <div className="space-y-3">
           <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                style={{ width: `${stats.passRate}%` }} 
              />
              <div 
                className="h-full bg-rose-500 transition-all duration-1000 ease-out" 
                style={{ width: `${100 - stats.passRate}%` }} 
              />
           </div>
           <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                 Operational Success
              </span>
              <span className="flex items-center gap-2">
                 Margin of Failure: {100 - Math.round(stats.passRate)}%
                 <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

