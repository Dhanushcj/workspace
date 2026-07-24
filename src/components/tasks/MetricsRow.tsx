'use client';

import React from 'react';
import { Star, Zap, MessageSquare, Target } from 'lucide-react';

interface Props {
  velocity: string;
  uptime: number;
  nextSync: string | null;
  syncCount: number;
  targetsOnTrack: number;
}

export const MetricsRow: React.FC<Props> = ({ velocity, uptime, nextSync, syncCount, targetsOnTrack }) => {

  // --- Velocity Color Logic ---
  let velocityColor = '#94A3B8'; // default gray for 'Low'
  if (velocity === 'Extreme') velocityColor = '#EAB308'; // yellow
  if (velocity === 'High') velocityColor = '#10B981';    // green
  if (velocity === 'Moderate') velocityColor = '#3B82F6';// blue

  // --- Uptime Health Status Logic ---
  let uptimeStatus = 'HEALTHY';
  let uptimeColor = '#10B981'; // green
  if (uptime < 95) {
    uptimeStatus = 'DEGRADED';
    uptimeColor = '#EF4444'; // red
  } else if (uptime <= 98) {
    uptimeStatus = 'UNSTABLE';
    uptimeColor = '#EAB308'; // yellow
  }

  // --- Syncs Logic ---
  // If we have a nextSync, display the count of all upcoming syncs? 
  // Wait, the prompt says "Value: "0" (32px bold)... Sub-label: "NEXT 48H" — computed from nextSync timestamp".
  // The prop is nextSync (ISO timestamp). If it exists, let's compute hours.
  let syncsLabel = 'NO SYNCS';
  if (nextSync) {
    const diffMs = new Date(nextSync).getTime() - Date.now();
    const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
    if (diffHrs <= 24) syncsLabel = 'NEXT 24H';
    else if (diffHrs <= 48) syncsLabel = 'NEXT 48H';
    else syncsLabel = `IN ${Math.ceil(diffHrs / 24)} DAYS`;
  }

  // --- Targets Logic ---
  const targetsColor = targetsOnTrack > 0 ? '#10B981' : '#94A3B8';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card 1 — VELOCITY */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group text-center items-center">
        <div className="flex items-start justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-105 transition-transform">
            <Star size={24} />
          </div>
        </div>
        <div>
          <p className="text-5xl font-black leading-none tracking-tighter text-slate-900">
            {velocity.toUpperCase()}
          </p>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Velocity Index
            </p>
          </div>
        </div>
      </div>

      {/* Card 2 — UPTIME */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group text-center items-center">
        <div className="flex items-start justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform">
            <Zap size={24} />
          </div>
        </div>
        <div>
          <p className="text-5xl font-black leading-none tracking-tighter text-slate-900">
            {uptime.toFixed(1)}%
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Uptime Rate
            </p>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: uptimeColor }} />
               <p className="text-[10px] font-bold uppercase" style={{ color: uptimeColor }}>
                 {uptimeStatus}
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

