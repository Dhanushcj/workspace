

import React, { useState } from 'react';
import { X, Rocket, Loader, Shield, CircleCheck, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useWorkflowStore } from '../store/workflowStore';
import toast from 'react-hot-toast';

const validationSchema = z.object({
  name: z.string().min(3, 'Title must be at least 3 characters').max(80),
  sprint: z.string().optional(),
  status: z.string().optional(),
  completion: z.number().min(0).max(100).optional(),
  prs: z.number().min(0).optional(),
  blockers: z.number().min(0).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'Due date is required'),
});

type FormData = z.infer<typeof validationSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (project: any) => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const { user } = useAuthStore();
  const { fetchProjects } = useWorkflowStore();
  const [isLaunching, setIsLaunching] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: '',
      sprint: 'Sprint 1 (Planning)',
      status: 'On track',
      completion: 0,
      prs: 0,
      blockers: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsLaunching(true);
    try {
      const response = await api.post('/projects', {
        name: data.name,
        description: `Initialized with ${data.sprint}`,
        status: 'ACTIVE',
        createdById: user?.id,
        startDate: data.startDate,
        endDate: data.endDate,
        metadata: {
          sprint: data.sprint,
          completion: 0,
          prs: 0,
          blockers: 0
        }
      });

      toast.success('Project launched successfully!');
      await fetchProjects(true);
      if (onSuccess) onSuccess(response.data);
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setIsLaunching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create New Project</h2>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-widest text-indigo-500">Workspace Expansion</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm hover:shadow"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Project name *</label>
              <input 
                {...register('name')}
                placeholder="Enter project name"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
              />
              {errors.name && <p className="mt-1.5 text-[11px] font-bold text-rose-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.name.message}</p>}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Sprint</label>
              <select 
                {...register('sprint')}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer shadow-sm"
              >
                <option value="Sprint 1 (Planning)">Sprint 1 (Planning)</option>
              </select>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Start Date *</label>
                <input 
                  type="date"
                  {...register('startDate')}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                />
                {errors.startDate && <p className="mt-1.5 text-[11px] font-bold text-rose-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.startDate.message}</p>}
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Due Date *</label>
                <input 
                  type="date"
                  {...register('endDate')}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                />
                {errors.endDate && <p className="mt-1.5 text-[11px] font-bold text-rose-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.endDate.message}</p>}
              </div>
            </div>

            {/* Unchangeable fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Status</label>
                <select 
                  disabled
                  {...register('status')}
                  className="w-full px-5 py-3.5 bg-slate-100/60 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 outline-none cursor-not-allowed shadow-sm pointer-events-none opacity-70"
                >
                  <option value="On track">On track</option>
                  <option value="At risk">At risk</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Completion %</label>
                <input 
                  type="number"
                  readOnly
                  {...register('completion', { valueAsNumber: true })}
                  className="w-full px-5 py-3.5 bg-slate-100/60 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 outline-none cursor-not-allowed pointer-events-none opacity-70"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">PRs</label>
                <input 
                  type="number"
                  readOnly
                  {...register('prs', { valueAsNumber: true })}
                  className="w-full px-5 py-3.5 bg-slate-100/60 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 outline-none cursor-not-allowed pointer-events-none opacity-70"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Blockers</label>
                <input 
                  type="number"
                  readOnly
                  {...register('blockers', { valueAsNumber: true })}
                  className="w-full px-5 py-3.5 bg-slate-100/60 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 outline-none cursor-not-allowed pointer-events-none opacity-70"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[12px] font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLaunching || !isValid}
              className={`px-10 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${
                isValid ? 'bg-[#005f43] hover:bg-[#004d36] text-white shadow-emerald-900/10' : 'bg-slate-100 text-slate-400 shadow-none'
              }`}
            >
              {isLaunching ? <Loader className="animate-spin" size={18} /> : <Rocket size={18} />}
              {isLaunching ? 'Launching...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
