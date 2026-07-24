'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Monitor, 
  Clock, 
  Briefcase,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../lib/api';

interface MemberLoad {
  id: string;
  name: string;
  role: string;
  initials: string;
  load: number;
  currentTask: string;
  status: 'online' | 'offline' | 'away' | 'dnd';
}

export const WorkloadView = () => {
  const { currentProject, tasks } = useWorkflowStore();
  const [members, setMembers] = useState<MemberLoad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkloadData();
  }, [currentProject, tasks]);

  const loadWorkloadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      const rawUsers = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      if (!Array.isArray(rawUsers)) {
        setMembers([]);
        return;
      }

      const transformed = rawUsers.map((u: any) => {
        const userId = u.id || u._id;
        const userTasks = tasks.filter(t => (t.assigneeId === userId || (t as any)._id === userId));
        const load = Math.min(100, (userTasks.length * 15) + 20);
        
        const tasks_list = [
          'Working on task #22 — Cart API',
          'Reviewing PR #14 — Auth module',
          'Testing build #31 — Checkout flow',
          'In project review meeting',
          'Offline · Returns tomorrow',
          'Away · Last seen 18 min ago'
        ];
        
        const statuses: ('online' | 'offline' | 'away' | 'dnd')[] = ['online', 'away', 'dnd', 'offline'];

        return {
          id: userId,
          name: u.name,
          role: u.role || 'Developer',
          initials: u.name.split(' ').map((n: string) => n[0]).join(''),
          load: load,
          currentTask: tasks_list[Math.floor(Math.random() * tasks_list.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)]
        };
      });
      
      setMembers(transformed);
    } catch (err) {
      console.error('Failed to load workload data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="text-slate-400 font-normal tracking-tight">Calculating team capacity...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-8 pt-2">
        <h1 className="text-[28px] font-medium text-slate-900 tracking-tight">Workload Monitor</h1>
        <p className="text-[14px] text-slate-500 font-normal mt-1">
          Team capacity and task distribution
        </p>
      </div>

      {/* Grid */}
      <div className="px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map(member => (
            <WorkloadCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
};

function WorkloadCard({ member }: { member: MemberLoad }) {
  const getColors = (load: number) => {
    if (load > 85) return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' };
    if (load > 70) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' };
    return { bar: 'bg-blue-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  };

  const colors = getColors(member.load);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
      <div className="flex flex-col gap-5">
        {/* Top Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-[16px] font-normal text-slate-500 uppercase">
              {member.initials}
            </div>
            <div>
              <h4 className="text-[16px] font-medium text-slate-900 leading-tight">{member.name}</h4>
              <p className="text-[12px] text-slate-400 font-normal mt-0.5">{member.role}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-lg text-[12px] font-normal ${colors.bg} ${colors.text}`}>
            {member.load}%
          </div>
        </div>

        {/* Load Bar */}
        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
          <div 
            className={`h-full ${colors.bar} transition-all duration-1000 ease-out`}
            style={{ width: `${member.load}%` }}
          />
        </div>

        {/* Current Activity */}
        <p className="text-[13px] text-slate-600 font-normal truncate">
          {member.currentTask}
        </p>
      </div>
    </div>
  );
}
