import type {
  Citizen, Grievance, ServiceApplication, Department, User
} from '../types';

// ─── Mock Users ────────────────────────────────────────────────────────────────
export const MOCK_USERS: (User & { password: string })[] = [
  {
    id: 'c1',                          // matches DB citizen id
    name: 'Ramesh Kumar',
    email: 'citizen@civicpulse.gov',
    password: 'citizen123',
    role: 'citizen',
    ward: 'Ward 12',
    phone: '9876543210',
    address: '14, Gandhi Nagar, Sector 5',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    createdAt: '2024-01-15',
  },
  {
    id: 'u2',
    name: 'Admin Sharma',
    email: 'admin@civicpulse.gov',
    password: 'admin123',
    role: 'admin',
    department: 'Municipal Administration',
    phone: '9876500001',
    createdAt: '2023-06-01',
  },
  {
    id: 'u3',
    name: 'Commissioner Mehta',
    email: 'commissioner@civicpulse.gov',
    password: 'comm123',
    role: 'commissioner',
    department: 'Commissioner Office',
    phone: '9876500002',
    createdAt: '2023-01-01',
  },
  {
    id: 'u4',
    name: 'Officer Priya Singh',
    email: 'officer@civicpulse.gov',
    password: 'officer123',
    role: 'officer',
    department: 'Water Department',
    phone: '9876500003',
    createdAt: '2023-08-01',
  },
];

// ─── Mock Departments ──────────────────────────────────────────────────────────
export const DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Water Department',       head: 'Suresh Patel',   phone: '044-2001', grievanceCount: 342, resolvedCount: 321, slaCompliance: 94 },
  { id: 'd2', name: 'Road & Infrastructure',  head: 'Kavitha Rao',    phone: '044-2002', grievanceCount: 289, resolvedCount: 265, slaCompliance: 92 },
  { id: 'd3', name: 'Electricity Board',      head: 'Mohan Das',      phone: '044-2003', grievanceCount: 198, resolvedCount: 184, slaCompliance: 93 },
  { id: 'd4', name: 'Sanitation Dept',        head: 'Anita Gupta',    phone: '044-2004', grievanceCount: 156, resolvedCount: 149, slaCompliance: 96 },
  { id: 'd5', name: 'Public Health',          head: 'Dr. Ravi Kumar', phone: '044-2005', grievanceCount: 87,  resolvedCount: 79,  slaCompliance: 91 },
  { id: 'd6', name: 'Education Dept',         head: 'Meera Nair',     phone: '044-2006', grievanceCount: 64,  resolvedCount: 61,  slaCompliance: 95 },
];

// ─── Mock Citizens ─────────────────────────────────────────────────────────────
export const CITIZENS: Citizen[] = [
  { id: 'c1', citizenId: 'CTZ-2024-1247', name: 'Ramesh Kumar',   email: 'ramesh@email.com', phone: '9876543210', ward: 'Ward 12', address: '14, Gandhi Nagar',   aadhaar: '1234-5678-9012', status: 'active', registeredAt: '2024-01-15', grievancesCount: 3, applicationsCount: 2 },
  { id: 'c2', citizenId: 'CTZ-2024-1248', name: 'Priya Sharma',   email: 'priya@email.com',  phone: '9876543211', ward: 'Ward 7',  address: '22, Nehru Street',    aadhaar: '2345-6789-0123', status: 'active', registeredAt: '2024-02-10', grievancesCount: 1, applicationsCount: 3 },
  { id: 'c3', citizenId: 'CTZ-2024-1249', name: 'Arjun Mehta',    email: 'arjun@email.com',  phone: '9876543212', ward: 'Ward 3',  address: '8, MG Road',          aadhaar: '3456-7890-1234', status: 'active', registeredAt: '2024-03-05', grievancesCount: 2, applicationsCount: 1 },
  { id: 'c4', citizenId: 'CTZ-2024-1250', name: 'Sunita Reddy',   email: 'sunita@email.com', phone: '9876543213', ward: 'Ward 15', address: '5, Lake View Colony',  aadhaar: '4567-8901-2345', status: 'active', registeredAt: '2024-03-22', grievancesCount: 0, applicationsCount: 4 },
  { id: 'c5', citizenId: 'CTZ-2024-1251', name: 'Vijay Nair',     email: 'vijay@email.com',  phone: '9876543214', ward: 'Ward 9',  address: '31, Old Town',         aadhaar: '5678-9012-3456', status: 'inactive', registeredAt: '2024-04-01', grievancesCount: 1, applicationsCount: 0 },
  { id: 'c6', citizenId: 'CTZ-2024-1252', name: 'Deepa Krishnan', email: 'deepa@email.com',  phone: '9876543215', ward: 'Ward 5',  address: '17, Park Avenue',      aadhaar: '6789-0123-4567', status: 'active', registeredAt: '2024-04-15', grievancesCount: 4, applicationsCount: 2 },
  { id: 'c7', citizenId: 'CTZ-2024-1253', name: 'Rahul Joshi',    email: 'rahul@email.com',  phone: '9876543216', ward: 'Ward 11', address: '9, Shivaji Nagar',     aadhaar: '7890-1234-5678', status: 'active', registeredAt: '2024-05-02', grievancesCount: 2, applicationsCount: 1 },
  { id: 'c8', citizenId: 'CTZ-2024-1254', name: 'Meena Pillai',   email: 'meena@email.com',  phone: '9876543217', ward: 'Ward 18', address: '43, South Street',     aadhaar: '8901-2345-6789', status: 'active', registeredAt: '2024-05-20', grievancesCount: 1, applicationsCount: 3 },
];

// ─── Mock Grievances ───────────────────────────────────────────────────────────
export const GRIEVANCES: Grievance[] = [
  {
    id: 'g1', grievanceId: 'GRV-2024-847', citizenId: 'c1', citizenName: 'Ramesh Kumar', ward: 'Ward 12',
    category: 'Water Supply', severity: 'high', title: 'No water supply for 3 days',
    description: 'Water supply has been cut off for 3 days in Sector 5. Multiple families affected.',
    status: 'in_progress', assignedDept: 'Water Department', assignedOfficer: 'Officer Priya Singh',
    slaDeadline: '2026-08-12', slaDays: 2,
    escalation: { level: 1, escalatedAt: '2026-08-10', reason: 'SLA approaching' },
    createdAt: '2026-08-08', updatedAt: '2026-08-09',
  },
  {
    id: 'g2', grievanceId: 'GRV-2024-848', citizenId: 'c2', citizenName: 'Priya Sharma', ward: 'Ward 7',
    category: 'Road Maintenance', severity: 'medium', title: 'Pothole causing accidents',
    description: 'Large pothole on Main Street near bus stop. Two accidents already reported.',
    status: 'submitted', assignedDept: 'Road & Infrastructure',
    slaDeadline: '2026-08-15', slaDays: 5,
    createdAt: '2026-08-07', updatedAt: '2026-08-07',
  },
  {
    id: 'g3', grievanceId: 'GRV-2024-849', citizenId: 'c3', citizenName: 'Arjun Mehta', ward: 'Ward 3',
    category: 'Electricity', severity: 'critical', title: 'Power outage entire block',
    description: 'Complete power failure in Block C for 2 days. Hospital generator running low.',
    status: 'escalated', assignedDept: 'Electricity Board', assignedOfficer: 'Officer Mohan Das',
    slaDeadline: '2026-08-09', slaDays: 1,
    escalation: { level: 2, escalatedAt: '2026-08-09', reason: 'Critical - hospital affected' },
    createdAt: '2026-08-07', updatedAt: '2026-08-09',
  },
  {
    id: 'g4', grievanceId: 'GRV-2024-850', citizenId: 'c4', citizenName: 'Sunita Reddy', ward: 'Ward 15',
    category: 'Sanitation', severity: 'high', title: 'Garbage not collected for a week',
    description: 'Waste accumulation on street corners causing health hazards.',
    status: 'resolved', assignedDept: 'Sanitation Dept',
    slaDeadline: '2026-08-05', slaDays: 3,
    resolution: 'Garbage collected. Daily schedule restored.',
    createdAt: '2026-07-28', updatedAt: '2026-08-04',
  },
  {
    id: 'g5', grievanceId: 'GRV-2024-851', citizenId: 'c6', citizenName: 'Deepa Krishnan', ward: 'Ward 5',
    category: 'Public Safety', severity: 'medium', title: 'Street lights not working',
    description: '8 street lights on Park Avenue non-functional for 2 weeks.',
    status: 'in_progress', assignedDept: 'Electricity Board',
    slaDeadline: '2026-08-14', slaDays: 4,
    createdAt: '2026-08-06', updatedAt: '2026-08-08',
  },
  {
    id: 'g6', grievanceId: 'GRV-2024-852', citizenId: 'c7', citizenName: 'Rahul Joshi', ward: 'Ward 11',
    category: 'Water Supply', severity: 'low', title: 'Low water pressure',
    description: 'Inadequate water pressure in morning hours.',
    status: 'submitted', assignedDept: 'Water Department',
    slaDeadline: '2026-08-18', slaDays: 7,
    createdAt: '2026-08-08', updatedAt: '2026-08-08',
  },
];

// ─── Mock Service Applications ─────────────────────────────────────────────────
export const APPLICATIONS: ServiceApplication[] = [
  {
    id: 'a1', appId: 'APP-2024-1247', citizenId: 'c2', citizenName: 'Priya Sharma',
    type: 'Birth Certificate', category: 'certificate', status: 'approved',
    documents: [
      { name: 'Hospital Record', verified: true },
      { name: 'Aadhaar Card', verified: true },
      { name: 'Parent ID', verified: true },
    ],
    submittedAt: '2026-08-01', approvedAt: '2026-08-03', issuedAt: '2026-08-03',
    certificateNo: 'BC-2024-1247', fee: 50, feePaid: true, assignedOfficer: 'Officer Priya Singh',
  },
  {
    id: 'a2', appId: 'APP-2024-1248', citizenId: 'c1', citizenName: 'Ramesh Kumar',
    type: 'Income Certificate', category: 'certificate', status: 'under_review',
    documents: [
      { name: 'Salary Slip', verified: true },
      { name: 'Bank Statement', verified: false },
      { name: 'Aadhaar Card', verified: true },
    ],
    submittedAt: '2026-08-05', fee: 30, feePaid: true, assignedOfficer: 'Officer Priya Singh',
  },
  {
    id: 'a3', appId: 'APP-2024-1249', citizenId: 'c4', citizenName: 'Sunita Reddy',
    type: 'Trade License', category: 'permit', status: 'documents_pending',
    documents: [
      { name: 'Business Registration', verified: true },
      { name: 'NOC from Fire Dept', verified: false },
      { name: 'Aadhaar Card', verified: true },
    ],
    submittedAt: '2026-08-03', fee: 200, feePaid: true,
    notes: 'Awaiting NOC from Fire Department',
  },
  {
    id: 'a4', appId: 'APP-2024-1250', citizenId: 'c3', citizenName: 'Arjun Mehta',
    type: 'Residence Certificate', category: 'certificate', status: 'issued',
    documents: [
      { name: 'Utility Bill', verified: true },
      { name: 'Aadhaar Card', verified: true },
      { name: 'Landlord Declaration', verified: true },
    ],
    submittedAt: '2026-07-28', approvedAt: '2026-07-30', issuedAt: '2026-07-30',
    certificateNo: 'RC-2024-1250', fee: 30, feePaid: true,
  },
  {
    id: 'a5', appId: 'APP-2024-1251', citizenId: 'c6', citizenName: 'Deepa Krishnan',
    type: 'Building Permit', category: 'permit', status: 'submitted',
    documents: [
      { name: 'Site Plan', verified: false },
      { name: 'Property Documents', verified: false },
      { name: 'Structural Certificate', verified: false },
    ],
    submittedAt: '2026-08-08', fee: 500, feePaid: false,
  },
  {
    id: 'a6', appId: 'APP-2024-1252', citizenId: 'c8', citizenName: 'Meena Pillai',
    type: 'Death Certificate', category: 'certificate', status: 'approved',
    documents: [
      { name: 'Hospital Death Record', verified: true },
      { name: 'Aadhaar Card', verified: true },
    ],
    submittedAt: '2026-08-06', approvedAt: '2026-08-07', issuedAt: '2026-08-07',
    certificateNo: 'DC-2024-1252', fee: 50, feePaid: true,
  },
];

// ─── Chart Data ────────────────────────────────────────────────────────────────
export const GRIEVANCE_TREND = [
  { month: 'Mar', filed: 380, resolved: 355 },
  { month: 'Apr', filed: 410, resolved: 388 },
  { month: 'May', filed: 395, resolved: 372 },
  { month: 'Jun', filed: 442, resolved: 420 },
  { month: 'Jul', filed: 398, resolved: 379 },
  { month: 'Aug', filed: 420, resolved: 398 },
];

export const GRIEVANCE_BY_CATEGORY = [
  { name: 'Water Supply',      value: 342, color: '#14b8a6' },
  { name: 'Road Maintenance',  value: 289, color: '#8b5cf6' },
  { name: 'Electricity',       value: 198, color: '#f59e0b' },
  { name: 'Sanitation',        value: 156, color: '#10b981' },
  { name: 'Public Safety',     value: 87,  color: '#ef4444' },
  { name: 'Other',             value: 64,  color: '#6366f1' },
];

export const CERT_TREND = [
  { month: 'Mar', issued: 6200, applications: 6500 },
  { month: 'Apr', issued: 7100, applications: 7400 },
  { month: 'May', issued: 6800, applications: 7000 },
  { month: 'Jun', issued: 7500, applications: 7800 },
  { month: 'Jul', issued: 6900, applications: 7100 },
  { month: 'Aug', issued: 7200, applications: 7500 },
];
