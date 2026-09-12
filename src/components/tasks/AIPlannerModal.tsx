import React, { useState, useEffect } from 'react';
import {
  X, Bot, Settings, CheckSquare, Square, RefreshCw, AlertTriangle,
  Layers, Loader, Save, ChevronDown, ChevronRight, CheckCircle2,
  Info, Zap, ShieldAlert, Target, BarChart3, AlertCircle, CheckCheck
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface AIPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSuccess: () => void;
}

const FIBONACCI = [1, 2, 3, 5, 8, 13];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PointBadge({ points, reason }: { points: number; reason?: string }) {
  const isInvalid = !FIBONACCI.includes(Number(points));
  const color = points >= 13 ? 'bg-rose-100 text-rose-700'
    : points >= 8 ? 'bg-amber-100 text-amber-700'
    : points >= 5 ? 'bg-blue-100 text-blue-700'
    : 'bg-emerald-100 text-emerald-700';

  return (
    <span
      className={`text-[10px] font-black px-1.5 py-0.5 rounded cursor-help ${color} ${isInvalid ? 'ring-1 ring-rose-500' : ''}`}
      title={reason ? `${points} pts — ${reason}` : `${points} story points`}
    >
      {points}pt{isInvalid ? ' ⚠' : ''}
    </span>
  );
}

function ReqBadge({ ids }: { ids?: string[] }) {
  if (!ids || ids.length === 0) return null;
  return (
    <span className="flex items-center gap-0.5 flex-wrap">
      {ids.slice(0, 3).map(id => (
        <span key={id} className="text-[9px] font-bold bg-violet-100 text-violet-700 px-1 py-0.5 rounded-sm border border-violet-200">
          {id}
        </span>
      ))}
      {ids.length > 3 && (
        <span className="text-[9px] text-slate-400">+{ids.length - 3}</span>
      )}
    </span>
  );
}

function NeedsSplitWarning() {
  return (
    <span className="text-[9px] font-bold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-0.5">
      <ShieldAlert size={9} /> Split
    </span>
  );
}

// ─── Phase indicators ─────────────────────────────────────────────────────────

const PHASES = [
  { key: 'PASS1', label: 'Extracting Requirements', icon: Target },
  { key: 'PASS2', label: 'Generating Agile Plan', icon: Layers },
  { key: 'PASS3', label: 'Validating Coverage', icon: CheckCheck },
];

function AnalyzingScreen({ currentPhase }: { currentPhase: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-8">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
        <Loader className="text-indigo-600 animate-spin" size={32} />
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-slate-900">AI is analyzing your requirements...</h3>
        <p className="text-sm text-slate-500">Using a 3-pass analysis for accurate, traceable results.</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        {PHASES.map((phase, i) => {
          const Icon = phase.icon;
          const done = i < currentPhase;
          const active = i === currentPhase;
          return (
            <div key={phase.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${active ? 'bg-indigo-50 border-indigo-200' : done ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-indigo-100' : done ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                {done ? <CheckCircle2 size={16} className="text-emerald-600" /> : active ? <Loader size={16} className="text-indigo-600 animate-spin" /> : <Icon size={16} className="text-slate-400" />}
              </div>
              <div>
                <p className={`text-xs font-bold ${active ? 'text-indigo-700' : done ? 'text-emerald-700' : 'text-slate-500'}`}>
                  Pass {i + 1}: {phase.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIPlannerModal({ isOpen, onClose, projectId, projectName, onSuccess }: AIPlannerModalProps) {
  const [phase, setPhase] = useState<'INPUT' | 'SUGGESTION' | 'ANALYZING' | 'REVIEW'>('INPUT');
  const [suggestionText, setSuggestionText] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [analyzingPass, setAnalyzingPass] = useState(0);
  const [requirements, setRequirements] = useState('');
  const [sprintCapacity, setSprintCapacity] = useState(40);

  const [plan, setPlan] = useState<any>(null);

  // Selection state
  const [selectedEpics, setSelectedEpics] = useState<Set<string>>(new Set());
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  // Expanded state for UI
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());

  // Active review tab
  const [reviewTab, setReviewTab] = useState<'PLAN' | 'REQUIREMENTS' | 'VALIDATION'>('PLAN');

  const [isApproving, setIsApproving] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Reset on open, check for existing draft
  useEffect(() => {
    if (isOpen) {
      setPhase('INPUT');
      setRequirements('');
      setPlan(null);
      setReviewTab('PLAN');
      
      // Fetch project to get actual requirements from DB
      api.get(`/projects?workspaceId=forge-india-connect`).then(res => {
        const project = res.data?.find((p: any) => p._id === projectId || p.id === projectId);
        if (project && project.requirements) {
          setRequirements(project.requirements);
        }
      }).catch(console.error);

      // Fetch existing draft plan
      api.get(`/v1/ai/project-plan/${projectId}`).then(res => {
        if (res.data) {
          loadPlan(res.data);
          setPhase('REVIEW');
        }
      }).catch(() => {
        // No existing draft, or auth error — user can still create new plan
      });
    }
  }, [isOpen, projectId]);

  const loadPlan = (draftPlan: any) => {
    // Support both 'epics' (legacy) and 'modules' (new schema)
    const modules = draftPlan.modules || draftPlan.epics || [];
    const normalized = { ...draftPlan, epics: modules, modules };
    setPlan(normalized);

    const epics = new Set<string>();
    const stories = new Set<string>();
    const tasks = new Set<string>();
    const expanded = new Set<string>();

    modules.forEach((e: any) => {
      epics.add(e.id);
      expanded.add(e.id); // Expand all epics by default
      e.stories?.forEach((s: any) => {
        stories.add(s.id);
        s.tasks?.forEach((t: any) => tasks.add(t.id));
      });
    });

    setSelectedEpics(epics);
    setSelectedStories(stories);
    setSelectedTasks(tasks);
    setExpandedEpics(expanded);
  };

  const handleSuggest = async () => {
    if (!requirements.trim()) {
      toast.error('Please enter project requirements');
      return;
    }
    setIsSuggesting(true);
    try {
      const res = await api.post('/v1/ai/project-plan/suggest', {
        projectId,
        requirements
      });
      setSuggestionText(res.data.suggestion);
      setPhase('SUGGESTION');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate suggestion');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleConfirmSuggestion = async () => {
    if (!requirements.trim()) {
      toast.error('Please enter project requirements');
      return;
    }

    setPhase('ANALYZING');
    setAnalyzingPass(0);

    // Simulate pass progression (real passes run server-side)
    const passTimer = setInterval(() => {
      setAnalyzingPass(p => (p < 2 ? p + 1 : p));
    }, 8000);

    // Safety timeout: 3 minutes for 3-pass analysis
    const timeout = setTimeout(() => {
      clearInterval(passTimer);
      setPhase('INPUT');
      toast.error('Request timed out. The AI may be slow — please try again.', { duration: 6000 });
    }, 180000);

    try {
      const res = await api.post('/v1/ai/project-plan/analyze', {
        projectId,
        requirements,
        sprintCapacity,
        confirmedSuggestion: suggestionText
      });
      clearTimeout(timeout);
      clearInterval(passTimer);
      loadPlan(res.data);
      setPhase('REVIEW');
      toast.success('✅ AI Plan generated! Review requirements, plan, and validation below.');
    } catch (err: any) {
      clearTimeout(timeout);
      clearInterval(passTimer);
      let serverMsg = '';
      if (typeof err.response?.data === 'string') {
        // Handle HTML error pages or plain text
        serverMsg = err.response.data;
      } else {
        serverMsg = err.response?.data?.message || err.response?.data?.error || '';
      }
      
      let userMsg = 'AI Analysis failed. Please try again.';
      if (serverMsg.includes('GEMINI_API_KEY')) {
        userMsg = '⚠️ GEMINI_API_KEY is not set on the server. Add it in Render → Environment Variables.';
      } else if (serverMsg.includes('quota') || err.response?.status === 429) {
        userMsg = 'AI quota exceeded. Please wait a moment and try again.';
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        userMsg = 'Session expired. Please refresh the page and log in again.';
      } else if (serverMsg.includes('extract')) {
        userMsg = serverMsg + '\n\nTip: Make sure your requirements describe features clearly.';
      } else if (serverMsg) {
        // Show the full server message even if it is long, so the user sees the real AI error
        userMsg = serverMsg;
      } else if (err.message) {
        userMsg = err.message;
      }
      toast.error(userMsg, { duration: 7000 });
      setPhase('INPUT');
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await api.post('/v1/ai/project-plan/approve', {
        planId: plan._id,
        approvedEpicIds: Array.from(selectedEpics),
        approvedStoryIds: Array.from(selectedStories),
        approvedTaskIds: Array.from(selectedTasks)
      });
      toast.success('✅ Plan approved! Tasks and sprints created in Sprint Board.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Approval failed';
      toast.error(msg);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRegenerate = async (id: string, type: 'TASK' | 'STORY', context: any) => {
    const instruction = prompt(`Regenerate ${type}. Any specific instructions? (leave blank to improve automatically)`);
    if (instruction === null) return;

    setRegeneratingId(id);
    try {
      const res = await api.post('/v1/ai/project-plan/regenerate', {
        itemId: id,
        itemType: type,
        context,
        promptAddition: instruction || 'Improve this item with better detail and correct Fibonacci story points'
      });

      const newPlan = { ...plan };
      const modules = [...(newPlan.modules || [])];

      if (type === 'STORY') {
        for (const e of modules) {
          const idx = e.stories.findIndex((s: any) => s.id === id);
          if (idx !== -1) { e.stories[idx] = res.data; break; }
        }
      } else {
        for (const e of modules) {
          for (const s of e.stories) {
            const idx = s.tasks.findIndex((t: any) => t.id === id);
            if (idx !== -1) { s.tasks[idx] = res.data; break; }
          }
        }
      }

      newPlan.modules = modules;
      newPlan.epics = modules;
      setPlan(newPlan);
      toast.success(`${type} regenerated`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Regeneration failed');
    } finally {
      setRegeneratingId(null);
    }
  };

  // ── Selection helpers ───────────────────────────────────────────────────────

  const toggleEpic = (epicId: string) => {
    const next = new Set(selectedEpics);
    const epic = (plan.epics || plan.modules || []).find((e: any) => e.id === epicId);
    if (!epic) return;
    const nextStories = new Set(selectedStories);
    const nextTasks = new Set(selectedTasks);
    if (next.has(epicId)) {
      next.delete(epicId);
      epic.stories?.forEach((s: any) => { nextStories.delete(s.id); s.tasks?.forEach((t: any) => nextTasks.delete(t.id)); });
    } else {
      next.add(epicId);
      epic.stories?.forEach((s: any) => { nextStories.add(s.id); s.tasks?.forEach((t: any) => nextTasks.add(t.id)); });
    }
    setSelectedEpics(next); setSelectedStories(nextStories); setSelectedTasks(nextTasks);
  };

  const toggleStory = (storyId: string) => {
    const next = new Set(selectedStories);
    const nextTasks = new Set(selectedTasks);
    let targetStory: any = null;
    (plan.epics || plan.modules || []).forEach((e: any) => {
      const s = e.stories?.find((st: any) => st.id === storyId);
      if (s) targetStory = s;
    });
    if (!targetStory) return;
    if (next.has(storyId)) {
      next.delete(storyId); targetStory.tasks?.forEach((t: any) => nextTasks.delete(t.id));
    } else {
      next.add(storyId); targetStory.tasks?.forEach((t: any) => nextTasks.add(t.id));
    }
    setSelectedStories(next); setSelectedTasks(nextTasks);
  };

  const toggleTask = (taskId: string) => {
    const next = new Set(selectedTasks);
    if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
    setSelectedTasks(next);
  };

  const toggleExpand = (id: string, setFn: any, currentSet: Set<string>) => {
    const next = new Set(currentSet);
    if (next.has(id)) next.delete(id); else next.add(id);
    setFn(next);
  };

  if (!isOpen) return null;

  const modules = plan ? (plan.epics || plan.modules || []) : [];
  const validation = plan?.validation || {};
  const projectAnalysis = plan?.projectAnalysis || {};
  const requirements_extracted = projectAnalysis.requirements || [];
  const totalPoints = (plan?.sprints || []).reduce((a: number, b: any) => a + (b.totalStoryPoints || 0), 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">AI Project Planner</h2>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{projectName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-[#FAFAFA]">

          {/* ── INPUT PHASE ── */}
          {phase === 'INPUT' && (
            <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
              <div className="mb-6 text-center space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">What are we building?</h3>
                <p className="text-slate-500 text-sm max-w-lg mx-auto">
                  Describe your project requirements in detail. The AI will run a <strong>3-pass analysis</strong>:
                  extract requirements → generate traceable Agile plan → validate coverage.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                    Project Requirements
                    <span className="ml-2 text-indigo-500 normal-case font-normal">(be specific — list features, roles, and rules)</span>
                  </label>
                  <textarea
                    value={requirements}
                    onChange={e => setRequirements(e.target.value)}
                    placeholder="Example:

Build a College ERP system.

Roles: Student, Faculty, Admin

Student features:
- Student registration
- Student login
- View attendance
- View exam results
- View fee details

Faculty features:
- Faculty login
- Mark attendance
- Enter marks
- Schedule exams

Admin features:
- Admin login
- Manage students
- Manage courses
- Generate reports"
                    className="w-full h-72 p-4 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none shadow-sm leading-relaxed font-mono"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-slate-400">{requirements.length} characters</p>
                    {requirements.length > 0 && requirements.length < 100 && (
                      <p className="text-[11px] text-amber-500 flex items-center gap-1">
                        <AlertTriangle size={11} /> More detail = better plan quality
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                    <Settings size={14} /> Planning Configuration
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Sprint Capacity (Story Points)</label>
                      <input
                        type="number"
                        value={sprintCapacity}
                        onChange={e => setSprintCapacity(parseInt(e.target.value) || 40)}
                        min={10} max={200}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none"
                      />
                    </div>
                    <div className="flex-[2]">
                      <p className="text-xs text-slate-500 italic mt-6">
                        How many story points your team can deliver per sprint (e.g. 40 pts ≈ 2-week sprint for 4-person team).
                      </p>
                    </div>
                  </div>
                </div>

                {/* How it works */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                  <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap size={12}/> How the AI analyzes your requirements</p>
                  <div className="grid grid-cols-3 gap-3">
                    {PHASES.map((p, i) => {
                      const Icon = p.icon;
                      return (
                        <div key={p.key} className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-lg bg-white border border-indigo-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon size={12} className="text-indigo-600" />
                          </div>
                          <p className="text-[11px] text-indigo-700"><strong>Pass {i+1}:</strong> {p.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSuggest}
                    disabled={!requirements.trim() || isSuggesting}
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    {isSuggesting ? <Loader size={18} className="animate-spin" /> : <Bot size={18} />} 
                    {isSuggesting ? 'Analyzing...' : 'Suggest Project Flow'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SUGGESTION PHASE ── */}
          {phase === 'SUGGESTION' && (
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full flex flex-col">
              <div className="mb-6 text-center space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Review Suggested Project Flow</h3>
                <p className="text-slate-500 text-sm max-w-lg mx-auto">
                  The AI has proposed the following topics, features, and sidebar tabs based on your requirements. 
                  You can edit this outline before generating the detailed development tasks.
                </p>
              </div>
              <div className="flex-1 flex flex-col mb-4">
                 <textarea
                    value={suggestionText}
                    onChange={e => setSuggestionText(e.target.value)}
                    className="w-full flex-1 min-h-[400px] p-5 bg-white border border-indigo-200 rounded-2xl text-sm text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none shadow-sm leading-relaxed font-mono"
                  />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  onClick={() => setPhase('INPUT')}
                  className="px-6 py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl text-[13px] font-bold transition-all"
                >
                  Back to Requirements
                </button>
                <button
                  onClick={handleConfirmSuggestion}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 size={18} /> Confirm & Generate Tasks
                </button>
              </div>
            </div>
          )}

          {/* ── ANALYZING PHASE ── */}
          {phase === 'ANALYZING' && <AnalyzingScreen currentPhase={analyzingPass} />}

          {/* ── REVIEW PHASE ── */}
          {phase === 'REVIEW' && plan && (
            <div className="flex-1 flex overflow-hidden">

              {/* Left Sidebar */}
              <div className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-slate-100 flex-shrink-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Plan Summary</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-3">{plan.projectSummary}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Modules</p>
                      <p className="text-base font-black text-slate-800">{modules.length}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Total Pts</p>
                      <p className="text-base font-black text-indigo-600">{totalPoints}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Requirements</p>
                      <p className="text-base font-black text-slate-800">{requirements_extracted.length}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Coverage</p>
                      <p className={`text-base font-black ${(validation.requirementCoverage || 0) >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {validation.requirementCoverage || 0}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sprints list */}
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Suggested Sprints</p>
                  <div className="space-y-2">
                    {(plan.sprints || []).map((sprint: any, i: number) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-3 bg-white">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-[12px] font-bold text-slate-800">{sprint.name}</h4>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sprint.totalStoryPoints > sprintCapacity ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {sprint.totalStoryPoints}pt
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mb-2">{sprint.goal}</p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${sprint.totalStoryPoints > sprintCapacity ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (sprint.totalStoryPoints / sprintCapacity) * 100)}%` }}
                          />
                        </div>
                        {sprint.totalStoryPoints > sprintCapacity && (
                          <p className="text-[9px] text-rose-500 mt-1">⚠ Exceeds capacity ({sprintCapacity}pt)</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Panel */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white flex-shrink-0">
                  {/* Tabs */}
                  <div className="flex items-center gap-1">
                    {(['PLAN', 'REQUIREMENTS', 'VALIDATION'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setReviewTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${reviewTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                        {tab === 'PLAN' && '🗂 Plan'}
                        {tab === 'REQUIREMENTS' && `📋 Requirements (${requirements_extracted.length})`}
                        {tab === 'VALIDATION' && `✓ Validation`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setPhase('INPUT'); }} className="text-[12px] font-bold text-slate-500 hover:text-slate-800 transition-all px-3 py-1.5 hover:bg-slate-100 rounded-lg">
                      Start Over
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isApproving || selectedStories.size === 0}
                      className="px-5 py-2 bg-[#0D5F46] hover:bg-[#0A4D39] disabled:opacity-50 text-white rounded-xl text-[12px] font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/10 transition-all"
                    >
                      {isApproving ? <Loader className="animate-spin" size={13} /> : <Save size={13} />}
                      {isApproving ? 'Saving...' : `Approve & Create (${selectedStories.size} stories, ${selectedTasks.size} tasks)`}
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">

                  {/* ── PLAN TAB ── */}
                  {reviewTab === 'PLAN' && (
                    <div className="p-5 space-y-3 max-w-4xl">
                      {modules.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          <AlertCircle size={32} className="mx-auto mb-2" />
                          <p className="font-bold">No modules generated</p>
                          <p className="text-sm">Try re-analyzing with more detailed requirements</p>
                        </div>
                      )}
                      {modules.map((epic: any) => (
                        <div key={epic.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          {/* Module header */}
                          <div className="flex items-center gap-3 p-4 bg-slate-50/80 border-b border-slate-100">
                            <button
                              onClick={() => toggleEpic(epic.id)}
                              className={`text-slate-400 hover:text-indigo-600 transition-all flex-shrink-0 ${selectedEpics.has(epic.id) ? 'text-indigo-600' : ''}`}
                            >
                              {selectedEpics.has(epic.id) ? <CheckSquare size={17} /> : <Square size={17} />}
                            </button>
                            <button onClick={() => toggleExpand(epic.id, setExpandedEpics, expandedEpics)} className="p-0.5 text-slate-400 hover:bg-slate-200 rounded flex-shrink-0">
                              {expandedEpics.has(epic.id) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </button>
                            <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(epic.id, setExpandedEpics, expandedEpics)}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase">Module</span>
                                <h4 className="text-sm font-bold text-slate-900">{epic.name}</h4>
                                <ReqBadge ids={epic.requirementIds} />
                              </div>
                              {epic.description && (
                                <p className="text-[11px] text-slate-500 mt-0.5">{epic.description}</p>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">{epic.stories?.length || 0} stories</span>
                          </div>

                          {/* Stories */}
                          {expandedEpics.has(epic.id) && (
                            <div className="divide-y divide-slate-100">
                              {(epic.stories || []).map((story: any) => (
                                <div key={story.id} className="pl-5">
                                  <div className="flex items-start gap-3 p-3 hover:bg-slate-50 transition-all group">
                                    <button
                                      onClick={() => toggleStory(story.id)}
                                      className={`mt-0.5 flex-shrink-0 text-slate-300 hover:text-indigo-500 transition-all ${selectedStories.has(story.id) ? 'text-indigo-500' : ''}`}
                                    >
                                      {selectedStories.has(story.id) ? <CheckSquare size={15} /> : <Square size={15} />}
                                    </button>
                                    <button onClick={() => toggleExpand(story.id, setExpandedStories, expandedStories)} className="mt-0.5 flex-shrink-0 text-slate-300 hover:bg-slate-200 rounded">
                                      {expandedStories.has(story.id) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                          <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase flex-shrink-0">Story</span>
                                          <h5 className="text-[13px] font-semibold text-slate-800">{story.title}</h5>
                                          {story.needsSplit && <NeedsSplitWarning />}
                                          <ReqBadge ids={story.requirementIds} />
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                          <PointBadge points={story.storyPoints} reason={story.estimateReason} />
                                          <button
                                            onClick={() => handleRegenerate(story.id, 'STORY', story)}
                                            disabled={regeneratingId === story.id}
                                            className="text-[10px] flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 disabled:opacity-50"
                                          >
                                            <RefreshCw size={9} className={regeneratingId === story.id ? 'animate-spin' : ''} /> Regen
                                          </button>
                                        </div>
                                        <PointBadge points={story.storyPoints} reason={story.estimateReason} />
                                      </div>
                                      <p className="text-[11px] text-slate-500 mt-1 italic">"{story.userStory}"</p>
                                    </div>
                                  </div>

                                  {/* Story expanded: acceptance criteria + tasks */}
                                  {expandedStories.has(story.id) && (
                                    <div className="pl-12 pr-4 pb-3 space-y-2">
                                      {(story.acceptanceCriteria || []).length > 0 && (
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Acceptance Criteria</p>
                                          <ul className="text-[11px] text-slate-600 list-none space-y-0.5">
                                            {story.acceptanceCriteria.map((c: string, idx: number) => (
                                              <li key={idx} className="flex items-start gap-1.5">
                                                <CheckCircle2 size={10} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                                {c}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {story.estimateReason && (
                                        <div className="bg-indigo-50/60 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                                          <p className="text-[10px] text-indigo-700">
                                            <strong>Why {story.storyPoints}pt:</strong> {story.estimateReason}
                                          </p>
                                        </div>
                                      )}

                                      {/* Tasks */}
                                      <div className="grid gap-3 pt-2">
                                        {(story.tasks || []).map((task: any) => (
                                          <div key={task.id} className="flex gap-3 p-4 bg-white border border-slate-200 shadow-sm rounded-xl hover:border-indigo-200 transition-all relative group">
                                            {/* Selection Checkbox & Sequence */}
                                            <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-0.5">
                                              <button onClick={() => toggleTask(task.id)} className={`text-slate-300 hover:text-indigo-400 transition-all ${selectedTasks.has(task.id) ? 'text-indigo-500' : ''}`}>
                                                {selectedTasks.has(task.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                              </button>
                                              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                #{task.sequence || '—'}
                                              </div>
                                            </div>

                                            {/* Task Details */}
                                            <div className="flex-1 min-w-0 space-y-3">
                                              {/* Title & Actions */}
                                              <div className="flex items-start justify-between gap-4">
                                                <h6 className="text-[14px] font-bold text-slate-800 leading-snug">{task.title}</h6>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                  <ReqBadge ids={task.requirementIds} />
                                                  <button
                                                    onClick={() => handleRegenerate(task.id, 'TASK', task)}
                                                    disabled={regeneratingId === task.id}
                                                    className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                  >
                                                    <RefreshCw size={11} className={regeneratingId === task.id ? 'animate-spin' : ''} />
                                                    Regen
                                                  </button>
                                                </div>
                                              </div>

                                              {/* Junior Dev Fields */}
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Simple Description</p>
                                                  <p className="text-[12px] text-slate-700">{task.description || '—'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected Result</p>
                                                  <p className="text-[12px] text-slate-700">{task.expectedResult || '—'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Why</p>
                                                  <p className="text-[12px] text-slate-700 italic">{task.why || '—'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Depends On</p>
                                                  <p className="text-[12px] text-slate-700">{task.dependency || 'None'}</p>
                                                </div>
                                              </div>

                                              {/* Tags */}
                                              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                                                <div className="flex items-center gap-1.5">
                                                  <p className="text-[10px] text-slate-500">Points:</p>
                                                  <PointBadge points={task.storyPoints} reason={task.estimateReason} />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                  <p className="text-[10px] text-slate-500">Priority:</p>
                                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                    task.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                                                    task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-700'
                                                  }`}>{task.priority}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                  <p className="text-[10px] text-slate-500">Category:</p>
                                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                    task.category === 'FRONTEND' ? 'bg-sky-100 text-sky-700'
                                                    : task.category === 'BACKEND' ? 'bg-orange-100 text-orange-700'
                                                    : task.category === 'DATABASE' ? 'bg-green-100 text-green-700'
                                                    : task.category === 'TESTING' ? 'bg-pink-100 text-pink-700'
                                                    : task.category === 'SECURITY' ? 'bg-red-100 text-red-700'
                                                    : 'bg-slate-100 text-slate-600'
                                                  }`}>{task.category}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── REQUIREMENTS TAB ── */}
                  {reviewTab === 'REQUIREMENTS' && (
                    <div className="p-5 space-y-4 max-w-3xl">
                      {/* Project objective */}
                      {projectAnalysis.objective && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Target size={10} /> Project Objective</p>
                          <p className="text-sm text-indigo-900 font-medium">{projectAnalysis.objective}</p>
                        </div>
                      )}

                      {/* Actors */}
                      {(projectAnalysis.actors || []).length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Identified Actors / Roles</p>
                          <div className="flex flex-wrap gap-2">
                            {projectAnalysis.actors.map((actor: string, i: number) => (
                              <span key={i} className="text-[12px] font-semibold bg-violet-100 text-violet-700 px-3 py-1 rounded-full border border-violet-200">
                                {actor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Requirements list */}
                      {requirements_extracted.length > 0 ? (
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Extracted Requirements ({requirements_extracted.length})
                          </p>
                          <div className="space-y-2">
                            {requirements_extracted.map((req: any) => {
                              const covered = (plan.modules || plan.epics || []).some((m: any) =>
                                (m.requirementIds || []).includes(req.id) ||
                                (m.stories || []).some((s: any) => (s.requirementIds || []).includes(req.id))
                              );
                              return (
                                <div key={req.id} className={`flex items-start gap-3 p-3 rounded-xl border ${covered ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
                                  <span className="text-[10px] font-black bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">{req.id}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[13px] font-semibold text-slate-800">{req.title}</p>
                                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded uppercase ${
                                        req.priority === 'HIGH' ? 'bg-rose-100 text-rose-600'
                                        : req.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-600'
                                        : 'bg-slate-100 text-slate-500'
                                      }`}>{req.priority}</span>
                                      <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1 py-0.5 rounded uppercase">{req.type}</span>
                                    </div>
                                    {req.description && <p className="text-[11px] text-slate-500 mt-0.5">{req.description}</p>}
                                  </div>
                                  <div className="flex-shrink-0">
                                    {covered
                                      ? <span title="Covered in plan"><CheckCircle2 size={14} className="text-emerald-500" /></span>
                                      : <span title="Not covered in plan"><AlertTriangle size={14} className="text-amber-500" /></span>
                                    }
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <Info size={24} className="mx-auto mb-2" />
                          <p className="text-sm">No extracted requirements available. Try re-analyzing.</p>
                        </div>
                      )}

                      {/* Assumptions */}
                      {(plan.assumptions || projectAnalysis.assumptions || []).length > 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1"><AlertTriangle size={10}/> AI Assumptions</p>
                          <ul className="text-[12px] text-slate-700 space-y-1">
                            {(plan.assumptions || projectAnalysis.assumptions).map((a: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">•</span>{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Clarifications */}
                      {(plan.clarifications || projectAnalysis.clarifications || []).length > 0 && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1"><CheckCircle2 size={10}/> Needs Clarification</p>
                          <ul className="text-[12px] text-slate-700 space-y-1">
                            {(plan.clarifications || projectAnalysis.clarifications).map((c: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5"><span className="text-blue-500 mt-0.5">?</span>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── VALIDATION TAB ── */}
                  {reviewTab === 'VALIDATION' && (
                    <div className="p-5 space-y-4 max-w-3xl">
                      {/* Coverage score */}
                      <div className={`rounded-xl p-5 border ${(validation.requirementCoverage || 0) >= 90 ? 'bg-emerald-50 border-emerald-200' : (validation.requirementCoverage || 0) >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Requirement Coverage</p>
                            <p className={`text-4xl font-black mt-1 ${(validation.requirementCoverage || 0) >= 90 ? 'text-emerald-700' : (validation.requirementCoverage || 0) >= 70 ? 'text-amber-700' : 'text-rose-700'}`}>
                              {validation.requirementCoverage || 0}%
                            </p>
                          </div>
                          <BarChart3 size={40} className={`${(validation.requirementCoverage || 0) >= 90 ? 'text-emerald-400' : 'text-amber-400'}`} />
                        </div>
                        <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${(validation.requirementCoverage || 0) >= 90 ? 'bg-emerald-500' : (validation.requirementCoverage || 0) >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${validation.requirementCoverage || 0}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-600 mt-2">
                          {(validation.requirementCoverage || 0) >= 90
                            ? '✓ All requirements have implementation plans'
                            : '⚠ Some requirements may not have complete coverage'
                          }
                        </p>
                      </div>

                      {/* Invalid story points */}
                      {(validation.invalidStoryPoints || []).length > 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Story Points Repaired (non-Fibonacci → nearest valid)</p>
                          <ul className="text-[12px] text-slate-700 space-y-1">
                            {validation.invalidStoryPoints.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5"><span className="text-amber-500">→</span>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <p className="text-[12px] text-emerald-700 font-semibold">All story points are valid Fibonacci values (1, 2, 3, 5, 8, 13)</p>
                        </div>
                      )}

                      {/* Oversized stories */}
                      {(validation.oversizedStories || []).length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest mb-2">
                            <ShieldAlert size={10} className="inline mr-1" />
                            Oversized Stories (13pt — consider splitting)
                          </p>
                          <ul className="text-[12px] text-slate-700 space-y-1">
                            {validation.oversizedStories.map((id: string, i: number) => {
                              // Find story title
                              let storyTitle = id;
                              for (const m of modules) {
                                const s = m.stories?.find((st: any) => st.id === id);
                                if (s) { storyTitle = s.title; break; }
                              }
                              return (
                                <li key={i} className="flex items-start gap-1.5">
                                  <ShieldAlert size={11} className="text-rose-500 mt-0.5" />
                                  <span>{storyTitle} <span className="text-slate-400">({id})</span></span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Unrelated modules */}
                      {(validation.unrelatedItems || []).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2">Possible Unrelated Modules (not linked to any requirement)</p>
                          <ul className="text-[12px] text-slate-700 space-y-1">
                            {validation.unrelatedItems.map((name: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5"><AlertTriangle size={11} className="text-red-500 mt-0.5" />{name}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Duplicates */}
                      {(validation.duplicates || []).length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Potential Duplicates (similar to existing tasks)</p>
                          <ul className="text-[12px] text-slate-700 space-y-2">
                            {validation.duplicates.map((d: any, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <AlertTriangle size={11} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                <span><strong>{d.newTitle}</strong> ≈ existing: <em>"{d.existingTitle}"</em></span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-[11px] text-amber-600 mt-2">You can deselect these items before approving.</p>
                        </div>
                      )}

                      {/* All clear */}
                      {(validation.unrelatedItems || []).length === 0 && (validation.duplicates || []).length === 0 && (validation.oversizedStories || []).length === 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-emerald-700">Plan looks clean!</p>
                            <p className="text-[12px] text-emerald-600">No unrelated items, no duplicates, no oversized stories detected.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
