'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Target, Settings, Save } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { useToastStore } from '../store/toastStore';
import api from '../lib/api';

interface EditSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: any;
  onSuccess: (updatedSprint: any) => void;
}

export const EditSprintModal = ({ isOpen, onClose, sprint, onSuccess }: EditSprintModalProps) => {
  const { currentProject } = useWorkflowStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    goal: ''
  });

  useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name || '',
        startDate: sprint.startDate ? sprint.startDate.split('T')[0] : '',
        endDate: sprint.endDate ? sprint.endDate.split('T')[0] : '',
        goal: sprint.goal || ''
      });
    }
  }, [sprint]);

  if (!isOpen || !sprint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    setLoading(true);
    try {
      const response = await api.put(`/sprints/${sprint.id || sprint._id}`, {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        goal: formData.goal
      });
      
      const updatedSprint = response.data?.data || response.data;
      addToast({ type: 'SUCCESS', title: 'Sprint Updated', message: 'Sprint details saved successfully.' });
      onSuccess(updatedSprint);
      onClose();
    } catch (error) {
      console.error('Failed to update sprint:', error);
      addToast({ type: 'ERROR', title: 'Update Failed', message: 'Could not update the sprint.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[var(--surface)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg2)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-lg shadow-blue-200/50">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-[var(--text)]">Edit Sprint</h3>
              <p className="text-[12px] text-[var(--text3)]">Modify sprint details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg3)] rounded-lg transition-colors text-[var(--text3)] hover:text-[var(--text)]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[var(--text2)] flex items-center gap-2">
              Sprint Name
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[14px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[var(--text2)] flex items-center gap-2">
              <Target size={14} className="text-[var(--text3)]" /> Sprint Goal
            </label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="What are we trying to achieve?"
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[14px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[var(--text2)] flex items-center gap-2">
                <Calendar size={14} className="text-[var(--text3)]" /> Start Date
              </label>
              <input
                required
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[14px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[var(--text2)] flex items-center gap-2">
                <Calendar size={14} className="text-[var(--text3)]" /> End Date
              </label>
              <input
                required
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[14px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-[var(--accent)] text-white rounded-xl text-[14px] font-semibold hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
