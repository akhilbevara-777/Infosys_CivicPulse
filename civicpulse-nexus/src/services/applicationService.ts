import type { ServiceApplication, ApplicationStatus, CertificateType, PermitType, DigitalSignature } from '../types';
import { APPLICATIONS } from '../data/mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Workflow step templates (used for progress display in UI) ─────────────────
export const WORKFLOW_TEMPLATES: Record<string, { steps: { name: string; assignedRole: string; days: number }[] }> = {
  certificate: {
    steps: [
      { name: 'Application Received',      assignedRole: 'system',       days: 0 },
      { name: 'Document Verification',     assignedRole: 'officer',      days: 2 },
      { name: 'Field Verification',        assignedRole: 'officer',      days: 3 },
      { name: 'Supervisor Review',         assignedRole: 'admin',        days: 1 },
      { name: 'Digital Signing',           assignedRole: 'commissioner', days: 1 },
      { name: 'Certificate Generation',    assignedRole: 'system',       days: 0 },
      { name: 'Dispatch / Download Ready', assignedRole: 'system',       days: 0 },
    ],
  },
  permit: {
    steps: [
      { name: 'Application Received',      assignedRole: 'system',       days: 0 },
      { name: 'Document Verification',     assignedRole: 'officer',      days: 3 },
      { name: 'Site Inspection',           assignedRole: 'officer',      days: 5 },
      { name: 'NOC Collection',            assignedRole: 'officer',      days: 7 },
      { name: 'Technical Review',          assignedRole: 'admin',        days: 3 },
      { name: 'Commissioner Approval',     assignedRole: 'commissioner', days: 2 },
      { name: 'Digital Signing',           assignedRole: 'commissioner', days: 1 },
      { name: 'License Issuance',          assignedRole: 'system',       days: 0 },
    ],
  },
};

// ─── Workflow state machine ───────────────────────────────────────────────────
export const WORKFLOW_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted:             ['under_review', 'cancelled', 'rejected'],
  under_review:          ['document_verification', 'documents_pending', 'pending_information', 'rejected'],
  document_verification: ['documents_pending', 'verified', 'rejected'],
  documents_pending:     ['document_verification', 'rejected'],
  pending_information:   ['under_review', 'rejected'],
  verified:              ['approved', 'rejected'],
  approved:              ['issued', 'rejected'],
  issued:                [],
  rejected:              [],
  cancelled:             [],
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted:             'Submitted',
  under_review:          'Under Review',
  document_verification: 'Document Verification',
  documents_pending:     'Documents Pending',
  pending_information:   'Information Needed',
  verified:              'Verified',
  approved:              'Approved',
  issued:                'Issued',
  rejected:              'Rejected',
  cancelled:             'Cancelled',
};

// ─── Processing fee lookup ────────────────────────────────────────────────────
export const SERVICE_FEES: Record<string, number> = {
  'Birth Certificate': 50,
  'Death Certificate': 50,
  'Income Certificate': 30,
  'Residence Certificate': 30,
  'Marriage Certificate': 100,
  'Caste Certificate': 0,
  'Trade License': 200,
  'Building Permit': 500,
  'Food License': 150,
  'Event Permit': 75,
  'Signage Permit': 50,
};

// ─── Required documents lookup ────────────────────────────────────────────────
export const REQUIRED_DOCS: Record<string, string[]> = {
  'Birth Certificate':     ['Hospital Record', 'Aadhaar Card', 'Parent ID'],
  'Death Certificate':     ['Hospital Death Record', 'Aadhaar Card'],
  'Income Certificate':    ['Salary Slip', 'Bank Statement', 'Aadhaar Card'],
  'Residence Certificate': ['Utility Bill', 'Aadhaar Card', 'Landlord Declaration'],
  'Marriage Certificate':  ['Marriage Photos', 'Aadhaar Cards (both)', 'Witness IDs'],
  'Caste Certificate':     ['Aadhaar Card', 'Parent Caste Certificate', 'School Records'],
  'Trade License':         ['Business Registration', 'NOC from Fire Dept', 'Aadhaar Card'],
  'Building Permit':       ['Site Plan', 'Property Documents', 'Structural Certificate'],
  'Food License':          ['Identity Proof', 'Premises Proof', 'NOC'],
  'Event Permit':          ['Event Details', 'Venue Proof', 'Police NOC'],
  'Signage Permit':        ['Signage Design', 'Location Photos', 'Owner Consent'],
};

// ─── Certificate number generator ────────────────────────────────────────────
export function generateCertificateNumber(type: string): string {
  const prefix: Record<string, string> = {
    'Birth Certificate': 'BC',
    'Death Certificate': 'DC',
    'Income Certificate': 'IC',
    'Residence Certificate': 'RC',
    'Marriage Certificate': 'MC',
    'Caste Certificate': 'CC',
    'Trade License': 'TL',
    'Building Permit': 'BP',
    'Food License': 'FL',
    'Event Permit': 'EP',
    'Signage Permit': 'SP',
  };
  const p = prefix[type] ?? 'DOC';
  return `${p}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ─── Digital signature generator ─────────────────────────────────────────────
export function generateDigitalSignature(signedBy: string): DigitalSignature {
  return {
    signedBy,
    signedAt: new Date().toISOString(),
    signatureId: `SIG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    verificationCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
  };
}

// ─── QR / verification code ───────────────────────────────────────────────────
export function generateQRCode(certNo: string, citizenName: string): string {
  return `CIVICPULSE:VERIFY:${certNo}:${citizenName.replace(/\s/g, '_').toUpperCase()}`;
}

// ─── Validity period by type ──────────────────────────────────────────────────
export function getValidityPeriod(type: string): string | undefined {
  const VALIDITY: Record<string, number> = {
    'Trade License': 1, 'Food License': 1, 'Event Permit': 0,
    'Building Permit': 2, 'Signage Permit': 1,
  };
  const years = VALIDITY[type];
  if (years === undefined) return undefined; // certificates don't expire
  if (years === 0) return 'single-use';
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

// ─── Download certificate as formatted HTML ───────────────────────────────────
export function downloadCertificate(app: ServiceApplication): void {
  const certNo = app.certificateNo ?? 'N/A';
  const sig = app.digitalSignature;
  const qr = app.qrCode ?? generateQRCode(certNo, app.citizenName);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${app.type} — ${certNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; background: #f8f9fa; display: flex; justify-content: center; align-items: flex-start; padding: 40px 20px; }
    .cert { background: #fff; width: 794px; min-height: 1123px; border: 3px double #1a5276; padding: 48px; position: relative; }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 80px; color: rgba(20,130,100,0.05); font-weight: bold; white-space: nowrap; pointer-events: none; }
    .header { text-align: center; border-bottom: 2px solid #1a5276; padding-bottom: 20px; margin-bottom: 24px; }
    .emblem { font-size: 48px; margin-bottom: 8px; }
    .org { font-size: 20px; font-weight: bold; color: #1a5276; }
    .org-sub { font-size: 13px; color: #555; margin-top: 4px; }
    .cert-title { font-size: 28px; font-weight: bold; color: #0d6e56; text-align: center; margin: 24px 0; text-transform: uppercase; letter-spacing: 2px; }
    .cert-no { text-align: center; font-size: 13px; color: #666; margin-bottom: 32px; }
    .body-text { font-size: 15px; color: #333; line-height: 1.8; text-align: justify; margin-bottom: 24px; }
    .details { border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: #f9fffe; margin-bottom: 24px; }
    .details-row { display: flex; gap: 16px; margin-bottom: 12px; }
    .details-row:last-child { margin-bottom: 0; }
    .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; width: 160px; flex-shrink: 0; }
    .value { font-size: 14px; color: #111; font-weight: 600; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 48px; padding-top: 24px; border-top: 1px solid #ddd; }
    .sig-block { text-align: center; }
    .sig-line { border-top: 1px solid #333; width: 180px; margin: 0 auto 6px; }
    .sig-name { font-size: 13px; font-weight: bold; color: #1a5276; }
    .sig-title { font-size: 11px; color: #666; }
    .qr-block { text-align: center; }
    .qr-code { font-size: 9px; word-break: break-all; max-width: 140px; color: #555; font-family: monospace; background: #f0f0f0; padding: 8px; border-radius: 4px; }
    .qr-label { font-size: 10px; color: #888; margin-top: 4px; }
    .sig-info { font-size: 10px; color: #888; margin-top: 16px; padding: 10px; background: #f9f9f9; border-radius: 4px; border-left: 3px solid #0d6e56; }
    .valid-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; border-radius: 16px; padding: 4px 12px; font-size: 12px; font-weight: bold; margin-top: 8px; }
    @media print { body { padding: 0; } .cert { border: 3px double #1a5276; } }
  </style>
</head>
<body>
  <div class="cert">
    <div class="watermark">CIVICPULSE NEXUS</div>
    <div class="header">
      <div class="emblem">🏛️</div>
      <div class="org">Municipal Corporation of India</div>
      <div class="org-sub">CivicPulse Nexus — Smart Governance Platform</div>
    </div>

    <div class="cert-title">${app.type}</div>
    <div class="cert-no">Certificate No: <strong>${certNo}</strong> &nbsp;|&nbsp; Application: ${app.appId}</div>

    <p class="body-text">
      This is to certify that <strong>${app.citizenName}</strong> has successfully completed all
      requirements and the application for <strong>${app.type}</strong> has been duly verified,
      processed, and approved by the authorised officials of the Municipal Corporation.
    </p>

    <div class="details">
      ${[
        ['Certificate Number', certNo],
        ['Application ID', app.appId],
        ['Applicant Name', app.citizenName],
        ['Certificate Type', app.type],
        ['Category', app.category.charAt(0).toUpperCase() + app.category.slice(1)],
        ['Date of Issue', app.issuedAt ?? new Date().toISOString().split('T')[0]],
        ['Date Approved', app.approvedAt ?? '—'],
        ['Valid Until', app.validUntil ?? 'Permanent'],
        ['Fee Paid', `₹${app.fee} (${app.feePaid ? 'Paid' : 'Pending'})`],
        ['Assigned Officer', app.assignedOfficer ?? 'Municipal Authority'],
      ].map(([l, v]) => `
        <div class="details-row">
          <span class="label">${l}</span>
          <span class="value">${v}</span>
        </div>
      `).join('')}
    </div>

    ${app.validUntil
      ? `<p style="text-align:center"><span class="valid-badge">⏳ Valid Until: ${app.validUntil}</span></p>`
      : `<p style="text-align:center"><span class="valid-badge">✓ Permanent Certificate</span></p>`
    }

    <div class="footer">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${sig?.signedBy ?? 'Municipal Authority'}</div>
        <div class="sig-title">Authorised Signatory<br/>Municipal Corporation</div>
      </div>
      <div class="qr-block">
        <div class="qr-code">${qr}</div>
        <div class="qr-label">Scan/enter code to verify</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">Commissioner</div>
        <div class="sig-title">Municipal Commissioner<br/>CivicPulse Nexus</div>
      </div>
    </div>

    ${sig ? `
    <div class="sig-info">
      🔐 Digitally Signed by: ${sig.signedBy} &nbsp;|&nbsp;
      Signature ID: ${sig.signatureId} &nbsp;|&nbsp;
      Verification Code: ${sig.verificationCode} &nbsp;|&nbsp;
      Signed At: ${new Date(sig.signedAt).toLocaleString('en-IN')}
    </div>` : ''}

    <p style="text-align:center;font-size:10px;color:#aaa;margin-top:16px;">
      Generated: ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp;
      This is a computer-generated certificate. Verify at civicpulse.gov.in
    </p>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // Fallback: direct download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certNo}_${app.citizenName.replace(/\s/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

const applicationService = {
  async getAll(): Promise<ServiceApplication[]> {
    await delay(400);
    return [...APPLICATIONS];
  },

  async getById(id: string): Promise<ServiceApplication | undefined> {
    await delay(200);
    return APPLICATIONS.find(a => a.id === id);
  },

  async getByCitizen(citizenId: string): Promise<ServiceApplication[]> {
    await delay(300);
    return APPLICATIONS.filter(a => a.citizenId === citizenId);
  },

  async create(data: {
    citizenId: string;
    citizenName: string;
    type: CertificateType | PermitType;
    category: 'certificate' | 'permit';
  }): Promise<ServiceApplication> {
    await delay(700);
    const docs = REQUIRED_DOCS[data.type] ?? ['Identity Proof', 'Aadhaar Card'];
    const fee = SERVICE_FEES[data.type] ?? 50;

    return {
      id: `a${Date.now()}`,
      appId: `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      citizenId: data.citizenId,
      citizenName: data.citizenName,
      type: data.type,
      category: data.category,
      status: 'submitted',
      documents: docs.map(name => ({ name, verified: false })),
      submittedAt: new Date().toISOString().split('T')[0],
      fee,
      feePaid: false,
    };
  },

  async updateStatus(
    app: ServiceApplication,
    status: ApplicationStatus,
    notes?: string
  ): Promise<ServiceApplication> {
    await delay(400);

    const allowed = WORKFLOW_TRANSITIONS[app.status];
    if (!allowed.includes(status)) {
      throw new Error(`Invalid transition: ${app.status} → ${status}`);
    }

    const updates: Partial<ServiceApplication> = { status, notes: notes || app.notes };

    if (status === 'approved') {
      updates.approvedAt = new Date().toISOString().split('T')[0];
    }
    if (status === 'issued') {
      updates.approvedAt = app.approvedAt || new Date().toISOString().split('T')[0];
      updates.issuedAt = new Date().toISOString().split('T')[0];
      updates.certificateNo = generateCertificateNumber(app.type);
      updates.digitalSignature = generateDigitalSignature('Commissioner Mehta');
      updates.qrCode = generateQRCode(updates.certificateNo, app.citizenName);
      updates.validUntil = getValidityPeriod(app.type);
      updates.downloadCount = 0;
    }

    return { ...app, ...updates };
  },

  async verifyDocument(app: ServiceApplication, docName: string): Promise<ServiceApplication> {
    await delay(200);
    const updated = {
      ...app,
      documents: app.documents.map(d =>
        d.name === docName ? { ...d, verified: true } : d
      ),
    };
    // Auto-advance to verified if all docs are verified
    const allVerified = updated.documents.every(d => d.verified);
    if (allVerified && updated.status === 'documents_pending') {
      return { ...updated, status: 'verified' };
    }
    if (allVerified && updated.status === 'under_review') {
      return { ...updated, status: 'verified' };
    }
    return updated;
  },

  async markFeePaid(app: ServiceApplication): Promise<ServiceApplication> {
    await delay(300);
    return { ...app, feePaid: true };
  },

  async signApplication(app: ServiceApplication, signerName: string): Promise<ServiceApplication> {
    await delay(500);
    return {
      ...app,
      digitalSignature: generateDigitalSignature(signerName),
    };
  },

  async trackDownload(app: ServiceApplication): Promise<ServiceApplication> {
    await delay(100);
    return {
      ...app,
      downloadCount: (app.downloadCount ?? 0) + 1,
      lastDownloadedAt: new Date().toISOString(),
    };
  },

  async assignOfficer(app: ServiceApplication, officer: string, dept?: string): Promise<ServiceApplication> {
    await delay(300);
    return {
      ...app,
      assignedOfficer: officer,
      assignedDept: dept ?? app.assignedDept,
      status: app.status === 'submitted' ? 'under_review' : app.status,
    };
  },
};

export default applicationService;
