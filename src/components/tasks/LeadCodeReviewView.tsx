'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Code2, User, Clock, CheckCircle2, RotateCcw,
  Loader2, Send, RefreshCw, Eye, AlertTriangle
} from 'lucide-react';
import { Task, useWorkflowStore } from '../../store/workflowStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

interface LeadCodeReviewViewProps {
  onOpenTask: (task: Task) => void;
}

const ReviewCard = ({
  task,
  onApprove,
  onRequestChanges,
  onOpen,
  loading,
}: {
  task: Task;
  onApprove: (id: string) => Promise<void>;
  onRequestChanges: (id: string, comment: string) => Promise<void>;
  onOpen: () => void;
  loading: boolean;
}) => {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    await onApprove(task.id);
    setSubmitting(false);
  };

  const handleRequestChanges = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    await onRequestChanges(task.id, comment);
    setSubmitting(false);
    setShowComment(false);
    setComment('');
  };

  const subtasksDone = (task.subtasks || []).filter(s => s.completed).length;
  const subtasksTotal = (task.subtasks || []).length;
  const requirementsDone = (task.requirements || []).filter(r => r.completed).length;
  const requirementsTotal = (task.requirements || []).length;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-all">
      {/* Header */}
      <div className="p-6 border-b border-slate-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-lg">
                {task.displayId || `#${String(task.id || '').slice(-4).toUpperCase()}`}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                <Code2 size={10} /> Code Review
              </span>
            </div>
            <h3
              className="text-[15px] font-bold text-slate-800 hover:text-[#1B4FAB] cursor-pointer leading-tight mb-2"
              onClick={onOpen}
            >
              {task.title}
            </h3>
            {task.moduleName && (
              <p className="text-[11px] text-slate-400 mb-2">{task.moduleName}{task.featureName ? ` › ${task.featureName}` : ''}</p>
            )}

            {/* Developer info */}
            <div className="flex items-center gap-3 flex-wrap">
              {task.assignee && (
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#1B4FAB] text-white text-[10px] font-bold flex items-center justify-center">
                    {task.assignee.name.charAt(0)}
                  </div>
                  <span className="text-[12px] font-semibold text-slate-600">{task.assignee.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock size={11} />
                <span>Submitted {formatTime(task.updatedAt)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpen}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#1B4FAB]/5 text-[#1B4FAB] text-[11px] font-bold rounded-xl hover:bg-[#1B4FAB]/10 transition-all"
          >
            <Eye size={13} /> Review
          </button>
        </div>
      </div>

      {/* Progress indicators */}
      {(subtasksTotal > 0 || requirementsTotal > 0) && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-6">
          {subtasksTotal > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Subtasks</span>
              <span className="text-[12px] font-bold text-slate-700">{subtasksDone}/{subtasksTotal}</span>
              <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#1B4FAB] rounded-full" style={{ width: `${(subtasksDone/subtasksTotal)*100}%` }} />
              </div>
            </div>
          )}
          {requirementsTotal > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Requirements</span>
              <span className="text-[12px] font-bold text-slate-700">{requirementsDone}/{requirementsTotal}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-6">
        {!showComment ? (
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={submitting || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-60"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Approve
            </button>
            <button
              onClick={() => setShowComment(true)}
              disabled={submitting || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 transition-all disabled:opacity-60"
            >
              <RotateCcw size={15} />
              Request Changes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Describe what changes are needed..."
              rows={3}
              autoFocus
              className="w-full p-3 border border-violet-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleRequestChanges}
                disabled={!comment.trim() || submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-all"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send Feedback
              </button>
              <button
                onClick={() => { setShowComment(false); setComment(''); }}
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

export const LeadCodeReviewView = ({ onOpenTask }: LeadCodeReviewViewProps) => {
  const { allTasks, currentProject, fetchAllTasks, approveTask, requestChanges } = useWorkflowStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);

  const projectId = currentProject?.id || (currentProject as any)?._id;

  useEffect(() => {
    if (projectId) fetchAllTasks({ projectId });
  }, [projectId]);

  const codeReviewTasks = useMemo(() =>
    allTasks.filter(t => t.status === 'CODE_REVIEW')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [allTasks]
  );

  const refresh = async () => {
    setLoading(true);
    if (projectId) await fetchAllTasks({ projectId });
    setLoading(false);
  };

  const handleApprove = async (taskId: string) => {
    try {
      await approveTask(taskId);
      addToast({ type: 'SUCCESS', title: 'Approved', message: 'Task moved to Testing' });
    } catch (err: any) {
      addToast({ type: 'ERROR', title: 'Error', message: err.response?.data?.error || 'Failed to approve' });
    }
  };

  const handleRequestChanges = async (taskId: string, comment: string) => {
    try {
      await requestChanges(taskId, comment);
      addToast({ type: 'INFO', title: 'Changes Requested', message: 'Developer has been notified' });
    } catch (err: any) {
      addToast({ type: 'ERROR', title: 'Error', message: err.response?.data?.error || 'Failed to request changes' });
    }
  };

  return (
    <div className="p-8 w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Code Review</h1>
          <p className="text-[12px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            {codeReviewTasks.length} task{codeReviewTasks.length !== 1 ? 's' : ''} waiting for review
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

      {/* Badge */}
      {codeReviewTasks.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-2xl">
          <Code2 size={14} className="text-violet-600" />
          <span className="text-[12px] font-bold text-violet-700">
            You have {codeReviewTasks.length} task{codeReviewTasks.length !== 1 ? 's' : ''} waiting for your review
          </span>
        </div>
      )}

      {/* Review Cards */}
      {codeReviewTasks.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-slate-100 rounded-[24px] text-center">
          <CheckCircle2 size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-[13px] font-bold text-slate-300">All tasks reviewed!</p>
          <p className="text-[11px] text-slate-300 mt-1">No pending code reviews at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {codeReviewTasks.map(task => (
            <ReviewCard
              key={task.id}
              task={task}
              onApprove={handleApprove}
              onRequestChanges={handleRequestChanges}
              onOpen={() => onOpenTask(task)}
              loading={loading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadCodeReviewView;
