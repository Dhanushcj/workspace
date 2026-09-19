'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Filter, Edit2, UserPlus, Flag,
  Calendar, ChevronDown, Loader2, RefreshCw, MoreHorizontal,
  ArrowUpRight, Zap, Clock, CheckCircle2, Play, Code2,
  FlaskConical, AlertTriangle, Eye, Users, Layers
} from 'lucide-react';
import { Task, useWorkflowStore } from '../../store/workflowStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { CreateTaskModal } from './CreateTaskModal';

interface LeadTaskManagementViewProps {
  onOpenTask: (task: Task) => void;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  TO_DO:       { label: 'To Do',       cls: 'bg-slate-100 text-slate-600' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
  CODE_REVIEW: { label: 'Code Review', cls: 'bg-violet-100 text-violet-700' },
  TESTING:     { label: 'Testing',     cls: 'bg-amber-100 text-amber-700' },
  DONE:        { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700' },
  BLOCKED:     { label: 'Blocked',     cls: 'bg-red-100 text-red-700' },
};

const PRIORITY_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  CRITICAL: { label: 'Critical', cls: 'text-red-600',    dot: 'bg-red-500' },
  HIGH:     { label: 'High',     cls: 'text-orange-600', dot: 'bg-orange-500' },
  MEDIUM:   { label: 'Medium',   cls: 'text-amber-600',  dot: 'bg-amber-400' },
  LOW:      { label: 'Low',      cls: 'text-slate-500',  dot: 'bg-slate-300' },
};

export const LeadTaskManagementView = ({ onOpenTask }: LeadTaskManagementViewProps) => {
  const { allTasks, members, currentProject, fetchAllTasks, updateTask } = useWorkflowStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [developerFilter, setDeveloperFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reassigning, setReassigning] = useState<string | null>(null);

  const projectId = currentProject?.id || (currentProject as any)?._id;

  useEffect(() => {
    if (projectId) {
      fetchAllTasks({ projectId });
    }
  }, [projectId]);

  const refresh = async () => {
    setIsLoading(true);
    if (projectId) await fetchAllTasks({ projectId });
    setIsLoading(false);
  };

  const developers = useMemo(() =>
    members.filter((m: any) => {
      const role = (m.role || '').toUpperCase().replace(/ /g, '_');
      return role === 'DEVELOPER' || role === 'TESTER' || role === 'MEMBER';
    }),
    [members]
  );

  const filteredTasks = useMemo(() => {
    return allTasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
          !(t.displayId || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (developerFilter && t.assigneeId !== developerFilter) return false;
      return true;
    }).sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const ap = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const bp = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
      return ap - bp;
    });
  }, [allTasks, search, statusFilter, priorityFilter, developerFilter]);

  const stats = useMemo(() => ({
    total:      allTasks.length,
    todo:       allTasks.filter(t => t.status === 'TO_DO').length,
    inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
    codeReview: allTasks.filter(t => t.status === 'CODE_REVIEW').length,
    testing:    allTasks.filter(t => t.status === 'TESTING').length,
    done:       allTasks.filter(t => t.status === 'DONE').length,
  }), [allTasks]);

  const handleReassign = async (taskId: string, newAssigneeId: string) => {
    try {
      await updateTask(taskId, { assigneeId: newAssigneeId });
      addToast({ type: 'SUCCESS', title: 'Reassigned', message: 'Task reassigned successfully' });
      setReassigning(null);
      await refresh();
    } catch {
      addToast({ type: 'ERROR', title: 'Error', message: 'Failed to reassign task' });
    }
  };

  const handlePriorityChange = async (taskId: string, priority: string) => {
    try {
      await updateTask(taskId, { priority });
      addToast({ type: 'SUCCESS', title: 'Updated', message: 'Priority updated' });
      await refresh();
    } catch {
      addToast({ type: 'ERROR', title: 'Error', message: 'Failed to update priority' });
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (t: Task) => t.dueDate && t.status !== 'DONE' && new Date(t.dueDate) < new Date();

  return (
    <div className="p-8 w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Task Management</h1>
          <p className="text-[12px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            {currentProject?.name || 'All Projects'} · {filteredTasks.length} tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={16} className={`text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold text-white rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #1B4FAB 0%, #2563EB 100%)', boxShadow: '0 4px 16px rgba(27,79,171,0.3)' }}
          >
            <Plus size={16} /> Create Task
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Total',       val: stats.total,      cls: 'border-[#1B4FAB]/20 text-[#1B4FAB]' },
          { label: 'To Do',       val: stats.todo,       cls: 'border-slate-200 text-slate-600' },
          { label: 'In Progress', val: stats.inProgress, cls: 'border-blue-200 text-blue-600' },
          { label: 'Code Review', val: stats.codeReview, cls: 'border-violet-200 text-violet-600' },
          { label: 'Testing',     val: stats.testing,    cls: 'border-amber-200 text-amber-600' },
          { label: 'Completed',   val: stats.done,       cls: 'border-emerald-200 text-emerald-600' },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.cls} rounded-2xl p-4`}>
            <div className={`text-2xl font-black ${s.cls.includes('text-') ? s.cls.split(' ').find(c => c.startsWith('text-')) : 'text-slate-800'}`}>
              {s.val}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20"
          />
        </div>

        {[
          { value: statusFilter, onChange: setStatusFilter, placeholder: 'All Status', options: [
            { val: '', label: 'All Status' },
            { val: 'TO_DO', label: 'To Do' },
            { val: 'IN_PROGRESS', label: 'In Progress' },
            { val: 'CODE_REVIEW', label: 'Code Review' },
            { val: 'TESTING', label: 'Testing' },
            { val: 'DONE', label: 'Completed' },
          ]},
          { value: priorityFilter, onChange: setPriorityFilter, placeholder: 'All Priority', options: [
            { val: '', label: 'All Priority' },
            { val: 'CRITICAL', label: 'Critical' },
            { val: 'HIGH', label: 'High' },
            { val: 'MEDIUM', label: 'Medium' },
            { val: 'LOW', label: 'Low' },
          ]},
        ].map((f, i) => (
          <div key={i} className="relative">
            <select
              value={f.value}
              onChange={e => f.onChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 cursor-pointer"
            >
              {f.options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        ))}

        <div className="relative">
          <select
            value={developerFilter}
            onChange={e => setDeveloperFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 cursor-pointer"
          >
            <option value="">All Developers</option>
            {members.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Task Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Task', 'Developer', 'Priority', 'Status', 'Due Date', 'Progress', 'Actions'].map(col => (
                <th key={col} className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <Layers size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No tasks found</p>
                </td>
              </tr>
            )}
            {filteredTasks.map(task => {
              const status = STATUS_CONFIG[task.status] || { label: task.status, cls: 'bg-slate-100 text-slate-600' };
              const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
              const overdue = isOverdue(task);
              const prog = (task.subtasks || []).length > 0
                ? Math.round(((task.subtasks || []).filter(s => s.completed).length / (task.subtasks || []).length) * 100)
                : null;

              return (
                <tr key={task.id} className={`hover:bg-slate-50/50 transition-colors ${overdue ? 'bg-red-50/20' : ''}`}>
                  {/* Task */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono text-[#1B4FAB]/50">
                            {task.displayId || `#${String(task.id || '').slice(-4).toUpperCase()}`}
                          </span>
                          {overdue && <AlertTriangle size={11} className="text-red-500" />}
                        </div>
                        <p className="text-[13px] font-bold text-slate-800 hover:text-[#1B4FAB] cursor-pointer leading-tight"
                           onClick={() => onOpenTask(task)}>
                          {task.title}
                        </p>
                        {task.moduleName && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{task.moduleName}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Developer */}
                  <td className="px-5 py-4">
                    {reassigning === task.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={task.assigneeId || ''}
                          onChange={e => handleReassign(task.id, e.target.value)}
                          className="text-[12px] border border-[#1B4FAB]/30 rounded-lg px-2 py-1 focus:outline-none"
                          autoFocus
                        >
                          <option value="">Unassigned</option>
                          {members.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        <button onClick={() => setReassigning(null)} className="text-slate-400 text-[11px]">✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <div className="w-7 h-7 rounded-full bg-[#1B4FAB] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {task.assignee.name.charAt(0)}
                            </div>
                            <span className="text-[12px] font-semibold text-slate-700">{task.assignee.name}</span>
                          </>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 italic">Unassigned</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-4">
                    <div className="relative group">
                      <span className={`flex items-center gap-1.5 text-[11px] font-bold ${priority.cls}`}>
                        <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
                        {priority.label}
                      </span>
                      <div className="hidden group-hover:block absolute top-full left-0 z-10 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-32">
                        {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                          <button
                            key={key}
                            onClick={() => handlePriorityChange(task.id, key)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold hover:bg-slate-50 ${val.cls}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${val.dot}`} />
                            {val.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${status.cls}`}>
                      {status.label}
                    </span>
                  </td>

                  {/* Due Date */}
                  <td className="px-5 py-4">
                    <span className={`text-[12px] font-semibold ${overdue ? 'text-red-600' : 'text-slate-600'}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  </td>

                  {/* Progress */}
                  <td className="px-5 py-4">
                    {prog !== null ? (
                      <div className="w-24">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400">{prog}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1B4FAB] rounded-full"
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenTask(task)}
                        className="p-1.5 text-slate-400 hover:text-[#1B4FAB] hover:bg-[#1B4FAB]/10 rounded-lg transition-all"
                        title="Open task"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setReassigning(reassigning === task.id ? null : task.id)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                        title="Reassign"
                      >
                        <UserPlus size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Task Modal */}
      {isCreateOpen && currentProject && (
        <CreateTaskModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          projectId={projectId || ''}
          onTaskCreated={async () => {
            setIsCreateOpen(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
};

export default LeadTaskManagementView;
