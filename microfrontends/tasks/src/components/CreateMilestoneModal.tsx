

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  X, Target, Calendar, ListChecks, 
  Loader, CircleCheck, Flag, ArrowRight,
  Shield, Info
} from 'lucide-react';
import api from '../lib/api';
import { useWorkflowStore, Task } from '../store/workflowStore';
import { useNotificationStore } from '../store/notificationStore';

const milestoneSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  targetDate: z.string().min(1, 'Target date is required'),
  taskIds: z.array(z.string()).optional()
});

type MilestoneFormData = z.infer<typeof milestoneSchema>;

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string | undefined;
  sprintName: string | undefined;
}

export const CreateMilestoneModal = ({ isOpen, onClose, sprintId, sprintName }: CreateMilestoneModalProps) => {
  const { addNotification } = useNotificationStore();
  const { tasks } = useWorkflowStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      taskIds: []
    }
  });

  const selectedTasks = watch('taskIds') || [];

  useEffect(() => {
    if (isOpen) {
      reset({ taskIds: [] });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: MilestoneFormData) => {
    setIsSubmitting(true);
    try {
      await api.post('/milestones', {
        ...data,
        sprintId
      });

      addNotification({
        title: 'Milestone Set',
        message: `Milestone "${data.name}" has been established for ${new Date(data.targetDate).toLocaleDateString()}`,
        type: 'SUCCESS'
      });
      onClose();
    } catch (err: any) {
      addNotification({
        title: 'Failed',
        message: err.response?.data?.message || 'Failed to create milestone',
        type: 'ERROR'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-sm border border-slate-100">
              <Target size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Create Milestone</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sprintName} • Deliverable Checkpoint</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="space-y-6">
             <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Milestone Name*</label>
                <input 
                  {...register('name')}
                  autoFocus
                  placeholder="e.g. Beta API Release"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                />
                {errors.name && <p className="text-[10px] font-bold text-red-500 mt-2">{errors.name.message}</p>}
             </div>

             <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Description</label>
                <textarea 
                  {...register('description')}
                  rows={2}
                  placeholder="What does this deliverable achieve?"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all resize-none"
                />
             </div>

             <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Target Date*</label>
                <div className="relative">
                   <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="date"
                     {...register('targetDate')}
                     className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                   />
                </div>
                {errors.targetDate && <p className="text-[10px] font-bold text-red-500 mt-2">{errors.targetDate.message}</p>}
             </div>

             <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linked Tasks</label>
                  <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{selectedTasks.length} SELECTED</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                   {tasks.filter(t => t.sprintId === sprintId).map(task => (
                     <label 
                       key={task.id} 
                       className={`
                         flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all
                         ${selectedTasks.includes(task.id) 
                           ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-500/20' 
                           : 'bg-white border-slate-100 text-slate-600 hover:border-teal-200'
                         }
                       `}
                     >
                        <div className="flex items-center gap-3">
                           <input 
                             type="checkbox"
                             className="hidden"
                             value={task.id}
                             checked={selectedTasks.includes(task.id)}
                             onChange={(e) => {
                               const current = selectedTasks;
                               if (e.target.checked) {
                                 setValue('taskIds', [...current, task.id]);
                               } else {
                                 setValue('taskIds', current.filter(id => id !== task.id));
                               }
                             }}
                           />
                           <ListChecks size={16} className={selectedTasks.includes(task.id) ? 'text-white/60' : 'text-slate-300'} />
                           <span className="text-xs font-bold truncate max-w-[300px]">{task.title}</span>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${selectedTasks.includes(task.id) ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                           {task.status}
                        </span>
                     </label>
                   ))}
                </div>
             </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-5 bg-teal-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-teal-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
             {isSubmitting ? <Loader className="animate-spin" size={20} /> : <CircleCheck size={20} />}
             Establish Milestone
          </button>
        </form>
      </div>
    </div>
  );
};

