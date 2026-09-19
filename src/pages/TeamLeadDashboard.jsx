import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/tasks/Sidebar';
import { SprintSummaryModal } from '../components/tasks/SprintSummaryModal';
import { LeadTaskManagementView } from '../components/tasks/LeadTaskManagementView';
import { LeadCodeReviewView } from '../components/tasks/LeadCodeReviewView';
import { TesterTaskView } from '../components/tasks/TesterTaskView';
import { DevTaskDetailPage } from '../components/tasks/DevTaskDetailPage';
import { SprintBoard } from '../components/tasks/SprintBoard';
import { Flag, ShieldCheck, AlertOctagon, CheckCircle2, LayoutGrid, Code2, FlaskConical } from 'lucide-react';

const StatCard = ({ title, value, subValue, highlight }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between">
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</div>
    <div className="mt-4">
      <div className={`text-3xl font-black ${highlight ? 'text-red-500' : 'text-[#1B4FAB]'}`}>{value}</div>
      <div className="text-[11px] font-semibold text-slate-400 mt-1">{subValue}</div>
    </div>
  </div>
);

const TeamLeadDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Overview';

  const currentProject = useWorkflowStore(state => state.currentProject);
  const allTasks = useWorkflowStore(state => state.allTasks);
  const tasks = useWorkflowStore(state => state.tasks);
  const loading = useWorkflowStore(state => state.isLoading);
  const fetchAllTasks = useWorkflowStore(state => state.fetchAllTasks);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [openDetailTask, setOpenDetailTask] = useState(null);
  const { user } = useAuthStore();

  const projectId = currentProject?.id || currentProject?._id;

  useEffect(() => {
    if (projectId) {
      fetchAllTasks({ projectId });
    }
  }, [projectId]);

  const displayTasks = allTasks.length > 0 ? allTasks : tasks;

  const total = displayTasks.length;
  const done = displayTasks.filter(t => t.status === 'DONE' || t.status?.toLowerCase() === 'completed').length;
  const blocked = displayTasks.filter(t => t.status === 'BLOCKED').length;
  const codeReview = displayTasks.filter(t => t.status === 'CODE_REVIEW').length;
  const todo = displayTasks.filter(t => !t.sprintId || ['null', '', 'undefined'].includes(String(t.sprintId).trim().toLowerCase())).length;
  const completion = total === 0 ? 0 : Math.round((done / total) * 100);
  const activeBlockers = displayTasks.filter(t => t.status === 'BLOCKED');
  const currentSprint = useWorkflowStore.getState().currentSprint;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <div className="p-8 space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Team Lead Dashboard</h1>
              <p className="text-[12px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                {currentProject?.name || 'No Project Selected'}
              </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="SPRINT COMPLETION" value={`${completion}%`} subValue={`${done} of ${total} tasks done`} />
              <StatCard title="CODE REVIEW" value={codeReview} subValue="Awaiting your review" highlight={codeReview > 0} />
              <StatCard title="ACTIVE BLOCKERS" value={blocked} subValue="Needs resolution" highlight={blocked > 0} />
              <StatCard title="BACKLOG ITEMS" value={todo} subValue="Next sprint ready" />
            </div>

            {/* Quick action cards */}
            {codeReview > 0 && (
              <div
                className="p-5 bg-violet-50 border border-violet-200 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-violet-100 transition-all"
                onClick={() => navigate(`?tab=CodeReview`)}
              >
                <div className="flex items-center gap-3">
                  <Code2 size={20} className="text-violet-600" />
                  <div>
                    <p className="text-[14px] font-bold text-violet-800">{codeReview} task{codeReview !== 1 ? 's' : ''} waiting for code review</p>
                    <p className="text-[11px] text-violet-500">Click to review now</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-violet-200 rounded-full flex items-center justify-center text-[14px] font-black text-violet-700">
                  {codeReview}
                </div>
              </div>
            )}

            {/* Split panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Active Blockers */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ACTIVE BLOCKERS</h3>
                </div>
                {activeBlockers.length > 0 ? (
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {activeBlockers.map(task => (
                      <div key={task._id || task.id} className="flex items-start gap-4 p-4 rounded-xl border border-red-100 bg-red-50/30 cursor-pointer hover:bg-red-50" onClick={() => setOpenDetailTask(task)}>
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                          <AlertOctagon size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">
                            {task.displayId || `#${String(task.id || '').slice(-4).toUpperCase()}`} — <span className="font-semibold text-slate-600">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.assignee?.name || 'UNASSIGNED'}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.priority || 'MEDIUM'} PRIORITY</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm font-semibold text-slate-300 italic">No active blockers</p>
                  </div>
                )}
              </div>

              {/* Recent task activity */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">RECENT TASKS</h3>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {displayTasks.slice(0, 8).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer" onClick={() => setOpenDetailTask(task)}>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        task.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                        task.status === 'CODE_REVIEW' ? 'bg-violet-100 text-violet-700' :
                        task.status === 'TESTING' ? 'bg-amber-100 text-amber-700' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{task.status?.replace(/_/g, ' ')}</span>
                      <p className="text-[12px] font-semibold text-slate-700 truncate">{task.title}</p>
                    </div>
                  ))}
                  {displayTasks.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-sm font-semibold text-slate-300 italic">No tasks yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TASK MANAGEMENT ── */}
        {activeTab === 'TaskManagement' && (
          <LeadTaskManagementView onOpenTask={setOpenDetailTask} />
        )}

        {/* ── CODE REVIEW ── */}
        {activeTab === 'CodeReview' && (
          <LeadCodeReviewView onOpenTask={setOpenDetailTask} />
        )}

        {/* ── TEST QUEUE ── */}
        {activeTab === 'TestQueue' && (
          <TesterTaskView onOpenTask={setOpenDetailTask} />
        )}

        {/* ── SPRINT BOARD ── */}
        {activeTab === 'SprintBoard' && (
          <SprintBoard onTaskClick={() => {}} onCreateTask={() => {}} />
        )}

        {/* ── SPRINT SUMMARY ── */}
        {isSummaryModalOpen && currentSprint?.id && (
          <SprintSummaryModal
            isOpen={isSummaryModalOpen}
            onClose={() => setIsSummaryModalOpen(false)}
            sprintId={currentSprint.id}
          />
        )}

        {/* Task detail overlay */}
        {openDetailTask && (
          <DevTaskDetailPage
            task={openDetailTask}
            onClose={() => setOpenDetailTask(null)}
          />
        )}
      </main>
    </div>
  );
};

export default TeamLeadDashboard;
