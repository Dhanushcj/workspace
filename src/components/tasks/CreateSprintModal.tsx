'use client';

import React, { useState } from 'react';
import { X, Calendar, Target, Sparkles } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useToastStore } from '../../store/toastStore';
import api from '../../lib/api';

interface CreateSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sprintId: string) => void;
}

export const CreateSprintModal = ({ isOpen, onClose, onSuccess }: CreateSprintModalProps) => {
  const { currentProject } = useWorkflowStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: `Sprint ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    setLoading(true);
    try {
      const response = await api.post(`/projects/${currentProject.id}/sprints`, {
        ...formData,
        status: 'PLANNING',
        goal: ''
      });
      
      const sprint = response.data?.data || response.data;
      addToast({ type: 'SUCCESS', title: 'Sprint Created', message: `${formData.name} is ready for planning.` });
      onSuccess(sprint.id || sprint._id);
      onClose();
    } catch (error) {
      console.error('Failed to create sprint:', error);
      addToast({ type: 'ERROR', title: 'Creation Failed', message: 'Could not create the sprint.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-slate-900">Initiate Sprint</h3>
              <p className="text-[12px] text-slate-500">Define your next production cycle</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-slate-700 flex items-center gap-2">
              Sprint Name
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Q4 Sprint 1"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-700 flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" /> Start Date
              </label>
              <input
                required
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-700 flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" /> End Date
              </label>
              <input
                required
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-slate-900 text-white rounded-xl text-[14px] font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  Create Sprint & Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
