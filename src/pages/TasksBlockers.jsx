import React from 'react';
import TasksLayout from '../components/TasksLayout';
import { BlockersView } from '../components/tasks/BlockersView';

const TasksBlockers = () => {
  return (
    <TasksLayout fullWidth>
      <BlockersView />
    </TasksLayout>
  );
};

export default TasksBlockers;
