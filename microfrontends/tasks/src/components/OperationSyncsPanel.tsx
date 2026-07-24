

import React from 'react';
import { Calendar, Users, ChevronRight } from 'lucide-react';

interface Sync {
  id: string;
  title: string;
  scheduledAt: string; // The backend actually returns camelCase
  durationMinutes: number;
  participants: { user?: { id: string; name: string } }[];
  notes?: string | null;
}

interface Props {
  syncs: Sync[];
  onSchedule: () => void;
}

export const OperationSyncsPanel: React.FC<Props> = ({ syncs, onSchedule }) => {
  const displaySyncs = syncs.slice(0, 3);
  const hasMore = syncs.length > 3;

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${dateStr}, ${timeStr}`;
  };

  return (
    <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
           Upcoming Syncs
        </h3>
        <button 
          onClick={onSchedule}
          className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/10 active:scale-95"
        >
          Schedule
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-center">
        {syncs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[12px] font-bold uppercase tracking-widest text-slate-300">
              No Pending Sync Cycles
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {displaySyncs.map((sync, index) => (
              <React.Fragment key={sync.id}>
                <div className="flex items-center justify-between py-5 group hover:bg-slate-50 transition-colors -mx-4 px-4 rounded-2xl">
                  {/* Left: Calendar + Time */}
                  <div className="flex flex-col shrink-0">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={14} className="text-blue-600" />
                      <span className="text-[11px] font-bold text-slate-600">
                        {formatDateTime(sync.scheduledAt)}
                      </span>
                    </div>
                  </div>

                  {/* Center: Title */}
                  <div className="flex-1 px-6 min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 truncate">
                      {sync.title}
                    </p>
                  </div>

                  {/* Right: Participants */}
                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <div className="flex -space-x-2">
                       {[...Array(Math.min(sync.participants?.length || 0, 3))].map((_, i) => (
                         <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400 uppercase">
                            {sync.participants[i]?.user?.name?.charAt(0) || 'U'}
                         </div>
                       ))}
                    </div>
                    {(sync.participants?.length || 0) > 3 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        +{sync.participants.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Divider */}
                {index < displaySyncs.length - 1 && (
                  <div className="h-[0.5px] bg-slate-100 w-full" />
                )}
              </React.Fragment>
            ))}

            {/* View All */}
            {hasMore && (
              <>
                <div className="h-[0.5px] bg-slate-100 w-full" />
                <button className="text-[11px] font-bold text-blue-600 uppercase tracking-widest text-center mt-6 py-2.5 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100">
                  View Full Schedule
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

