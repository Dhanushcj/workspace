import React, { useState, useEffect } from 'react';
import { X, Beaker, CircleCheck, XCircle, Plus, Loader, AlertTriangle, Shield } from 'lucide-react';
import api from '../lib/api';
import { CreateTestCaseForm } from './CreateTestCaseForm';
import { BugReportForm } from './BugReportForm';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  onRefresh: () => void;
}

export const ExecuteTestsModal: React.FC<Props> = ({ 
  isOpen, onClose, assignment, onRefresh 
}) => {
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [failingTestCase, setFailingTestCase] = useState<any>(null);
  const [submittingResultId, setSubmittingResultId] = useState<string | null>(null);

  const fetchTestCases = async () => {
    if (!assignment) return;
    setLoading(true);
    try {
      const res = await api.get(`/tester-hub/assignments/${assignment.id}/test-cases`);
      setTestCases(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && assignment) {
      fetchTestCases();
    }
  }, [isOpen, assignment]);

  const handleResultSubmit = async (testCaseId: string, result: 'PASS' | 'FAIL', actual?: string) => {
    setSubmittingResultId(testCaseId);
    try {
      const res = await api.post(`/tester-hub/test-cases/${testCaseId}/results`, { 
        result, 
        actualResult: actual || (result === 'PASS' ? 'Feature works as expected' : 'Issue identified in execution phase'),
        notes: '' 
      });
      
      const resultData = res.data;

      if (result === 'FAIL') {
        setFailingTestCase({ testCaseId, resultId: resultData.id });
      } else {
        toast.success('Test result recorded');
        await fetchTestCases();
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSubmittingResultId(null);
    }
  };

  const handleFinalPass = async () => {
    try {
      await api.patch(`/tester-hub/assignments/${assignment.id}`, { status: 'PASSED' });
      toast.success('Assignment marked as PASSED');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error('Failed to complete assignment');
    }
  };

  if (!isOpen || !assignment) return null;

  const allExecuted = testCases.length > 0 && testCases.every(tc => tc.results?.length > 0);
  const anyFailed = testCases.some(tc => tc.results?.[0]?.result === 'FAIL');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-[48px] border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
              <Beaker size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cycle Verification</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                <span className="text-blue-600 font-black">Context:</span> {assignment.deployment.pullRequest.task?.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all border border-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
          
          {failingTestCase ? (
             <BugReportForm 
               testResultId={failingTestCase.resultId}
               taskId={assignment.deployment.pullRequest.task.id}
               assignedTo={assignment.deployment.pullRequest.submittedBy.id}
               featureName={assignment.deployment.pullRequest.task.title}
               onCancel={() => setFailingTestCase(null)}
               onSubmitted={() => {
                 toast.success('Defect logged successfully.');
                 onRefresh();
                 onClose();
               }}
             />
          ) : showCreateForm ? (
             <CreateTestCaseForm 
               assignmentId={assignment.id}
               onCancel={() => setShowCreateForm(false)}
               onCreated={() => {
                 setShowCreateForm(false);
                 fetchTestCases();
                 toast.success('Test point established.');
               }}
             />
          ) : (
            <div className="space-y-8">
               <div className="flex items-center justify-between px-2">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    <Shield size={14} className="text-blue-600" /> Operational Protocols ({testCases.length})
                 </h3>
                 <button 
                   onClick={() => setShowCreateForm(true)}
                   className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
                 >
                   <Plus size={16} /> New Requirement
                 </button>
               </div>

               {loading ? (
                 <div className="flex flex-col items-center justify-center py-24 gap-6">
                    <Loader className="animate-spin text-blue-600" size={40} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calibrating Test Suite...</span>
                 </div>
               ) : testCases.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                     <p className="text-sm text-slate-500 font-medium mb-6">No verification points established for this cycle.</p>
                     <button 
                       onClick={() => setShowCreateForm(true)}
                       className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                     >
                       Initialize Protocol
                     </button>
                  </div>
               ) : (
                 <div className="space-y-6">
                    {testCases.map((tc) => {
                       const result = tc.results?.[0];
                       const isSubmitting = submittingResultId === tc.id;

                       return (
                         <div key={tc.id} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-5 group hover:border-blue-200 transition-all">
                            <div className="flex justify-between items-start gap-6">
                               <div className="space-y-2">
                                  <h4 className="text-[15px] font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{tc.title}</h4>
                                  <p className="text-[12px] text-slate-500 leading-relaxed font-medium">{tc.steps}</p>
                               </div>
                               {result ? (
                                  result.result === 'PASS' ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                       <CircleCheck size={12} /> Success
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                       <XCircle size={12} /> Failed
                                    </div>
                                  )
                               ) : (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                     Awaiting Data
                                  </div>
                               )}
                            </div>

                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Target State Indicator</span>
                               <p className="text-[12px] text-slate-600 font-medium">{tc.expectedResult}</p>
                            </div>

                            {!result && (
                              <div className="flex gap-4 pt-2">
                                 <button
                                   disabled={isSubmitting}
                                   onClick={() => handleResultSubmit(tc.id, 'PASS')}
                                   className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-600/10 hover:bg-emerald-700 active:scale-95"
                                 >
                                   {isSubmitting ? 'Processing...' : 'Confirm Success'}
                                 </button>
                                 <button
                                   disabled={isSubmitting}
                                   onClick={() => handleResultSubmit(tc.id, 'FAIL')}
                                   className="flex-1 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-50 active:scale-95"
                                 >
                                   Log Defect
                                 </button>
                              </div>
                            )}
                         </div>
                       );
                    })}
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!failingTestCase && !showCreateForm && (
          <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-3">
                <AlertTriangle size={18} className={anyFailed ? 'text-rose-600' : 'text-slate-300'} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {anyFailed ? 'Status: Integrated Defects Detected' : allExecuted ? 'Status: Verification Complete' : 'Status: Cycle In-Progress'}
                </span>
             </div>
             {allExecuted && !anyFailed && (
               <button 
                 onClick={handleFinalPass}
                 className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 flex items-center gap-3 active:scale-95 transition-all"
               >
                 <Shield size={16} /> Mark Cycle Passed
               </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

