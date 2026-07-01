import React, { useState, useEffect } from 'react';
import TasksLayout from '../components/TasksLayout';
import { fetchTasks } from '../api/tasksApi';
import { Play, GitBranch, CheckCircle2, Clock } from 'lucide-react';

const StatCard = ({ title, value, subValue, highlight }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between">
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</div>
    <div className="mt-4">
      <div className={`text-3xl font-black ${highlight ? 'text-[#0F5A3E]' : 'text-slate-800'}`}>{value}</div>
      <div className="text-[11px] font-semibold text-slate-400 mt-1">{subValue}</div>
    </div>
  </div>
);

const TeamMemberDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const workspaceId = auth.workspaceId || 'forge-india-connect';
  const myEmail = auth.email || '';
  const myName = auth.name || auth.user || '';
  
  // Use a fuzzy match on name or email since assignee might be stored in different ways
  const isMine = (t) => t.assigneeEmail === myEmail || (t.assigneeName && myName && t.assigneeName.toLowerCase() === myName.toLowerCase());

  useEffect(() => {
    fetchTasks(workspaceId)
      .then(data => setTasks(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const myTasks = tasks.filter(isMine);
  const myInProgress = myTasks.filter(t => t.status === 'in-progress');
  const myInReview = myTasks.filter(t => t.status === 'in-review');
  const myHighPriority = myTasks.filter(t => t.priority === 'high').length;

  const headerActions = (
    <>
      <button className="px-5 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
        <GitBranch size={14} /> New Branch
      </button>
      <button className="px-5 py-2 rounded-full bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors flex items-center gap-2">
        <Play size={14} fill="currentColor" /> Start Work
      </button>
    </>
  );

  return (
    <TasksLayout
      title="Developer Workspace"
      subtitle="SPRINT 1 - AI INTERIOR DESIGN"
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <StatCard title="MY ASSIGNED TASKS" value={myTasks.length} subValue={`${myHighPriority} high priority`} highlight={myTasks.length > 0} />
        <StatCard title="IN PROGRESS" value={myInProgress.length} subValue={myInProgress.length > 0 ? myInProgress[0].title : 'No active tasks'} />
        <StatCard title="PENDING REVIEWS" value={myInReview.length} subValue="Awaiting review" />
        <StatCard title="HOURS LOGGED" value="N/A" subValue="This sprint" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">UP NEXT</h3>
            <button className="text-[11px] font-bold text-slate-300 hover:text-slate-500 transition-colors flex items-center gap-1">
              View Board <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          {myTasks.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {myTasks.slice(0, 5).map(task => (
                <div key={task._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      <span className="text-slate-400 font-semibold mr-2">#{task._id.slice(-4).toUpperCase()}</span>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${task.priority === 'high' ? 'text-red-500' : 'text-blue-500'}`}>{task.priority} PRIORITY</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-[#0F5A3E] transition-colors">
                    <Play size={16} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm font-semibold text-slate-300 italic">No tasks assigned to you</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">RECENT ACTIVITY</h3>
          </div>
          {myTasks.length > 0 ? (
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
              {myTasks.slice(0, 3).map((task, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 ${task.status === 'done' ? 'text-green-500' : 'text-blue-500'}`}>
                    {task.status === 'done' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">
                      {task.status === 'done' ? 'Completed' : 'Working on'} <span className="font-bold">#{task._id.slice(-4).toUpperCase()}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{task.title}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm font-semibold text-slate-300 italic">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </TasksLayout>
  );
};

export default TeamMemberDashboard;
