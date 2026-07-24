import React from 'react';
import { Briefcase, Zap, ListTodo, Users, Bug, LayoutGrid, Activity } from 'lucide-react';

interface ManagerHeaderProps {
  projectsCount: number;
  sprintsCount: number;
  tasksCount: number;
  teamCount: number;
  bugsCount: number;
}

const ManagerHeader: React.FC<ManagerHeaderProps> = ({
  projectsCount,
  sprintsCount,
  tasksCount,
  teamCount,
  bugsCount,
}) => {
  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm overflow-hidden relative group">
      <div className="relative z-10 space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue-50 rounded-lg flex items-center gap-2 border border-blue-100">
                <LayoutGrid size={14} className="text-blue-600" />
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Executive Overview</span>
              </div>
              <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operational Stream</span>
              </div>
            </div>
            
            <div className="space-y-1">
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                 Organization <span className="text-blue-600">Overview</span>
               </h1>
               <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                 Analyzing <span className="text-slate-900 font-bold">{projectsCount} active projects</span> across the organization.
               </p>
            </div>
          </div>

          <div className="text-right">
             <div className="text-5xl font-black text-blue-600 leading-none tracking-tighter">
               {Math.round((projectsCount / 10) * 100) || 100}%
             </div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
               Portfolio Health
             </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           {[
             { label: 'Projects', value: projectsCount, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
             { label: 'Sprints', value: sprintsCount, icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
             { label: 'Tasks', value: tasksCount, icon: ListTodo, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
             { label: 'Team', value: teamCount, icon: Users, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
             { label: 'Defects', value: bugsCount, icon: Bug, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
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
      </div>
    </div>
  );
};

export default ManagerHeader;

