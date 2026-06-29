import React, { useState, useEffect } from 'react';
import TasksLayout from '../components/TasksLayout';
import { 
  CheckCircle2, Circle, Clock, AlertCircle, 
  List, Check, LayoutGrid, GitPullRequest, 
  TrendingUp, Plus, MoreHorizontal, X
} from 'lucide-react';
import { fetchTasks, createTask, updateTask, fetchMembers } from '../api/tasksApi';

const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskModal, setNewTaskModal] = useState(null); // stores the column key to add to
  const [newTaskForm, setNewTaskForm] = useState({ title: '', desc: '', priority: 'medium', assignee: '', due: '' });
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [members, setMembers] = useState([]);

  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const workspaceId = auth.workspaceId || 'forge-india-connect';

  const loadTasks = async () => {
    try {
      setLoading(true);
      const [tasksData, membersData] = await Promise.all([
        fetchTasks(workspaceId),
        fetchMembers(workspaceId).catch(() => [])
      ]);
      setTasks(tasksData);
      setMembers(membersData);
    } catch (err) {
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [workspaceId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;
    
    try {
      const created = await createTask({
        workspaceId,
        title: newTaskForm.title,
        status: newTaskModal === 'inProgress' ? 'in-progress' : (newTaskModal === 'inReview' ? 'in-review' : newTaskModal),
        assigneeName: newTaskForm.assignee,
        description: newTaskForm.desc,
        priority: newTaskForm.priority,
        dueDate: newTaskForm.due,
      });
      setTasks([created, ...tasks]);
      setNewTaskModal(null);
      setNewTaskForm({ title: '', desc: '', priority: 'medium', assignee: '', due: '' });
    } catch (err) {
      alert('Error creating task');
    }
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    
    // Convert column key to backend status format
    let backendStatus = targetStatus;
    if (targetStatus === 'inProgress') backendStatus = 'in-progress';
    if (targetStatus === 'inReview') backendStatus = 'in-review';

    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t._id === draggedTaskId ? { ...t, status: backendStatus } : t));

    try {
      await updateTask(draggedTaskId, { status: backendStatus });
    } catch (err) {
      // Revert on failure
      setTasks(previousTasks);
      alert('Failed to move task');
    }
    setDraggedTaskId(null);
  };

  const PRIORITY_CONFIG = {
    high: { label: 'High', style: { background: 'color-mix(in srgb, #EF4444 10%, transparent)', color: '#EF4444' } },
    medium: { label: 'Medium', style: { background: 'color-mix(in srgb, #F59E0B 10%, transparent)', color: '#F59E0B' } },
    low: { label: 'Low', style: { background: 'color-mix(in srgb, #10B981 10%, transparent)', color: '#10B981' } },
  };

  const getPoints = (task) => {
    return 1;
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.substring(0, 2).toUpperCase();
  };

  const groupedTasks = {
    todo: tasks.filter(t => t.status === 'todo'),
    inProgress: tasks.filter(t => t.status === 'in-progress'),
    inReview: tasks.filter(t => t.status === 'in-review'),
    testing: tasks.filter(t => t.status === 'testing'),
    done: tasks.filter(t => t.status === 'done'),
    blocked: tasks.filter(t => t.status === 'blocked'),
  };

  const columns = [
    { key: 'todo', label: 'To Do', count: groupedTasks.todo.length, color: 'text-slate-400', dot: 'bg-slate-300' },
    { key: 'inProgress', label: 'In Progress', count: groupedTasks.inProgress.length, color: 'text-blue-500', dot: 'bg-blue-500' },
    { key: 'inReview', label: 'In Review', count: groupedTasks.inReview.length, color: 'text-purple-500', dot: 'bg-purple-500' },
    { key: 'testing', label: 'Testing', count: groupedTasks.testing.length, color: 'text-amber-500', dot: 'bg-amber-500' },
    { key: 'done', label: 'Done', count: groupedTasks.done.length, color: 'text-emerald-500', dot: 'bg-emerald-500' },
    { key: 'blocked', label: 'Blocked', count: groupedTasks.blocked.length, color: 'text-red-500', dot: 'bg-red-500' },
  ];

  // Calculate Sprint Stats
  const totalTasks = tasks.length;
  const doneTasks = groupedTasks.done.length;
  const blockedTasks = groupedTasks.blocked.length;
  const leftTasks = totalTasks - doneTasks;
  const percentComplete = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  const totalVelocity = tasks.reduce((sum, t) => sum + getPoints(t), 0);

  return (
    <TasksLayout>
      <div className="flex flex-col h-full relative">
        {/* Header Area */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Sprint Board</h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 uppercase tracking-widest">
              Sprint 1 — Active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl border border-amber-200 text-amber-600 text-sm font-bold bg-amber-50/50 hover:bg-amber-50 transition-colors flex items-center gap-2 shadow-sm">
              <List size={16} /> Backlog
            </button>
            <button className="px-5 py-2 rounded-xl bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors flex items-center gap-2">
              <Check size={16} /> Complete Sprint
            </button>
          </div>
        </div>

        {/* Sub-header stats */}
        <div className="flex items-center gap-6 mb-8 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <LayoutGrid size={14} className="text-slate-300" /> {totalTasks} Tasks
          </div>
          <div className="flex items-center gap-1.5 text-emerald-500">
            <CheckCircle2 size={14} /> Done: {doneTasks}
          </div>
          <div className="flex items-center gap-1.5 text-red-500">
            <AlertCircle size={14} /> Blocked: {blockedTasks}
          </div>
          <div className="flex items-center gap-1.5 text-blue-500">
            <GitPullRequest size={14} /> 0 PRs open
          </div>
          <div className="flex items-center gap-1.5 text-amber-500">
            <TrendingUp size={14} /> Velocity: <span className="text-slate-600 ml-1">{totalVelocity} pts</span>
          </div>
        </div>

        {/* Kanban Board Area */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-bold animate-pulse">
            Loading Tasks...
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto pb-[100px]">
            <div className="flex gap-4 min-w-max h-full">
              {columns.map((col) => (
                <div 
                  key={col.key} 
                  className="w-[280px] flex flex-col bg-slate-50/60 rounded-3xl p-3 border border-slate-100/50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 px-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                      <span className="text-sm font-bold text-slate-700">{col.label}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-400 shadow-sm">
                        {col.count}
                      </span>
                    </div>
                    <button onClick={() => setNewTaskModal(col.key)} className="text-slate-300 hover:text-slate-500">
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>

                  {/* Cards Container */}
                  <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                    {groupedTasks[col.key]?.length > 0 ? (
                      groupedTasks[col.key].map(task => (
                        <div 
                          key={task._id} 
                          draggable
                          onDragStart={() => setDraggedTaskId(task._id)}
                          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
                            <button className="text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                              <MoreHorizontal size={13} />
                            </button>
                          </div>
                          {task.description && <p className="text-xs mb-3 line-clamp-2 leading-relaxed text-slate-500">{task.description}</p>}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest" style={PRIORITY_CONFIG[task.priority || 'medium'].style}>
                              {PRIORITY_CONFIG[task.priority || 'medium'].label}
                            </span>
                            <div className="flex items-center gap-2">
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <Clock size={10} /> {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                              )}
                              {task.assigneeName && (
                                <div className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center bg-[#534AB7]">
                                  {getInitials(task.assigneeName)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <button onClick={() => setNewTaskModal(col.key)} className="w-full py-3 rounded-2xl text-[11px] font-bold border-2 border-dashed border-slate-300 text-slate-400 hover:border-[#0F5A3E] hover:text-[#0F5A3E] transition-all bg-white/50">
                        + Add task
                      </button>
                    )}
                    {groupedTasks[col.key]?.length > 0 && (
                      <button onClick={() => setNewTaskModal(col.key)} className="w-full py-3 rounded-2xl text-[11px] font-bold border-2 border-dashed border-slate-300 text-slate-400 hover:border-[#0F5A3E] hover:text-[#0F5A3E] transition-all bg-white/50 mt-1">
                        + Add task
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Sprint Progress Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-white border-t border-slate-100 flex items-center justify-between px-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] rounded-t-3xl">
          <div className="flex items-center gap-12">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-emerald-500 leading-none">{doneTasks}</span>
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Done</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-red-500 leading-none">{leftTasks}</span>
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Left</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-purple-500 leading-none">3</span>
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Days</span>
            </div>
            <div className="flex flex-col items-center ml-4">
              <span className="text-2xl font-black text-slate-800 leading-none">{percentComplete}%</span>
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Complete</span>
            </div>
          </div>

          <div className="flex-1 max-w-xl flex flex-col gap-3 ml-12">
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest w-10">Ideal</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-[50%] w-0.5 h-3 bg-slate-300 rounded-full"></div>
              </div>
              <span className="text-[9px] font-bold text-slate-300 w-6 text-right">50%</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest w-10">Actual</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percentComplete}%` }}></div>
              </div>
              <span className="text-[9px] font-bold text-emerald-500 w-6 text-right">{percentComplete}%</span>
            </div>
          </div>
        </div>

        {/* Add Task Modal */}
        {newTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]" onClick={() => setNewTaskModal(null)} />
            <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-up">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Add task</h2>
                <button onClick={() => setNewTaskModal(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                  <X size={15} />
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">Task title</label>
                  <input type="text" value={newTaskForm.title} onChange={e => setNewTaskForm({...newTaskForm, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#534AB7]/10 focus:border-[#534AB7]" placeholder="What needs to be done?" required autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">Description</label>
                  <textarea value={newTaskForm.desc} onChange={e => setNewTaskForm({...newTaskForm, desc: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#534AB7]/10 focus:border-[#534AB7] resize-none" rows="3" placeholder="Optional details..." />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">Priority</label>
                    <select value={newTaskForm.priority} onChange={e => setNewTaskForm({...newTaskForm, priority: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#534AB7]/10 focus:border-[#534AB7]">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">Assignee</label>
                    <select value={newTaskForm.assignee} onChange={e => setNewTaskForm({...newTaskForm, assignee: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#534AB7]/10 focus:border-[#534AB7]">
                      <option value="">Unassigned</option>
                      {members.map(member => (
                        <option key={member._id || member.email} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">Due date</label>
                    <input type="date" value={newTaskForm.due} onChange={e => setNewTaskForm({...newTaskForm, due: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#534AB7]/10 focus:border-[#534AB7] text-slate-500" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setNewTaskModal(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#534AB7] text-white text-sm font-semibold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all">Add task</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </TasksLayout>
  );
};

export default TaskBoard;
