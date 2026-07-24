

import React, { useState } from 'react';
import { 
  X, Settings, Plus, Trash2, 
  GripVertical, Palette, Check,
  AlertCircle
} from 'lucide-react';
import { useWorkflowStore, Status } from '../store/workflowStore';

interface WorkflowSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const WorkflowSettingsModal = ({ isOpen, onClose, projectId }: WorkflowSettingsModalProps) => {
  const { statuses, addStatus, updateStatus, deleteStatus } = useWorkflowStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#94A3B8');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!newName) return;
    try {
      await addStatus(projectId, { 
        name: newName, 
        color: newColor, 
        order: statuses.length 
      });
      setNewName('');
      setIsAdding(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add status');
    }
  };

  const handleDelete = async (statusId: string) => {
    const success = await deleteStatus(statusId);
    if (!success) {
      alert('Cannot delete status while it has active tasks.');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Board Settings</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customize Workflow Columns</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
           {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
               <AlertCircle size={16} />
               {error}
             </div>
           )}

           <div className="space-y-3">
              {statuses.map((status, index) => (
                <div 
                  key={status.id}
                  className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl group hover:border-blue-200 transition-all shadow-sm"
                >
                  <div className="cursor-grab text-slate-300 group-hover:text-slate-400">
                    <GripVertical size={18} />
                  </div>
                  <div 
                    className="w-3 h-8 rounded-full" 
                    style={{ backgroundColor: status.color }} 
                  />
                  <div className="flex-1">
                    <div className="text-sm font-black text-slate-700">{status.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{status.key}</div>
                  </div>
                  <button 
                    onClick={() => handleDelete(status.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {isAdding ? (
                <div className="p-6 border-2 border-dashed border-blue-200 rounded-3xl bg-blue-50/30 space-y-4 animate-in slide-in-from-top-2">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Column Name</label>
                        <input 
                          autoFocus
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                          placeholder="e.g. In Review"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Color Label</label>
                        <div className="flex gap-2 flex-wrap">
                          {['#94A3B8', '#2563EB', '#E11D48', '#059669', '#4F46E5', '#F59E0B'].map(c => (
                            <button 
                              key={c}
                              onClick={() => setNewColor(c)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${newColor === c ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                   </div>
                   <div className="flex justify-end gap-3 pt-2">
                      <button 
                        onClick={() => setIsAdding(false)}
                        className="px-4 py-2 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                      >
                         Cancel
                      </button>
                      <button 
                        onClick={handleAdd}
                        disabled={!newName}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
                      >
                         Add Column
                      </button>
                   </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                >
                  <Plus size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Add New Column</span>
                </button>
              )}
           </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
           <button 
             onClick={onClose}
             className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all"
           >
              Done
           </button>
        </div>
      </div>
    </div>
  );
};

