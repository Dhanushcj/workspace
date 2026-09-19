'use client';

import React, { useEffect, useState } from 'react';
import {
  X, Calendar, ChevronDown, Loader, AlertCircle, Plus,
  Trash2, BookOpen, Target, CheckSquare, Layers, GitBranch
} from 'lucide-react';
import { Task, useWorkflowStore } from '../../store/workflowStore';
import { useNotificationStore } from '../../store/notificationStore';
import api from '../../lib/api';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onTaskCreated: (task: Task) => void;
}

// Reusable list item editor
const ListEditor = ({
  label,
  icon,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) => {
  const addItem = () => onChange([...items, '']);
  const updateItem = (idx: number, val: string) => {
    const updated = [...items];
    updated[idx] = val;
    onChange(updated);
  };
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          {icon} {label}
        </label>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-[11px] font-bold text-[#1B4FAB] hover:text-blue-700 transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
              <input
                type="text"
                value={item}
                onChange={e => updateItem(idx, e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="p-1 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <p className="text-[11px] text-slate-400 italic px-1">None added yet. Click Add to create items.</p>
      )}
    </div>
  );
};

export const CreateTaskModal = ({
  isOpen,
  onClose,
  projectId,
  onTaskCreated
}: CreateTaskModalProps) => {
  // Core fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [testerId, setTesterId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [storyPoints, setStoryPoints] = useState('1');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState('FEATURE');
  const [sprintId, setSprintId] = useState('');

  // Task hierarchy
  const [moduleName, setModuleName] = useState('');
  const [featureName, setFeatureName] = useState('');

  // Checklists
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([]);

  // Data
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
    setTesterId('');
    setPriority('MEDIUM');
    setStoryPoints('1');
    setEstimatedHours('');
    setDueDate('');
    setType('FEATURE');
    setModuleName('');
    setFeatureName('');
    setSubtasks([]);
    setRequirements([]);
    setAcceptanceCriteria([]);
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
      if (!projectId) throw new Error('Project ID is missing');

      // Filter empty items
      const cleanSubtasks = subtasks.filter(s => s.trim());
      const cleanRequirements = requirements.filter(r => r.trim());
      const cleanCriteria = acceptanceCriteria.filter(c => c.trim());

      const body: any = {
        title: title.trim(),
        description,
        type: (type || 'FEATURE').toUpperCase(),
        priority: (priority || 'MEDIUM').toUpperCase(),
        projectId,
        sprintId: sprintId === 'backlog' ? null : sprintId,
        storyPoints: Number(storyPoints) || 1,
        assigneeId: assignedTo || undefined,
        testerId: testerId || undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        dueDate: dueDate || undefined,
        moduleName: moduleName.trim() || undefined,
        featureName: featureName.trim() || undefined,
        subtasks: cleanSubtasks,
        requirements: cleanRequirements,
        acceptanceCriteria: cleanCriteria,
      };

      const res = await api.post('/issues', body);
      const createdTask = res.data?.data || res.data?.task || res.data;

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
        throw new Error('Task creation returned no valid data (missing ID)');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create task';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB] outline-none transition-all";
  const selectCls = "w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] appearance-none cursor-pointer focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB] outline-none";
  const labelCls = "text-[12px] font-bold text-slate-500 uppercase tracking-wide";

  const developers = members.filter((m: any) => {
    const r = (m.role || '').toUpperCase().replace(/ /g, '_');
    return !['TEAM_LEAD', 'LEAD', 'MANAGER', 'ADMIN'].includes(r);
  });
  const testers = members.filter((m: any) => {
    const r = (m.role || '').toUpperCase().replace(/ /g, '_');
    return r === 'TESTER' || r === 'QA' || r === 'DEVELOPER' || r === 'MEMBER';
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-slate-100 shrink-0 bg-gradient-to-r from-[#1B4FAB]/5 to-transparent">
          <div>
            <h2 className="text-[18px] font-black text-slate-900">Create New Task</h2>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Assign and define task details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0">
          <div className="p-8 space-y-7 overflow-y-auto flex-1">

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-[13px]">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className={labelCls}>Task Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Create Student Registration Form with Validation"
                autoFocus
                className={inputCls}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className={labelCls}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what needs to be done, why, and any important context..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Module + Feature */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`${labelCls} flex items-center gap-1`}><Layers size={11} /> Module</label>
                <input
                  value={moduleName}
                  onChange={e => setModuleName(e.target.value)}
                  placeholder="e.g. Student Management"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className={`${labelCls} flex items-center gap-1`}><GitBranch size={11} /> Feature</label>
                <input
                  value={featureName}
                  onChange={e => setFeatureName(e.target.value)}
                  placeholder="e.g. Student Registration"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Assignee + Tester */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Assign to Developer</label>
                <div className="relative">
                  <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className={selectCls}>
                    <option value="">Unassigned</option>
                    {members.map((m: any) => (
                      <option key={m.id || m._id} value={m.id || m._id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Assign to Tester</label>
                <div className="relative">
                  <select value={testerId} onChange={e => setTesterId(e.target.value)} className={selectCls}>
                    <option value="">Auto-assign</option>
                    {members.map((m: any) => (
                      <option key={m.id || m._id} value={m.id || m._id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Priority + Type + Story Points + Est Hours */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Priority</label>
                <div className="relative">
                  <select value={priority} onChange={e => setPriority(e.target.value)} className={selectCls}>
                    <option value="CRITICAL">🔴 Critical</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="LOW">⚪ Low</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Type</label>
                <div className="relative">
                  <select value={type} onChange={e => setType(e.target.value)} className={selectCls}>
                    <option value="FEATURE">Feature</option>
                    <option value="BACKEND">Backend</option>
                    <option value="FRONTEND">Frontend</option>
                    <option value="DESIGN">Design</option>
                    <option value="BUG">Bug Fix</option>
                    <option value="TESTING">Testing</option>
                    <option value="RESEARCH">Research</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Story Points</label>
                <div className="relative">
                  <select value={storyPoints} onChange={e => setStoryPoints(e.target.value)} className={selectCls}>
                    {[1, 2, 3, 5, 8, 13, 21].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Est. Hours</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={estimatedHours}
                  onChange={e => setEstimatedHours(e.target.value)}
                  placeholder="e.g. 4"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Due Date + Sprint */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Due Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={inputCls}
                  />
                  <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Sprint</label>
                <div className="relative">
                  <select value={sprintId} onChange={e => setSprintId(e.target.value)} className={selectCls}>
                    <option value="backlog">Backlog (Unplanned)</option>
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Task Checklist</span>
              </div>
            </div>

            {/* Requirements */}
            <ListEditor
              label="Requirements"
              icon={<BookOpen size={12} />}
              items={requirements}
              onChange={setRequirements}
              placeholder="e.g. Developer must validate email format"
            />

            {/* Acceptance Criteria */}
            <ListEditor
              label="Acceptance Criteria"
              icon={<Target size={12} />}
              items={acceptanceCriteria}
              onChange={setAcceptanceCriteria}
              placeholder="e.g. User can successfully register with valid email"
            />

            {/* Subtasks */}
            <ListEditor
              label="Subtasks"
              icon={<CheckSquare size={12} />}
              items={subtasks}
              onChange={setSubtasks}
              placeholder="e.g. Create HTML form structure"
            />
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50">
            <div className="text-[11px] text-slate-400">
              {[subtasks, requirements, acceptanceCriteria].reduce((sum, arr) => sum + arr.filter(Boolean).length, 0)} checklist items
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-[13px] font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || dataLoading}
                className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white rounded-xl transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1B4FAB 0%, #2563EB 100%)', boxShadow: '0 4px 16px rgba(27,79,171,0.3)' }}
              >
                {loading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                Create Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
