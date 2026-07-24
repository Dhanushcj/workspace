

import React from 'react';
import { AlertCircle, CircleCheck } from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning';
  message: string;
  link?: string;
  timestamp: string;
}

interface CriticalAlertsPanelProps {
  alerts: Alert[];
}

const CriticalAlertsPanel: React.FC<CriticalAlertsPanelProps> = ({ alerts }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-[32px] p-8 h-full shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-slate-900 font-black text-xl tracking-tight">Active Alerts</h2>
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          {alerts.length} Flagged
        </span>
      </div>

      <div className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border flex items-start gap-4 transition-all hover:bg-slate-50 ${
                alert.type === 'critical'
                  ? 'bg-red-50/30 border-red-100'
                  : 'bg-amber-50/30 border-amber-100'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                  alert.type === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}
              >
                 <AlertCircle size={20} />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className={`text-[13px] font-bold leading-relaxed ${alert.type === 'critical' ? 'text-red-900' : 'text-amber-900'}`}>
                  {alert.message}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{alert.timestamp}</span>
                  {alert.link && (
                    <a
                      to={alert.link}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest flex items-center gap-1"
                    >
                      Audit Trace →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-[24px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
               <CircleCheck size={32} />
            </div>
            <p className="text-slate-900 font-black text-lg tracking-tight">Operations Nominal</p>
            <p className="text-slate-400 text-sm font-medium mt-1">No critical anomalies detected in the current stream.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default CriticalAlertsPanel;

