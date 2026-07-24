'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useNavigate as useRouter } from 'react-router-dom';
import { Loader, ArrowRight, FolderKanban } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

interface Project {
  id: string;
  name: string;
  status: string;
  task_counts: {
    total: number;
    done: number;
  };
}

export default function ActivePortfolioPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchActiveProjects = async () => {
      if (!user?.id) return;
      try {
        const response = await api.get(`/projects?status=active&created_by=${user.id}`);
        const raw = response.data;
        const normalized = Array.isArray(raw) ? raw : (raw?.data || []);
        setProjects(normalized);
      } catch (error) {
        console.error('Failed to fetch active portfolio', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveProjects();
  }, [user?.id]);

  const colors = ['bg-purple-500', 'bg-teal-500', 'bg-blue-500', 'bg-amber-500'];

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 space-y-6">
        <div className="h-4 w-32 bg-slate-100 rounded-full animate-pulse mb-8" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-1 w-full bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 text-center py-12">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
           <FolderKanban size={24} />
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Portfolio</p>
        <p className="text-[10px] text-slate-300 mt-1">No active projects yet. You're starting fresh!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20">
      <div className="flex items-center justify-between mb-8">
         <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Portfolio</h3>
         <span className="px-2 py-0.5 bg-indigo-50 text-[10px] font-black text-indigo-600 rounded-md">
            {projects.length} Total
         </span>
      </div>

      <div className="space-y-6">
        {projects.slice(0, 4).map((project, index) => {
          const total = project.task_counts?.total || 0;
          const done = project.task_counts?.done || 0;
          const progress = total > 0 
            ? Math.round((done / total) * 100) 
            : 0;
          
          return (
            <div 
              key={project.id}
              onClick={() => {
                useWorkflowStore.getState().setCurrentProject(project);
                router(`/dashboard/lead/sprints?projectId=${project.id}`);
              }}
              className="group cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className={`w-8 h-8 rounded-full ${colors[index % colors.length]} flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform`}>
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <p className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {project.name}
                  </p>
                  <span className="text-[10px] font-black text-slate-400">{progress}%</span>
                </div>
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#534AB7] transition-all duration-1000 ease-out rounded-full" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {projects.length > 4 && (
        <button 
          onClick={() => router('/dashboard/lead/projects')}
          className="w-full mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:gap-3 transition-all"
        >
          View all {projects.length} projects <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

