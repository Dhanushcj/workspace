import React from 'react';
import { 
  ShieldAlert, GitPullRequest, 
  AlertCircle, Calendar, Check, X, UserPlus,
  Unlock, ChevronUp, ChevronDown, Minus,
  Zap, Clock
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

import { Task } from '../store/workflowStore';

interface Props {
  task: Task;
  onClick?: (task: any) => void;
  onStart?: (id: string) => void;
  onBlocker?: (id: string) => void;
  onSubmit?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onAssign?: (id: string) => void;
  onResolve?: (id: string) => void;
  displayId?: string;
  isTeamLead?: boolean;
}

// Derive a stack label from task title / epic / type
const deriveStack = (task: Task): string | null => {
  const t = (task.title || '').toLowerCase();
  if (t.includes('payment') || t.includes('razorpay') || t.includes('invoice')) return 'Payments';
  if (t.includes('api') || t.includes('backend') || t.includes('webhook')) return 'Backend';
  if (t.includes('frontend') || t.includes('ui') || t.includes('profile') || t.includes('product') || t.includes('wishlist') || t.includes('search') || t.includes('filter')) return 'Frontend';
  if (t.includes('database') || t.includes('db') || t.includes('migration')) return 'Database';
  if (t.includes('cart') || t.includes('order') || t.includes('discount') || t.includes('coupon')) return 'Backend';
  if (t.includes('auth') || t.includes('jwt') || t.includes('otp') || t.includes('login')) return 'Backend';
  if (t.includes('full stack')) return 'Full stack';
  if (task.epic?.name) return task.epic.name;
  if (task.type) {
    const type = task.type.toLowerCase();
    if (type === 'feature') return 'Feature';
    if (type === 'bug') return 'Bug fix';
  }
  return null;
};

// Derive short assignee initials
const getInitials = (name?: string): string => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Map initials to avatar color
const avatarColor = (initials: string): string => {
  const colors: Record<string, string> = {
    'ND': 'bg-slate-800',
    'NE': 'bg-slate-800',
    'AP': 'bg-violet-500',
    'DV': 'bg-amber-600',
    'KS': 'bg-sky-500',
    'SM': 'bg-emerald-600',
    'RK': 'bg-rose-600',
  };
  return colors[initials] || 'bg-indigo-600';
};

const priorityDot = (priority: string) => {
  switch (priority?.toUpperCase()) {
    case 'CRITICAL': return 'bg-red-500';
    case 'HIGH': return 'bg-orange-400';
    case 'MEDIUM': return 'bg-blue-500';
    case 'LOW': return 'bg-emerald-400';
    default: return 'bg-slate-300';
  }
};

export const TaskCard = React.memo(({ 
   task, onClick, onStart, onBlocker, onSubmit,
   isSelected, onSelect, onApprove, onReject, onAssign, onResolve,
   displayId, isTeamLead
}: Props) => {
  const initials = getInitials(task.assignee?.name);
  const stack = deriveStack(task);
  const isBlocked = task.status === 'BLOCKED';
  const isDone = task.status === 'DONE';
  const isInReview = task.status === 'IN_REVIEW' || task.status === 'PR_SUBMITTED';
  const isTesting = task.status === 'TESTING';
  const isUnassigned = !task.assignee?.name;

  const prNum = task.prNumber || parseInt(task.id.replace(/\D/g, '').slice(-2) || '11', 10);

  return (
    <div
      onClick={(e) => {
        if (e.ctrlKey && onSelect) { onSelect(); }
        else if (onClick) { onClick(task); }
      }}
      className={`
        bg-[var(--surface)] rounded-[var(--radius)] p-[10px] shadow-sm border border-[var(--border)] transition-all cursor-pointer group relative flex flex-col gap-3
        ${isSelected ? 'border-blue-400 ring-2 ring-blue-50' : 'hover:border-[var(--border2)] hover:shadow-md'}
        ${isBlocked ? 'border-l-4 border-l-rose-500 border-y border-r border-[var(--border)]' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400 font-mono">{displayId || (task.id?.startsWith('#') ? task.id : `#${task.id}`)}</span>
        <div className="flex items-center gap-2">
          {task.isHotfix && (
            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-semibold uppercase flex items-center gap-1">
              <Zap size={9} fill="currentColor" /> Hotfix
            </span>
          )}
          <div className={`w-2 h-2 rounded-full ${priorityDot(task.priority)}`} />
        </div>
      </div>

      <h4 className="text-[13px] font-bold leading-snug text-[var(--text)] line-clamp-3">
        {task.title}
      </h4>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignee?.name ? (
            <div className={`w-7 h-7 rounded-full ${avatarColor(initials)} flex items-center justify-center text-[10px] font-medium text-white shadow-sm`}>
              {initials}
            </div>
          ) : null}
          {stack && (
            <span className="px-2 py-0.5 bg-[var(--bg2)] text-[var(--text2)] rounded text-[9px] font-semibold uppercase tracking-tight">
              {stack}
            </span>
          )}
        </div>

        {/* Story points */}
        {task.storyPoints != null && (
          <span className="text-[12px] font-semibold text-slate-400">{task.storyPoints} pts</span>
        )}
      </div>

      {/* PR badge (In Review) */}
      {(isInReview && task.prStatus !== undefined) || isInReview ? (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-violet-50 border border-violet-100 text-violet-700 rounded text-[9px] font-semibold flex items-center gap-1">
            <GitPullRequest size={10} /> PR #{prNum}
          </span>
          {task._count && task._count.comments > 0 && (
            <span className="text-[9px] font-bold text-slate-400">{task._count.comments} files</span>
          )}
        </div>
      ) : null}

      {/* Tester badge (Testing) */}
      {isTesting && task.assignee?.name && (
        <div className="text-[10px] font-bold text-slate-400">
          Tester: {task.assignee.name.split(' ')[0]} · 1 hr
        </div>
      )}

      {/* Bug count badge (Testing) */}
      {isTesting && task._count && task._count.blockers > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-500">
          <AlertCircle size={12} /> {task._count.blockers} bugs
          <span className="text-slate-400 font-medium">Bugs logged · Sent to developer</span>
        </div>
      )}

      {/* Deployed badge (Done) */}
      {isDone && task.deployedAt && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
          <Check size={11} className="text-emerald-500" />
          Deployed · {task.deployedAt}
        </div>
      )}

      {/* Blocked reason */}
      {isBlocked && task.blockerInfo && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          <p className="text-[10px] font-semibold text-rose-700 leading-snug">
            {task.blockerInfo.reason || 'Blocked — pending resolution'}
          </p>
          <p className="text-[9px] font-medium text-rose-400 mt-0.5">{task.blockerInfo.raisedAt}</p>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="pt-1 space-y-2">
        {/* Unassigned + TO_DO — Assign */}
        {isUnassigned && task.status === 'TO_DO' && isTeamLead && (
          <button
            onClick={(e) => { e.stopPropagation(); onAssign?.(task.id); }}
            className="w-full py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <UserPlus size={13} /> Assign
          </button>
        )}

        {/* In Review — Approve / Reject */}
        {isInReview && isTeamLead && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onApprove?.(task.id); }}
              className="flex-1 py-2.5 bg-[#065F46] text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#047857] transition-all"
            >
              <Check size={16} strokeWidth={3} /> Approve
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReject?.(task.id); }}
              className="px-3 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl hover:bg-rose-100 transition-all shadow-sm flex items-center justify-center"
            >
              <X size={16} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* Blocked — Resolve */}
        {isBlocked && isTeamLead && (
          <button
            onClick={(e) => { e.stopPropagation(); onResolve?.(task.id); }}
            className="w-full py-2.5 bg-white border-2 border-slate-200 text-slate-800 rounded-xl text-[11px] font-semibold uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Unlock size={13} strokeWidth={2.5} /> Resolve
          </button>
        )}
      </div>
    </div>
  );
});

