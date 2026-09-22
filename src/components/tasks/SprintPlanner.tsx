'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Target, Calendar, Play,
  AlertCircle, User,
  GripVertical, CalendarDays, Trash2, LayoutGrid, Settings, X
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useWorkflowStore, Task } from '../../store/workflowStore';
import { useToastStore } from '../../store/toastStore';
import api from '../../lib/api';
import { SprintNavigatorBar } from './SprintNavigatorBar';
import { CreateSprintModal } from './CreateSprintModal';
import { CreateTaskModal } from './CreateTaskModal';
import { Plus, Bot } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import AIPlannerModal from './AIPlannerModal';
import { EditSprintModal } from './EditSprintModal';

export default function SprintPlanner() {
  const { user } = useAuthStore();
  const { currentProject, tasks, fetchTasks, fetchProjects, currentSprint, setCurrentSprint, epics, fetchEpics } = useWorkflowStore();
  const { addToast } = useToastStore();
  const [sprints, setSprints] = useState<any[]>([]);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAIPlannerOpen, setIsAIPlannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isEditSprintModalOpen, setIsEditSprintModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');

  // Local state for optimistic updates
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Initial load
  useEffect(() => {
    if (!currentProject) {
      fetchProjects();
    }
  }, [currentProject, fetchProjects]);

  useEffect(() => {
    const loadData = async () => {
      if (currentProject) {
        try {
          const projectId = currentProject.id || (currentProject as any)._id;
          const res = await api.get(`/projects/${projectId}/sprints`);
          const rawSprints = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          const normalized = rawSprints.map((s: any) => ({
            ...s,
            id: s.id || s._id,
            _id: s._id || s.id
          }));
          setSprints(normalized);

          if (normalized.length > 0 && !currentSprint) {
            const active = normalized.find((s: any) => s.status === 'ACTIVE') ||
              normalized.find((s: any) => s.status === 'PLANNING') ||
              normalized[0];
            setCurrentSprint(active);
          }
          await fetchTasks({ projectId });
          await fetchEpics(projectId);
        } catch (error) {
          console.error('Failed to load sprint data', error);
        }
      }
    };
    loadData();
  }, [currentProject, fetchTasks, setCurrentSprint]);

  // Sync local tasks with store tasks whenever they change (except when we're optimistically updating)
  useEffect(() => {
    if (!isUpdating) {
      setLocalTasks(tasks);
    }
  }, [tasks, isUpdating]);

  const activeSprint = currentSprint;
  const activeSprintId = activeSprint?.id || activeSprint?._id;

  const filteredTasks = useMemo(() => {
    return localTasks.filter(t =>
      (t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.id && t.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [localTasks, searchQuery]);

  const sprintTasks = filteredTasks.filter(t => t.sprintId === activeSprintId);
  const backlogTasks = filteredTasks.filter(t => !t.sprintId || ['null', '', 'undefined'].includes(String(t.sprintId).trim().toLowerCase()));

  const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || t.estimate || 0), 0);
  const teamCapacity = 40;

  const sprintStartDate = activeSprint?.startDate ? new Date(activeSprint.startDate) : null;
  const sprintEndDate = activeSprint?.endDate ? new Date(activeSprint.endDate) : null;
  const sprintDurationDays = sprintStartDate && sprintEndDate
    ? Math.ceil((sprintEndDate.getTime() - sprintStartDate.getTime()) / (1000 * 60 * 60 * 24))
    : 14;
  const dateRangeLabel = sprintStartDate && sprintEndDate
    ? `${sprintStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${sprintEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'May 16–29';

  const renderTasksByEpic = (taskList: Task[], isBacklog = false) => {
    const epicGroups: Record<string, Task[]> = {};
    const noEpicTasks: Task[] = [];

    taskList.forEach(t => {
      const epicId = t.epicId || (t as any).epic?._id || (t as any).epic?.id;
      if (epicId) {
        if (!epicGroups[epicId]) epicGroups[epicId] = [];
        epicGroups[epicId].push(t);
      } else {
        noEpicTasks.push(t);
      }
    });

    return (
      <>
        {Object.entries(epicGroups).map(([epicId, groupTasks]) => {
          const epic = epics.find(e => e.id === epicId || (e as any)._id === epicId);
          return (
            <div key={epicId} className="mb-4 last:mb-0">
              <h5 className="text-[11px] font-bold text-[var(--accent-tl)] uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5"><LayoutGrid size={13} /> {epic?.name || 'Unknown Module'}</h5>
              <div className="space-y-1.5">
                {groupTasks.map(task => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    onMove={(targetId: any) => handleMoveTask(task.id, targetId)}
                    onDelete={() => handleDeleteTask(task.id)}
                    sprints={sprints}
                    isBacklog={isBacklog}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {noEpicTasks.length > 0 && (
          <div className="mb-4 last:mb-0">
            {Object.keys(epicGroups).length > 0 && <h5 className="text-[11px] font-bold text-[var(--accent-tl)] uppercase tracking-wider mb-2 px-1 mt-4">Other Tasks</h5>}
            <div className="space-y-1.5">
              {noEpicTasks.map(task => (
                <DraggableTask
                  key={task.id}
                  task={task}
                  onMove={(targetId: any) => handleMoveTask(task.id, targetId)}
                  onDelete={() => handleDeleteTask(task.id)}
                  sprints={sprints}
                  isBacklog={isBacklog}
                />
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = localTasks.find(t => (t.id === active.id || (t as any)._id === active.id));
    if (task) setActiveDragTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Determine target sprint id based on droppable zone
    let targetSprintId: string | null = null;
    if (overId === 'sprint-area') {
      targetSprintId = activeSprintId;
    } else if (overId === 'backlog-area') {
      targetSprintId = null;
    } else {
      // If dropped on a task, figure out which container it's in
      const overTask = localTasks.find(t => (t.id === overId || (t as any)._id === overId));
      if (overTask) {
        targetSprintId = overTask.sprintId === activeSprintId ? activeSprintId : null;
      } else {
        return; // Dropped on something unknown
      }
    }

    const currentTask = localTasks.find(t => (t.id === taskId || (t as any)._id === taskId));
    if (!currentTask || currentTask.sprintId === targetSprintId) return;

    // 1. Optimistic Update
    setLocalTasks(prev => prev.map(t =>
      (t.id === taskId || (t as any)._id === taskId) ? { ...t, sprintId: targetSprintId || '' } : t
    ));

    // 2. API Sync
    try {
      setIsUpdating(true);
      // Backend expects null or actual ID via PUT
      await api.patch(`/issues/${taskId}`, { sprintId: targetSprintId });
      addToast({ type: 'SUCCESS', title: 'Task Moved', message: `"${currentTask.title}" moved.` });
      // Refresh to ensure store is in sync
      await fetchTasks({ projectId: currentProject?.id || (currentProject as any)?._id });
    } catch (err) {
      // Revert optimistic update on failure
      setLocalTasks(tasks);
      addToast({ type: 'ERROR', title: 'Move Failed', message: 'Reverting change.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetGoal = () => {
    if (!activeSprintId) return;
    setGoalInput(activeSprint?.goal || '');
    setIsGoalModalOpen(true);
  };

  const saveGoal = async () => {
    if (!activeSprintId) return;

    try {
      setIsUpdating(true);
      const res = await api.put(`/sprints/${activeSprintId}`, { goal: goalInput });
      const updatedSprint = res.data?.data || res.data;
      addToast({ type: 'SUCCESS', title: 'Goal Updated', message: 'Sprint goal saved successfully.' });
      setCurrentSprint({ ...activeSprint, ...updatedSprint });

      const sprintsRes = await api.get(`/projects/${currentProject?.id || (currentProject as any)._id}/sprints`);
      setSprints(Array.isArray(sprintsRes.data) ? sprintsRes.data : (sprintsRes.data?.data || []));
      setIsGoalModalOpen(false);
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Update Failed', message: 'Could not update sprint goal.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeDates = () => {
    if (!activeSprintId) return;
    setStartDateInput(activeSprint?.startDate?.split('T')[0] || '');
    setEndDateInput(activeSprint?.endDate?.split('T')[0] || '');
    setIsDatesModalOpen(true);
  };

  const saveDates = async () => {
    if (!activeSprintId || !startDateInput || !endDateInput) return;

    try {
      setIsUpdating(true);
      const res = await api.put(`/sprints/${activeSprintId}`, { startDate: startDateInput, endDate: endDateInput });
      const updatedSprint = res.data?.data || res.data;
      addToast({ type: 'SUCCESS', title: 'Dates Updated', message: 'Sprint timeline adjusted.' });
      setCurrentSprint({ ...activeSprint, ...updatedSprint });

      const sprintsRes = await api.get(`/projects/${currentProject?.id || (currentProject as any)._id}/sprints`);
      setSprints(Array.isArray(sprintsRes.data) ? sprintsRes.data : (sprintsRes.data?.data || []));
      setIsDatesModalOpen(false);
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Update Failed', message: 'Could not adjust dates.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartSprint = async () => {
    if (!activeSprintId) return;
    try {
      setIsUpdating(true);
      const res = await api.put(`/sprints/${activeSprintId}/status`, { status: 'ACTIVE' });
      const updatedSprint = res.data?.data || res.data;
      addToast({ type: 'SUCCESS', title: 'Sprint Started', message: `${activeSprint?.name} is now active!` });
      setCurrentSprint({ ...activeSprint, ...updatedSprint });

      const sprintsRes = await api.get(`/projects/${currentProject?.id || (currentProject as any)._id}/sprints`);
      const rawSprints = Array.isArray(sprintsRes.data) ? sprintsRes.data : (sprintsRes.data?.data || []);
      const normalized = rawSprints.map((s: any) => ({
        ...s,
        id: s.id || s._id,
        _id: s._id || s.id
      }));
      setSprints(normalized);
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Start Failed', message: 'Could not start the sprint.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim() || !currentProject) return;
    setIsUpdating(true);
    try {
      await useWorkflowStore.getState().createEpic({
        name: newModuleName,
        projectId: currentProject.id || (currentProject as any)._id,
        color: '#4f46e5'
      });
      addToast({ type: 'SUCCESS', title: 'Module Created', message: `Module "${newModuleName}" created successfully.` });
      setNewModuleName('');
      setIsModuleModalOpen(false);
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Failed', message: 'Could not create module.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSprint = async () => {
    if (!activeSprintId) return;
    if (!window.confirm(`Are you sure you want to delete the sprint "${activeSprint?.name}"?`)) return;
    
    try {
      setIsUpdating(true);
      await api.delete(`/sprints/${activeSprintId}`);
      addToast({ type: 'SUCCESS', title: 'Sprint Deleted', message: 'Sprint has been deleted.' });
      
      // Reload sprints and set first active/planning sprint
      const projectId = currentProject?.id || (currentProject as any)?._id;
      const sprintsRes = await api.get(`/projects/${projectId}/sprints`);
      const rawSprints = Array.isArray(sprintsRes.data) ? sprintsRes.data : (sprintsRes.data?.data || []);
      const normalized = rawSprints.map((s: any) => ({
        ...s,
        id: s.id || s._id,
        _id: s._id || s.id
      }));
      setSprints(normalized);
      
      const active = normalized.find((s: any) => s.status === 'ACTIVE') ||
                     normalized.find((s: any) => s.status === 'PLANNING') ||
                     normalized[0] || null;
      setCurrentSprint(active);
      await fetchTasks({ projectId });
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Delete Failed', message: 'Could not delete the sprint.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMoveTask = async (taskId: string, targetSprintId: string | null) => {
    try {
      setIsUpdating(true);
      // Corrected to PUT for backend compatibility
      await api.patch(`/issues/${taskId}`, { sprintId: targetSprintId });
      addToast({ type: 'SUCCESS', title: 'Task Updated', message: targetSprintId ? 'Task added to sprint.' : 'Task moved to backlog.' });
      await fetchTasks({ projectId: currentProject?.id || (currentProject as any)?._id });
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Update Failed', message: 'Could not reassign task.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setIsUpdating(true);
      await api.delete(`/issues/${taskId}`);
      addToast({ type: 'SUCCESS', title: 'Task Deleted', message: 'Task deleted successfully.' });
      await fetchTasks({ projectId: currentProject?.id || (currentProject as any)?._id });
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Delete Failed', message: 'Could not delete task.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const isWithinCapacity = totalPoints <= teamCapacity;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {isTaskModalOpen && (
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          projectId={currentProject?.id || (currentProject as any)?._id}
          onTaskCreated={(newTask) => {
            fetchTasks({ projectId: currentProject?.id || (currentProject as any)?._id });
            setIsTaskModalOpen(false);
          }}
        />
      )}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModuleModalOpen(false)} />
          <div className="relative bg-[var(--surface)] w-full max-w-sm rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg2)]">
              <h3 className="font-semibold text-[var(--text)]">Add New Module</h3>
              <button onClick={() => setIsModuleModalOpen(false)} className="text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[var(--text2)]">Module Name</label>
                <input
                  type="text"
                  autoFocus
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateModule();
                  }}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[13px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
                  placeholder="e.g. Authentication, API..."
                />
              </div>
              <button
                onClick={handleCreateModule}
                disabled={isUpdating || !newModuleName.trim()}
                className="w-full py-2 bg-[var(--accent)] text-white rounded-lg text-[13px] font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}
      <CreateSprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onSuccess={(id) => {
          api.get(`/sprints/${id}`).then(res => {
            const sprint = res.data?.data || res.data;
            setCurrentSprint(sprint);
            // Reload list
            const projectId = currentProject?.id || (currentProject as any)?._id;
            api.get(`/projects/${projectId}/sprints`).then(sRes => {
              setSprints(Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data || []));
            });
          });
        }}
      />
      <EditSprintModal
        isOpen={isEditSprintModalOpen}
        onClose={() => setIsEditSprintModalOpen(false)}
        sprint={activeSprint}
        onSuccess={(updatedSprint) => {
          setCurrentSprint({ ...activeSprint, ...updatedSprint });
          const projectId = currentProject?.id || (currentProject as any)?._id;
          api.get(`/projects/${projectId}/sprints`).then(sRes => {
            setSprints(Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data || []));
          });
        }}
      />

      <div className="flex flex-col h-full bg-[var(--background)] overflow-hidden">
        {/* Sprint Navigator Bar */}
        <SprintNavigatorBar
          sprints={sprints}
          onNewSprint={() => setIsSprintModalOpen(true)}
        />

        {/* Action Header */}
        <div className="px-8 py-5 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-[20px] font-semibold text-[var(--text)]">{activeSprint?.name || 'Sprint Planning'}</h2>
              <p className="text-[12px] text-[var(--text3)] mt-0.5">
                {currentProject?.name || 'Project'} · {activeSprint?.status || 'Planning'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['TEAM_LEAD', 'MANAGER', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'].includes(user?.role || '') || user?.email?.includes('lead') || user?.email === 'agila@fic.com' || user?.email === 'akila@fic.com' ? (
                <button onClick={() => setIsAIPlannerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4FAB] text-white rounded-lg text-[12px] font-medium hover:bg-[#1A3A8F] transition-all shadow-sm"
                >
                  AI Plan Project
                </button>
              ) : null}
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4FAB] text-white rounded-lg text-[12px] font-medium hover:bg-[#1A3A8F] transition-all shadow-sm"
              >
                <Plus size={14} /> Add Task
              </button>
              <button
                onClick={() => setIsModuleModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text2)] rounded-lg text-[12px] font-medium hover:bg-[var(--bg2)] transition-all"
              >
                <Plus size={14} /> Add Module
              </button>
              <button
                onClick={handleSetGoal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text2)] rounded-lg text-[12px] font-medium hover:bg-[var(--bg2)] transition-all"
              >
                <Target size={14} /> Set Goal
              </button>
              <button
                onClick={handleChangeDates}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text2)] rounded-lg text-[12px] font-medium hover:bg-[var(--bg2)] transition-all"
              >
                <Calendar size={14} /> Change Dates
              </button>
              <button
                onClick={() => setIsEditSprintModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text2)] rounded-lg text-[12px] font-medium hover:bg-[var(--bg2)] transition-all"
              >
                <Settings size={14} /> Edit Sprint
              </button>
              <button
                onClick={handleDeleteSprint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-red-200/50 text-red-500 rounded-lg text-[12px] font-medium hover:bg-red-50 hover:border-red-200 transition-all"
              >
                <Trash2 size={14} /> Delete
              </button>
              <button
                onClick={handleStartSprint}
                disabled={isUpdating || activeSprint?.status === 'ACTIVE' || activeSprint?.status === 'COMPLETED'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--accent)] text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Play size={12} fill="currentColor" />
                {activeSprint?.status === 'ACTIVE' ? 'Sprint Active' : `Start ${(activeSprint?.name || 'Sprint').split(':')[0].trim()}`}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-5 space-y-5">

          {/* Capacity Banner */}
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[12px] ${isWithinCapacity
              ? 'bg-[var(--greenbg)] text-[var(--greentext)] border border-green-200'
              : 'bg-[var(--redbg)] text-[var(--redtext)] border border-red-200'
            }`}>
            <AlertCircle size={14} />
            <span>
              {isWithinCapacity
                ? `Within capacity by ${teamCapacity - totalPoints} pts — Current sprint has ${totalPoints} pts and team velocity is ${teamCapacity}. Ready to start.`
                : `Over capacity by ${totalPoints - teamCapacity} pts — Remove tasks or increase capacity.`
              }
            </span>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-5 gap-4">
            <MetricCard label="Planned tasks" value={sprintTasks.length.toString()} color="var(--accent)" />
            <MetricCard label="Story points" value={`${totalPoints}/${teamCapacity}`} color="var(--accent)" />
            <MetricCard label="Backlog remaining" value={backlogTasks.length.toString()} color="var(--accent)" />
            <MetricCard label="Sprint duration" value={`${sprintDurationDays}d`} color="var(--accent)" />
            <MetricCard label="Avg velocity" value={`${teamCapacity}pts`} color="var(--accent)" />
          </div>

          {/* Sprint Tasks Section */}
          <DroppableArea
            id="sprint-area"
            title={`${activeSprint?.name || 'Sprint'} Tasks — ${dateRangeLabel}`}
            count={sprintTasks.length}
            isUpdating={isUpdating}
          >
            {sprintTasks.length > 0 && renderTasksByEpic(sprintTasks, false)}
            {sprintTasks.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-[var(--text3)]">
                <CalendarDays size={28} strokeWidth={1.5} />
                <p className="text-[13px] font-medium">No tasks planned for {activeSprint?.name || 'this sprint'}</p>
                <p className="text-[11px]">Add tasks from the backlog.</p>
              </div>
            )}
          </DroppableArea>

          {/* Backlog Section */}
          <DroppableArea
            id="backlog-area"
            title="Backlog"
            count={backlogTasks.length}
            isUpdating={isUpdating}
          >
            {backlogTasks.length > 0 && renderTasksByEpic(backlogTasks, true)}
            {backlogTasks.length === 0 && (
              <div className="py-8 flex flex-col items-center justify-center gap-1 text-[var(--text3)]">
                <p className="text-[12px]">Backlog is empty</p>
              </div>
            )}
          </DroppableArea>
        </div>
      </div>

      <DragOverlay zIndex={1000}>
        {activeDragTask ? (
          <div className="opacity-90 shadow-2xl scale-[1.02] rotate-1">
            <DraggableTask task={activeDragTask} isOverlay />
          </div>
        ) : null}
      </DragOverlay>

      {currentProject && (
        <AIPlannerModal
          isOpen={isAIPlannerOpen}
          onClose={() => setIsAIPlannerOpen(false)}
          projectId={currentProject.id || (currentProject as any)._id}
          projectName={currentProject.name}
          onSuccess={() => {
            const projectId = currentProject.id || (currentProject as any)._id;
            // 1. Reload sprints so newly created AI sprints appear
            api.get(`/projects/${projectId}/sprints`).then(sRes => {
              const rawSprints = Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data || []);
              const normalized = rawSprints.map((s: any) => ({
                ...s,
                id: s.id || s._id,
                _id: s._id || s.id
              }));
              setSprints(normalized);
              // Activate first PLANNING sprint so backlog/sprint board updates
              const planning = normalized.find((s: any) => s.status === 'PLANNING');
              if (planning) setCurrentSprint(planning);
            });
            // 2. Reload tasks silently — CRITICAL: pass projectId explicitly so the correct project's backlog loads
            fetchTasks({ projectId }, true);
            // NOTE: do NOT call fetchProjects(true) here — it resets currentProject to the first in list
          }}
        />
      )}
    </DndContext>
  );
}

/* ── Metric Card ────────────────────────────────────────────────── */
function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3">
      <p className="text-[11px] text-[var(--accent-tl)] font-medium mb-1">{label}</p>
      <p className="text-[20px] font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}

/* ── Droppable Area ─────────────────────────────────────────────── */
function DroppableArea({ id, title, count, children, isUpdating }: any) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-lg transition-all duration-200 ${isOver ? 'ring-2 ring-[var(--accent-tl)] ring-inset bg-emerald-50/20' : ''
        } ${isUpdating ? 'opacity-70 pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <h4 className="text-[13px] font-semibold text-[var(--text)]">{title}</h4>
      </div>
      <div className="p-3 space-y-1.5 min-h-[150px]">
        {children}
      </div>
    </div>
  );
}

/* ── Draggable Task Row ─────────────────────────────────────────── */
function DraggableTask({ task, isOverlay, onDelete }: any) {
  const taskId = task.id || task._id;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: taskId,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all bg-[var(--surface)] border border-transparent ${isDragging ? 'opacity-30 scale-95 border-[var(--border)]' : 'hover:bg-[var(--bg2)] hover:border-[var(--border)]'
        } ${isOverlay ? 'shadow-lg border-[var(--border)]' : 'cursor-grab active:cursor-grabbing'
        }`}
    >
      <div className="p-1 text-[var(--text3)] hover:text-[var(--text2)]">
        <GripVertical size={14} />
      </div>
      <span className="text-[11px] font-medium text-[var(--text3)] tabular-nums w-10">{taskId?.slice(-4) || '—'}</span>
      <p className="text-[13px] text-[var(--text)] flex-1 line-clamp-1">{task.title}</p>
      <div className="flex items-center gap-2.5">
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${task.priority === 'CRITICAL' ? 'bg-[var(--redbg)] text-[var(--redtext)]' :
            task.priority === 'HIGH' ? 'bg-[var(--amberbg)] text-[var(--ambertext)]' :
              task.priority === 'MEDIUM' ? 'bg-[var(--bluebg)] text-[var(--bluetext)]' :
                'bg-[var(--bg2)] text-[var(--text3)]'
          }`}>{task.priority}</span>
        {task.assignee && (
          <div className="w-6 h-6 rounded-full border border-[var(--border)] bg-[var(--bg2)] flex items-center justify-center text-[9px] font-medium text-[var(--text2)] overflow-hidden">
            {task.assignee.avatarUrl ? (
              <img src={task.assignee.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              task.assignee.name?.[0]
            )}
          </div>
        )}
        <span className="text-[12px] font-medium text-[var(--text2)] w-4 text-center">{task.storyPoints || task.estimate || '–'}</span>
        {onDelete && !isOverlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-[var(--text3)] hover:text-[var(--redtext)] hover:bg-[var(--redbg)] rounded transition-colors ml-1"
            title="Delete Task"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
