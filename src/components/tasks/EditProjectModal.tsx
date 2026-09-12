import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import toast from 'react-hot-toast';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

export const EditProjectModal = ({ isOpen, onClose, project }: EditProjectModalProps) => {
  const updateProject = useWorkflowStore(state => state.updateProject);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project && isOpen) {
      setName(project.name || '');
      setDescription(project.description || '');
    }
  }, [project, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      await updateProject(project.id || project._id, { name, description });
      toast.success('Project updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800">Edit Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB] transition-all" 
              required 
              disabled={isSaving} 
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description (Optional)</label>
            <textarea 
              rows={3} 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB] transition-all resize-none" 
              disabled={isSaving} 
            />
          </div>

          {/* Assigned Members (Read-only view) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Assigned Members</label>
            <div className="flex flex-wrap gap-2">
              {project?.members && project.members.length > 0 ? (
                project.members.map((member: any) => (
                  <div key={member.userId} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 shadow-sm">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold overflow-hidden shrink-0">
                      {member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" /> : (member.name?.charAt(0)?.toUpperCase() || 'U')}
                    </div>
                    <span className="text-[12px] font-medium text-slate-700">{member.name}</span>
                  </div>
                ))
              ) : (
                <span className="text-[12px] text-slate-400 italic">No members assigned to this project yet.</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors" 
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2" 
              disabled={isSaving}
            >
              {isSaving ? <Loader size={16} className="animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

