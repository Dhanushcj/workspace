'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ChevronDown, Check, Loader, PlusCircle, FolderPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkflowStore } from '../../store/workflowStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

export default function ProjectSelector() {
  const { user } = useAuthStore();
  const { projects, currentProject, setCurrentProject, fetchProjects, clearTasks } = useWorkflowStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      if (!user) return;
      setIsLoading(true);
      try {
        await fetchProjects(); 
      } catch (err) {
        console.error('ProjectSelector Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, [user?.id, fetchProjects]);

  if (isLoading && projects.length === 0) {
    return (
      <div className="px-6 py-4 mx-2 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-2 w-20 bg-slate-200 rounded" />
          <div className="h-2 w-12 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          px-3 py-1.5 rounded-xl flex items-center gap-3 transition-all group border
          ${isOpen 
            ? 'bg-white border-blue-200 shadow-lg shadow-blue-500/5' 
            : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white'}
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="text-[10px] font-black">{currentProject?.name?.[0] || 'N'}</span>
          </div>
          <div className="text-left overflow-hidden">
            <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tighter">
              {currentProject?.name || 'NEXUS PLATFORM'}
            </p>
          </div>
        </div>
        <ChevronDown 
          size={12} 
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} 
        />
      </button>

      {/* DROPDOWN */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-[calc(100%+8px)] left-0 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-50 mb-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Select Project</span>
            </div>
            <div className="max-h-[280px] overflow-y-auto custom-scrollbar px-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    clearTasks();
                    setCurrentProject(project);
                    setIsOpen(false);
                    import('../../lib/socket').then(({ socketService }) => {
                      socketService.joinProject(project.id);
                    });
                  }}
                  className={`
                    w-full px-3 py-2.5 flex items-center justify-between rounded-xl transition-all group mb-0.5
                    ${currentProject?.id === project.id 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`
                      w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors
                      ${currentProject?.id === project.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}
                    `}>
                      {project.key?.[0] || project.name[0]}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className={`text-[12px] font-bold truncate ${currentProject?.id === project.id ? 'text-blue-700' : 'text-slate-700'}`}>
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{project.key}</p>
                        <div className={`w-1 h-1 rounded-full ${project.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                    </div>
                  </div>
                  {currentProject?.id === project.id && (
                    <Check size={12} className="text-blue-600" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="mt-2 px-2 pt-2 border-t border-slate-50">
               <Link 
                 href="/dashboard/lead/create-project"
                 onClick={() => setIsOpen(false)}
                 className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
               >
                  <FolderPlus size={12} /> Create New Project
               </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

