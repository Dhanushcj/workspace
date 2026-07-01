import React from 'react';
import TasksLayout from '../components/TasksLayout';

const TasksBlockers = () => {
  return (
    <TasksLayout title="Blockers" subtitle="SPRINT MANAGEMENT">
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-8">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Active Blockers</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm text-center">Review and unblock team members to maintain sprint velocity.</p>
        <button className="mt-6 px-6 py-2.5 rounded-xl bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors">
          Report Blocker
        </button>
      </div>
    </TasksLayout>
  );
};

export default TasksBlockers;
