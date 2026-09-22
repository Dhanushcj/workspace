import React, { useEffect } from 'react';
import { Clock, StopCircle, PlayCircle, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../store/authStore';

export default function TimeTrackerView() {
  const { user } = useAuthStore();
  const timeEntries = useWorkflowStore(state => state.timeEntries);
  const activeTimer = useWorkflowStore(state => state.activeTimer);
  const fetchUserTimeEntries = useWorkflowStore(state => state.fetchUserTimeEntries);
  const fetchActiveTimer = useWorkflowStore(state => state.fetchActiveTimer);
  const tasks = useWorkflowStore(state => state.tasks);

  useEffect(() => {
    fetchActiveTimer();
    // Managers/leads see all entries, members see their own
    if (['MANAGER', 'TEAM_LEAD', 'ADMIN'].includes(user?.role || '')) {
      fetchUserTimeEntries();
    } else {
      fetchUserTimeEntries(user?.id);
    }
  }, [user, fetchActiveTimer, fetchUserTimeEntries]);

  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId || (t as any)._id === taskId);
    return task?.title || 'Unknown Task';
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="text-[#1A3A8F]" size={24} />
          Time Tracker
        </h1>
        <p className="text-[13px] text-slate-500 font-medium">
          Monitor active timers and review historical time entries.
        </p>
      </div>

      {activeTimer && (
        <div className="bg-[#1A3A8F] text-white rounded-3xl p-6 shadow-xl shadow-blue-900/10 flex items-center justify-between border border-blue-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <PlayCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-blue-200 uppercase tracking-widest">Active Timer</p>
              <h3 className="text-lg font-bold">{getTaskName(activeTimer.taskId)}</h3>
              <p className="text-[13px] text-blue-100 mt-1">Started at {new Date(activeTimer.startTime).toLocaleTimeString()}</p>
            </div>
          </div>
          <button 
            disabled 
            className="px-6 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl text-[12px] font-bold opacity-50 cursor-not-allowed flex items-center gap-2"
            title="Stop from the Task Modal or Kanban Board"
          >
            <StopCircle size={16} /> Open Task to Stop
          </button>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[14px] font-bold text-slate-900">Recent Time Entries</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Date</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Task</th>
                {['MANAGER', 'TEAM_LEAD', 'ADMIN'].includes(user?.role || '') && (
                   <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Employee ID</th>
                )}
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Duration</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {timeEntries.map((entry) => (
                <tr key={entry._id || entry.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap text-[13px] font-medium text-slate-600">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 text-[13px] font-bold text-slate-900 max-w-[300px] truncate">
                    {getTaskName(entry.taskId)}
                  </td>
                  {['MANAGER', 'TEAM_LEAD', 'ADMIN'].includes(user?.role || '') && (
                    <td className="px-8 py-5 whitespace-nowrap text-[12px] font-medium text-slate-500">
                      {entry.userId}
                    </td>
                  )}
                  <td className="px-8 py-5 whitespace-nowrap text-[13px] font-bold text-[#1A3A8F]">
                    {entry.isRunning ? 'Recording...' : formatDuration(entry.durationSeconds || 0)}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    {entry.isRunning ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 uppercase tracking-widest">
                        Logged
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {timeEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Clock size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">No time entries recorded</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
