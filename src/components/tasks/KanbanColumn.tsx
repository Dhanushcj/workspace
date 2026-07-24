import React from 'react';
import { Plus } from 'lucide-react';
import { Task } from '../../store/workflowStore';
import { TaskCard } from './TaskCard';

interface TaskItemProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
  isTeamLead?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onAssign?: (id: string) => void;
  onResolve?: (id: string) => void;
  displayId?: string;
}

const TaskItem = React.memo(({ 
  task, onTaskClick, isSelected, onSelect,
  isTeamLead, onApprove, onReject, onAssign, onResolve, displayId
}: TaskItemProps) => {
  return (
    <div className="transition-all active:scale-[0.98]">
      <TaskCard 
        task={task} 
        onClick={() => onTaskClick(task)} 
        isSelected={isSelected}
        onSelect={() => onSelect(task.id)}
        onApprove={onApprove}
        onReject={onReject}
        onAssign={onAssign}
        onResolve={onResolve}
        displayId={displayId}
        isTeamLead={isTeamLead}
      />
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

// Column color scheme based on status key
const columnStyle: Record<string, { dot: string; badge: string; text: string }> = {
  TO_DO:      { dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600',   text: 'text-slate-600' },
  IN_PROGRESS:{ dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700',     text: 'text-slate-700' },
  IN_REVIEW:  { dot: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700', text: 'text-slate-700' },
  PR_SUBMITTED:{ dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700', text: 'text-slate-700' },
  TESTING:    { dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700',   text: 'text-slate-700' },
  DONE:       { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700',text: 'text-slate-700' },
  BLOCKED:    { dot: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-700',     text: 'text-slate-700' },
};

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  dotColor: string;
  onTaskClick: (task: Task) => void;
  onCreateTask: (status: any) => void;
  selectedIds: string[];
  onSelectTask: (taskId: string) => void;
  opacity?: number;
  isTeamLead?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onAssign?: (id: string) => void;
  onResolve?: (id: string) => void;
  displayIds?: Record<string, string>;
}

export const KanbanColumn = React.memo(({ 
  id, 
  title, 
  tasks, 
  dotColor, 
  onTaskClick, 
  onCreateTask,
  selectedIds,
  onSelectTask,
  opacity = 1,
  isTeamLead,
  onApprove,
  onReject,
  onAssign,
  onResolve,
  displayIds,
}: KanbanColumnProps) => {
  const cs = columnStyle[id] || { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-500', text: 'text-slate-600' };

  return (
    <div 
      className="flex flex-col w-[185px] shrink-0 rounded-2xl transition-opacity duration-300 bg-slate-100/30 p-1.5"
      style={{ opacity }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 py-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cs.dot}`} />
          <h3 className={`text-[12px] font-semibold ${cs.text} capitalize`}>
            {title === 'In Review' || title === 'PR Submitted' ? 'In review' : title}
          </h3>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cs.badge}`}>
            {tasks.length}
          </span>
        </div>
        <button 
          onClick={() => onCreateTask(id)}
          className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Task List Area */}
      <div className="flex-1 flex flex-col gap-3 min-h-[480px] px-0.5 rounded-xl">
        <div className="flex flex-col gap-3">
          {tasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onTaskClick={onTaskClick} 
              isSelected={selectedIds.includes(task.id)}
              onSelect={onSelectTask}
              isTeamLead={isTeamLead}
              onApprove={onApprove}
              onReject={onReject}
              onAssign={onAssign}
              onResolve={onResolve}
              displayId={displayIds?.[task.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';

KanbanColumn.displayName = 'KanbanColumn';

