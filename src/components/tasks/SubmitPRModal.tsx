'use client';

import React, { useState } from 'react';
import { X, GitPullRequest, Loader, Info, Terminal, CircleCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
  } | null;
  onSubmit: (taskId: string, prData: any) => Promise<void>;
}

export const SubmitPRModal: React.FC<Props> = ({ isOpen, onClose, task, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    branchName: '',
    commitHash: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form data when task changes or modal opens
  React.useEffect(() => {
    if (isOpen && task) {
      setFormData({
        title: task.title,
        branchName: '',
        commitHash: '',
        description: ''
      });
      setError(null);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const isValid = 
    formData.title.trim().length > 0 &&
    formData.branchName.trim().length >= 3 &&
    /^[a-z0-9\-/]+$/.test(formData.branchName.trim()) &&
    /^[a-f0-9]{7,}$/i.test(formData.commitHash.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);
    try {
      if (!task) throw new Error('No task selected');
      await onSubmit(task.id, {
        ...formData,
        title: formData.title.trim(),
        branchName: formData.branchName.trim(),
        commitHash: formData.commitHash.trim(),
        description: formData.description.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit PR. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6">
      <div 
        className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-2xl bg-[#1e293b] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
              <GitPullRequest size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Submit Pull Request</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{task.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-400 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
              <Info size={18} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PR Title */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">PR Title*</label>
              <input 
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                maxLength={100}
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all"
                placeholder="Feature: User authentication flow"
              />
            </div>

            {/* Branch Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch Name*</label>
                {!/^[a-z0-9\-/]*$/.test(formData.branchName) && formData.branchName && (
                  <span className="text-[8px] font-bold text-red-500 uppercase">Invalid Format</span>
                )}
              </div>
              <div className="relative">
                 <Terminal size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                 <input 
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData({...formData, branchName: e.target.value.toLowerCase()})}
                  className="w-full pl-11 pr-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-mono text-indigo-300 focus:border-indigo-500 outline-none transition-all"
                  placeholder="feature/auth-flow"
                />
              </div>
            </div>

            {/* Commit Hash */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commit Hash (SHA)*</label>
              <input 
                type="text"
                value={formData.commitHash}
                onChange={(e) => setFormData({...formData, commitHash: e.target.value})}
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-mono text-emerald-400 focus:border-emerald-500 outline-none transition-all"
                placeholder="a3f2c1b"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description (Optional)</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                maxLength={500}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white focus:border-indigo-500 outline-none transition-all resize-none"
                placeholder="What did you build? Any specific areas for review?"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !isValid}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:bg-slate-800 disabled:text-slate-600 disabled:translate-y-0 disabled:shadow-none"
            >
              {loading ? <Loader className="animate-spin" size={16} /> : <CircleCheck size={16} />}
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

