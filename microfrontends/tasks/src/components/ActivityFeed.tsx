

import React from 'react';
import { useActivityStore } from '../store/activityStore';
import { 
  GitCommit, CircleCheck, AlertTriangle, 
  ArrowRight, User, Terminal, Briefcase, Zap
} from 'lucide-react';

export default function ActivityFeed() {
  const { activities } = useActivityStore();

  const getIcon = (action: string) => {
    if (action.includes('approved')) return <CircleCheck size={16} className="text-emerald-500" />;
    if (action.includes('failed') || action.includes('rejected')) return <AlertTriangle size={16} className="text-red-500" />;
    if (action.includes('unblock') || action.includes('intervention')) return <Zap size={16} className="text-amber-500" />;
    return <Terminal size={16} className="text-indigo-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex items-center justify-between mb-8">
          <div>
             <h2 className="text-2xl font-black tracking-tight text-slate-900">Platform Activity</h2>
             <p className="text-sm text-slate-500 font-medium">Real-time audit log of all engineering and management actions.</p>
          </div>
          <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
             LIVE UPDATES
          </div>
       </div>

       <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[21px] top-4 bottom-4 w-px bg-slate-100" />

          <div className="space-y-8">
             {activities.map((activity, index) => (
                <div key={activity.id} className="relative flex gap-6 group">
                   {/* Icon Node */}
                   <div className="relative z-10 w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center transition-all group-hover:shadow-lg group-hover:scale-110">
                      {getIcon(activity.action)}
                   </div>

                   {/* Content */}
                   <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-sm font-black text-slate-900">{activity.userName}</span>
                         <span className="text-xs text-slate-400 font-medium">{activity.action}</span>
                         <span className="text-sm font-black text-indigo-600">"{activity.targetTitle}"</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                         </p>
                         <div className="w-1 h-1 bg-slate-200 rounded-full" />
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{activity.targetId}</p>
                      </div>
                   </div>
                </div>
             ))}
             {activities.length === 0 && (
                <div className="py-20 text-center text-slate-300 italic">
                   No activity recorded yet.
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

