import React, { useState, useEffect } from 'react';
import { X, Bot, Rocket, Settings, CheckSquare, Square, RefreshCw, AlertTriangle, Layers, List, Loader, Save, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface AIPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSuccess: () => void;
}

export default function AIPlannerModal({ isOpen, onClose, projectId, projectName, onSuccess }: AIPlannerModalProps) {
  const [phase, setPhase] = useState<'INPUT' | 'ANALYZING' | 'REVIEW'>('INPUT');
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

  const [isApproving, setIsApproving] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('INPUT');
      setRequirements('');
      setPlan(null);
      // Check if there's an existing draft
      api.get(`/v1/ai/project-plan/${projectId}`).then(res => {
        if (res.data) {
          loadPlan(res.data);
          setPhase('REVIEW');
        }
      }).catch(err => console.error(err));
    }
  }, [isOpen, projectId]);

  const loadPlan = (draftPlan: any) => {
    setPlan(draftPlan);
    const epics = new Set<string>();
    const stories = new Set<string>();
    const tasks = new Set<string>();
    
    draftPlan.epics.forEach((e: any) => {
      epics.add(e.id);
      e.stories.forEach((s: any) => {
        stories.add(s.id);
        s.tasks.forEach((t: any) => {
          tasks.add(t.id);
        });
      });
    });
    
    setSelectedEpics(epics);
    setSelectedStories(stories);
    setSelectedTasks(tasks);
  };

  const handleAnalyze = async () => {
    if (!requirements.trim()) {
      toast.error('Please enter project requirements');
      return;
    }
    
    setPhase('ANALYZING');
    try {
      const res = await api.post('/v1/ai/project-plan/analyze', {
        projectId,
        requirements,
        sprintCapacity
      });
      loadPlan(res.data);
      setPhase('REVIEW');
      toast.success('AI Plan generated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate plan');
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
      toast.success('Plan approved and created successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRegenerate = async (id: string, type: 'TASK' | 'STORY', context: any) => {
    const instruction = prompt(`Regenerate ${type}. Any specific instructions?`);
    if (instruction === null) return;
    
    setRegeneratingId(id);
    try {
      const res = await api.post('/v1/ai/project-plan/regenerate', {
        itemId: id,
        itemType: type,
        context,
        promptAddition: instruction
      });
      
      const newPlan = { ...plan };
      
      if (type === 'STORY') {
        for (const e of newPlan.epics) {
          const idx = e.stories.findIndex((s: any) => s.id === id);
          if (idx !== -1) {
            e.stories[idx] = res.data;
            break;
          }
        }
      } else {
        for (const e of newPlan.epics) {
          for (const s of e.stories) {
            const idx = s.tasks.findIndex((t: any) => t.id === id);
            if (idx !== -1) {
              s.tasks[idx] = res.data;
              break;
            }
          }
        }
      }
      
      setPlan(newPlan);
      toast.success(`${type} regenerated`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Regeneration failed');
    } finally {
      setRegeneratingId(null);
    }
  };

  // Toggle selection functions
  const toggleEpic = (epicId: string) => {
    const next = new Set(selectedEpics);
    const epic = plan.epics.find((e: any) => e.id === epicId);
    if (!epic) return;
    
    const nextStories = new Set(selectedStories);
    const nextTasks = new Set(selectedTasks);
    
    if (next.has(epicId)) {
      next.delete(epicId);
      epic.stories.forEach((s: any) => {
        nextStories.delete(s.id);
        s.tasks.forEach((t: any) => nextTasks.delete(t.id));
      });
    } else {
      next.add(epicId);
      epic.stories.forEach((s: any) => {
        nextStories.add(s.id);
        s.tasks.forEach((t: any) => nextTasks.add(t.id));
      });
    }
    setSelectedEpics(next);
    setSelectedStories(nextStories);
    setSelectedTasks(nextTasks);
  };

  const toggleStory = (storyId: string) => {
    const next = new Set(selectedStories);
    const nextTasks = new Set(selectedTasks);
    
    let targetStory: any = null;
    plan.epics.forEach((e: any) => {
      const s = e.stories.find((st: any) => st.id === storyId);
      if (s) targetStory = s;
    });
    if (!targetStory) return;

    if (next.has(storyId)) {
      next.delete(storyId);
      targetStory.tasks.forEach((t: any) => nextTasks.delete(t.id));
    } else {
      next.add(storyId);
      targetStory.tasks.forEach((t: any) => nextTasks.add(t.id));
    }
    setSelectedStories(next);
    setSelectedTasks(nextTasks);
  };

  const toggleTask = (taskId: string) => {
    const next = new Set(selectedTasks);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    setSelectedTasks(next);
  };

  const toggleExpand = (id: string, setFn: any, currentSet: Set<string>) => {
    const next = new Set(currentSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFn(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
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

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-[#FAFAFA]">
          
          {phase === 'INPUT' && (
            <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
              <div className="mb-6 text-center space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">What are we building?</h3>
                <p className="text-slate-500 text-sm">Paste your project requirements, features, or business objectives below. The AI will generate a complete Agile sprint plan, epics, and tasks.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Project Requirements</label>
                  <textarea 
                    value={requirements}
                    onChange={e => setRequirements(e.target.value)}
                    placeholder="E.g. We need a cab booking app. Customers should be able to book rides, track drivers, and pay securely. Admins need a dashboard to manage drivers..."
                    className="w-full h-64 p-4 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none shadow-sm leading-relaxed"
                  />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Settings size={14} /> Planning Configuration</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Sprint Capacity (Story Points)</label>
                      <input 
                        type="number" 
                        value={sprintCapacity}
                        onChange={e => setSprintCapacity(parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none"
                      />
                    </div>
                    <div className="flex-[2]">
                       <p className="text-xs text-slate-500 italic mt-6">
                         Determines how many tasks the AI groups into a single sprint. (e.g. 40 points = ~2 weeks for an average team).
                       </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleAnalyze}
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Bot size={18} /> Analyze Requirements
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'ANALYZING' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center animate-pulse">
                <Loader className="text-indigo-600 animate-spin" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI is planning your project...</h3>
              <p className="text-sm text-slate-500 max-w-sm text-center">Breaking down requirements into epics, stories, and estimating sprint capacity. This may take a minute.</p>
            </div>
          )}

          {phase === 'REVIEW' && plan && (
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar - Plan Summary & Sprints */}
              <div className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Analysis Summary</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-4">{plan.projectSummary}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                     <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Epics</p>
                        <p className="text-lg font-black text-slate-800">{plan.epics?.length || 0}</p>
                     </div>
                     <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Total Points</p>
                        <p className="text-lg font-black text-indigo-600">
                           {plan.sprints?.reduce((a:any, b:any) => a + b.totalStoryPoints, 0)}
                        </p>
                     </div>
                  </div>

                  {plan.assumptions?.length > 0 && (
                    <div className="mb-4">
                       <p className="text-[10px] uppercase font-bold text-amber-600 mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Assumptions</p>
                       <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                         {plan.assumptions.map((a: string, i: number) => <li key={i}>{a}</li>)}
                       </ul>
                    </div>
                  )}
                  {plan.clarifications?.length > 0 && (
                    <div>
                       <p className="text-[10px] uppercase font-bold text-blue-600 mb-1 flex items-center gap-1"><CheckCircle2 size={12}/> Needs Clarification</p>
                       <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                         {plan.clarifications.map((a: string, i: number) => <li key={i}>{a}</li>)}
                       </ul>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Suggested Sprints</h3>
                  <div className="space-y-3">
                    {plan.sprints?.map((sprint: any, i: number) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-3 bg-white">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-[12px] font-bold text-slate-800">{sprint.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">{sprint.totalStoryPoints} pts</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mb-2">{sprint.goal}</p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${sprint.totalStoryPoints > sprintCapacity ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (sprint.totalStoryPoints / sprintCapacity) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Area - Backlog breakdown */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Layers size={20} className="text-slate-400" /> Epics & Tasks</h3>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPhase('INPUT')} className="text-[12px] font-bold text-slate-500 hover:text-slate-800 transition-all">Start Over</button>
                    <button 
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="px-5 py-2.5 bg-[#0D5F46] hover:bg-[#0A4D39] text-white rounded-xl text-[12px] font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/10 transition-all disabled:opacity-50"
                    >
                      {isApproving ? <Loader className="animate-spin" size={14} /> : <Save size={14} />} 
                      {isApproving ? 'Saving...' : 'Approve & Create Tasks'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-w-4xl">
                  {plan.epics?.map((epic: any) => (
                    <div key={epic.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="flex items-center gap-3 p-4 bg-slate-50/80 border-b border-slate-100">
                        <button onClick={() => toggleEpic(epic.id)} className={`text-slate-400 hover:text-indigo-600 transition-all ${selectedEpics.has(epic.id) ? 'text-indigo-600' : ''}`}>
                          {selectedEpics.has(epic.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <button onClick={() => toggleExpand(epic.id, setExpandedEpics, expandedEpics)} className="p-0.5 text-slate-400 hover:bg-slate-200 rounded">
                          {expandedEpics.has(epic.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(epic.id, setExpandedEpics, expandedEpics)}>
                           <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase">Epic</span>
                             <h4 className="text-sm font-bold text-slate-900">{epic.name}</h4>
                           </div>
                        </div>
                      </div>

                      {expandedEpics.has(epic.id) && (
                        <div className="divide-y divide-slate-100">
                          {epic.stories?.map((story: any) => (
                            <div key={story.id} className="pl-6 bg-white">
                              <div className="flex items-start gap-3 p-3 hover:bg-slate-50 transition-all group">
                                <button onClick={() => toggleStory(story.id)} className={`mt-0.5 text-slate-300 hover:text-indigo-500 transition-all ${selectedStories.has(story.id) ? 'text-indigo-500' : ''}`}>
                                  {selectedStories.has(story.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                </button>
                                <button onClick={() => toggleExpand(story.id, setExpandedStories, expandedStories)} className="mt-0.5 text-slate-300 hover:bg-slate-200 rounded">
                                  {expandedStories.has(story.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">Story</span>
                                      <h5 className="text-[13px] font-semibold text-slate-800">{story.title}</h5>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                      <span className="text-[10px] font-bold text-slate-400">{story.storyPoints} pts</span>
                                      <button 
                                        onClick={() => handleRegenerate(story.id, 'STORY', story)}
                                        disabled={regeneratingId === story.id}
                                        className="text-[10px] flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 disabled:opacity-50"
                                      >
                                        <RefreshCw size={10} className={regeneratingId === story.id ? 'animate-spin' : ''} /> Regenerate
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1 italic">"{story.userStory}"</p>
                                </div>
                              </div>

                              {expandedStories.has(story.id) && (
                                <div className="pl-14 pr-4 pb-3 space-y-1">
                                  {/* Acceptance Criteria */}
                                  {story.acceptanceCriteria?.length > 0 && (
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2">
                                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Acceptance Criteria</p>
                                      <ul className="text-[11px] text-slate-600 list-disc pl-4 space-y-0.5">
                                        {story.acceptanceCriteria.map((c: string, idx: number) => <li key={idx}>{c}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {/* Tasks */}
                                  {story.tasks?.map((task: any) => (
                                    <div key={task.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50 rounded-lg group">
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => toggleTask(task.id)} className={`text-slate-300 hover:text-indigo-400 transition-all ${selectedTasks.has(task.id) ? 'text-indigo-500' : ''}`}>
                                          {selectedTasks.has(task.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                                        </button>
                                        <span className="text-[12px] text-slate-700">{task.title}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{task.category}</span>
                                        <span className="text-[10px] font-semibold text-slate-400 w-6 text-right">{task.storyPoints}p</span>
                                        <button 
                                          onClick={() => handleRegenerate(task.id, 'TASK', task)}
                                          disabled={regeneratingId === task.id}
                                          className="text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                        >
                                          <RefreshCw size={12} className={regeneratingId === task.id ? 'animate-spin' : ''} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
