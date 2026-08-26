import { api } from './client';
import type { ServiceApplication, ApplicationStatus, ApplicationEvent, CertificateType, PermitType } from '../types';
import { REQUIRED_DOCS, SERVICE_FEES, generateCertificateNumber, generateDigitalSignature,
         generateQRCode, getValidityPeriod, WORKFLOW_TRANSITIONS } from '../services/applicationService';

const EP = '/api/applications';

// Backend enum uses UPPER_SNAKE, frontend uses lower_snake — convert both ways
const statusToBackend = (s: ApplicationStatus) => s.toUpperCase();

const statusFromBackend = (s: string): ApplicationStatus =>
  s.toLowerCase() as ApplicationStatus;

function fromBackend(a: any): ServiceApplication {
  let missingDocuments: string[] | undefined;
  if (a.missingDocumentsJson) {
    try { missingDocuments = JSON.parse(a.missingDocumentsJson); } catch { missingDocuments = []; }
  }
  return {
    ...a,
    status:            statusFromBackend(a.status),
    category:          (a.category ?? '').toLowerCase() as 'certificate' | 'permit',
    documents:         (() => { try { return JSON.parse(a.documentsJson ?? '[]'); } catch { return []; } })(),
    digitalSignature:  a.signedBy ? { signedBy: a.signedBy, signedAt: a.issuedAt ?? '', signatureId: a.signatureId ?? '', verificationCode: a.verificationCode ?? '' } : undefined,
    missingDocuments,
    // Normalise date strings
    submittedAt:       a.submittedAt?.toString() ?? '',
    approvedAt:        a.approvedAt?.toString(),
    issuedAt:          a.issuedAt?.toString(),
    updatedAt:         a.updatedAt?.toString(),
    expectedCompletionDate: a.expectedCompletionDate?.toString(),
  };
}

function eventFromBackend(e: any): ApplicationEvent {
  return {
    ...e,
    status: statusFromBackend(e.status),
    createdAt: e.createdAt?.toString() ?? '',
  };
}

export const applicationApi = {
  async getAll(search?: string): Promise<ServiceApplication[]> {
    try {
      const res = await api.get(EP, { params: search ? { search } : {} });
      return (res.data as any[]).map(fromBackend);
    } catch (e: any) {
      if (e?.offline) return [];   // citizen store starts empty — no mock bleed
      throw e;
    }
  },

  async getByCitizen(citizenId: string): Promise<ServiceApplication[]> {
    try {
      const res = await api.get(EP, { params: { citizenId } });
      return (res.data as any[]).map(fromBackend);
    } catch (e: any) {
      if (e?.offline) return [];   // start empty offline; citizen won't see other people's data
      throw e;
    }
  },

  async getById(id: string): Promise<ServiceApplication> {
    try {
      const res = await api.get(`${EP}/${id}`);
      return fromBackend(res.data);
    } catch (e: any) {
      throw e;
    }
  },

  async getEvents(applicationId: string): Promise<ApplicationEvent[]> {
    try {
      const res = await api.get(`${EP}/${applicationId}/events`);
      return (res.data as any[]).map(eventFromBackend);
    } catch (e: any) {
      if (e?.offline) return [];
      throw e;
    }
  },

  async create(data: { citizenId: string; citizenName: string; type: CertificateType | PermitType; category: 'certificate' | 'permit' }): Promise<ServiceApplication> {
    try {
      const res = await api.post(EP, { ...data, category: data.category.toUpperCase() });
      return fromBackend(res.data);
    } catch (e: any) {
      if (e?.offline) return {
        id: `a${Date.now()}`,
        appId: `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        ...data,
        status: 'submitted',
        documents: (REQUIRED_DOCS[data.type] ?? []).map(name => ({ name, verified: false })),
        submittedAt: new Date().toISOString().split('T')[0],
        fee: SERVICE_FEES[data.type] ?? 50,
        feePaid: false,
        downloadCount: 0,
      };
      throw e;
    }
  },

  async updateStatus(app: ServiceApplication, status: ApplicationStatus, notes?: string): Promise<ServiceApplication> {
    try {
      const res = await api.patch(`${EP}/${app.id}/status`, null,
        { params: { status: statusToBackend(status), ...(notes ? { notes } : {}) } });
      return fromBackend(res.data);
    } catch (e: any) {
      if (e?.offline) {
        const allowed = WORKFLOW_TRANSITIONS[app.status] ?? [];
        if (!allowed.includes(status)) throw new Error(`Invalid transition: ${app.status} → ${status}`);
        const updates: Partial<ServiceApplication> = { status, notes: notes ?? app.notes };
        if (status === 'approved') updates.approvedAt = new Date().toISOString().split('T')[0];
        if (status === 'issued') {
          updates.approvedAt = app.approvedAt ?? new Date().toISOString().split('T')[0];
          updates.issuedAt = new Date().toISOString().split('T')[0];
          updates.certificateNo = generateCertificateNumber(app.type);
          updates.digitalSignature = generateDigitalSignature('Commissioner Mehta');
          updates.qrCode = generateQRCode(updates.certificateNo!, app.citizenName);
          updates.validUntil = getValidityPeriod(app.type);
          updates.downloadCount = 0;
        }
        return { ...app, ...updates };
      }
      throw e;
    }
  },

  async verifyDocument(app: ServiceApplication, docName: string): Promise<ServiceApplication> {
    try {
      const res = await api.patch(`${EP}/${app.id}/verify-document`, null, { params: { docName } });
      return fromBackend(res.data);
    } catch (e: any) {
      if (e?.offline) {
        const updated = { ...app, documents: app.documents.map(d => d.name === docName ? { ...d, verified: true } : d) };
        const allVerified = updated.documents.every(d => d.verified);
        if (allVerified && (app.status === 'documents_pending' || app.status === 'under_review'))
          updated.status = 'verified';
        return updated;
      }
      throw e;
    }
  },

  async markFeePaid(app: ServiceApplication): Promise<ServiceApplication> {
    try {
      const res = await api.patch(`${EP}/${app.id}/fee-paid`);
      return fromBackend(res.data);
    } catch (e: any) {
      if (e?.offline) return { ...app, feePaid: true };
      throw e;
    }
  },

  async assignOfficer(app: ServiceApplication, officer: string, dept?: string): Promise<ServiceApplication> {
    try {
      const res = await api.patch(`${EP}/${app.id}/assign`, null,
        { params: { officer, ...(dept ? { dept } : {}) } });
      return fromBackend(res.data);
    } catch (e: any) {
      if (e?.offline) return { ...app, assignedOfficer: officer, assignedDept: dept ?? app.assignedDept,
        status: app.status === 'submitted' ? 'under_review' : app.status };
      throw e;
    }
  },

  async signApplication(app: ServiceApplication, signerName: string): Promise<ServiceApplication> {
    // Backend signs on issue — for explicit sign call use local generation
    return { ...app, digitalSignature: generateDigitalSignature(signerName) };
  },

  async trackDownload(app: ServiceApplication): Promise<ServiceApplication> {
    try {
      await api.post(`${EP}/${app.id}/download`);
    } catch { /* non-critical */ }
    return { ...app, downloadCount: (app.downloadCount ?? 0) + 1, lastDownloadedAt: new Date().toISOString() };
  },

  async cancelApplication(id: string, citizenId: string, reason?: string): Promise<ServiceApplication> {
    try {
      const res = await api.delete(`${EP}/${id}`, { params: { citizenId, ...(reason ? { reason } : {}) } });
      return fromBackend(res.data);
    } catch (e: any) {
      if (e?.offline) throw new Error('Cannot cancel while offline');
      const msg = e?.response?.data?.error ?? e?.message ?? 'Cancellation failed';
      throw new Error(msg);
    }
  },

  /** Full submission with files + dynamic form data */
  async submitWithFiles(params: {
    citizenId: string;
    citizenName: string;
    type: string;
    category: 'certificate' | 'permit';
    formData: Record<string, string>;
    files: Record<string, File>;   // docName → File
  }): Promise<ServiceApplication> {
    const fd = new FormData();
    fd.append('citizenId',    params.citizenId);
    fd.append('citizenName',  params.citizenName);
    fd.append('type',         params.type);
    fd.append('category',     params.category);
    fd.append('formDataJson', JSON.stringify(params.formData));

    // Attach each file with the document name as the key
    Object.entries(params.files).forEach(([docName, file]) => {
      fd.append(docName, file);
    });

    try {
      const res = await api.post(`${EP}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return fromBackend(res.data);
    } catch (e: any) {
      if (e?.offline) {
        // Graceful offline fallback — create local record
        return {
          id: `a${Date.now()}`,
          appId: `APP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
          citizenId: params.citizenId,
          citizenName: params.citizenName,
          type: params.type as any,
          category: params.category,
          status: 'submitted',
          documents: Object.keys(params.files).map(name => ({ name, verified: false })),
          submittedAt: new Date().toISOString().split('T')[0],
          fee: SERVICE_FEES[params.type] ?? 50,
          feePaid: false,
          downloadCount: 0,
        };
      }
      // Re-throw backend validation errors with clean message
      const msg = e?.response?.data?.error ?? e?.message ?? 'Submission failed';
      throw new Error(msg);
    }
  },
};
