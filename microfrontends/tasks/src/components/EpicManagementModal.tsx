

import React, { useState } from 'react';
import { X, Plus, Layers, CircleCheck, Loader, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { useNotificationStore } from '../store/notificationStore';

interface EpicManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export default function EpicManagementModal({ isOpen, onClose, projectId }: EpicManagementModalProps) {
  const { epics, createEpic, fetchEpics } = useWorkflowStore();
  const { addNotification } = useNotificationStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const result = await createEpic({
        name: name.trim(),
        description: description.trim(),
        color,
        projectId
      });

      if (result) {
        addNotification({
          title: 'Epic Created',
          message: `Epic "${name}" has been successfully added to the project roadmap.`,
          type: 'SUCCESS'
        });
        setName('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create epic', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Roadmap Epics</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Strategic Hierarchy Management</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-200 flex items-center justify-center text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* CREATE FORM */}
          <form onSubmit={handleCreate} className="bg-slate-50 p-6 rounded-[32px] border border-slate-200 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initialize New Epic</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Epic Name (e.g. Infrastructure V2)"
                className="col-span-2 w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
              />
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level description..."
                rows={2}
                className="col-span-2 w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
              />
              <div className="flex items-center gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-all ${color === c ? 'ring-4 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button 
                type="submit"
                disabled={loading || !name.trim()}
                className="bg-slate-900 text-white py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader className="animate-spin" size={14} /> : <Plus size={14} />}
                Add Epic
              </button>
            </div>
          </form>

          {/* LIST */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Current Active Epics</h3>
            {epics.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[32px]">
                 <p className="text-sm font-bold text-slate-400">No epics defined for this project.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {epics.map(epic => (
                  <div key={epic.id} className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-3xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: epic.color }} />
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{epic.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{epic.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       {/* In a full app, we'd show task count here */}
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

