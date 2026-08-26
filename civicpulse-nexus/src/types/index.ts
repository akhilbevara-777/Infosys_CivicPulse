// ─── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = 'citizen' | 'admin' | 'officer' | 'commissioner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  ward?: string;
  department?: string;
  aadhaar?: string;
  createdAt: string;
}

// ─── Citizen ─────────────────────────────────────────────────────────────────
export interface Citizen {
  id: string;
  citizenId: string;
  name: string;
  email: string;
  phone: string;
  ward: string;
  address: string;
  aadhaar: string;
  status: 'active' | 'inactive' | 'suspended';
  registeredAt: string;
  grievancesCount: number;
  applicationsCount: number;
}

// ─── Grievance ────────────────────────────────────────────────────────────────
export type GrievanceCategory =
  | 'Water Supply'
  | 'Road Maintenance'
  | 'Electricity'
  | 'Sanitation'
  | 'Public Safety'
  | 'Healthcare'
  | 'Education'
  | 'Other';

export type GrievanceSeverity = 'low' | 'medium' | 'high' | 'critical';

export type GrievanceStatus =
  | 'submitted'
  | 'acknowledged'
  | 'assigned'
  | 'in_progress'
  | 'pending_citizen'
  | 'escalated'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'rejected';

export type GrievanceSLAStatus = 'ON_TRACK' | 'DUE_SOON' | 'BREACHED' | 'RESOLVED';

export interface GrievanceEscalation {
  level: number;
  escalatedAt: string;
  reason: string;
}

export interface GrievanceHistoryEntry {
  id: string;
  grievanceId: string;
  status: GrievanceStatus;
  label: string;
  description?: string;
  actorName?: string;
  actorRole?: string;
  remarks?: string;
  createdAt: string;
}

export interface Grievance {
  id: string;
  grievanceId: string;
  citizenId: string;
  citizenName: string;
  ward: string;
  category: GrievanceCategory;
  severity: GrievanceSeverity;
  title: string;
  description: string;
  status: GrievanceStatus;
  assignedDept: string;
  assignedOfficer?: string;
  slaDeadline: string;
  slaDays: number;
  slaStatus?: GrievanceSLAStatus;
  slaRemainingDays?: number;
  escalation?: GrievanceEscalation;
  resolution?: string;
  resolvedAt?: string;
  officerMessage?: string;
  citizenResponse?: string;
  citizenResponseAt?: string;
  reopenReason?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Digital Signature ───────────────────────────────────────────────────────
export interface DigitalSignature {
  signedBy: string;
  signedAt: string;
  signatureId: string;
  verificationCode: string;
}

// ─── Service / Certificate ────────────────────────────────────────────────────
export type CertificateType =
  | 'Birth Certificate'
  | 'Death Certificate'
  | 'Income Certificate'
  | 'Residence Certificate'
  | 'Marriage Certificate'
  | 'Caste Certificate';

export type PermitType =
  | 'Trade License'
  | 'Building Permit'
  | 'Food License'
  | 'Event Permit'
  | 'Signage Permit';

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'document_verification'
  | 'documents_pending'
  | 'pending_information'
  | 'verified'
  | 'approved'
  | 'rejected'
  | 'issued'
  | 'cancelled';

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  label: string;
  description?: string;
  officerName?: string;
  officerRemarks?: string;
  createdAt: string;
}

export interface ServiceApplication {
  id: string;
  appId: string;
  citizenId: string;
  citizenName: string;
  type: CertificateType | PermitType;
  category: 'certificate' | 'permit';
  status: ApplicationStatus;
  documents: { name: string; verified: boolean; uploadedAt?: string; fileUrl?: string }[];
  submittedAt: string;
  updatedAt?: string;
  approvedAt?: string;
  issuedAt?: string;
  expectedCompletionDate?: string;
  certificateNo?: string;
  department?: string;
  fee: number;
  feePaid: boolean;
  assignedOfficer?: string;
  assignedDept?: string;
  notes?: string;
  rejectionReason?: string;
  missingDocuments?: string[];
  // Workflow
  workflowInstanceId?: string;
  currentWorkflowStep?: number;
  // Digital certificate
  digitalSignature?: DigitalSignature;
  downloadCount?: number;
  lastDownloadedAt?: string;
  qrCode?: string;
  validUntil?: string;
}

// ─── Department ───────────────────────────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  head: string;
  phone: string;
  grievanceCount: number;
  resolvedCount: number;
  slaCompliance: number;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  totalCitizens: number;
  grievancesThisMonth: number;
  resolutionRate: number;
  avgApprovalDays: number;
  certificatesIssued: number;
  applicationsThisMonth: number;
  pendingGrievances: number;
  escalatedGrievances: number;
}

// ─── Workflow ─────────────────────────────────────────────────────────────────
export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'skipped';

export interface WorkflowStep {
  id: string;
  name: string;
  assignedRole: string;
  assignedTo?: string;
  status: WorkflowStepStatus;
  completedAt?: string;
  notes?: string;
  dueDate: string;
}

export interface WorkflowInstance {
  id: string;
  referenceId: string;
  referenceType: 'application' | 'grievance';
  templateName: string;
  currentStep: number;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  slaDeadline: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  digitalSignature?: DigitalSignature;
}

// ─── Certificate (enhanced) ───────────────────────────────────────────────────
export interface Certificate {
  id: string;
  certificateNo: string;
  type: string;
  citizenId: string;
  citizenName: string;
  citizenWard?: string;
  applicationId: string;
  issuedBy: string;
  issuedAt: string;
  validUntil?: string;
  digitalSignature: DigitalSignature;
  downloadCount: number;
  lastDownloadedAt?: string;
  qrCode: string;          // verification URL / code
  status: 'active' | 'revoked' | 'expired';
}

// ─── Welfare ──────────────────────────────────────────────────────────────────
export type WelfareSchemeCategory = 'Housing' | 'Education' | 'Healthcare' | 'Agriculture' | 'Women & Child' | 'Senior Citizen' | 'Disability' | 'Employment';

export interface WelfareScheme {
  id: string;
  name: string;
  category: WelfareSchemeCategory;
  description: string;
  eligibility: string[];
  benefits: string;
  documentsRequired: string[];
  applicationDeadline?: string;
  budget: number;           // allocated budget in INR
  beneficiariesCount: number;
  status: 'active' | 'inactive' | 'upcoming';
  department: string;
  createdAt: string;
}

export interface WelfareApplication {
  id: string;
  appId: string;
  schemeId: string;
  schemeName: string;
  citizenId: string;
  citizenName: string;
  ward: string;
  status: 'submitted' | 'under_verification' | 'eligibility_check' | 'approved' | 'rejected' | 'disbursement_pending' | 'disbursed';
  submittedAt: string;
  updatedAt?: string;
  approvedAt?: string;
  disbursedAt?: string;
  disbursementAmount?: number;
  disbursementReference?: string;
  rejectionReason?: string;
  notes?: string;
  formData?: Record<string, string>;
  documents?: { name: string; verified: boolean; fileUrl?: string }[];
  eligibilityResult?: string[];
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotifType =
  | 'GRIEVANCE_SUBMITTED' | 'GRIEVANCE_STATUS_CHANGED' | 'GRIEVANCE_ASSIGNED'
  | 'GRIEVANCE_SLA_WARNING' | 'GRIEVANCE_SLA_BREACHED' | 'GRIEVANCE_RESOLVED'
  | 'APPLICATION_SUBMITTED' | 'APPLICATION_STATUS_CHANGED' | 'DOCUMENT_REQUIRED'
  | 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' | 'CERTIFICATE_ISSUED'
  | 'WELFARE_SUBMITTED' | 'WELFARE_APPROVED' | 'WELFARE_REJECTED' | 'WELFARE_DISBURSED'
  | 'GENERAL_INFORMATION' | 'SYSTEM_ALERT';

export interface AppNotification {
  notificationId: string;
  citizenId: string;
  type: NotifType;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: 'GRIEVANCE' | 'APPLICATION' | 'WELFARE';
  isRead: boolean;
  createdAt: string;
}

// ─── Budget ───────────────────────────────────────────────────────────────────
export type BudgetCategory = 'Infrastructure' | 'Healthcare' | 'Education' | 'Welfare' | 'Administration' | 'Emergency' | 'Maintenance';

export interface BudgetAllocation {
  id: string;
  department: string;
  category: BudgetCategory;
  fiscalYear: string;
  allocatedAmount: number;
  spentAmount: number;
  committedAmount: number;
  description: string;
  approvedBy: string;
  approvedAt: string;
  lastUpdated: string;
}

export interface BudgetTransaction {
  id: string;
  allocationId: string;
  department: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  referenceId?: string;     // grievance/application ID
  createdAt: string;
  createdBy: string;
}

// ─── Asset ────────────────────────────────────────────────────────────────────
export type AssetCategory = 'Infrastructure' | 'Vehicle' | 'Equipment' | 'IT Asset' | 'Building' | 'Land';
export type AssetStatus = 'operational' | 'under_maintenance' | 'decommissioned' | 'disposed';

export interface MunicipalAsset {
  id: string;
  assetId: string;
  name: string;
  category: AssetCategory;
  department: string;
  location: string;
  purchaseDate: string;
  purchaseValue: number;
  currentValue: number;
  status: AssetStatus;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  assignedTo?: string;
  description: string;
}
