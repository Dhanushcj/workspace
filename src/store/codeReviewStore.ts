import { create } from 'zustand';

interface CodeReviewState {
  awaitingCount: number;
  hasUrgentPRs: boolean;
  setAwaitingCount: (count: number) => void;
  setHasUrgentPRs: (urgent: boolean) => void;
}

export const useCodeReviewStore = create<CodeReviewState>((set) => ({
  awaitingCount: 0,
  hasUrgentPRs: false,
  setAwaitingCount: (count) => set({ awaitingCount: count }),
  setHasUrgentPRs: (urgent) => set({ hasUrgentPRs: urgent }),
}));

