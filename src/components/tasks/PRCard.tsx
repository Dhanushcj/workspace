'use client';

import React, { useState } from 'react';
import { GitBranch, Code, CheckCircle, ChevronDown, ChevronUp, AlertCircle, Clock } from 'lucide-react';

interface PRCardProps {
  pr: {
    id: string;
    title: string;
    description?: string;
    branchName: string;
    commitHash?: string;
    task: { id: string; title: string; priority: string };
    submittedBy: { id: string; name: string };
    status: string;
    createdAt: string; 
  };
  isReviewing: boolean;
  onApprove: (prId: string) => void;
  onReject: (prId: string) => void;
}

export const PRCard: React.FC<PRCardProps> = ({ pr, isReviewing, onApprove, onReject }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const getTimeAgo = (date: string) => {
    if (!date) return { text: 'unknown', isOverdue: false };
    const diff = Date.now() - new Date(date).getTime();
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const isOverdue = hrs > 48;
    
    if (hrs < 24) return { text: `${hrs} hrs ago`, isOverdue };
    const days = Math.floor(hrs / 24);
    return { text: `${days} days ago`, isOverdue };
  };

  const { text: timeAgo, isOverdue } = getTimeAgo(pr.createdAt);

  const getPriorityStyles = (priority: string) => {
    if (!priority) return 'bg-slate-100 text-slate-600';
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-[#FCEBEB] text-[#791F1F]';
      case 'high': return 'bg-[#FAEEDA] text-[#633806]';
      case 'medium': return 'bg-[#E6F1FB] text-[#0C447C]';
      case 'low': return 'bg-[#F1EFE8] text-[#444441]';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const developerName = pr.submittedBy?.name || 'Unknown Developer';
  const initials = developerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white border-[0.5px] border-slate-200 border-l-[4px] border-l-[#534AB7] rounded-r-xl p-4 mb-3 shadow-sm hover:shadow-md transition-all group">
      {/* Row 1: Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-slate-400" />
          <span className="text-[13px] font-mono font-bold tracking-tight text-[#534AB7]">{pr.branchName}</span>
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
          <Clock size={12} />
          {timeAgo}
        </div>
      </div>

      {/* Row 2: Title & Task */}
      <div className="mb-4">
        <h3 className="text-[16px] font-bold text-[#0f172a] mb-1 leading-tight group-hover:text-[#FFC107] transition-colors">
          {pr.title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] text-slate-400 font-medium italic">→ Task: {pr.task?.title || 'Untitled Task'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getPriorityStyles(pr.task?.priority)}`}>
            {pr.task?.priority || 'MEDIUM'}
          </span>
        </div>
      </div>

      {/* Row 3: Developer */}
      <div className="flex items-center gap-3 mb-4 p-2 bg-[#F8FAFC] rounded-xl border border-slate-50">
        <div className="w-7 h-7 bg-[#0f172a] text-[#FFC107] rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
          {initials}
        </div>
        <div className="text-[12px]">
          <span className="font-bold text-[#0f172a]">{developerName}</span>
          <span className="text-slate-400 ml-1 font-medium">submitted for review</span>
        </div>
      </div>

      {/* Row 4: Description */}
      {pr.description && (
        <div className="mb-4">
          <p className={`text-[12px] text-slate-500 leading-relaxed ${!showFullDescription && 'line-clamp-2'}`}>
            {pr.description}
          </p>
          {pr.description.length > 100 && (
            <button 
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-[10px] font-black text-[#FFC107] uppercase tracking-widest mt-1 flex items-center gap-1 hover:underline"
            >
              {showFullDescription ? (
                <><ChevronUp size={10} /> Show Less</>
              ) : (
                <><ChevronDown size={10} /> Show More</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Row 5: Commit Hash */}
      {pr.commitHash && (
        <div className="flex items-center gap-2 mb-5 px-3 py-1.5 bg-slate-50 rounded-lg w-fit border border-slate-100">
          <Code size={12} className="text-slate-400" />
          <span className="text-[11px] font-mono text-slate-500 font-bold">{pr.commitHash}</span>
        </div>
      )}

      {/* Row 6: Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={() => onReject(pr.id)}
          disabled={isReviewing}
          className="px-4 py-2 border-[0.5px] border-red-200 text-red-500 bg-white rounded-lg text-[12px] font-black uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={() => onApprove(pr.id)}
          disabled={isReviewing}
          className="px-6 py-2 bg-[#534AB7] text-white rounded-lg text-[13px] font-medium hover:bg-[#3C3489] transition-all shadow-lg shadow-purple-500/10 active:scale-95 disabled:opacity-50"
        >
          Approve
        </button>
      </div>

      {isReviewing && (
        <div className="flex items-center justify-end gap-2 mt-3 text-[10px] font-black text-[#FFC107] uppercase tracking-[0.2em] animate-pulse">
          <div className="w-1.5 h-1.5 bg-[#FFC107] rounded-full animate-ping" />
          Submitting review...
        </div>
      )}
    </div>
  );
};
export const PREmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in duration-1000">
      <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/10">
        <CheckCircle size={40} className="text-emerald-500" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-black text-[#0f172a] tracking-tight mb-2">Review Queue Empty</h2>
      <p className="text-sm text-slate-400 font-medium max-w-[240px]">All pull requests have been processed successfully.</p>
    </div>
  );
};

