'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate as useRouter, useSearchParams } from 'react-router-dom';
import { 
  Zap, Flag, Target, Star, 
  MessageSquare, AlertTriangle, 
  ChevronRight, Calendar, 
  Users, LineChart, Bell, Plus,
  Loader, RefreshCw, Clock, Clock3,
  LayoutGrid, Layers, ListTodo, GitBranch, Settings,
  Code2, ShieldAlert, History, Monitor, TrendingUp, ArrowUpRight,
  Download, ListChecks, Kanban, CircleCheck, CheckCircle, FileText, MoreVertical, Play, ArrowRight, UserPlus, AlertCircle, Search, GitPullRequest, MessageCircle, MoreHorizontal, Mail, Bug, Sun
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import Preloader from '../components/tasks/Preloader';
import { useWorkflowStore } from '../store/workflowStore';
import { useNotificationStore } from '../store/notificationStore';
import { socketService } from '../lib/socket';
import { TaskSelectionModal } from '../components/tasks/TaskSelectionModal';
import { ProjectsView } from '../components/tasks/ProjectsView';
import { SprintBoard } from '../components/tasks/SprintBoard';
import { SubmitPRModal } from '../components/tasks/SubmitPRModal';
import { RaiseBlockerModal } from '../components/tasks/RaiseBlockerModal';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';

import Sidebar from '../components/tasks/Sidebar';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { Task } from '../store/workflowStore';
import { useToastStore } from '../store/toastStore';

export default function DeveloperDashboard() {
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Overview';
  
  const storeUser = useAuthStore(state => state.user);
  const user = storeUser || JSON.parse(localStorage.getItem('auth') || 'null');
  
  // OPTIMIZED: Using specific selectors for Zustand to prevent unnecessary re-renders
  const tasks = useWorkflowStore(state => state.tasks);
  const projects = useWorkflowStore(state => state.projects);
  const currentProject = useWorkflowStore(state => state.currentProject);
  const currentSprint = useWorkflowStore(state => state.currentSprint);
  const fetchTasks = useWorkflowStore(state => state.fetchTasks);
  const fetchProjects = useWorkflowStore(state => state.fetchProjects);
  const fetchMembers = useWorkflowStore(state => state.fetchMembers);
  const members = useWorkflowStore(state => state.members);
  const unreadCount = useNotificationStore(state => state.unreadCount);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ prs: [], bugs: [], blockers: [] });
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const [selectedTaskForPR, setSelectedTaskForPR] = useState<any>(null);
  const [isRaiseBlockerOpen, setIsRaiseBlockerOpen] = useState(false);
  const [isBlockerTaskSelectorOpen, setIsBlockerTaskSelectorOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedTaskForBlocker, setSelectedTaskForBlocker] = useState<any>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [selectedTaskDisplayId, setSelectedTaskDisplayId] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [onlineEmails, setOnlineEmails] = useState<string[]>(
    (window as any).latestOnlineEmails || []
  );
  const { addToast } = useToastStore();

  // Listen to global WebSocket presence updates
  useEffect(() => {
    const handleWsMessage = (e: any) => {
      const data = e.detail;
      if (data && data.type === 'presence-update') {
        setOnlineEmails(data.onlineEmails || []);
      }
    };
    window.addEventListener('ws-message', handleWsMessage);
    return () => {
      window.removeEventListener('ws-message', handleWsMessage);
    };
  }, []);

  // OPTIMIZED: Memoize derived statistics to avoid recalculation on every render
  const stats = React.useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return { all: 0, inProgress: 0, dueToday: 0, doneSprint: 0, myTasks: [] };
    const sprintId = currentSprint?.id || (currentSprint as any)?._id;
    const sprintTasksList = tasks.filter(t => sprintId ? (t.sprintId === sprintId || (t as any).sprintId === sprintId) : true);
    
    return {
      all: sprintTasksList.length,
      inProgress: sprintTasksList.filter(t => t?.status === 'IN_PROGRESS').length,
      dueToday: sprintTasksList.filter(t => t?.status !== 'DONE' && t?.priority === 'HIGH').length,
      doneSprint: sprintTasksList.filter(t => t?.status === 'DONE').length,
      myTasks: sprintTasksList.filter(t => t && t.assigneeId === user?.id).slice(0, 5)
    };
  }, [tasks, user?.id, currentSprint]);

  const isInitialFetched = React.useRef(false);
  const currentProjectId = currentProject?.id;
  const currentSprintId = currentSprint?.id;

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // Fetch core data via store
      await Promise.all([
        fetchProjects(silent),
        fetchMembers()
      ]);

      // Fetch specific developer views
      const [prsRes, bugsRes, blockersRes] = await Promise.all([
        api.get(`/pull-requests?status=OPEN&userId=${user?.id}`).catch(() => ({ data: [] })),
        api.get('/issues?type=BUG').catch(() => ({ data: [] })),
        api.get('/blockers?status=ACTIVE').catch(() => ({ data: [] }))
      ]);

      setData({
        prs: Array.isArray(prsRes.data) ? prsRes.data : (prsRes.data?.data || []),
        bugs: Array.isArray(bugsRes.data) ? bugsRes.data : (bugsRes.data?.data || []),
        blockers: Array.isArray(blockersRes.data) ? blockersRes.data : (blockersRes.data?.data || [])
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
    if (!user) {
      router('/login?app=tasks');
      return;
    }
    
    // Only fetch on mount or if fetchData reference changes (which it won't if IDs are stable)
    if (!isInitialFetched.current) {
      fetchData(false);
      isInitialFetched.current = true;
    }

    socketService.connect();
    
    // Real-time message listener
    const handleWsMessage = (e: any) => {
      const data = e.detail;
      if (data && data.type === 'NEW_MESSAGE') {
        const msg = data.message;
        setChatMessages(prev => [...prev, {
          id: msg._id,
          text: msg.content,
          sender: 'remote',
          senderEmail: msg.senderEmail,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    };
    window.addEventListener('ws-message', handleWsMessage);

    return () => {
       window.removeEventListener('ws-message', handleWsMessage);
    };
  }, [user, router, fetchData]);

  useEffect(() => {
    if (currentProjectId) {
      fetchTasks({ projectId: currentProjectId, sprintId: currentSprintId });
    }
  }, [currentProjectId, currentSprintId, fetchTasks]);

  useEffect(() => {
    const targetUserId = searchParams?.get('userId');
    if (activeTab === 'Messages' && targetUserId && user?.email) {
      const targetUser = members.find((m: any) => m.id === targetUserId);
      if (targetUser?.email) {
        api.post('/chat/start-dm', {
          members: [user.email, targetUser.email],
          workspaceId: currentProjectId || 'forge-india-connect'
        }).then(res => {
          return api.get(`/chat/${currentProjectId || 'forge-india-connect'}/${res.data._id}`);
        }).then(res => {
          setChatMessages(res.data.map((msg: any) => ({
            id: msg._id,
            text: msg.content,
            sender: msg.senderEmail === user.email ? 'me' : 'remote',
            senderEmail: msg.senderEmail,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })));
        }).catch(err => console.error("Failed to fetch history", err));
      }
    }
  }, [activeTab, searchParams, members, user, currentProjectId]);

  const handleCreatePRClick = () => {
    setIsTaskSelectorOpen(true);
  };

  const handleTaskSelectForPR = async (task: Task) => {
    if (!task) {
      console.error('[PR-ERROR] No task provided to handleTaskSelectForPR');
      return;
    }
    
    console.log('[PR-FLOW] Creating PR for task:', task.id);
    setIsTaskSelectorOpen(false);
    
    try {
      // Safety check for task properties
      const taskId = task.id || (task as any)._id;
      if (!taskId) throw new Error('Task ID is missing');

      // Auto-generate PR details as requested (skipping the submission form)
      const prData = {
        title: `PR: ${task.title || 'Untitled Task'}`,
        description: `Pull request for task ${taskId}`,
        branchName: `dev/task-${String(taskId).slice(-4).toLowerCase()}`,
        targetBranch: 'develop'
      };

      if (!user?.id) throw new Error('User session not found. Please log in again.');

      console.log('[PR-FLOW] Submitting to backend:', `/pull-requests/tasks/${taskId}`, prData);
      
      const response = await api.post(`/pull-requests/tasks/${taskId}`, prData);
      console.log('[PR-FLOW] Backend response:', response.data);

      addToast({ type: 'SUCCESS', title: 'PR Created', message: 'Pull request has been created automatically.' });
      
      // Refresh data
      fetchData(true);
      if (currentProjectId) {
        fetchTasks({ projectId: currentProjectId, sprintId: currentSprintId });
      }
    } catch (err: any) {
      console.error('[PR-FATAL] Submission failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Could not create PR automatically.';
      addToast({ 
        type: 'ERROR', 
        title: 'Submission Failed', 
        message: errorMessage
      });
    }
  };

  const handleSubmitPR = async (taskId: string, prData: any) => {
    try {
      await api.post(`/pull-requests/tasks/${taskId}`, prData);
      addToast({ type: 'SUCCESS', title: 'PR Submitted', message: 'Pull request has been created successfully.' });
      fetchData(true);
      fetchTasks({ projectId: currentProjectId!, sprintId: currentSprintId });
    } catch (err: any) {
      throw err;
    }
  };

  const handleRaiseBlockerClick = () => {
    setIsBlockerTaskSelectorOpen(true);
  };

  const handleBlockerTaskSelect = (task: Task) => {
    setSelectedTaskForBlocker(task);
    setIsBlockerTaskSelectorOpen(false);
    setIsRaiseBlockerOpen(true);
  };

  const handleRaiseBlockerSubmit = async (taskId: string, description: string) => {
    try {
      await api.post(`/tasks/${taskId}/blocker`, {
        title: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
        description: description,
        severity: 'HIGH',
        type: 'OTHER'
      });
      addToast({ type: 'SUCCESS', title: 'Blocker Raised', message: 'Blocker has been reported to the team.' });
      
      // Refresh tasks and developer blocker data
      fetchData(true);
      if (currentProjectId) {
        fetchTasks({ projectId: currentProjectId, sprintId: currentSprintId });
      }
      setIsRaiseBlockerOpen(false);
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Failed', message: 'Could not raise blocker.' });
    }
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim()) return;
    
    const targetUserId = searchParams?.get('userId');
    if (!targetUserId) return;

    const targetUser = members.find((m: any) => m.id === targetUserId);
    if (!targetUser?.email) return;

    const msgText = msgInput;
    setMsgInput(''); // optimistic clear
    
    const newMsg = {
      id: Date.now(),
      text: msgText,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, newMsg]);

    try {
       // 1. Ensure conversation exists and get channelId
       const dmRes = await api.post('/chat/start-dm', {
         members: [user?.email, targetUser.email],
         workspaceId: currentProjectId || 'forge-india-connect' 
       });

       // 2. Post message to the channel
       await api.post(`/chat/${currentProjectId || 'forge-india-connect'}/${dmRes.data._id}/messages`, {
         content: msgText
       });
    } catch (err) {
       console.error('Failed to send message', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  if (loading || !data) return <Preloader />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAFAFA] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] font-sans text-slate-900">
        
        {/* Top Header Row */}
        <header className="h-[72px] bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Search Workspace..."
                className="w-64 bg-slate-50 border border-slate-100 rounded-full py-1.5 pl-9 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-400 shadow-sm">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-400 shadow-sm">K</kbd>
              </div>
            </div>
            
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} strokeWidth={1.5} />
              {(unreadCount > 0) && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />}
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Sun size={20} strokeWidth={1.5} />
            </button>
            
            <div className="flex items-center gap-2 pl-4 border-l border-slate-100 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.user?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'D'}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">{user?.user || 'Developer'}</div>
                <div className="text-[10px] font-semibold text-slate-400">{user?.role || 'DEVELOPER'}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">

        {activeTab === 'Overview' && (
          <div className="p-10 w-full space-y-10">
            {/* HEADER */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-800">Developer Workspace</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {user?.name || 'Nexus Developer'} · {currentProject?.name || 'No Project Selected'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleRaiseBlockerClick}
                  className="px-4 py-2 border border-rose-200 text-rose-600 rounded-xl text-[12px] font-bold hover:bg-rose-50 transition-all shadow-sm"
                >
                  Raise Blocker
                </button>
                <button 
                  onClick={() => setIsCreateTaskModalOpen(true)}
                  className="px-4 py-2 bg-[#1A3A8F] text-white rounded-xl text-[12px] font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-800 transition-all flex items-center gap-2">
                  <Plus size={16} /> New Task
                </button>
              </div>
            </div>

            {/* SUMMARY STATS */}
            <div className="grid grid-cols-5 gap-6">
               <StatCard label="All tasks" val={stats.all} active />
               <StatCard label="In progress" val={stats.inProgress} />
               <StatCard label="Due today" val={stats.dueToday} color="text-amber-600" />
               <StatCard label="Blocked" val={data.blockers.length} color="text-rose-600" />
               <StatCard label="Done sprint" val={stats.doneSprint} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">My Active Tasks</h2>
                  <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 flex items-center gap-1 transition-colors">
                    All tasks <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="space-y-3">
                  {stats.myTasks.map(task => (
                    <MyTaskListItem 
                      key={task.id}
                      task={task}
                      onPRClick={handleTaskSelectForPR}
                      isDone={task.status === 'DONE'}
                      onClick={(t: any) => {
                        setSelectedTaskForDetail(t);
                        setSelectedTaskDisplayId(`#${String(t.id || '').slice(-4).toUpperCase()}`);
                      }}
                    />
                  ))}
                  {stats.myTasks.length === 0 && (
                    <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                       <p className="text-[12px] text-slate-400 italic">No active tasks assigned to you in this project.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Bug Inbox</h2>
                  </div>
                  <div className="space-y-3">
                    {data.bugs.slice(0, 3).map((bug: any) => (
                      <BugInboxItem key={bug.id} title={bug.title} reporter={bug.reporter?.name || 'QA'} priority={bug.priority?.toLowerCase()} />
                    ))}
                    {data.bugs.length === 0 && <p className="text-[11px] text-slate-400 italic">No bugs reported.</p>}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">My PRs</h2>
                  </div>
                  <div className="space-y-3">
                    {data.prs.slice(0, 3).map((pr: any) => (
                      <PRInboxItem key={pr.id} id={`PR-${pr.id.slice(-2)}`} title={pr.title} meta={`${pr.filesChanged || 0} files`} status={pr.status} isMerged={pr.status === 'MERGED'} />
                    ))}
                    {data.prs.length === 0 && <p className="text-[11px] text-slate-400 italic">No open PRs.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'MyTasks' && (
          <div className="p-10 w-full space-y-10">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-800">My Tasks</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{user?.name || 'Nexus Developer'} · {currentProject?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-6">
               <StatCard label="All tasks" val={stats.myTasks.length} active />
               <StatCard label="In progress" val={stats.myTasks.filter(t => t.status === 'IN_PROGRESS').length} />
               <StatCard label="Due today" val={stats.dueToday} color="text-amber-600" />
               <StatCard label="Blocked" val={stats.myTasks.filter(t => t.status === 'BLOCKED').length} color="text-rose-600" />
               <StatCard label="Done this sprint" val={stats.myTasks.filter(t => t.status === 'DONE').length} />
            </div>

            <div className="space-y-10">
               {['TO_DO', 'IN_PROGRESS', 'PR_SUBMITTED', 'IN_REVIEW', 'TESTING', 'DONE', 'BLOCKED'].map(status => {
                 const sprintId = currentSprint?.id || (currentSprint as any)?._id;
                 const statusTasks = (tasks || []).filter(t => 
                    t && t.assigneeId === user?.id && 
                    t.status === status && 
                    (sprintId ? (t.sprintId === sprintId || (t as any).sprintId === sprintId) : true)
                 );
                 if (statusTasks.length === 0) return null;
                 return (
                   <MyTaskGroup 
                     key={status}
                     title={status.replace(/_/g, ' ')} 
                     tasks={statusTasks} 
                     onPRClick={handleTaskSelectForPR} 
                     onTaskClick={(task: any) => {
                       setSelectedTaskForDetail(task);
                       setSelectedTaskDisplayId(`#${String(task.id || '').slice(-4).toUpperCase()}`);
                     }}
                   />
                 );
               })}
               {stats.myTasks.length === 0 && (
                 <div className="p-20 border-2 border-dashed border-slate-100 rounded-[32px] text-center">
                    <ListTodo size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No tasks assigned to you yet</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'PullRequests' && (
          <div className="p-10 w-full space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pull Requests</h1>
                <p className="text-[12px] font-medium text-slate-400 mt-1">{user?.name || 'Nexus Developer'} · My submitted PRs</p>
              </div>
              <button 
                onClick={handleCreatePRClick}
                className="px-5 py-2.5 bg-[#1A3A8F] text-white rounded-xl text-[13px] font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-800 transition-all flex items-center gap-2"
              >
                <GitPullRequest size={18} /> Create PR
              </button>
            </div>
            <div className="space-y-6">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">MY OPEN PRS</h3>
               <div className="space-y-4">
                 {data.prs.map((pr: any) => (
                   <DeveloperPRCard key={pr.id} id={`PR-${pr.id.slice(-2)}`} title={pr.title} branch={pr.branchName || 'develop'} author={user?.name} time={new Date(pr.createdAt).toLocaleDateString()} files={`${pr.filesChanged || 0} files`} churn={`+${pr.additions || 0} -${pr.deletions || 0}`} status={pr.status} userRole={user?.role} />
                 ))}
                 {data.prs.length === 0 && <p className="text-[12px] text-slate-400 italic">No open pull requests.</p>}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Blockers' && (
          <div className="p-10 w-full space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Blockers</h1>
                <p className="text-[12px] font-medium text-slate-400 mt-1">{data.blockers.length} active blockers</p>
              </div>
              <button 
                onClick={handleRaiseBlockerClick}
                className="px-4 py-2 border border-rose-200 text-rose-600 rounded-xl text-[12px] font-bold hover:bg-rose-50 transition-all shadow-sm flex items-center gap-2"
              >
                <Plus size={16} /> Raise Blocker
              </button>
            </div>
            <div className="space-y-10">
               <div className="space-y-6">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">ACTIVE BLOCKERS</h3>
                 <div className="space-y-4">
                   {data.blockers.map((bl: any) => (
                     <DeveloperBlockerCard key={bl.id} title={bl.reason} meta={`Task #${bl.taskId?.slice(-4)} · ${bl.raisedBy?.name || 'Unknown'}`} severity={bl.severity?.toLowerCase()} reason={bl.description} time={new Date(bl.createdAt).toLocaleDateString()} />
                   ))}
                   {data.blockers.length === 0 && <p className="text-[12px] text-slate-400 italic text-center py-10">No active blockers.</p>}
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'BugInbox' && (
          <div className="p-10 w-full space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bug Inbox</h1>
                <p className="text-[12px] font-medium text-slate-400 mt-1">Bugs logged on your tasks by QA</p>
              </div>
            </div>
            <div className="space-y-4">
               {data.bugs.map((bug: any) => (
                 <DeveloperBugCard key={bug.id} title={bug.title} meta={`Task #${bug.taskId?.slice(-4)} · ${bug.reporter?.name || 'QA'}`} priority={bug.priority?.toLowerCase()} status={bug.status?.toLowerCase()} showFix />
               ))}
               {data.bugs.length === 0 && <p className="text-[12px] text-slate-400 italic text-center py-10">Your bug inbox is empty. Nice work!</p>}
            </div>
          </div>
        )}

        {activeTab === 'Projects' && (
           <div className="flex-1 overflow-y-auto">
             <ProjectsView projects={projects} isLoading={loading} />
           </div>
        )}

        {activeTab === 'SprintBoard' && (
           <SprintBoard onTaskClick={() => {}} onCreateTask={() => {}} />
        )}

        {activeTab === 'Analytics' && (
          <div className="p-10 w-full space-y-10">
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
                <p className="text-[12px] font-medium text-slate-400 mt-1">
                  Sprint velocity, workload, and quality metrics
                </p>
              </div>
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[12px] font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                <Download size={16} /> Export CSV
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* SPRINT VELOCITY */}
              <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Sprint Velocity</h3>
                </div>
                <div className="h-48 flex items-end gap-4 px-4">
                   <VelocityBar label="S1" val={32} />
                   <VelocityBar label="S2" val={44} />
                   <VelocityBar label="S3" val={58} />
                   <VelocityBar label="S4 (est)" val={72} active />
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-medium text-slate-400">
                   <p>Avg: 46 pts/sprint — Target: 50 pts</p>
                </div>
              </div>

              {/* SPRINT 3 BURNDOWN */}
              <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Sprint 3 Burndown</h3>
                </div>
                <div className="space-y-6">
                   <AnalyticsProgressBar label="Done" val={88} color="bg-emerald-500" />
                   <AnalyticsProgressBar label="Remaining" val={32} color="bg-rose-500" />
                   <AnalyticsProgressBar label="Blocked pts" val={22} color="bg-amber-600" />
                </div>
              </div>

              {/* TASK STATUS BREAKDOWN */}
              <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Task Status Breakdown</h3>
                </div>
                <div className="space-y-4">
                   <StatusBreakdownRow label="Done" count={8} total={28} color="bg-emerald-600" />
                   <StatusBreakdownRow label="In Progress" count={6} total={28} color="bg-blue-500" />
                   <StatusBreakdownRow label="In Review" count={4} total={28} color="bg-indigo-500" />
                   <StatusBreakdownRow label="Testing" count={3} total={28} color="bg-orange-500" />
                   <StatusBreakdownRow label="Blocked" count={2} total={28} color="bg-rose-500" />
                   <StatusBreakdownRow label="To Do" count={5} total={28} color="bg-slate-300" />
                </div>
              </div>

              {/* TEAM WORKLOAD DISTRIBUTION */}
              <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Team Workload Distribution</h3>
                </div>
                <div className="space-y-5">
                   <WorkloadRow name="Ravi" initials="RK" val={76} color="bg-amber-600" />
                   <WorkloadRow name="Nexus" initials="ND" val={60} color="bg-blue-600" />
                   <WorkloadRow name="Arjun" initials="AP" val={85} color="bg-amber-700" />
                   <WorkloadRow name="Sneha" initials="SM" val={45} color="bg-blue-400" />
                   <WorkloadRow name="Dev" initials="DV" val={95} color="bg-rose-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ActivityLog' && (
          <div className="p-10 w-full space-y-10">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Log</h1>
              <p className="text-[12px] font-medium text-slate-400 mt-1">Audit trail of all actions in the workspace</p>
            </div>
            <div className="p-20 border-2 border-dashed border-slate-100 rounded-[32px] text-center">
              <History size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No activities recorded yet</p>
            </div>
          </div>
        )}

        {activeTab === 'TimeTracker' && (
          <div className="p-10 w-full space-y-10">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Time Tracker</h1>
              <p className="text-[12px] font-medium text-slate-400 mt-1">Track billable hours and task duration</p>
            </div>
            <div className="p-20 border-2 border-dashed border-slate-100 rounded-[32px] text-center">
              <Clock size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Select a task to start tracking</p>
            </div>
          </div>
        )}

        {activeTab === 'CodeReview' && (
          <div className="p-10 w-full space-y-10">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Code Review</h1>
              <p className="text-[12px] font-medium text-slate-400 mt-1">Review pull requests from your team members</p>
            </div>
            <div className="p-20 border-2 border-dashed border-slate-100 rounded-[32px] text-center">
              <Code2 size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">All PRs reviewed. Great job!</p>
            </div>
          </div>
        )}

        {activeTab === 'Messages' && (
          <div className="h-[calc(100vh-100px)] flex">
            {/* CONTACTS SIDEBAR */}
            <div className="w-80 border-r border-slate-100 bg-white flex flex-col">
              <div className="p-6 border-b border-slate-50">
                <h2 className="text-lg font-bold text-slate-900">Messages</h2>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search contacts..." 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {members.filter(m => m.id !== user?.id).map((m: any) => {
                  const isSelected = searchParams?.get('userId') === m.id;
                  return (
                    <button 
                      key={m.id}
                      onClick={() => router(`?tab=Messages&userId=${m.id}`)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold border border-slate-200 shrink-0">
                        {m.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[13px] font-bold truncate">{m.name}</p>
                        <p className="text-[11px] font-medium opacity-60 truncate">{m.role}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 bg-[#FDFBF7] flex flex-col">
              {searchParams?.get('userId') ? (() => {
                const selectedUser = members.find(m => m.id === searchParams?.get('userId'));
                const selectedInitials = selectedUser?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??';
                const currentChatMessages = chatMessages.filter(msg => msg.sender === 'me' || msg.sender === selectedUser?.id || msg.senderEmail === selectedUser?.email);

                return (
                <>
                  <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold border border-slate-200">
                        {selectedInitials}
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-slate-900">
                          {selectedUser?.name || 'Team Member'}
                        </h3>
                        <p className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                     <div className="flex justify-center">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</span>
                     </div>
                     
                     {currentChatMessages.length === 0 && (
                       <div className="py-20 text-center">
                         <p className="text-slate-400 text-[12px] italic">No messages yet. Say hello!</p>
                       </div>
                     )}

                     {currentChatMessages.map(msg => (
                       <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${msg.sender === 'me' ? 'bg-[#1A3A8F] text-white' : 'bg-slate-100 border border-slate-200 text-slate-600'}`}>
                            {msg.sender === 'me' ? (user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ME') : selectedInitials}
                          </div>
                          <div className={`max-w-[70%] space-y-1 ${msg.sender === 'me' ? 'items-end flex flex-col' : ''}`}>
                             <div className={`p-4 rounded-2xl shadow-sm ${msg.sender === 'me' ? 'bg-[#1A3A8F] text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none'}`}>
                                <div className="text-[13px] leading-relaxed [&>p]:m-0" dangerouslySetInnerHTML={{ __html: msg.text }} />
                             </div>
                             <p className="text-[10px] font-medium text-slate-400">{msg.time}</p>
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="p-6 bg-white border-t border-slate-100">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..." 
                        className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button 
                        onClick={handleSendMessage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1A3A8F] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all"
                      >
                        <Zap size={18} />
                      </button>
                    </div>
                  </div>
                </>
                );
              })() : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4">
                  <div className="w-20 h-20 bg-white rounded-[32px] border border-slate-100 flex items-center justify-center text-slate-200 shadow-sm">
                    <MessageSquare size={40} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Select a contact</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-[280px]">Pick a team member from the list to start collaborating in real-time.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="p-10 max-w-[800px] space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
            </div>

            {/* PROFILE SECTION */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Profile</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Display name</label>
                  <input type="text" defaultValue={user?.name || 'Nexus Developer'} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                  <input type="email" defaultValue={user?.email || 'eng@forgeindia.com'} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Role</label>
                  <input type="text" value={user?.role || 'Developer'} disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed" />
                </div>
                <button className="px-6 py-2.5 bg-[#1A3A8F] text-white rounded-xl text-[12px] font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10 flex items-center gap-2">
                   Save Profile
                </button>
              </div>
            </div>

            {/* NOTIFICATIONS SECTION */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Notifications</h3>
              <div className="space-y-1">
                <ToggleRow label="Task assigned to me" defaultChecked />
                <ToggleRow label="PR submitted for review" defaultChecked />
                <ToggleRow label="Bug logged on my task" defaultChecked />
                <ToggleRow label="Sprint started / completed" defaultChecked />
                <ToggleRow label="Blocker raised" defaultChecked />
              </div>
            </div>

            {/* CHANGE PASSWORD SECTION */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Change Password</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Current password</label>
                  <input type="password" placeholder="Enter current password" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">New password</label>
                  <input type="password" placeholder="Enter new password" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
                <button className="px-6 py-2.5 bg-[#1A3A8F] text-white rounded-xl text-[12px] font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10 flex items-center gap-2">
                   <RefreshCw size={14} /> Update Password
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Team' && (
          <div className="p-10 w-full space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team</h1>
                <p className="text-[12px] font-medium text-slate-400 mt-1">E-Commerce Platform · Sprint 3 · 8 members</p>
              </div>
              <button className="px-5 py-2.5 bg-[#1A3A8F] text-white rounded-xl text-[13px] font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-800 transition-all flex items-center gap-2"><UserPlus size={18} /> Invite Member</button>
            </div>
            <div className="grid grid-cols-4 gap-6">
               <StatCard label="Total members" val={members.length} />
               <StatCard label="Online now" val={members.filter((m: any) => onlineEmails.includes(m.email) || m.email === (user?.email || user?.user?.email)).length} color="text-emerald-600" />
               <StatCard label="Active tasks" val={tasks.filter(t => t.status !== 'DONE').length} />
               <StatCard label="Blocked" val={tasks.filter(t => t.status === 'BLOCKED').length} color="text-rose-600" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {members.map((m: any) => {
                 const memberTasks = tasks.filter(t => t.assigneeId === m.id);
                 const load = Math.min(100, memberTasks.length * 20); // Simple load calculation
                 const initials = m.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??';
                 const currentUserEmail = user?.email || user?.user?.email;
                 const isMe = Boolean(currentUserEmail && m.email === currentUserEmail);
                 const isOnline = onlineEmails.includes(m.email) || isMe;
                 
                 return (
                   <DeveloperTeamCard 
                     key={m.id}
                     id={m.id}
                     initials={initials} 
                     name={m.name} 
                     role={m.role || 'Member'} 
                     load={load} 
                     tasks={memberTasks.length} 
                     status={isMe ? "Viewing workspace" : isOnline ? "Active in project" : "Away"} 
                     onlineStatus={isOnline ? "online" : "offline"} 
                     highlight={isMe}
                   />
                 );
               })}
               {members.length === 0 && (
                 <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                   <p className="text-slate-400 font-medium italic">No team members found in this project.</p>
                 </div>
               )}
            </div>
          </div>
        )}

        <TaskSelectionModal 
          isOpen={isTaskSelectorOpen}
          onClose={() => setIsTaskSelectorOpen(false)}
          tasks={tasks.filter(t => t.assigneeId === user?.id && (t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW'))}
          onSelect={handleTaskSelectForPR}
        />

        <SubmitPRModal 
          isOpen={false} // Disabled as per user request for direct selection flow
          onClose={() => setIsPRModalOpen(false)}
          task={selectedTaskForPR}
          onSubmit={handleSubmitPR}
        />

        <TaskSelectionModal 
          isOpen={isBlockerTaskSelectorOpen}
          onClose={() => setIsBlockerTaskSelectorOpen(false)}
          tasks={tasks.filter(t => t && t.assigneeId === user?.id && t.status !== 'DONE' && t.status !== 'BLOCKED')}
          onSelect={handleBlockerTaskSelect}
          title="Select Task for Blocker"
          subtitle="Choose which task you want to report a blocker on"
        />

        <RaiseBlockerModal 
          isOpen={isRaiseBlockerOpen}
          onClose={() => {
            setIsRaiseBlockerOpen(false);
            setSelectedTaskForBlocker(null);
          }}
          task={selectedTaskForBlocker}
          onSubmit={handleRaiseBlockerSubmit}
        />

        <CreateTaskModal 
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          projectId={currentProject?.id || ''}
          onTaskCreated={() => {
            setIsCreateTaskModalOpen(false);
            if (currentProject) {
              fetchTasks(currentProject.id);
            }
          }}
        />

        <TaskDetailModal 
          isOpen={!!selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
          task={selectedTaskForDetail}
          displayId={selectedTaskDisplayId}
        />
        </main>
      </div>
    </div>
  );
}

// OPTIMIZED: Wrap reusable UI components in React.memo to avoid unnecessary re-renders
const StatCard = React.memo(({ label, val, color = 'text-slate-900', active = false }: any) => {
  return (
    <div className={`p-6 rounded-2xl border transition-all ${active ? 'bg-white border-slate-900/10 shadow-sm' : 'bg-white border-slate-100 shadow-sm'}`}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color} tracking-tight`}>{val}</p>
    </div>
  );
});

StatCard.displayName = 'StatCard';

function MyTaskGroup({ title, tasks, onPRClick, onTaskClick }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
      <div className="space-y-2">
        {tasks.map((t: any, i: number) => <MyTaskListItem key={i} task={t} onPRClick={onPRClick} isDone={t.status === 'DONE'} onClick={onTaskClick} />)}
      </div>
    </div>
  );
}

const MyTaskListItem = React.memo(({ task, onPRClick, isDone = false, onClick }: any) => {
  if (!task) return null;
  const { id, title, status, type, storyPoints, priority } = task;
  
  const handlePRClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPRClick) onPRClick(task);
  };
  
  const displayId = `#${String(id || '').slice(-4).toUpperCase()}`;
  const meta = `${type} · ${storyPoints || 0} pts`;
  
  const statusColor = status === 'DONE' ? 'bg-emerald-50 text-emerald-600' : status === 'BLOCKED' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600';
  const priorityColor = priority === 'CRITICAL' ? 'bg-rose-600' : 'bg-blue-500';

  return (
    <div 
      onClick={() => onClick && onClick(task)}
      className={`bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between hover:border-blue-200 transition-all shadow-sm group cursor-pointer ${isDone ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className={`w-1.5 h-1.5 rounded-full ${priorityColor}`} />
        <span className="text-[11px] font-bold text-slate-300 tracking-tighter w-8">{displayId}</span>
        <div className="flex flex-col">
          <h4 className="text-[13px] font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{title}</h4>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">{meta}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {(status === 'IN_PROGRESS' || status === 'IN_REVIEW') && (
          <button 
            onClick={() => onPRClick(task)}
            className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center gap-1.5"
          >
            <GitPullRequest size={12} /> PR
          </button>
        )}
        <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${statusColor} border border-black/5`}>
          {status}
        </div>
        <button className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
});

MyTaskListItem.displayName = 'MyTaskListItem';

const BugInboxItem = React.memo(({ title, reporter, priority }: any) => {
  const pStyles = priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-orange-50 text-orange-600 border-orange-100';
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:border-rose-200 transition-all shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-rose-500">
          <Bug size={16} />
        </div>
        <div>
          <h4 className="text-[12px] font-bold text-slate-800 line-clamp-1">{title}</h4>
          <p className="text-[11px] font-medium text-slate-400">By {reporter}</p>
        </div>
      </div>
      <div className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${pStyles}`}>
        {priority}
      </div>
    </div>
  );
});

BugInboxItem.displayName = 'BugInboxItem';

function DeveloperPRCard({ id, title, branch, author, time, files, churn, status, userRole }: any) {
  const isLead = userRole === 'TEAM_LEAD' || userRole === 'MANAGER';
  
  const getStatusLabel = (s: string) => {
    if (s === 'OPEN') return 'Pending';
    if (s === 'APPROVED') return 'Approved';
    if (s === 'CHANGES_REQUESTED') return 'Changes Requested';
    if (s === 'MERGED') return 'Merged';
    return s;
  };

  const statusLabel = getStatusLabel(status);
  const statusColor = status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      status === 'CHANGES_REQUESTED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                      'bg-blue-50 text-blue-600 border-blue-100/50';

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-blue-200 transition-all shadow-sm group">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="text-[14px] font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
              <span className="text-slate-300 mr-2">{id}</span>
              {title}
            </h4>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <GitBranch size={12} className="text-slate-300" />
              {branch}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColor}`}>
            {statusLabel}
          </div>
        </div>

        <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400">
           <div className="flex items-center gap-1.5">
             <div className="w-5 h-5 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center text-[10px] text-slate-500">{author[0]}</div>
             {author}
           </div>
           <div className="flex items-center gap-1.5">
             <Clock size={12} className="text-slate-300" />
             {time}
           </div>
           <div className="flex items-center gap-1.5">
             <FileText size={12} className="text-slate-300" />
             {files}
           </div>
           <div className="flex items-center gap-1.5">
             <span className="text-emerald-500">{churn.split(' ')[0]}</span>
             <span className="text-rose-500">{churn.split(' ')[1]}</span>
           </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
           <div className="flex items-center gap-2">
             {isLead && (
               <>
                 <button className="px-4 py-1.5 bg-[#1A3A8F] text-white rounded-lg text-[11px] font-bold hover:bg-blue-800 transition-all shadow-sm shadow-blue-900/10 flex items-center gap-1.5">
                    <CheckCircle size={12} /> Approve
                 </button>
                 <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5">
                    <AlertCircle size={12} className="text-rose-400" /> Changes
                 </button>
               </>
             )}
             <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5">
                <FileText size={12} className="text-slate-400" /> View diff
             </button>
             <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5">
                <MessageCircle size={12} className="text-slate-400" /> Comment
             </button>
           </div>
           <div className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
             <Clock size={12} /> {time}
           </div>
        </div>
      </div>
    </div>
  );
}

function DeveloperBlockerCard({ title, meta, severity, reason, time }: any) {
  const router = useRouter();
  const sevStyles = severity === 'critical' ? 'border-rose-100 bg-rose-50/10' : 'border-amber-100 bg-amber-50/10';
  const badgeStyles = severity === 'critical' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600';
  const iconColor = severity === 'critical' ? 'text-rose-500' : 'text-amber-500';

  return (
    <div className={`border-l-4 ${severity === 'critical' ? 'border-l-rose-500' : 'border-l-amber-500'} ${sevStyles} border rounded-2xl overflow-hidden shadow-sm`}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
           <div className="flex gap-4">
              <div className={`w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center ${iconColor} shadow-sm`}>
                 <ShieldAlert size={20} />
              </div>
              <div className="space-y-1">
                 <h4 className="text-[14px] font-bold text-slate-800">{title}</h4>
                 <p className="text-[11px] font-medium text-slate-400">{meta}</p>
              </div>
           </div>
           <div className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${badgeStyles}`}>
              {severity}
           </div>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4">
           <p className="text-[12px] font-medium text-slate-600 leading-relaxed">{reason}</p>
        </div>

        <div className="flex items-center justify-between pt-2">
           <button 
             onClick={() => router('?tab=Messages')}
             className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all"
           >
              <MessageCircle size={14} className="text-slate-400" /> Message Lead
           </button>
           <div className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
             <Clock size={12} /> {time}
           </div>
        </div>
      </div>
    </div>
  );
}

function DeveloperBugCard({ title, meta, priority, status, showFix = false, isResolved = false }: any) {
  const pStyles = priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-orange-50 text-orange-600 border-orange-100';
  const sStyles = isResolved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100';

  return (
    <div className={`bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:border-blue-200 transition-all shadow-sm group ${isResolved ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-rose-500 border border-slate-100">
          <Bug size={18} />
        </div>
        <div>
          <h4 className="text-[14px] font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{title}</h4>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">{meta}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${pStyles}`}>
           {priority}
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${sStyles}`}>
           {status}
        </div>
        {showFix && (
          <button className="px-4 py-1.5 bg-[#1A3A8F] text-white rounded-lg text-[11px] font-bold hover:bg-blue-800 transition-all shadow-sm shadow-blue-900/10">
            Fix
          </button>
        )}
      </div>
    </div>
  );
}

function ResolvedBlockerItem({ title, resolution }: any) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between group hover:border-emerald-200 transition-all shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
          <CircleCheck size={20} />
        </div>
        <div>
          <h4 className="text-[13px] font-bold text-slate-800">{title}</h4>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">{resolution}</p>
        </div>
      </div>
      <div className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-emerald-100">
        Resolved
      </div>
    </div>
  );
}

function PRInboxItem({ id, title, meta, status, isMerged = false }: any) {
  const sStyles = isMerged ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100';
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:border-blue-200 transition-all shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-500">
          <GitPullRequest size={16} />
        </div>
        <div>
          <h4 className="text-[12px] font-bold text-slate-800 line-clamp-1">{id} — {title}</h4>
          <p className="text-[11px] font-medium text-slate-400">{meta}</p>
        </div>
      </div>
      <div className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${sStyles}`}>
        {status}
      </div>
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

function DeveloperTeamCard({ id, initials, name, role, load, tasks, status, onlineStatus, highlight = false, color = 'bg-blue-600' }: any) {
  const router = useRouter();
  const statusIconColor = { online: 'bg-emerald-500', away: 'bg-amber-500', dnd: 'bg-rose-500', offline: 'bg-slate-300' }[onlineStatus as 'online' | 'away' | 'dnd' | 'offline'];
  
  return (
    <div className={`bg-white rounded-2xl border p-6 space-y-4 transition-all shadow-sm group hover:border-blue-200 ${highlight ? 'border-blue-600 ring-4 ring-blue-50' : 'border-slate-100'}`}>
       <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
             <div className="relative">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-100">{initials}</div>
                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${statusIconColor} rounded-full border-2 border-white shadow-sm`} />
             </div>
             <div>
                <h4 className="text-[15px] font-bold text-slate-900">{name}</h4>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{role}</p>
             </div>
          </div>
          <button 
            onClick={() => router(`?tab=Messages&userId=${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all uppercase tracking-widest"
          >
            <MessageCircle size={14} className="text-slate-400" /> Message
          </button>
       </div>

       <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tight">
             <div className="flex items-center gap-3">
               <span>Tasks: {tasks}</span>
               <span>Load: {load}%</span>
             </div>
             <span>{load}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
             <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${load}%` }} />
          </div>
       </div>

       <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 italic">
          <div className={`w-1.5 h-1.5 rounded-full ${statusIconColor}`} />
          {status}
       </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em]">{title}</h3>;
}

function TeamMemberCard({ initials, name, role, stats, workload, status, onlineStatus, highlight = false, labels = ['Tasks', 'PRs', 'Blockers'] }: any) {
  const router = useRouter();
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
          <button 
            onClick={() => router('?tab=Messages')}
            className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl text-[12px] font-semibold hover:bg-slate-50"
          >
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

function TaskSection({ title, tasks, type, onTaskClick }: { title: string, tasks: any[], type: string, onTaskClick?: (task: any) => void }) {
  if (tasks.length === 0 && type !== 'progress') return null;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="space-y-4">
        {tasks.map((task, i) => <TaskCard key={task.id} task={task} type={type} onClick={onTaskClick} />)}
        {tasks.length === 0 && (
          <div className="p-12 border-2 border-dashed border-slate-100 rounded-[32px] text-center">
            <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest">No active tasks in this stage</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, type, onClick }: { task: any, type: string, onClick?: (task: any) => void }) {
  const isDone = type === 'done';
  const getNatureStyles = (nature: string) => {
    switch(nature?.toUpperCase()) {
      case 'BACKEND': return { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', borderLight: 'border-blue-100' };
      case 'FRONTEND': return { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', borderLight: 'border-emerald-100' };
      case 'AUTH': return { border: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600', borderLight: 'border-indigo-100' };
      case 'PAYMENTS': return { border: 'border-l-rose-500', bg: 'bg-rose-50', text: 'text-rose-600', borderLight: 'border-rose-100' };
      case 'DEVOPS': return { border: 'border-l-slate-500', bg: 'bg-slate-100', text: 'text-slate-600', borderLight: 'border-slate-200' };
      default: return { border: 'border-l-slate-200', bg: 'bg-slate-50', text: 'text-slate-500', borderLight: 'border-slate-100' };
    }
  };

  const primaryNature = task.tags?.[0] || 'BACKEND';
  const natureStyles = getNatureStyles(primaryNature);
  const leftBorder = type === 'blocked' ? 'border-l-rose-600' : type === 'due' ? 'border-l-amber-500' : natureStyles.border;

  return (
    <div onClick={() => onClick && onClick(task)} className={`bg-white rounded-[24px] border border-slate-200 border-l-[6px] ${leftBorder} p-6 transition-all group cursor-pointer ${isDone ? 'opacity-65' : ''}`}>
       <div className="flex items-start justify-between mb-4">
          <div className="flex gap-4">
             <div className="text-[11px] font-semibold text-slate-300 tracking-tighter mt-1">#T-{task.id.slice(-2).toUpperCase()}</div>
             <div className="space-y-1">
                <h4 className="text-lg font-semibold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{task.title}</h4>
                <div className="flex items-center gap-3">
                   {type === 'due' && (
                     <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                        <Clock size={12} />
                        <span className="text-[11px] uppercase tracking-tight">Due today 6:00 PM</span>
                     </div>
                   )}
                   <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">{task.points || 5} pts</div>
                   <div className="flex gap-1.5">
                      {['Backend', 'Auth'].map(tag => {
                         const s = getNatureStyles(tag);
                         return <span key={tag} className={`px-2 py-0.5 ${s.bg} ${s.text} rounded-lg text-[9px] font-semibold uppercase tracking-widest border ${s.borderLight}`}>{tag}</span>
                      })}
                   </div>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${task.priority === 'CRITICAL' || task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>{task.priority || 'Medium'}</span>
             <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                {task.status.replace('_', ' ')}
             </span>
          </div>
       </div>
       {type === 'progress' && (
         <div className="mt-6 mb-4 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-tight">
               <span className="text-slate-400">Subtasks</span>
               <span className="text-slate-900">3 / 5 done</span>
            </div>
            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
               <div className="h-full bg-blue-600 w-3/5" />
            </div>
         </div>
       )}
       {type === 'blocked' && (
         <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-800 text-[11px] font-medium">
            <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><AlertCircle size={16} /></div>
            <p>Blocker raised 2 hrs ago · Priority: {task.priority}</p>
         </div>
       )}
       {type === 'due' && (
         <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4 text-amber-800 text-[11px] font-medium">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600"><Clock3 size={16} /></div>
            <p>Due in 4 hrs · Requires immediate attention</p>
         </div>
       )}
       <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4">
             <button className="text-[11px] font-semibold text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <MessageCircle size={14} /> 2 comments
             </button>
             <button className="text-[11px] font-semibold text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <Plus size={14} /> Add subtask
             </button>
          </div>
          <button className="text-[11px] font-semibold text-slate-400 hover:text-slate-900 uppercase tracking-widest"><MoreHorizontal size={18} /></button>
       </div>
    </div>
  );
}

function VelocityBar({ label, val, active = false }: { label: string, val: number, active?: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-4 group">
      <div className="w-full relative flex items-end justify-center h-full">
         <div 
           className={`w-full rounded-t-xl transition-all duration-500 ${active ? 'bg-[#1A3A8F] shadow-lg shadow-blue-900/20' : 'bg-slate-100 group-hover:bg-slate-200'}`} 
           style={{ height: `${val}%` }} 
         />
         <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
           {val} pts
         </div>
      </div>
      <span className={`text-[11px] font-bold ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}

function AnalyticsProgressBar({ label, val, color }: { label: string, val: number, color: string }) {
  return (
    <div className="space-y-3">
       <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-slate-500">{label}</span>
          <span className="text-[12px] font-bold text-slate-900">{val}%</span>
       </div>
       <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} rounded-full transition-all duration-700 ease-out`} 
            style={{ width: `${val}%` }} 
          />
       </div>
    </div>
  );
}

function StatusBreakdownRow({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const percentage = (count / total) * 100;
  return (
    <div className="space-y-2">
       <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-slate-500">{label}</span>
          <span className="text-[12px] font-bold text-slate-900">{count}</span>
       </div>
       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} rounded-full opacity-80`} 
            style={{ width: `${percentage}%` }} 
          />
       </div>
    </div>
  );
}

function WorkloadRow({ name, initials, val, color }: { name: string, initials: string, val: number, color: string }) {
  return (
    <div className="flex items-center gap-4">
       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[11px] font-bold text-slate-500 border border-slate-100 shrink-0">
          {initials}
       </div>
       <div className="flex-1 space-y-2">
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
             <div 
               className={`h-full ${color} rounded-full opacity-90`} 
               style={{ width: `${val}%` }} 
             />
          </div>
       </div>
       <span className="text-[12px] font-bold text-slate-900 w-10 text-right">{val}%</span>
    </div>
  );
}

function ToggleRow({ label, defaultChecked = false }: { label: string, defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-[13px] font-medium text-slate-600">{label}</span>
      <button 
        onClick={() => setChecked(!checked)}
        className={`w-10 h-5 rounded-full transition-all relative ${checked ? 'bg-[#1A3A8F]' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}
