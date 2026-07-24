'use client';

import React, { useState } from 'react';
import { 
  HelpCircle, X, BookOpen, MessageSquare, 
  Zap, Shield, Terminal, ArrowRight, Sparkles,
  Code2, Users, FileText, CircleCheck
} from 'lucide-react';

export default function HelpOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Node */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[100] group"
      >
         <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity" />
         <HelpCircle size={24} className="relative z-10" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-end p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
           
           <div className="relative w-full max-w-lg h-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right-10 duration-500">
              {/* Header */}
              <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                 <button 
                   onClick={() => setIsOpen(false)}
                   className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
                 >
                    <X size={20} />
                 </button>
                 
                 <div className="flex items-center gap-3 mb-6">
                    <Sparkles size={24} className="text-indigo-400" />
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400">Knowledge Hub</span>
                 </div>
                 <h2 className="text-4xl font-black tracking-tighter">Forge Assist</h2>
                 <p className="text-sm text-slate-400 font-medium mt-4 leading-relaxed">
                    Welcome to the engineering intelligence layer. How can we optimize your workflow today?
                 </p>
              </div>

              {/* Navigation Grid */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                 <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300 border-l-2 border-slate-200 pl-4">Core Workflows</h3>
                    <div className="grid grid-cols-1 gap-3">
                       <HelpCard 
                         icon={Code2} 
                         title="Developer Cycle" 
                         desc="Learn how to start tasks, submit PRs, and manage your backlog." 
                       />
                       <HelpCard 
                         icon={Shield} 
                         title="QA & Verification" 
                         desc="The tester guide to verifying code quality and logging regressions." 
                       />
                       <HelpCard 
                         icon={Users} 
                         title="Team Management" 
                         desc="For leads and managers: overseeing sprint velocity and workload." 
                       />
                    </div>
                 </section>

                 <section className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300 border-l-2 border-slate-200 pl-4">System Shortcuts</h3>
                    <div className="space-y-2">
                       <ShortcutRow keys={['Ctrl', 'K']} action="Open Lightning Search" />
                       <ShortcutRow keys={['Ctrl', 'N']} action="Create New Task" />
                       <ShortcutRow keys={['Ctrl', 'S']} action="Save Changes" />
                    </div>
                 </section>

                 <section className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 text-slate-900">
                       <BookOpen size={20} />
                       <h4 className="font-black text-sm">Full Documentation</h4>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                       Access the comprehensive guide to enterprise Agile management with Forge India.
                    </p>
                    <button className="flex items-center gap-2 text-[#0056B3] text-[10px] font-black uppercase tracking-widest hover:gap-3 transition-all">
                       Open Forge India Docs <ArrowRight size={14} />
                    </button>
                 </section>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-slate-50 bg-slate-50/50">
                 <button className="w-full py-4 bg-[#0056B3] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                    <MessageSquare size={16} /> Contact Support
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}

function HelpCard({ icon: Icon, title, desc }: any) {
  return (
    <button className="w-full flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all group text-left">
       <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
          <Icon size={20} />
       </div>
       <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-slate-900 truncate">{title}</h4>
          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{desc}</p>
       </div>
       <ChevronRight size={16} className="text-slate-200" />
    </button>
  );
}

function ShortcutRow({ keys, action }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
       <span className="text-xs font-bold text-slate-500">{action}</span>
       <div className="flex gap-1">
          {keys.map((k: string) => (
            <kbd key={k} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[9px] font-black text-slate-400">{k}</kbd>
          ))}
       </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return <ArrowRight {...props} />;
}

