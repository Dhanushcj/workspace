import React from 'react';
import TasksLayout from '../components/TasksLayout';
import { PRReviewQueueView } from '../components/tasks/PRReviewQueueView';

const TasksPRs = () => {
  return (
    <TasksLayout fullWidth>
      <PRReviewQueueView />
    </TasksLayout>
  );
};

export default TasksPRs;
