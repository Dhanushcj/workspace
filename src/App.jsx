import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Cache bust 1
import SuperAdmin from './pages/SuperAdmin';
import AdminDashboard from './pages/AdminDashboard';
import MailApp from './features/mail/MailApp';
import ChatApp from './pages/ChatApp';
import MeetingApp from './pages/MeetingApp';
import DocsApp from './pages/DocsApp';
import ShowApp from './pages/ShowApp';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SheetsApp from './pages/SheetsApp';
import TaskBoard from './pages/TaskBoard';
import TasksRouter from './pages/TasksRouter';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamLeadDashboard from './pages/TeamLeadDashboard';
import TeamMemberDashboard from './pages/TeamMemberDashboard';
import TasksProjects from './pages/TasksProjects';
import TasksSprintPlanner from './pages/TasksSprintPlanner';
import TasksBacklog from './pages/TasksBacklog';
import TasksAssignment from './pages/TasksAssignment';
import TasksBlockers from './pages/TasksBlockers';
import TasksTeam from './pages/TasksTeam';
import TasksWorkload from './pages/TasksWorkload';
import TasksMessages from './pages/TasksMessages';
import TasksSettings from './pages/TasksSettings';
import MeetingHome from './pages/MeetingHome';
import MeetingsTab from './pages/MeetingsTab';
import CalendarTab from './pages/CalendarTab';
import FilesTab from './pages/FilesTab';
import SettingsTab from './pages/SettingsTab';
import WorkspaceSettings from './pages/WorkspaceSettings';
import ChatSettings from './pages/ChatSettings';
import { MeetingAnalytics } from './pages/MeetingAnalytics';
import MeetingSummarizer from './pages/MeetingSummarizer';
import ChatAuth from './pages/ChatAuth';
import ModulePlaceholder from './pages/ModulePlaceholder';
import { ThemeProvider } from './context/ThemeContext';
import NotificationManager from './components/NotificationManager';

function App() {
  useEffect(() => {
    if (!sessionStorage.getItem('app_session_started')) {
      sessionStorage.setItem('app_session_started', 'true');
      try {
        const auth = JSON.parse(localStorage.getItem('auth') || 'null');
        if (auth && auth.role === 'demo') {
          localStorage.removeItem('auth');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      } catch (err) {}
    }
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <NotificationManager />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/w/:workspaceId/admin/*" element={<AdminDashboard />} />
          
          {/* Meeting App Routes */}
          <Route path="/w/:workspaceId/meet" element={<MeetingHome />} />
          <Route path="/w/:workspaceId/meet/settings" element={<SettingsTab />} />
          <Route path="/w/:workspaceId/meet/room/:id" element={<MeetingApp />} />
          <Route path="/w/:workspaceId/meetings" element={<MeetingsTab />} />
          <Route path="/w/:workspaceId/meet/summarize/:meetingId" element={<MeetingSummarizer />} />
          <Route path="/chat/login" element={<ChatAuth />} />
          <Route path="/chat/signup" element={<ChatAuth />} />
          <Route path="/w/:workspaceId/calendar" element={<CalendarTab />} />
          <Route path="/w/:workspaceId/analytics" element={<MeetingAnalytics />} />
          <Route path="/w/:workspaceId/files" element={<FilesTab />} />
          <Route path="/w/:workspaceId/members" element={<ModulePlaceholder name="Team Members" />} />
          <Route path="/w/:workspaceId/settings" element={<WorkspaceSettings />} />
          
          {/* Other Workspace Apps */}
          <Route path="/w/:workspaceId/mail" element={<MailApp />} />
          <Route path="/w/:workspaceId/chat" element={<ChatApp />} />
          <Route path="/w/:workspaceId/chat/settings" element={<ChatSettings />} />
          <Route path="/w/:workspaceId/docs" element={<DocsApp />} />
          <Route path="/w/:workspaceId/show" element={<ShowApp />} />
          <Route path="/w/:workspaceId/sheets" element={<SheetsApp />} />
          <Route path="/w/:workspaceId/tasks" element={<TasksRouter />} />
          <Route path="/w/:workspaceId/tasks/board" element={<TaskBoard />} />
          <Route path="/w/:workspaceId/tasks/projects" element={<TasksProjects />} />
          <Route path="/w/:workspaceId/tasks/planner" element={<TasksSprintPlanner />} />
          <Route path="/w/:workspaceId/tasks/backlog" element={<TasksBacklog />} />
          <Route path="/w/:workspaceId/tasks/assignments" element={<TasksAssignment />} />
          <Route path="/w/:workspaceId/tasks/blockers" element={<TasksBlockers />} />
          <Route path="/w/:workspaceId/tasks/team" element={<TasksTeam />} />
          <Route path="/w/:workspaceId/tasks/workload" element={<TasksWorkload />} />
          <Route path="/w/:workspaceId/tasks/messages" element={<TasksMessages />} />
          <Route path="/w/:workspaceId/tasks/settings" element={<TasksSettings />} />
          <Route path="/w/:workspaceId/dashboard/manager" element={<ManagerDashboard />} />
          <Route path="/w/:workspaceId/dashboard/lead" element={<TeamLeadDashboard />} />
          <Route path="/w/:workspaceId/dashboard/member" element={<TeamMemberDashboard />} />
          
          <Route path="/w/:workspaceId" element={<Navigate to="chat" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
