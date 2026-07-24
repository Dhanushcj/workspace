

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  MoreVertical,
  Loader2,
  Circle,
  Clock,
  Briefcase,
  Search,
  Filter
} from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import api from '../lib/api';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  isOnline: boolean;
  status: string;
  taskCount: number;
  load: number;
  lastActive?: string;
}

export const TeamView = () => {
  const { currentProject, currentSprint, tasks } = useWorkflowStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, [currentProject, tasks]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      const rawUsers = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      if (!Array.isArray(rawUsers)) {
        setMembers([]);
        return;
      }

      // Transform users with workload data from store tasks
      const transformed = rawUsers.map((u: any) => {
        const userId = u.id || u._id;
        const userTasks = tasks.filter(t => (t.assigneeId === userId || (t as any)._id === userId));
        const load = Math.min(100, (userTasks.length * 15) + 20); // Simulated load logic
        
        // Mocking some statuses for the premium look
        const statuses = [
          'Working on task #22 — Cart API',
          'Reviewing PR #14 — Auth module',
          'Testing build #31 — Checkout flow',
          'Do not disturb — Hotfix in progress',
          'Away — Last seen 18 min ago'
        ];
        
        return {
          id: userId,
          _id: userId,
          name: u.name,
          role: u.role || 'Developer',
          isOnline: Math.random() > 0.3,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          taskCount: userTasks.length,
          load: load,
          lastActive: '2m ago'
        };
      });
      
      setMembers(transformed);
    } catch (err) {
      console.error('Failed to load team data', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return [
      { label: 'Total members', value: members.length },
      { label: 'Online now', value: members.filter(m => m.isOnline).length, color: 'text-emerald-500' },
      { label: 'Active tasks', value: tasks.filter(t => t.status !== 'DONE').length },
      { label: 'Blocked', value: tasks.filter(t => t.status === 'BLOCKED').length, color: 'text-red-500' },
    ];
  }, [members, tasks]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="text-slate-400 font-medium tracking-tight">Syncing team records...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-2">
        <div>
          <h1 className="text-[28px] font-medium text-slate-900 tracking-tight">Team</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-1">
            {currentProject?.name || 'Nexus PM'} · {currentSprint?.name || 'No Active Sprint'} · {members.length} members
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-[#0D5F46] text-white rounded-xl text-[14px] font-medium hover:opacity-90 transition-all shadow-md">
          <UserPlus size={18} /> Invite Member
        </button>
      </div>

      {/* Stats Bar */}
      <div className="px-8 grid grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <p className="text-[13px] text-slate-400 font-medium mb-3">{stat.label}</p>
            <p className={`text-[36px] font-medium ${stat.color || 'text-slate-900'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Member Grid */}
      <div className="px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map(member => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
};

function MemberCard({ member }: { member: TeamMember }) {
  const getLoadColor = (load: number) => {
    if (load > 85) return 'bg-red-500';
    if (load > 70) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
      <div className="flex flex-col gap-5">
        {/* Top Info */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-[18px] font-normal uppercase border-2 border-white shadow-sm">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white ${member.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
            </div>
            <div>
              <h4 className="text-[17px] font-medium text-slate-900 tracking-tight leading-tight">{member.name}</h4>
              <p className="text-[13px] text-slate-400 font-medium mt-0.5">{member.role}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-100 bg-slate-50/50 text-slate-600 rounded-xl text-[12px] font-medium hover:bg-slate-50 transition-all">
            <MessageSquare size={14} /> Message
          </button>
        </div>

        {/* Workload Section */}
        <div className="space-y-3">
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
            <div 
              className={`h-full ${getLoadColor(member.load)} transition-all duration-1000 ease-out`}
              style={{ width: `${member.load}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[13px] font-medium">
            <p className="text-slate-400">
              Tasks: <span className="text-slate-900">{member.taskCount}</span> · Load: <span className="text-slate-900">{member.load}%</span>
            </p>
            <span className="text-slate-400">{member.load}%</span>
          </div>
        </div>

        {/* Current Status */}
        <div className="flex items-center gap-2 pt-2">
          <div className={`w-1.5 h-1.5 rounded-full ${member.isOnline ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          <p className="text-[13px] text-slate-600 font-medium truncate">
            {member.status}
          </p>
        </div>
      </div>
    </div>
  );
}
