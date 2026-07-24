'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Issue } from '@nexus/shared';
import { MoreHorizontal, Paperclip, MessageSquare, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KanbanCardProps {
  issue: Issue & { assignee?: { name: string | null } };
}

export const KanbanCard = ({ issue }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    LOW: 'bg-blue-100 text-blue-700 border-blue-200',
    MEDIUM: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group",
        isDragging && "ring-2 ring-emerald-500 border-transparent shadow-xl"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
          priorityColors[issue.priority]
        )}>
          {issue.priority}
        </span>
        <button className="text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-sm font-semibold text-slate-800 mb-2 line-clamp-2 leading-relaxed">
        {issue.title}
      </h3>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-400">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">3</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Paperclip className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">1</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
             {issue.assignee?.name?.[0] || 'U'}
           </div>
        </div>
      </div>
    </div>
  );
};

