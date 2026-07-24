'use client';

import React from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { TrendingUp, CircleCheck, AlertCircle, Clock } from 'lucide-react';

export default function ProductivityChart() {
  const { tasks } = useWorkflowStore();

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'DONE').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PR_SUBMITTED' || t.status === 'TESTING').length;
  const todo = tasks.filter(t => t.status === 'TO_DO').length;

  const donePercent = total > 0 ? (done / total) * 100 : 0;
  const ipPercent = total > 0 ? (inProgress / total) * 100 : 0;
  const todoPercent = total > 0 ? (todo / total) * 100 : 0;

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-xl shadow-slate-200/50 space-y-10">
       <div className="flex items-center justify-between">
          <div>
             <h3 className="text-xl font-black tracking-tight text-slate-900">Sprint Health</h3>
             <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time Velocity</p>
          </div>
          <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
             <TrendingUp size={16} /> +12% Efficiency
          </div>
       </div>

       {/* Progress Bar Group */}
       <div className="space-y-8">
          <ChartRow label="Completed" count={done} percent={donePercent} color="bg-emerald-500 shadow-emerald-500/20" icon={CircleCheck} />
          <ChartRow label="In Development" count={inProgress} percent={ipPercent} color="bg-indigo-600 shadow-indigo-600/20" icon={Clock} />
          <ChartRow label="Backlog" count={todo} percent={todoPercent} color="bg-slate-300 shadow-slate-300/20" icon={AlertCircle} />
       </div>

       {/* Visual Summary */}
       <div className="pt-10 border-t border-slate-50 grid grid-cols-3 gap-6">
          <StatBox label="Total Points" value="128" color="text-slate-900" />
          <StatBox label="Avg Velocity" value="42.5" color="text-indigo-600" />
          <StatBox label="Risk Level" value="Low" color="text-emerald-500" />
       </div>
    </div>
  );
}

function ChartRow({ label, count, percent, color, icon: Icon }: any) {
  return (
    <div className="space-y-3 group cursor-pointer">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:text-indigo-500 transition-colors`}>
                <Icon size={16} />
             </div>
             <span className="text-sm font-black text-slate-700">{label}</span>
          </div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{count} Tasks</span>
       </div>
       <div className="relative h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${color}`} 
            style={{ width: `${percent}%` }}
          />
       </div>
    </div>
  );
}

function StatBox({ label, value, color }: any) {
  return (
    <div className="text-center">
       <p className={`text-xl font-black ${color}`}>{value}</p>
       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 mt-1">{label}</p>
    </div>
  );
}

