

import React, { useState, useMemo } from 'react';
import {
  Search, Loader, AlertCircle, Flame,
  CircleCheck, GitPullRequest, Layout, Activity,
  ArrowUpRight, LayoutGrid, List, Users, Kanban,
  TrendingUp, Plus, ExternalLink, ChevronRight,
  ShieldAlert, Clock, Target
} from 'lucide-react';
import { useNavigate as useRouter } from 'react-router-dom';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

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
}
interface ProjectsViewProps { 
  projects: Project[]; 
  isLoading?: boolean; 
  onNewProject?: () => void;
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

export const ProjectsView = ({ projects, isLoading, onNewProject }: ProjectsViewProps) => {
  const router = useRouter();
  const { setCurrentProject } = useWorkflowStore();
  const { user } = useAuthStore();
  const role = user?.role || 'DEVELOPER';
  const rolePath = role === 'TEAM_LEAD' ? 'lead' : role === 'MANAGER' ? 'manager' : role === 'TESTER' ? 'tester' : 'developer';
  const accentColor = role === 'TEAM_LEAD' ? 'bg-[#065F46]' : 'bg-[#1A3A8F]';
  const accentHover = role === 'TEAM_LEAD' ? 'hover:bg-[#047857]' : 'hover:bg-blue-800';
  const accentShadow = role === 'TEAM_LEAD' ? 'shadow-emerald-900/10' : 'shadow-blue-900/10';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('All');
  const [view, setView] = useState<ViewMode>('grid');

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
                  className={`bg-white rounded-[24px] border-t-4 ${h.borderColor} border-x border-b border-slate-100 shadow-sm p-6 flex flex-col gap-5 hover:shadow-lg transition-all cursor-default`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                        <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">{project.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">{sprint}</p>
                    </div>
                    <span className={`px-2.5 py-1 ${h.bg} ${h.text} rounded-full text-[9px] font-semibold uppercase tracking-widest whitespace-nowrap`}>
                      {status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-1.5">
                      <span>Progress</span>
                      <span className="text-slate-900">{completion}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${h.overdue ? 'bg-rose-500' : accentColor}`}
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-medium flex items-center gap-1.5">
                       <GitPullRequest size={12} /> {prs} PRs
                    </div>
                    <div className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-medium flex items-center gap-1.5">
                       <ShieldAlert size={12} /> {blocked} blocked
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => openSprintBoard(project)}
                      className={`px-4 py-1.5 ${accentColor} text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${accentHover} transition-all`}
                    >
                      <Kanban size={13} /> Board
                    </button>
                    <button
                      onClick={() => openPRs(project)}
                      className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all"
                    >
                      <List size={13} /> Backlog
                    </button>
                    <button
                      onClick={() => openBurndown(project)}
                      className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all"
                    >
                      <Users size={13} /> Team
                    </button>
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
                <div key={project.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-9 h-9 ${h.bg} rounded-xl flex items-center justify-center ${h.text} shrink-0`}>
                      <Layout size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-slate-900 truncate">{project.name}</div>
                      <div className="text-[11px] text-slate-400 font-medium truncate">{project.description || 'No description'}</div>
                    </div>
                    <span className={`px-2.5 py-1 ${h.bg} ${h.text} rounded-full text-[9px] font-semibold uppercase tracking-widest whitespace-nowrap`}>{h.status}</span>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 ml-4">
                    <div className="text-center hidden md:block">
                      <div className="text-[13px] font-semibold text-slate-900">{h.completion}%</div>
                      <div className="text-[9px] font-medium text-slate-400 uppercase">Done</div>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className="text-[13px] font-semibold text-slate-900">{h.prs}</div>
                      <div className="text-[9px] font-medium text-slate-400 uppercase">PRs</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

