'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate as useRouter } from 'react-router-dom';

interface Props {
  backlog: number;
  active: number;
  review: number;
  deployed: number;
}

const AnimatedCount = ({ count }: { count: number }) => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(k => k + 1);
  }, [count]);

  return (
    <div key={key} className="count-pulse" style={{ fontSize: '42px', fontWeight: '900', color: '#0F172A', lineHeight: 1 }}>
      {count}
    </div>
  );
};

export const StatusCardsRow: React.FC<Props> = ({ backlog, active, review, deployed }) => {
  const router = useRouter();

  const handleNav = (status: string) => {
    router(`/dashboard/lead?status=${status}`);
  };

  const cards = [
    { label: 'BACKLOG', count: backlog, statusFilter: 'to_do', color: '#64748B', bg: 'bg-slate-50' },
    { label: 'ACTIVE', count: active, statusFilter: 'in_progress', color: '#3B82F6', bg: 'bg-blue-50' },
    { label: 'REVIEW', count: review, statusFilter: 'in_review', color: '#8B5CF6', bg: 'bg-violet-50' },
    { label: 'DONE', count: deployed, statusFilter: 'done', color: '#10B981', bg: 'bg-emerald-50' },
  ];

  return (
    <>
      <style>{`
        @keyframes customPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .count-pulse {
          display: inline-block;
          animation: customPulse 400ms ease-in-out;
          transform-origin: left center;
        }
      `}</style>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => handleNav(c.statusFilter)}
            className={`flex flex-col text-left p-8 rounded-[32px] border border-slate-200 bg-white shadow-sm hover:shadow-md hover:translate-y-[-2px] active:scale-95 transition-all group`}
          >
            <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-6`}>
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
            </div>
            <span 
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: c.color }}
            >
              {c.label}
            </span>
            <div className="flex items-baseline gap-2">
               <AnimatedCount count={c.count} />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasks</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
};

