import React, { useState, useEffect } from 'react';
import { X, Search, Check, Loader } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

interface AssignMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSuccess?: () => void;
}

export default function AssignMembersModal({ isOpen, onClose, projectId, projectName, onSuccess }: AssignMembersModalProps) {
  const { user } = useAuthStore();
  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchData();
    }
  }, [isOpen, projectId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all workspace members
      const workspaceId = user?.workspaceId || 'forge-india-connect';
      const membersRes = await api.get(`/members/${workspaceId}`);
      const membersData = membersRes.data.map((m: any) => ({
        id: m._id || m.id,
        name: m.name,
        email: m.email,
        avatarUrl: m.avatarUrl,
        role: m.role
      }));
      setAllMembers(membersData);

      // Fetch currently assigned members
      const assignedRes = await api.get(`/projects/${projectId}/members`);
      const assignedIds = new Set(assignedRes.data.map((m: any) => m._id || m.id));
      setSelectedIds(assignedIds as Set<string>);
    } catch (err: any) {
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post(`/projects/${projectId}/members`, {
        userIds: Array.from(selectedIds)
      });
      toast.success('Project members updated');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update members');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredMembers = allMembers.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Assign Members</h2>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">{projectName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm hover:shadow"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search team members..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-[200px] border border-slate-100 rounded-xl divide-y divide-slate-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <Loader className="animate-spin" size={24} />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm font-medium text-slate-400">
                No members found
              </div>
            ) : (
              filteredMembers.map(member => {
                const isSelected = selectedIds.has(member.id);
                return (
                  <div 
                    key={member.id}
                    onClick={() => handleToggle(member.id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className="relative shrink-0">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-200">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{member.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{member.role || 'Member'}</div>
                    </div>
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="text-[11px] font-bold text-slate-400 text-right">
            Selected: {selectedIds.size} members
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-50 flex justify-end gap-3 shrink-0 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving && <Loader className="animate-spin" size={14} />}
            Save Assignment
          </button>
        </div>
      </div>
    </div>
  );
}
