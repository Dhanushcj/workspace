'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  ArrowUpRight,
  Loader2,
  Trash2
} from 'lucide-react';
import { useWorkflowStore, Task } from '../store/workflowStore';
import { useToastStore } from '../store/toastStore';
import api from '../lib/api';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  currentLoad: number; // 0-100
  taskCount: number;
}

export const TaskAssignmentView = () => {
  const { currentProject, fetchTasks } = useWorkflowStore();
  const { addToast } = useToastStore();
  
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSprintName, setActiveSprintName] = useState('No Active Sprint');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  useEffect(() => {
    if (!currentProject) return;
    loadAssignmentData();
  }, [currentProject]);

  const loadAssignmentData = async () => {
    setLoading(true);
    try {
      // 1. Fetch unassigned tasks
      const tasksRes = await api.get(`/issues?projectId=${currentProject?.id}`);
      const rawTasks = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data?.data || []);
      const normalizedTasks = rawTasks.map((t: any) => ({ ...t, id: t.id || t._id, _id: t._id || t.id }));
      
      const unassigned = normalizedTasks.filter((t: any) => !t.assigneeId || t.assigneeId === 'null');
      setUnassignedTasks(unassigned);

      // 2. Fetch team members and calculate real load
      const workspaceId = 'forge-india-connect'; // Members belong to workspace, not project
      const usersRes = await api.get(`/members/${workspaceId}`);
      const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
      
      const membersWithLoad = rawUsers
        .filter((u: any) => u.role !== 'Manager')
        .map((u: any) => {
        const userId = u.id || u._id;
        const userTasks = normalizedTasks.filter((t: any) => (t.assigneeId === userId || t.assignee?.id === userId));
        const points = userTasks.reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);
        
        return {
          ...u,
          id: userId,
          _id: userId,
          currentLoad: Math.min(100, points * 10), // Example load calculation
          taskCount: userTasks.length
        };
      });
      setTeamMembers(membersWithLoad);

      // 3. Fetch active sprint name
      const sprintsRes = await api.get(`/projects/${currentProject?.id}/sprints`);
      const rawSprints = Array.isArray(sprintsRes.data) ? sprintsRes.data : (sprintsRes.data?.data || []);
      const activeSprint = rawSprints.find((s: any) => s.status === 'ACTIVE');
      if (activeSprint) {
        setActiveSprintName(activeSprint.name);
      }
    } catch (err) {
      console.error('Failed to load assignment data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (taskId: string, userId: string) => {
    if (!userId) return;
    
    try {
      // Modernized to PUT for Native backend compatibility
      // Use PATCH instead of PUT
      await api.patch(`/issues/${taskId}`, { assigneeId: userId });
      addToast({ title: 'Success', message: 'Task assigned successfully', type: 'SUCCESS' });
      
      // Optimistic update
      setUnassignedTasks(prev => prev.filter(t => t.id !== taskId));
      
      // Update team member load locally
      setTeamMembers(prev => prev.map(m => 
        m.id === userId 
          ? { ...m, currentLoad: Math.min(100, m.currentLoad + 5), taskCount: m.taskCount + 1 }
          : m
      ));
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to assign task', type: 'ERROR' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/issues/${taskId}`);
      addToast({ title: 'Success', message: 'Task deleted successfully', type: 'SUCCESS' });
      setUnassignedTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to delete task', type: 'ERROR' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedTasks.length} tasks?`)) return;
    
    try {
      await Promise.all(selectedTasks.map(id => api.delete(`/issues/${id}`)));
      addToast({ title: 'Success', message: `${selectedTasks.length} tasks deleted`, type: 'SUCCESS' });
      setUnassignedTasks(prev => prev.filter(t => !selectedTasks.includes(t.id)));
      setSelectedTasks([]);
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to delete some tasks', type: 'ERROR' });
    }
  };
  
  const toggleSelect = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedTasks.length === unassignedTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(unassignedTasks.map(t => t.id));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="text-slate-400 font-medium">Analyzing team workload...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-2">
        <div>
          <h1 className="text-[28px] font-medium text-slate-900 tracking-tight">Task Assignment</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-1">
            {activeSprintName} · <span className="text-emerald-600">{unassignedTasks.length} unassigned tasks</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedTasks.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-[14px] font-medium hover:bg-red-100 transition-all border border-red-200"
            >
              <Trash2 size={18} /> Bulk Delete ({selectedTasks.length})
            </button>
          )}
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#0D5F46] text-white rounded-xl text-[14px] font-medium hover:opacity-90 transition-all shadow-md shadow-emerald-900/10">
            <UserPlus size={18} /> Bulk Assign
          </button>
        </div>
      </div>

      {/* Unassigned Tasks Section */}
      <div className="px-8 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <input 
            type="checkbox" 
            checked={unassignedTasks.length > 0 && selectedTasks.length === unassignedTasks.length}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <h3 className="text-[12px] font-normal uppercase tracking-widest">Unassigned Tasks</h3>
        </div>
        
        <div className="flex flex-col gap-3">
          {unassignedTasks.length > 0 ? (
            unassignedTasks.map(task => (
              <TaskRow 
                key={task.id} 
                task={task} 
                teamMembers={teamMembers} 
                onAssign={handleAssign} 
                onDelete={handleDeleteTask}
                selected={selectedTasks.includes(task.id)}
                onToggle={() => toggleSelect(task.id)}
              />
            ))
          ) : (
            <div className="py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
              <p className="text-slate-500 font-medium text-[15px]">All tasks assigned!</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Capacity Section */}
      <div className="px-8 pb-12 flex flex-col gap-4">
        <h3 className="text-[12px] font-normal uppercase tracking-widest">Team Capacity</h3>
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex flex-col">
            {teamMembers.map((member, idx) => (
              <CapacityRow key={member.id} member={member} isLast={idx === teamMembers.length - 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function TaskRow({ task, teamMembers, onAssign, onDelete, selected, onToggle }: { task: Task, teamMembers: TeamMember[], onAssign: (taskId: string, userId: string) => void, onDelete: (taskId: string) => void, selected: boolean, onToggle: () => void }) {
  const typeLabel = task.type ? (task.type.charAt(0).toUpperCase() + task.type.slice(1).toLowerCase()) : 'Backend';
  
  return (
    <div className={`group flex items-center justify-between p-4 bg-white border ${selected ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-slate-100'} rounded-2xl hover:shadow-lg hover:shadow-slate-200/50 transition-all`}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <input 
          type="checkbox" 
          checked={selected}
          onChange={onToggle}
          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
        />
        <div className="flex items-center gap-3 w-20">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]" />
          <span className="text-[12px] font-normal">#T-{String(task.id || '').slice(-2)}</span>
        </div>
        <div className="flex-1 min-w-0 ml-4">
          <h4 className="text-[15px] font-medium text-slate-900 truncate">{task.title}</h4>
          <p className="text-[13px] text-slate-400 mt-0.5">
            {typeLabel} · {task.storyPoints || 0} pts · Due {task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'May 15'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <span className={`px-3 py-1 rounded-full text-[11px] font-medium tracking-wide capitalize ${
          task.priority === 'CRITICAL' || task.priority === 'HIGH' 
            ? 'bg-amber-50 text-amber-600' 
            : 'bg-blue-50 text-blue-600'
        }`}>
          {task.priority?.toLowerCase() || 'medium'}
        </span>
        
        <div className="relative">
          <select 
            onChange={(e) => onAssign(task.id, e.target.value)}
            className="pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 appearance-none cursor-pointer hover:border-emerald-300 transition-colors outline-none min-w-[140px]"
          >
            <option value="">— Assign to —</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.currentLoad}%)</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <button 
          onClick={() => onDelete(task.id)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-slate-200 ml-2"
          title="Delete Task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function CapacityRow({ member, isLast }: { member: TeamMember, isLast: boolean }) {
  const getStatus = (load: number) => {
    if (load > 90) return { label: 'Overloaded', color: 'bg-red-50 text-red-600', barColor: 'bg-red-500' };
    if (load > 75) return { label: 'High load', color: 'bg-amber-50 text-amber-600', barColor: 'bg-amber-500' };
    return { label: 'Available', color: 'bg-emerald-50 text-emerald-600', barColor: 'bg-emerald-500' };
  };

  const status = getStatus(member.currentLoad);

  return (
    <div className={`p-5 flex items-center gap-6 ${!isLast ? 'border-b border-slate-50' : ''}`}>
      <div className="flex items-center gap-4 w-64">
        <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-[14px] font-medium text-slate-600 uppercase">
          {member.name.charAt(0)}{member.name.split(' ')[1]?.charAt(0)}
        </div>
        <div>
          <h5 className="text-[14px] font-medium text-slate-900">{member.name}</h5>
          <p className="text-[12px] text-slate-400 font-medium">{member.role || 'Developer'}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-normal">{member.currentLoad}%</span>
          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium ${status.color}`}>{status.label}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${status.barColor} transition-all duration-1000 ease-out`} 
            style={{ width: `${member.currentLoad}%` }}
          />
        </div>
      </div>
    </div>
  );
}
