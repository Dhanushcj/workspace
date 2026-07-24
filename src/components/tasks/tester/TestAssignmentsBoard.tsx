import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Play, ClipboardCheck, ArrowRight, CircleCheck, XCircle, User } from 'lucide-react';

interface Assignment {
  id: string;
  status: string;
  assignedAt: string;
  deployment: {
    deployedBy: { name: string };
    deployedAt: string;
    pullRequest: {
      title: string;
      task: { title: string };
    }
  };
  _count: { testCases: number };
}

interface Props {
  assignments: Assignment[];
  onStart: (id: string) => void;
  onExecute: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const TestAssignmentsBoard: React.FC<Props> = ({ 
  assignments, onStart, onExecute, onViewDetails 
}) => {
  const pending = assignments.filter(a => a.status === 'PENDING');
  const inProgress = assignments.filter(a => a.status === 'IN_PROGRESS');
  const completed = assignments.filter(a => ['PASSED', 'FAILED'].includes(a.status));

  const Column = ({ title, count, items, color, children }: any) => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm`} />
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{title}</h3>
        </div>
        <div className="px-2 py-0.5 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400 shadow-sm">{count}</div>
      </div>
      <div className="space-y-4">
        {items.map((item: any) => (
          <div key={item.id} className="group relative">
            {children(item)}
          </div>
        ))}
        {items.length === 0 && (
          <div className="h-32 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-white/50">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Operational Data</span>
          </div>
        )}
      </div>
    </div>
  );

  const Card = ({ item, statusColor, actionButton }: any) => (
    <div className="bg-white rounded-[28px] border border-slate-200 p-6 space-y-5 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all shadow-sm relative overflow-hidden group">
      {/* Status Stripe */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${statusColor} opacity-80`} />
      
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h4 className="text-[15px] font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
            {item.deployment.pullRequest.task?.title || item.deployment.pullRequest.title}
          </h4>
        </div>

        <div className="space-y-3">
           <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500">
              <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                 <User size={12} className="text-slate-400" />
              </div>
              <span>Origin: <span className="text-slate-900">{item.deployment.deployedBy.name}</span></span>
           </div>
           <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500">
              <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                 <ClipboardCheck size={12} className="text-blue-600" />
              </div>
              <span>{item._count.testCases} Verification Points</span>
           </div>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-slate-100">
         <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            {formatDistanceToNow(new Date(item.deployment.deployedAt))} ago
         </div>
         {actionButton}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {/* PENDING */}
      <Column title="Strategic Queue" count={pending.length} items={pending} color="bg-amber-500">
        {(item: any) => (
          <Card 
            item={item} 
            statusColor="bg-amber-500" 
            actionButton={
              <button 
                onClick={() => onStart(item.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-600/10 hover:bg-emerald-700 active:scale-95 group/btn"
              >
                Start Verification <Play size={10} fill="currentColor" className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            }
          />
        )}
      </Column>

      {/* IN PROGRESS */}
      <Column title="Active Analysis" count={inProgress.length} items={inProgress} color="bg-blue-600">
        {(item: any) => (
          <Card 
            item={item} 
            statusColor="bg-blue-600" 
            actionButton={
              <button 
                onClick={() => onExecute(item.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 group/btn"
              >
                Execute Suite <ArrowRight size={10} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            }
          />
        )}
      </Column>

      {/* COMPLETED */}
      <Column title="Validation History" count={completed.length} items={completed} color="bg-emerald-600">
        {(item: any) => (
          <Card 
            item={item} 
            statusColor={item.status === 'PASSED' ? 'bg-emerald-600' : 'bg-rose-600'} 
            actionButton={
              <div className="flex items-center gap-3">
                {item.status === 'PASSED' ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    <CircleCheck size={12} /> Success
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    <XCircle size={12} /> Failed
                  </div>
                )}
                <button 
                  onClick={() => onViewDetails(item.id)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 border border-slate-100 hover:border-blue-200 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            }
          />
        )}
      </Column>
    </div>
  );
};

