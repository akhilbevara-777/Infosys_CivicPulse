import { create } from 'zustand';
import type { ServiceApplication, ApplicationStatus, ApplicationEvent, CertificateType, PermitType } from '../types';
import { applicationApi } from '../api/applicationApi';
import { downloadCertificate } from '../services/applicationService';

interface ApplicationState {
  applications: ServiceApplication[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  loadByCitizen: (citizenId: string) => Promise<void>;
  refreshByCitizen: (citizenId: string) => Promise<void>;
  getEvents: (applicationId: string) => Promise<ApplicationEvent[]>;
  add: (data: { citizenId: string; citizenName: string; type: CertificateType | PermitType; category: 'certificate' | 'permit' }) => Promise<ServiceApplication>;
  submitApplication: (params: { citizenId: string; citizenName: string; type: string; category: 'certificate' | 'permit'; formData: Record<string, string>; files: Record<string, File> }) => Promise<ServiceApplication>;
  updateStatus: (id: string, status: ApplicationStatus, notes?: string) => Promise<void>;
  verifyDocument: (id: string, docName: string) => Promise<void>;
  markFeePaid: (id: string) => Promise<void>;
  assignOfficer: (id: string, officer: string, dept?: string) => Promise<void>;
  signApplication: (id: string, signerName: string) => Promise<void>;
  cancelApplication: (id: string, citizenId: string, reason?: string) => Promise<void>;
  downloadCert: (id: string) => Promise<void>;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],  // ← starts EMPTY — filled from API per citizen
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const applications = await applicationApi.getAll();
      set({ applications, loading: false });
    } catch (e) { set({ error: String(e), loading: false }); }
  },

  loadByCitizen: async (citizenId) => {
    set({ loading: true, error: null });
    try {
      const applications = await applicationApi.getByCitizen(citizenId);
      set({ applications, loading: false });
    } catch (e) { set({ error: String(e), loading: false }); }
  },

  // Silent refresh — doesn't show global loading spinner
  refreshByCitizen: async (citizenId) => {
    try {
      const applications = await applicationApi.getByCitizen(citizenId);
      set({ applications });
    } catch { /* silent */ }
  },

  getEvents: async (applicationId) => {
    try {
      return await applicationApi.getEvents(applicationId);
    } catch { return []; }
  },

  add: async (data) => {
    set({ loading: true });
    try {
      const newApp = await applicationApi.create(data);
      set(state => ({ applications: [newApp, ...state.applications], loading: false }));
      return newApp;
    } catch (e) { set({ error: String(e), loading: false }); throw e; }
  },

  submitApplication: async (params) => {
    set({ loading: true, error: null });
    try {
      const newApp = await applicationApi.submitWithFiles(params);
      set(state => ({ applications: [newApp, ...state.applications], loading: false }));
      return newApp;
    } catch (e) { set({ error: String(e), loading: false }); throw e; }
  },

  updateStatus: async (id, status, notes) => {
    const app = get().applications.find(a => a.id === id);
    if (!app) return;
    try {
      const updated = await applicationApi.updateStatus(app, status, notes);
      set(state => ({ applications: state.applications.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  verifyDocument: async (id, docName) => {
    const app = get().applications.find(a => a.id === id);
    if (!app) return;
    try {
      const updated = await applicationApi.verifyDocument(app, docName);
      set(state => ({ applications: state.applications.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  markFeePaid: async (id) => {
    const app = get().applications.find(a => a.id === id);
    if (!app) return;
    try {
      const updated = await applicationApi.markFeePaid(app);
      set(state => ({ applications: state.applications.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  assignOfficer: async (id, officer, dept) => {
    const app = get().applications.find(a => a.id === id);
    if (!app) return;
    try {
      const updated = await applicationApi.assignOfficer(app, officer, dept);
      set(state => ({ applications: state.applications.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  signApplication: async (id, signerName) => {
    const app = get().applications.find(a => a.id === id);
    if (!app) return;
    try {
      const updated = await applicationApi.signApplication(app, signerName);
      set(state => ({ applications: state.applications.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  cancelApplication: async (id, citizenId, reason) => {
    try {
      const updated = await applicationApi.cancelApplication(id, citizenId, reason);
      set(state => ({ applications: state.applications.map(x => x.id === id ? updated : x) }));
    } catch (e) { set({ error: String(e) }); throw e; }
  },

  downloadCert: async (id) => {
    const app = get().applications.find(a => a.id === id);
    if (!app || (app.status !== 'issued' && app.status !== 'approved')) return;
    downloadCertificate(app);
    try {
      const updated = await applicationApi.trackDownload(app);
      set(state => ({ applications: state.applications.map(x => x.id === id ? updated : x) }));
    } catch { /* non-critical */ }
  },
}));
