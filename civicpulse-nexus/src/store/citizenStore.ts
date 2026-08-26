import { create } from 'zustand';
import type { Citizen } from '../types';
import { citizenApi } from '../api/citizenApi';

interface CitizenState {
  citizens: Citizen[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (data: Omit<Citizen, 'id' | 'citizenId' | 'registeredAt' | 'grievancesCount' | 'applicationsCount'>) => Promise<Citizen>;
  updateStatus: (id: string, status: Citizen['status']) => Promise<void>;
}

export const useCitizenStore = create<CitizenState>((set, get) => ({
  citizens: [],   // ← starts empty; load() fetches from DB
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const citizens = await citizenApi.getAll();
      set({ citizens, loading: false });
    } catch (e) { set({ error: String(e), loading: false }); }
  },

  add: async (data) => {
    set({ loading: true });
    try {
      const newC = await citizenApi.create(data);
      set(state => ({ citizens: [newC, ...state.citizens], loading: false }));
      return newC;
    } catch (e) { set({ error: String(e), loading: false }); throw e; }
  },

  updateStatus: async (id, status) => {
    const c = get().citizens.find(c => c.id === id);
    if (!c) return;
    try {
      const updated = await citizenApi.updateStatus(id, status);
      set(state => ({ citizens: state.citizens.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },
}));
