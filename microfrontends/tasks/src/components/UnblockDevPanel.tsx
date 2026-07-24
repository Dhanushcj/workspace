

import React, { useEffect, useState } from 'react';
import { 
  X, AlertCircle, CircleCheck, 
  Clock, ArrowRight, Shield, 
  Loader, MessageSquare, User as UserIcon
} from 'lucide-react';
import api from '../lib/api';
import { useWorkflowStore } from '../store/workflowStore';
import { useNotificationStore } from '../store/notificationStore';

interface UnblockDevPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string | undefined;
}

export const UnblockDevPanel = ({ isOpen, onClose, sprintId }: UnblockDevPanelProps) => {
  const { resolveBlocker } = useWorkflowStore();
  const { addNotification } = useNotificationStore();
  
  const [blockers, setBlockers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBlockers = async () => {
    if (!sprintId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/blockers?sprintId=${sprintId}`);
      setBlockers(res.data);
    } catch (err) {
      console.error('Failed to fetch blockers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBlockers();
      setResolvingId(null);
      setResolutionNote('');
    }
  }, [isOpen, sprintId]);

  const handleResolve = async (blockerId: string) => {
    if (resolutionNote.length < 10) {
      addNotification({ title: 'Invalid Note', message: 'Resolution note must be at least 10 characters', type: 'WARNING' });
      return;
    }

    setIsSubmitting(true);
    const success = await resolveBlocker(blockerId, resolutionNote);
    
    if (success) {
      addNotification({ 
        title: 'Blocker Resolved', 
        message: 'The task has been moved back to In Progress.', 
        type: 'SUCCESS' 
      });
      fetchBlockers(); // Refresh list
      setResolvingId(null);
      setResolutionNote('');
    } else {
      addNotification({ 
        title: 'Error', 
        message: 'Failed to resolve blocker. Please try again.', 
        type: 'ERROR' 
      });
    }
    setIsSubmitting(false);
  };

  const getTimeBlocked = (createdAt: string) => {
    const hours = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h blocked`;
    return `${Math.floor(hours / 24)}d blocked`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end overflow-hidden pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] pointer-events-auto animate-in fade-in duration-500" 
        onClick={onClose} 
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] h-full flex flex-col pointer-events-auto animate-in slide-in-from-right duration-500">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                 <Shield size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Impediments</h2>
                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Team Lead Intervention Required</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400">
              <X size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
           {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-40">
                <Loader className="animate-spin" size={32} />
                <p className="text-xs font-black uppercase tracking-widest">Scanning Sprint for Blockers...</p>
             </div>
           ) : blockers.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-[24px] flex items-center justify-center text-emerald-500 mb-6">
                   <CircleCheck size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Clean Sprint</h3>
                <p className="text-sm font-medium text-slate-400">No developers are currently reporting impediments. Your team is flowing!</p>
             </div>
           ) : (
             blockers.map((blocker) => (
               <div key={blocker.id} className="group bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-red-500/5 transition-all">
                  <div className="flex items-start justify-between mb-4">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Blocked</span>
                           <span className="text-[10px] font-bold text-slate-300 tracking-tight flex items-center gap-1">
                              <Clock size={10} /> {getTimeBlocked(blocker.createdAt)}
                           </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-red-500 transition-colors">
                           {blocker.task.title}
                        </h4>
                     </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                     <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={12} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Dev Note:</span>
                     </div>
                     <div 
                        className="text-xs font-medium text-slate-600 leading-relaxed italic prose prose-slate max-w-none"
                        dangerouslySetInnerHTML={{ __html: `"${blocker.description}"` }}
                     />
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                           <UserIcon size={14} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-900 leading-none mb-1">{blocker.task.assignee?.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 leading-none">Primary Developer</p>
                        </div>
                     </div>

                     {resolvingId !== blocker.id ? (
                       <button 
                         onClick={() => setResolvingId(blocker.id)}
                         className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-slate-900/10"
                       >
                          Resolve Blocker
                       </button>
                     ) : (
                       <button 
                         onClick={() => setResolvingId(null)}
                         className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900"
                       >
                          Cancel
                       </button>
                     )}
                  </div>

                  {resolvingId === blocker.id && (
                    <div className="mt-6 pt-6 border-t border-dashed border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Resolution Note* (Min 10 chars)</label>
                       <textarea 
                         autoFocus
                         value={resolutionNote}
                         onChange={(e) => setResolutionNote(e.target.value)}
                         placeholder="Explain how the impediment was resolved..."
                         className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none mb-4"
                         rows={3}
                       />
                       <button 
                         disabled={isSubmitting || resolutionNote.length < 10}
                         onClick={() => handleResolve(blocker.id)}
                         className="w-full py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/30 hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                          {isSubmitting ? <Loader className="animate-spin" size={14} /> : <CircleCheck size={14} />}
                          Confirm Resolution
                       </button>
                    </div>
                  )}
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

