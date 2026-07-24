

import React from 'react';

interface HealthMetric {
  title: string;
  value: string;
  subText: string;
  icon: string;
  color: 'red' | 'amber' | 'green' | 'blue';
  sparkline?: number[];
}

interface HealthMetricsDashboardProps {
  velocity: {
    level: 'High' | 'Moderate' | 'Low';
    trend: number[];
  };
  blockers: {
    count: number;
    resolved: number;
  };
  codeQuality: {
    pendingPRs: number;
    avgReviewTime: number;
  };
  qaStatus: {
    passRate: number;
    openBugs: number;
  };
}

import { Zap, AlertTriangle, Shield, Bug } from 'lucide-react';

const HealthMetricsDashboard: React.FC<HealthMetricsDashboardProps> = ({
  velocity,
  blockers,
  codeQuality,
  qaStatus,
}) => {
  const metrics = [
    {
      title: 'Velocity',
      value: velocity.level.toUpperCase(),
      subText: 'Task completion rate',
      icon: <Zap size={18} />,
      color: velocity.level === 'High' ? 'text-blue-600' : 'text-slate-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      sparkline: velocity.trend,
    },
    {
      title: 'Blockers',
      value: `${blockers.count} ACTIVE`,
      subText: `${blockers.resolved} resolved recently`,
      icon: <AlertTriangle size={18} />,
      color: blockers.count > 3 ? 'text-red-600' : 'text-slate-600',
      bg: blockers.count > 3 ? 'bg-red-50' : 'bg-slate-50',
      border: blockers.count > 3 ? 'border-red-100' : 'border-slate-100',
    },
    {
      title: 'Review Status',
      value: `${codeQuality.pendingPRs} PENDING`,
      subText: `Avg time: ${codeQuality.avgReviewTime}h`,
      icon: <Shield size={18} />,
      color: codeQuality.pendingPRs > 5 ? 'text-indigo-600' : 'text-slate-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      title: 'Quality Rate',
      value: `${qaStatus.passRate}% PASS`,
      subText: `${qaStatus.openBugs} defects active`,
      icon: <Bug size={18} />,
      color: qaStatus.passRate < 95 ? 'text-rose-600' : 'text-emerald-600',
      bg: qaStatus.passRate < 95 ? 'bg-rose-50' : 'bg-emerald-50',
      border: qaStatus.passRate < 95 ? 'border-rose-100' : 'border-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <div
          key={metric.title}
          className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.bg} ${metric.color.replace('text-', 'text-')} border ${metric.border} group-hover:scale-105 transition-transform`}>
              {metric.icon}
            </div>
            {metric.sparkline && (
              <div className="w-16 h-8 flex items-end gap-1 px-1">
                {metric.sparkline.map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-600/20 rounded-t-[2px] hover:bg-blue-600/40 transition-colors"
                    style={{ height: `${Math.max(val, 15)}%` }}
                  />
                ))}
              </div>
            )}
          </div>
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
            {metric.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-black text-slate-900 tracking-tight`}>{metric.value}</span>
          </div>
          <p className="text-slate-400 text-[11px] font-medium mt-1 leading-tight">{metric.subText}</p>
        </div>
      ))}
    </div>
  );
};

export default HealthMetricsDashboard;

