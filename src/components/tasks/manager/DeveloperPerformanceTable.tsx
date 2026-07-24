'use client';

import React, { useState } from 'react';

interface DeveloperMetric {
  id: string;
  name: string;
  avatar?: string;
  tasksAssigned: number;
  tasksCompleted: number;
  prsSubmitted: number;
  blockersRaised: number;
  bugsAssigned: number;
  avgCompletionTime: number; // in days
}

interface DeveloperPerformanceTableProps {
  developers: DeveloperMetric[];
  onDevClick?: (id: string) => void;
}

const DeveloperPerformanceTable: React.FC<DeveloperPerformanceTableProps> = ({ developers, onDevClick }) => {
  const [sortKey, setSortKey] = useState<keyof DeveloperMetric>('tasksCompleted');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedDevelopers = [...developers].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDir === 'asc' ? valA - valB : valB - valA;
    }
    return 0;
  });

  const handleSort = (key: keyof DeveloperMetric) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-slate-900 font-black text-xl tracking-tight">Performance Analytics</h2>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Live Cycle Stats</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100 bg-slate-50/50">
              <th className="px-8 py-5">Developer</th>
              <th className="px-8 py-5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('tasksAssigned')}>Assigned {sortKey === 'tasksAssigned' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="px-8 py-5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('tasksCompleted')}>Completed {sortKey === 'tasksCompleted' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="px-8 py-5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('prsSubmitted')}>Review Ready {sortKey === 'prsSubmitted' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="px-8 py-5 text-center">Blockers</th>
              <th className="px-8 py-5 text-center">Defects</th>
              <th className="px-8 py-5 text-right">Avg Cycle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedDevelopers.map((dev) => (
              <tr 
                key={dev.id} 
                onClick={() => onDevClick?.(dev.id)}
                className={`hover:bg-blue-50/30 transition-all group ${onDevClick ? 'cursor-pointer' : ''}`}
              >
                <td className="px-8 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-[11px] font-black group-hover:scale-105 transition-transform">
                    {dev.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900 leading-tight">{dev.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Dev Core</p>
                  </div>
                </td>
                <td className="px-8 py-5 text-[13px] text-slate-600 font-bold">{dev.tasksAssigned}</td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-slate-900 font-black">{dev.tasksCompleted}</span>
                    <div className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                       {Math.round((dev.tasksCompleted / (dev.tasksAssigned || 1)) * 100)}%
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-[13px] text-slate-600 font-bold">{dev.prsSubmitted}</td>
                <td className="px-8 py-5 text-[13px] text-slate-400 font-bold text-center">{dev.blockersRaised}</td>
                <td className="px-8 py-5 text-[13px] text-rose-600 font-bold text-center">{dev.bugsAssigned}</td>
                <td className="px-8 py-5 text-[13px] text-slate-900 font-black text-right">{dev.avgCompletionTime}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeveloperPerformanceTable;

