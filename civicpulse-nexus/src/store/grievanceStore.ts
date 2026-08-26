import { create } from 'zustand';
import type { Grievance, GrievanceCategory, GrievanceSeverity, GrievanceHistoryEntry } from '../types';
import { checkSLAEscalation } from '../services/grievanceService';
import { grievanceApi } from '../api/grievanceApi';

interface GrievanceState {
  grievances: Grievance[];
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  loadByCitizen: (citizenId: string) => Promise<void>;
  refreshByCitizen: (citizenId: string) => Promise<void>;
  getHistory: (grievanceId: string) => Promise<GrievanceHistoryEntry[]>;

  add: (data: {
    citizenId: string; citizenName: string; ward: string;
    category: GrievanceCategory; severity: GrievanceSeverity;
    title: string; description: string;
  }) => Promise<Grievance>;

  updateStatus: (id: string, status: Grievance['status'],
                  resolution?: string, officerMessage?: string, rejectionReason?: string,
                  actor?: string, actorRole?: string) => Promise<void>;
  assign: (id: string, officer: string, dept?: string) => Promise<void>;
  escalate: (id: string, reason: string) => Promise<void>;
  citizenRespond: (id: string, citizenId: string, response: string) => Promise<void>;
  acceptResolution: (id: string, citizenId: string) => Promise<void>;
  reopen: (id: string, citizenId: string, reason: string) => Promise<void>;
  runSLACheck: () => void;
}

export const useGrievanceStore = create<GrievanceState>((set, get) => ({
  grievances: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const grievances = await grievanceApi.getAll();
      set({ grievances, loading: false });
    } catch (e) { set({ error: String(e), loading: false }); }
  },

  loadByCitizen: async (citizenId) => {
    set({ loading: true, error: null });
    try {
      const grievances = await grievanceApi.getByCitizen(citizenId);
      set({ grievances, loading: false });
    } catch (e) { set({ error: String(e), loading: false }); }
  },

  refreshByCitizen: async (citizenId) => {
    try {
      const grievances = await grievanceApi.getByCitizen(citizenId);
      set({ grievances });
    } catch { /* silent */ }
  },

  getHistory: async (grievanceId) => {
    try { return await grievanceApi.getHistory(grievanceId); }
    catch { return []; }
  },

  add: async (data) => {
    set({ loading: true });
    try {
      const newG = await grievanceApi.create(data);
      set(state => ({ grievances: [newG, ...state.grievances], loading: false }));
      return newG;
    } catch (e) { set({ error: String(e), loading: false }); throw e; }
  },

  updateStatus: async (id, status, resolution, officerMessage, rejectionReason, actor, actorRole) => {
    const g = get().grievances.find(g => g.id === id);
    if (!g) return;
    try {
      const updated = await grievanceApi.updateStatus(g, status, resolution, officerMessage, rejectionReason, actor, actorRole);
      set(state => ({ grievances: state.grievances.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  escalate: async (id, reason) => {
    const g = get().grievances.find(g => g.id === id);
    if (!g) return;
    try {
      const updated = await grievanceApi.escalate(g, reason);
      set(state => ({ grievances: state.grievances.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  assign: async (id, officer, dept) => {
    const g = get().grievances.find(g => g.id === id);
    if (!g) return;
    try {
      const updated = await grievanceApi.assign(g, officer, dept);
      set(state => ({ grievances: state.grievances.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  citizenRespond: async (id, citizenId, response) => {
    const g = get().grievances.find(g => g.id === id);
    if (!g) return;
    try {
      const updated = await grievanceApi.citizenRespond(g, citizenId, response);
      set(state => ({ grievances: state.grievances.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  acceptResolution: async (id, citizenId) => {
    const g = get().grievances.find(g => g.id === id);
    if (!g) return;
    try {
      const updated = await grievanceApi.acceptResolution(g, citizenId);
      set(state => ({ grievances: state.grievances.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  reopen: async (id, citizenId, reason) => {
    const g = get().grievances.find(g => g.id === id);
    if (!g) return;
    try {
      const updated = await grievanceApi.reopen(g, citizenId, reason);
      set(state => ({ grievances: state.grievances.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  runSLACheck: () => {
    set(state => ({ grievances: state.grievances.map(checkSLAEscalation) }));
  },
}));
