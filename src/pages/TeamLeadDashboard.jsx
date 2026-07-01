import React, { useState, useEffect } from 'react';
import TasksLayout from '../components/TasksLayout';
import { fetchTasks } from '../api/tasksApi';
import { Flag, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

const StatCard = ({ title, value, subValue, highlight }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between">
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</div>
    <div className="mt-4">
      <div className={`text-3xl font-black ${highlight ? 'text-red-500' : 'text-[#0F5A3E]'}`}>{value}</div>
      <div className="text-[11px] font-semibold text-slate-400 mt-1">{subValue}</div>
    </div>
  </div>
);

const TeamLeadDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const workspaceId = auth.workspaceId || 'forge-india-connect';

  useEffect(() => {
    fetchTasks(workspaceId)
      .then(data => setTasks(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;
  const inReview = tasks.filter(t => t.status === 'in-review').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const completion = total === 0 ? 0 : Math.round((done / total) * 100);

  const activeBlockers = tasks.filter(t => t.status === 'blocked');

  const headerActions = (
    <>
      <button className="px-5 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
        <Flag size={14} /> Complete Sprint
      </button>
      <button className="px-5 py-2 rounded-full bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
        Assign Tasks
      </button>
    </>
  );

  return (
    <TasksLayout
      title="Team Lead Dashboard"
      subtitle="SPRINT 1 - AI INTERIOR DESIGN"
      headerActions={headerActions}
    >
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <StatCard title="SPRINT COMPLETION" value={`${completion}%`} subValue={`${done} of ${total} tasks done`} />
        <StatCard title="PRS TO REVIEW" value={inReview} subValue="Awaiting review" highlight={inReview > 0} />
        <StatCard title="ACTIVE BLOCKERS" value={blocked} subValue="Needs resolution" highlight={blocked > 0} />
        <StatCard title="BACKLOG ITEMS" value={todo} subValue="Next sprint ready" />
      </div>

      {/* 2 Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PR Review Queue */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">PR REVIEW QUEUE</h3>
            <button className="text-[11px] font-bold text-slate-300 hover:text-slate-500 transition-colors flex items-center gap-1">
              All PRs <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm font-semibold text-slate-300 italic">No pull requests awaiting review</p>
          </div>
        </div>

        {/* Active Blockers */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ACTIVE BLOCKERS</h3>
            <button className="text-[11px] font-bold text-slate-300 hover:text-slate-500 transition-colors flex items-center gap-1">
              Resolve <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          
          {activeBlockers.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {activeBlockers.map(task => (
                <div key={task._id} className="flex items-start gap-4 p-4 rounded-xl border border-red-100 bg-red-50/30">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                    <AlertOctagon size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      Task #{task._id.slice(-4).toUpperCase()} — <span className="font-semibold text-slate-600">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.assigneeName || 'UNASSIGNED'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.priority || 'MEDIUM'} PRIORITY</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm font-semibold text-slate-300 italic">No active blockers</p>
            </div>
          )}
        </div>
      </div>
    </TasksLayout>
  );
};

export default TeamLeadDashboard;
