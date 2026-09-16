import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TasksLayout from '../components/TasksLayout';
import { useWorkflowStore } from '../store/workflowStore';
import { GitBranch, Link2, Server, Globe, Plus, Trash2, ArrowLeft, Loader, LayoutGrid, CheckCircle, X, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const TasksProjectDetail = () => {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  
  const projects = useWorkflowStore(state => state.projects);
  const tasks = useWorkflowStore(state => state.tasks);
  const updateProject = useWorkflowStore(state => state.updateProject);
  const fetchTasks = useWorkflowStore(state => state.fetchTasks);
  const fetchEpics = useWorkflowStore(state => state.fetchEpics);
  const epics = useWorkflowStore(state => state.epics);
  const setCurrentProject = useWorkflowStore(state => state.setCurrentProject);

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [gitRepo, setGitRepo] = useState('');
  const [frontendUrl, setFrontendUrl] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [modules, setModules] = useState<string[]>([]);
  const [newModule, setNewModule] = useState('');
  const [environments, setEnvironments] = useState<{key: string, value: string}[]>([]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  const toggleEpic = (id: string) => {
    const next = new Set(expandedEpics);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedEpics(next);
  };

  useEffect(() => {
    const proj: any = projects.find((p: any) => p.id === projectId || p._id === projectId);
    if (proj) {
      setProject(proj);
      setCurrentProject(proj);
      setGitRepo(proj.gitRepo || '');
      setFrontendUrl(proj.frontendUrl || '');
      setBackendUrl(proj.backendUrl || '');
      setModules(proj.modules || []);
      setEnvironments(proj.environments || []);
      
      // Fetch tasks and epics for this project if not already loaded
      Promise.all([
        fetchTasks({ projectId: proj.id || proj._id }),
        fetchEpics(proj.id || proj._id)
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [projectId, projects, setCurrentProject, fetchTasks]);

  const handleSave = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      await updateProject((project as any).id || (project as any)._id, {
        gitRepo,
        frontendUrl,
        backendUrl,
        modules,
        environments
      });
      toast.success('Project details saved successfully!');
    } catch (err) {
      toast.error('Failed to save project details.');
    } finally {
      setIsSaving(false);
    }
  };

  const addModule = () => {
    if (newModule.trim() && !modules.includes(newModule.trim())) {
      setModules([...modules, newModule.trim()]);
      setNewModule('');
    }
  };

  const removeModule = (mod: string) => {
    setModules(modules.filter(m => m !== mod));
  };

  const addEnvironment = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setEnvironments([...environments, { key: newEnvKey.trim(), value: newEnvValue.trim() }]);
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  const removeEnvironment = (idx: number) => {
    setEnvironments(environments.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <TasksLayout title="Loading..." subtitle="PROJECT DETAILS" headerActions={<></>}>
        <div className="flex items-center justify-center h-full">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </TasksLayout>
    );
  }

  if (!project) {
    return (
      <TasksLayout title="Project Not Found" subtitle="PROJECT DETAILS" headerActions={<></>}>
        <div className="p-8 text-center">
          <p className="text-slate-500">The project you are looking for does not exist.</p>
          <button onClick={() => navigate(`/w/${workspaceId}/tasks/projects`)} className="mt-4 text-indigo-600 font-bold hover:underline">
            Go back to Projects
          </button>
        </div>
      </TasksLayout>
    );
  }

  const projectTasks = tasks.filter(t => t.projectId === ((project as any).id || (project as any)._id)).slice(0, 5);

  const headerActions = (
    <div className="flex gap-3">
      <button 
        onClick={() => navigate(`/w/${workspaceId}/tasks/board`)} 
        className="px-5 py-2 rounded-full border border-slate-200 bg-white text-slate-700 text-[13px] font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
      >
        <LayoutGrid size={16} /> Open Sprint Board
      </button>
      <button 
        onClick={handleSave} 
        disabled={isSaving}
        className="px-5 py-2 rounded-full bg-[#1B4FAB] text-white text-[13px] font-bold shadow-md hover:bg-[#1A3A8F] transition-colors flex items-center gap-2"
      >
        {isSaving ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />} 
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  return (
    <TasksLayout
      title={project.name}
      subtitle="PROJECT DETAILS"
      headerActions={headerActions}
    >
      <div className="p-8 max-w-[1200px] mx-auto space-y-8 pb-20">
        
        {/* Top Header info */}
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate(`/w/${workspaceId}/tasks/projects`)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">{project.name}</h1>
            <p className="text-slate-500 text-sm mt-1">{project.description || 'No description provided.'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            
            {/* Repository & Deployments */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Links & Deployments</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-1.5">
                    <GitBranch size={14} /> Git Repository
                  </label>
                  <input 
                    type="url" 
                    value={gitRepo}
                    onChange={(e) => setGitRepo(e.target.value)}
                    placeholder="https://github.com/org/repo"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-1.5">
                    <Globe size={14} /> Frontend Deployment
                  </label>
                  <input 
                    type="url" 
                    value={frontendUrl}
                    onChange={(e) => setFrontendUrl(e.target.value)}
                    placeholder="https://app.example.com"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-1.5">
                    <Server size={14} /> Backend Deployment
                  </label>
                  <input 
                    type="url" 
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB]"
                  />
                </div>
              </div>
            </div>

            {/* Modules (Epics & Tasks) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <LayoutGrid size={16} /> Modules & Tasks
              </h3>
              
              <div className="space-y-3">
                {epics.map(epic => (
                  <div key={epic.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Module header */}
                    <div 
                      className="flex items-center gap-3 p-4 bg-slate-50/80 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleEpic(epic.id)}
                    >
                      <button className="p-0.5 text-slate-400 rounded flex-shrink-0">
                        {expandedEpics.has(epic.id) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase">Module</span>
                          <h4 className="text-sm font-bold text-slate-900">{epic.name}</h4>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {tasks.filter(t => t.epicId === epic.id || (t as any).epic?._id === epic.id || (t as any).epicId === (epic as any)._id).length} tasks
                      </span>
                    </div>

                    {/* Tasks underneath */}
                    {expandedEpics.has(epic.id) && (
                      <div className="divide-y divide-slate-100 bg-white border-t border-slate-100">
                        {tasks.filter(t => t.epicId === epic.id || (t as any).epic?._id === epic.id || (t as any).epicId === (epic as any)._id).map(task => (
                          <div key={task.id} className="pl-10 pr-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => navigate(`/w/${workspaceId}/tasks/board`)}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase flex-shrink-0">Task</span>
                                <h5 className={`text-[13px] font-semibold group-hover:text-[#1B4FAB] transition-colors ${task.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</h5>
                                {task.estimate && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex-shrink-0">{task.estimate}pt</span>}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                              task.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                              task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                              task.status === 'BLOCKED' ? 'bg-rose-100 text-rose-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>{String(task.status).replace('_', ' ')}</span>
                          </div>
                        ))}
                        {tasks.filter(t => t.epicId === epic.id || (t as any).epic?._id === epic.id || (t as any).epicId === (epic as any)._id).length === 0 && (
                          <div className="pl-10 pr-4 py-4 text-[12px] text-slate-400 italic">No tasks assigned to this module.</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {epics.length === 0 && (
                  <div className="p-8 text-center text-slate-400 italic border border-dashed border-slate-200 rounded-2xl">
                    No modules defined. Use the AI Project Planner to generate modules.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-8">

            {/* Environment Variables */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Server size={16} /> Environment Variables
              </h3>
              
              <div className="space-y-2">
                {environments.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {environments.map((env, idx) => (
                      <div key={idx} className="flex items-center p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 font-mono text-xs font-bold text-slate-700 break-all">{env.key}</div>
                        <div className="flex-1 font-mono text-xs text-slate-500 break-all">{env.value}</div>
                        <button onClick={() => removeEnvironment(idx)} className="ml-3 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-sm text-slate-400 italic">
                    No environment variables set.
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newEnvKey}
                  onChange={(e) => setNewEnvKey(e.target.value)}
                  placeholder="KEY (e.g. NEXT_PUBLIC_API)"
                  className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB]"
                />
                <input 
                  type="text" 
                  value={newEnvValue}
                  onChange={(e) => setNewEnvValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addEnvironment()}
                  placeholder="VALUE"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1B4FAB]/20 focus:border-[#1B4FAB]"
                />
                <button onClick={addEnvironment} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Recent Tasks Snapshot */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle size={16} /> Recent Tasks
                </h3>
                <button onClick={() => navigate(`/w/${workspaceId}/tasks/board`)} className="text-[10px] font-bold text-[#1B4FAB] hover:underline uppercase tracking-widest">
                  View All
                </button>
              </div>
              
              <div className="space-y-2">
                {projectTasks.length > 0 ? (
                  projectTasks.map(task => (
                    <div key={task.id} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/w/${workspaceId}/tasks/board`)}>
                      <div>
                        <div className={`text-sm font-bold group-hover:text-[#1B4FAB] transition-colors ${task.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</div>
                        <div className="text-[10px] font-medium text-slate-400 uppercase mt-0.5">{task.status} • {task.priority} Priority</div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                        {task.assignee?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-slate-400 italic">
                    No active tasks found in this project.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </TasksLayout>
  );
};

export default TasksProjectDetail;
