

import React from 'react';
import { 
  CheckCircle2, Play, Edit3, Clock, Plus, ChevronRight 
} from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

interface SprintNavigatorBarProps {
  sprints: any[];
  onNewSprint: () => void;
}

export const SprintNavigatorBar = ({ sprints, onNewSprint }: SprintNavigatorBarProps) => {
  const { currentSprint, setCurrentSprint } = useWorkflowStore();

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'DONE':
        return { 
          icon: <CheckCircle2 size={16} />, 
          bg: 'bg-green-50', 
          text: 'text-green-600',
          label: 'Done',
          iconColor: 'text-green-500'
        };
      case 'ACTIVE':
        return { 
          icon: <Play size={16} />, 
          bg: 'bg-blue-50', 
          text: 'text-blue-600',
          label: 'Active',
          iconColor: 'text-blue-500'
        };
      case 'PLANNING':
        return { 
          icon: <Edit3 size={16} />, 
          bg: 'bg-indigo-50', 
          text: 'text-indigo-600',
          label: 'Planning',
          iconColor: 'text-indigo-500'
        };
      default:
        return { 
          icon: <Clock size={16} />, 
          bg: 'bg-slate-50', 
          text: 'text-slate-600',
          label: 'Future',
          iconColor: 'text-slate-400'
        };
    }
  };

  return (
    <div className="w-full h-[64px] shrink-0 sticky top-0 z-10 bg-white border-b border-slate-100 px-8 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-sm">
      <div className="flex items-center gap-1">
        {sprints.map((sprint, index) => {
          const isSelected = (currentSprint?.id === sprint.id || currentSprint?._id === sprint._id);
          const config = getStatusConfig(sprint.status);
          
          return (
            <React.Fragment key={sprint.id || sprint._id}>
              <button
                onClick={() => setCurrentSprint(sprint)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all whitespace-nowrap group ${
                  isSelected 
                    ? 'bg-slate-50 ring-1 ring-slate-200' 
                    : 'hover:bg-slate-50/50'
                }`}
              >
                <div className={`${config.iconColor} group-hover:scale-110 transition-transform`}>
                  {config.icon}
                </div>
                <span className={`text-[14px] font-medium ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                  {sprint.name}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
                  {config.label}
                </span>
              </button>
              
              {index < sprints.length - 1 && (
                <ChevronRight size={14} className="text-slate-200 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="h-6 w-px bg-slate-100 mx-2 shrink-0" />

      <button 
        onClick={onNewSprint}
        className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all whitespace-nowrap text-[14px] font-medium group"
      >
        <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
        New sprint
      </button>
    </div>
  );
};
