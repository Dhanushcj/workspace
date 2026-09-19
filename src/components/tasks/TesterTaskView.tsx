'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical, CheckCircle2, AlertTriangle, Send, Loader2,
  RefreshCw, Eye, User, Calendar, BookOpen, Target, MessageSquare
} from 'lucide-react';
import { Task, useWorkflowStore } from '../../store/workflowStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

interface TesterTaskViewProps {
  onOpenTask: (task: Task) => void;
}

const TestCard = ({
  task,
  onPass,
  onFail,
  onOpen,
}: {
  task: Task;
  onPass: (id: string) => Promise<void>;
  onFail: (id: string, comment: string) => Promise<void>;
  onOpen: () => void;
}) => {
  const [showFail, setShowFail] = useState(false);
  const [failComment, setFailComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

  const handlePass = async () => {
    setSubmitting(true);
    await onPass(task.id);
    setSubmitting(false);
  };

  const handleFail = async () => {
    if (!failComment.trim()) return;
    setSubmitting(true);
    await onFail(task.id, failComment);
    setSubmitting(false);
    setShowFail(false);
    setFailComment('');
  };

  const criteriaDone = (task.acceptanceCriteria || []).filter(c => c.completed).length;
  const criteriaTotal = (task.acceptanceCriteria || []).length;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-all">
      {/* Header */}
      <div className="p-6 border-b border-slate-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg">
                {task.displayId || `#${String(task.id || '').slice(-4).toUpperCase()}`}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <FlaskConical size={10} /> Testing
              </span>
            </div>
            <h3
              className="text-[15px] font-bold text-slate-800 hover:text-[#1B4FAB] cursor-pointer leading-tight mb-2"
              onClick={onOpen}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{task.description}</p>
            )}

            <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-400">
              {task.assignee && (
                <span className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#1B4FAB] text-white text-[9px] font-bold flex items-center justify-center">
                    {task.assignee.name.charAt(0)}
                  </div>
                  Dev: {task.assignee.name}
                </span>
              )}
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> Due {formatDate(task.dueDate)}
                </span>
              )}
              {task.moduleName && (
                <span className="text-slate-400">{task.moduleName}</span>
              )}
            </div>
          </div>

          <button
            onClick={onOpen}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-xl hover:bg-amber-100 transition-all"
          >
            <Eye size={13} /> View Details
          </button>
        </div>
      </div>

      {/* Requirements & Acceptance Criteria summary */}
      {(task.requirements && task.requirements.length > 0) || (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) ? (
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 space-y-3">
          {task.requirements && task.requirements.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <BookOpen size={11} /> Requirements ({task.requirements.filter(r => r.completed).length}/{task.requirements.length} done)
              </p>
              <div className="space-y-1">
                {task.requirements.slice(0, 5).map(req => (
                  <div key={req.id} className="flex items-start gap-2">
                    {req.completed
                      ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                    }
                    <span className={`text-[11px] leading-relaxed ${req.completed ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                      {req.text}
                    </span>
                  </div>
                ))}
                {task.requirements.length > 5 && (
                  <p className="text-[10px] text-slate-400 pl-5">+{task.requirements.length - 5} more</p>
                )}
              </div>
            </div>
          )}

          {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Target size={11} /> Acceptance Criteria ({criteriaDone}/{criteriaTotal} met)
              </p>
              <div className="space-y-1">
                {task.acceptanceCriteria.slice(0, 4).map(c => (
                  <div key={c.id} className="flex items-start gap-2">
                    {c.completed
                      ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                    }
                    <span className={`text-[11px] leading-relaxed ${c.completed ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                      {c.text}
                    </span>
                  </div>
                ))}
                {task.acceptanceCriteria.length > 4 && (
                  <p className="text-[10px] text-slate-400 pl-5">+{task.acceptanceCriteria.length - 4} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Test Actions */}
      <div className="p-6">
        {!showFail ? (
          <div className="flex gap-3">
            <button
              onClick={handlePass}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Pass
            </button>
            <button
              onClick={() => setShowFail(true)}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold text-red-700 bg-red-100 hover:bg-red-200 transition-all disabled:opacity-60"
            >
              <AlertTriangle size={16} />
              Fail
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Describe the failure:
            </label>
            <textarea
              value={failComment}
              onChange={e => setFailComment(e.target.value)}
              placeholder="e.g. Email validation does not work when an invalid email is entered..."
              rows={3}
              autoFocus
              className="w-full p-3 border border-red-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleFail}
                disabled={!failComment.trim() || submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit Failure
              </button>
              <button
                onClick={() => { setShowFail(false); setFailComment(''); }}
                className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TesterTaskView = ({ onOpenTask }: TesterTaskViewProps) => {
  const { tasks, allTasks, currentProject, fetchAllTasks, fetchTasks, passTest, failTest } = useWorkflowStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);

  const role = ((user?.role || 'TESTER') as string).toUpperCase();
  const isLead = ['TEAM_LEAD', 'LEAD', 'ADMIN', 'MANAGER'].includes(role);

  const projectId = currentProject?.id || (currentProject as any)?._id;

  useEffect(() => {
    if (projectId) {
      if (isLead) {
        fetchAllTasks({ projectId });
      } else {
        fetchTasks({ projectId });
      }
    }
  }, [projectId]);

  const refresh = async () => {
    setLoading(true);
    if (projectId) {
      if (isLead) await fetchAllTasks({ projectId });
      else await fetchTasks({ projectId });
    }
    setLoading(false);
  };

  const sourceTasks = isLead ? allTasks : tasks;
  const testingTasks = useMemo(() =>
    sourceTasks.filter(t => t.status === 'TESTING')
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (a.dueDate) return -1;
        return 1;
      }),
    [sourceTasks]
  );

  const handlePass = async (taskId: string) => {
    try {
      await passTest(taskId);
      addToast({ type: 'SUCCESS', title: 'Test Passed! 🎉', message: 'Task is now Completed' });
    } catch (err: any) {
      addToast({ type: 'ERROR', title: 'Error', message: err.response?.data?.error || 'Failed to pass test' });
    }
  };

  const handleFail = async (taskId: string, comment: string) => {
    try {
      await failTest(taskId, comment);
      addToast({ type: 'ERROR', title: 'Test Failed', message: 'Task returned to In Progress with your feedback' });
    } catch (err: any) {
      addToast({ type: 'ERROR', title: 'Error', message: err.response?.data?.error || 'Failed to record failure' });
    }
  };

  return (
    <div className="p-8 w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Test Queue</h1>
          <p className="text-[12px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            {testingTasks.length} task{testingTasks.length !== 1 ? 's' : ''} ready for testing
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-50 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {testingTasks.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <FlaskConical size={14} className="text-amber-600" />
          <span className="text-[12px] font-bold text-amber-700">
            {testingTasks.length} task{testingTasks.length !== 1 ? 's' : ''} waiting for your QA review
          </span>
        </div>
      )}

      {testingTasks.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-slate-100 rounded-[24px] text-center">
          <FlaskConical size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-[13px] font-bold text-slate-300">No tasks in testing</p>
          <p className="text-[11px] text-slate-300 mt-1">Tasks approved by Team Lead will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testingTasks.map(task => (
            <TestCard
              key={task.id}
              task={task}
              onPass={handlePass}
              onFail={handleFail}
              onOpen={() => onOpenTask(task)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TesterTaskView;
