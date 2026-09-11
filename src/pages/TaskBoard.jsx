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
