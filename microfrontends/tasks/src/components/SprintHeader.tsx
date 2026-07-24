import React, { useEffect, useState } from 'react';
import { Target, Zap, Clock, Activity, LayoutGrid } from 'lucide-react';

interface Sprint {
  name: string;
  projectName: string;
  goal: string;
  startDate: string;
  endDate: string;
}

interface Props {
  sprint: Sprint;
  completion: number;
  velocity: number;
}

export const SprintHeader: React.FC<Props> = ({ sprint, completion, velocity }) => {
  const [animatedCompletion, setAnimatedCompletion] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedCompletion(completion);
    }, 50);
    return () => clearTimeout(timer);
  }, [completion]);

  let velocityBadge = 'BUILDING MOMENTUM';
  let VelocityIcon = Clock;
  if (velocity > 2) {
    velocityBadge = 'CRITICAL VELOCITY';
    VelocityIcon = Zap;
  } else if (velocity > 1) {
    velocityBadge = 'PEAK PRODUCTION';
    VelocityIcon = Activity;
  }

  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm overflow-hidden relative group">
      <div className="relative z-10 space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue-50 rounded-lg flex items-center gap-2 border border-blue-100">
                <VelocityIcon size={14} className="text-blue-600" />
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{velocityBadge.replace('MOMENTUM', 'PROGRESS').replace('PRODUCTION', 'VELOCITY')}</span>
              </div>
              <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Cycle</span>
              </div>
            </div>
            
            <div className="space-y-1">
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                 {sprint.name} <span className="text-blue-600">Cycle</span>
               </h1>
               <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                 <Target size={14} className="text-slate-400" />
                 Goal: <span className="text-slate-700 font-bold">{sprint.goal || 'Production Efficiency Optimization'}</span>
               </p>
            </div>
          </div>

          <div className="text-right">
             <div className="text-5xl font-black text-blue-600 leading-none tracking-tighter">
               {completion}%
             </div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
               Cycle Progress
             </div>
          </div>
        </div>

        {/* Progress Bar Visualization */}
        <div className="space-y-3">
           <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-1000 ease-out" 
                style={{ width: `${animatedCompletion}%` }} 
              />
           </div>
           <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-2">
                <Clock size={12} />
                <span>Started: {new Date(sprint.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <LayoutGrid size={12} />
                <span>Ends: {new Date(sprint.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

