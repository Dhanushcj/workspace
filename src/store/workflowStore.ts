import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { socketService } from '../lib/socket';

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'PR_SUBMITTED' | 'TESTING' | 'READY_FOR_RELEASE' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type UserRole = 'DEVELOPER' | 'TESTER' | 'MANAGER' | 'TEAM_LEAD';

export interface Status {
  id: string;
  name: string;
  key: string;
  color: string;
  order: number;
  projectId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  status: TaskStatus | string; // Allow dynamic status keys
  priority: TaskPriority;
  assigneeId: string;
  assignee?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    avatarUrl?: string;
  };
  creatorId: string;
  projectId: string;
  sprintId: string;
  prLink?: string;
  prStatus?: 'OPEN' | 'MERGED' | 'REJECTED';
  isHotfix?: boolean;
  blockerInfo?: {
    raisedBy: string;
    raisedAt: string;
    reason: string;
  };
  deployedAt?: string;
  createdAt: string;
  updatedAt: string;
  estimate?: number | null;
  storyPoints?: number | null;
  epicId?: string | null;
  epic?: {
    id: string;
    name: string;
    color: string;
  };
  _count?: {
    comments: number;
    blockers: number;
  };
  prNumber?: number;
}

export interface Epic {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: string;
  projectId: string;
}

interface WorkflowState {
  tasks: Task[];
  projects: any[];
  isLoading: boolean;
  currentProject: any | null;
  currentSprint: any | null;
  statuses: Status[];
  members: any[];
  epics: Epic[];
  prs: any[];
  bugs: any[];
  fetchTasks: (filters?: { projectId?: string, sprintId?: string }, silent?: boolean) => Promise<void>;
  fetchProjects: (silent?: boolean) => Promise<void>;
  createProject: (data: { name: string, description: string }) => Promise<void>;
  updateTask: (taskId: string, updates: any) => Promise<boolean>;
  updateTaskStatus: (taskId: string, status: string, role: string) => Promise<boolean>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  resolveBlocker: (blockerId: string, resolutionNote: string) => Promise<boolean>;
  setCurrentProject: (project: any) => void;
  setCurrentSprint: (sprint: any) => void;
  addComment: (taskId: string, content: string) => Promise<any>;
  fetchComments: (taskId: string) => Promise<any[]>;
  addIssueLink: (taskId: string, targetIssueId: string, type: string) => Promise<any>;
  fetchIssueLinks: (taskId: string) => Promise<{linksTo: any[], linksFrom: any[]}>;
  deleteIssueLink: (linkId: string) => Promise<boolean>;
  logTime: (taskId: string, duration: number, description: string, date?: string) => Promise<any>;
  fetchTimeEntries: (taskId: string) => Promise<any[]>;
  updateEstimate: (taskId: string, estimate: number) => Promise<any>;
  fetchSprintSummary: (sprintId: string) => Promise<any>;
  fetchProjectVelocity: (projectId: string) => Promise<any>;
  fetchProjectCFD: (projectId: string) => Promise<any>;
  fetchStatuses: (projectId: string) => Promise<void>;
  addStatus: (projectId: string, data: { name: string, color: string, order: number }) => Promise<any>;
  updateStatus: (statusId: string, data: { name?: string, color?: string, order?: number }) => Promise<any>;
  deleteStatus: (statusId: string) => Promise<boolean>;
  bulkUpdateTasks: (ids: string[], updates: { status?: TaskStatus | string, assigneeId?: string, priority?: TaskPriority | string }) => Promise<boolean>;
  fetchMembers: (projectId?: string) => Promise<void>;
  updateTaskAssignee: (taskId: string, userId: string) => Promise<boolean>;
  clearTasks: () => void;
  fetchEpics: (projectId: string) => Promise<void>;
  createEpic: (data: Partial<Epic>) => Promise<any>;
  updateTaskEpic: (taskId: string, epicId: string | null) => Promise<boolean>;
  updateTaskEstimation: (taskId: string, points: number | null) => Promise<boolean>;
  fetchPRs: () => Promise<void>;
  fetchBugs: () => Promise<void>;
}

const canTransition = (current: string, next: string, role: string): boolean => {
  const cur = current.toUpperCase();
  const nxt = next.toUpperCase();
  // Allow reopening tasks (moving out of DONE)
  // But maybe restrict it to TEAM_LEAD, MANAGER, or the original reporter/assignee
  // For now, allow it to enable "Free Movement"
  return true;
};

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [],
      isLoading: false,
      activeSprintId: null,
      currentProject: null,
      currentSprint: null,
      statuses: [],
      members: [],
      epics: [],
      prs: [],
      bugs: [],
      
      fetchTasks: async (filters, silent = false) => {
        if (!silent) set({ isLoading: true });
        try {
          const params = new URLSearchParams();
          if (filters?.projectId) params.append('projectId', filters.projectId);
          if (filters?.sprintId) params.append('sprintId', filters.sprintId);
          const response = await api.get(`/issues?${params.toString()}`);
          
          // Handle standardized API response format { success, message, data }
          let apiData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          
          // Normalize IDs to handle both id and _id
          apiData = apiData.map((item: any) => ({
            ...item,
            id: item.id || item._id,
            _id: item._id || item.id
          }));
          
          set({ tasks: apiData, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      fetchProjects: async (silent = false) => {
        if (!silent) set({ isLoading: true });
        try {
          const response = await api.get('/projects');
          
          // API returns { success, message, data: [...] }
          const rawData = response.data;
          let apiData: any[] = Array.isArray(rawData)
            ? rawData
            : Array.isArray(rawData?.data)
            ? rawData.data
            : [];
          
          // Normalize IDs
          apiData = apiData.map((item: any) => ({
            ...item,
            id: item.id || item._id?.toString(),
            _id: item._id || item.id
          }));

          const state = get();
          const currentInList = apiData.find((p: any) => p.id === state.currentProject?.id);

          const updates: any = { projects: apiData, isLoading: false };

          if (apiData.length > 0) {
            if (!state.currentProject || !currentInList) {
              const projectToSet = apiData[0];
              // Use activeSprint field returned by the enriched backend
              const activeSprint =
                projectToSet.activeSprint ||
                projectToSet.sprints?.find((s: any) => s.status === 'ACTIVE') ||
                projectToSet.sprints?.[0] ||
                null;
              updates.currentProject = projectToSet;
              updates.currentSprint = activeSprint;
            } else if (currentInList) {
              const activeSprint =
                currentInList.activeSprint ||
                currentInList.sprints?.find((s: any) => s.status === 'ACTIVE') ||
                currentInList.sprints?.[0] ||
                null;

              if (JSON.stringify(currentInList) !== JSON.stringify(state.currentProject)) {
                updates.currentProject = currentInList;
              }
              if (JSON.stringify(activeSprint) !== JSON.stringify(state.currentSprint)) {
                updates.currentSprint = activeSprint;
              }
            }
          } else {
            if (state.currentProject !== null) updates.currentProject = null;
            if (state.currentSprint !== null) updates.currentSprint = null;
          }

          set(updates);
        } catch (error) {
          console.error('[STORE] fetchProjects error:', error);
          set({ isLoading: false });
        }
      },

      createProject: async (projectData) => {
        try {
          const response = await api.post('/projects', projectData);
          set({ currentProject: response.data, currentSprint: null });
        } catch (error) {}
      },

      addTask: async (taskData) => {
        try {
          const response = await api.post('/issues', taskData);
          set((state) => ({ tasks: [...state.tasks, response.data] }));
        } catch (error) {}
      },

      updateTask: async (taskId: string, updates: any) => {
        try {
          await api.patch(`/issues/${taskId}`, updates);
          set((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id === taskId || (t as any)._id === taskId) {
                const updatedTask = { ...t, ...updates, updatedAt: new Date().toISOString() };
                if (updates.assigneeId !== undefined) {
                  if (updates.assigneeId === '' || updates.assigneeId === null) {
                    updatedTask.assignee = undefined;
                  } else {
                    const member = state.members.find(m => m.id === updates.assigneeId || (m as any)._id === updates.assigneeId);
                    if (member) {
                      updatedTask.assignee = {
                        id: member.id || (member as any)._id,
                        name: member.name,
                        email: member.email,
                        avatar: member.avatarUrl
                      };
                    }
                  }
                }
                return updatedTask;
              }
              return t;
            }),
          }));
          return true;
        } catch (error) {
          console.error('Failed to update task', error);
          return false;
        }
      },

      updateTaskStatus: async (taskId, nextStatus, role) => {
        const { tasks } = get();
        const task = tasks.find((t) => t.id === taskId || (t as any)._id === taskId);
        if (task && canTransition(task.status, nextStatus, role)) {
          try {
            // Modernized to use unified PUT /issues/:id endpoint
            await api.put(`/issues/${taskId}`, { status: nextStatus });
            set((state) => ({
              tasks: state.tasks.map((t) => (t.id === taskId || (t as any)._id === taskId) ? { ...t, status: nextStatus, updatedAt: new Date().toISOString() } : t),
            }));
            return true;
          } catch (error: any) {
            const errorData = error.response?.data;
            const errorMessage = typeof errorData === 'object' ? (errorData.message || JSON.stringify(errorData)) : (errorData || error.message);
            console.error('API Status Update Failed:', { 
              taskId, 
              nextStatus, 
              error: errorMessage,
              status: error.response?.status
            });
            return false;
          }
        }
        console.warn('Transition Guard Blocked Move:', { current: task?.status, next: nextStatus, role });
        return false;
      },

      resolveBlocker: async (blockerId, resolutionNote) => {
        try {
          await api.patch(`/blockers/${blockerId}/resolve`, { resolutionNote });
          const { currentProject, currentSprint, fetchTasks } = get();
          if (currentProject && currentSprint) {
            await fetchTasks({ projectId: currentProject.id, sprintId: currentSprint.id });
          }
          return true;
        } catch (error) {
          return false;
        }
      },

      setCurrentProject: (project) => {
        const activeSprint = project.sprints?.find((s: any) => s.status === 'ACTIVE') || project.sprints?.[0] || null;
        set({ currentProject: project, currentSprint: activeSprint });
        // Join socket room so real-time events start flowing for this project
        socketService.joinProject(project.id);
      },

      setCurrentSprint: (sprint) => set({ currentSprint: sprint }),

      addComment: async (taskId, content) => {
        try {
          const response = await api.post(`/issues/${taskId}/comments`, { content });
          return response.data;
        } catch (error) {
          console.error('Failed to add comment', error);
          throw error;
        }
      },

      fetchComments: async (taskId) => {
        try {
          const response = await api.get(`/issues/${taskId}/comments`);
          return response.data;
        } catch (error) {
          console.error('Failed to fetch comments', error);
          return [];
        }
      },

      addIssueLink: async (taskId, targetIssueId, type) => {
        try {
          const response = await api.post(`/issues/${taskId}/links`, { targetIssueId, type });
          return response.data;
        } catch (error) {
          console.error('Failed to add issue link', error);
          throw error;
        }
      },

      fetchIssueLinks: async (taskId) => {
        try {
          const response = await api.get(`/issues/${taskId}/links`);
          return response.data;
        } catch (error) {
          console.error('Failed to fetch issue links', error);
          return { linksTo: [], linksFrom: [] };
        }
      },

      deleteIssueLink: async (linkId) => {
        try {
          await api.delete(`/issues/links/${linkId}`);
          return true;
        } catch (error) {
          console.error('Failed to delete issue link', error);
          return false;
        }
      },

      logTime: async (taskId, duration, description, date) => {
        try {
          const response = await api.post(`/issues/${taskId}/time`, { duration, description, date });
          return response.data;
        } catch (error) {
          console.error('Failed to log time', error);
          throw error;
        }
      },

      fetchTimeEntries: async (taskId) => {
        try {
          const response = await api.get(`/issues/${taskId}/time`);
          return response.data;
        } catch (error) {
          console.error('Failed to fetch time entries', error);
          return [];
        }
      },

      updateEstimate: async (taskId, estimate) => {
        try {
          const response = await api.patch(`/issues/${taskId}/estimate`, { estimate });
          return response.data;
        } catch (error) {
          console.error('Failed to update estimate', error);
          throw error;
        }
      },

      fetchSprintSummary: async (sprintId) => {
        try {
          const response = await api.get(`/sprints/${sprintId}/summary`);
          return response.data;
        } catch (error) {
          console.error('Failed to fetch sprint summary', error);
          throw error;
        }
      },

      fetchProjectVelocity: async (projectId) => {
        try {
          const response = await api.get(`/projects/${projectId}/velocity`);
          return response.data;
        } catch (error) {
          console.error('Failed to fetch project velocity', error);
          throw error;
        }
      },

      fetchProjectCFD: async (projectId) => {
        try {
          const response = await api.get(`/projects/${projectId}/cfd`);
          return response.data;
        } catch (error) {
          console.error('Failed to fetch CFD data', error);
          throw error;
        }
      },

      fetchEpics: async (projectId) => {
        try {
          const response = await api.get(`/projects/${projectId}/epics`);
          const rawData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          const normalized = rawData.filter(Boolean).map((e: any) => ({
            ...e,
            id: e.id || e._id,
            _id: e._id || e.id
          }));
          set({ epics: normalized });
        } catch (error) {
          console.error('Failed to fetch epics', error);
          set({ epics: [] });
        }
      },

      fetchStatuses: async (projectId) => {
        try {
          const response = await api.get(`/projects/${projectId}/statuses`);
          const statuses = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          set({ statuses });
        } catch (error) {
          console.error('Failed to fetch statuses', error);
        }
      },

      addStatus: async (projectId, statusData) => {
        try {
          const response = await api.post(`/projects/${projectId}/statuses`, statusData);
          const data = response.data?.data || response.data;
          set(state => ({ statuses: [...state.statuses, data] }));
          return data;
        } catch (error) {
          console.error('Failed to add status', error);
          throw error;
        }
      },

      updateStatus: async (statusId, statusData) => {
        try {
          const response = await api.patch(`/projects/statuses/${statusId}`, statusData);
          const data = response.data?.data || response.data;
          set(state => ({ 
            statuses: state.statuses.map(s => s.id === statusId ? data : s) 
          }));
          return data;
        } catch (error) {
          console.error('Failed to update status', error);
          throw error;
        }
      },

      deleteStatus: async (statusId) => {
        try {
          await api.delete(`/projects/statuses/${statusId}`);
          set(state => ({ 
            statuses: state.statuses.filter(s => s.id !== statusId) 
          }));
          return true;
        } catch (error) {
          console.error('Failed to delete status', error);
          return false;
        }
      },

      bulkUpdateTasks: async (ids, updates) => {
        try {
          await api.patch('/issues/bulk', { ids, ...updates });
          set(state => ({
            tasks: state.tasks.map(t => 
              ids.includes(t.id) ? { ...t, ...updates, updatedAt: new Date().toISOString() } as any : t
            )
          }));
          return true;
        } catch (error) {
          console.error('Bulk update failed', error);
          return false;
        }
      },

      fetchMembers: async () => {
        try {
          const authState = JSON.parse(localStorage.getItem('forge-auth') || '{}');
          const workspaceId = authState.state?.currentWorkspaceId || authState.state?.user?.workspaceId || 'forge-india-connect';
          const response = await api.get(`/members/${workspaceId}`);
          let apiData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          
          // Normalize IDs
          apiData = apiData.map((item: any) => ({
            ...item,
            id: item.id || item._id,
            _id: item._id || item.id
          }));
          
          set({ members: apiData });
        } catch (error) {
          console.error('Failed to fetch members', error);
        }
      },

      updateTaskAssignee: async (taskId, assigneeId) => {
        try {
          await api.put(`/issues/${taskId}`, { assigneeId });
          set(state => ({
            tasks: state.tasks.map(t => 
              (t.id === taskId || (t as any)._id === taskId) ? { ...t, assigneeId, updatedAt: new Date().toISOString() } as any : t
            )
          }));
          return true;
        } catch (error) {
          console.error('Failed to update assignee', error);
          return false;
        }
      },
      clearTasks: () => set({ tasks: [] }),

      createEpic: async (data) => {
        try {
          const res = await api.post('/epics', data);
          set(state => ({ epics: [...state.epics, res.data] }));
          return res.data;
        } catch (error) {
          console.error('Failed to create epic', error);
          return null;
        }
      },

      updateTaskEpic: async (taskId, epicId) => {
        try {
          await api.put(`/issues/${taskId}`, { epicId });
          set(state => ({
            tasks: state.tasks.map(t => (t.id === taskId || (t as any)._id === taskId) ? { ...t, epicId } : t)
          }));
          return true;
        } catch (error) {
          console.error('Failed to update task epic', error);
          return false;
        }
      },

      updateTaskEstimation: async (taskId, storyPoints) => {
        try {
          await api.put(`/issues/${taskId}`, { storyPoints });
          set(state => ({
            tasks: state.tasks.map(t => (t.id === taskId || (t as any)._id === taskId) ? { ...t, storyPoints } : t)
          }));
          return true;
        } catch (error) {
          console.error('Failed to update task estimation', error);
          return false;
        }
      },
      fetchPRs: async () => {
        try {
          const res = await api.get('/pull-requests?status=OPEN');
          const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          set({ prs: data });
        } catch (error) {
          console.error('Failed to fetch PRs', error);
        }
      },
      fetchBugs: async () => {
        try {
          const res = await api.get('/bug-reports?status=OPEN');
          const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          set({ bugs: data });
        } catch (error) {
          console.error('Failed to fetch bugs', error);
        }
      },
    }),
    {
      name: 'nexus-workflow-v2',
      partialize: (state) => ({ 
        currentProject: state.currentProject, 
        currentSprint: state.currentSprint,
        // Do NOT persist tasks — always fetch fresh from server
      }),
    }
  )
);

