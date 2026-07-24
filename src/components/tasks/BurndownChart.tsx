'use client';

import React from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { TrendingDown, Calendar, Zap, AlertCircle } from 'lucide-react';

export default function BurndownChart() {
  const { tasks } = useWorkflowStore();
  
  // Data Simulation (In production, this comes from a historical trends API)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const idealData = [100, 85, 70, 55, 40, 25, 10];
  
  // Calculate Actual Progress based on current task count
  const totalTasks = tasks.length || 10;
  const remainingTasks = tasks.filter(t => t.status !== 'DONE').length;
  const currentProgress = (remainingTasks / totalTasks) * 100;
  
  // Generate a dynamic actual path that ends at the current progress
  const actualData = [100, 92, 88, 75, currentProgress];

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-xl shadow-slate-200/50 space-y-8 h-full flex flex-col">
       <div className="flex items-center justify-between">
          <div>
             <h3 className="text-xl font-black tracking-tight text-slate-900">Sprint Burndown</h3>
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">NEX-SPRINT-12 Velocity</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ideal</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Actual</span>
             </div>
          </div>
       </div>

       <div className="flex-1 relative min-h-[200px]">
          {/* SVG Chart Layer */}
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
             {/* Ideal Line (Dashed) */}
             <line 
               x1="0" y1="0" x2="100" y2="100" 
               stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" 
             />
             
             {/* Actual Path */}
             <path 
               d={`M 0 0 L 25 8 L 50 12 L 75 25 L 100 ${100 - currentProgress}`}
               fill="none"
               stroke="#6366f1"
               strokeWidth="3"
               strokeLinecap="round"
               className="animate-chart-draw"
             />
             
             {/* Current Position Glow */}
             <circle 
               cx="100" cy={100 - currentProgress} 
               r="4" fill="#6366f1" 
               className="animate-pulse"
             />
          </svg>

          {/* Grid Labels */}
          <div className="absolute inset-0 flex justify-between items-end pointer-events-none">
             {days.map(day => (
                <span key={day} className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-[-24px]">{day}</span>
             ))}
          </div>
       </div>

       <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <TrendingDown size={20} />
             </div>
             <div>
                <p className="text-lg font-black text-slate-900">{remainingTasks}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Issues Remaining</p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-sm font-black text-indigo-600">On Track</p>
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Est. Completion: Friday</p>
          </div>
       </div>

       <style jsx>{`
          @keyframes chart-draw {
            from { stroke-dasharray: 500; stroke-dashoffset: 500; }
            to { stroke-dasharray: 500; stroke-dashoffset: 0; }
          }
          .animate-chart-draw {
            animation: chart-draw 2s ease-out forwards;
          }
       `}</style>
    </div>
  );
}

