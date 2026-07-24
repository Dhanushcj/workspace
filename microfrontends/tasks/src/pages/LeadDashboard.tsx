

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate as useRouter, useSearchParams } from 'react-router-dom';
import { 
  Zap, Flag, Target, Star, 
  MessageSquare, AlertTriangle, 
  ChevronRight, Calendar, 
  Users, LineChart, Bell, Plus,
  Loader, RefreshCw, Clock,
  LayoutGrid, Layers, ListTodo, GitBranch, Settings,
  Code2, ShieldAlert, History, Monitor, TrendingUp, ArrowUpRight,
  Download, ListChecks, Kanban, CircleCheck, MoreVertical, Play, ArrowRight, UserPlus, AlertCircle, Mail, MessageCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import Preloader from '../components/Preloader';
import { useWorkflowStore } from '../store/workflowStore';
import { useNotificationStore } from '../store/notificationStore';
import { socketService } from '../lib/socket';
import { MessagesView } from '../components/MessagesView';
import { ProjectsView } from '../components/ProjectsView';
import CreateProjectModal from '../components/CreateProjectModal';
import { BacklogView } from '../components/BacklogView';
import { BlockersView } from '../components/BlockersView';
import { PRReviewQueueView } from '../components/PRReviewQueueView';
import { TaskAssignmentView } from '../components/TaskAssignmentView';
import { ReviewHistoryPanel } from '../components/ReviewHistoryPanel';
import BurndownChart from '../components/BurndownChart';
import ActivityFeed from '../components/ActivityFeed';
import SprintPlanner from '../components/SprintPlanner';
import { TeamView } from '../components/TeamView';
import { WorkloadView } from '../components/WorkloadView';
import { SettingsView } from '../components/SettingsView';
import { SprintBoard } from '../components/SprintBoard';
import { SprintSummaryModal } from '../components/SprintSummaryModal';

export default function LeadDashboard() {
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'Overview');
  
  useEffect(() => {
    const tab = searchParams?.get('tab') || 'Overview';
    setActiveTab(tab);
  }, [searchParams]);

  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const { notifications, markAsRead, clearAll, fetchNotifications } = useNotificationStore();

  useEffect(() => { fetchNotifications(); }, []);
  
  // OPTIMIZED: Using specific selectors for Zustand to prevent unnecessary re-renders
  const tasks = useWorkflowStore(state => state.tasks);
  const projects = useWorkflowStore(state => state.projects);
  const currentProject = useWorkflowStore(state => state.currentProject);
  const currentSprint = useWorkflowStore(state => state.currentSprint);
  const fetchTasks = useWorkflowStore(state => state.fetchTasks);
  const fetchProjects = useWorkflowStore(state => state.fetchProjects);
  const fetchMembers = useWorkflowStore(state => state.fetchMembers);
  const members = useWorkflowStore(state => state.members);

  const [data, setData] = useState<any>({ prs: [], users: [], tasks: [] });

  // OPTIMIZED: Memoize derived statistics
  const overviewStats = React.useMemo(() => {
    const totalTasksInSprint = data.tasks.filter((t: any) => t.sprintId === currentSprint?.id).length;
    const doneTasks = data.tasks.filter((t: any) => t.sprintId === currentSprint?.id && (t.status === 'DONE' || t.status === 'done'));
    const completionPct = totalTasksInSprint > 0 ? Math.round((doneTasks.length / totalTasksInSprint) * 100) : 0;
    const blockedTasks = data.tasks.filter((t: any) => t.status === 'BLOCKED');
    const backlogTasks = data.tasks.filter((t: any) => !t.sprintId);

    return {
      completionPct,
      doneCount: doneTasks.length,
      totalCount: totalTasksInSprint,
      blockedCount: blockedTasks.length,
      backlogCount: backlogTasks.length
    };
  }, [data.tasks, currentSprint?.id]);

  const isInitialFetched = React.useRef(false);
  const currentProjectId = currentProject?.id;
  const currentSprintId = currentSprint?.id;

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      await Promise.all([
        fetchProjects(silent),
        fetchMembers()
      ]);

      const [prsRes, tasksRes, usersRes] = await Promise.all([
        api.get('/pull-requests?status=OPEN').catch(() => ({ data: [] })),
        api.get('/issues').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] }))
      ]);

      let rawUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
      let rawTasks = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data?.data || []);
      let rawPRs = Array.isArray(prsRes.data) ? prsRes.data : (prsRes.data?.data || []);

      // Normalize IDs
      const normalizedUsers = rawUsers.filter(Boolean).map((u: any) => ({ ...u, id: u?.id || u?._id, _id: u?._id || u?.id }));
      const normalizedTasks = rawTasks.filter(Boolean).map((t: any) => ({ ...t, id: t?.id || t?._id, _id: t?._id || t?.id }));
      const normalizedPRs = rawPRs.filter(Boolean).map((p: any) => ({ ...p, id: p?.id || p?._id, _id: p?._id || p?.id }));

      setData({
        prs: normalizedPRs,
        users: normalizedUsers,
        tasks: normalizedTasks
      });

      if (currentProjectId) {
        await fetchTasks({ projectId: currentProjectId, sprintId: currentSprintId }, silent);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentProjectId, currentSprintId, fetchProjects, fetchMembers, fetchTasks]);

  useEffect(() => {
    if (!user || (user.role !== 'TEAM_LEAD' && user.role !== 'ADMIN')) {
      router('/unauthorized');
      return;
    }
    
    // Initial fetch once
    if (!isInitialFetched.current) {
      fetchData(false);
      isInitialFetched.current = true;
    }

    socketService.connect();

    return () => {
    };
  }, [user, router, fetchData]);

  useEffect(() => {
    if (currentProjectId) {
      fetchTasks({ projectId: currentProjectId, sprintId: currentSprintId });
    }
  }, [currentProjectId, currentSprintId, fetchTasks]);

  if (loading || !data) return <Preloader />;

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  
  const getMemberStats = (userId: string) => {
    const userTasks = data.tasks.filter((t: any) => t.assigneeId === userId);
    return {
      tasks: userTasks.length,
      prs: data.prs?.filter((p: any) => p.authorId === userId).length || 0,
      blockers: userTasks.filter((t: any) => t.status === 'BLOCKED').length
    };
  };

  const leads = data.users.filter((u: any) => {
    if (String(u.id) === String(user?.id) || u.email === user?.email || u.name === user?.name) return false;
    const r = (u.role || '').toUpperCase();
    return r === 'TEAM_LEAD' || r === 'ADMIN' || r === 'MANAGER';
  });
  const devs = data.users.filter((u: any) => {
    if (String(u.id) === String(user?.id) || u.email === user?.email || u.name === user?.name) return false;
    const r = (u.role || '').toUpperCase();
    return r === 'DEVELOPER' || r === 'MEMBER' || r === '';
  });
  const testers = data.users.filter((u: any) => {
    if (String(u.id) === String(user?.id) || u.email === user?.email || u.name === user?.name) return false;
    const r = (u.role || '').toUpperCase();
    return r === 'TESTER' || r === 'QA';
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FDFBF7] font-sans text-slate-900 overflow-hidden">
      {/* Premium Header Bar */}
      {activeTab !== 'Projects' && activeTab !== 'Backlog' && activeTab !== 'SprintPlanner' && 
       activeTab !== 'Assignment' && activeTab !== 'Blockers' && activeTab !== 'CodeReview' && 
       activeTab !== 'Team' && activeTab !== 'Workload' && activeTab !== 'Settings' && activeTab !== 'SprintBoard' && (
        <div className="px-6 py-5 flex items-end justify-between shrink-0">
           <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Team Lead Dashboard</h1>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                 <span>{currentSprint?.name || 'No Active Sprint'}</span>
                 <span>•</span>
                 <span>{currentProject?.name || 'No Project Selected'}</span>
              </div>
           </div>

           <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSummaryModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 text-slate-900 rounded-lg text-[10px] font-semibold hover:bg-slate-50 transition-all shadow-sm"
              >
                 <Flag size={13} /> Complete Sprint
              </button>
              <button 
                onClick={() => setActiveTab('Assignment')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#065F46] text-white rounded-lg text-[10px] font-semibold hover:bg-[#047857] transition-all shadow-md shadow-emerald-900/10"
              >
                 <UserPlus size={13} /> Assign Tasks
              </button>
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'Overview' && (
           <div className="px-6 pb-6 max-w-[1400px] space-y-6">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Sprint completion" value={`${overviewStats.completionPct}%`} subtext={`${overviewStats.doneCount} of ${overviewStats.totalCount} tasks done`} color="text-green-600" />
              <StatCard label="PRs to review" value={data.prs?.length || 0} subtext="Awaiting review" color="text-red-600" />
              <StatCard label="Active blockers" value={overviewStats.blockedCount} subtext="Needs resolution" color="text-red-600" />
              <StatCard label="Backlog items" value={overviewStats.backlogCount} subtext="Next sprint ready" color="text-yellow-500" />
            </div>

            {/* MIDDLE GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               {/* PR REVIEW QUEUE */}
               <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">PR review queue</h3>
                     <button onClick={() => setActiveTab('CodeReview')} className="text-[12px] font-medium text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                        All PRs <ArrowUpRight size={14} />
                     </button>
                  </div>
                  <div className="space-y-6">
                     {data.prs?.length > 0 ? data.prs.slice(0, 3).map((pr: any) => (
                       <PRItem 
                          key={pr.id}
                          initials={getInitials(pr.author?.name || 'User')} 
                          name={pr.title} 
                          meta={`${pr.author?.name || 'Dev'} · ${new Date(pr.createdAt).toLocaleDateString()} · ${pr.filesChanged || 1} files`} 
                          status={pr.status} 
                          statusColor="bg-slate-50 text-slate-600" 
                          avatarBg="bg-blue-900" 
                       />
                     )) : (
                       <p className="text-[12px] text-slate-400 italic">No pull requests awaiting review.</p>
                     )}
                  </div>
               </div>

               {/* ACTIVE BLOCKERS */}
               <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">Active blockers</h3>
                     <button onClick={() => setActiveTab('Blockers')} className="text-[12px] font-medium text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors">
                        Resolve <ArrowUpRight size={14} />
                     </button>
                  </div>
                  <div className="space-y-6">
                     {data.tasks.filter((t:any)=>t.status==='BLOCKED').length > 0 ? 
                      data.tasks.filter((t:any)=>t.status==='BLOCKED').slice(0, 3).map((t: any) => (
                       <BlockerItem key={t.id} title={`Task #${t.id.slice(-4).toUpperCase()} — ${t.title}`} meta={`${t.assignee?.name || 'Unassigned'} · ${t.priority} priority`} />
                     )) : (
                       <p className="text-[12px] text-slate-400 italic">No active blockers reported.</p>
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Projects' && (
           <div className="flex-1 overflow-y-auto">
              <ProjectsView projects={projects} onNewProject={() => setIsCreateModalOpen(true)} />
           </div>
        )}

        {activeTab === 'Team' && (
           <TeamView />
        )}

        {activeTab === 'Workload' && (
           <WorkloadView />
        )}

        <CreateProjectModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
        />

        {activeTab === 'Messages' && (
           <div className="h-full">
              <MessagesView />
           </div>
        )}

        {activeTab === 'Backlog' && (
           <BacklogView onNavigate={setActiveTab} />
        )}

        {activeTab === 'SprintPlanner' && (
           <SprintPlanner />
        )}

        {activeTab === 'SprintBoard' && (
           <SprintBoard 
             onTaskClick={() => {}} 
             onCreateTask={() => {}} 
             onBacklogClick={() => setActiveTab('Backlog')}
             sprintId={currentSprint?.id}
           />
        )}

        {activeTab === 'Blockers' && (
           <BlockersView />
        )}

        {activeTab === 'CodeReview' && (
           <PRReviewQueueView />
        )}

        {activeTab === 'Assignment' && (
           <TaskAssignmentView />
        )}

        {activeTab === 'ReviewHistory' && (
          <div className="flex-1 overflow-y-auto p-10 max-w-[900px] mx-auto w-full">
            <ReviewHistoryPanel reviews={[]} loading={false} />
          </div>
        )}


        {activeTab === 'Burndown' && (
          <div className="flex-1 p-10">
            <BurndownChart />
          </div>
        )}

        {activeTab === 'Notifications' && (
          <div className="flex-1 overflow-y-auto p-10 bg-[#FDFBF7]">
            <div className="max-w-[800px] mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{notifications.filter(n => !n.read).length} unread</p>
                </div>
                <button onClick={() => clearAll()} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm">Mark all read</button>
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-20">
                  <Bell size={32} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No notifications</p>
                  <p className="text-sm text-slate-400 mt-1">You're all caught up!</p>
                </div>
              ) : notifications.map((n:any) => (
                <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${ n.read ? 'bg-white border-slate-100 opacity-60' : n.type === 'ERROR' ? 'bg-rose-50 border-rose-100' : n.type === 'WARNING' ? 'bg-amber-50 border-amber-100' : n.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-black text-slate-900">{n.title}</p>
                      <p className="text-[12px] font-medium text-slate-600 mt-1">{n.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-slate-400">{new Date(n.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                      {!n.read && <div className="w-2 h-2 bg-indigo-500 rounded-full ml-auto mt-1" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Activity' && (
          <div className="flex-1 overflow-y-auto p-10">
            <ActivityFeed />
          </div>
        )}

        {activeTab === 'Settings' && (
           <SettingsView />
        )}
        
        {isSummaryModalOpen && currentSprint?.id && (
            <SprintSummaryModal 
              isOpen={isSummaryModalOpen} 
              onClose={() => setIsSummaryModalOpen(false)} 
              sprintId={currentSprint.id} 
            />
         )}
      </div>
    </div>
  );
}

function SummaryCard({ label, val, sub, color }: any) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200">
      <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-4">{label}</p>
      <p className={`text-3xl font-semibold ${color} tracking-tight mb-2`}>{val}</p>
      <p className="text-[11px] text-slate-400 font-medium">{sub}</p>
    </div>
  );
}

function StatCard({ label, value, subtext, color }: any) {
  return (
    <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm shadow-slate-100/30">
      <p className="text-[8px] font-medium text-slate-900 uppercase tracking-[0.1em] mb-1.5">{label}</p>
      <p className={`text-xl font-semibold ${color} tracking-tight mb-1`}>{value}</p>
      <p className="text-[9px] font-medium text-slate-500">{subtext}</p>
    </div>
  );
}

function TeamStatCard({ label, val, color = 'text-slate-900' }: any) {
  return (
    <div className="bg-white/50 p-8 rounded-2xl border border-slate-200">
      <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-4xl font-semibold ${color} tracking-tight`}>{val}</p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em]">{title}</h3>;
}

function TeamMemberCard({ initials, name, role, stats, workload, status, onlineStatus, highlight = false, labels = ['Tasks', 'PRs', 'Blockers'] }: any) {
  const statusColor = { online: 'bg-emerald-500', away: 'bg-amber-500', dnd: 'bg-rose-500', offline: 'bg-slate-300' }[onlineStatus as 'online' | 'away' | 'dnd' | 'offline'];
  const workloadColor = workload > 90 ? 'bg-rose-500' : workload > 80 ? 'bg-amber-600' : workload > 50 ? 'bg-blue-600' : 'bg-emerald-600';

  return (
    <div className={`bg-white rounded-[24px] border p-8 space-y-6 transition-all ${highlight ? 'border-blue-600 ring-4 ring-blue-50' : 'border-slate-200'}`}>
       <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
             <div className="relative">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 font-semibold text-lg border border-slate-100">{initials}</div>
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${statusColor} rounded-full border-2 border-white`} />
             </div>
             <div>
                <h4 className="text-lg font-semibold text-slate-900">{name}</h4>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-semibold uppercase tracking-wider">{role}</span>
             </div>
          </div>
          <button className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl text-[12px] font-semibold hover:bg-slate-50">
            <MessageCircle size={14} className="text-slate-400" /> Message
          </button>
       </div>
       <div className="grid grid-cols-3 text-center">
          {Object.values(stats).map((val: any, i) => (
            <div key={i}>
               <p className="text-[15px] font-semibold text-slate-900">{val}</p>
               <p className="text-[10px] text-slate-400 uppercase tracking-tight">{labels[i]}</p>
            </div>
          ))}
       </div>
       <div className="space-y-2">
          <div className="flex justify-between items-center text-[11px] font-medium text-slate-400 uppercase tracking-tight">
             <span>Workload</span>
             <span className="text-slate-900">{workload}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
             <div className={`h-full ${workloadColor} transition-all`} style={{ width: `${workload}%` }} />
          </div>
       </div>
       <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl inline-block">
          <p className="text-[11px] font-medium text-slate-600">{status}</p>
       </div>
    </div>
  );
}

function PRItem({ initials, name, meta, status, statusColor, avatarBg }: any) {
  return (
    <div className="flex items-center justify-between py-1">
       <div className="flex items-center gap-4">
          <div className={`w-10 h-10 ${avatarBg} rounded-full flex items-center justify-center text-white text-[11px] font-medium`}>{initials}</div>
          <div>
             <p className="text-[13px] font-semibold text-slate-900">{name}</p>
             <p className="text-[11px] text-slate-400 mt-0.5">{meta}</p>
          </div>
       </div>
       <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusColor}`}>{status}</span>
    </div>
  );
}

function BlockerItem({ title, meta }: any) {
  return (
    <div className="flex items-start gap-4 py-1">
       <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500 border border-rose-100"><AlertCircle size={16} /></div>
       <div>
          <p className="text-[13px] font-semibold text-slate-900 leading-snug mb-0.5">{title}</p>
          <p className="text-[11px] text-slate-400 uppercase tracking-wide">{meta}</p>
       </div>
    </div>
  );
}

