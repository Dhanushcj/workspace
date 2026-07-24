'use client';

import React, { useState } from 'react';

interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
    role: string;
  };
  action: string;
  entity: string;
  timestamp: string;
  type: 'project' | 'review' | 'qa' | 'blocker' | 'other';
}

interface TeamActivityFeedProps {
  activities: ActivityItem[];
}

const TeamActivityFeed: React.FC<TeamActivityFeedProps> = ({ activities }) => {
  const [filter, setFilter] = useState<'all' | 'project' | 'review' | 'qa' | 'blocker'>('all');

  const filteredActivities = activities.filter((a) => filter === 'all' || a.type === filter);

  return (
    <div className="bg-white border border-slate-200 rounded-[32px] p-8 h-full flex flex-col shadow-sm">
      <div className="flex flex-col gap-6 mb-8">
        <h2 className="text-slate-900 font-black text-xl tracking-tight">Activity Feed</h2>
        <div className="flex flex-wrap gap-2">
          {['all', 'project', 'review', 'qa', 'blocker'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
              }`}
            >
              {f === 'all' ? 'Everything' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <div key={activity.id} className="flex gap-4 items-start group">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-[11px] font-black group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all shrink-0">
                {activity.user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[13px] text-slate-600 leading-snug">
                  <span className="font-bold text-slate-900">{activity.user.name}</span>{' '}
                  <span className="text-slate-400 font-medium">({activity.user.role.toUpperCase()})</span>{' '}
                  {activity.action} <span className="text-blue-600 font-bold">{activity.entity}</span>
                </p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">{activity.timestamp}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm py-20">
             <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 mb-4 flex items-center justify-center text-slate-200 font-black">?</div>
             <p className="font-bold uppercase tracking-widest text-[10px]">No activity matches filter</p>
          </div>
        )}
      </div>

      <button className="mt-8 w-full py-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-widest transition-all">
        View Full Audit History
      </button>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default TeamActivityFeed;

