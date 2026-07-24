'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, AlertCircle, Loader } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
  } | null;
  onSubmit: (taskId: string, description: string) => Promise<void>;
}

export const RaiseBlockerModal: React.FC<Props> = ({ isOpen, onClose, task, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when task changes or modal opens
  React.useEffect(() => {
    if (isOpen && task) {
      setDescription('');
      setError(null);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const isValid = description.trim().length >= 20 && description.trim().length <= 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);
    try {
      await onSubmit(task.id, description.trim());
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to raise blocker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-xl bg-white rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Report Blocker</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{task.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Blocker Description*</label>
               <span className={`text-[10px] font-bold ${description.length > 500 ? 'text-red-500' : 'text-slate-400'}`}>
                 {description.length}/500
               </span>
            </div>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe what's blocking you — error, missing access, unclear requirement, dependency issue..."
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none placeholder:text-slate-400"
            />
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
               <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                 <span className="text-slate-800 font-bold block mb-1 not-italic">Pro-tip:</span>
                 Include what you were trying to do, the error received, and what is needed to unblock you.
               </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-700 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !isValid}
              className="flex-[2] py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:translate-y-0 disabled:shadow-none"
            >
              {loading ? <Loader className="animate-spin" size={16} /> : <ShieldAlert size={16} />}
              {loading ? 'Submitting...' : 'Submit Blocker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

