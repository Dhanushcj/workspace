'use client';

import React from 'react';

interface CFDStatus {
  key: string;
  name: string;
  color: string;
}

interface CFDDataPoint {
  date: string;
  [key: string]: string | number;
}

interface CFDChartProps {
  data: CFDDataPoint[];
  statuses: CFDStatus[];
}

export const CFDChart = ({ data, statuses }: CFDChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl">
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No flow data available</p>
      </div>
    );
  }

  // Calculate max total per day for scaling
  const maxTotal = Math.max(...data.map(d => 
    statuses.reduce((sum, s) => sum + (Number(d[s.key]) || 0), 0)
  ), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Cumulative Flow</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work item distribution over time</p>
        </div>
      </div>

      <div className="h-72 relative flex items-end px-4 border-b border-l border-slate-100 pb-1">
        {/* Y-Axis Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-50 px-4 py-2">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="w-full h-[1px] bg-slate-100" />
           ))}
        </div>

        {data.map((point, idx) => {
          let currentBottom = 0;
          return (
            <div key={idx} className="flex-1 h-full flex flex-col justify-end group relative z-10 px-[1px]">
              {statuses.map((status) => {
                const val = Number(point[status.key]) || 0;
                const height = (val / maxTotal) * 100;
                const element = (
                  <div 
                    key={status.key}
                    className="w-full transition-all duration-500 hover:brightness-95 relative"
                    style={{ 
                      height: `${height}%`, 
                      backgroundColor: status.color,
                      opacity: 0.9
                    }}
                  >
                    {val > 0 && idx % Math.max(1, Math.floor(data.length / 5)) === 0 && height > 10 && (
                      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/60 pointer-events-none">{val}</span>
                    )}
                  </div>
                );
                currentBottom += height;
                return element;
              })}
              
              {/* Tooltip for date */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white px-2 py-1 rounded text-[8px] font-bold z-20">
                {point.date}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 justify-center pt-4">
        {statuses.map(s => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

