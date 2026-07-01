import React from 'react';
import TasksLayout from '../components/TasksLayout';

const TasksSprintPlanner = () => {
  return (
    <TasksLayout title="Sprint Planner" subtitle="SPRINT MANAGEMENT">
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Sprint Planner</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm text-center">Plan your next sprints, estimate story points, and commit to goals.</p>
        <button className="mt-6 px-6 py-2.5 rounded-xl bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors">
          Start Planning
        </button>
      </div>
    </TasksLayout>
  );
};

export default TasksSprintPlanner;
