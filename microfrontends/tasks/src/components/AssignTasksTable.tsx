

import React from 'react';
import {
  Clock, UserPlus, RotateCcw, GripVertical
} from 'lucide-react';

// ─── Demo task shape ──────────────────────────────────────────────────────────
export interface DemoTask {
  id: string;
  title: string;
  type: string;
  priority: string;
  points: number;
  assignee: { initials: string; name: string; color: string } | null;
  dueLabel: string;
  dueSoon: boolean;
  dueToday: boolean;
  stack: string;
  tag?: string;
}

interface Props {
  demoTasks: DemoTask[];
  onDemoAssign: (taskId: string) => void;
  selectedIds?: string[];
  onSelect?: (taskId: string) => void;
  onSelectAll?: (ids: string[]) => void;
  filterMode: 'all' | 'unassigned' | 'priority';
  onFilterChange: (mode: 'all' | 'unassigned' | 'priority') => void;
}

// ─── Priority styling ─────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    Critical: 'bg-rose-50 text-rose-600 border-rose-200',
    High: 'bg-orange-50 text-orange-600 border-orange-200',
    Medium: 'bg-blue-50 text-blue-600 border-blue-200',
    Low: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${styles[priority] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {priority}
    </span>
  );
}

// ─── AssignTasksTable ─────────────────────────────────────────────────────────
export const AssignTasksTable = ({
  demoTasks, onDemoAssign,
  selectedIds = [], onSelect, onSelectAll,
  filterMode, onFilterChange,
}: Props) => {
  const allIds = demoTasks.map(t => t.id);
  const unassignedIds = demoTasks.filter(t => !t.assignee).map(t => t.id);
  const allChecked = allIds.length > 0 && selectedIds.length === allIds.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Table header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-black text-slate-800">All sprint tasks</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Click a row to assign or reassign</p>
        </div>
        <div className="flex bg-slate-100/80 p-1 rounded-xl">
          {(['all', 'unassigned', 'priority'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => onFilterChange(mode)}
              className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === mode
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-hidden">
        <table className="w-full border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-3 py-2 w-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                  checked={allChecked}
                  onChange={(e) => onSelectAll?.(e.target.checked ? allIds : [])}
                />
              </th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Task</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Priority</th>
              <th className="px-3 py-2 text-left">Pts</th>
              <th className="px-3 py-2 text-left">Assignee</th>
              <th className="px-3 py-2 text-left">Due</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {demoTasks.map(task => {
              const isSelected = selectedIds.includes(task.id);
              const isAssigned = !!task.assignee;

              return (
                <tr
                  key={task.id}
                  className={`group transition-all cursor-pointer ${isSelected ? 'bg-indigo-50/60' : 'bg-white hover:bg-slate-50/80'}`}
                  onClick={() => onSelect?.(task.id)}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-4 first:rounded-l-2xl border-y border-l border-slate-100 group-hover:border-slate-200">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                      checked={isSelected}
                      onChange={() => onSelect?.(task.id)}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>

                  {/* ID */}
                  <td className="px-3 py-4 border-y border-slate-100 group-hover:border-slate-200">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">#{task.id}</span>
                      {task.tag && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit">{task.tag}</span>
                      )}
                    </div>
                  </td>

                  {/* Task title + stack */}
                  <td className="px-3 py-4 border-y border-slate-100 group-hover:border-slate-200 max-w-[180px]">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-slate-900 leading-tight line-clamp-2">{task.title}</span>
                      <span className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-tight">{task.stack}</span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-4 border-y border-slate-100 group-hover:border-slate-200">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                      {task.type}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-4 border-y border-slate-100 group-hover:border-slate-200">
                    <PriorityBadge priority={task.priority} />
                  </td>

                  {/* Points */}
                  <td className="px-3 py-4 border-y border-slate-100 group-hover:border-slate-200">
                    <span className="text-[13px] font-black text-slate-700">{task.points}</span>
                    <span className="text-[9px] text-slate-400 font-bold ml-0.5">pts</span>
                  </td>

                  {/* Assignee */}
                  <td className="px-3 py-4 border-y border-slate-100 group-hover:border-slate-200">
                    {isAssigned ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${task.assignee!.color} flex items-center justify-center text-[9px] font-black text-white shrink-0`}>
                          {task.assignee!.initials}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 leading-tight">{task.assignee!.name}</span>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Unassigned</span>
                    )}
                  </td>

                  {/* Due date */}
                  <td className="px-3 py-4 border-y border-slate-100 group-hover:border-slate-200">
                    <div className={`flex items-center gap-1.5 text-[11px] font-black whitespace-nowrap ${task.dueToday ? 'text-rose-500' : task.dueSoon ? 'text-amber-600' : 'text-slate-400'}`}>
                      {(task.dueSoon || task.dueToday) && <Clock size={11} />}
                      {task.dueLabel}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-3 py-4 text-right border-y border-r border-slate-100 group-hover:border-slate-200 last:rounded-r-2xl" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onDemoAssign(task.id)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 ml-auto ${isAssigned
                        ? 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                        : 'bg-white border-emerald-400 text-emerald-600 hover:bg-emerald-50 shadow-sm hover:shadow-emerald-100'
                        }`}
                    >
                      {isAssigned
                        ? <><RotateCcw size={11} /> Reassign</>
                        : <><UserPlus size={11} /> Assign</>}
                    </button>
                  </td>
                </tr>
              );
            })}

            {demoTasks.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">No tasks found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

