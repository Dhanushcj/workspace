'use client';

import React from 'react';
import { AlertCircle, CircleCheck } from 'lucide-react';

interface Props {
  count: number;
  isLoading?: boolean;
}

export const UnassignedBadge = ({ count, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="w-32 h-10 bg-slate-100 animate-pulse rounded-2xl" />
    );
  }

  const isZero = count === 0;

  return (
    <div 
      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
        isZero 
         ? 'bg-slate-50 border-slate-100 text-slate-400' 
         : 'bg-amber-50 border-amber-100 text-amber-700 shadow-sm'
      }`}
      title={`${count} tasks have no developer assigned`}
    >
       {count > 0 ? (
         <>
           <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
           <AlertCircle size={12} className="text-amber-500" />
         </>
       ) : (
         <>
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
           <CircleCheck size={12} className="text-emerald-500" />
         </>
       )}
       {count} UNASSIGNED ITEM{count !== 1 ? 'S' : ''}
    </div>
  );
};

