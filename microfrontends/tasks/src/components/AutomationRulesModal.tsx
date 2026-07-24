

import React, { useState, useEffect } from 'react';
import { X, Zap, Plus, Loader, Trash2, Shield, ArrowRight, Bell, UserPlus, Flag } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { useNotificationStore } from '../store/notificationStore';
import api from '../lib/api';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  actionData: string;
  isActive: boolean;
}

interface AutomationRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export default function AutomationRulesModal({ isOpen, onClose, projectId }: AutomationRulesModalProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { addNotification } = useNotificationStore();
  const members = useWorkflowStore(state => state.members);

  // New Rule Form
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('STATUS_CHANGED');
  const [targetStatus, setTargetStatus] = useState('DONE');
  const [action, setAction] = useState('SEND_NOTIFICATION');
  const [targetUser, setTargetUser] = useState('');

  useEffect(() => {
    if (isOpen) fetchRules();
  }, [isOpen, projectId]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/automations`);
      setRules(res.data || []);
    } catch (err) {
      console.error('Failed to fetch rules', err);
    } finally {
      setLoading(true);
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      const condition = { status: targetStatus };
      const actionData = { userId: targetUser || members[0]?.id, message: `Task automation triggered for ${name}` };
      
      const res = await api.post(`/projects/${projectId}/automations`, {
        name,
        trigger,
        condition,
        action,
        actionData
      });

      setRules([...rules, res.data]);
      addNotification({
        title: 'Automation Active',
        message: `Rule "${name}" is now monitoring project events.`,
        type: 'SUCCESS'
      });
      setName('');
    } catch (err) {
      console.error('Failed to create rule', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/projects/automations/${id}`);
      setRules(rules.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete rule error', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
              <Zap size={24} className="fill-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Neural Automations</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workflow Trigger Logic</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-200 flex items-center justify-center text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* BUILDER */}
          <form onSubmit={handleCreate} className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 shadow-2xl shadow-slate-900/20">
             <div className="flex items-center gap-3 mb-2">
                <Shield size={16} className="text-blue-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rule Architect</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Rule Label</label>
                   <input 
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     placeholder="e.g. Auto-notify Lead on Completion"
                     className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-blue-500/20 outline-none placeholder:text-slate-600"
                   />
                </div>

                <div className="space-y-4">
                   <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-3xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Zap size={10} /> If Trigger
                      </p>
                      <select 
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                        className="w-full bg-transparent text-sm font-black uppercase tracking-tight outline-none cursor-pointer"
                      >
                         <option value="STATUS_CHANGED">Status Changed</option>
                      </select>
                      <div className="mt-3 pt-3 border-t border-slate-700">
                         <p className="text-[9px] font-black text-slate-500 uppercase mb-2">To Status</p>
                         <select 
                           value={targetStatus}
                           onChange={(e) => setTargetStatus(e.target.value)}
                           className="w-full bg-slate-700 px-3 py-2 rounded-lg text-xs font-bold outline-none"
                         >
                            <option value="DONE">Done</option>
                            <option value="PR_SUBMITTED">In Review</option>
                            <option value="BLOCKED">Blocked</option>
                         </select>
                      </div>
                   </div>
                </div>

                <div className="space-y-4 flex flex-col justify-center items-center">
                   <ArrowRight className="text-slate-700" />
                </div>

                <div className="space-y-4 col-start-2 row-start-2">
                   <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-3xl">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Zap size={10} /> Then Action
                      </p>
                      <select 
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="w-full bg-transparent text-sm font-black uppercase tracking-tight outline-none cursor-pointer text-blue-400"
                      >
                         <option value="SEND_NOTIFICATION">Notify Operative</option>
                         <option value="ASSIGN_USER">Assign to User</option>
                      </select>
                      <div className="mt-3 pt-3 border-t border-blue-500/20">
                         <p className="text-[9px] font-black text-blue-400/60 uppercase mb-2">Target User</p>
                         <select 
                           value={targetUser}
                           onChange={(e) => setTargetUser(e.target.value)}
                           className="w-full bg-blue-600/20 px-3 py-2 rounded-lg text-xs font-bold outline-none border border-blue-500/30 text-white"
                         >
                            {members.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                         </select>
                      </div>
                   </div>
                </div>
             </div>

             <button 
               type="submit"
               disabled={creating || !name.trim()}
               className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
             >
               {creating ? <Loader className="animate-spin" size={16} /> : <Zap size={16} className="fill-white" />}
               Establish Automation
             </button>
          </form>

          {/* ACTIVE RULES */}
          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Operational Automation Flux</h3>
             {loading ? (
               <div className="flex justify-center py-12"><Loader className="animate-spin text-slate-300" /></div>
             ) : rules.length === 0 ? (
               <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[32px]">
                  <p className="text-sm font-bold text-slate-400">No active neural triggers detected.</p>
               </div>
             ) : (
               <div className="space-y-3">
                  {rules.map(rule => (
                    <div key={rule.id} className="group flex items-center justify-between p-6 bg-white border border-slate-200 rounded-[32px] hover:border-amber-200 transition-all">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                             {rule.action === 'SEND_NOTIFICATION' ? <Bell size={20} /> : <UserPlus size={20} />}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{rule.name}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">
                                   {rule.trigger}
                                </span>
                                <ArrowRight size={10} className="text-slate-300" />
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                                   {rule.action}
                                </span>
                             </div>
                          </div>
                       </div>
                       <button 
                         onClick={() => handleDelete(rule.id)}
                         className="w-10 h-10 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                       >
                          <Trash2 size={18} />
                       </button>
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

