import React from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';

const TasksRouter = () => {
  const { workspaceId } = useParams();
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const userEmail = auth.email?.toLowerCase();

  const location = useLocation();
  const search = location.search || '';

  // Role-based routing logic
  if (userEmail === 'avinash@fic.com' || auth?.role === 'MANAGER') {
    return <Navigate to={`/w/${workspaceId}/dashboard/manager${search}`} replace />;
  }
  
  if (userEmail === 'agila@fic.com' || userEmail === 'akila@fic.com' || auth?.role === 'TEAM_LEAD' || userEmail?.includes('lead')) {
    return <Navigate to={`/w/${workspaceId}/dashboard/lead${search}`} replace />;
  }

  // Default to Developer/Member
  return <Navigate to={`/w/${workspaceId}/dashboard/member${search}`} replace />;
};

export default TasksRouter;
