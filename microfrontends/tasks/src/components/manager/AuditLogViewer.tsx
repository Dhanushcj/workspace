

import React, { useState } from 'react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  entityType: string;
  entityName: string;
  details?: string;
  oldValue?: any;
  newValue?: any;
}

interface AuditLogViewerProps {
  logs: AuditLogEntry[];
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState('all');

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'updated': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'deleted': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'resolved': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-slate-900 font-black text-xl tracking-tight">Audit Trail</h2>
          <p className="text-slate-400 text-[11px] font-medium mt-1">Strategic ledger of organizational state transitions</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
          >
            <option value="all">Organization Wide</option>
            <option value="project">Strategic Projects</option>
            <option value="sprint">Production Cycles</option>
            <option value="task">Operational Tasks</option>
            <option value="pr">Code Reviews</option>
          </select>
          <button className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-md shadow-slate-900/5">
            Export Report
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100 bg-slate-50/50">
              <th className="px-8 py-5">Timestamp</th>
              <th className="px-8 py-5">Actor</th>
              <th className="px-8 py-5">Transaction</th>
              <th className="px-8 py-5">Entity</th>
              <th className="px-8 py-5">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log) => (
              <React.Fragment key={log.id}>
                <tr 
                  className={`hover:bg-blue-50/20 transition-all cursor-pointer group ${expandedId === log.id ? 'bg-blue-50/40' : ''}`}
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <td className="px-8 py-5 text-[11px] text-slate-400 font-bold whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {log.user.name.charAt(0)}
                      </div>
                      <span className="text-[13px] text-slate-900 font-bold">{log.user.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div>
                      <p className="text-[13px] text-blue-600 font-bold truncate max-w-[150px]">{log.entityName}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{log.entityType}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-[12px] text-slate-500 font-medium max-w-xs truncate">
                    {log.details || 'Show mutation diff...'}
                  </td>
                </tr>
                {expandedId === log.id && (
                  <tr className="bg-slate-50/30">
                    <td colSpan={5} className="px-8 py-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-4">Baseline State</p>
                          <pre className="text-[11px] text-slate-500 font-mono overflow-x-auto bg-slate-50 p-4 rounded-xl">
                            {JSON.stringify(log.oldValue, null, 2)}
                          </pre>
                        </div>
                        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-4">Target State</p>
                          <pre className="text-[11px] text-blue-600 font-mono overflow-x-auto bg-blue-50/50 p-4 rounded-xl">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Showing 50 Organization Records</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-400 disabled:opacity-30 uppercase tracking-widest transition-all" disabled>Prev</button>
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-[11px] font-black text-white shadow-md shadow-blue-600/10 uppercase tracking-widest transition-all">1</button>
          <button className="px-4 py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 transition-all">2</button>
          <button className="px-4 py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 transition-all">Next</button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;

