export const INTEGRATED_DATA = {
  currentProject: {
    id: "proj-forge-001",
    name: "Forge India Ecosystem Integration",
    key: "FORGE",
    description: "Core project for integrating all Forge India modules including real-time sync and cross-dashboard workflow.",
    status: "ACTIVE",
    category: "Engineering",
    workflow: "Agile"
  },
  currentSprint: {
    id: "sprint-q2-001",
    name: "Q2 Core Development",
    goal: "Finalize core communication bridge and security audit.",
    status: "ACTIVE",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  tasks: [
    {
      id: "FI-101",
      title: "Implement Real-time WebSocket Gateway",
      description: "Setup socket.io connection for live updates across all 4 dashboards.",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      type: "FEATURE",
      assigneeId: "user-dev-01",
      projectId: "proj-nexus-001",
      sprintId: "sprint-q2-001",
      createdAt: new Date().toISOString()
    },
    {
      id: "FI-102",
      title: "Security Audit for Auth Module",
      description: "Perform penetration testing on JWT handling and token rotation.",
      status: "TESTING",
      priority: "HIGH",
      type: "TASK",
      assigneeId: "user-tester-01",
      projectId: "proj-nexus-001",
      sprintId: "sprint-q2-001",
      createdAt: new Date().toISOString()
    },
    {
      id: "FI-103",
      title: "Refactor Blocker Resolution Workflow",
      description: "Improve the handoff between Team Lead and Developers when a blocker is resolved.",
      status: "PR_SUBMITTED",
      priority: "MEDIUM",
      type: "REFACTOR",
      assigneeId: "user-lead-01",
      projectId: "proj-nexus-001",
      sprintId: "sprint-q2-001",
      createdAt: new Date().toISOString()
    },
    {
      id: "FI-104",
      title: "Prepare Release Notes for v1.2",
      description: "Consolidate all changes for the upcoming v1.2 release.",
      status: "TO_DO",
      priority: "LOW",
      type: "DOCS",
      assigneeId: "user-mgr-01",
      projectId: "proj-nexus-001",
      sprintId: "sprint-q2-001",
      createdAt: new Date().toISOString()
    },
    {
      id: "FI-105",
      title: "API Documentation for Third-party Integration",
      description: "Complete Swagger documentation for the external partner API.",
      status: "DONE",
      priority: "MEDIUM",
      type: "DOCS",
      assigneeId: "user-dev-01",
      projectId: "proj-nexus-001",
      sprintId: "sprint-q2-001",
      createdAt: new Date().toISOString()
    }
  ],
  users: [
    { id: 'user-lead-01', name: 'Nexus Team Lead', role: 'TEAM_LEAD', email: 'lead@nexus.com' },
    { id: 'user-tester-01', name: 'Nexus Tester', role: 'TESTER', email: 'tester@nexus.com' },
    { id: 'user-mgr-01', name: 'Nexus Manager', role: 'MANAGER', email: 'manager@nexus.com' }
  ]
};

export const applyIntegratedData = () => {
  const storeName = 'forge-workflow';
  const data = {
    state: {
      ...INTEGRATED_DATA,
      isLoading: false
    },
    version: 0
  };
  localStorage.setItem(storeName, JSON.stringify(data));
  localStorage.setItem('forge-demo-mode', 'true');
  console.log('✅ Integrated Data applied & Demo Mode enabled');
};

