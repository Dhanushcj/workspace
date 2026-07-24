'use client';

import React from 'react';

interface ProjectData {
  id: string;
  name: string;
  client?: string;
  leadName: string;
  leadAvatar?: string;
  activeSprint?: string;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  progress: number;
}

interface ProjectsOverviewGridProps {
  projects: ProjectData[];
  onProjectClick?: (id: string) => void;
}

const ProjectsOverviewGrid: React.FC<ProjectsOverviewGridProps> = ({ projects, onProjectClick }) => {
  if (projects.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[32px] border border-slate-200 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No active projects being tracked</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => onProjectClick?.(project.id)}
          className={`bg-white border border-slate-200 rounded-[32px] p-8 transition-all group ${onProjectClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-lg hover:shadow-blue-600/5' : ''}`}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-slate-900 font-black text-xl leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-2">{project.client || 'Strategic Initiative'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-[12px] font-black group-hover:scale-110 transition-transform">
              {project.leadName.charAt(0)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Active Cycle
              </p>
              <p className="text-slate-700 text-sm font-black">
                {project.activeSprint || 'Cycle Not Started'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Lead
              </p>
              <p className="text-slate-700 text-sm font-black">
                {project.leadName}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
              <span className="text-slate-400">
                {project.doneCount} / {project.todoCount + project.inProgressCount + project.doneCount} Tasks Completed
              </span>
              <span className="text-blue-600 font-black">{project.progress}%</span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-1000 ease-out"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectsOverviewGrid;

