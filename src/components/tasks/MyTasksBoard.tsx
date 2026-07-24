'use client';

import React from 'react';
import { 
  Clock, Play, ShieldAlert, GitPullRequest, 
  AlertCircle, Calendar, CircleCheck 
} from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Task } from '../../store/workflowStore';

interface Props {
  tasks: Task[];
  theme?: 'light' | 'dark';
  onStartTask: (taskId: string) => void;
  onRaiseBlocker: (taskId: string) => void;
  onSubmitPR: (taskId: string) => void;
}

export const MyTasksBoard: React.FC<Props> = ({ tasks, theme = 'light', onStartTask, onRaiseBlocker, onSubmitPR }) => {
  const isDark = theme === 'dark';
  const columns = [
    { label: 'TO DO', status: 'TO_DO' },
    { label: 'IN PROGRESS', status: 'IN_PROGRESS' },
    { label: 'BLOCKED', status: 'BLOCKED' },
    { label: 'PR SUBMITTED', status: 'PR_SUBMITTED' },
  ];

  if (tasks.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-20 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'} rounded-[40px] border border-dashed transition-all`}>
        <div className={`w-20 h-20 ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-full flex items-center justify-center mb-6 border border-slate-100`}>
          <ClipboardIcon size={40} className="text-slate-400" />
        </div>
        <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>No tasks assigned yet</h3>
        <p className="text-slate-500 font-medium mt-2">Talk to your Team Lead to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 px-2">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {col.label}
              </h3>
              <div className={`px-2 py-0.5 ${isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-white border-slate-200 text-slate-600'} rounded-lg text-[10px] font-black border shadow-sm transition-all`}>
                {columnTasks.length}
              </div>
            </div>

            {/* Column Body */}
            <div className={`space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2 p-3 ${isDark ? 'bg-white/[0.02]' : 'bg-slate-100/50'} border border-slate-200/60 rounded-3xl`}>
              {columnTasks.length === 0 ? (
                <div className={`p-10 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white/40 border-slate-100'} rounded-[24px] text-center border-dashed border transition-all`}>
                  <div className="text-slate-300 mb-2">
                    <CircleCheck size={24} className="mx-auto" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Empty Section</p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task}
                    onStart={onStartTask} 
                    onBlocker={onRaiseBlocker} 
                    onSubmit={onSubmitPR} 
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ClipboardIcon = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

