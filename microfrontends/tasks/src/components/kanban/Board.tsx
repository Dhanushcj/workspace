

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Issue, IssueStatus } from '@nexus/shared';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

const COLUMNS: { status: IssueStatus; title: string }[] = [
  { status: 'TO_DO', title: 'To Do' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'PR_SUBMITTED', title: 'PR Submitted' },
  { status: 'DONE', title: 'Done' },
];

interface BoardProps {
  initialIssues: Issue[];
  onStatusChange?: (issueId: string, newStatus: IssueStatus) => void;
}

export const Board = ({ initialIssues, onStatusChange }: BoardProps) => {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const issue = issues.find((i) => i.id === active.id);
    if (issue) setActiveIssue(issue);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAnIssue = issues.some(i => i.id === activeId);
    const isOverAnIssue = issues.some(i => i.id === overId);
    const isOverAColumn = COLUMNS.some(c => c.status === overId);

    if (isActiveAnIssue && isOverAnIssue) {
      setIssues((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === activeId);
        const overIndex = prev.findIndex((i) => i.id === overId);

        if (prev[activeIndex].status !== prev[overIndex].status) {
          prev[activeIndex].status = prev[overIndex].status;
          return arrayMove(prev, activeIndex, overIndex - 1);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    if (isActiveAnIssue && isOverAColumn) {
      setIssues((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === activeId);
        prev[activeIndex].status = overId as IssueStatus;
        return arrayMove(prev, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const issue = issues.find((i) => i.id === active.id);
    if (issue && onStatusChange) {
      onStatusChange(issue.id, issue.status);
    }
    setActiveIssue(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-8 overflow-x-auto pb-4 h-full">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            issues={issues.filter((i) => i.status === col.status)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeIssue ? <KanbanCard issue={activeIssue as any} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

