'use client';

import React, { useState } from 'react';
import { 
  MoreHorizontal, Plus, Filter, LayoutGrid, 
  List, Calendar, Search, Star, Zap, 
  Clock, AlertCircle, CircleCheck, MessageSquare
} from 'lucide-react';
import { useWorkflowStore, Task, TaskStatus } from '../../store/workflowStore';
import { useAuthStore } from '../../store/authStore';

export default function KanbanBoard() {
  const { tasks, updateTaskStatus } = useWorkflowStore();
  const { user } = useAuthStore();
  const role = user?.role || 'DEVELOPER';
  
  // Animation tracking
  const [animatingTask, setAnimatingTask] = useState<{ id: string; type: 'success' | 'fail' | null }>({ id: '', type: null });

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'TO_DO', label: 'To Do', color: 'bg-slate-200' },
    { id: 'BLOCKED', label: 'Blocked', color: 'bg-red-500' },
    { id: 'IN_PROGRESS', label: 'Active', color: 'bg-amber-400' },
    { id: 'PR_SUBMITTED', label: 'PR Submitted', color: 'bg-blue-400' },
    { id: 'TESTING', label: 'Validation', color: 'bg-emerald-400' },
    { id: 'READY_FOR_RELEASE', label: 'Final Stage', color: 'bg-blue-500' },
    { id: 'DONE', label: 'Deployed', color: 'bg-[#0f172a]' }
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;

    // Determine animation type based on transition
    let type: 'success' | 'fail' = 'success';
    if (status === 'IN_PROGRESS' && (task.status === 'PR_SUBMITTED' || task.status === 'TESTING')) {
      type = 'fail';
    }

    const success = await updateTaskStatus(taskId, status, role as any);
    
    if (success) {
      setAnimatingTask({ id: taskId, type });
      setTimeout(() => setAnimatingTask({ id: '', type: null }), 1000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <style jsx>{`
          @keyframes success-pulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); transform: scale(1); }
            50% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); transform: scale(1.02); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); transform: scale(1); }
          }
          @keyframes fail-shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
          }
          .animate-success { animation: success-pulse 0.6s ease-out; border-color: #10b981 !important; }
          .animate-fail { animation: fail-shake 0.4s ease-in-out; border-color: #ef4444 !important; }
       `}</style>
       <div className="flex items-center justify-between">
          <div>
             <h2 className="text-xl font-black tracking-tight text-[#0f172a]">Cycle Dashboard</h2>
             <p className="text-xs text-slate-500 font-medium italic">Production flow for current cycle.</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
             <button className="p-1.5 bg-[#0f172a] text-white rounded-lg shadow-lg"><LayoutGrid size={16} /></button>
             <button className="p-1.5 text-slate-400 hover:text-[#0f172a] transition-colors"><List size={16} /></button>
             <div className="w-px h-5 bg-slate-100 mx-1" />
             <button className="p-1.5 text-slate-400 hover:text-[#0f172a] transition-colors"><Filter size={16} /></button>
          </div>
       </div>

       <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-6 h-full min-w-max">
             {columns.map(col => (
                <div 
                  key={col.id}
                  onDrop={(e) => handleDrop(e, col.id)}
                  onDragOver={handleDragOver}
                  className="w-72 flex flex-col bg-[#F8FAFC] rounded-[24px] p-4 border border-slate-200/50 transition-colors hover:bg-slate-100"
                >
                   <div className="flex items-center justify-between mb-4 px-1">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${col.color}`} />
                         <h3 className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{col.label}</h3>
                         <span className="text-[8px] font-black bg-white border border-slate-100 px-1.5 py-0.5 rounded-full text-slate-400">
                            {tasks.filter(t => t.status === col.id).length}
                         </span>
                      </div>
                      <button className="text-slate-300 hover:text-[#0f172a] transition-colors"><Plus size={14} /></button>
                   </div>

                   <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar px-1 pb-4">
                      {tasks.filter(t => t.status === col.id).map(task => (
                        <div 
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#FFC107]/30 hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing group relative ${
                            animatingTask.id === task.id ? (animatingTask.type === 'success' ? 'animate-success' : 'animate-fail') : ''
                          }`}
                        >
                           {/* Glow Effect Overlay */}
                           {animatingTask.id === task.id && animatingTask.type === 'success' && (
                             <div className="absolute inset-0 bg-[#FFC107]/5 rounded-xl pointer-events-none" />
                           )}
                           {animatingTask.id === task.id && animatingTask.type === 'fail' && (
                             <div className="absolute inset-0 bg-red-500/5 rounded-xl pointer-events-none" />
                           )}
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{task.id}</span>
                              <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                task.priority === 'CRITICAL' ? 'bg-red-50 text-red-500' : 'bg-[#F8FAFC] text-slate-400'
                              }`}>
                                 {task.priority}
                              </div>
                           </div>
                           <h4 className="text-xs font-bold text-[#0f172a] mb-3 line-clamp-2 group-hover:text-[#FFC107] transition-colors leading-relaxed">{task.title}</h4>
                           
                           <div className="flex items-center justify-between">
                              <div className="flex -space-x-2">
                                 <div className="w-5 h-5 rounded-full bg-[#0f172a] border-2 border-white flex items-center justify-center text-[7px] font-black text-[#FFC107] shadow-sm">
                                    {task.assigneeId?.[0] || 'U'}
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 text-slate-300">
                                 <div className="flex items-center gap-1 group-hover:text-slate-500 transition-colors">
                                    <MessageSquare size={10} />
                                    <span className="text-[9px] font-bold">4</span>
                                 </div>
                                 <div className="flex items-center gap-1 group-hover:text-[#FFC107] transition-colors">
                                    <Zap size={10} fill="currentColor" />
                                    <span className="text-[9px] font-bold">5</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                      {tasks.filter(t => t.status === col.id).length === 0 && (
                        <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center px-6">
                           <LayoutGrid size={24} className="text-slate-200 mb-2" />
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Drop tasks here</p>
                        </div>
                      )}
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}

