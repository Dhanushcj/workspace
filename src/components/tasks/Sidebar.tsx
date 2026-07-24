'use client';

import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useNavigate as useRouter, useSearchParams } from 'react-router-dom';
import { 
  LayoutGrid, Layers, Kanban, Target, ListChecks, 
  UserPlus, ShieldAlert, GitBranch, History, 
  Users, Monitor, TrendingUp, Bell, List, Settings, LogOut,
  Bug, BarChart3, Clock, MessageSquare, Code2,
  ListTodo, Play, FileText, FlaskConical, Zap, CircleCheck, ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWorkflowStore } from '../../store/workflowStore';
import { useNotificationStore } from '../../store/notificationStore';
import { AppSwitcher } from '../AppLayout';

interface NavItem {
  label: string;
  icon: any;
  href: string;
  badge?: string | number | null;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const Sidebar = React.memo(function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [searchParams] = useSearchParams();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const { workspaceId } = useParams();
  
  // Normalize role
  let rawRole = (user?.role || 'DEVELOPER').toUpperCase();
  if (rawRole === 'USER' || rawRole === 'MEMBER') rawRole = 'DEVELOPER';
  const role = rawRole;

  const tasks = useWorkflowStore(state => state.tasks);
  const projects = useWorkflowStore(state => state.projects);
  const prs = useWorkflowStore(state => state.prs);
  const bugs = useWorkflowStore(state => state.bugs);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  
  const fetchPRs = useWorkflowStore(state => state.fetchPRs);
  const fetchBugs = useWorkflowStore(state => state.fetchBugs);
  const fetchUnreadCount = useNotificationStore(state => state.fetchUnreadCount);
  const fetchTasks = useWorkflowStore(state => state.fetchTasks);

  React.useEffect(() => {
    if (user) {
      fetchPRs();
      fetchBugs();
      fetchUnreadCount();
      // Removed fetchTasks() to prevent overwriting dashboard's task filter
    }
  }, [user, fetchPRs, fetchBugs, fetchUnreadCount]);

  const currentSprint = useWorkflowStore(state => state.currentSprint);
  const sprintId = currentSprint?.id || (currentSprint as any)?._id;
  
  const myTasksCount = tasks.filter(t => 
    t.assigneeId === user?.id && 
    t.status !== 'DONE' &&
    (sprintId ? (t.sprintId === sprintId || (t as any).sprintId === sprintId) : true)
  ).length;
  
  const blockerCount = tasks.filter(t => t.status === 'BLOCKED').length;
  const projectCount = projects.length;
  const openPrsCount = prs.length;
  const openBugsCount = bugs.length;

  const isLinkActive = (href: string) => {
    try {
      const url = new URL(href, 'http://localhost');
      const hrefPathname = url.pathname.replace(/\/$/, '') || '';
      const currentPathname = (pathname || '').replace(/\/$/, '') || '';
      
      if (hrefPathname !== currentPathname) return false;
      
      const hrefTab = url.searchParams.get('tab') || 'Overview';
      const currentTab = searchParams?.get('tab') || 'Overview';
      
      return hrefTab === currentTab;
    } catch (e) {
      return false;
    }
  };

  const getSections = (): NavSection[] => {
    const rolePath = role === 'TEAM_LEAD' ? 'lead' : role === 'MANAGER' ? 'manager' : role === 'TESTER' ? 'tester' : role === 'ADMIN' ? 'lead' : 'member';
    const baseUrl = `/w/${workspaceId || 'forge-india-connect'}/dashboard/${rolePath}`;

    if (role === 'TEAM_LEAD' || role === 'ADMIN') {
      return [
        {
          title: 'OVERVIEW',
          items: [
            { label: 'Dashboard', icon: LayoutGrid, href: `${baseUrl}?tab=Overview` },
            { label: 'Projects', icon: Layers, href: `${baseUrl}?tab=Projects`, badge: projectCount > 0 ? projectCount : null },
            { label: 'Sprint Board', icon: Kanban, href: `${baseUrl}?tab=SprintBoard` },
          ]
        },
        {
          title: 'SPRINT MANAGEMENT',
          items: [
            { label: 'Sprint Planner', icon: Target, href: `${baseUrl}?tab=SprintPlanner` },
            { label: 'Backlog', icon: ListChecks, href: `${baseUrl}?tab=Backlog`, badge: tasks.filter(t => t.status === 'TO_DO').length || null },
            { label: 'Task Assignment', icon: UserPlus, href: `${baseUrl}?tab=Assignment` },
            { label: 'Blockers', icon: ShieldAlert, href: `${baseUrl}?tab=Blockers`, badge: blockerCount > 0 ? blockerCount : null },
          ]
        },

        {
          title: 'TEAM',
          items: [
            { label: 'Team', icon: Users, href: `${baseUrl}?tab=Team` },
            { label: 'Workload View', icon: Monitor, href: `${baseUrl}?tab=Workload` },
            { label: 'Messages', icon: MessageSquare, href: `${baseUrl}?tab=Messages`, badge: 3 },
          ]
        },
        {
          title: 'SYSTEM',
          items: [
            { label: 'Settings', icon: Settings, href: `${baseUrl}?tab=Settings` },
          ]
        }
      ];
    }

    if (role === 'DEVELOPER') {
      return [
        {
          title: 'CORE ARCHITECTURE',
          items: [
            { label: 'Overview', icon: LayoutGrid, href: `${baseUrl}?tab=Overview` },
            { label: 'Projects', icon: Layers, href: `${baseUrl}?tab=Projects` },
            { label: 'Sprint Board', icon: Kanban, href: `${baseUrl}?tab=SprintBoard` },
          ]
        },
        {
          title: 'MY WORK',
          items: [
            { label: 'My Tasks', icon: ListChecks, href: `${baseUrl}?tab=MyTasks`, badge: myTasksCount > 0 ? myTasksCount : null },
            { label: 'Bug Inbox', icon: Bug, href: `${baseUrl}?tab=BugInbox`, badge: openBugsCount > 0 ? openBugsCount : null },
          ]
        },

        {
          title: 'INSIGHTS',
          items: [
            { label: 'Activity Log', icon: History, href: `${baseUrl}?tab=ActivityLog` },
            { label: 'My Analytics', icon: BarChart3, href: `${baseUrl}?tab=Analytics`, badge: 'NEW', badgeColor: 'bg-emerald-50 text-emerald-600' },
            { label: 'Time Tracker', icon: Clock, href: `${baseUrl}?tab=TimeTracker`, badge: 'NEW', badgeColor: 'bg-emerald-50 text-emerald-600' },
          ]
        },
        {
          title: 'SYSTEM',
          items: [
            { label: 'Notifications', icon: Bell, href: `${baseUrl}?tab=Notifications`, badge: unreadCount > 0 ? unreadCount : null },
            { label: 'Settings', icon: Settings, href: `${baseUrl}?tab=Settings` },
          ]
        }
      ];
    }

    if (role === 'TESTER') {
      return [
        {
          title: 'OVERVIEW',
          items: [
            { label: 'Dashboard', icon: LayoutGrid, href: `${baseUrl}?tab=Overview` },
            { label: 'Projects', icon: Layers, href: `${baseUrl}?tab=Projects` },
            { label: 'Sprint Board', icon: Kanban, href: `${baseUrl}?tab=SprintBoard` },
          ]
        },
        {
          title: 'MY QA WORK',
          items: [
            { label: 'Test Queue', icon: ListTodo, href: `${baseUrl}?tab=TestQueue`, badge: tasks.filter(t => t.status === 'TESTING').length || null },
            { label: 'Active Testing', icon: Play, href: `${baseUrl}?tab=ActiveTesting` },
            { label: 'Bug Reports', icon: Bug, href: `${baseUrl}?tab=BugReports`, badge: openBugsCount > 0 ? openBugsCount : null },
            { label: 'Test Cases', icon: FileText, href: `${baseUrl}?tab=TestCases` },
          ]
        },
        {
          title: 'TESTING PIPELINE',
          items: [
            { label: 'Staging Builds', icon: Layers, href: `${baseUrl}?tab=StagingBuilds`, badge: 2 },
            { label: 'Regression Suite', icon: FlaskConical, href: `${baseUrl}?tab=RegressionSuite` },
            { label: 'Hotfix Testing', icon: Zap, href: `${baseUrl}?tab=HotfixTesting`, badge: 1 },
          ]
        },
        {
          title: 'COLLABORATION',
          items: [
            { label: 'Team', icon: Users, href: `${baseUrl}?tab=Team` },
            { label: 'Messages', icon: MessageSquare, href: `${baseUrl}?tab=Messages`, badge: 2 },
          ]
        },
        {
          title: 'INSIGHTS',
          items: [
            { label: 'QA Analytics', icon: BarChart3, href: `${baseUrl}?tab=QAAnalytics`, badge: 'NEW', badgeColor: 'bg-amber-50 text-amber-600' },
            { label: 'Test History', icon: History, href: `${baseUrl}?tab=TestHistory` },
          ]
        },
        {
          title: 'SYSTEM',
          items: [
            { label: 'Notifications', icon: Bell, href: `${baseUrl}?tab=Notifications`, badge: unreadCount > 0 ? unreadCount : null },
            { label: 'Settings', icon: Settings, href: `${baseUrl}?tab=Settings` },
          ]
        }
      ];
    }
    if (role === 'MANAGER') {
      return [
        {
          title: 'OVERVIEW',
          items: [
            { label: 'Dashboard', icon: LayoutGrid, href: `${baseUrl}?tab=Overview` },
            { label: 'Sprint Board', icon: Kanban, href: `${baseUrl}?tab=SprintBoard` },
            { label: 'All Projects', icon: Layers, href: `${baseUrl}?tab=Projects`, badge: projectCount > 0 ? projectCount : null },
            { label: 'Team Overview', icon: Users, href: `${baseUrl}?tab=Team` },
            { label: 'Messages', icon: MessageSquare, href: `${baseUrl}?tab=Messages` },
          ]
        },
        {
          title: 'APPROVALS',
          items: [
            { label: 'Pending Approvals', icon: CircleCheck, href: `${baseUrl}?tab=Approvals`, badge: openPrsCount > 0 ? openPrsCount : null },
            { label: 'Release Sign-off', icon: GitBranch, href: `${baseUrl}?tab=ReleaseSignoff` },
            { label: 'Scope Approval', icon: ListTodo, href: `${baseUrl}?tab=ScopeApproval` },
          ]
        },
        {
          title: 'MONITORING',
          items: [
            { label: 'Workload Monitor', icon: Monitor, href: `${baseUrl}?tab=Workload` },
            { label: 'Sprint Health', icon: Target, href: `${baseUrl}?tab=SprintHealth` },
            { label: 'Bug Trends', icon: TrendingUp, href: `${baseUrl}?tab=BugTrends`, badge: openBugsCount > 0 ? openBugsCount : null },
            { label: 'Incidents', icon: ShieldAlert, href: `${baseUrl}?tab=Incidents`, badge: blockerCount > 0 ? blockerCount : null },
          ]
        },
        {
          title: 'REPORTS',
          items: [
            { label: 'Analytics', icon: BarChart3, href: `${baseUrl}?tab=Analytics` },
            { label: 'Velocity Report', icon: TrendingUp, href: `${baseUrl}?tab=Velocity` },
            { label: 'Activity Log', icon: History, href: `${baseUrl}?tab=ActivityLog` },
          ]
        },
        {
          title: 'SYSTEM',
          items: [
            { label: 'User Management', icon: UserPlus, href: `${baseUrl}?tab=UserManagement` },
            { label: 'Settings', icon: Settings, href: `${baseUrl}?tab=Settings` },
          ]
        }
      ];
    }

    return [];
  };

  const getActiveColor = () => {
    switch (role) {
      case 'TEAM_LEAD':
      case 'ADMIN':
        return 'bg-[#0D5F46] shadow-emerald-900/10';
      case 'DEVELOPER':
        return 'bg-[#1A3A8F] shadow-blue-900/10';
      case 'MANAGER':
        return 'bg-[#534AB7] shadow-indigo-900/10';
      case 'TESTER':
        return 'bg-[#854F0B] shadow-orange-900/10';
      default:
        return 'bg-slate-900 shadow-slate-900/10';
    }
  };

  const sections = getSections();
  const activeBg = getActiveColor();

  return (
    <div className="w-[280px] bg-white border-r border-slate-200/60 flex-shrink-0 flex flex-col h-full z-10 shadow-sm relative">
      <div className="p-5">
        {/* Logo Area */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <div className="text-[13px] font-black tracking-tight text-slate-800 uppercase leading-none">Forge India</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">PMT APP</div>
          </div>
        </div>

        {/* Workspace Chip */}
        {workspaceId && (
          <div className="mt-4 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-blue-600 shrink-0">
                  {workspaceId[0].toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {workspaceId.replace(/-/g, ' ')}
                </span>
              </div>
              <ChevronDown size={12} className="text-slate-400" />
            </div>
          </div>
        )}
      </div>
      <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 pb-6 pt-2 space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item, i) => {
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={i}
                    to={item.href}
                    className={`
                      flex items-center justify-between px-4 py-2 rounded-xl transition-all group
                      ${active 
                        ? `${activeBg} text-white shadow-md` 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
                      <span className="text-[13px] font-medium tracking-tight">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge !== null && (
                      <span className={`
                        px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${active ? 'bg-white/20 text-white' : (item.badgeColor || 'bg-slate-100 text-slate-500')}
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50">
        <div className="mb-4">
          <AppSwitcher workspaceId={workspaceId || 'demo'} />
        </div>
        <div className="bg-slate-50/50 rounded-2xl p-4 mb-4 flex items-center gap-3">
           <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${activeBg.split(' ')[0]}`}>
             {user?.name?.[0] || 'D'}
           </div>
           <div className="min-w-0">
             <p className="text-[13px] font-semibold text-slate-900 truncate">{user?.name || 'Nexus Developer'}</p>
             <p className="text-[11px] font-medium text-slate-400 capitalize">{role.toLowerCase().replace('_', ' ')}</p>
           </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
        >
          <LogOut size={18} />
          <span className="text-[13px] font-medium">Neural Logout</span>
        </button>
      </div>
    </div>
  );
});

export default Sidebar;
