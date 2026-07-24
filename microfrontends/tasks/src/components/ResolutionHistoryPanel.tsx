import React, { useState, useMemo } from 'react';

export interface ResolvedBlocker {
  id: string;
  task: { id: string; title: string; priority?: string };
  reporter?: { id: string; name: string };
  resolver?: { id: string; name: string };
  reportedBy?: { id: string; name: string }; // Prisma fallback
  resolvedBy?: { id: string; name: string }; // Prisma fallback
  description: string;
  resolution_note?: string;
  resolutionNote?: string; // Prisma fallback
  created_at?: string;
  createdAt?: string; // Prisma fallback
  resolved_at?: string;
  resolvedAt?: string; // Prisma fallback
}

interface Props {
  history: ResolvedBlocker[];
  loading: boolean;
}

export default function ResolutionHistoryPanel({ history, loading }: Props) {
  const [showAll, setShowAll] = useState(false);

  // Sorting
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const aTime = new Date(a.resolved_at || a.resolvedAt || 0).getTime();
      const bTime = new Date(b.resolved_at || b.resolvedAt || 0).getTime();
      return bTime - aTime; // Newest first
    });
  }, [history]);

  const displayHistory = showAll ? sortedHistory : sortedHistory.slice(0, 5);
  const hiddenCount = sortedHistory.length - 5;

  // Time formatters
  const getTimeAgo = (dateString: string) => {
    try {
      const now = new Date();
      const past = new Date(dateString);
      const diffHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
      if (diffHours < 1) return 'Resolved just now';
      if (diffHours < 24) return `Resolved ${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `Resolved ${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const getDuration = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const diffHours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      if (diffHours < 24) return `${Math.max(1, diffHours)} hours`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } catch {
      return 'unknown time';
    }
  };

  return (
    <div 
      className="h-full flex flex-col w-[35%] overflow-y-auto bg-slate-50/50"
      style={{ 
        borderLeft: '0.5px solid var(--color-border-tertiary, #e2e8f0)',
        padding: '0 0 0 24px'
      }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 shrink-0 pt-8 pr-8">
        <h2 
          className="text-slate-500 font-bold"
          style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Resolution History
        </h2>
        {history.length > 0 && !loading && (
          <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[12px] font-bold">
            {history.length} resolved
          </span>
        )}
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="space-y-6 pr-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex flex-col gap-3 py-4">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-100 rounded w-16"></div>
              </div>
              <div className="h-3 bg-slate-100 rounded w-1/3"></div>
              <div className="h-3 bg-slate-100 rounded w-full"></div>
              <div className="h-3 bg-slate-100 rounded w-4/5"></div>
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && history.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center opacity-60 pb-20 pr-8">
          <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            No Recent Resolutions
          </p>
          <p className="text-[13px] text-slate-500 font-medium">
            Resolved blockers will appear here.
          </p>
        </div>
      )}

      {/* POPULATED STATE */}
      {!loading && history.length > 0 && (
        <div className="flex-1 flex flex-col pr-8">
          <div className="space-y-0 divide-y divide-slate-100">
            {displayHistory.map((item) => {
              const resAt = item.resolved_at || item.resolvedAt || '';
              const creAt = item.created_at || item.createdAt || '';
              const resolverName = item.resolver?.name || item.resolvedBy?.name || 'Team Lead';
              const resolutionNote = item.resolution_note || item.resolutionNote || 'No resolution note provided.';

              return (
                <div key={item.id} className="py-5 first:pt-0 hover:bg-slate-50/50 transition-colors px-2 -mx-2 rounded-lg">
                  {/* ROW 1: Task title + time resolved */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-[13px] font-bold text-slate-800 leading-snug pr-4">
                      {item.task?.title || 'Unknown Task'}
                    </h3>
                    <span className="text-[12px] text-slate-400 whitespace-nowrap font-medium">
                      {getTimeAgo(resAt)}
                    </span>
                  </div>

                  {/* ROW 2: Resolution details */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]"></div>
                    <span className="text-[12px] text-slate-500 font-medium">
                      Resolved by {resolverName}
                    </span>
                  </div>

                  {/* ROW 3: Resolution note */}
                  <div 
                    className="text-[12px] text-slate-500 italic mb-3 line-clamp-2 leading-relaxed prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: `"${resolutionNote}"` }}
                  />

                  {/* ROW 4: Duration stat */}
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Was blocked for {getDuration(creAt, resAt)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* SHOW MORE */}
          {!showAll && hiddenCount > 0 && (
            <div className="pt-6 pb-12 text-center">
              <button 
                onClick={() => setShowAll(true)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
              >
                Show {hiddenCount} more &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

