'use client';

import { useDroppable } from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Issue, IssueStatus } from '@nexus/shared';
import { KanbanCard } from './KanbanCard';
import { Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KanbanColumnProps {
  status: IssueStatus;
  title: string;
  issues: Issue[];
}

export const KanbanColumn = ({ status, title, issues }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-80 min-h-[500px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
          <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">
            {issues.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500">
            <Plus className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 flex flex-col gap-3 p-2 rounded-xl transition-colors bg-slate-100/50"
        )}
      >
        <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <KanbanCard key={issue.id} issue={issue as any} />
          ))}
        </SortableContext>
        
        {issues.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-12">
            <p className="text-xs font-medium text-slate-400">No issues here</p>
          </div>
        )}
      </div>
    </div>
  );
};

