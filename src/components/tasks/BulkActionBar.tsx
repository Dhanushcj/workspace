'use client';

import React, { useState } from 'react';
import { 
  X, MoveHorizontal, UserPlus, 
  AlertCircle, Trash2, CircleCheck,
  ChevronDown
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
}

export const BulkActionBar = ({ selectedIds, onClear }: BulkActionBarProps) => {
  const { statuses, bulkUpdateTasks } = useWorkflowStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleStatusUpdate = async (statusKey: string) => {
    setIsUpdating(true);
    try {
      await bulkUpdateTasks(selectedIds, { status: statusKey });
      onClear();
    } finally {
      setIsUpdating(false);
      setShowStatusMenu(false);
    }
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-300">
      <div className="bg-slate-900 text-white px-6 py-4 rounded-[24px] shadow-2xl flex items-center gap-6 border border-slate-800">
        <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-black">
            {selectedIds.length}
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Items Selected</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest group"
            >
              <MoveHorizontal size={14} className="text-blue-400" />
              Change Status
              <ChevronDown size={14} className={`transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} />
            </button>

            {showStatusMenu && (
              <div className="absolute bottom-full mb-4 left-0 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                {statuses.map(status => (
                  <button
                    key={status.id}
                    onClick={() => handleStatusUpdate(status.key)}
                    className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                    {status.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest">
            <UserPlus size={14} className="text-emerald-400" />
            Assign
          </button>

          <button className="flex items-center gap-2 px-4 py-2 hover:bg-red-900/30 text-red-400 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest">
            <Trash2 size={14} />
            Archive
          </button>
        </div>

        <button 
          onClick={onClear}
          className="ml-4 p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>
      
      {isUpdating && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm rounded-[24px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

