'use client';

import React, { useState } from 'react';
import { 
  Zap, Users, Clock, CircleCheck, 
  ChevronRight, Sparkles, MessageSquare, 
  RotateCcw, Eye, Play
} from 'lucide-react';
import { useWorkflowStore, Task } from '../../store/workflowStore';

export default function PlanningPoker() {
  const { tasks } = useWorkflowStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentVote, setCurrentVote] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  
  const backlogTasks = tasks.filter(t => t.status === 'TO_DO');
  const activeTask = tasks.find(t => t.id === selectedTaskId) || backlogTasks[0];

  const cards = [1, 2, 3, 5, 8, 13, 21];

  const handleVote = (value: number) => {
    setCurrentVote(value);
    // Simulate other team members voting
    setTimeout(() => {}, 1000);
  };

  const resetRound = () => {
    setCurrentVote(null);
    setIsRevealed(false);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
       {/* Left: Task Queue */}
       <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 border-l-4 border-indigo-500 pl-4">Estimation Queue</h3>
                <span className="text-[10px] font-black text-slate-400">{backlogTasks.length} Tasks</span>
             </div>
             
             <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {backlogTasks.map(task => (
                  <button 
                    key={task.id}
                    onClick={() => { setSelectedTaskId(task.id); resetRound(); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      selectedTaskId === task.id || (!selectedTaskId && task.id === backlogTasks[0].id)
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                        : 'bg-white border-slate-100 text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                       selectedTaskId === task.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'
                     }`}>
                        <Zap size={14} />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">{task.id}</p>
                        <h4 className="text-xs font-black truncate">{task.title}</h4>
                     </div>
                  </button>
                ))}
             </div>
          </div>
       </div>

       {/* Middle & Right: Poker Table */}
       <div className="lg:col-span-2 space-y-10">
          <div className="bg-slate-900 p-12 rounded-[50px] text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-800/20" />
             <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
             
             <div className="relative z-10 text-center max-w-lg mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 mb-6 text-indigo-300">
                   <Sparkles size={14} /> Neural Estimation Round
                </div>
                <h2 className="text-3xl font-black tracking-tight leading-tight">{activeTask?.title}</h2>
                <p className="text-sm text-slate-400 mt-4 font-medium leading-relaxed opacity-60">
                   Collaboratively estimate complexity using Fibonacci sequence. Points reflect effort, risk, and technical uncertainty.
                </p>
             </div>

             {/* Poker Table / Cards Area */}
             <div className="relative z-10 w-full">
                <div className="flex justify-center gap-4 flex-wrap">
                   {cards.map(val => (
                     <button 
                       key={val}
                       onClick={() => handleVote(val)}
                       className={`w-16 h-24 rounded-2xl flex flex-col items-center justify-center transition-all ${
                         currentVote === val 
                           ? 'bg-indigo-500 text-white scale-110 shadow-2xl shadow-indigo-500/40 -translate-y-4' 
                           : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:-translate-y-2'
                       }`}
                     >
                        <span className="text-2xl font-black">{val}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest mt-2 opacity-40">Points</span>
                     </button>
                   ))}
                </div>
             </div>

             {/* Action Bar */}
             <div className="mt-16 relative z-10 flex items-center gap-4">
                <button 
                  onClick={() => setIsRevealed(true)}
                  disabled={!currentVote || isRevealed}
                  className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                >
                   <Eye size={16} /> Reveal Estimates
                </button>
                <button 
                  onClick={resetRound}
                  className="w-12 h-12 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                   <RotateCcw size={18} />
                </button>
             </div>
          </div>

          {/* Consensus Result (Shown after reveal) */}
          {isRevealed && (
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 grid grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
               <div className="col-span-1 text-center border-r border-slate-50">
                  <p className="text-3xl font-black text-indigo-600">5.5</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-2">Avg Estimate</p>
               </div>
               <div className="col-span-1 text-center border-r border-slate-50">
                  <p className="text-3xl font-black text-slate-900">8</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-2">Team Consensus</p>
               </div>
               <div className="col-span-1 flex flex-col justify-center items-center">
                  <button className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">
                     Apply Points
                  </button>
               </div>
            </div>
          )}
       </div>
    </div>
  );
}

