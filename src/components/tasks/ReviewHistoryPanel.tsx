'use client';

import React, { useState } from 'react';
import { 
  CircleCheck, AlertTriangle, GitPullRequest, 
  ArrowRight, User, History, MessageSquare, ExternalLink 
} from 'lucide-react';

interface ReviewedPR {
  id: string;
  decision: 'APPROVED' | 'REJECTED';
  feedback?: string;
  reviewedAt: string;
  pullRequest: {
    title: string;
    branchName: string;
    task: { title: string };
    submittedBy: { name: string };
  };
  reviewedBy: { name: string };
}

interface Props {
  reviews: ReviewedPR[];
  loading: boolean;
}

export const ReviewHistoryPanel: React.FC<Props> = ({ reviews, loading }) => {
  const [displayCount, setDisplayCount] = useState(5);

  const getTimeAgo = (date: string) => {
    if (!date) return 'unknown';
    const diff = Date.now() - new Date(date).getTime();
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    if (hrs < 24) return `${hrs} hrs ago`;
    const days = Math.floor(hrs / 24);
    return `${days} days ago`;
  };

  const sortedReviews = [...reviews].sort((a, b) => 
    new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
  );

  const visibleReviews = sortedReviews.slice(0, displayCount);
  const remainingCount = Math.max(0, reviews.length - displayCount);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
           <div className="h-3 w-32 bg-slate-100 rounded-full animate-pulse" />
           <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 border-b border-slate-50 space-y-3">
            <div className="flex justify-between">
               <div className="h-4 w-48 bg-slate-50 rounded animate-pulse" />
               <div className="h-4 w-16 bg-slate-50 rounded animate-pulse" />
            </div>
            <div className="h-3 w-32 bg-slate-50 rounded animate-pulse" />
            <div className="h-3 w-full bg-slate-50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* PANEL HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <History size={12} className="text-[#FFC107]" /> Review History
        </h2>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
          reviews.length > 0 ? 'bg-[#E1F5EE] text-[#085041] border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
        }`}>
          {reviews.length} Reviewed
        </div>
      </div>

      {/* EMPTY STATE */}
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center opacity-60">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-6">
             <GitPullRequest size={24} className="text-slate-300" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">No Reviews Yet</p>
          <p className="text-[13px] text-slate-500 font-medium">Reviewed pull requests will appear here for audit.</p>
        </div>
      ) : (
        <div className="space-y-0 pb-12">
          {visibleReviews.map((rev, idx) => {
            const pr = rev.pullRequest;
            const developerName = pr?.submittedBy?.name || 'Unknown Developer';
            const reviewerName = rev.reviewedBy?.name || 'Lead';
            const isApproved = rev.decision === 'APPROVED';

            return (
              <div key={rev.id} className={`py-6 group ${idx !== visibleReviews.length - 1 ? 'border-b border-slate-100' : ''}`}>
                {/* Row 1: Title & Badge */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-[13px] font-bold text-[#0f172a] leading-tight group-hover:text-[#FFC107] transition-colors line-clamp-1">
                    {pr?.title || 'Untitled PR'}
                  </h3>
                  <div className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    isApproved ? 'bg-[#E1F5EE] text-[#085041]' : 'bg-[#FCEBEB] text-[#791F1F]'
                  }`}>
                    {isApproved ? 'Approved' : 'Rejected'}
                  </div>
                </div>

                {/* Row 2: Branch & Time */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">{pr?.branchName || 'main'}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Reviewed {getTimeAgo(rev.reviewedAt)}</span>
                </div>

                {/* Row 3: Handoff */}
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[#0f172a] text-[8px] font-black">
                      {developerName[0]}
                   </div>
                   <div className="flex items-center gap-1.5 text-[11px] font-medium">
                      <span className="text-slate-900">{developerName}</span>
                      <ArrowRight size={10} className="text-slate-300" />
                      <span className="text-slate-500">{reviewerName}</span>
                   </div>
                </div>

                {/* Row 4: Feedback Snippet */}
                {rev.feedback && (
                  <div className="flex items-start gap-2 mb-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-50">
                     <MessageSquare size={10} className="text-slate-300 mt-0.5 shrink-0" />
                     <p className="text-[11px] text-slate-500 italic leading-relaxed line-clamp-2">
                       "{rev.feedback}"
                     </p>
                  </div>
                )}

                {/* Row 5: Sent to QA (Approved only) */}
                {isApproved && (
                  <div className="flex items-center gap-2 text-[11px] font-black text-[#0F6E56] uppercase tracking-widest mt-2 animate-in fade-in duration-700">
                    <ExternalLink size={10} />
                    → Sent to QA Staging
                  </div>
                )}
              </div>
            );
          })}

          {/* Show More Link */}
          {remainingCount > 0 && (
            <button 
              onClick={() => setDisplayCount(prev => prev + 5)}
              className="w-full py-4 text-[11px] font-black text-[#FFC107] uppercase tracking-[0.2em] hover:text-[#0f172a] transition-all flex items-center justify-center gap-2 group"
            >
              Show {remainingCount} More 
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

