import React from 'react';
import TasksLayout from '../components/TasksLayout';
import { WorkloadView } from '../components/tasks/WorkloadView';

const TasksWorkload = () => {
  return (
    <TasksLayout title="Workload View" subtitle="TEAM">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <WorkloadView />
      </div>
    </TasksLayout>
  );
};

export default TasksWorkload;
