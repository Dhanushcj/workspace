

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate as useRouter, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import Preloader from '../components/Preloader';
import { useNotificationStore } from '../store/notificationStore';
import { 
  Bell, RefreshCw, Clock, LayoutGrid, Users, Activity, 
  Settings, Kanban, Layers, Download, Plus, CircleCheck,
  AlertCircle, ArrowUpRight, Timer, Monitor, Bug, ShieldAlert,
  TrendingUp, History, UserCog, MoreVertical, Search,
  Mail, MessageCircle, MessageSquare, X, Code2, FlaskConical
} from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { socketService } from '../lib/socket';
import toast from 'react-hot-toast';
import SprintPlanner from '../components/SprintPlanner';
import { SprintBoard } from '../components/SprintBoard';
import CreateProjectModal from '../components/CreateProjectModal';

export default function ManagerDashboard() {
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'Overview';
  
  const { user } = useAuthStore();
  
  // OPTIMIZED: Using specific selectors for Zustand to prevent unnecessary re-renders
  const tasks = useWorkflowStore(state => state.tasks);
  const projects = useWorkflowStore(state => state.projects);
  const currentProject = useWorkflowStore(state => state.currentProject);
  const currentSprint = useWorkflowStore(state => state.currentSprint);
  const fetchTasks = useWorkflowStore(state => state.fetchTasks);
  const fetchProjects = useWorkflowStore(state => state.fetchProjects);
  const fetchMembers = useWorkflowStore(state => state.fetchMembers);
  const members = useWorkflowStore(state => state.members);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'DEVELOPER' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
      toast.error('All fields are required');
      return;
    }
    setIsCreatingUser(true);
    try {
      const response = await api.post('/auth/register', newUser);
      if (response.status === 201 || response.status === 200) {
        toast.success('User created successfully');
        setIsAddUserModalOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'DEVELOPER' });
        await fetchData(true);
      }
    } catch (err: any) {
      console.error('[ERROR] Create user failed:', err);
      
      const serverMessage = err.response?.data?.message;
      const validationErrors = err.response?.data?.errors;
      
      if (validationErrors) {
        const allMsgs = Object.entries(validationErrors)
          .map(([key, val]: any) => {
            const cleanKey = key.replace('body.', '');
            return `${cleanKey}: ${Array.isArray(val) ? val.join(', ') : val}`;
          })
          .join(' | ');
        toast.error(`Validation Error - ${allMsgs}`);
      } else {
        toast.error(serverMessage || 'Failed to create user. Please try again.');
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const isInitialFetched = React.useRef(false);
  const currentProjectId = currentProject?.id;
  const currentSprintId = currentSprint?.id;

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Fetch core workspace data
      await Promise.all([
        fetchProjects(silent),
        fetchMembers()
      ]);

      // Fetch supplementary metrics
      const [bugsRes, prsRes, tasksRes] = await Promise.all([
        api.get('/bug-reports?status=OPEN').catch(() => ({ data: [] })),
        api.get('/pull-requests?status=OPEN').catch(() => ({ data: [] })),
        api.get('/issues').catch(() => ({ data: [] }))
      ]);

      const bugsData = Array.isArray(bugsRes.data) ? bugsRes.data : (bugsRes.data?.data || []);
      const prsData = Array.isArray(prsRes.data) ? prsRes.data : (prsRes.data?.data || []);
      const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data?.data || []);

      const latestState = useWorkflowStore.getState();
      setData({
        projects: latestState.projects || [],
        tasks: tasksData,
        users: latestState.members || [],
        bugs: bugsData,
        prs: prsData
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
    if (!user || user.role.toLowerCase() !== 'manager') {
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
      prs: 0,
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
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] font-sans text-slate-900">
      {/* Premium Header Bar */}
      {activeTab === 'Overview' && (
        <div className="bg-white border-b border-slate-200/60 px-10 py-6 flex items-center justify-between sticky top-0 z-10">
           <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manager Dashboard</h1>
              <p className="text-[12px] font-medium text-slate-400 mt-1">Forge India PMT · {user?.name} · All Projects</p>
           </div>

           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[12px] font-bold hover:bg-slate-50 transition-all shadow-sm">
                 <Download size={16} /> Export
              </button>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2 bg-[#1A3A8F] text-white rounded-xl text-[12px] font-bold hover:bg-[#162f75] transition-all shadow-lg shadow-blue-900/10"
              >
                 <Plus size={16} /> New Project
              </button>
           </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'Overview' && (
          <div className="p-10 max-w-[1600px] mx-auto space-y-8">
            
            {/* Stats Cards Row */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                   label="Active projects" 
                   value={data.projects.length} 
                   subtext="Total tracked" 
                   color="text-slate-900"
                />
                <StatCard 
                   label="Pending approvals" 
                   value={data.prs.length} 
                   subtext="PRs needing review" 
                   color="text-rose-600"
                />
                <StatCard 
                   label="Team members" 
                   value={data.users.length} 
                   subtext="Active in workspace" 
                   color="text-slate-900"
                />
                <StatCard 
                   label="Open bugs" 
                   value={data.bugs.length} 
                   subtext="Reported issues" 
                   color="text-rose-600"
                />
             </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               {/* Left Column: Recent Approvals & Workload */}
               <div className="xl:col-span-2 space-y-8">
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                     <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[14px] font-bold text-slate-900">Recent PRs</h3>
                        <button onClick={() => router('?tab=Projects')} className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">View all →</button>
                     </div>
                     <div className="space-y-4">
                        {data.prs.slice(0, 3).map((pr: any) => (
                          <ApprovalsListItem 
                             key={pr.id}
                             type="PR" 
                             title={pr.title} 
                             meta={`${pr.author?.name || 'Dev'} · ${new Date(pr.createdAt).toLocaleDateString()}`} 
                             color="text-blue-600 bg-blue-50 border-blue-100"
                          />
                        ))}
                        {data.prs.length === 0 && <p className="text-[12px] text-slate-400 italic">No pending pull requests.</p>}
                     </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                     <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[14px] font-bold text-slate-900">Team Allocation</h3>
                     </div>
                     <div className="grid grid-cols-1 gap-6">
                        {data.users.slice(0, 5).map((u: any) => {
                          const stats = getMemberStats(u.id);
                          const load = Math.min(100, stats.tasks * 20);
                          return (
                            <WorkloadItem key={u.id} name={u.name} load={load} color={load > 80 ? 'bg-rose-500' : 'bg-blue-600'} initials={getInitials(u.name)} />
                          );
                        })}
                     </div>
                  </div>
               </div>

               {/* Right Column: Project Health */}
               <div className="space-y-8">
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                     <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[14px] font-bold text-slate-900">Project Health</h3>
                     </div>
                     <div className="space-y-4">
                        {data.projects.map((p: any) => (
                          <ProjectHealthItem key={p.id} name={p.name} sprint={p.activeSprint?.name || 'No Sprint'} status={p.status || 'Active'} color="text-emerald-600 bg-emerald-50 border-emerald-100" />
                        ))}
                        {data.projects.length === 0 && <p className="text-[12px] text-slate-400 italic">No projects found.</p>}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Projects' && (
          <div className="p-10 max-w-[1600px] mx-auto space-y-8">
            <div className="flex items-center justify-between">
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
               <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#1A3A8F] text-white rounded-xl text-[12px] font-bold shadow-lg shadow-blue-900/10 hover:bg-[#162f75] transition-all">
                  <Plus size={16} /> New Project
               </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               {data.projects.map((p: any) => (
                 <ProjectCard 
                    key={p.id}
                    name={p.name} 
                    sprint={p.activeSprint?.name || 'No Sprint'} 
                    progress={p.completion || 0} 
                    status={p.status || 'Active'} 
                    statusColor="text-emerald-600 bg-emerald-50 border-emerald-100"
                    prs={p.prCount || 0} 
                    blocked={p.blockerCount || 0} 
                 />
               ))}
               {data.projects.length === 0 && (
                 <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                   <p className="text-slate-400 font-medium">No projects found in this workspace.</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'Team' && (
          <div className="p-10 max-w-[1600px] mx-auto space-y-10">
             <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Overview</h1>
                  <p className="text-[12px] font-medium text-slate-400 mt-1">E-Commerce Platform · Sprint 3 · 8 members</p>
                </div>
                <div className="flex items-center gap-3">
                   <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[12px] font-bold hover:bg-slate-50 transition-all shadow-sm">
                      <Mail size={16} /> Message all
                   </button>
                   <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1A3A8F] text-white rounded-xl text-[12px] font-bold shadow-lg shadow-blue-900/10 hover:bg-[#162f75] transition-all">
                      <UserCog size={16} /> Manage Access
                   </button>
                </div>
             </div>

             {/* Team Metrics Bar */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <TeamSummaryCard label="Total members" value={data.users.length} icon={Users} />
                <TeamSummaryCard label="Online now" value={Math.floor(data.users.length * 0.7)} icon={Activity} color="text-emerald-600" />
                <TeamSummaryCard label="Active tasks" value={data.tasks.filter((t:any)=>t.status!=='DONE').length} icon={LayoutGrid} />
                <TeamSummaryCard label="Blocked" value={data.tasks.filter((t:any)=>t.status==='BLOCKED').length} icon={ShieldAlert} color="text-rose-600" />
             </div>

             <div className="space-y-12">
                {leads.length > 0 && (
                  <div className="space-y-6">
                     <SectionTitle title="TEAM LEADS" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {leads.map((u: any) => (
                         <TeamMemberCard key={u.id} initials={getInitials(u.name)} name={u.name} role={u.role} stats={getMemberStats(u.id)} workload={70} status="Managing organizational goals" onlineStatus="online" />
                       ))}
                     </div>
                  </div>
                )}
                {devs.length > 0 && (
                  <div className="space-y-6">
                     <SectionTitle title="DEVELOPERS" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {devs.map((u: any) => (
                         <TeamMemberCard key={u.id} initials={getInitials(u.name)} name={u.name} role={u.role} stats={getMemberStats(u.id)} workload={80} status="Building high-performance modules" onlineStatus="online" />
                       ))}
                     </div>
                  </div>
                )}
                {testers.length > 0 && (
                  <div className="space-y-6">
                     <SectionTitle title="TESTERS" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {testers.map((u: any) => (
                         <TeamMemberCard key={u.id} initials={getInitials(u.name)} name={u.name} role={u.role} stats={getMemberStats(u.id)} workload={60} status="Ensuring application reliability" onlineStatus="online" />
                       ))}
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'SprintPlanner' && (
          <SprintPlanner />
        )}

        {activeTab === 'SprintBoard' && (
           <SprintBoard 
             onTaskClick={() => {}} 
             onCreateTask={() => {}} 
           />
        )}

        {activeTab === 'Settings' && (
           <div className="p-20 text-center space-y-4">
              <Settings size={48} className="mx-auto text-slate-200" />
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Configuration module encrypted</p>
           </div>
        )}

        {activeTab === 'UserManagement' && (
          <div className="p-10 max-w-[1600px] mx-auto space-y-10">
             <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Directory</h1>
                  <p className="text-[12px] font-medium text-slate-400 mt-1">Manage working organization users and allocate roles</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input
                       type="text"
                       value={userSearch}
                       onChange={(e) => setUserSearch(e.target.value)}
                       placeholder="Search users by name or email..."
                       className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-[280px] shadow-sm transition-all"
                     />
                   </div>
                   <button 
                     onClick={() => setIsAddUserModalOpen(true)}
                     className="flex items-center gap-2 px-5 py-2.5 bg-[#534AB7] text-white rounded-xl text-[12px] font-bold shadow-lg shadow-indigo-900/10 hover:bg-[#463ea3] transition-all"
                   >
                      <Plus size={16} /> Add New User
                   </button>
                </div>
             </div>

             {/* User Statistics Row */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <TeamSummaryCard label="Total Members" value={data.users.length} icon={Users} color="text-indigo-600" />
                <TeamSummaryCard label="Team Leads" value={data.users.filter((u: any) => u.role === 'TEAM_LEAD' || u.role === 'ADMIN').length} icon={ShieldAlert} color="text-emerald-600" />
                <TeamSummaryCard label="Developers" value={data.users.filter((u: any) => u.role === 'DEVELOPER' || u.role === 'MEMBER').length} icon={Code2} color="text-blue-600" />
                <TeamSummaryCard label="Testers" value={data.users.filter((u: any) => u.role === 'TESTER').length} icon={FlaskConical} color="text-amber-600" />
             </div>

             {/* User Directory Table */}
             <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designated Role</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {data.users
                           .filter((u: any) => 
                             u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                             u.email?.toLowerCase().includes(userSearch.toLowerCase())
                           )
                           .map((u: any) => {
                              let roleColor = 'bg-slate-50 text-slate-500 border-slate-200';
                              if (u.role === 'TEAM_LEAD' || u.role === 'ADMIN') roleColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                              else if (u.role === 'DEVELOPER') roleColor = 'bg-blue-50 text-blue-600 border-blue-100';
                              else if (u.role === 'TESTER') roleColor = 'bg-amber-50 text-amber-600 border-amber-100';
                              else if (u.role === 'MANAGER') roleColor = 'bg-indigo-50 text-indigo-600 border-indigo-100';
                              
                              return (
                                 <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                       <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center text-[11px] font-black text-slate-500 shadow-sm">
                                             {getInitials(u.name)}
                                          </div>
                                          <div>
                                             <p className="text-[13px] font-bold text-slate-900">{u.name}</p>
                                             <p className="text-[10px] font-medium text-slate-400 capitalize mt-0.5">{u.role?.toLowerCase() || 'member'}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-[13px] font-medium text-slate-600">
                                       {u.email}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                       <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${roleColor}`}>
                                          {u.role || 'MEMBER'}
                                       </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                       <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                          Active
                                       </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                       <button 
                                         onClick={() => {
                                           toast.success(`Allocated task payload reviewed for ${u.name}`);
                                         }}
                                         className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                       >
                                          <UserCog size={16} />
                                       </button>
                                    </td>
                                 </tr>
                              );
                           })}
                         {data.users.filter((u: any) => 
                             u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                             u.email?.toLowerCase().includes(userSearch.toLowerCase())
                           ).length === 0 && (
                            <tr>
                               <td colSpan={5} className="py-16 text-center">
                                  <Users size={32} className="mx-auto text-slate-200 mb-2" />
                                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">No users found</p>
                               </td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        <CreateProjectModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
        />

        {isAddUserModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-[480px] rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 p-8 space-y-6">
                <div className="flex items-center justify-between">
                   <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Add New Workspace User</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Deploy new identity credentials</p>
                   </div>
                   <button 
                     onClick={() => setIsAddUserModalOpen(false)}
                     className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                   >
                      <X size={16} />
                   </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
                      <input 
                        type="text"
                        required
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Sarah Connor"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-xs font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-[#534AB7] transition-all placeholder:text-slate-300"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                      <input 
                        type="email"
                        required
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="sarah@forgeindia.com"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-xs font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-[#534AB7] transition-all placeholder:text-slate-300"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Security Key (Password)</label>
                      <input 
                        type="password"
                        required
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-xs font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-[#534AB7] transition-all placeholder:text-slate-300"
                      />
                       <p className="text-[9px] font-semibold text-indigo-400/80 px-1 mt-1 leading-normal">
                          Requires at least 8 characters, one uppercase letter, and one number.
                       </p>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">System Role</label>
                      <select 
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-[#534AB7] transition-all text-slate-700"
                      >
                         <option value="DEVELOPER">DEVELOPER</option>
                         <option value="TESTER">TESTER</option>
                         <option value="TEAM_LEAD">TEAM LEAD</option>
                         <option value="MANAGER">MANAGER</option>
                      </select>
                   </div>

                   <button 
                     type="submit"
                     disabled={isCreatingUser}
                     className="w-full py-5 bg-[#534AB7] text-white rounded-[20px] font-black uppercase tracking-[0.25em] text-[10px] shadow-xl shadow-indigo-900/10 hover:bg-[#463ea3] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                      {isCreatingUser ? 'Deploying...' : 'Deploy User'}
                   </button>
                </form>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, subtext, color }: any) {
  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-2 shadow-sm transition-all hover:border-blue-100">
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
       <p className={`text-3xl font-black ${color}`}>{value}</p>
       <p className="text-[11px] font-medium text-slate-400">{subtext}</p>
    </div>
  );
}

function ApprovalsListItem({ type, title, meta, color }: any) {
  return (
    <div className="flex items-center justify-between p-5 bg-slate-50/30 rounded-2xl border border-slate-50 transition-all hover:border-slate-200 group">
       <div className="flex items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
             <CircleCheck size={20} />
          </div>
          <div>
             <p className="text-[14px] font-bold text-slate-900">{title}</p>
             <p className="text-[11px] font-medium text-slate-400 mt-0.5">{meta}</p>
          </div>
       </div>
       <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${color}`}>
          {type}
       </span>
    </div>
  );
}

function ProjectHealthItem({ name, sprint, status, color }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/30 rounded-xl border border-slate-50">
       <div>
          <p className="text-[13px] font-bold text-slate-900">{name}</p>
          <p className="text-[11px] font-medium text-slate-400">{sprint}</p>
       </div>
       <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${color}`}>
          {status}
       </span>
    </div>
  );
}

function WorkloadItem({ name, load, color, initials }: any) {
  return (
    <div className="space-y-2">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">{initials}</div>
             <span className="text-[13px] font-bold text-slate-700">{name}</span>
          </div>
          <span className="text-[12px] font-black text-slate-900">{load}%</span>
       </div>
       <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-50">
          <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${load}%` }} />
       </div>
    </div>
  );
}

function ActivityItem({ user, action, time, initials, color }: any) {
  return (
    <div className="flex items-start gap-4 transition-all hover:translate-x-1 duration-300">
       <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center font-bold text-xs shrink-0 border border-current opacity-80 shadow-sm`}>{initials}</div>
       <div className="flex-1 min-w-0">
          <p className="text-[13px] text-slate-900 leading-snug">
             <span className="font-bold">{user}</span> {action}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1">{time} ago</p>
       </div>
    </div>
  );
}

function TeamMemberCard({ initials, name, role, stats, workload, status, onlineStatus, highlight = false }: any) {
  const statusColor = onlineStatus === 'online' ? 'bg-emerald-500' : 'bg-slate-300';
  return (
    <div className={`bg-white rounded-3xl border p-8 space-y-6 transition-all shadow-sm ${highlight ? 'border-[#1A3A8F] ring-4 ring-blue-50' : 'border-slate-100 hover:border-blue-200'}`}>
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="relative">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 font-bold text-lg border border-slate-100">{initials}</div>
                <div className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 ${statusColor} rounded-full border-2 border-white`} />
             </div>
             <div>
                <h4 className="text-lg font-bold text-slate-900">{name}</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{role}</span>
             </div>
          </div>
          <button className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-100 text-slate-900 rounded-xl text-[12px] font-bold hover:bg-slate-50 shadow-sm transition-all">
            <MessageSquare size={14} className="text-slate-400" /> Message
          </button>
       </div>
       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
          <div className="h-full bg-[#1A3A8F] transition-all" style={{ width: `${workload}%` }} />
       </div>
       <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 rounded-xl">
          <p className="text-[12px] font-medium text-slate-600 truncate">{status}</p>
       </div>
    </div>
  );
}

function ProjectCard({ name, sprint, progress, status, statusColor, prs, blocked }: any) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-6 group hover:border-blue-100 transition-all">
       <div className="flex items-start justify-between">
          <div>
             <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1A3A8F] transition-colors">{name}</h3>
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{sprint}</p>
          </div>
          <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${statusColor}`}>
             {status}
          </span>
       </div>

       <div className="space-y-3">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-tight">
             <span>Progress</span>
             <span className="text-slate-900">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-50">
             <div className="h-full bg-[#1A3A8F] transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
       </div>

       <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
             <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{prs} PRs</span>
          </div>
          <div className="px-3 py-1 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
             <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{blocked} blocked</span>
          </div>
       </div>

       <div className="flex items-center gap-3 pt-2">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A3A8F] text-white rounded-xl text-[11px] font-bold shadow-lg shadow-blue-900/5 hover:bg-[#162f75] transition-all">
             <LayoutGrid size={14} /> Board
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-100 text-slate-600 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-all">
             <Kanban size={14} /> Backlog
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-100 text-slate-600 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-all">
             <Users size={14} /> Team
          </button>
       </div>
    </div>
  );
}

function TeamSummaryCard({ label, value, icon: Icon, color = 'text-slate-900' }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-4 shadow-sm">
       <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center ${color}`}>
          <Icon size={24} />
       </div>
       <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className={`text-2xl font-black ${color}`}>{value}</p>
       </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
       {title}
    </h3>
  );
}
