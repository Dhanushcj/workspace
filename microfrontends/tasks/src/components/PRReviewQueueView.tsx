

import React, { useEffect, useState } from 'react';
import { 
  GitPullRequest, 
  Clock, 
  GitMerge, 
  CheckCircle2, 
  MessageSquare, 
  Code2, 
  FileText, 
  MoreVertical,
  Loader2,
  ChevronDown,
  GitBranch,
  Check,
  X,
  FileCode
} from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { useToastStore } from '../store/toastStore';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

const getStatusLabel = (s: string) => {
  if (s === 'OPEN') return 'Pending';
  if (s === 'APPROVED') return 'Approved';
  if (s === 'CHANGES_REQUESTED') return 'Changes Requested';
  if (s === 'MERGED') return 'Merged';
  return s;
};

interface PR {
  id: string;
  title: string;
  branchName: string;
  targetBranch: string;
  authorId?: string;
  author?: { name: string };
  createdAt: string | Date;
  filesChanged: number;
  additions: number;
  deletions: number;
  status: string;
}

export const PRReviewQueueView = () => {
  const { currentProject } = useWorkflowStore();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  
  const isLead = user?.role === 'TEAM_LEAD' || user?.role === 'MANAGER';
  
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPRs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pull-requests?status=OPEN');
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setPrs(data);
    } catch (err) {
      console.error('[PR-QUEUE] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPRs();
  }, []);

  const stats = [
    { label: 'Awaiting review', value: prs.length.toString(), color: 'text-red-500' },
    { label: 'Avg review time', value: '2.4h', color: 'text-emerald-500' },
    { label: 'Merged', value: '7', color: 'text-slate-900' },
    { label: 'Approval rate', value: '78%', color: 'text-amber-500' },
  ];

  const handleAction = (action: string, prId: string) => {
    addToast({ 
      title: 'Success', 
      message: `${action} applied to ${prId}`, 
      type: 'SUCCESS' 
    });
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-2">
        <div>
          <h1 className="text-[28px] font-medium text-slate-900 tracking-tight">PR Review Queue</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-1">
            4 open · 7 merged this sprint
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[14px] font-medium hover:bg-slate-50 transition-all shadow-sm">
          <FileText size={18} /> Report
        </button>
      </div>

      {/* Stats Bar */}
      <div className="px-8 grid grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <p className="text-[13px] text-slate-400 font-medium mb-3">{stat.label}</p>
            <p className={`text-[36px] font-medium ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* PR List Section */}
      <div className="px-8 flex flex-col gap-4">
        <h3 className="text-[12px] font-normal uppercase tracking-widest">Open — Awaiting Review</h3>
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Loading pull requests...</p>
            </div>
          ) : prs.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
               <Code2 size={40} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">No open pull requests</p>
               <p className="text-slate-400 text-sm mt-1">Everything looks clear in the queue.</p>
            </div>
          ) : (
            prs.map(pr => (
              <PRCard key={pr.id} pr={pr} onAction={handleAction} isLead={isLead} />
            ))
          )}
        </div>
      </div>

      {/* Recently Merged Section */}
      <div className="px-8 pb-12">
        <h3 className="text-[12px] font-normal uppercase tracking-widest mb-4">Recently Merged</h3>
        <div className="py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <GitMerge size={24} className="text-slate-300 mb-2" />
          <p className="text-slate-400 font-medium text-[14px]">7 PRs merged successfully this sprint</p>
        </div>
      </div>
    </div>
  );
};

function PRCard({ pr, onAction, isLead }: { pr: PR, onAction: (action: string, id: string) => void, isLead: boolean }) {
  return (
    <div className="group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
      <div className="p-6 space-y-5">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h4 className="text-[17px] font-medium text-slate-900 tracking-tight leading-tight">
              <span className="text-slate-400 font-medium mr-2">{pr.id}</span>
              {pr.title}
            </h4>
            <div className="flex items-center gap-2 mt-1 font-mono text-[12px] text-slate-400">
              <GitBranch size={14} />
              <span className="text-indigo-500 font-medium">{pr.branchName}</span>
              <span className="text-slate-300">→</span>
              <span className="text-slate-500">{pr.targetBranch}</span>
            </div>
          </div>
          <div className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
            pr.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
            pr.status === 'CHANGES_REQUESTED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
            'bg-blue-50 text-blue-600 border-blue-100'
          }`}>
            {getStatusLabel(pr.status)}
          </div>
        </div>

        {/* PR Metadata Area */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-medium">
                {pr.author?.name?.split(' ').map((n:any) => n[0]).join('').toUpperCase() || '??'}
              </div>
              <p className="text-[13px] font-medium text-slate-700">{pr.author?.name || 'Unknown Author'}</p>
            </div>
            
            <div className="flex items-center gap-4 text-slate-400 text-[13px] font-medium">
              <div className="flex items-center gap-1.5">
                <Clock size={16} /> {new Date(pr.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5">
                <FileCode size={16} /> {pr.filesChanged} files
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-emerald-500">+{pr.additions}</span>
                <span className="text-red-500">-{pr.deletions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex items-center gap-3">
            {isLead && (
              <>
                <button 
                  onClick={() => onAction('Approve', pr.id)}
                  className="flex items-center gap-2 px-5 py-2 bg-[#0D5F46] text-white rounded-xl text-[13px] font-medium hover:opacity-90 transition-all shadow-sm"
                >
                  <Check size={16} /> Approve
                </button>
                <button 
                  onClick={() => onAction('Changes Requested', pr.id)}
                  className="flex items-center gap-2 px-5 py-2 border border-slate-200 text-red-600 bg-red-50/30 rounded-xl text-[13px] font-medium hover:bg-red-50 transition-all"
                >
                  <X size={16} /> Changes
                </button>
              </>
            )}
            <button className="flex items-center gap-2 px-5 py-2 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all">
              <Code2 size={16} /> View diff
            </button>
            <button className="flex items-center gap-2 px-5 py-2 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all">
              <MessageSquare size={16} /> Comment
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={16} />
            <span className="text-[12px] font-medium uppercase tracking-widest">{new Date(pr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
