'use client';

import React from 'react';
import { Zap, Command } from 'lucide-react';

export default function Preloader() {
  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="relative">
          {/* Pulsing Outer Rings */}
          <div className="absolute inset-0 bg-[#0056B3]/10 rounded-full scale-[2.5] animate-ping duration-[2000ms]" />
          <div className="absolute inset-0 bg-[#F7B500]/5 rounded-full scale-[4] animate-pulse duration-[3000ms]" />
          
          {/* Central Logo Node */}
          <div className="relative w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-900/10 animate-bounce-slow border border-slate-100 p-4">
             <img src="/logo.png" alt="Forge Logo" className="w-full h-full object-contain relative z-10" />
          </div>
       </div>

       <div className="mt-16 text-center space-y-4">
          <div className="flex items-center gap-3 justify-center">
             <h2 className="text-xl font-black tracking-tighter uppercase text-slate-900">
                Forge <span className="text-[#F7B500]">Neural Sync</span>
             </h2>
          </div>
          <div className="flex flex-col items-center gap-2">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Authenticating Workspace</p>
             <div className="w-40 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#0056B3] animate-loading-bar" />
             </div>
          </div>
       </div>

    </div>
  );
}

