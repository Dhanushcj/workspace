import React, { useState, useEffect } from 'react';
import TasksLayout from '../components/TasksLayout';
import { useWorkflowStore } from '../store/workflowStore';
import { UserPlus, Search, AlertCircle, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';

const TasksAssignment = () => {
  const { tasks, members, isLoading, updateTask, deleteTask, bulkDeleteTasks, bulkUpdateTasks, currentProject } = useWorkflowStore();
  const [search, setSearch] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [bulkAssigneeId, setBulkAssigneeId] = useState('');

  const handleAssign = async (taskId, assigneeId) => {
    try {
      await updateTask(taskId, { assigneeId });
    } catch (error) {
      alert('Failed to assign task');
    }
  };

  const handleDelete = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        setSelectedTaskIds(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      } catch (error) {
        alert('Failed to delete task');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedTaskIds.size} tasks?`)) {
      try {
        await bulkDeleteTasks(Array.from(selectedTaskIds));
        setSelectedTaskIds(new Set());
      } catch (error) {
        alert('Failed to bulk delete tasks');
      }
    }
  };

  const handleBulkAssign = async () => {
    if (selectedTaskIds.size === 0 || !bulkAssigneeId) return;
    try {
      await bulkUpdateTasks(Array.from(selectedTaskIds), { assigneeId: bulkAssigneeId });
      setBulkAssigneeId('');
      setSelectedTaskIds(new Set());
    } catch (error) {
      alert('Failed to bulk assign tasks');
    }
  };

  const toggleSelection = (taskId) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id || t._id)));
    }
  };

  const filteredTasks = tasks.filter(t => {
    const searchLower = search.toLowerCase();
    const titleMatch = (t.title || '').toLowerCase().includes(searchLower);
    const assigneeMatch = (t.assignee?.name || t.assigneeName || '').toLowerCase().includes(searchLower);
    return titleMatch || assigneeMatch;
  });

  const getInitials = (name) => {
    if (!name) return '??';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <TasksLayout title="Task Assignment" subtitle="SPRINT MANAGEMENT">
      <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B4FAB]/10 text-[#1B4FAB] flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Assign Tasks</h2>
              <p className="text-xs font-semibold text-slate-400">Balance workload across your team</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB] w-64 transition-all"
              />
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1B4FAB] text-white rounded-xl text-sm font-bold hover:bg-[#1A3A8F] transition-all shadow-md"
            >
              <Plus size={16} /> Add Task
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedTaskIds.size > 0 && (
          <div className="bg-[#1B4FAB]/5 px-6 py-3 border-b border-[#1B4FAB]/10 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#1B4FAB]">{selectedTaskIds.size} tasks selected</span>
              <button 
                onClick={selectAll}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline"
              >
                {selectedTaskIds.size === filteredTasks.length ? 'Deselect All' : 'Select All Filtered'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <select 
                  value={bulkAssigneeId}
                  onChange={(e) => setBulkAssigneeId(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB]"
                >
                  <option value="">Select Assignee...</option>
                  <option value="null">Unassigned</option>
                  {members.map(member => (
                    <option key={member.id || member._id} value={member.id || member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={handleBulkAssign}
                  disabled={!bulkAssigneeId}
                  className="px-3 py-1.5 bg-[#1B4FAB] text-white text-xs font-bold rounded-lg hover:bg-[#1A3A8F] disabled:opacity-50 transition-colors"
                >
                  Assign Selected
                </button>
              </div>
              <div className="w-px h-5 bg-slate-300 mx-1"></div>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-400 font-bold animate-pulse">
              Loading assignment data...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <AlertCircle size={40} className="mb-3 opacity-20" />
              <p className="font-bold">No tasks found.</p>
              {search && <p className="text-xs mt-1">Try adjusting your search.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => {
                const taskId = task.id || task._id;
                const isSelected = selectedTaskIds.has(taskId);
                const assigneeName = task.assignee?.name || task.assigneeName || '';
                
                return (
                  <div 
                    key={taskId} 
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all group bg-white ${
                      isSelected ? 'border-[#1B4FAB] shadow-sm ring-1 ring-[#1B4FAB]/10' : 'border-slate-100 hover:border-[#1B4FAB]/30 hover:shadow-sm'
                    }`}
                  >
                    
                    {/* Task Info */}
                    <div className="flex-1 pr-6 flex items-start gap-4">
                      <button 
                        onClick={() => toggleSelection(taskId)}
                        className={`mt-0.5 shrink-0 ${isSelected ? 'text-[#1B4FAB]' : 'text-slate-300 hover:text-slate-400'}`}
                      >
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">
                            {(task.status || 'TO DO').replace(/_/g, ' ')}
                          </span>
                          {task.priority && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                              task.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                              task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                              task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 leading-snug">{task.title}</h3>
                      </div>
                    </div>

                    {/* Assignee Selection & Actions */}
                    <div className="flex items-center gap-4 shrink-0">
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-sm ${assigneeName ? 'bg-[#1B4FAB]' : 'bg-slate-100 text-slate-400 border border-slate-200 border-dashed'}`}>
                          {assigneeName ? getInitials(assigneeName) : '?'}
                        </div>
                        
                        <select 
                          value={task.assigneeId || task.assignee?.id || ''}
                          onChange={(e) => handleAssign(taskId, e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB] w-40 hover:bg-white transition-colors"
                        >
                          <option value="">Unassigned</option>
                          {members.map(member => (
                            <option key={member.id || member._id} value={member.id || member._id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-px h-6 bg-slate-200"></div>

                      <button 
                        onClick={() => handleDelete(taskId)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={currentProject?.id || currentProject?._id}
          onTaskCreated={(task) => {
             // Task creation is handled by the store inside CreateTaskModal
             setIsCreateModalOpen(false);
          }}
        />
      )}
    </TasksLayout>
  );
};

export default TasksAssignment;
