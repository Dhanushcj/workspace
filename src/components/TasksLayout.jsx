import React from 'react';
import { NavLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Columns,
  CalendarDays,
  CheckSquare,
  UserPlus,
  AlertOctagon,
  Users,
  BarChart2,
  MessageSquare,
  Settings,
  LogOut,
  Search,
  Bell,
  Zap,
  CheckCircle2,
  ChevronDown,
  ListChecks,
  GitBranch,
  Bug,
  History,
  Clock
} from 'lucide-react';
import LogoImage from '../assets/landing-logo.png';

const TasksLayout = ({ children, title, subtitle, headerActions, fullWidth = false }) => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const userEmail = auth.email?.toLowerCase();
  const profileName = auth.user || auth.name || 'Developer';
  
  // Role assignment logic as requested
  let role = 'Developer';
  if (userEmail === 'avinash@fic.com') role = 'Manager';
  if (userEmail === 'agila@fic.com' || userEmail === 'akila@fic.com') role = 'Team Lead';

  const profileInitial = profileName?.charAt(0)?.toUpperCase() || 'D';

  const handleLogout = () => {
    import('../store/authStore').then(({ useAuthStore }) => {
      useAuthStore.getState().logout();
    });
  };

  const activeColorBg = role === 'Developer' ? 'bg-[#1A3A8F]' : 'bg-[#0F5A3E]';

  const leadNavGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: `/w/${workspaceId}/tasks`, isActive: location.pathname.includes('/dashboard/') || location.pathname === `/w/${workspaceId}/tasks` },
        { label: 'Projects', icon: FolderOpen, path: `/w/${workspaceId}/tasks/projects`, isActive: location.pathname.includes('/tasks/projects') },
        { label: 'Sprint Board', icon: Columns, path: `/w/${workspaceId}/tasks/board`, isActive: location.pathname.includes('/tasks/board') },
      ]
    },
    {
      title: 'SPRINT MANAGEMENT',
      items: [
        { label: 'Sprint Planner', icon: CalendarDays, path: `/w/${workspaceId}/tasks/planner`, isActive: location.pathname.includes('/tasks/planner') },
        { label: 'Backlog', icon: CheckSquare, path: `/w/${workspaceId}/tasks/backlog`, isActive: location.pathname.includes('/tasks/backlog') },
        { label: 'Task Assignment', icon: UserPlus, path: `/w/${workspaceId}/tasks/assignments`, isActive: location.pathname.includes('/tasks/assignments') },
        { label: 'Blockers', icon: AlertOctagon, path: `/w/${workspaceId}/tasks/blockers`, isActive: location.pathname.includes('/tasks/blockers') },
      ]
    },
    {
      title: 'TEAM',
      items: [
        { label: 'Team', icon: Users, path: `/w/${workspaceId}/tasks/team`, isActive: location.pathname.includes('/tasks/team') },
        { label: 'Workload View', icon: BarChart2, path: `/w/${workspaceId}/tasks/workload`, isActive: location.pathname.includes('/tasks/workload') },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Settings', icon: Settings, path: `/w/${workspaceId}/tasks/settings`, isActive: location.pathname.includes('/tasks/settings') },
        { label: 'Logout', icon: LogOut, path: '/login?app=tasks' },
      ]
    }
  ];

  const developerNavGroups = [
    {
      title: 'CORE ARCHITECTURE',
      items: [
        { label: 'Overview', icon: LayoutDashboard, path: `/w/${workspaceId}/tasks`, isActive: location.pathname.includes('/dashboard/') || location.pathname === `/w/${workspaceId}/tasks` },
        { label: 'Projects', icon: FolderOpen, path: `/w/${workspaceId}/tasks/projects`, isActive: location.pathname.includes('/tasks/projects') },
        { label: 'Sprint Board', icon: Columns, path: `/w/${workspaceId}/tasks/board`, isActive: location.pathname.includes('/tasks/board') },
      ]
    },
    {
      title: 'MY WORK',
      items: [
        { label: 'My Tasks', icon: ListChecks, path: `/w/${workspaceId}/tasks/board`, isActive: location.pathname.includes('/tasks/board') },
        { label: 'Pull Requests', icon: GitBranch, path: `/w/${workspaceId}/tasks/prs`, isActive: location.pathname.includes('/tasks/prs') },
        { label: 'Blockers', icon: Bug, path: `/w/${workspaceId}/tasks/blockers`, isActive: location.pathname.includes('/tasks/blockers') },
      ]
    },
    {
      title: 'COLLABORATION',
      items: [
        { label: 'Team', icon: Users, path: `/w/${workspaceId}/tasks/team`, isActive: location.pathname.includes('/tasks/team') },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Settings', icon: Settings, path: `/w/${workspaceId}/tasks/settings`, isActive: location.pathname.includes('/tasks/settings') },
        { label: 'Logout', icon: LogOut, path: '/login?app=tasks' },
      ]
    }
  ];

  const navGroups = role === 'Developer' ? developerNavGroups : leadNavGroups;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAFAFA] font-sans">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-slate-100 flex flex-col shrink-0">
        <div className="p-5">
          {/* Logo Area */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Zap size={18} fill="currentColor" />
            </div>
            <div>
              <div className="text-[13px] font-black tracking-tight text-slate-800 uppercase leading-none">Forge India</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">PMT APP</div>
            </div>
          </div>


        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {navGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">{group.title}</h3>
              <div className="space-y-0.5">
                {group.items.map((item, i) => {
                  if (item.label === 'Logout') {
                    return (
                      <button
                        key={i}
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} strokeWidth={1.5} className="text-slate-400" />
                          <span className="text-sm font-semibold">{item.label}</span>
                        </div>
                      </button>
                    );
                  }
                  
                  return (
                    <NavLink
                      key={i}
                      to={item.path}
                      className={() => `
                        flex items-center justify-between px-3 py-2.5 rounded-xl transition-all
                        ${item.isActive ? `${activeColorBg} text-white shadow-md` : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} strokeWidth={item.isActive ? 2.5 : 1.5} className={item.isActive ? 'text-white' : 'text-slate-400'} />
                        <span className="text-sm font-semibold">{item.label}</span>
                      </div>
                      {item.badge && (
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {item.badge}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Profile */}
        <div className="p-4 border-t border-slate-100 mb-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className={`w-10 h-10 rounded-xl ${activeColorBg} text-white flex items-center justify-center font-bold text-lg shadow-inner`}>
              {profileInitial}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{profileName}</div>
              <div className="text-[11px] font-semibold text-slate-400">{role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Row (Search, Notifications, Profile) */}
        <header className="h-[72px] bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0F5A3E] transition-colors" />
              <input
                type="text"
                placeholder="Search Project Data..."
                className="w-64 bg-slate-50 border border-slate-100 rounded-full py-1.5 pl-9 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5A3E]/20 focus:border-[#0F5A3E] transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-400 shadow-sm">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-400 shadow-sm">K</kbd>
              </div>
            </div>
            
            {/* Icons */}
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Zap size={20} strokeWidth={1.5} />
            </button>
            
            {/* Top Profile Bubble */}
            <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
              <div className="w-8 h-8 rounded-full bg-green-50 text-[#0F5A3E] flex items-center justify-center font-bold text-sm shadow-sm">
                {profileInitial}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">{profileName}</div>
                <div className="text-[10px] font-semibold text-slate-400">{role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className={fullWidth ? 'h-full flex flex-col' : 'max-w-[1200px] mx-auto'}>
            {/* Page Header Area */}
            {(title || headerActions) && (
              <div className="flex items-start justify-between mb-8 shrink-0">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-800">{title}</h1>
                  {subtitle && <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {headerActions}
                </div>
              </div>
            )}
            
            {/* Main Children */}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TasksLayout;
