import { create } from 'zustand';

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetId: string;
  targetTitle: string;
  timestamp: string;
}

interface ActivityState {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [
    {
      id: 'act-1',
      userId: 'mgr-1',
      userName: 'Project Manager',
      action: 'initialized',
      targetId: 'sprint-12',
      targetTitle: 'Sprint 12',
      timestamp: new Date().toISOString(),
    }
  ],
  addActivity: (a) => {
    const newActivity: Activity = {
      ...a,
      id: `act-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ activities: [newActivity, ...state.activities] }));
  },
}));

