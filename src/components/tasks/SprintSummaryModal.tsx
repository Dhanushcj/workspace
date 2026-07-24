import React, { useState, useEffect } from 'react';
import { 
  X, BarChart3, Clock, Target, 
  AlertTriangle, CircleCheck, Download, History
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { VelocityChart } from './VelocityChart';
import { CFDChart } from './CFDChart';

interface SprintSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string;
}

export const SprintSummaryModal = ({ isOpen, onClose, sprintId }: SprintSummaryModalProps) => {
  const { fetchSprintSummary, fetchProjectVelocity, fetchProjectCFD, currentProject } = useWorkflowStore();
  const [summary, setSummary] = useState<any>(null);
  const [velocity, setVelocity] = useState<any>(null);
  const [cfd, setCFD] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && sprintId) {
      loadData();
    }
  }, [isOpen, sprintId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, velocityData, cfdData] = await Promise.all([
        fetchSprintSummary(sprintId),
        currentProject ? fetchProjectVelocity(currentProject.id) : Promise.resolve(null),
        currentProject ? fetchProjectCFD(currentProject.id) : Promise.resolve(null)
      ]);
      setSummary(summaryData);
      setVelocity(velocityData);
      setCFD(cfdData);
    } catch (err) {
      console.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Sprint Insights</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{summary?.sprint?.name || 'Loading...'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aggregating Metrics...</p>
            </div>
          ) : summary ? (
            <div className="space-y-8">
              {/* Progress Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Completion</div>
                  <div className="text-3xl font-black text-indigo-600">{summary.completionRate}%</div>
                </div>
                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Done Tasks</div>
                  <div className="text-3xl font-black text-emerald-600">{summary.metrics.doneTasks}</div>
                </div>
                <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl">
                  <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Blockers</div>
                  <div className="text-3xl font-black text-amber-600">{summary.metrics.activeBlockers}</div>
                </div>
              </div>

              {/* Detail Metrics */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} className="text-indigo-600" />
                    Task Distribution
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'To Do', count: summary.metrics.todoTasks, color: 'bg-slate-200' },
                      { label: 'In Progress', count: summary.metrics.inProgressTasks, color: 'bg-blue-500' },
                      { label: 'Blocked', count: summary.metrics.blockedTasks, color: 'bg-amber-500' },
                      { label: 'Done', count: summary.metrics.doneTasks, color: 'bg-emerald-500' }
                    ].map(item => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                          <span>{item.label}</span>
                          <span>{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.color} transition-all duration-1000`} 
                            style={{ width: `${(item.count / summary.metrics.totalTasks) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} className="text-indigo-600" />
                    Time Analysis
                  </h3>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Time Spent</div>
                      <div className="text-xl font-black text-slate-900">
                        {Math.floor(summary.metrics.totalTimeSpent / 60)}h {summary.metrics.totalTimeSpent % 60}m
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Original Estimate</div>
                      <div className="text-xl font-black text-slate-900">
                        {Math.floor(summary.metrics.totalEstimate / 60)}h {summary.metrics.totalEstimate % 60}m
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <div className={`text-[10px] font-black uppercase ${summary.metrics.totalTimeSpent > summary.metrics.totalEstimate ? 'text-red-500' : 'text-emerald-500'}`}>
                        {summary.metrics.totalTimeSpent > summary.metrics.totalEstimate ? 'Over Estimate' : 'On Track'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Velocity Trend */}
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px]">
                 <VelocityChart 
                   data={velocity?.velocityData || []} 
                   averageVelocity={velocity?.averageVelocity || 0} 
                 />
              </div>

               {/* CFD Trend */}
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px]">
                 <CFDChart 
                   data={cfd?.data || []} 
                   statuses={cfd?.statuses || []} 
                 />
              </div>

              {/* Task List / Assignees */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} className="text-indigo-600" />
                  Operative Deployment
                </h3>
                <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Task Title</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Assignee</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {summary.tasks?.map((task: any) => (
                        <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase">Sprint</span>
                               <p className="text-xs font-black text-slate-700 tracking-tight">{task.title}</p>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{task.type} • {task.priority}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black uppercase">
                                {task.assignee?.name?.[0] || '?'}
                              </div>
                              <span className="text-xs font-bold text-slate-600">{task.assignee?.name || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                              task.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' :
                              task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' :
                              task.status === 'BLOCKED' ? 'bg-amber-50 text-amber-600' :
                              'bg-slate-100 text-slate-400'
                            }`}>
                              {task.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* Backlog Tasks Fallback */}
                      {summary.backlogTasks?.map((task: any) => (
                        <tr key={task.id} className="hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[8px] font-black uppercase">Backlog</span>
                               <p className="text-xs font-black text-slate-500 tracking-tight italic">{task.title}</p>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{task.type} • {task.priority}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-black uppercase">
                                {task.assignee?.name?.[0] || '?'}
                              </div>
                              <span className="text-xs font-bold text-slate-400">{task.assignee?.name || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 text-slate-400 rounded-md">
                              {task.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {(!summary.tasks?.length && !summary.backlogTasks?.length) && (
                        <tr>
                          <td colSpan={3} className="px-6 py-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            No tasks recorded for this project
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                 <button 
                   onClick={() => window.print()}
                   className="px-6 py-3 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                 >
                    <Download size={14} />
                    EXPORT PDF
                 </button>
                 <button 
                   onClick={onClose}
                   className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black tracking-widest hover:bg-slate-800 transition-all"
                 >
                    CLOSE
                 </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
               <AlertTriangle className="mx-auto text-amber-500 mb-4" size={40} />
               <p className="text-slate-500 font-bold">Failed to load summary data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

