import React, { useEffect, useState } from 'react';
import { ClipboardList, Zap, Eye, Bug } from 'lucide-react';

interface Props {
  todo: number;
  active: number;
  review: number;
  bugs: number;
}

const AnimatedCount = ({ count, color }: { count: number; color: string }) => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(k => k + 1);
  }, [count]);

  return (
    <div key={key} className="count-pulse" style={{ fontSize: '42px', fontWeight: '900', color, lineHeight: 1 }}>
      {count}
    </div>
  );
};

export const DeveloperStatusCards: React.FC<Props> = ({ todo, active, review, bugs }) => {
  const cards = [
    { label: 'PENDING', count: todo, color: 'text-slate-400', accent: '#94A3B8', bg: 'bg-slate-400/5', icon: ClipboardList },
    { label: 'ACTIVE', count: active, color: 'text-blue-400', accent: '#3B82F6', bg: 'bg-blue-400/5', icon: Zap },
    { label: 'REVIEW', count: review, color: 'text-indigo-400', accent: '#818CF8', bg: 'bg-indigo-400/5', icon: Eye },
    { label: 'DEFECTS', count: bugs, color: 'text-rose-400', accent: '#F43F5E', bg: 'bg-rose-400/5', icon: Bug },
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
          <div
            key={c.label}
            className={`flex flex-col text-left p-8 rounded-[32px] border border-slate-200 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md bg-white group`}
          >
            <div className="relative z-10">
               <div className={`w-10 h-10 ${c.bg.replace('/5', '')} rounded-xl flex items-center justify-center ${c.color.replace('400', '600')} mb-6 border ${c.color.replace('text', 'border').replace('400', '100')} group-hover:scale-105 transition-transform`}>
                  <c.icon size={20} />
               </div>

               <span className={`text-[10px] font-bold uppercase tracking-widest mb-4 block ${c.color.replace('400', '500')}`}>
                 {c.label}
               </span>
               <div className="flex items-baseline gap-2">
                  <AnimatedCount count={c.count} color="#0F172A" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasks</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

