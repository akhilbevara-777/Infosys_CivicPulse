import { api } from './client';

export type DocVerificationStatus =
  | 'UPLOADED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'REUPLOAD_REQUIRED';

export type DocEntityType = 'APPLICATION' | 'WELFARE_APPLICATION' | 'GRIEVANCE' | 'PROFILE';

export interface DocumentMeta {
  documentId: string;
  ownerIdentity: string;
  documentType: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  verificationStatus: DocVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  entityId?: string;
  entityType?: DocEntityType;
}

const EP = '/api/documents';

export const documentApi = {
  /** Upload a file — all security validation happens server-side */
  async upload(params: {
    file: File;
    ownerIdentity: string;
    documentType: string;
    entityId?: string;
    entityType?: DocEntityType;
  }): Promise<DocumentMeta> {
    const fd = new FormData();
    fd.append('file',          params.file);
    fd.append('ownerIdentity', params.ownerIdentity);
    fd.append('documentType',  params.documentType);
    if (params.entityId)   fd.append('entityId',   params.entityId);
    if (params.entityType) fd.append('entityType', params.entityType);

    const res = await api.post(EP, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },

  /** List all documents for a citizen */
  async getByOwner(ownerId: string): Promise<DocumentMeta[]> {
    try {
      const res = await api.get(EP, { params: { ownerId } });
      return res.data;
    } catch { return []; }
  },

  /** List documents for a specific entity (e.g. application) */
  async getByEntity(entityId: string, entityType: DocEntityType): Promise<DocumentMeta[]> {
    try {
      const res = await api.get(`${EP}/entity/${entityId}`, { params: { entityType } });
      return res.data;
    } catch { return []; }
  },

  /**
   * Authorised download — returns a Blob via backend stream.
   * Never exposes raw file path to the browser.
   */
  async download(documentId: string, requesterId: string): Promise<{ blob: Blob; filename: string }> {
    const res = await api.get(`${EP}/${documentId}/download`, {
      params: { requesterId },
      responseType: 'blob',
    });
    // Extract filename from Content-Disposition header
    const cd       = res.headers['content-disposition'] ?? '';
    const match    = cd.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'document';
    return { blob: res.data, filename };
  },

  /** Open document in new tab (for preview-safe types like PDF/image) */
  async preview(documentId: string, requesterId: string): Promise<void> {
    const { blob, filename } = await documentApi.download(documentId, requesterId);
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Fallback: direct download
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  },

  /** Replace / re-upload a document */
  async replace(documentId: string, requesterId: string, file: File): Promise<DocumentMeta> {
    const fd = new FormData();
    fd.append('file',        file);
    fd.append('requesterId', requesterId);
    const res = await api.put(`${EP}/${documentId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /** Delete a document (citizen can only delete unverified) */
  async delete(documentId: string, requesterId: string): Promise<void> {
    await api.delete(`${EP}/${documentId}`, { params: { requesterId } });
  },

  /** Admin: verify or reject a document */
  async verify(documentId: string, officerName: string,
                status: DocVerificationStatus, rejectionReason?: string): Promise<DocumentMeta> {
    const res = await api.patch(`${EP}/${documentId}/verify`, null, {
      params: { officerName, status, ...(rejectionReason ? { rejectionReason } : {}) },
    });
    return res.data;
  },
};
