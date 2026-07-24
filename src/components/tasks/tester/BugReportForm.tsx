import React, { useState } from 'react';
import { AlertCircle, Loader, Send } from 'lucide-react';
import api from '../lib/api';

interface Props {
  testResultId: string;
  taskId: string;
  assignedTo: string;
  featureName: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

export const BugReportForm: React.FC<Props> = ({ 
  testResultId, taskId, assignedTo, featureName, onSubmitted, onCancel 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: `Bug in ${featureName}`,
    description: '',
    severity: 'HIGH'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/bug-reports`, {
        ...formData,
        testResultId,
        taskId,
        assignedToId: assignedTo
      });
      onSubmitted();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-rose-500/5 p-6 rounded-[24px] border border-rose-500/20">
      <div className="flex items-center gap-3 text-rose-400 mb-2">
        <AlertCircle size={20} />
        <h3 className="text-sm font-black uppercase tracking-widest">Incident Report</h3>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-rose-400/60 uppercase tracking-[0.2em] ml-1">Issue Title</label>
        <input
          required
          type="text"
          className="w-full bg-[#0f172a] border border-rose-500/20 rounded-xl px-4 py-3 text-white text-sm focus:border-rose-500 outline-none transition-all"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-rose-400/60 uppercase tracking-[0.2em] ml-1">Actual Result & Evidence</label>
        <textarea
          required
          rows={4}
          placeholder="Describe what happened instead of the expected result..."
          className="w-full bg-[#0f172a] border border-rose-500/20 rounded-xl px-4 py-3 text-white text-sm focus:border-rose-500 outline-none transition-all resize-none"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-rose-400/60 uppercase tracking-[0.2em] ml-1">Criticality</label>
        <div className="grid grid-cols-4 gap-2">
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(sev => (
            <button
              key={sev}
              type="button"
              onClick={() => setFormData({ ...formData, severity: sev })}
              className={`
                py-2 rounded-lg text-[9px] font-black tracking-widest transition-all
                ${formData.severity === sev 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                  : 'bg-white/5 text-white/30 hover:bg-white/10'}
              `}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          Dismiss
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader className="animate-spin" size={14} /> : <Send size={14} />}
          Dispatch Report
        </button>
      </div>
    </form>
  );
};

