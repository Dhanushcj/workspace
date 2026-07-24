'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Target, Calendar, Play, 
  AlertCircle, User, 
  GripVertical, CalendarDays
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

export default function SprintPlanner() {
  const { currentProject, tasks, fetchTasks, fetchProjects, currentSprint, setCurrentSprint } = useWorkflowStore();
  const { addToast } = useToastStore();
  const [sprints, setSprints] = useState<any[]>([]);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
            const active = normalized.find((s:any) => s.status === 'ACTIVE') || 
                           normalized.find((s:any) => s.status === 'PLANNING') || 
                           normalized[0];
            setCurrentSprint(active);
          }
          await fetchTasks({ projectId });
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
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.id && t.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [localTasks, searchQuery]);

  const sprintTasks = filteredTasks.filter(t => t.sprintId === activeSprintId);
  const backlogTasks = filteredTasks.filter(t => !t.sprintId || t.sprintId === 'null' || t.sprintId === '');

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

  const handleSetGoal = async () => {
    if (!activeSprintId) return;
    const goal = prompt('Enter sprint goal:', activeSprint?.goal || '');
    if (goal === null) return;
    
    try {
      setIsUpdating(true);
      const res = await api.put(`/sprints/${activeSprintId}`, { goal });
      const updatedSprint = res.data?.data || res.data;
      addToast({ type: 'SUCCESS', title: 'Goal Updated', message: 'Sprint goal saved successfully.' });
      setCurrentSprint({ ...activeSprint, ...updatedSprint });
      
      const sprintsRes = await api.get(`/projects/${currentProject?.id}/sprints`);
      setSprints(Array.isArray(sprintsRes.data) ? sprintsRes.data : (sprintsRes.data?.data || []));
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Update Failed', message: 'Could not update sprint goal.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeDates = async () => {
    if (!activeSprintId) return;
    const start = prompt('Start Date (YYYY-MM-DD):', activeSprint?.startDate?.split('T')[0] || '');
    const end = prompt('End Date (YYYY-MM-DD):', activeSprint?.endDate?.split('T')[0] || '');
    if (!start || !end) return;

    try {
      setIsUpdating(true);
      const res = await api.put(`/sprints/${activeSprintId}`, { startDate: start, endDate: end });
      const updatedSprint = res.data?.data || res.data;
      addToast({ type: 'SUCCESS', title: 'Dates Updated', message: 'Sprint timeline adjusted.' });
      setCurrentSprint({ ...activeSprint, ...updatedSprint });
      
      const sprintsRes = await api.get(`/projects/${currentProject?.id}/sprints`);
      setSprints(Array.isArray(sprintsRes.data) ? sprintsRes.data : (sprintsRes.data?.data || []));
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

  const isWithinCapacity = totalPoints <= teamCapacity;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
      
      <div className="flex flex-col h-full bg-[var(--background)] overflow-hidden">
        {/* Sprint Navigator Bar */}
        <SprintNavigatorBar 
          sprints={sprints} 
          onNewSprint={() => setIsSprintModalOpen(true)} 
        />

        {/* Action Header */}
        <div className="px-8 py-5 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-semibold text-[var(--text)]">{activeSprint?.name || 'Sprint Planning'}</h2>
              <p className="text-[12px] text-[var(--text3)] mt-0.5">
                {currentProject?.name || 'Project'} · {activeSprint?.status || 'Planning'}
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                onClick={handleStartSprint}
                disabled={isUpdating || activeSprint?.status === 'ACTIVE' || activeSprint?.status === 'COMPLETED'}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--accent)] text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Play size={12} fill="currentColor" /> 
                {activeSprint?.status === 'ACTIVE' ? 'Sprint Active' : `Start ${activeSprint?.name || 'Sprint'}`}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-5 space-y-5">
          
          {/* Capacity Banner */}
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[12px] ${
            isWithinCapacity 
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
            {sprintTasks.map(task => (
              <DraggableTask 
                key={task.id} 
                task={task} 
                onMove={(targetId: any) => handleMoveTask(task.id, targetId)}
                sprints={sprints}
              />
            ))}
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
            {backlogTasks.map(task => (
              <DraggableTask 
                key={task.id} 
                task={task} 
                onMove={(targetId: any) => handleMoveTask(task.id, targetId)}
                sprints={sprints}
                isBacklog
              />
            ))}
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
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-lg transition-all duration-200 ${
        isOver ? 'ring-2 ring-[var(--accent-tl)] ring-inset bg-emerald-50/20' : ''
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
function DraggableTask({ task, isOverlay }: any) {
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all bg-[var(--surface)] border border-transparent ${
        isDragging ? 'opacity-30 scale-95 border-[var(--border)]' : 'hover:bg-[var(--bg2)] hover:border-[var(--border)]'
      } ${
        isOverlay ? 'shadow-lg border-[var(--border)]' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="p-1 text-[var(--text3)] hover:text-[var(--text2)]">
        <GripVertical size={14} />
      </div>
      <span className="text-[11px] font-medium text-[var(--text3)] tabular-nums w-10">{taskId?.slice(-4) || '—'}</span>
      <p className="text-[13px] text-[var(--text)] flex-1 line-clamp-1">{task.title}</p>
      <div className="flex items-center gap-2.5">
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
          task.priority === 'CRITICAL' ? 'bg-[var(--redbg)] text-[var(--redtext)]' :
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
      </div>
    </div>
  );
}
