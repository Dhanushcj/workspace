import React, { useState, useEffect } from 'react';
import TasksLayout from '../components/TasksLayout';
import { fetchTasks } from '../api/tasksApi';
import { PieChart, Calendar, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, subValue, highlight }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between">
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</div>
    <div className="mt-4">
      <div className={`text-3xl font-black ${highlight ? 'text-[#0F5A3E]' : 'text-slate-800'}`}>{value}</div>
      <div className="text-[11px] font-semibold text-slate-400 mt-1">{subValue}</div>
    </div>
  </div>
);

const ManagerDashboard = () => {
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
  const risks = tasks.filter(t => t.status === 'blocked').length;
  const completion = total === 0 ? 0 : Math.round((done / total) * 100);

  // Group by assignee for resource allocation
  const assigneesMap = {};
  tasks.forEach(t => {
    const name = t.assigneeName || 'Unassigned';
    if (!assigneesMap[name]) assigneesMap[name] = 0;
    assigneesMap[name]++;
  });
  const resources = Object.entries(assigneesMap)
    .filter(([name]) => name !== 'Unassigned')
    .map(([name, count]) => ({
      name,
      role: 'Team Member',
      load: Math.min(100, Math.round((count / Math.max(total, 1)) * 100 * 2)) // Just a mock formula based on real counts
    }));

  const headerActions = (
    <>
      <button className="px-5 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
        <Calendar size={14} /> Timeline
      </button>
      <button className="px-5 py-2 rounded-full bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors flex items-center gap-2">
        <PieChart size={14} /> Generate Report
      </button>
    </>
  );

  return (
    <TasksLayout
      title="Manager Dashboard"
      subtitle="Q2 MILESTONE - AI INTERIOR DESIGN"
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <StatCard title="PROJECT COMPLETION" value={`${completion}%`} subValue={`${done} of ${total} tasks completed`} highlight={completion > 50} />
        <StatCard title="TEAM CAPACITY" value={`${Math.max(100 - (total * 2), 0)}%`} subValue="Estimated available" />
        <StatCard title="BUDGET BURN" value="N/A" subValue="Not tracked here" />
        <StatCard title="ACTIVE RISKS" value={risks} subValue="Blocked tasks" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">VELOCITY TREND</h3>
            <button className="text-[11px] font-bold text-slate-300 hover:text-slate-500 transition-colors flex items-center gap-1">
              Details <TrendingUp size={10} strokeWidth={3} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm font-semibold text-slate-300 italic">Chart data currently unavailable</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">RESOURCE ALLOCATION</h3>
            <button className="text-[11px] font-bold text-slate-300 hover:text-slate-500 transition-colors flex items-center gap-1">
              Manage <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          {resources.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {resources.map((member, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{member.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{member.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800">{member.load}%</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LOAD</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm font-semibold text-slate-300 italic">No resource data available</p>
            </div>
          )}
        </div>
      </div>
    </TasksLayout>
  );
};

export default ManagerDashboard;
