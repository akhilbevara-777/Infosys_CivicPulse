import type { WelfareScheme, WelfareApplication, WelfareSchemeCategory } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Mock Welfare Schemes ─────────────────────────────────────────────────────
export const WELFARE_SCHEMES: WelfareScheme[] = [
  {
    id: 'ws1', name: 'Pradhan Mantri Awas Yojana (Urban)',
    category: 'Housing', description: 'Affordable housing for urban poor families',
    eligibility: ['Annual income < ₹3L', 'No pucca house', 'Indian citizen'],
    benefits: 'Subsidy up to ₹2.67 lakh on home loans',
    documentsRequired: ['Aadhaar Card', 'Income Certificate', 'Bank Details', 'Property Declaration'],
    budget: 50000000, beneficiariesCount: 1240, status: 'active',
    department: 'Municipal Administration', createdAt: '2024-01-01',
  },
  {
    id: 'ws2', name: 'Free Education Scholarship',
    category: 'Education', description: 'Full scholarship for meritorious students from BPL families',
    eligibility: ['BPL family', 'Age 6-18 years', 'Enrolled in govt school'],
    benefits: '₹5000/year + free textbooks + uniform allowance',
    documentsRequired: ['Aadhaar Card', 'BPL Card', 'School Enrollment Proof', 'Previous Marksheet'],
    budget: 15000000, beneficiariesCount: 3450, status: 'active',
    department: 'Education Dept', createdAt: '2024-01-01',
  },
  {
    id: 'ws3', name: 'Janani Suraksha Yojana',
    category: 'Women & Child', description: 'Cash incentive for institutional delivery',
    eligibility: ['Pregnant women', 'BPL or SC/ST category', 'Institutional delivery'],
    benefits: '₹1400 cash benefit post-delivery + free antenatal care',
    documentsRequired: ['Aadhaar Card', 'BPL Card', 'Hospital Delivery Certificate'],
    budget: 8000000, beneficiariesCount: 890, status: 'active',
    department: 'Public Health', createdAt: '2024-01-01',
  },
  {
    id: 'ws4', name: 'Old Age Pension Scheme',
    category: 'Senior Citizen', description: 'Monthly pension for destitute elderly citizens',
    eligibility: ['Age 60+ years', 'Annual income < ₹1L', 'Resident of ward for 5+ years'],
    benefits: '₹1000/month pension',
    documentsRequired: ['Aadhaar Card', 'Age Proof', 'Income Certificate', 'Residence Proof'],
    budget: 24000000, beneficiariesCount: 2000, status: 'active',
    department: 'Public Health', createdAt: '2024-01-01',
  },
  {
    id: 'ws5', name: 'Disability Support Allowance',
    category: 'Disability', description: 'Monthly financial aid for persons with disabilities',
    eligibility: ['Disability certificate (40%+)', 'Annual income < ₹2L'],
    benefits: '₹1500/month + free bus pass + priority in govt jobs',
    documentsRequired: ['Aadhaar Card', 'Disability Certificate', 'Income Certificate'],
    budget: 6000000, beneficiariesCount: 400, status: 'active',
    department: 'Municipal Administration', createdAt: '2024-01-01',
  },
  {
    id: 'ws6', name: 'Skill Development & Employment',
    category: 'Employment', description: 'Free vocational training and job placement assistance',
    eligibility: ['Age 18-35 years', 'Unemployed', 'Minimum 10th pass'],
    benefits: 'Free 3-6 month skill training + ₹2500 stipend + placement support',
    documentsRequired: ['Aadhaar Card', 'Educational Certificates', 'Unemployment Declaration'],
    applicationDeadline: '2026-09-30',
    budget: 12000000, beneficiariesCount: 650, status: 'active',
    department: 'Municipal Administration', createdAt: '2024-01-01',
  },
];

// ─── Mock Welfare Applications ────────────────────────────────────────────────
export const WELFARE_APPLICATIONS: WelfareApplication[] = [
  {
    id: 'wa1', appId: 'WEL-2024-001', schemeId: 'ws1', schemeName: 'Pradhan Mantri Awas Yojana (Urban)',
    citizenId: 'c1', citizenName: 'Ramesh Kumar', ward: 'Ward 12',
    status: 'approved', submittedAt: '2026-07-01', approvedAt: '2026-07-20',
    disbursedAt: '2026-08-01', disbursementAmount: 267000,
  },
  {
    id: 'wa2', appId: 'WEL-2024-002', schemeId: 'ws4', schemeName: 'Old Age Pension Scheme',
    citizenId: 'c4', citizenName: 'Sunita Reddy', ward: 'Ward 15',
    status: 'under_review', submittedAt: '2026-08-01',
  },
  {
    id: 'wa3', appId: 'WEL-2024-003', schemeId: 'ws2', schemeName: 'Free Education Scholarship',
    citizenId: 'c6', citizenName: 'Deepa Krishnan', ward: 'Ward 5',
    status: 'submitted', submittedAt: '2026-08-05',
  },
  {
    id: 'wa4', appId: 'WEL-2024-004', schemeId: 'ws5', schemeName: 'Disability Support Allowance',
    citizenId: 'c7', citizenName: 'Rahul Joshi', ward: 'Ward 11',
    status: 'rejected', submittedAt: '2026-07-15', notes: 'Disability certificate below 40% threshold',
  },
];

const welfareService = {
  async getSchemes(): Promise<WelfareScheme[]> {
    await delay(300);
    return [...WELFARE_SCHEMES];
  },

  async getSchemesByCategory(category: WelfareSchemeCategory): Promise<WelfareScheme[]> {
    await delay(200);
    return WELFARE_SCHEMES.filter(s => s.category === category);
  },

  async getApplications(): Promise<WelfareApplication[]> {
    await delay(300);
    return [...WELFARE_APPLICATIONS];
  },

  async getApplicationsByCitizen(citizenId: string): Promise<WelfareApplication[]> {
    await delay(200);
    return WELFARE_APPLICATIONS.filter(a => a.citizenId === citizenId);
  },

  async apply(data: {
    schemeId: string;
    citizenId: string;
    citizenName: string;
    ward: string;
  }): Promise<WelfareApplication> {
    await delay(600);
    const scheme = WELFARE_SCHEMES.find(s => s.id === data.schemeId);
    if (!scheme) throw new Error('Scheme not found');
    return {
      id: `wa${Date.now()}`,
      appId: `WEL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      schemeId: data.schemeId,
      schemeName: scheme.name,
      citizenId: data.citizenId,
      citizenName: data.citizenName,
      ward: data.ward,
      status: 'submitted',
      submittedAt: new Date().toISOString().split('T')[0],
    };
  },

  async updateStatus(
    app: WelfareApplication,
    status: WelfareApplication['status'],
    notes?: string,
    disbursementAmount?: number
  ): Promise<WelfareApplication> {
    await delay(400);
    const today = new Date().toISOString().split('T')[0];
    return {
      ...app,
      status,
      notes: notes ?? app.notes,
      approvedAt: status === 'approved' || status === 'disbursed' ? (app.approvedAt ?? today) : undefined,
      disbursedAt: status === 'disbursed' ? today : undefined,
      disbursementAmount: status === 'disbursed' ? disbursementAmount : undefined,
    };
  },

  async getStats(): Promise<{
    totalSchemes: number; activeSchemes: number; totalBeneficiaries: number;
    totalBudget: number; applications: number; pending: number;
  }> {
    await delay(200);
    return {
      totalSchemes: WELFARE_SCHEMES.length,
      activeSchemes: WELFARE_SCHEMES.filter(s => s.status === 'active').length,
      totalBeneficiaries: WELFARE_SCHEMES.reduce((s, w) => s + w.beneficiariesCount, 0),
      totalBudget: WELFARE_SCHEMES.reduce((s, w) => s + w.budget, 0),
      applications: WELFARE_APPLICATIONS.length,
      pending: WELFARE_APPLICATIONS.filter(a => a.status === 'submitted' || a.status === 'under_review').length,
    };
  },
};

export default welfareService;
