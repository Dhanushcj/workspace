'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, CircleCheck, XCircle, GitBranch, Code2, Clock, ExternalLink, Loader } from 'lucide-react';
import api from '../../lib/api';
import { PullRequest } from './PRListTable';

interface Props {
  pr: PullRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (decision: 'approve' | 'reject', feedback: string, testerId?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

function getTimeAgo(date: string): string {
  if (!date) return 'unknown';
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(n => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function stringToColor(str: string): string {
  const palette = [
    '#534AB7', '#10B981', '#F59E0B', '#EF4444',
    '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export const ReviewModal: React.FC<Props> = ({
  pr,
  isOpen,
  onClose,
  onSubmit,
  loading,
  error
}) => {
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);
  const [testers, setTesters] = useState<any[]>([]);
  const [testerId, setTesterId] = useState<string>('');
  const [testersLoading, setTestersLoading] = useState(false);

  // Reset state when opening a new PR
  useEffect(() => {
    if (isOpen) {
      setDecision('approve');
      setFeedback('');
      setCopied(false);
      setTesterId('');
      
      // Fetch testers
      const fetchTesters = async () => {
        setTestersLoading(true);
        try {
          // Use centralized api to hit backend directly
          const res = await api.get('/users?role=TESTER');
          const data = res.data;
          setTesters(Array.isArray(data) ? data : []);
          if (data.length > 0) setTesterId(data[0].id);
        } catch (err) {
          console.error('Failed to fetch testers', err);
        } finally {
          setTestersLoading(false);
        }
      };
      fetchTesters();
    }
  }, [isOpen, pr?.id]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  const handleCopy = useCallback(() => {
    if (pr?.commitHash) {
      navigator.clipboard.writeText(pr.commitHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [pr?.commitHash]);

  const handleSubmit = () => {
    onSubmit(decision, feedback, !isReject ? testerId : undefined);
  };

  if (!isOpen || !pr) return null;

  const devName = pr.submittedBy?.name || 'Unknown';
  const initials = getInitials(devName);
  const color = pr.submittedBy?.color || stringToColor(devName);
  const taskTitle = pr.task?.title || 'Untitled Task';
  
  const isReject = decision === 'reject';
  const isSubmitDisabled = loading || (isReject && feedback.trim().length < 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && onClose()}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-[480px] bg-white rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <h2 id="modal-title" className="text-[18px] font-bold text-[#0f172a] truncate pr-4">
            {taskTitle} — Review
          </h2>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex flex-col gap-8 bg-[#F8FAFC]">
          
          {/* Section 1: PR Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            {/* Developer */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Developer</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-[9px] shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>
                <span className="text-[13px] font-semibold text-[#0f172a]">{devName}</span>
              </div>
            </div>

            {/* Task */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Task</span>
              {pr.task?.id ? (
                <a 
                  href={`/dashboard/lead?task=${pr.task.id}`}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[#534AB7] hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {taskTitle} <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-[13px] font-medium text-slate-700">{taskTitle}</span>
              )}
            </div>

            {/* Branch */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Branch</span>
              <div className="flex items-center gap-1.5 text-[13px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                <GitBranch size={12} className="text-slate-400" />
                <span className="font-mono">{pr.branchName}</span>
              </div>
            </div>

            {/* Commit */}
            {pr.commitHash && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Commit</span>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[13px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 hover:bg-slate-100 transition-colors group"
                  title="Copy commit hash"
                >
                  <Code2 size={12} className="text-slate-400" />
                  <span className="font-mono">{pr.commitHash.slice(0, 8)}</span>
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-300 group-hover:text-slate-500" />}
                </button>
              </div>
            )}

            {/* Submitted */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Submitted</span>
              <div className="flex items-center gap-1.5 text-[13px] text-slate-700">
                <Clock size={12} className="text-slate-400" />
                <span>{getTimeAgo(pr.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Decision */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold text-slate-900">Review Decision</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Approve Option */}
              <label 
                className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  !isReject 
                    ? 'border-[#10B981] bg-emerald-50/50 shadow-sm' 
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="radio" 
                  name="decision" 
                  value="approve"
                  checked={!isReject}
                  onChange={() => setDecision('approve')}
                  className="sr-only"
                />
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[14px] font-bold ${!isReject ? 'text-[#10B981]' : 'text-slate-700'}`}>
                    Approve
                  </span>
                  <CircleCheck size={18} className={!isReject ? 'text-[#10B981]' : 'text-slate-300'} />
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Feature is ready for QA</span>
              </label>

              {/* Reject Option */}
              <label 
                className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isReject 
                    ? 'border-[#EF4444] bg-red-50/50 shadow-sm' 
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="radio" 
                  name="decision" 
                  value="reject"
                  checked={isReject}
                  onChange={() => setDecision('reject')}
                  className="sr-only"
                />
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[14px] font-bold ${isReject ? 'text-[#EF4444]' : 'text-slate-700'}`}>
                    Reject
                  </span>
                  <XCircle size={18} className={isReject ? 'text-[#EF4444]' : 'text-slate-300'} />
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Needs revision</span>
              </label>
            </div>
          </div>

          {/* Section 2.5: Tester Assignment (Only for approval) */}
          {!isReject && (
            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                 Assign Tester <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">Protocol Beta</span>
              </h3>
              <div className="relative group">
                <select
                  value={testerId}
                  onChange={(e) => setTesterId(e.target.value)}
                  disabled={testersLoading || loading}
                  className="w-full appearance-none p-4 rounded-xl border-2 border-slate-100 bg-white text-[13px] font-bold text-[#0f172a] focus:outline-none focus:border-[#534AB7] focus:ring-4 focus:ring-[#534AB7]/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  {testers.length === 0 ? (
                    <option value="">No testers available</option>
                  ) : (
                    testers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <Clock size={16} />
                </div>
              </div>
              <p className="text-[10px] font-medium text-slate-400 italic">
                * This tester will be notified to start validation immediately upon approval.
              </p>
            </div>
          )}

          {/* Section 3: Feedback */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="feedback" className={`text-[13px] font-bold ${isReject ? 'text-[#EF4444]' : 'text-slate-900'}`}>
                {isReject ? 'Feedback*' : 'Feedback (optional)'}
              </label>
              <span className={`text-[11px] font-medium ${feedback.length > 500 ? 'text-red-500' : 'text-slate-400'}`}>
                {feedback.length} / 500
              </span>
            </div>
            <textarea
              id="feedback"
              rows={5}
              maxLength={500}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add your feedback, code suggestions, or approval notes..."
              className={`w-full p-4 rounded-xl border-2 bg-white text-[13px] placeholder:text-slate-400 focus:outline-none transition-all resize-none ${
                isReject 
                  ? 'border-red-200 focus:border-[#EF4444] focus:ring-4 focus:ring-red-500/10' 
                  : 'border-slate-200 focus:border-[#534AB7] focus:ring-4 focus:ring-[#534AB7]/10'
              }`}
            />
            {isReject && feedback.trim().length > 0 && feedback.trim().length < 10 && (
              <p className="text-[11px] font-medium text-[#EF4444] mt-1">
                Please provide at least 10 characters of feedback for rejection.
              </p>
            )}
          </div>

          {/* Section 4: Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-[12px] font-semibold text-[#EF4444] flex items-center gap-2">
                <XCircle size={14} />
                {error || "Failed to submit review. Try again."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full text-[13px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-bold text-white transition-all shadow-sm ${
              isSubmitDisabled 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-[#534AB7] hover:bg-[#3C3489] shadow-[#534AB7]/20 active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;

