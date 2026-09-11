import React, { useState, useEffect } from 'react';
import TasksLayout from '../components/TasksLayout';
import { FolderOpen, Plus, MoreHorizontal, Calendar, Users, ArrowRight, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkflowStore } from '../store/workflowStore';
import { ProjectsView } from '../components/tasks/ProjectsView';

const TasksProjects = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  
  // Use Zustand store instead of localStorage
  const projects = useWorkflowStore(state => state.projects);
  const fetchProjects = useWorkflowStore(state => state.fetchProjects);
  const createProject = useWorkflowStore(state => state.createProject);
  const members = useWorkflowStore(state => state.members);
  const fetchMembers = useWorkflowStore(state => state.fetchMembers);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', members: [] });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchMembers();
  }, [fetchProjects, fetchMembers, workspaceId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    
    setIsCreating(true);
    try {
      // Assuming createProject expects { name, description, workspaceId }
      await createProject({
        name: newProject.name,
        description: newProject.description,
        members: newProject.members,
        workspaceId: workspaceId || 'forge-india-connect'
      });
      setIsModalOpen(false);
      setNewProject({ name: '', description: '', members: [] });
      // Refetch to get the latest
      fetchProjects();
    } catch (err) {
      console.error('Failed to create project', err);
    } finally {
      setIsCreating(false);
    }
  };

  const setCurrentProject = useWorkflowStore(state => state.setCurrentProject);

  const handleOpenProject = (proj) => {
    // Set the current project in the global store
    setCurrentProject(proj);
    
    // Open the tasks dashboard for this workspace
    // The TasksRouter will automatically direct them to the appropriate role dashboard
    navigate(`/w/${workspaceId || 'forge-india-connect'}/tasks`);
  };

  const headerActions = (
    <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 rounded-full bg-[#1B4FAB] text-white text-sm font-bold shadow-md hover:bg-[#1A3A8F] transition-colors flex items-center gap-2">
      <Plus size={16} strokeWidth={3} />
      New Project
    </button>
  );

  return (
    <TasksLayout
      title="Projects"
      subtitle="WORKSPACE DIRECTORY"
      headerActions={headerActions}
    >
      <ProjectsView 
        projects={projects} 
        isLoading={isCreating} 
        onOpenProject={handleOpenProject}
      />

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Create New Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Name</label>
                <input type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB] transition-all" placeholder="e.g. Mobile App Redesign" required autoFocus disabled={isCreating} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                <textarea rows="3" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB] transition-all resize-none" placeholder="What is this project about?" disabled={isCreating} />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                  <span>Assign Team Members</span>
                  <span className="text-slate-300 font-medium">{newProject.members.length} selected</span>
                </label>
                <div className="max-h-[160px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                  {members.map(user => {
                    const userId = user.id || user._id;
                    const isSelected = newProject.members.includes(userId);
                    return (
                      <label key={userId} className="flex items-center gap-3 p-3 hover:bg-white cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewProject({...newProject, members: [...newProject.members, userId]});
                            } else {
                              setNewProject({...newProject, members: newProject.members.filter(id => id !== userId)});
                            }
                          }}
                          className="w-4 h-4 rounded text-[#1B4FAB] border-slate-300 focus:ring-[#1B4FAB] focus:ring-2 focus:ring-offset-1"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : user.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-700 leading-none">{user.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{user.role}</div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                  {members.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-400">No members found</div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors" disabled={isCreating}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#1B4FAB] text-white text-sm font-bold shadow-md hover:bg-[#1A3A8F] transition-colors" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TasksLayout>
  );
};

export default TasksProjects;

