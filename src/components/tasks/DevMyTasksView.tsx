'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, Play, Code2,
  FlaskConical, ListChecks, Search, Filter, Calendar,
  ChevronDown, Flag, ArrowUpRight, MoreHorizontal, Zap
} from 'lucide-react';
import { Task, useWorkflowStore } from '../../store/workflowStore';
import { useAuthStore } from '../../store/authStore';

interface DevMyTasksViewProps {
  onOpenTask: (task: Task) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  TO_DO:       { label: 'To Do',       color: 'text-slate-600', bg: 'bg-slate-100',    icon: <ListChecks size={12} /> },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-700',  bg: 'bg-blue-100',     icon: <Play size={12} /> },
  CODE_REVIEW: { label: 'Code Review', color: 'text-violet-700',bg: 'bg-violet-100',   icon: <Code2 size={12} /> },
  TESTING:     { label: 'Testing',     color: 'text-amber-700', bg: 'bg-amber-100',    icon: <FlaskConical size={12} /> },
  DONE:        { label: 'Completed',   color: 'text-emerald-700',bg: 'bg-emerald-100', icon: <CheckCircle2 size={12} /> },
  BLOCKED:     { label: 'Blocked',     color: 'text-red-700',   bg: 'bg-red-100',      icon: <AlertTriangle size={12} /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  CRITICAL: { label: 'Critical', color: 'text-red-600',    dot: 'bg-red-500' },
  HIGH:     { label: 'High',     color: 'text-orange-600', dot: 'bg-orange-500' },
  MEDIUM:   { label: 'Medium',   color: 'text-amber-600',  dot: 'bg-amber-400' },
  LOW:      { label: 'Low',      color: 'text-slate-500',  dot: 'bg-slate-300' },
};

const FILTER_TABS = ['All', 'Today', 'Upcoming', 'Overdue', 'To Do', 'In Progress', 'Code Review', 'Testing', 'Completed'];

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate) < new Date();
}

function isDueToday(task: Task): boolean {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const today = new Date();
  return due.toDateString() === today.toDateString();
}

function getDaysOverdue(task: Task): number {
  if (!task.dueDate) return 0;
  const due = new Date(task.dueDate);
  const today = new Date();
  return Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function getSubtaskProgress(task: Task): { completed: number; total: number; pct: number } {
  const subs = task.subtasks || [];
  const total = subs.length;
  const completed = subs.filter(s => s.completed).length;
  return { completed, total, pct: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aOver = isOverdue(a);
    const bOver = isOverdue(b);
    if (aOver && !bOver) return -1;
    if (!aOver && bOver) return 1;

    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const aPri = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
    const bPri = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;

    const aToday = isDueToday(a);
    const bToday = isDueToday(b);
    if (aToday && !bToday) return -1;
    if (!aToday && bToday) return 1;

    if (aPri !== bPri) return aPri - bPri;

    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

// ─── Summary Card ───────────────────────────────────────────────────────────
const SummaryCard = ({ label, count, color = '', active = false, onClick }: {
  label: string; count: number; color?: string; active?: boolean; onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-start p-5 rounded-2xl border transition-all cursor-pointer text-left ${
      active
        ? 'bg-[#1B4FAB] border-[#1B4FAB] text-white shadow-lg shadow-[#1B4FAB]/20'
        : 'bg-white border-slate-100 hover:border-[#1B4FAB]/30 hover:shadow-md'
    }`}
  >
    <div className={`text-3xl font-black tracking-tight ${active ? 'text-white' : color || 'text-slate-800'}`}>
      {count}
    </div>
    <div className={`text-[11px] font-bold uppercase tracking-widest mt-1 ${active ? 'text-white/70' : 'text-slate-400'}`}>
      {label}
    </div>
  </button>
);

// ─── Task Row ────────────────────────────────────────────────────────────────
const TaskRow = ({ task, onOpen }: { task: Task; onOpen: () => void }) => {
  const overdue = isOverdue(task);
  const today = isDueToday(task);
  const daysOver = overdue ? getDaysOverdue(task) : 0;
  const prog = getSubtaskProgress(task);
  const status = STATUS_CONFIG[task.status] || { label: task.status, color: 'text-slate-600', bg: 'bg-slate-100', icon: null };
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;

  const formatDate = (d?: string) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`group bg-white rounded-2xl border p-5 hover:shadow-md transition-all cursor-pointer ${
        overdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100 hover:border-[#1B4FAB]/20'
      }`}
      onClick={onOpen}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Top row: ID + badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[10px] font-mono font-bold text-[#1B4FAB]/60 bg-[#1B4FAB]/5 px-2 py-0.5 rounded-lg">
              {task.displayId || `#${String(task.id || '').slice(-4).toUpperCase()}`}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
              {status.icon} {status.label}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </span>
            {overdue && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                <AlertTriangle size={10} /> {daysOver}d overdue
              </span>
            )}
            {today && !overdue && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Due today
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-bold text-slate-800 leading-snug mb-1 group-hover:text-[#1B4FAB] transition-colors">
            {task.title}
          </h3>

          {/* Project / Module / Feature breadcrumb */}
          {(task.moduleName || task.featureName) && (
            <p className="text-[11px] text-slate-400 font-medium mb-3">
              {[task.moduleName, task.featureName].filter(Boolean).join(' › ')}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 flex-wrap text-[11px] font-semibold text-slate-400">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar size={11} /> Due {formatDate(task.dueDate)}
              </span>
            )}
            {task.storyPoints && (
              <span className="flex items-center gap-1">
                <Zap size={11} /> {task.storyPoints} pts
              </span>
            )}
            {task.estimatedHours && (
              <span className="flex items-center gap-1">
                <Clock size={11} /> {task.estimatedHours}h est.
              </span>
            )}
          </div>

          {/* Subtask progress bar */}
          {prog.total > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400">
                  {prog.completed}/{prog.total} subtasks
                </span>
                <span className="text-[10px] font-bold text-[#1B4FAB]">{prog.pct}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1B4FAB] to-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${prog.pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Review / Test feedback banner */}
          {task.reviewComment && task.status === 'IN_PROGRESS' && (
            <div className="mt-3 p-3 bg-violet-50 border border-violet-200 rounded-xl text-[11px] text-violet-700 font-medium">
              <strong>Review Feedback:</strong> {task.reviewComment}
            </div>
          )}
          {task.testComment && task.status === 'IN_PROGRESS' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700 font-medium">
              <strong>Test Failed:</strong> {task.testComment}
            </div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="shrink-0 px-4 py-2 bg-[#1B4FAB] text-white text-[11px] font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100"
        >
          Open <ArrowUpRight size={12} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const DevMyTasksView = ({ onOpenTask }: DevMyTasksViewProps) => {
  const tasks = useWorkflowStore(state => state.tasks);
  const { user } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // My tasks only
  const myTasks = useMemo(() =>
    tasks.filter(t => t.assigneeId === user?.id),
    [tasks, user?.id]
  );

  const today = new Date();

  // Summary counts
  const summary = useMemo(() => ({
    total:       myTasks.length,
    todo:        myTasks.filter(t => t.status === 'TO_DO').length,
    inProgress:  myTasks.filter(t => t.status === 'IN_PROGRESS').length,
    codeReview:  myTasks.filter(t => t.status === 'CODE_REVIEW').length,
    testing:     myTasks.filter(t => t.status === 'TESTING').length,
    completed:   myTasks.filter(t => t.status === 'DONE').length,
    overdue:     myTasks.filter(t => isOverdue(t)).length,
  }), [myTasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let result = myTasks;

    // Tab filter
    switch (activeFilter) {
      case 'Today':
        result = result.filter(t => isDueToday(t) && t.status !== 'DONE');
        break;
      case 'Upcoming':
        result = result.filter(t => {
          if (!t.dueDate || t.status === 'DONE') return false;
          const due = new Date(t.dueDate);
          return due > today && !isDueToday(t);
        });
        break;
      case 'Overdue':
        result = result.filter(t => isOverdue(t));
        break;
      case 'To Do':        result = result.filter(t => t.status === 'TO_DO'); break;
      case 'In Progress':  result = result.filter(t => t.status === 'IN_PROGRESS'); break;
      case 'Code Review':  result = result.filter(t => t.status === 'CODE_REVIEW'); break;
      case 'Testing':      result = result.filter(t => t.status === 'TESTING'); break;
      case 'Completed':    result = result.filter(t => t.status === 'DONE'); break;
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.displayId?.toLowerCase().includes(q) ||
        t.moduleName?.toLowerCase().includes(q)
      );
    }

    // Priority filter
    if (priorityFilter) {
      result = result.filter(t => t.priority === priorityFilter);
    }

    return sortTasks(result);
  }, [myTasks, activeFilter, search, priorityFilter]);

  return (
    <div className="p-8 w-full space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">My Tasks</h1>
        <p className="text-[12px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
          {user?.name} · {filteredTasks.length} tasks
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-3">
        <SummaryCard label="Total" count={summary.total} active={activeFilter === 'All'} onClick={() => setActiveFilter('All')} />
        <SummaryCard label="To Do" count={summary.todo} onClick={() => setActiveFilter('To Do')} active={activeFilter === 'To Do'} />
        <SummaryCard label="In Progress" count={summary.inProgress} onClick={() => setActiveFilter('In Progress')} active={activeFilter === 'In Progress'} />
        <SummaryCard label="Code Review" count={summary.codeReview} onClick={() => setActiveFilter('Code Review')} active={activeFilter === 'Code Review'} />
        <SummaryCard label="Testing" count={summary.testing} onClick={() => setActiveFilter('Testing')} active={activeFilter === 'Testing'} />
        <SummaryCard label="Completed" count={summary.completed} onClick={() => setActiveFilter('Completed')} active={activeFilter === 'Completed'} />
        <SummaryCard label="Overdue" count={summary.overdue} color="text-red-600" onClick={() => setActiveFilter('Overdue')} active={activeFilter === 'Overdue'} />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Tab filters */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                activeFilter === tab
                  ? 'bg-white text-[#1B4FAB] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB] transition-all"
          />
        </div>

        {/* Priority filter */}
        <div className="relative">
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-20 border-2 border-dashed border-slate-100 rounded-[24px] text-center">
            <CheckCircle2 size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">
              {activeFilter === 'All' ? 'No tasks assigned to you yet' : `No ${activeFilter.toLowerCase()} tasks`}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onOpen={() => onOpenTask(task)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DevMyTasksView;
