'use client';

import React, { useMemo } from 'react';
import { GitBranch, Code2, ExternalLink, Loader } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PullRequest {
  id: string;
  title: string;
  branchName: string;
  commitHash?: string;
  createdAt: string;
  submittedBy: {
    id: string;
    name: string;
    color?: string; // hex, e.g. "#534AB7"
  };
  task: {
    id: string;
    title: string;
    priority?: string;
  };
}

interface Props {
  prs: PullRequest[];
  onReview: (prId: string) => void;
  reviewing: string | null;
  loading: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns { text, isOverdue } for a given ISO date string */
function getTimeAgo(date: string): { text: string; isOverdue: boolean } {
  if (!date) return { text: 'unknown', isOverdue: false };

  const diffMs  = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const isOverdue = diffHrs > 48;

  if (diffMin < 1)   return { text: 'just now',            isOverdue };
  if (diffMin < 60)  return { text: `${diffMin} min ago`,  isOverdue };
  if (diffHrs < 24)  return { text: `${diffHrs} hour${diffHrs === 1 ? '' : 's'} ago`, isOverdue };

  const diffDays = Math.floor(diffHrs / 24);
  return { text: `${diffDays} day${diffDays === 1 ? '' : 's'} ago`, isOverdue };
}

/** Derive initials (up to 2 chars) from a name */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(n => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Deterministic colour from a string — used when the PR's submittedBy.color
 * is absent, so every developer always gets the same avatar colour.
 */
function stringToColor(str: string): string {
  const palette = [
    '#534AB7', '#10B981', '#F59E0B', '#EF4444',
    '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-slate-100 animate-pulse shrink-0" />

      {/* Center */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3.5 w-2/3 bg-slate-100 rounded-full animate-pulse" />
        <div className="h-2.5 w-1/3 bg-slate-50 rounded-full animate-pulse" />
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="h-2.5 w-16 bg-slate-50 rounded-full animate-pulse" />
        <div className="h-7 w-20 bg-slate-100 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center select-none">
      {/* 48 px green checkmark SVG — stroke-only as required */}
      <div className="mb-6">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Circle */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#1D9E75"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Check */}
          <path
            d="M14 24.5L20.5 31L34 17"
            stroke="#1D9E75"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2
        className="font-bold text-[#0f172a] mb-2"
        style={{ fontSize: 20 }}
      >
        Review Queue Empty
      </h2>
      <p
        className="text-slate-400 font-medium"
        style={{ fontSize: 14 }}
      >
        All pull requests have been processed.
      </p>
    </div>
  );
}

// ─── Single PR Card Row ────────────────────────────────────────────────────────

interface PRCardRowProps {
  pr: PullRequest;
  onReview: (id: string) => void;
  isReviewing: boolean;
}

function PRCardRow({ pr, onReview, isReviewing }: PRCardRowProps) {
  const devName   = pr.submittedBy?.name || 'Unknown';
  const initials  = getInitials(devName);
  const color     = pr.submittedBy?.color || stringToColor(devName);
  const shortHash = pr.commitHash?.slice(0, 8) ?? null;
  const { text: timeAgoText, isOverdue } = getTimeAgo(pr.createdAt);
  const taskTitle = pr.task?.title || 'Untitled Task';
  const taskId    = pr.task?.id;

  return (
    <div
      className="group flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#534AB7]/20 transition-all duration-200"
      role="row"
    >
      {/* ── LEFT: Avatar + Name ─────────────────────────── */}
      <div className="flex items-center gap-2.5 w-[200px] shrink-0">
        {/* 28 px avatar circle */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-sm"
          style={{ backgroundColor: color }}
          title={devName}
        >
          {initials}
        </div>
        <span className="text-[13px] font-semibold text-[#0f172a] truncate leading-none">
          {devName}
        </span>
      </div>

      {/* ── CENTER: Task Title + Branch/Commit ──────────── */}
      <div className="flex-1 min-w-0">
        {/* Task title — linked to sprint board */}
        {taskId ? (
          <a
            href={`/dashboard/lead?task=${taskId}`}
            className="group/link block"
            title={`View task: ${taskTitle}`}
          >
            <p className="text-[14px] font-bold text-[#0f172a] group-hover/link:text-[#534AB7] transition-colors truncate leading-snug">
              {taskTitle}
            </p>
          </a>
        ) : (
          <p className="text-[14px] font-bold text-[#0f172a] truncate leading-snug">
            {taskTitle}
          </p>
        )}

        {/* Branch + Commit */}
        <div className="flex items-center gap-2 mt-1">
          <GitBranch size={11} className="text-slate-300 shrink-0" />
          <span className="text-[12px] font-mono text-slate-400 truncate">
            {pr.branchName}
          </span>
          {shortHash && (
            <>
              <span className="text-slate-200 text-[10px]">·</span>
              <Code2 size={11} className="text-slate-300 shrink-0" />
              <span className="text-[12px] font-mono text-slate-400">
                {shortHash}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT: Time + Button ────────────────────────── */}
      <div className="flex flex-col items-end gap-2.5 shrink-0">
        {/* Submitted time */}
        <span
          className="text-[12px] font-medium tabular-nums"
          style={{ color: isOverdue ? '#EF4444' : '#94a3b8' }}
          title={new Date(pr.createdAt).toLocaleString()}
        >
          {timeAgoText}
          {isOverdue && (
            <span className="ml-1 text-[10px] font-black text-red-400 uppercase tracking-wider">
              · Overdue
            </span>
          )}
        </span>

        {/* Review button */}
        <button
          id={`review-btn-${pr.id}`}
          onClick={() => onReview(pr.id)}
          disabled={isReviewing}
          aria-label={isReviewing ? `Reviewing PR ${pr.id}` : `Review PR: ${taskTitle}`}
          className={[
            'h-8 px-4 rounded-full text-[12px] font-bold transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#534AB7]/50',
            isReviewing
              ? 'bg-[#534AB7]/10 text-[#534AB7] cursor-not-allowed'
              : 'bg-[#534AB7] text-white shadow-sm shadow-[#534AB7]/20 hover:bg-[#3C3489] active:scale-95',
          ].join(' ')}
        >
          {isReviewing ? (
            <span className="flex items-center gap-1.5">
              <Loader size={11} className="animate-spin" />
              Reviewing…
            </span>
          ) : (
            'Review'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const PRListTable: React.FC<Props> = ({ prs, onReview, reviewing, loading }) => {
  // Oldest first → most urgent at top
  const sorted = useMemo(
    () => [...prs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [prs]
  );

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading pull requests">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────────
  if (sorted.length === 0) {
    return <EmptyState />;
  }

  // ── PR List ────────────────────────────────────────────────────────────────
  return (
    <div
      className="space-y-3 pb-6"
      role="list"
      aria-label={`${sorted.length} open pull request${sorted.length !== 1 ? 's' : ''} awaiting review`}
    >
      {/* Column headers — subtle, only when list is non-empty */}
      <div className="flex items-center gap-4 px-5 pb-1">
        <span className="w-[200px] shrink-0 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Developer
        </span>
        <span className="flex-1 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Task · Branch &amp; Commit
        </span>
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] text-right shrink-0 pr-1">
          Submitted
        </span>
      </div>

      {sorted.map(pr => (
        <PRCardRow
          key={pr.id}
          pr={pr}
          onReview={onReview}
          isReviewing={reviewing === pr.id}
        />
      ))}
    </div>
  );
};

export default PRListTable;

