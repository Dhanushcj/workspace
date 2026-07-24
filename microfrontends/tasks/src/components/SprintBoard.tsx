import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Task, useWorkflowStore } from '../store/workflowStore';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { SprintSummaryModal } from './SprintSummaryModal';
import { WorkflowSettingsModal } from './WorkflowSettingsModal';
import EpicManagementModal from './EpicManagementModal';
import AutomationRulesModal from './AutomationRulesModal';
import { TaskDetailModal } from './TaskDetailModal';
import { 
  BarChart3, Settings, Layers, Zap, 
  Plus, Search, List, Flame, Flag, CircleCheck,
  Users, Activity, GitPullRequest, Layout, Clock,
  ChevronRight, Filter, ChevronDown, AlertCircle
} from 'lucide-react';
import ProjectSelector from './ProjectSelector';
import SprintSelector from './SprintSelector';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export const SprintBoard = ({ 
  onTaskClick, 
  onCreateTask,
  onBacklogClick,
  sprintId,
  hiddenStatuses = []
}: { 
  onTaskClick: (task: Task, displayId: string) => void, 
  onCreateTask: (status?: string) => void,
  onBacklogClick?: () => void,
  sprintId?: string,
  hiddenStatuses?: string[]
}) => {
  // OPTIMIZED: Using specific selectors for Zustand
  const tasks = useWorkflowStore(state => state.tasks);
  const updateTaskStatus = useWorkflowStore(state => state.updateTaskStatus);
  const statuses = useWorkflowStore(state => state.statuses);
  const fetchStatuses = useWorkflowStore(state => state.fetchStatuses);
  const currentProject = useWorkflowStore(state => state.currentProject);
  const members = useWorkflowStore(state => state.members);

  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const userRole = user?.role || 'DEVELOPER';
  const isTeamLead = userRole === 'TEAM_LEAD' || userRole === 'MANAGER';
  const { currentSprint } = useWorkflowStore();
  
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEpicsOpen, setIsEpicsOpen] = useState(false);
  const [isAutomationsOpen, setIsAutomationsOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'blocked' | 'pr'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskDisplayId, setSelectedTaskDisplayId] = useState('');

  const effectiveSprintId = sprintId || currentSprint?.id || (currentSprint as any)?._id;

  // Filter tasks by current sprint and assignee if individual employee
  const sprintTasks = useMemo(() => {
    const sid = currentSprint?.id || (currentSprint as any)?._id;
    if (!sid) return [];
    
    let filtered = tasks.filter(t => (t as any).sprintId === sid || t.sprintId === sid);
    
    // Filter tasks so individual employees only see tasks assigned to them (except MANAGER / TEAM_LEAD / ADMIN)
    const isTeamLeadOrManager = user?.role === 'TEAM_LEAD' || user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    if (user && !isTeamLeadOrManager) {
      filtered = filtered.filter(t => t.assigneeId === user.id || t.assignee?.id === user.id);
    }
    
    return filtered;
  }, [tasks, currentSprint, user]);

  // Unique assignee list for dropdown
  const assigneeList = Array.from(new Set(sprintTasks.map(t => t.assignee?.name).filter(Boolean))) as string[];

  const handleApprove = useCallback(async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, 'TESTING', userRole);
      const t = sprintTasks.find(t => t.id === taskId || (t as any)._id === taskId);
      addToast({ type: 'SUCCESS', title: 'PR Approved', message: `"${t?.title || taskId}" moved to Testing.` });
    } catch {
      addToast({ type: 'ERROR', title: 'Approve Failed', message: 'Could not approve the PR. Try again.' });
    }
  }, [updateTaskStatus, userRole, sprintTasks, addToast]);

  const handleReject = useCallback(async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, 'IN_PROGRESS', userRole);
      const t = sprintTasks.find(t => t.id === taskId || (t as any)._id === taskId);
      addToast({ type: 'WARNING', title: 'PR Rejected', message: `"${t?.title || taskId}" sent back to In Progress.` });
    } catch {
      addToast({ type: 'ERROR', title: 'Reject Failed', message: 'Could not reject the PR. Try again.' });
    }
  }, [updateTaskStatus, userRole, sprintTasks, addToast]);

  const handleResolve = useCallback(async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, 'IN_PROGRESS', userRole);
      const t = sprintTasks.find(t => t.id === taskId || (t as any)._id === taskId);
      addToast({ type: 'INFO', title: 'Blocker Resolved', message: `"${t?.title || taskId}" is back In Progress.` });
    } catch {
      addToast({ type: 'ERROR', title: 'Resolve Failed', message: 'Could not resolve blocker. Try again.' });
    }
  }, [updateTaskStatus, userRole, sprintTasks, addToast]);

  useEffect(() => {
    if (currentProject) {
      fetchStatuses(currentProject.id || (currentProject as any)?._id);
    }
  }, [currentProject?.id, currentProject?._id]);

  // Meta bar calculations
  const totalTasks = sprintTasks.length;
  const doneTasks = sprintTasks.filter(t => t.status === 'DONE').length;
  const blockedTasks = sprintTasks.filter(t => t.status === 'BLOCKED').length;
  const openPRs = sprintTasks.filter(t => t.status === 'IN_REVIEW' || t.status === 'PR_SUBMITTED').length;
  const totalPoints = sprintTasks.reduce((acc, t) => acc + (t.storyPoints || t.estimate || 0), 0);
  const donePoints = sprintTasks.filter(t => t.status === 'DONE').reduce((acc, t) => acc + (t.storyPoints || t.estimate || 0), 0);
  const blockedPoints = sprintTasks.filter(t => t.status === 'BLOCKED').reduce((acc, t) => acc + (t.storyPoints || t.estimate || 0), 0);
  const remainingPoints = totalPoints - donePoints;
  const completionPercentage = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  // Calculate days left
  const daysLeft = useMemo(() => {
    if (!currentSprint?.endDate) return 0;
    const end = new Date(currentSprint.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [currentSprint?.endDate]);

  const displayIdMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    sprintTasks.forEach((t, i) => {
      map[t.id || (t as any)._id] = `#T-${String((t.id || (t as any)._id || '').slice(-2))}`;
    });
    return map;
  }, [sprintTasks]);

  // ── Filter logic ───────────────────────────────────────────────────────────
  const getFilteredTasks = (columnTasks: Task[]) => {
    let filtered = columnTasks;

    if (activeFilter === 'blocked') {
      filtered = filtered.filter(t => t.status === 'BLOCKED');
    } else if (activeFilter === 'pr') {
      filtered = filtered.filter(t => t.status === 'IN_REVIEW' || t.status === 'PR_SUBMITTED');
    }

    if (filterAssignee) {
      filtered = filtered.filter(t => t.assignee?.name === filterAssignee);
    }

    if (filterPriority) {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        (t.id || (t as any)._id)?.toLowerCase().includes(q) ||
        t.assignee?.name?.toLowerCase().includes(q)
      );
    }

    return filtered;
  };

  const displayStatuses = (() => {
    const core = [
      { id: 'TO_DO', name: 'To Do', key: 'TO_DO', color: '#94A3B8', order: 0, projectId: '' },
      { id: 'IN_PROGRESS', name: 'In Progress', key: 'IN_PROGRESS', color: '#2563EB', order: 1, projectId: '' },
      { id: 'IN_REVIEW', name: 'In Review', key: 'IN_REVIEW', color: '#8B5CF6', order: 2, projectId: '' },
      { id: 'TESTING', name: 'Testing', key: 'TESTING', color: '#F59E0B', order: 3, projectId: '' },
      { id: 'DONE', name: 'Done', key: 'DONE', color: '#10B981', order: 4, projectId: '' },
      { id: 'BLOCKED', name: 'Blocked', key: 'BLOCKED', color: '#EF4444', order: 5, projectId: '' }
    ];

    const statusOrderMap: Record<string, number> = {
      'TO_DO': 0,
      'IN_PROGRESS': 1,
      'IN_REVIEW': 2,
      'PR_SUBMITTED': 2,
      'TESTING': 3,
      'DONE': 4,
      'BLOCKED': 5
    };

    let base = statuses.length === 0 ? core : [...statuses];

    core.forEach(c => {
      if (!base.find(s => s.key === c.key)) {
        base.push(c);
      }
    });

    return base.sort((a, b) => {
      const orderA = statusOrderMap[a.key] ?? (a.order || 99);
      const orderB = statusOrderMap[b.key] ?? (b.order || 99);
      return orderA - orderB;
    });
  })();

  const handleLocalTaskClick = (task: Task) => {
    const dId = displayIdMap[task.id || (task as any)._id] || '';
    setSelectedTask(task);
    setSelectedTaskDisplayId(dId);
    setIsTaskModalOpen(true);
    if (onTaskClick) onTaskClick(task, dId);
  };

  return (
    <div className="flex-1 w-full overflow-hidden flex flex-col bg-[var(--background)]">
      {/* 1. Top Bar Controls */}
      <div className="bg-white border-b border-slate-200 z-30 flex flex-col">
         {/* Row 1: Title + Actions */}
         <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sprint Board</h1>
               <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                     {currentSprint?.name || 'No Active Sprint'} — {currentSprint?.status || 'Active'}
                  </div>
                  {daysLeft > 0 && (
                    <div className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold uppercase tracking-widest border border-amber-100">
                       {daysLeft} days left
                    </div>
                  )}
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               {(isTeamLead || userRole === 'TESTER') && (
                  <button 
                    onClick={onBacklogClick}
                    className="px-4 py-2 bg-white border border-amber-200 text-amber-700 rounded-xl text-[12px] font-bold flex items-center gap-2 hover:bg-amber-50 transition-all shadow-sm"
                  >
                     <List size={16} className="text-amber-500" /> Backlog
                  </button>
               )}
               {isTeamLead && (
                  <button onClick={() => setIsSummaryOpen(true)} className="px-4 py-2 bg-[#0D5F46] text-white rounded-xl text-[12px] font-bold flex items-center gap-2 hover:bg-[#0A4D39] transition-all shadow-lg shadow-emerald-900/10">
                     <Flag size={16} /> Complete Sprint
                  </button>
               )}
            </div>
         </div>

         {/* Row 2: Stats (Agile Metrics Bar) */}
         <div className="flex items-center gap-6 px-6 py-2 bg-white border-t border-slate-50">
            <div className="flex items-center gap-2 text-slate-400">
               <Layers size={14} />
               <span className="text-[12px] font-bold tracking-tight"><span className="text-slate-900">{totalTasks}</span> Tasks</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
               <CircleCheck size={14} className="text-emerald-500" />
               <span className="text-[12px] font-bold tracking-tight"><span className="text-emerald-600">Done:</span> {doneTasks}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
               <AlertCircle size={14} className="text-rose-500" />
               <span className="text-[12px] font-bold tracking-tight"><span className="text-rose-500">Blocked:</span> {blockedTasks}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
               <GitPullRequest size={14} className="text-indigo-500" />
               <span className="text-[12px] font-bold tracking-tight"><span className="text-slate-900">{openPRs}</span> PRs open</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
               <Activity size={14} className="text-amber-500" />
               <span className="text-[12px] font-bold tracking-tight">Velocity: <span className="text-slate-900">{totalPoints} pts</span></span>
            </div>
         </div>
      </div>

      {/* Kanban Canvas */}
      <div className="flex-1 overflow-x-auto custom-scrollbar pb-6 px-1">
        <div className="flex gap-2 py-6 min-h-full">
          {displayStatuses
            .filter(s => !hiddenStatuses.includes(s.key))
            .map((status) => (
            <KanbanColumn
              key={status.id}
              id={status.key}
              title={status.name}
              dotColor={status.color}
              tasks={getFilteredTasks(sprintTasks.filter(t => 
                t.status?.toUpperCase() === status.key?.toUpperCase() || 
                (t.status === 'BACKLOG' && status.key === 'TO_DO')
              ))}
              onTaskClick={handleLocalTaskClick}
              onCreateTask={onCreateTask}
              selectedIds={selectedTaskIds}
              onSelectTask={(tid: string) => setSelectedTaskIds(prev => prev.includes(tid) ? prev.filter(id => id !== tid) : [...prev, tid])}
              opacity={status.key === 'DONE' ? 0.7 : 1}
              isTeamLead={isTeamLead}
              onApprove={handleApprove}
              onReject={handleReject}
              onResolve={handleResolve}
              displayIds={displayIdMap}
            />
          ))}

          {/* Catch-all for diagnostics */}
          {sprintTasks.filter(t => !displayStatuses.some(s => s.key === t.status)).length > 0 && (
            <KanbanColumn
              id="UNMAPPED"
              title="Unmapped Status"
              dotColor="#64748B"
              tasks={sprintTasks.filter(t => !displayStatuses.some(s => s.key === t.status))}
              onTaskClick={handleLocalTaskClick}
              onCreateTask={() => {}}
              selectedIds={[]}
              onSelectTask={() => {}}
              isTeamLead={false}
              displayIds={displayIdMap}
            />
          )}
        </div>
      </div>

      {/* 4. Sprint Footer */}
      <div className="bg-white border-t border-slate-200 p-3 z-40 shadow-2xl">
         <div className="max-w-6xl mx-auto flex items-center gap-10">
            <div className="flex items-center gap-8 flex-1">
               <div className="text-center">
                  <div className="text-xl font-semibold text-emerald-600">{donePoints}</div>
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Done</div>
               </div>
               <div className="text-center">
                  <div className="text-xl font-semibold text-rose-500">{remainingPoints}</div>
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Left</div>
               </div>
               <div className="text-center">
                  <div className="text-xl font-semibold text-indigo-600">3</div>
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Days</div>
               </div>
               <div className="text-center">
                  <div className="text-xl font-semibold text-slate-900">{completionPercentage}%</div>
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Complete</div>
               </div>
            </div>
            
            <div className="flex-[2] space-y-3">
               <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-semibold uppercase tracking-widest text-slate-400">
                     <span>Ideal</span>
                     <span>68%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-slate-400" style={{ width: '68%' }} />
                  </div>
               </div>
               <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-semibold uppercase tracking-widest text-emerald-600">
                     <span>Actual</span>
                     <span>{completionPercentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500" style={{ width: `${completionPercentage}%` }} />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <TaskDetailModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        displayId={selectedTaskDisplayId}
      />

      {effectiveSprintId && (
        <SprintSummaryModal 
          isOpen={isSummaryOpen} 
          onClose={() => setIsSummaryOpen(false)} 
          sprintId={effectiveSprintId} 
        />
      )}
    </div>
  );
};

