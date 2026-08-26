import { create } from 'zustand';
import type { WelfareApplication } from '../types';
import { welfareApi } from '../api/welfareApi';

interface WelfareState {
  applications: WelfareApplication[];
  loading: boolean;
  error: string | null;
  loadByCitizen: (citizenId: string) => Promise<void>;
}

export const useWelfareStore = create<WelfareState>((set) => ({
  applications: [],
  loading: false,
  error: null,

  loadByCitizen: async (citizenId) => {
    set({ loading: true, error: null });
    try {
      const applications = await welfareApi.getApplications(citizenId);
      set({ applications, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },
}));
