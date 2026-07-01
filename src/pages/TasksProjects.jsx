import React, { useState, useEffect } from 'react';
import TasksLayout from '../components/TasksLayout';
import { FolderOpen, Plus, MoreHorizontal, Calendar, Users, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TasksProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    // Load projects from local storage since backend doesn't have a explicit Project model
    const stored = JSON.parse(localStorage.getItem('my_tasks_projects') || '[]');
    if (stored.length === 0) {
      // Create a default if empty
      const defaultProj = {
        id: 'forge-india-connect',
        name: 'AI Interior Design',
        description: 'Q2 Milestone for the AI design integration.',
        members: 4,
        date: new Date().toLocaleDateString()
      };
      localStorage.setItem('my_tasks_projects', JSON.stringify([defaultProj]));
      setProjects([defaultProj]);
    } else {
      setProjects(stored);
    }
  }, []);

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    const id = newProject.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const proj = {
      id,
      name: newProject.name,
      description: newProject.description,
      members: 1,
      date: new Date().toLocaleDateString()
    };
    
    const updated = [proj, ...projects];
    setProjects(updated);
    localStorage.setItem('my_tasks_projects', JSON.stringify(updated));
    
    setIsModalOpen(false);
    setNewProject({ name: '', description: '' });
  };

  const handleOpenProject = (id) => {
    // Update the auth workspace context and navigate
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    auth.workspaceId = id;
    localStorage.setItem('auth', JSON.stringify(auth));
    
    navigate(`/w/${id}/tasks`);
  };

  const headerActions = (
    <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 rounded-full bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors flex items-center gap-2">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col group hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] hover:border-[#0F5A3E]/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0F5A3E]/10 text-[#0F5A3E] flex items-center justify-center">
                <FolderOpen size={24} />
              </div>
              <button className="text-slate-300 hover:text-slate-600 transition-colors p-1">
                <MoreHorizontal size={20} />
              </button>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-2">{proj.name}</h3>
            <p className="text-sm font-medium text-slate-500 mb-6 flex-1">{proj.description}</p>
            
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-6">
              <div className="flex items-center gap-1.5"><Calendar size={14} /> {proj.date}</div>
              <div className="flex items-center gap-1.5"><Users size={14} /> {proj.members} Members</div>
            </div>
            
            <div className="pt-5 border-t border-slate-100 mt-auto">
              <button onClick={() => handleOpenProject(proj.id)} className="w-full py-3 rounded-xl bg-slate-50 text-[#0F5A3E] text-sm font-bold group-hover:bg-[#0F5A3E] group-hover:text-white transition-colors flex items-center justify-center gap-2">
                Open Workspace <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

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
                <input type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5A3E]/20 focus:border-[#0F5A3E] transition-all" placeholder="e.g. Mobile App Redesign" required autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                <textarea rows="3" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5A3E]/20 focus:border-[#0F5A3E] transition-all resize-none" placeholder="What is this project about?" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#0F5A3E] text-white text-sm font-bold shadow-md hover:bg-[#0B4A3F] transition-colors">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TasksLayout>
  );
};

export default TasksProjects;
