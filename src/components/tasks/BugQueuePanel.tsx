'use client';

import React from 'react';
import { 
  Bug, ExternalLink, User, Clock, 
  CircleCheck, AlertTriangle, ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface BugReport {
  id: string;
  task: { id: string; title: string };
  testResult?: { id: string; actualResult: string; notes: string };
  reportedBy: { id: string; name: string };
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

interface Props {
  bugReports: BugReport[];
  theme?: 'light' | 'dark';
  onFixBug: (bugId: string, taskId: string) => void;
}

export const BugQueuePanel: React.FC<Props> = ({ bugReports, onFixBug }) => {
  return (
    <div className="space-y-6" id="bug-queue">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
          <Bug size={14} className="text-rose-600" /> Active Defect Reports
        </h3>
        <div className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-black shadow-sm">
          {bugReports.length}
        </div>
      </div>

      <div className="space-y-4">
        {bugReports.length === 0 ? (
          <div className="p-12 bg-emerald-50/50 border border-emerald-100 rounded-[32px] text-center border-dashed transition-all group">
            <div className="w-16 h-16 bg-white border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-105 transition-transform">
               <CircleCheck size={32} className="text-emerald-500" />
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tight">System Integrity Normal</h4>
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mt-2">All verification cycles cleared.</p>
          </div>
        ) : (
          bugReports.map((bug) => (
            <BugItem key={bug.id} bug={bug} onFix={() => onFixBug(bug.id, bug.task.id)} />
          ))
        )}
      </div>
    </div>
  );
};

const BugItem = ({ bug, onFix }: { bug: BugReport; onFix: () => void }) => {
  const severityStyles: Record<string, string> = {
    CRITICAL: 'border-l-rose-600',
    HIGH: 'border-l-amber-500',
    MEDIUM: 'border-l-blue-500',
    LOW: 'border-l-slate-400',
  };

  const badgeStyles: Record<string, string> = {
    CRITICAL: 'bg-rose-50 text-rose-600 border-rose-100',
    HIGH: 'bg-amber-50 text-amber-600 border-amber-100',
    MEDIUM: 'bg-blue-50 text-blue-600 border-blue-100',
    LOW: 'bg-slate-50 text-slate-400 border-slate-100',
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`bg-white border border-slate-200 border-l-[6px] ${severityStyles[bug.severity]} p-6 rounded-[28px] transition-all group hover:border-blue-200 hover:shadow-md hover:-translate-y-1`}>
      {/* Row 1: Severity & Title */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-3">
          <div className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${badgeStyles[bug.severity]}`}>
            {bug.severity}
          </div>
          <h4 className="text-[15px] font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{bug.title}</h4>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-300 group-hover:text-rose-500 group-hover:bg-rose-50 group-hover:border-rose-100 transition-all">
          <AlertTriangle size={18} />
        </div>
      </div>

      {/* Row 2: Task Context */}
      <div className="flex items-center gap-3 mb-5 p-2 bg-slate-50/50 rounded-xl border border-slate-100/50">
        <div className="px-2 py-0.5 bg-white border border-slate-100 rounded-md text-[9px] font-black text-slate-400 uppercase tracking-widest">Context</div>
        <span className="text-[11px] font-bold truncate flex-1 text-slate-600">{bug.task?.title || 'Unknown Asset'}</span>
        <ExternalLink size={12} className="text-slate-300" />
      </div>

      {/* Row 3: Description */}
      <p className="text-[12px] font-medium text-slate-500 line-clamp-2 mb-6 italic leading-relaxed bg-slate-50/30 p-3 rounded-2xl border border-slate-100/50">
        "{bug.description}"
      </p>

      {/* Row 4: Reporter Info */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
            <User size={14} />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Logged by <span className="text-slate-900">{bug.reportedBy.name}</span> • {timeAgo(bug.createdAt)}
          </div>
        </div>
      </div>

      {/* Row 5: Action Button */}
      <button 
        onClick={onFix}
        className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:bg-blue-600 active:scale-95 border border-transparent"
      >
        <ShieldAlert size={14} /> Remediate Asset
      </button>
    </div>
  );
};

