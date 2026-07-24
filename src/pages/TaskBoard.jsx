import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TasksLayout from '../components/TasksLayout';
import { SprintBoard } from '../components/tasks/SprintBoard';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../store/authStore';
import { Filter, Plus } from 'lucide-react';

const TaskBoard = () => {
  const fetchTasks = useWorkflowStore(state => state.fetchTasks);
  const fetchMembers = useWorkflowStore(state => state.fetchMembers);
  const fetchProjects = useWorkflowStore(state => state.fetchProjects);
  const currentProject = useWorkflowStore(state => state.currentProject);
  const members = useWorkflowStore(state => state.members);
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  // Modal states
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  
  // Filter states
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);
  
  useEffect(() => {
    fetchMembers();
    if (!currentProject) {
      fetchProjects();
    }
  }, [fetchMembers, fetchProjects, currentProject]);

  useEffect(() => {
    if (currentProject) {
      fetchTasks(currentProject.id || currentProject._id);
    }
  }, [currentProject, fetchTasks]);

  return (
    <TasksLayout fullWidth={true}>
      <div className="flex flex-col gap-8 h-full">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2 uppercase tracking-widest">
              <span>Projects</span>
              <span>/</span>
              <span className="text-[#0056B3]">{currentProject?.name || 'Platform'}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Kanban Board</h2>
          </div>
          <div className="flex items-center gap-3 relative">
             <div className="relative">
               <button 
                 onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                 className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
               >
                  <Filter size={16} /> Filter
               </button>
               
               {isFilterDropdownOpen && (
                 <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50">
                    <div className="space-y-4">
                       <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Search Tasks</label>
                          <input 
                             type="text"
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             placeholder="Search..."
                             className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Quick Filters</label>
                          <div className="flex flex-wrap gap-2">
                             {['all', 'blocked', 'pr'].map(f => (
                               <button 
                                 key={f}
                                 onClick={() => setActiveFilter(f)}
                                 className={`px-2 py-1 rounded-md text-xs font-bold capitalize ${activeFilter === f ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                               >
                                 {f === 'pr' ? 'Open PRs' : f}
                               </button>
                             ))}
                          </div>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Assignee</label>
                          <select 
                             value={filterAssignee || ''} 
                             onChange={(e) => setFilterAssignee(e.target.value || null)}
                             className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                          >
                             <option value="">Any Assignee</option>
                             {members.map((m) => (
                               <option key={m.id || m._id} value={m.name}>{m.name}</option>
                             ))}
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Priority</label>
                          <select 
                             value={filterPriority || ''} 
                             onChange={(e) => setFilterPriority(e.target.value || null)}
                             className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                          >
                             <option value="">Any Priority</option>
                             <option value="LOW">Low</option>
                             <option value="MEDIUM">Medium</option>
                             <option value="HIGH">High</option>
                             <option value="URGENT">Urgent</option>
                          </select>
                       </div>
                    </div>
                 </div>
               )}
             </div>
             
             <button 
               onClick={() => setIsCreateTaskModalOpen(true)}
               className="px-4 py-2 bg-[#1A3A8F] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-800 transition-all flex items-center gap-2"
             >
                <Plus size={16} /> New Task
             </button>
          </div>
        </div>
        <SprintBoard 
          searchQuery={searchQuery}
          activeFilter={activeFilter}
          filterAssignee={filterAssignee}
          filterPriority={filterPriority}
          onTaskClick={(task) => console.log('Task clicked', task)}
          onCreateTask={() => setIsCreateTaskModalOpen(true)}
          onBacklogClick={() => navigate(`/w/${workspaceId}/tasks/backlog`)}
        />
        
        <CreateTaskModal 
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          projectId={currentProject?.id || currentProject?._id || ''}
          onTaskCreated={() => {
            setIsCreateTaskModalOpen(false);
            if (currentProject) {
              fetchTasks(currentProject.id || currentProject._id);
            }
          }}
        />
      </div>
    </TasksLayout>
  );
};

export default TaskBoard;
