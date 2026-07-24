'use client';

import React from 'react';
import { Target } from 'lucide-react';

interface MilestoneTask {
  id: string;
  status: string;
}

interface Milestone {
  id: string;
  name: string;
  targetDate?: string;
  target_date?: string;
  status: 'PENDING' | 'ACHIEVED' | 'MISSED' | 'pending' | 'achieved' | 'missed';
  linked_tasks?: MilestoneTask[];
  linkedTasks?: MilestoneTask[];
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
}

interface Props {
  milestones: Milestone[];
  onEstablish: () => void;
}

export const ProductionMilestonesPanel: React.FC<Props> = ({ milestones, onEstablish }) => {
  const displayMilestones = milestones.slice(0, 3);
  const hasMore = milestones.length > 3;

  return (
    <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
           Active Milestones
        </h3>
        <button 
          onClick={onEstablish}
          className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/10 active:scale-95"
        >
          Define
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-center">
        {milestones.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[12px] font-bold uppercase tracking-widest text-slate-300">
              No Milestones Defined
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {displayMilestones.map((milestone) => {
              // Normalize status
              const rawStatus = milestone.status?.toLowerCase() || 'pending';
              
              // Resolve Date
              const dateIso = milestone.targetDate || milestone.target_date;
              const dateStr = dateIso ? new Date(dateIso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending';

              // Resolve Progress
              let completed = 0;
              let total = 0;
              let percentage = 0;

              if (milestone.progress) {
                completed = milestone.progress.completed;
                total = milestone.progress.total;
                percentage = milestone.progress.percentage;
              } else {
                const tasks = milestone.linked_tasks || milestone.linkedTasks || [];
                total = tasks.length;
                completed = tasks.filter(t => t.status === 'DONE' || t.status === 'done').length;
                percentage = total > 0 ? (completed / total) * 100 : 0;
              }

              // Compute final status dynamically if needed
              let computedStatus = rawStatus;
              if (total > 0 && completed === total) {
                computedStatus = 'achieved';
              } else if (dateIso && new Date(dateIso).getTime() < Date.now() && completed < total) {
                computedStatus = 'missed';
              }

              // Set colors
              let statusColor = '#3B82F6'; // blue
              if (computedStatus === 'achieved') statusColor = '#10B981'; // green
              else if (computedStatus === 'missed') statusColor = '#EF4444'; // red

              return (
                <div key={milestone.id} className="flex flex-col gap-4 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                          <Target size={18} />
                        </div>
                        <div 
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                          style={{ backgroundColor: statusColor }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[13px] font-bold text-slate-900 leading-tight">
                          {milestone.name}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400">
                          Due {dateStr}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-500">
                      {completed} / {total} <span className="text-slate-300 font-medium">Tasks</span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: statusColor
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <button className="text-[11px] font-bold text-blue-600 uppercase tracking-widest text-center mt-4 py-2.5 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100">
                View All Deliverables
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

