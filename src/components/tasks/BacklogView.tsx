'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Target, ChevronDown, ListChecks, 
  MoreHorizontal, ChevronRight, Layout, Kanban, 
  AlertCircle, Bug, Users, Calendar, 
  Play, Clock, Download, 
  GripVertical, 
  Settings,
  ArrowRight
} from 'lucide-react';
import { useWorkflowStore, Task, Epic } from '../../store/workflowStore';
import { useToastStore } from '../../store/toastStore';
import { CreateTaskModal } from './CreateTaskModal';
import { CreateSprintModal } from './CreateSprintModal';
import api from '../../lib/api';

export const BacklogView = ({ onNavigate = (tab: string) => {} }: { onNavigate?: (tab: string) => void }) => {
  const { currentProject, tasks, epics, fetchTasks, fetchEpics, fetchProjects } = useWorkflowStore();
  const { addToast } = useToastStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!currentProject) {
      fetchProjects();
    }
  }, [currentProject, fetchProjects]);

  useEffect(() => {
    const loadData = async () => {
      if (currentProject) {
        try {
          // Normalize IDs during load
          await fetchTasks({ projectId: currentProject.id || (currentProject as any)._id });
          await fetchEpics(currentProject.id || (currentProject as any)._id);
        } catch (error) {
          console.error('Failed to load backlog data', error);
        }
      }
    };
    loadData();
  }, [currentProject?.id, currentProject?._id, fetchTasks, fetchEpics]);

  const unplannedTasks = useMemo(() => {
    return tasks.filter(t => t && (!t.sprintId || t.sprintId === 'null' || t.sprintId === ''));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return unplannedTasks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.id && t.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [unplannedTasks, searchQuery]);

  const stats = {
    total: unplannedTasks.length,
    points: unplannedTasks.reduce((sum, t) => sum + (t.storyPoints || t.estimate || 0), 0),
    grooming: unplannedTasks.filter(t => !t.storyPoints || !t.priority).length,
    bugs: unplannedTasks.filter(t => t.type?.toUpperCase() === 'BUG' || t.isHotfix).length
  };

  const sections = useMemo(() => {
    const result: { title: string, tasks: Task[], isBug?: boolean }[] = [];
    
    // Group by Epic
    epics.forEach(epic => {
      const epicTasks = filteredTasks.filter(t => t.epicId === epic.id && t.type?.toUpperCase() !== 'BUG');
      if (epicTasks.length > 0) {
        result.push({
          title: `${epic.name.toUpperCase()} EPIC`,
          tasks: epicTasks
        });
      }
    });

    // Uncategorized tasks (not bug, no epic)
    const uncategorized = filteredTasks.filter(t => !t.epicId && t.type?.toUpperCase() !== 'BUG');
    if (uncategorized.length > 0) {
      result.push({
        title: 'UNCATEGORIZED TASKS',
        tasks: uncategorized
      });
    }

    // Bug tickets
    const bugTasks = filteredTasks.filter(t => t.type?.toUpperCase() === 'BUG' || t.isHotfix);
    if (bugTasks.length > 0) {
      result.push({
        title: 'BUG TICKETS',
        tasks: bugTasks,
        isBug: true
      });
    }

    return result;
  }, [epics, filteredTasks]);

  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [sprints, setSprints] = useState<any[]>([]);
  const { currentSprint } = useWorkflowStore();

  useEffect(() => {
    const fetchSprints = async () => {
      const projectId = currentProject?.id || (currentProject as any)?._id;
      if (projectId) {
        try {
          const res = await api.get(`/projects/${projectId}/sprints`);
          setSprints(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (err) {
          console.error('Failed to fetch sprints');
        }
      }
    };
    fetchSprints();
  }, [currentProject]);

  const handleMoveTask = async (taskId: string, targetSprintId: string | null) => {
    try {
      setIsUpdating(true);
      await api.patch(`/issues/${taskId}`, { sprintId: targetSprintId });
      addToast({ type: 'SUCCESS', title: 'Task Updated', message: targetSprintId ? 'Task added to sprint.' : 'Task moved to backlog.' });
      await fetchTasks({ projectId: currentProject?.id || (currentProject as any)?._id });
    } catch (err) {
      addToast({ type: 'ERROR', title: 'Update Failed', message: 'Could not reassign task.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] overflow-y-auto custom-scrollbar">
      <CreateSprintModal 
        isOpen={isSprintModalOpen} 
        onClose={() => setIsSprintModalOpen(false)}
        onSuccess={() => onNavigate('SprintPlanner')}
      />

      {/* Header Bar */}
      <div className="px-8 py-8 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium text-slate-900">Backlog</h1>
          <p className="text-[14px] text-slate-500 mt-1">
            {currentProject?.name} · {stats.total} unplanned tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSprintModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Target size={18} className="text-slate-400" /> Sprint Planner
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0D5F46] text-white rounded-xl text-[14px] font-medium hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-8 grid grid-cols-4 gap-6 mb-12">
        <StatCard label="Total backlog" value={stats.total.toString()} />
        <StatCard label="Backlog pts" value={stats.points.toString()} />
        <StatCard label="Needs grooming" value={stats.grooming.toString()} valueColor="text-red-500" />
        <StatCard label="Bug tickets" value={stats.bugs.toString()} valueColor="text-red-500" />
      </div>

      {/* Task Sections */}
      <div className="px-8 space-y-12 pb-24">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-5">
            <h3 className="text-[12px] font-medium text-slate-400 tracking-[0.08em] uppercase">
              {section.title}
            </h3>
            <div className="space-y-3">
              {section.tasks.map((task, tidx) => (
                <BacklogTaskRow 
                  key={task.id || (task as any)._id} 
                  task={task} 
                  isBug={section.isBug} 
                  displayId={`#T-${String((task.id || (task as any)._id || '').slice(-2))}`}
                  onMove={(sid: string | null) => handleMoveTask(task.id || (task as any)._id, sid)}
                  sprints={sprints}
                  currentSprintId={currentSprint?.id || (currentSprint as any)?._id}
                />
              ))}
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <ListChecks size={32} className="text-slate-300" />
            </div>
            <p className="text-[16px] font-medium text-slate-400">All caught up! No tasks in backlog.</p>
          </div>
        )}
      </div>

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={currentProject?.id || ''}
        onTaskCreated={() => currentProject?.id && fetchTasks({ projectId: currentProject.id })}
      />
    </div>
  );
};

function StatCard({ label, value, valueColor }: { label: string, value: string, valueColor?: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <p className="text-[13px] text-slate-400 font-medium mb-3">{label}</p>
      <p className={`text-[36px] font-medium ${valueColor || 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function BacklogTaskRow({ task, isBug, displayId, onMove, sprints, currentSprintId }: { 
  task: Task, 
  isBug?: boolean, 
  displayId: string, 
  onMove: (sid: string | null) => void,
  sprints: any[],
  currentSprintId?: string
}) {
  return (
    <div className={`group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-lg hover:shadow-slate-200/50 transition-all ${isBug ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <div className="flex items-center gap-4">
          <GripVertical size={14} className="text-slate-200" />
          <span className="text-[12px] font-medium text-slate-400 w-12">{displayId}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-medium text-slate-900 truncate">{task.title}</h4>
          <p className="text-[13px] text-slate-400 mt-0.5">
            {isBug ? `Bug ${displayId} · ${task.assignee?.name || 'Unassigned'}` : `${task.type ? (task.type.charAt(0).toUpperCase() + task.type.slice(1).toLowerCase()) : 'Backend'} · ${task.storyPoints || task.estimate || 0} pts`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <span className={`px-3 py-1 rounded-full text-[11px] font-medium tracking-wide ${
          task.priority === 'CRITICAL' || task.priority === 'HIGH' 
            ? 'bg-amber-50 text-amber-600' 
            : task.priority === 'MEDIUM' 
              ? 'bg-blue-50 text-blue-600'
              : 'bg-slate-50 text-slate-500'
        }`}>
          {task.priority?.toLowerCase() || 'medium'}
        </span>
        
        <div className="flex items-center gap-3">
          <div className="relative group/select">
             <select 
              value={task.sprintId || 'backlog'}
              onChange={(e) => onMove(e.target.value === 'backlog' ? null : e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-[13px] font-medium px-4 py-2 pr-10 hover:bg-slate-100 transition-all outline-none cursor-pointer"
             >
               <option value="backlog">Unplanned</option>
               {sprints.map(s => (
                 <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
               ))}
             </select>
             <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button 
            onClick={() => onMove(currentSprintId || null)}
            disabled={!currentSprintId}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E6F4F1] text-[#0D5F46] rounded-xl text-[13px] font-medium hover:bg-[#D1EBE5] transition-all disabled:opacity-50"
          >
            <ArrowRight size={16} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
