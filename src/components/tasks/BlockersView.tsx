'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight,
  History,
  FileText,
  Zap,
  CheckCircle,
  MoreVertical,
  Loader2,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { useWorkflowStore, Task } from '../../store/workflowStore';
import { useToastStore } from '../../store/toastStore';
import api from '../../lib/api';

export const BlockersView = () => {
  const { currentProject, currentSprint, tasks, fetchTasks } = useWorkflowStore();
  const { addToast } = useToastStore();
  
  const [loading, setLoading] = useState(false);
  const [resolvedBlockers, setResolvedBlockers] = useState<any[]>([]);

  useEffect(() => {
    if (!currentProject) return;
    loadResolvedBlockers();
  }, [currentProject]);

  const loadResolvedBlockers = async () => {
    try {
      // Fetch audit logs or specific resolved tasks to show history
      const res = await api.get(`/issues?projectId=${currentProject?.id}&status=IN_PROGRESS`);
      const rawTasks = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const normalized = rawTasks.map((t: any) => ({ ...t, id: t.id || t._id, _id: t._id || t.id }));
      setResolvedBlockers(normalized.slice(0, 3));
    } catch (err) {
      console.error('Failed to load resolved blockers', err);
    }
  };

  const activeBlockers = useMemo(() => {
    return tasks.filter(t => t.status === 'BLOCKED');
  }, [tasks]);

  const stats = useMemo(() => {
    const pointsAtRisk = activeBlockers.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
    return [
      { label: 'Active', value: activeBlockers.length, color: 'text-red-500' },
      { label: 'Points at risk', value: pointsAtRisk, color: 'text-amber-500' },
      { label: 'Avg resolution', value: '4.2h', color: 'text-emerald-500' },
      { label: 'Resolved', value: resolvedBlockers.length, color: 'text-emerald-500' },
    ];
  }, [activeBlockers, resolvedBlockers]);

  const handleResolve = async (taskId: string) => {
    setLoading(true);
    try {
      await api.patch(`/issues/${taskId}`, { status: 'TO_DO' });
      addToast({ title: 'Success', message: 'Blocker marked as resolved', type: 'SUCCESS' });
      await fetchTasks({ projectId: currentProject?.id });
      await loadResolvedBlockers();
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to resolve blocker', type: 'ERROR' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-2">
        <div>
          <h1 className="text-[28px] font-medium text-slate-900 tracking-tight">Blockers</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-1">
            {activeBlockers.length} active · {resolvedBlockers.length} resolved this sprint
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-[#0D5F46] text-white rounded-xl text-[14px] font-medium hover:opacity-90 transition-all shadow-md">
          <FileText size={18} /> Generate Report
        </button>
      </div>

      {/* Stats Bar */}
      <div className="px-8 grid grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <p className="text-[13px] text-slate-400 font-medium mb-3">{stat.label}</p>
            <p className={`text-[36px] font-medium ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Active Blockers Section */}
      <div className="px-8 flex flex-col gap-4">
        <h3 className="text-[12px] font-normal uppercase tracking-widest">Active Blockers</h3>
        <div className="flex flex-col gap-4">
          {activeBlockers.length > 0 ? (
            activeBlockers.map(blocker => (
              <BlockerCard key={blocker.id} blocker={blocker} onResolve={handleResolve} />
            ))
          ) : (
            <div className="py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
              <p className="text-slate-500 font-medium text-[15px]">No active blockers in this sprint!</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolved This Sprint */}
      {resolvedBlockers.length > 0 && (
        <div className="px-8 pb-12 flex flex-col gap-4">
          <h3 className="text-[12px] font-normal uppercase tracking-widest">Resolved This Sprint</h3>
          <div className="flex flex-col gap-3">
            {resolvedBlockers.map(blocker => (
              <div key={blocker.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="text-emerald-500">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <h5 className="text-[14px] font-medium text-slate-700">{blocker.title}</h5>
                    <p className="text-[12px] text-slate-400 mt-0.5">
                      {blocker.assignee?.name || 'Nexus Dev'} · Resolved 2h ago
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                  Resolved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function BlockerCard({ blocker, onResolve }: { blocker: Task, onResolve: (id: string) => void }) {
  const isCritical = blocker.priority === 'CRITICAL' || blocker.priority === 'HIGH';
  
  return (
    <div className={`group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border-l-4 ${isCritical ? 'border-l-red-500' : 'border-l-amber-500'}`}>
      <div className="p-6 space-y-5">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCritical ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
              <Lock size={24} />
            </div>
            <div>
              <h4 className="text-[17px] font-medium text-slate-900 tracking-tight leading-tight">{blocker.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[12px] text-slate-400 font-medium">
                  Task <span className="text-blue-500 hover:underline cursor-pointer">#T-{blocker.id.slice(-2)}</span> · {blocker.assignee?.name || 'Dev Vikram'} · <span className="text-slate-500">4h 05m</span>
                </p>
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-medium uppercase tracking-widest ${isCritical ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
            {blocker.priority?.toLowerCase() || 'high'}
          </span>
        </div>

        {/* Blocker Description Area */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50">
          <p className="text-[14px] text-slate-600 font-medium leading-relaxed">
            {blocker.description || 'No detailed reason provided. Developer cannot proceed with the current integration task.'}
          </p>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onResolve(blocker.id)}
              className="flex items-center gap-2 px-5 py-2 bg-[#0D5F46] text-white rounded-xl text-[13px] font-medium hover:opacity-90 transition-all shadow-sm"
            >
              <CheckCircle2 size={16} /> Mark Resolved
            </button>
            <button className="flex items-center gap-2 px-5 py-2 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-all">
              <MessageSquare size={16} /> Message
            </button>
            <button className="flex items-center gap-2 px-5 py-2 bg-red-50 text-red-600 rounded-xl text-[13px] font-medium hover:bg-red-100 transition-all">
              <Zap size={16} /> Escalate
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={16} />
            <span className="text-[12px] font-medium uppercase tracking-widest">4h 05m open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
