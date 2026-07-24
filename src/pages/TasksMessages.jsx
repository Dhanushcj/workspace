import React from 'react';
import TasksLayout from '../components/TasksLayout';
import { MessagesView } from '../components/tasks/MessagesView';

const TasksMessages = () => {
  return (
    <TasksLayout title="Team Messages" subtitle="TEAM">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden h-[calc(100vh-140px)]">
        <MessagesView />
      </div>
    </TasksLayout>
  );
};

export default TasksMessages;
