import React, { useState } from 'react';
import { Plus, Loader } from 'lucide-react';
import api from '../lib/api';

interface Props {
  assignmentId: string;
  onCreated: () => void;
  onCancel: () => void;
}

export const CreateTestCaseForm: React.FC<Props> = ({ assignmentId, onCreated, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    steps: '',
    expectedResult: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/tester-hub/assignments/${assignmentId}/test-cases`, formData);
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-6 rounded-[24px] border border-white/5">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Test Objective</label>
        <input
          required
          type="text"
          placeholder="e.g., Verify authentication flow with valid credentials"
          className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Execution Steps</label>
        <textarea
          required
          rows={4}
          placeholder="1. Navigate to login page&#10;2. Enter username 'test@example.com'&#10;3. Click Login"
          className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all resize-none"
          value={formData.steps}
          onChange={e => setFormData({ ...formData, steps: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Expected Outcome</label>
        <input
          required
          type="text"
          placeholder="User should be redirected to dashboard with session token"
          className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all"
          value={formData.expectedResult}
          onChange={e => setFormData({ ...formData, expectedResult: e.target.value })}
        />
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader className="animate-spin" size={14} /> : <Plus size={14} />}
          Add Test Case
        </button>
      </div>
    </form>
  );
};

