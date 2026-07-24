import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const TasksRouter = () => {
  const { workspaceId } = useParams();
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const userEmail = auth.email?.toLowerCase();

  // Role-based routing logic
  if (userEmail === 'avinash@fic.com' || auth?.role === 'MANAGER') {
    return <Navigate to={`/w/${workspaceId}/dashboard/manager`} replace />;
  }
  
  if (userEmail === 'agila@fic.com' || userEmail === 'akila@fic.com' || auth?.role === 'TEAM_LEAD' || userEmail?.includes('lead')) {
    return <Navigate to={`/w/${workspaceId}/dashboard/lead`} replace />;
  }

  // Default to Developer/Member
  return <Navigate to={`/w/${workspaceId}/dashboard/member`} replace />;
};

export default TasksRouter;
