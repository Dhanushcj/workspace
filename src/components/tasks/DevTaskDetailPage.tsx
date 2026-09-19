'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, ChevronLeft, Calendar, Clock, Flag, User, Layers,
  CheckSquare, Square, Play, Send, CheckCircle2, AlertTriangle,
  RotateCcw, Code2, FlaskConical, MessageSquare, History,
  Plus, Loader2, AlertCircle, Zap, GitBranch, BookOpen, Target
} from 'lucide-react';
import {
  Task, TaskSubtask, TaskRequirement, TaskAcceptanceCriterion,
  useWorkflowStore
} from '../../store/workflowStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

interface DevTaskDetailPageProps {
  task: Task;
  onClose: () => void;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { label: string; cls: string }> = {
    TO_DO:       { label: 'To Do',       cls: 'bg-slate-100 text-slate-600' },
    IN_PROGRESS: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
    CODE_REVIEW: { label: 'Code Review', cls: 'bg-violet-100 text-violet-700' },
    TESTING:     { label: 'Testing',     cls: 'bg-amber-100 text-amber-700' },
    DONE:        { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700' },
    BLOCKED:     { label: 'Blocked',     cls: 'bg-red-100 text-red-700' },
  };
  const c = cfg[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold ${c.cls}`}>
      {c.label}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const cfg: Record<string, { label: string; cls: string }> = {
    CRITICAL: { label: 'Critical', cls: 'text-red-600 bg-red-50 border-red-200' },
    HIGH:     { label: 'High',     cls: 'text-orange-600 bg-orange-50 border-orange-200' },
    MEDIUM:   { label: 'Medium',   cls: 'text-amber-600 bg-amber-50 border-amber-200' },
    LOW:      { label: 'Low',      cls: 'text-slate-500 bg-slate-50 border-slate-200' },
  };
  const c = cfg[priority] || cfg.MEDIUM;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${c.cls}`}>
      <Flag size={11} /> {c.label}
    </span>
  );
};

// ─── Checklist Item ───────────────────────────────────────────────────────────
const ChecklistItem = ({
  id, text, completed, onChange, disabled = false
}: { id: string; text: string; completed: boolean; onChange: (id: string, completed: boolean) => void; disabled?: boolean }) => (
  <label className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group ${disabled ? 'cursor-default' : ''}`}>
    <button
      onClick={() => !disabled && onChange(id, !completed)}
      className="shrink-0 mt-0.5"
    >
      {completed
        ? <CheckSquare size={18} className="text-[#1B4FAB]" />
        : <Square size={18} className="text-slate-300 group-hover:text-slate-400" />
      }
    </button>
    <span className={`text-[13px] leading-relaxed ${completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
      {text}
    </span>
  </label>
);

// ─── Activity Item ────────────────────────────────────────────────────────────
const ActivityItem = ({ action, userName, timestamp, meta }: {
  action: string; userName: string; timestamp: string; meta?: string;
}) => {
  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return ts; }
  };

  return (
    <div className="flex gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-7 h-7 rounded-full bg-[#1B4FAB]/10 text-[#1B4FAB] flex items-center justify-center shrink-0 mt-0.5">
        <History size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[13px] font-bold text-slate-700">{action}</span>
          <span className="text-[11px] text-slate-400">by {userName}</span>
        </div>
        {meta && <p className="text-[11px] text-slate-500 mt-0.5 italic">{meta}</p>}
        <p className="text-[11px] text-slate-400 mt-0.5">{formatTime(timestamp)}</p>
      </div>
    </div>
  );
};

// ─── Comment Item ─────────────────────────────────────────────────────────────
const CommentItem = ({ comment, onReply }: { comment: any; onReply?: (id: string, name: string) => void }) => {
  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return ts; }
  };

  const isSystemComment = comment.content?.startsWith('**');

  return (
    <div className={`flex gap-3 py-4 border-b border-slate-50 last:border-0 ${isSystemComment ? 'opacity-75' : ''}`}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B4FAB] to-blue-400 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
        {(comment.userName || 'U').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-bold text-slate-800">{comment.userName}</span>
          <span className="text-[11px] text-slate-400">{formatTime(comment.createdAt)}</span>
        </div>
        <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${isSystemComment ? 'text-violet-700 bg-violet-50 p-3 rounded-xl' : 'text-slate-600'}`}>
          {comment.content}
        </p>
        {!isSystemComment && onReply && (
          <button
            onClick={() => onReply(comment._id || comment.id, comment.userName)}
            className="text-[11px] font-bold text-slate-400 hover:text-[#1B4FAB] mt-1 transition-colors"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const DevTaskDetailPage = ({ task: initialTask, onClose }: DevTaskDetailPageProps) => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const {
    startTask, submitForReview, approveTask, requestChanges,
    passTest, failTest,
    updateSubtasks, updateRequirements, updateAcceptanceCriteria,
    fetchActivityLog, fetchComments, addComment,
    fetchTask
  } = useWorkflowStore();

  const [task, setTask] = useState<Task>(initialTask);
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'comments'>('details');
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const [showFailComment, setShowFailComment] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [failComment, setFailComment] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const taskId = task.id || (task as any)._id;

  const role = ((user?.role || 'DEVELOPER') as string).toUpperCase().replace(/ /g, '_');
  const isLead = ['TEAM_LEAD', 'LEAD', 'ADMIN', 'MANAGER', 'COMPANY_ADMIN'].includes(role);
  const isTester = role === 'TESTER';
  const isDeveloper = !isLead && !isTester;

  const formatDate = (d?: string) => {
    if (!d) return 'Not set';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date();

  // Reload task from server
  const reloadTask = useCallback(async () => {
    const fresh = await fetchTask(taskId);
    if (fresh) setTask(fresh);
  }, [taskId, fetchTask]);

  // Load activity + comments
  useEffect(() => {
    fetchActivityLog(taskId).then(setActivityLog);
    fetchComments(taskId).then(setComments);
  }, [taskId]);

  // Subtask helpers
  const handleSubtaskToggle = async (id: string, completed: boolean) => {
    const newSubtasks = (task.subtasks || []).map(s => s.id === id ? { ...s, completed } : s);
    setTask(prev => ({ ...prev, subtasks: newSubtasks }));
    await updateSubtasks(taskId, newSubtasks);
  };

  const handleRequirementToggle = async (id: string, completed: boolean) => {
    if (!isDeveloper) return;
    const updated = (task.requirements || []).map(r => r.id === id ? { ...r, completed } : r);
    setTask(prev => ({ ...prev, requirements: updated }));
    await updateRequirements(taskId, updated);
  };

  const handleCriterionToggle = async (id: string, completed: boolean) => {
    const updated = (task.acceptanceCriteria || []).map(c => c.id === id ? { ...c, completed } : c);
    setTask(prev => ({ ...prev, acceptanceCriteria: updated }));
    await updateAcceptanceCriteria(taskId, updated);
  };

  // Workflow actions
  const handleStartTask = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await startTask(taskId);
      addToast({ type: 'SUCCESS', title: 'Task Started', message: 'Status changed to In Progress' });
      await reloadTask();
      setActivityLog(await fetchActivityLog(taskId));
    } catch (err: any) {
      addToast({ type: 'ERROR', title: 'Error', message: err.response?.data?.error || 'Failed to start task' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (actionLoading) return;
    setSubmitError(null);

    // Validate incomplete subtasks
    const incompleteSubs = (task.subtasks || []).filter(s => !s.completed);
    const incompleteReqs = (task.requirements || []).filter(r => !r.completed);

    if (incompleteSubs.length > 0 || incompleteReqs.length > 0) {
      const items = [
        ...incompleteSubs.map(s => `• ${s.title}`),
        ...incompleteReqs.map(r => `• ${r.text}`)
      ];
      setSubmitError(`Cannot submit yet. Incomplete items:\n${items.join('\n')}`);
      return;
    }

    setActionLoading(true);
    try {
      await submitForReview(taskId);
      addToast({ type: 'SUCCESS', title: 'Submitted for Review', message: 'Your work has been submitted for code review' });
      await reloadTask();
      setActivityLog(await fetchActivityLog(taskId));
    } catch (err: any) {
      addToast({ type: 'ERROR', title: 'Error', message: err.response?.data?.error || 'Failed to submit' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await approveTask(taskId);
      addToast({ type: 'SUCCESS', title: 'Approved', message: 'Task moved to Testing' });
      await reloadTask();
      setActivityLog(await fetchActivityLog(taskId));
    } catch (err: any) {
      addToast({ type: 'ERROR', title: 'Error', message: err.response?.data?.error || 'Failed to approve' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!reviewComment.trim() || actionLoading) return;
    setActionLoading(true);
    try {
      await requestChanges(taskId, reviewComment);
      addToast({ type: 'INFO', title: 'Changes Requested', message: 'Developer has been notified' });
      setShowRequestChanges(false);
      setReviewComment('');
      await reloadTask();
      setActivityLog(await fetchActivityLog(taskId));
      setComments(await fetchComments(taskId));
    } catch (err: any) {
      addToast({ type: 'ERROR', title: 'Error', message: err.response?.data?.error || 'Failed to request changes' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePassTest = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await passTest(taskId);
      addToast({ type: 'SUCCESS', title: 'Test Passed! 🎉', message: 'Task is now Completed' });
      await reloadTask();
      setActivityLog(await fetchActivityLog(taskId));
    } catch (err: any) {
      addToast({ type: 'ERROR', title: 'Error', message: err.response?.data?.error || 'Failed to pass test' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFailTest = async () => {
    if (!failComment.trim() || actionLoading) return;
    setActionLoading(true);
    try {
      await failTest(taskId, failComment);
      addToast({ type: 'ERROR', title: 'Test Failed', message: 'Task returned to In Progress' });
      setShowFailComment(false);
      setFailComment('');
      await reloadTask();
      setActivityLog(await fetchActivityLog(taskId));
      setComments(await fetchComments(taskId));
    } catch (err: any) {
      addToast({ type: 'ERROR', title: 'Error', message: err.response?.data?.error || 'Failed to record failure' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const parentId = replyTo?.id;
      await addComment(taskId, newComment.trim(), parentId);
      setNewComment('');
      setReplyTo(null);
      setComments(await fetchComments(taskId));
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Error', message: 'Failed to add comment' });
    } finally {
      setCommentLoading(false);
    }
  };

  const subtaskProgress = task.subtasks?.length
    ? {
        completed: (task.subtasks || []).filter(s => s.completed).length,
        total: (task.subtasks || []).length,
        pct: Math.round(((task.subtasks || []).filter(s => s.completed).length / (task.subtasks || []).length) * 100)
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-stretch justify-end">
      <div
        className="w-full max-w-4xl bg-white flex flex-col shadow-2xl h-full overflow-hidden"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronLeft size={20} className="text-slate-500" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-mono font-bold text-[#1B4FAB]/60 bg-[#1B4FAB]/5 px-2 py-0.5 rounded-lg">
                  {task.displayId || `#${String(taskId || '').slice(-4).toUpperCase()}`}
                </span>
                <StatusBadge status={task.status} />
                {isOverdue && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    <AlertTriangle size={10} /> Overdue
                  </span>
                )}
              </div>
              <h1 className="text-[17px] font-black text-slate-900 leading-tight">{task.title}</h1>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-100 shrink-0 px-8">
          {(['details', 'activity', 'comments'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[12px] font-bold capitalize border-b-2 transition-all -mb-px ${
                activeTab === tab
                  ? 'border-[#1B4FAB] text-[#1B4FAB]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'comments' ? `Comments (${comments.length})` : tab === 'activity' ? `Activity (${activityLog.length})` : 'Details'}
            </button>
          ))}
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="flex gap-0 h-full">
              {/* Main content */}
              <div className="flex-1 p-8 space-y-8 overflow-y-auto">

                {/* Review comment banner */}
                {task.reviewComment && task.status === 'IN_PROGRESS' && (
                  <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Code2 size={14} className="text-violet-600" />
                      <span className="text-[12px] font-bold text-violet-700 uppercase tracking-wide">Changes Requested by Team Lead</span>
                    </div>
                    <p className="text-[13px] text-violet-700 leading-relaxed">{task.reviewComment}</p>
                  </div>
                )}

                {/* Test fail banner */}
                {task.testComment && task.status === 'IN_PROGRESS' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <FlaskConical size={14} className="text-red-600" />
                      <span className="text-[12px] font-bold text-red-700 uppercase tracking-wide">Testing Failed</span>
                    </div>
                    <p className="text-[13px] text-red-700 leading-relaxed">{task.testComment}</p>
                  </div>
                )}

                {/* CODE_REVIEW waiting banner */}
                {task.status === 'CODE_REVIEW' && isDeveloper && (
                  <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Code2 size={14} className="text-violet-600" />
                      <span className="text-[13px] font-bold text-violet-700">Your work is submitted for Code Review. Waiting for Team Lead approval...</span>
                    </div>
                  </div>
                )}

                {/* TESTING waiting banner */}
                {task.status === 'TESTING' && isDeveloper && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <FlaskConical size={14} className="text-amber-600" />
                      <span className="text-[13px] font-bold text-amber-700">Task is under testing. Waiting for QA approval...</span>
                    </div>
                  </div>
                )}

                {/* Description */}
                {task.description && (
                  <section>
                    <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h2>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                    </div>
                  </section>
                )}

                {/* Requirements */}
                {(task.requirements || []).length > 0 && (
                  <section>
                    <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <BookOpen size={13} /> Requirements
                    </h2>
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                      {(task.requirements || []).map(req => (
                        <ChecklistItem
                          key={req.id}
                          id={req.id}
                          text={req.text}
                          completed={req.completed}
                          onChange={handleRequirementToggle}
                          disabled={!isDeveloper || task.status === 'DONE'}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Acceptance Criteria */}
                {(task.acceptanceCriteria || []).length > 0 && (
                  <section>
                    <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Target size={13} /> Acceptance Criteria
                    </h2>
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                      {(task.acceptanceCriteria || []).map(c => (
                        <ChecklistItem
                          key={c.id}
                          id={c.id}
                          text={c.text}
                          completed={c.completed}
                          onChange={handleCriterionToggle}
                          disabled={task.status === 'DONE'}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Subtasks */}
                {(task.subtasks || []).length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <CheckSquare size={13} /> Subtasks
                      </h2>
                      {subtaskProgress && (
                        <span className="text-[11px] font-bold text-[#1B4FAB]">
                          {subtaskProgress.completed}/{subtaskProgress.total} · {subtaskProgress.pct}%
                        </span>
                      )}
                    </div>
                    {subtaskProgress && (
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-gradient-to-r from-[#1B4FAB] to-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${subtaskProgress.pct}%` }}
                        />
                      </div>
                    )}
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                      {(task.subtasks || []).map(sub => (
                        <ChecklistItem
                          key={sub.id}
                          id={sub.id}
                          text={sub.title}
                          completed={sub.completed}
                          onChange={handleSubtaskToggle}
                          disabled={task.status === 'DONE'}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Submit Error */}
                {submitError && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-bold text-amber-700 mb-1">Cannot submit yet</p>
                        <pre className="text-[11px] text-amber-600 whitespace-pre-wrap font-sans">{submitError}</pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Workflow Actions ─── */}
                <section className="pb-8">
                  <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">Workflow Actions</h2>
                  
                  {/* DEVELOPER actions */}
                  {isDeveloper && (
                    <div className="space-y-3">
                      {task.status === 'TO_DO' && (
                        <button
                          onClick={handleStartTask}
                          disabled={actionLoading}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-bold text-white transition-all disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg, #1B4FAB 0%, #2563EB 100%)', boxShadow: '0 4px 20px rgba(27,79,171,0.3)' }}
                        >
                          {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                          Start Task
                        </button>
                      )}

                      {task.status === 'IN_PROGRESS' && (
                        <button
                          onClick={handleSubmitReview}
                          disabled={actionLoading}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-bold text-white transition-all disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}
                        >
                          {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Code2 size={18} />}
                          Submit for Code Review
                        </button>
                      )}

                      {task.status === 'CODE_REVIEW' && (
                        <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl text-center">
                          <Code2 size={24} className="mx-auto text-violet-500 mb-2" />
                          <p className="text-[13px] font-bold text-violet-700">Under Code Review</p>
                          <p className="text-[11px] text-violet-500 mt-1">Waiting for Team Lead to review your code</p>
                        </div>
                      )}

                      {task.status === 'TESTING' && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                          <FlaskConical size={24} className="mx-auto text-amber-500 mb-2" />
                          <p className="text-[13px] font-bold text-amber-700">Under Testing</p>
                          <p className="text-[11px] text-amber-500 mt-1">Waiting for QA to test your work</p>
                        </div>
                      )}

                      {task.status === 'DONE' && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                          <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                          <p className="text-[13px] font-bold text-emerald-700">Task Completed! 🎉</p>
                          <p className="text-[11px] text-emerald-500 mt-1">Great work! This task is done.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TEAM LEAD actions */}
                  {isLead && task.status === 'CODE_REVIEW' && (
                    <div className="space-y-3">
                      <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                        <p className="text-[12px] font-bold text-violet-700 mb-1 flex items-center gap-2">
                          <Code2 size={13} /> Waiting for Your Review
                        </p>
                        <p className="text-[11px] text-violet-600">
                          Submitted by {task.assignee?.name || 'Developer'}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleApprove}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-60"
                        >
                          {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          Approve
                        </button>
                        <button
                          onClick={() => setShowRequestChanges(!showRequestChanges)}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 transition-all disabled:opacity-60"
                        >
                          <RotateCcw size={16} />
                          Request Changes
                        </button>
                      </div>
                      {showRequestChanges && (
                        <div className="space-y-2">
                          <textarea
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            placeholder="Describe what needs to be changed..."
                            rows={3}
                            className="w-full p-3 border border-violet-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                          />
                          <button
                            onClick={handleRequestChanges}
                            disabled={!reviewComment.trim() || actionLoading}
                            className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          >
                            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            Send Feedback
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TESTER actions */}
                  {(isTester || isLead) && task.status === 'TESTING' && (
                    <div className="space-y-3">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <p className="text-[12px] font-bold text-amber-700 flex items-center gap-2">
                          <FlaskConical size={13} /> Ready for Testing
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handlePassTest}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-60"
                        >
                          {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          Pass
                        </button>
                        <button
                          onClick={() => setShowFailComment(!showFailComment)}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold text-red-700 bg-red-100 hover:bg-red-200 transition-all disabled:opacity-60"
                        >
                          <AlertTriangle size={16} />
                          Fail
                        </button>
                      </div>
                      {showFailComment && (
                        <div className="space-y-2">
                          <textarea
                            value={failComment}
                            onChange={e => setFailComment(e.target.value)}
                            placeholder="Describe what failed and what needs to be fixed..."
                            rows={3}
                            className="w-full p-3 border border-red-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                          />
                          <button
                            onClick={handleFailTest}
                            disabled={!failComment.trim() || actionLoading}
                            className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          >
                            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            Submit Failure
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* Sidebar metadata */}
              <div className="w-72 border-l border-slate-100 p-6 space-y-6 shrink-0 overflow-y-auto bg-slate-50/50">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task Info</h3>

                  <MetaRow icon={<Flag size={13} />} label="Priority">
                    <PriorityBadge priority={task.priority} />
                  </MetaRow>

                  {task.assignee && (
                    <MetaRow icon={<User size={13} />} label="Assigned To">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1B4FAB] text-white text-[10px] font-bold flex items-center justify-center">
                          {task.assignee.name.charAt(0)}
                        </div>
                        <span className="text-[12px] font-semibold text-slate-700">{task.assignee.name}</span>
                      </div>
                    </MetaRow>
                  )}

                  {task.tester && (
                    <MetaRow icon={<FlaskConical size={13} />} label="Tester">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {task.tester.name.charAt(0)}
                        </div>
                        <span className="text-[12px] font-semibold text-slate-700">{task.tester.name}</span>
                      </div>
                    </MetaRow>
                  )}

                  {task.dueDate && (
                    <MetaRow icon={<Calendar size={13} />} label="Due Date">
                      <span className={`text-[12px] font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                        {formatDate(task.dueDate)}
                        {isOverdue && ' ⚠️'}
                      </span>
                    </MetaRow>
                  )}

                  {task.estimatedHours && (
                    <MetaRow icon={<Clock size={13} />} label="Estimated">
                      <span className="text-[12px] font-semibold text-slate-700">{task.estimatedHours}h</span>
                    </MetaRow>
                  )}

                  {task.storyPoints && (
                    <MetaRow icon={<Zap size={13} />} label="Story Points">
                      <span className="text-[12px] font-semibold text-slate-700">{task.storyPoints} pts</span>
                    </MetaRow>
                  )}

                  {task.moduleName && (
                    <MetaRow icon={<Layers size={13} />} label="Module">
                      <span className="text-[12px] font-semibold text-slate-700">{task.moduleName}</span>
                    </MetaRow>
                  )}

                  {task.featureName && (
                    <MetaRow icon={<GitBranch size={13} />} label="Feature">
                      <span className="text-[12px] font-semibold text-slate-700">{task.featureName}</span>
                    </MetaRow>
                  )}
                </div>

                {/* Dependencies */}
                {(task.dependencies || []).length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Blocked By</h3>
                    <div className="space-y-2">
                      {(task.dependencies || []).map(dep => (
                        <div key={dep} className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-xl">
                          <AlertTriangle size={12} className="text-amber-500" />
                          <span className="text-[11px] font-mono text-amber-700">{dep}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="p-8">
              <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">Activity Timeline</h2>
              {activityLog.length === 0 ? (
                <div className="py-16 text-center">
                  <History size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No activity yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {[...activityLog].reverse().map((log, i) => (
                    <ActivityItem key={i} action={log.action} userName={log.userName} timestamp={log.timestamp} meta={log.meta} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMMENTS TAB */}
          {activeTab === 'comments' && (
            <div className="p-8 flex flex-col gap-6">
              <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Comments</h2>

              {/* Comment list */}
              <div className="space-y-0 bg-white border border-slate-100 rounded-2xl overflow-hidden">
                {comments.length === 0 && (
                  <div className="py-12 text-center">
                    <MessageSquare size={36} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-[11px] font-bold text-slate-300">No comments yet. Start the conversation!</p>
                  </div>
                )}
                {comments.map(c => (
                  <CommentItem
                    key={c._id || c.id}
                    comment={c}
                    onReply={(id, name) => setReplyTo({ id, name })}
                  />
                ))}
              </div>

              {/* Reply to indicator */}
              {replyTo && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#1B4FAB]/5 rounded-xl">
                  <span className="text-[11px] font-bold text-[#1B4FAB]">Replying to {replyTo.name}</span>
                  <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Add comment */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B4FAB] to-blue-400 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment... Use @name to mention someone"
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB] resize-none transition-all"
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment(); }}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || commentLoading}
                      className="px-5 py-2 rounded-xl text-[12px] font-bold text-white bg-[#1B4FAB] hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {commentLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component
const MetaRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      {icon} {label}
    </div>
    <div className="pl-5">{children}</div>
  </div>
);

export default DevTaskDetailPage;
