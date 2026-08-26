import { api } from './client';
import type { WelfareScheme, WelfareApplication } from '../types';
import { WELFARE_SCHEMES, WELFARE_APPLICATIONS } from '../services/welfareService';

const EP = '/api/welfare';

const statusFromBackend = (s: string): WelfareApplication['status'] =>
  s.toLowerCase() as WelfareApplication['status'];

function schemeFromBackend(s: any): WelfareScheme {
  return {
    ...s,
    status:            (s.status ?? '').toLowerCase() as WelfareScheme['status'],
    eligibility:       (() => { try { return JSON.parse(s.eligibilityJson ?? '[]'); } catch { return []; } })(),
    documentsRequired: (() => { try { return JSON.parse(s.documentsJson   ?? '[]'); } catch { return []; } })(),
  };
}

function appFromBackend(a: any): WelfareApplication {
  return {
    ...a,
    status:    statusFromBackend(a.status),
    updatedAt: a.updatedAt?.toString(),
    documents: (() => { try { return JSON.parse(a.documentsJson ?? '[]'); } catch { return []; } })(),
    eligibilityResult: (() => { try { return JSON.parse(a.eligibilityResultJson ?? '[]'); } catch { return []; } })(),
  };
}

export const welfareApi = {
  async getSchemes(category?: string): Promise<WelfareScheme[]> {
    try {
      const res = await api.get(`${EP}/schemes`, { params: category ? { category } : {} });
      return (res.data as any[]).map(schemeFromBackend);
    } catch (e: any) {
      if (e?.offline) return category ? WELFARE_SCHEMES.filter(s => s.category === category) : [...WELFARE_SCHEMES];
      throw e;
    }
  },

  async getApplications(citizenId?: string): Promise<WelfareApplication[]> {
    try {
      const res = await api.get(`${EP}/applications`, { params: citizenId ? { citizenId } : {} });
      return (res.data as any[]).map(appFromBackend);
    } catch (e: any) {
      if (e?.offline) return [];   // never return other citizens' data offline
      throw e;
    }
  },

  /** Full submit with files, form data, eligibility result */
  async submit(params: {
    schemeId: string;
    citizenId: string;
    citizenName: string;
    ward: string;
    formData: Record<string, string>;
    files: Record<string, File>;
    eligibilityResult: string[];
  }): Promise<WelfareApplication> {
    const fd = new FormData();
    fd.append('schemeId',             params.schemeId);
    fd.append('citizenId',            params.citizenId);
    fd.append('citizenName',          params.citizenName);
    fd.append('ward',                 params.ward);
    fd.append('formDataJson',         JSON.stringify(params.formData));
    fd.append('eligibilityResultJson',JSON.stringify(params.eligibilityResult));
    Object.entries(params.files).forEach(([name, file]) => fd.append(name, file));

    try {
      const res = await api.post(`${EP}/applications/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return appFromBackend(res.data);
    } catch (e: any) {
      if (e?.offline) {
        const scheme = WELFARE_SCHEMES.find(s => s.id === params.schemeId);
        return {
          id:          `wa${Date.now()}`,
          appId:       `WEL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
          schemeId:    params.schemeId,
          schemeName:  scheme?.name ?? '',
          citizenId:   params.citizenId,
          citizenName: params.citizenName,
          ward:        params.ward,
          status:      'submitted',
          submittedAt: new Date().toISOString().split('T')[0],
          formData:    params.formData,
          documents:   Object.keys(params.files).map(n => ({ name: n, verified: false })),
        };
      }
      const msg = e?.response?.data?.error ?? e?.message ?? 'Submission failed';
      throw new Error(msg);
    }
  },

  async updateStatus(id: string, status: WelfareApplication['status'],
                      notes?: string, rejectionReason?: string,
                      disbursementAmount?: number, disbursementRef?: string): Promise<WelfareApplication> {
    try {
      const res = await api.patch(`${EP}/applications/${id}/status`, null, {
        params: {
          status: status.toUpperCase(),
          ...(notes              ? { notes }              : {}),
          ...(rejectionReason    ? { rejectionReason }    : {}),
          ...(disbursementAmount ? { disbursementAmount } : {}),
          ...(disbursementRef    ? { disbursementRef }    : {}),
        },
      });
      return appFromBackend(res.data);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? 'Status update failed';
      throw new Error(msg);
    }
  },

  async getStats() {
    try {
      const res = await api.get(`${EP}/stats`);
      return res.data;
    } catch (e: any) {
      if (e?.offline) return {
        totalSchemes: WELFARE_SCHEMES.length,
        activeSchemes: WELFARE_SCHEMES.filter(s => s.status === 'active').length,
        totalBeneficiaries: WELFARE_SCHEMES.reduce((s, w) => s + w.beneficiariesCount, 0),
        totalBudget: WELFARE_SCHEMES.reduce((s, w) => s + w.budget, 0),
        applications: WELFARE_APPLICATIONS.length,
        pending: WELFARE_APPLICATIONS.filter(a => ['submitted','under_review'].includes(a.status)).length,
        totalDisbursed: WELFARE_APPLICATIONS.reduce((s, a) => s + (a.disbursementAmount ?? 0), 0),
      };
      throw e;
    }
  },
};
