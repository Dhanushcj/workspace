import React, { useState, useEffect } from 'react';
import { X, Search, Check, Users, Shield, Loader } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const ProjectMembersModal = ({ isOpen, onClose, projectId, projectName }: ProjectMembersModalProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && projectId) {
      fetchData();
    }
  }, [isOpen, projectId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all users
      // Use the workspace members endpoint instead of /users
      const usersRes = await api.get('/members/forge-india-connect');
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
      setUsers(allUsers);

      // Fetch existing project members
      const membersRes = await api.get(`/projects/${projectId}/members`);
      const members = Array.isArray(membersRes.data) ? membersRes.data : (membersRes.data?.data || []);
      
      const memberIds = new Set<string>();
      members.forEach((m: any) => memberIds.add(m.id || m._id));
      setSelectedUserIds(memberIds);
    } catch (error) {
      console.error('Failed to fetch project members', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post(`/projects/${projectId}/members`, {
        userIds: Array.from(selectedUserIds)
      });
      toast.success('Project members updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Failed to save members', error);
      toast.error(error?.response?.data?.error || 'Failed to update members');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 leading-tight">Assign Team Members</h2>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">Project: {projectName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* User List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-[13px] font-medium">
                No users found.
              </div>
            ) : (
              filteredUsers.map(user => {
                const userId = user.id || user._id;
                const isSelected = selectedUserIds.has(userId);
                
                return (
                  <button
                    key={userId}
                    onClick={() => toggleUser(userId)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? 'border-indigo-200 bg-indigo-50/50 shadow-sm' 
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden bg-white shrink-0 flex items-center justify-center text-[13px] font-bold text-slate-600">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name?.[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-slate-900">{user.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-medium">{user.email}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold tracking-wide uppercase">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'border-slate-300 bg-white text-transparent'
                    }`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-5 py-2 text-[13px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <><Loader size={14} className="animate-spin" /> Saving...</>
            ) : (
              'Save Assignments'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
