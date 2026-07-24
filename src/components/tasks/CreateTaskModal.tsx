'use client';

import React, { useEffect, useState } from 'react';
import { X, Calendar, ChevronDown, Loader, AlertCircle, Plus } from 'lucide-react';
import { Task, useWorkflowStore } from '../../store/workflowStore';
import { useNotificationStore } from '../../store/notificationStore';
import api from '../../lib/api';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onTaskCreated: (task: Task) => void;
}

export const CreateTaskModal = ({ 
  isOpen, 
  onClose, 
  projectId, 
  onTaskCreated 
}: CreateTaskModalProps) => {
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [storyPoints, setStoryPoints] = useState('1');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('BACKEND');
  const [sprintId, setSprintId] = useState('');

  // Data State
  const members = useWorkflowStore(state => state.members);
  const [sprints, setSprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setDataLoading(true);
      try {
        const [sprintsRes, membersRes] = await Promise.all([
          api.get(`/projects/${projectId}/sprints`),
          api.get(`/members/${JSON.parse(localStorage.getItem('auth') || '{}').workspaceId || 'forge-india-connect'}`)
        ]);
        
        const sprintList = (Array.isArray(sprintsRes.data) ? sprintsRes.data : (sprintsRes.data?.data || []))
          .map((s: any) => ({ ...s, id: s.id || s._id }));
        
        setSprints(sprintList);
        
        let apiData = Array.isArray(membersRes.data) ? membersRes.data : (membersRes.data?.data || []);
        apiData = apiData.map((item: any) => ({ ...item, id: item.id || item._id, _id: item._id || item.id }));
        useWorkflowStore.setState({ members: apiData });
        
        // Default to active sprint if found
        const active = sprintList.find((s: any) => s?.status === 'ACTIVE' || s?.status === 'PLANNING');
        if (active) setSprintId(active?.id);
      } catch (err) {
        console.error('Failed to load modal data', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
    resetForm();
  }, [isOpen, projectId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setPriority('MEDIUM');
    setStoryPoints('1');
    setDueDate(new Date().toISOString().split('T')[0]);
    setType('BACKEND');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!projectId) throw new Error('Project ID is missing from props');
      
      const body = {
        title,
        description,
        type: (type || 'FEATURE').toUpperCase(),
        priority: (priority || 'MEDIUM').toUpperCase(),
        projectId: projectId,
        sprintId: sprintId === 'backlog' ? null : sprintId,
        storyPoints: Number(storyPoints) || 1,
      };

      console.log('[DEBUG] Sending body:', body);

      const res = await api.post('/issues', body);
      const createdTask = res.data?.data || res.data?.task || res.data;
      
      console.log('[DEBUG] Created Task response:', createdTask);
      
      if (createdTask && (createdTask?.id || createdTask?._id)) {
        onTaskCreated(createdTask);
        
        const { addNotification } = useNotificationStore.getState();
        addNotification({
          title: 'Task Created',
          message: `"${title}" has been added.`,
          type: 'SUCCESS'
        });
        onClose();
      } else {
        console.error('[DEBUG] Task creation returned no ID:', createdTask);
        throw new Error('Task creation returned no valid data (missing ID)');
      }
    } catch (err: any) {
      console.error('[DEBUG] handleSubmit caught error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to create task';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-[18px] font-semibold text-slate-800">Create New Task</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-all text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-[13px]">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-slate-600">Task title *</label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-slate-600">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-600">Priority</label>
              <div className="relative">
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Story Points */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-600">Story Points</label>
              <div className="relative">
                <select 
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  {[1, 2, 3, 5, 8, 13, 21].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-600">Assign to (Total: {members.length})</label>
              <div className="relative">
                <select 
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.id || m._id} value={m.id || m._id}>{m.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-600">Due Date</label>
              <div className="relative">
                <input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
                <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Sprint */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-600">Sprint</label>
              <div className="relative">
                <select 
                  value={sprintId}
                  onChange={(e) => setSprintId(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="backlog">Backlog (Unplanned)</option>
                  {sprints.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Task Type */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-600">Task Type</label>
              <div className="relative">
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="BACKEND">Backend</option>
                  <option value="FRONTEND">Frontend</option>
                  <option value="DESIGN">Design</option>
                  <option value="BUG">Bug</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-[14px] font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || dataLoading}
              className="flex items-center gap-2 px-6 py-2 bg-[#0D5F46] text-white rounded-lg text-[14px] font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
