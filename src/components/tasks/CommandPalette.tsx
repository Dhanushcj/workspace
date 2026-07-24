'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Command, CircleCheck, 
  Clock, AlertCircle, Users, 
  Zap, FileText, ArrowRight, X, Plus, RefreshCw
} from 'lucide-react';
import { useWorkflowStore, Task } from '../../store/workflowStore';
import { clearLocalData } from '../../lib/resetData';
import { applyIntegratedData } from '../../lib/integratedData';
import { toast } from 'sonner';


export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { tasks } = useWorkflowStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filteredTasks = query === '' 
    ? tasks.slice(0, 5)
    : tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || t.id.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
           <Search size={24} className="text-slate-400" />
           <input 
             autoFocus
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             placeholder="Search tasks, team members, or commands..."
             className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-slate-900 placeholder:text-slate-300"
           />
           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
              <span className="text-[10px] font-black text-slate-400">ESC</span>
           </div>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
           {filteredTasks.length > 0 ? (
             <div className="space-y-6">
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 px-4 mb-4">Quick Results</h3>
                   <div className="space-y-1">
                      {filteredTasks.map(task => (
                        <button 
                          key={task.id}
                          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group text-left"
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                task.status === 'DONE' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'
                              }`}>
                                 <FileText size={20} />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-black text-slate-400">{task.id}</span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                      task.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
                                    }`}>{task.priority}</span>
                                 </div>
                                 <p className="text-sm font-bold text-slate-700 truncate max-w-[400px]">{task.title}</p>
                              </div>
                           </div>
                           <ArrowRight size={16} className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                   </div>
                </div>

                <div className="border-t border-slate-50 pt-6">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 px-4 mb-4">Shortcuts</h3>
                   <div className="grid grid-cols-2 gap-2 px-2">
                      <ShortcutItem icon={Plus} label="New Task" kbd="T" />
                      <ShortcutItem icon={Users} label="Assignee" kbd="A" />
                      <ShortcutItem icon={Zap} label="Priority" kbd="P" />
                      <ShortcutItem icon={CircleCheck} label="Close" kbd="C" />
                      <button 
                        onClick={() => {
                          const count = clearLocalData();
                          toast.success(`Cleared ${count} local data keys. Authentication preserved.`);
                          setTimeout(() => window.location.reload(), 1000);
                        }}
                        className="col-span-2 mt-2 flex items-center justify-between p-4 bg-red-50/50 rounded-2xl hover:bg-red-50 hover:shadow-lg transition-all border border-transparent hover:border-red-100 group"
                      >
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-red-400 group-hover:text-red-500 transition-colors">
                               <X size={16} />
                            </div>
                            <span className="text-xs font-bold text-red-500 group-hover:text-red-600 transition-colors">Reset Local Dashboard Data</span>
                         </div>
                         <div className="px-2 py-0.5 bg-white border border-red-200 rounded text-[9px] font-black text-red-300 uppercase">Danger Zone</div>
                      </button>

                      <button 
                        onClick={() => {
                          applyIntegratedData();
                          toast.success('Integrated test data applied successfully!');
                          setTimeout(() => window.location.reload(), 1000);
                        }}
                        className="col-span-2 mt-2 flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl hover:bg-emerald-50 hover:shadow-lg transition-all border border-transparent hover:border-emerald-100 group"
                      >
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-400 group-hover:text-emerald-500 transition-colors">
                               <Zap size={16} />
                            </div>
                            <span className="text-xs font-bold text-emerald-500 group-hover:text-emerald-600 transition-colors">Apply Integrated Test Data</span>
                         </div>
                         <div className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-[9px] font-black text-emerald-300 uppercase">System Ready</div>
                      </button>
                      <button 
                        onClick={() => {
                          localStorage.removeItem('nexus-demo-mode');
                          toast.info('Returned to Live Mode. Connecting to backend...');
                          setTimeout(() => window.location.reload(), 1000);
                        }}
                        className="col-span-2 mt-2 flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl hover:bg-blue-50 hover:shadow-lg transition-all border border-transparent hover:border-blue-100 group"
                      >
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-400 group-hover:text-blue-500 transition-colors">
                               <RefreshCw size={16} />
                            </div>
                            <span className="text-xs font-bold text-blue-500 group-hover:text-blue-600 transition-colors">Return to Live Mode</span>
                         </div>
                         <div className="px-2 py-0.5 bg-white border border-blue-200 rounded text-[9px] font-black text-blue-300 uppercase">Live Sync</div>
                      </button>
                   </div>
                </div>
             </div>
           ) : (
             <div className="py-20 text-center flex flex-col items-center justify-center opacity-30 grayscale">
                <Command size={48} className="mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">No matches found</p>
             </div>
           )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-400">ENTER</div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Select</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-400">UP/DN</div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Navigate</span>
              </div>
           </div>
           <div className="flex items-center gap-2 text-indigo-500">
              <Zap size={14} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest">Forge Lightning Search</span>
           </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutItem({ icon: Icon, label, kbd }: any) {
  return (
    <button className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-slate-100 group">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
             <Icon size={16} />
          </div>
          <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">{label}</span>
       </div>
       <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-300">{kbd}</div>
    </button>
  );
}

