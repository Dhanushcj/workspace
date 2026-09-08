import React from 'react';
import TasksLayout from '../components/TasksLayout';
import { BacklogView } from '../components/tasks/BacklogView';
import { useNavigate } from 'react-router-dom';

const TasksBacklog = () => {
  const navigate = useNavigate();

  return (
    <TasksLayout fullWidth>
      <BacklogView onNavigate={(tab) => {
        if (tab === 'SprintPlanner') {
          navigate('../planner');
        }
      }} />
    </TasksLayout>
  );
};

export default TasksBacklog;
