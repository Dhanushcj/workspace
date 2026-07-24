import React from 'react';
import TasksLayout from '../components/TasksLayout';
import SprintPlanner from '../components/tasks/SprintPlanner';

const TasksSprintPlanner = () => {
  return (
    <TasksLayout title="Sprint Planner" subtitle="SPRINT MANAGEMENT">
      <SprintPlanner />
    </TasksLayout>
  );
};

export default TasksSprintPlanner;
