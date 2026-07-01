import React, { useState, useEffect } from 'react';
import TasksLayout from '../components/TasksLayout';
import { fetchMembers, addMember } from '../api/tasksApi';
import { Users, Mail, UserPlus, X, Shield, Calendar, Clock } from 'lucide-react';

const TasksTeam = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: 'password123', role: 'Member' });

  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const workspaceId = auth.workspaceId || 'forge-india-connect';

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await fetchMembers(workspaceId);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    try {
      await addMember({ ...newMember, workspaceId });
      setIsModalOpen(false);
      setNewMember({ name: '', email: '', password: 'password123', role: 'Member' });
      loadMembers();
    } catch (err) {
      alert('Failed to add member. Email might already exist.');
    }
  };

  const getInitials = (name) => name?.substring(0, 2).toUpperCase() || '??';

  const headerActions = (
    <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 rounded-xl bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors flex items-center gap-2">
      <UserPlus size={16} />
      Invite Member
    </button>
  );

  return (
    <TasksLayout title="Team Members" subtitle="WORKSPACE ROSTER" headerActions={headerActions}>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F5A3E]/10 text-[#0F5A3E] flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Active Directory</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{members.length} Members</p>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="p-12 flex justify-center text-slate-400 font-bold animate-pulse">Loading directory...</div>
        ) : members.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0F5A3E] text-white flex items-center justify-center text-sm font-bold shadow-sm ring-4 ring-[#0F5A3E]/10">
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{member.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <Mail size={12} /> {member.email}
                      </span>
                      {member.createdAt && (
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          <Calendar size={12} /> Joined {new Date(member.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 ${
                    member.role === 'Manager' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    member.role === 'Team Lead' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <Shield size={12} /> {member.role}
                  </span>
                  
                  <button className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 border border-slate-200 hover:border-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <Users size={32} className="text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-600">No members found</p>
            <p className="text-xs text-slate-400 mt-1">Invite people to your workspace to get started.</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Invite New Member</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input type="text" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5A3E]/20 focus:border-[#0F5A3E] transition-all" placeholder="Jane Doe" required autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                <input type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5A3E]/20 focus:border-[#0F5A3E] transition-all" placeholder="jane@fic.com" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
                  <select value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5A3E]/20 focus:border-[#0F5A3E] bg-white">
                    <option value="Member">Member</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Temp Password</label>
                  <input type="text" value={newMember.password} onChange={e => setNewMember({...newMember, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5A3E]/20 focus:border-[#0F5A3E] bg-slate-50" required />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TasksLayout>
  );
};

export default TasksTeam;
