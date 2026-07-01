import React, { useState, useEffect } from 'react';
import TasksLayout from '../components/TasksLayout';
import { fetchTasks, updateTask, fetchMembers } from '../api/tasksApi';
import { CheckCircle2, UserPlus, Clock, Search, AlertCircle } from 'lucide-react';

const TasksAssignment = () => {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const workspaceId = auth.workspaceId || 'forge-india-connect';

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, membersData] = await Promise.all([
        fetchTasks(workspaceId),
        fetchMembers(workspaceId).catch(() => []) // fallback if fails
      ]);
      setTasks(tasksData);
      setMembers(membersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleAssign = async (taskId, assigneeName) => {
    // Optimistic update
    setTasks(tasks.map(t => t._id === taskId ? { ...t, assigneeName } : t));
    try {
      await updateTask(taskId, { assigneeName });
    } catch (error) {
      alert('Failed to assign task');
      loadData(); // revert
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    (t.assigneeName && t.assigneeName.toLowerCase().includes(search.toLowerCase()))
  );

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
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Assign Tasks</h2>
              <p className="text-xs font-semibold text-slate-400">Balance workload across your team</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5A3E]/20 focus:border-[#0F5A3E] w-64"
            />
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 font-bold animate-pulse">
              Loading assignment data...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <AlertCircle size={40} className="mb-3 opacity-20" />
              <p className="font-bold">No tasks found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <div key={task._id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all group bg-white">
                  
                  {/* Task Info */}
                  <div className="flex-1 pr-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">
                        {task.status.replace('-', ' ')}
                      </span>
                      {task.priority && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          task.priority === 'high' ? 'bg-red-50 text-red-500' :
                          task.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 leading-snug">{task.title}</h3>
                  </div>

                  {/* Assignee Selection */}
                  <div className="flex items-center gap-4 shrink-0">
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-sm ${task.assigneeName ? 'bg-[#534AB7]' : 'bg-slate-200 text-slate-400 border border-slate-300 border-dashed'}`}>
                        {task.assigneeName ? getInitials(task.assigneeName) : '?'}
                      </div>
                      
                      <select 
                        value={task.assigneeName || ''}
                        onChange={(e) => handleAssign(task._id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#0F5A3E]/20 focus:border-[#0F5A3E] w-40"
                      >
                        <option value="">Unassigned</option>
                        {members.map(member => (
                          <option key={member._id || member.email} value={member.name}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TasksLayout>
  );
};

export default TasksAssignment;
