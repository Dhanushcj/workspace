'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, ChevronDown, Loader, AlertCircle, Save, Ban, Bug, Edit3 } from 'lucide-react';
import { Task, useWorkflowStore } from '../store/workflowStore';
import { marked } from 'marked';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { MessageSquare, Send, User, BookOpen, Target, CheckSquare, Plus, Trash2, Layers, GitBranch } from 'lucide-react';
import { RaiseBugModal } from './RaiseBugModal';

const ChecklistEditor = ({
  label, icon, items, onChange, isDeveloper, textKey = 'text'
}: {
  label: string; icon: React.ReactNode; items: any[]; onChange: (items: any[]) => void; isDeveloper: boolean; textKey?: string;
}) => {
  const addItem = () => onChange([...items, { id: Date.now().toString(), [textKey]: '', completed: false }]);
  const updateItem = (idx: number, val: string) => {
    const updated = [...items];
    updated[idx][textKey] = val;
    onChange(updated);
  };
  const toggleItem = (idx: number) => {
    const updated = [...items];
    updated[idx].completed = !updated[idx].completed;
    onChange(updated);
  };
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between ml-1">
        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          {icon} {label}
        </label>
        {!isDeveloper && (
          <button type="button" onClick={addItem} className="text-[10px] flex items-center gap-1 font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-wider">
            <Plus size={12} /> Add
          </button>
        )}
      </div>
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start gap-2 group">
              <button 
                type="button" 
                onClick={() => toggleItem(idx)}
                className={`mt-1.5 shrink-0 flex items-center justify-center w-4 h-4 rounded border ${item.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 hover:border-indigo-400'}`}
              >
                {item.completed && <CheckSquare size={12} />}
              </button>
              {isDeveloper ? (
                <div className={`text-[13px] flex-1 pt-1 ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {item[textKey]}
                </div>
              ) : (
                <input
                  type="text"
                  value={item[textKey]}
                  onChange={e => updateItem(idx, e.target.value)}
                  className={`flex-1 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all ${item.completed ? 'line-through text-slate-400' : ''}`}
                />
              )}
              {!isDeveloper && (
                <button type="button" onClick={() => removeItem(idx)} className="p-1.5 mt-0.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  displayId: string;
}

export const TaskDetailModal = ({ 
  isOpen, 
  onClose, 
  task,
  displayId
}: TaskDetailModalProps) => {
  const { updateTask, statuses, members } = useWorkflowStore();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const rawRole = (user?.role || '').toUpperCase().replace(' ', '_');
  const isTeamLeadOrManager = ['TEAM_LEAD', 'LEAD', 'MANAGER', 'SUPER_ADMIN', 'ADMIN', 'COMPANY-ADMIN', 'COMPANY_ADMIN'].includes(rawRole);
  const isDeveloper = !isTeamLeadOrManager;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assigneeId: '',
    storyPoints: 1,
    moduleName: '',
    featureName: '',
    subtasks: [] as any[],
    requirements: [] as any[],
    acceptanceCriteria: [] as any[]
  });
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isRaiseBugOpen, setIsRaiseBugOpen] = useState(false);

  const handleRaiseBugSubmit = async (taskId: string, description: string) => {
    try {
      await api.post('/issues', {
        title: `Bug in ${task?.title || 'Task'}`,
        description: description,
        type: 'BUG',
        priority: 'HIGH',
        status: 'TO_DO',
        projectId: task?.projectId,
        sprintId: task?.sprintId,
        parentId: taskId,
        assigneeId: user?.id
      });
      addToast({ type: 'SUCCESS', title: 'Bug Raised', message: 'Bug has been reported to the team.' });
      
      useWorkflowStore.getState().fetchTasks({ 
        projectId: useWorkflowStore.getState().currentProject?.id || '', 
        sprintId: useWorkflowStore.getState().currentSprint?.id || '' 
      });
      useWorkflowStore.getState().fetchBugs();
      setIsRaiseBugOpen(false);
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Failed', message: 'Could not raise bug.' });
    }
  };

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TO_DO',
        priority: task.priority || 'MEDIUM',
        assigneeId: task.assigneeId || '',
        storyPoints: task.storyPoints || task.estimate || 1,
        moduleName: task.moduleName || '',
        featureName: task.featureName || '',
        subtasks: task.subtasks || [],
        requirements: task.requirements || [],
        acceptanceCriteria: task.acceptanceCriteria || []
      });
      fetchComments();
    }
  }, [task]);

  const fetchComments = async () => {
    if (!task) return;
    try {
      const tid = task.id || (task as any)._id;
      const res = await api.get(`/tasks/${tid}/comments`);
      setComments(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    setCommentLoading(true);
    try {
      const tid = task.id || (task as any)._id;
      await api.post(`/tasks/${tid}/comments`, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Failed', message: 'Could not post comment.' });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleSave = async () => {
    if (!task) return;
    setLoading(true);
    try {
      const tid = task.id || (task as any)._id;
      const success = await updateTask(tid, formData);
      if (success) {
        addToast({ type: 'SUCCESS', title: 'Task Updated', message: `"${formData.title}" saved successfully.` });
        onClose();
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Save Failed', message: 'Could not save task changes.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px]" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-slate-50 bg-slate-50/30 shrink-0">
          <h2 className="text-[18px] font-bold text-slate-800 flex items-center gap-2">
            <span className="text-slate-400 font-medium">{displayId} —</span> {formData.title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-2 gap-8">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1">Status</label>
              <div className="relative group">
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-medium appearance-none cursor-pointer focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                >
                  {statuses.length > 0 ? statuses.map(s => (
                    <option key={s.id} value={s.key}>{s.name}</option>
                  )) : (
                    <>
                      <option value="TO_DO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="CODE_REVIEW">Code Review</option>
                      <option value="TESTING">Testing</option>
                      <option value="DONE">Done</option>
                      <option value="BLOCKED">Blocked</option>
                    </>
                  )}
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1">Priority</label>
              <div className="relative group">
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-medium appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assignee</label>
              <div className="relative group">
                <select 
                  value={formData.assigneeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                  disabled={isDeveloper}
                  className={`w-full pl-4 pr-10 py-3.5 border rounded-2xl text-[14px] font-medium appearance-none outline-none transition-all ${
                    isDeveloper 
                      ? 'bg-slate-100/50 border-slate-100 text-slate-500 cursor-not-allowed' 
                      : 'bg-slate-50 border-slate-100 cursor-pointer focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white'
                  }`}
                >
                  <option value="">Unassigned</option>
                  {members.filter((m: any) => m.role !== 'Manager').map(m => (
                    <option key={m.id || (m as any)._id} value={m.id || (m as any)._id}>{m.name}</option>
                  ))}
                </select>
                {!isDeveloper && <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />}
              </div>
            </div>

            {/* Story Points */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1">Story Points</label>
              <div className="relative group">
                <select 
                  value={formData.storyPoints}
                  onChange={(e) => setFormData(prev => ({ ...prev, storyPoints: Number(e.target.value) }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-medium appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                >
                  {[1, 2, 3, 5, 8, 13, 21].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>

            {/* Module Name */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Layers size={14} /> Module
              </label>
              <input
                type="text"
                value={formData.moduleName}
                onChange={e => setFormData(prev => ({ ...prev, moduleName: e.target.value }))}
                disabled={isDeveloper}
                placeholder="No Module"
                className={`w-full px-4 py-3.5 border rounded-2xl text-[14px] font-medium outline-none transition-all ${
                  isDeveloper
                    ? 'bg-slate-100/50 border-slate-100 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white'
                }`}
              />
            </div>

            {/* Feature Name */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <GitBranch size={14} /> Feature
              </label>
              <input
                type="text"
                value={formData.featureName}
                onChange={e => setFormData(prev => ({ ...prev, featureName: e.target.value }))}
                disabled={isDeveloper}
                placeholder="No Feature"
                className={`w-full px-4 py-3.5 border rounded-2xl text-[14px] font-medium outline-none transition-all ${
                  isDeveloper
                    ? 'bg-slate-100/50 border-slate-100 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
              {!isDeveloper && !isEditingDesc && (
                <button onClick={() => setIsEditingDesc(true)} className="text-[10px] flex items-center gap-1 font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-wider">
                  <Edit3 size={12} /> Edit
                </button>
              )}
            </div>
            
            {(!isDeveloper && isEditingDesc) ? (
              <div className="space-y-2">
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add more details using markdown..."
                  rows={6}
                  className="w-full px-5 py-4 bg-white border-2 border-indigo-100 rounded-[20px] text-[14px] font-medium focus:outline-none focus:border-indigo-500 transition-all resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditingDesc(false)} className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Done Editing</button>
                </div>
              </div>
            ) : (
              <div 
                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-[20px] text-[14px] prose prose-sm prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.description ? marked.parse(formData.description) : '<p class="text-slate-400 italic">No description provided</p>' }}
              />
            )}
          </div>

          <div className="relative pt-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Task Checklist</span>
            </div>
          </div>

          {/* Requirements */}
          <ChecklistEditor
            label="Requirements"
            icon={<BookOpen size={14} />}
            items={formData.requirements}
            onChange={(items) => setFormData(prev => ({ ...prev, requirements: items }))}
            isDeveloper={isDeveloper}
          />

          {/* Acceptance Criteria */}
          <ChecklistEditor
            label="Acceptance Criteria"
            icon={<Target size={14} />}
            items={formData.acceptanceCriteria}
            onChange={(items) => setFormData(prev => ({ ...prev, acceptanceCriteria: items }))}
            isDeveloper={isDeveloper}
          />

          {/* Subtasks */}
          <ChecklistEditor
            label="Subtasks"
            icon={<CheckSquare size={14} />}
            items={formData.subtasks}
            onChange={(items) => setFormData(prev => ({ ...prev, subtasks: items }))}
            isDeveloper={isDeveloper}
            textKey="title"
          />

          {/* Comments Section */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                   <MessageSquare size={16} className="text-indigo-500" /> Comments
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{comments.length} discussion points</span>
             </div>
             
             <div className="space-y-4 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                {comments.map((comment, idx) => (
                  <div key={comment.id || idx} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-[10px] font-black shrink-0 border border-indigo-100">
                        {comment.author?.name ? comment.author.name.split(' ').map((n:any) => n[0]).join('').toUpperCase() : 'U'}
                     </div>
                     <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[12px] font-bold text-slate-900">{comment.author?.name}</span>
                           <span className="text-[10px] text-slate-400">
                              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        <p className="text-[13px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100">
                           {comment.content}
                        </p>
                     </div>
                  </div>
                ))}
                
                {comments.length === 0 && (
                  <div className="py-4 text-center">
                    <p className="text-[12px] text-slate-400 italic">No comments yet. Start the discussion!</p>
                  </div>
                )}
             </div>

             <div className="relative group">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Type a comment..." 
                  className="w-full pl-5 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-[14px] font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
                <button 
                  onClick={handleAddComment}
                  disabled={commentLoading || !newComment.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                   {commentLoading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
             </div>
          </div>

          {/* Tags / Meta Info */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-100">
              {formData.priority}
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200">
              {task.type || 'BACKEND'}
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200">
              {useWorkflowStore.getState().currentSprint?.name || 'No Sprint'}
            </span>
            {useWorkflowStore.getState().currentSprint?.endDate && (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                Due: {new Date(useWorkflowStore.getState().currentSprint!.endDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-50">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-[13px] font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all border border-transparent"
            >
              Close
            </button>
            <button 
              type="button"
              onClick={() => setIsRaiseBugOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-xl text-[13px] font-bold hover:bg-rose-100 transition-all border border-rose-100"
            >
              <Bug size={16} /> Raise Bug
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-[#0D5F46] text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20 active:scale-95"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <RaiseBugModal 
        isOpen={isRaiseBugOpen}
        onClose={() => setIsRaiseBugOpen(false)}
        task={task ? { id: task.id || (task as any)._id, title: task.title } : null}
        onSubmit={handleRaiseBugSubmit}
      />
    </div>
  );
};
