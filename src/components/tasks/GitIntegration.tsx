'use client';

import React from 'react';
import { 
  GitPullRequest, GitBranch, GitCommit, 
  Terminal, ExternalLink, CircleCheck as CircleCheck, 
  AlertCircle, Clock,
  Code2, MessageSquare, Zap, Users as Users
} from 'lucide-react';

export default function GitIntegration() {
  const prs = [
    { id: 'PR-842', title: 'feat: implement oauth2 provider', author: 'sarah_dev', status: 'OPEN', reviews: 2, approvals: 1, branch: 'feat/auth-v2' },
    { id: 'PR-840', title: 'fix: concurrent memory leak in worker', author: 'dhanush_cj', status: 'MERGED', reviews: 4, approvals: 4, branch: 'fix/mem-leak' },
    { id: 'PR-839', title: 'docs: update architecture diagram', author: 'alex_lead', status: 'DRAFT', reviews: 0, approvals: 0, branch: 'docs/arch-update' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
       <div className="flex items-center justify-between">
          <div>
             <h2 className="text-3xl font-black tracking-tighter text-slate-900">Git Intelligence</h2>
             <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time repository orchestration</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Code2 size={16} /> nexus-pm/core
             </div>
             <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Connected
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* PR List */}
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 border-l-4 border-indigo-500 pl-4">Active Pull Requests</h3>
                   <span className="text-[10px] font-black text-slate-400">Total: {prs.length}</span>
                </div>
                <div className="divide-y divide-slate-50">
                   {prs.map(pr => (
                     <div key={pr.id} className="p-8 hover:bg-slate-50/50 transition-all group flex items-start justify-between">
                        <div className="flex items-start gap-6">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                             pr.status === 'OPEN' ? 'bg-indigo-50 text-indigo-500' : 
                             pr.status === 'MERGED' ? 'bg-purple-50 text-purple-500' : 'bg-slate-100 text-slate-400'
                           }`}>
                              <GitPullRequest size={20} />
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pr.id}</span>
                                 <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                   pr.status === 'OPEN' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'
                                 }`}>{pr.status}</div>
                              </div>
                              <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{pr.title}</h4>
                              <div className="flex items-center gap-6 mt-3">
                                 <div className="flex items-center gap-1.5 text-slate-400">
                                    <GitBranch size={14} />
                                    <span className="text-[10px] font-bold">{pr.branch}</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 text-slate-400">
                                    <Users size={14} />
                                    <span className="text-[10px] font-bold">{pr.author}</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                           <div className="flex -space-x-2">
                              {[1,2].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400 shadow-sm">U{i}</div>
                              ))}
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-slate-300">
                                 <MessageSquare size={12} />
                                 <span className="text-[10px] font-bold">{pr.reviews}</span>
                              </div>
                              <div className="flex items-center gap-1 text-emerald-500">
                                 <CircleCheck size={12} />
                                 <span className="text-[10px] font-bold">{pr.approvals}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Side: Repository Pulse */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-8 relative overflow-hidden shadow-2xl shadow-slate-900/40">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
                <div className="flex items-center gap-3 relative z-10">
                   <Terminal size={20} className="text-indigo-400" />
                   <h3 className="text-xs font-black uppercase tracking-widest">Commit Pulse</h3>
                </div>
                
                <div className="space-y-6 relative z-10">
                   <CommitItem hash="a7f2e1" msg="Update auth logic" author="sarah_dev" time="2m ago" />
                   <CommitItem hash="c2d4b9" msg="Fix mobile grid padding" author="dhanush_cj" time="15m ago" />
                   <CommitItem hash="8e1a3d" msg="Add neural preloader" author="nexus_ai" time="1h ago" />
                   <CommitItem hash="f5c2a1" msg="Merge branch 'docs/api'" author="alex_lead" time="3h ago" />
                </div>

                <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                   View GithubIcon Activity
                </button>
             </div>

             <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 border-l-4 border-indigo-500 pl-4">Branch Health</h3>
                <div className="space-y-4">
                   <BranchStatus label="main" health={100} />
                   <BranchStatus label="develop" health={92} />
                   <BranchStatus label="staging" health={85} />
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function CommitItem({ hash, msg, author, time }: any) {
  return (
    <div className="flex items-start gap-4 group cursor-pointer">
       <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
          <GitCommit size={16} />
       </div>
       <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
             <span className="text-[10px] font-black text-indigo-400/60 uppercase font-mono">{hash}</span>
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{time}</span>
          </div>
          <p className="text-xs font-bold text-slate-300 truncate">{msg}</p>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mt-1">by {author}</p>
       </div>
    </div>
  );
}

function BranchStatus({ label, health }: any) {
  return (
    <div className="space-y-2">
       <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-700">{label}</span>
          <span className="text-[10px] font-black text-emerald-500">{health}% OK</span>
       </div>
       <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full bg-emerald-500 rounded-full transition-all duration-1000`} style={{ width: `${health}%` }} />
       </div>
    </div>
  );
}

