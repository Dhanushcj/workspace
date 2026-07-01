import React from 'react';
import TasksLayout from '../components/TasksLayout';

const TasksBacklog = () => {
  return (
    <TasksLayout title="Product Backlog" subtitle="SPRINT MANAGEMENT">
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Product Backlog</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm text-center">Groom your unassigned tickets, features, and technical debt.</p>
        <button className="mt-6 px-6 py-2.5 rounded-xl bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors">
          Add Backlog Item
        </button>
      </div>
    </TasksLayout>
  );
};

export default TasksBacklog;
