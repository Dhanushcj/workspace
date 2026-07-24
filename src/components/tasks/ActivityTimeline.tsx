'use client';

import React, { useState } from 'react';
import { 
  Activity, Clock, User, Filter, 
  ChevronRight, CircleCheck, AlertCircle, 
  MessageSquare, Zap, Search, Calendar
} from 'lucide-react';
import { useActivityStore } from '../../store/activityStore';

export default function ActivityTimeline() {
  const { activities } = useActivityStore();
  const [filter, setFilter] = useState('ALL');

  const filteredActivities = filter === 'ALL' 
    ? activities 
    : activities.filter(a => a.action.includes(filter));

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex items-center justify-between">
          <div>
             <h2 className="text-3xl font-black tracking-tighter text-slate-900">Activity Ledger</h2>
             <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Immutable audit history for NEX-SPRINT-12</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
             <FilterBtn label="All" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
             <FilterBtn label="Status" active={filter === 'status'} onClick={() => setFilter('status')} />
             <FilterBtn label="Notes" active={filter === 'note'} onClick={() => setFilter('note')} />
          </div>
       </div>

       <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[39px] top-0 bottom-0 w-px bg-slate-100" />

          <div className="space-y-12">
             {filteredActivities.map((activity, index) => (
                <div key={activity.id} className="relative flex items-start gap-10 group">
                   {/* Timestamp Indicator */}
                   <div className="w-20 pt-2 text-right shrink-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                         {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Today</p>
                   </div>

                   {/* Node Icon */}
                   <div className="relative z-10 w-20 h-20 shrink-0 flex items-center justify-center">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                        activity.action.includes('status') ? 'bg-indigo-500 text-white shadow-indigo-500/20' :
                        activity.action.includes('fail') ? 'bg-red-500 text-white shadow-red-500/20' :
                        'bg-white text-slate-400 border border-slate-100'
                      }`}>
                         <Activity size={18} />
                      </div>
                   </div>

                   {/* Content Card */}
                   <div className="flex-1 bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-indigo-100 transition-all">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400">
                               {activity.userName?.[0] || 'U'}
                            </div>
                            <div>
                               <span className="text-sm font-black text-slate-900">{activity.userName}</span>
                               <span className="text-xs text-slate-400 font-medium ml-2">{activity.action}</span>
                            </div>
                         </div>
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                            {activity.targetId}
                         </span>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                            <Calendar size={18} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-slate-700 truncate">{activity.targetTitle}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Impact: High • Critical Path</p>
                         </div>
                         <ChevronRight size={16} className="text-slate-200" />
                      </div>
                   </div>
                </div>
             ))}

             {filteredActivities.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center justify-center grayscale opacity-30">
                   <Clock size={48} className="mb-4" />
                   <p className="text-sm font-black uppercase tracking-widest text-slate-400">No activity matching filter</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

function FilterBtn({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
      }`}
    >
       {label}
    </button>
  );
}

