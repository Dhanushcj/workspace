import React from 'react';
import TasksLayout from '../components/TasksLayout';

const TasksWorkload = () => {
  return (
    <TasksLayout title="Workload View" subtitle="TEAM">
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-8">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Workload View</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm text-center">Visualize team capacity and redistribute tasks to prevent burnout.</p>
        <button className="mt-6 px-6 py-2.5 rounded-xl bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors">
          Generate Report
        </button>
      </div>
    </TasksLayout>
  );
};

export default TasksWorkload;
