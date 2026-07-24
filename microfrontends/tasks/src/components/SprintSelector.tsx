

import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, Loader, Calendar, History, Play } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import api from '../lib/api';

export default function SprintSelector() {
  const { currentProject, currentSprint, setCurrentSprint, fetchTasks } = useWorkflowStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sprints, setSprints] = useState<any[]>([]);

  const loadSprints = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/projects/${currentProject.id}/sprints`);
      setSprints(res.data);
    } catch (err) {
      console.error('SprintSelector Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSprints();
  }, [currentProject?.id]);

  if (!currentProject) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          px-3 py-1.5 rounded-xl flex items-center gap-3 transition-all group border
          ${isOpen 
            ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-500/5' 
            : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white'}
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0 ${
            currentSprint?.status === 'ACTIVE' ? 'bg-indigo-600' : 
            currentSprint?.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-slate-400'
          }`}>
            {currentSprint?.status === 'COMPLETED' ? <History size={12} /> : <Calendar size={12} />}
          </div>
          <div className="text-left overflow-hidden">
            <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tighter">
              {currentSprint?.name || 'SELECT SPRINT'}
            </p>
          </div>
        </div>
        <ChevronDown 
          size={12} 
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-[calc(100%+8px)] left-0 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-50 mb-1 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Select Sprint</span>
              {isLoading && <Loader size={10} className="animate-spin text-slate-400" />}
            </div>
            <div className="max-h-[280px] overflow-y-auto custom-scrollbar px-1">
              {sprints.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No sprints found</p>
                </div>
              ) : (
                sprints.map((sprint) => (
                  <button
                    key={sprint.id}
                    onClick={() => {
                      setCurrentSprint(sprint);
                      fetchTasks({ projectId: currentProject.id, sprintId: sprint.id });
                      setIsOpen(false);
                    }}
                    className={`
                      w-full px-3 py-2.5 flex items-center justify-between rounded-xl transition-all group mb-0.5
                      ${currentSprint?.id === sprint.id 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50'}
                    `}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`
                        w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors
                        ${currentSprint?.id === sprint.id 
                          ? (sprint.status === 'ACTIVE' ? 'bg-indigo-600' : sprint.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-slate-600') + ' text-white' 
                          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}
                      `}>
                        {sprint.status === 'ACTIVE' ? <Play size={10} fill="currentColor" /> : 
                         sprint.status === 'COMPLETED' ? <Check size={10} strokeWidth={4} /> : 
                         <Calendar size={10} />}
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className={`text-[12px] font-bold truncate ${currentSprint?.id === sprint.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {sprint.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                            {sprint.status}
                          </p>
                          <div className={`w-1 h-1 rounded-full ${
                            sprint.status === 'ACTIVE' ? 'bg-indigo-500' : 
                            sprint.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`} />
                        </div>
                      </div>
                    </div>
                    {currentSprint?.id === sprint.id && (
                      <Check size={12} className="text-indigo-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

