'use client';

import React, { useState, useMemo } from 'react';
import {
  Search, Loader, AlertCircle, Flame,
  CircleCheck, GitPullRequest, Layout, Activity,
  ArrowUpRight, LayoutGrid, List, Users, Kanban,
  TrendingUp, Plus, ExternalLink, ChevronRight,
  ShieldAlert, Clock, Target, UserPlus, Pencil, Trash2
} from 'lucide-react';
import { useNavigate as useRouter } from 'react-router-dom';
import { useWorkflowStore } from '../../store/workflowStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { ProjectMembersModal } from './ProjectMembersModal';
import { EditProjectModal } from './EditProjectModal';

interface Project { 
  id: string; 
  name: string; 
  description?: string; 
  status?: string;
  clientOrg?: string;
  category?: string;
  sprintName?: string;
  completion?: number;
  prCount?: number;
  blockerCount?: number;
  members?: any[];
}
interface ProjectsViewProps { 
  projects: Project[]; 
  isLoading?: boolean; 
  onNewProject?: () => void;
  onOpenProject?: (project: Project) => void;
}

type FilterMode = 'All' | 'Active' | 'At risk' | 'Completed';
type ViewMode = 'grid' | 'list';

const projectHealth: Record<string, any> = {
  default:             { status: 'On track',  borderColor: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', completion: 50, prs: 0, blocked: 0, daysLeft: 5 },
  'E-Commerce Platform':{ status: 'On track', borderColor: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', completion: 68, prs: 4, blocked: 2, daysLeft: 3 },
  'Mobile App Redesign':{ status: 'At risk',  borderColor: 'border-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   completion: 32, prs: 2, blocked: 1, daysLeft: 2 },
  'API Gateway Service':{ status: 'Delayed',  borderColor: 'border-rose-500',    bg: 'bg-rose-50',    text: 'text-rose-700',    completion: 45, prs: 1, blocked: 0, hotfix: 1, overdue: '1 day' },
};

const statusToFilter: Record<string, FilterMode> = {
  'On track': 'Active', 'At risk': 'At risk', 'Delayed': 'At risk', 'Completed': 'Completed',
};

const activityFeed = [
  { id: 1, type: 'PR',         title: 'PR #14 submitted — Cart API endpoint',              desc: 'E-Commerce Platform · Nexus Developer · Awaiting your review', status: 'Review needed', time: '2 hrs ago',  icon: GitPullRequest, color: 'text-blue-600',    bg: 'bg-blue-50',    route: '?tab=CodeReview' },
  { id: 2, type: 'BLOCKER',    title: 'Blocker raised — Razorpay API key not provisioned', desc: 'E-Commerce Platform · Nexus Developer · Task #T-19',              status: 'Resolve',       time: '3 hrs ago',  icon: ShieldAlert,    color: 'text-rose-600',  bg: 'bg-rose-50',    route: '?tab=Blockers' },
  { id: 3, type: 'ASSIGNMENT', title: 'Task #T-31 assigned — Onboarding screen animations',desc: 'Mobile App Redesign · Assigned to Sneha Menon',                   status: 'Assigned',      time: '5 hrs ago',  icon: Users,          color: 'text-emerald-600',bg: 'bg-emerald-50', route: '?tab=Assignment' },
  { id: 4, type: 'SPRINT',     title: 'Sprint 2 completed — Admin Portal',                 desc: 'Admin Portal · 18 of 20 tasks done · 2 carried over · Velocity: 44 pts', status: 'Completed', time: 'Yesterday', icon: CircleCheck,   color: 'text-emerald-600',bg: 'bg-emerald-50', route: '?tab=Burndown' },
  { id: 5, type: 'BUG',        title: 'Bug #9 logged — Cart total mismatch on update',     desc: 'E-Commerce Platform · Logged by Priya Rao · Assigned to Nexus Dev',  status: 'Bug · High',   time: 'Yesterday',  icon: Flame,          color: 'text-rose-600',  bg: 'bg-rose-50',    route: '?tab=Blockers' },
];

export const ProjectsView = ({ projects, isLoading, onNewProject, onOpenProject }: ProjectsViewProps) => {
  const router = useRouter();
  const { setCurrentProject, deleteProject } = useWorkflowStore();
  const { user } = useAuthStore();
  
  // Fallback to localStorage if store isn't populated
  const authLocal = JSON.parse(localStorage.getItem('auth') || '{}');
  const userEmail = (user?.email || authLocal.email || '').toLowerCase();
  
  // Normalize role to handle values like "Team Lead" from DB
  let rawRole = user?.role || 'DEVELOPER';
  
  // Hardcoded role assignment logic as requested in layout
  if (userEmail === 'avinash@fic.com') rawRole = 'MANAGER';
  if (userEmail === 'agila@fic.com' || userEmail === 'akila@fic.com') rawRole = 'TEAM_LEAD';

  const role = rawRole.toUpperCase().replace(/\s+/g, '_');
  
  const rolePath = role === 'TEAM_LEAD' ? 'lead' : role === 'MANAGER' ? 'manager' : role === 'TESTER' ? 'tester' : 'developer';
  const accentColor = role === 'TEAM_LEAD' ? 'bg-[#065F46]' : 'bg-[#1A3A8F]';
  const accentHover = role === 'TEAM_LEAD' ? 'hover:bg-[#047857]' : 'hover:bg-blue-800';
  const accentShadow = role === 'TEAM_LEAD' ? 'shadow-emerald-900/10' : 'shadow-blue-900/10';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('All');
  const [view, setView] = useState<ViewMode>('grid');
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<Project | null>(null);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<Project | null>(null);

  const handleDelete = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`)) {
      try {
        await deleteProject(project.id || (project as any)._id);
        toast.success('Project deleted successfully');
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };

  const filtered = useMemo(() => {
    let list = projects || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (filter !== 'All') {
      list = list.filter(p => {
        const h = projectHealth[p.name] || projectHealth.default;
        const status = p.status || h.status;
        return statusToFilter[status] === filter;
      });
    }
    return list;
  }, [projects, search, filter]);

  const openSprintBoard = (project: Project) => {
    setCurrentProject(project as any);
    router(`/dashboard/${rolePath}?tab=SprintBoard`);
  };

  const openPRs = (project: Project) => {
    setCurrentProject(project as any);
    router(`/dashboard/${rolePath}?tab=PRs`);
  };

  const openBurndown = (project: Project) => {
    setCurrentProject(project as any);
    router(`/dashboard/${rolePath}?tab=Team`);
  };

  const handleActivityClick = (route: string) => router(`/dashboard/${rolePath}${route}`);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 overflow-y-auto">

      {/* ── Project Grid / List ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-slate-900 uppercase tracking-wider">
            Projects
          </h2>
          {onNewProject && (
            <button
              onClick={onNewProject}
              className={`px-4 py-1.5 ${accentColor} text-white rounded-lg text-[11px] font-bold flex items-center gap-2 shadow-sm ${accentShadow} ${accentHover} transition-all`}
            >
              <Plus size={14} /> New Project
            </button>
          )}
        </div>

        {filtered.length === 0 && !search ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Target size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium text-sm">No projects found</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(project => {
              const h = projectHealth[project.name] || projectHealth.default;
              const status = project.status || h.status;
              const completion = project.completion ?? h.completion;
              const prs = project.prCount ?? h.prs;
              const blocked = project.blockerCount ?? h.blocked;
              const sprint = project.sprintName || 'Sprint 1';

              return (
                <div
                  key={project.id}
                  onClick={() => onOpenProject?.(project)}
                  className={`bg-white rounded-[24px] border-t-4 ${h.borderColor} border-x border-b border-slate-100 shadow-sm p-6 flex flex-col gap-5 hover:shadow-lg transition-all cursor-pointer group`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                        <h3 className="text-[15px] font-semibold text-slate-900 leading-tight group-hover:text-[#1B4FAB] transition-colors">{project.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">{sprint}</p>
                    </div>
                    <span className={`px-2.5 py-1 ${
                      (project.status || 'TO DO') === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                      (project.status || 'TO DO') === 'IN PROGRESS' ? 'bg-amber-50 text-amber-600' :
                      (project.status || 'TO DO') === 'CANCELLED' ? 'bg-rose-50 text-rose-600' :
                      'bg-slate-100 text-slate-600'
                    } rounded-full text-[9px] font-semibold uppercase tracking-widest whitespace-nowrap`}>
                      {project.status || 'TO DO'}
                    </span>
                  </div>

                  {/* Status Selection */}
                  <div 
                    className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Status</span>
                    <select 
                      value={project.status || 'TO DO'}
                      onChange={(e) => useWorkflowStore.getState().updateProject(project.id, { status: e.target.value })}
                      className="bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20"
                    >
                      <option value="TO DO">To Do</option>
                      <option value="IN PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-medium flex items-center gap-1.5">
                       <GitPullRequest size={12} /> {prs} PRs
                    </div>
                    <div className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-medium flex items-center gap-1.5">
                       <ShieldAlert size={12} /> {blocked} blocked
                    </div>
                  </div>

                  {/* Action Buttons & Members */}
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    {/* Members Avatar Stack */}
                    <div className="flex -space-x-2 overflow-hidden items-center">
                       {project.members && project.members.length > 0 ? (
                         <>
                           {project.members.slice(0, 3).map((member: any) => (
                             <div key={member.userId} title={member.name} className="inline-flex h-8 w-8 rounded-full ring-2 ring-white bg-indigo-100 text-indigo-700 items-center justify-center text-[10px] font-bold z-10">
                               {member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} className="h-full w-full rounded-full object-cover" /> : (member.name?.charAt(0)?.toUpperCase() || 'U')}
                             </div>
                           ))}
                           {project.members.length > 3 && (
                             <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 text-slate-600 items-center justify-center text-[10px] font-bold z-0">
                               +{project.members.length - 3}
                             </div>
                           )}
                         </>
                       ) : (
                         <span className="text-[10px] font-medium text-slate-400 italic">Unassigned</span>
                       )}
                    </div>

                    {(role === 'TEAM_LEAD' || role === 'MANAGER' || role === 'ADMIN' || role === 'COMPANY_ADMIN') && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => setSelectedProjectForMembers(project)}
                          title="Assign Team"
                          className="w-9 h-9 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors"
                        >
                          <UserPlus size={14} />
                        </button>
                        <button
                          onClick={() => setSelectedProjectForEdit(project)}
                          title="Edit Project"
                          className="w-9 h-9 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
                          title="Delete Project"
                          className="w-9 h-9 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
            {filtered.map(project => {
              const h = projectHealth[project.name] || projectHealth.default;
              return (
                <div 
                  key={project.id} 
                  onClick={() => onOpenProject?.(project)}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-9 h-9 ${h.bg} rounded-xl flex items-center justify-center ${h.text} shrink-0`}>
                      <Layout size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-[#1B4FAB] transition-colors">{project.name}</div>
                      <div className="text-[11px] text-slate-400 font-medium truncate">{project.description || 'No description'}</div>
                    </div>
                    <span className={`px-2.5 py-1 ${
                      (project.status || 'TO DO') === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                      (project.status || 'TO DO') === 'IN PROGRESS' ? 'bg-amber-50 text-amber-600' :
                      (project.status || 'TO DO') === 'CANCELLED' ? 'bg-rose-50 text-rose-600' :
                      'bg-slate-100 text-slate-600'
                    } rounded-full text-[9px] font-semibold uppercase tracking-widest whitespace-nowrap`}>
                      {project.status || 'TO DO'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                    <div className="text-center hidden md:block">
                      <select 
                        value={project.status || 'TO DO'}
                        onChange={(e) => useWorkflowStore.getState().updateProject(project.id, { status: e.target.value })}
                        className="bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20"
                      >
                        <option value="TO DO">To Do</option>
                        <option value="IN PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className="text-[13px] font-semibold text-slate-900">{project.prCount ?? h.prs}</div>
                      <div className="text-[9px] font-medium text-slate-400 uppercase">PRs</div>
                    </div>
                    {(role === 'TEAM_LEAD' || role === 'MANAGER' || role === 'ADMIN' || role === 'COMPANY_ADMIN') && (
                      <div className="flex gap-1 ml-1">
                        <button
                          onClick={() => setSelectedProjectForMembers(project)}
                          className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-opacity"
                          title="Assign Team"
                        >
                          <UserPlus size={16} />
                        </button>
                        <button
                          onClick={() => setSelectedProjectForEdit(project)}
                          className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-opacity"
                          title="Edit Project"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-opacity"
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Render Project Members Modal */}
      {selectedProjectForMembers && (
        <ProjectMembersModal
          isOpen={true}
          onClose={() => setSelectedProjectForMembers(null)}
          projectId={selectedProjectForMembers.id || (selectedProjectForMembers as any)._id}
          projectName={selectedProjectForMembers.name}
        />
      )}

      {/* Render Edit Project Modal */}
      {selectedProjectForEdit && (
        <EditProjectModal
          isOpen={true}
          onClose={() => setSelectedProjectForEdit(null)}
          project={selectedProjectForEdit}
        />
      )}

    </div>
  );
};


