

import React from 'react';

interface VelocityData {
  sprintName: string;
  plannedTasks: number;
  completedTasks: number;
  plannedEstimate: number;
  completedEstimate: number;
  date: string;
}

interface VelocityChartProps {
  data: VelocityData[];
  averageVelocity: number;
}

export const VelocityChart = ({ data, averageVelocity }: VelocityChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl">
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No historical data available</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.plannedEstimate, d.completedEstimate)), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Team Velocity</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed work vs Planned work (min)</p>
        </div>
        <div className="text-right">
           <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Avg. Velocity</div>
           <div className="text-2xl font-black text-indigo-600">{averageVelocity}m</div>
        </div>
      </div>

      <div className="h-64 flex items-end gap-6 px-4 pb-8 border-b border-slate-100">
        {data.map((sprint, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
            <div className="w-full flex justify-center gap-1.5 h-full items-end">
              {/* Planned Bar */}
              <div 
                className="w-4 bg-slate-200 rounded-t-md transition-all duration-500 group-hover:bg-slate-300"
                style={{ height: `${(sprint.plannedEstimate / maxVal) * 100}%` }}
                title={`Planned: ${sprint.plannedEstimate}m`}
              />
              {/* Completed Bar */}
              <div 
                className="w-4 bg-indigo-600 rounded-t-md transition-all duration-500 group-hover:bg-indigo-700"
                style={{ height: `${(sprint.completedEstimate / maxVal) * 100}%` }}
                title={`Completed: ${sprint.completedEstimate}m`}
              />
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">
              {sprint.sprintName.split(' ')[1] || sprint.sprintName}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-slate-200 rounded-sm" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Commitment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-600 rounded-sm" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completed</span>
        </div>
      </div>
    </div>
  );
};

