

import React from 'react';
import { X, CheckCircle, Search, ListTodo } from 'lucide-react';
import { Task } from '../store/workflowStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelect: (task: Task) => void;
  title?: string;
  subtitle?: string;
}

export const TaskSelectionModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  tasks, 
  onSelect,
  title = "Select Task for PR",
  subtitle = "Choose a task to submit for review"
}) => {
  const [search, setSearch] = React.useState('');

  if (!isOpen) return null;

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-[11px] font-medium text-slate-400 mt-1">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
            {filteredTasks.length > 0 ? filteredTasks.map(task => (
              <button 
                key={task.id}
                onClick={() => onSelect(task)}
                className="w-full p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition-all">
                    <ListTodo size={20} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-800 group-hover:text-blue-700 transition-all">{task.title}</h4>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">#{task.id.slice(-4)} · {task.status}</p>
                  </div>
                </div>
                <CheckCircle size={18} className="text-slate-200 group-hover:text-blue-500 transition-all" />
              </button>
            )) : (
              <div className="py-12 text-center">
                <ListTodo size={40} className="mx-auto text-slate-200 mb-4" />
                <p className="text-sm font-medium text-slate-400">No tasks found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
