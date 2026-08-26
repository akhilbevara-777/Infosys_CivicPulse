// ─── Welfare Scheme Configuration Registry ───────────────────────────────────
// Single source of truth for all scheme-specific config

import type { FormField } from './serviceConfig';

export interface EligibilityCriterion {
  id: string;
  label: string;               // shown to citizen
  fieldKey: string;            // which form field to validate
  type: 'age_min' | 'age_max' | 'income_max' | 'boolean' | 'text' | 'select';
  value?: number | string;     // threshold for age/income checks
  required: boolean;           // if false, criterion is informational only
  hint?: string;               // how to satisfy this
}

export interface WelfareSchemeConfig {
  schemeId: string;
  name: string;
  category: string;
  description: string;
  benefits: string;
  processingDays: number;
  eligibilityCriteria: EligibilityCriterion[];
  applicationFields: FormField[];
  requiredDocuments: string[];
  optionalDocuments: string[];
}

export const WELFARE_SCHEME_CONFIG: Record<string, WelfareSchemeConfig> = {

  'ws1': {
    schemeId: 'ws1',
    name: 'Pradhan Mantri Awas Yojana (Urban)',
    category: 'Housing',
    description: 'Affordable housing subsidy for urban poor families.',
    benefits: 'Subsidy up to ₹2.67 lakh on home loans',
    processingDays: 30,
    eligibilityCriteria: [
      { id: 'income', label: 'Annual family income ≤ ₹3 Lakhs', fieldKey: 'annualIncome', type: 'income_max', value: 300000, required: true, hint: 'Enter your total annual household income' },
      { id: 'noPucca', label: 'Does not own a pucca house', fieldKey: 'ownsPuccaHouse', type: 'boolean', value: 'no', required: true, hint: 'Applicant must not already own a pucca house' },
      { id: 'resident', label: 'Permanent resident of the ward', fieldKey: 'isResident', type: 'boolean', value: 'yes', required: true, hint: 'Must be a permanent resident' },
    ],
    applicationFields: [
      { name: 'annualIncome',    label: 'Annual Household Income (₹)', type: 'number',   required: true,  placeholder: 'Total annual family income', min: 0 },
      { name: 'ownsPuccaHouse', label: 'Do you own a pucca house?',   type: 'select',   required: true,  options: ['no', 'yes'] },
      { name: 'isResident',     label: 'Permanent resident of ward?', type: 'select',   required: true,  options: ['yes', 'no'] },
      { name: 'householdSize',  label: 'Household Size',              type: 'number',   required: true,  placeholder: 'Number of family members', min: 1 },
      { name: 'currentHousing', label: 'Current Housing Type',        type: 'select',   required: true,  options: ['Rented','Kuccha house','Homeless','Shared housing'] },
      { name: 'bankAccount',    label: 'Bank Account Number',         type: 'text',     required: true,  placeholder: 'For subsidy disbursement' },
      { name: 'ifsc',           label: 'IFSC Code',                   type: 'text',     required: true,  placeholder: 'Bank IFSC code' },
    ],
    requiredDocuments: ['Aadhaar Card', 'Income Certificate', 'Bank Passbook', 'Property Declaration (Self-certified)'],
    optionalDocuments: ['BPL Card', 'Caste Certificate'],
  },

  'ws2': {
    schemeId: 'ws2',
    name: 'Free Education Scholarship',
    category: 'Education',
    description: 'Full scholarship for meritorious students from BPL families.',
    benefits: '₹5000/year + free textbooks + uniform allowance',
    processingDays: 21,
    eligibilityCriteria: [
      { id: 'bpl',       label: 'Family belongs to BPL category',          fieldKey: 'isBPL',         type: 'boolean', value: 'yes', required: true, hint: 'Must hold a valid BPL card' },
      { id: 'age',       label: 'Student age between 6 and 18 years',       fieldKey: 'studentAge',    type: 'age_min', value: 6,     required: true, hint: 'Enter student\'s age' },
      { id: 'enrolled',  label: 'Enrolled in government school',            fieldKey: 'schoolType',    type: 'select',  value: 'Government', required: true, hint: 'Must be in a government school' },
      { id: 'marks',     label: 'Minimum 60% marks in previous year',       fieldKey: 'previousMarks', type: 'income_max', value: 101, required: false, hint: 'Enter last exam percentage' },
    ],
    applicationFields: [
      { name: 'studentName',    label: 'Student Full Name',              type: 'text',   required: true  },
      { name: 'studentAge',     label: 'Student Age (years)',            type: 'number', required: true,  min: 6, max: 18 },
      { name: 'schoolName',     label: 'School Name',                    type: 'text',   required: true  },
      { name: 'schoolType',     label: 'School Type',                    type: 'select', required: true,  options: ['Government', 'Government-aided', 'Private'] },
      { name: 'grade',          label: 'Current Grade/Class',            type: 'text',   required: true,  placeholder: 'e.g. Class 7' },
      { name: 'previousMarks',  label: 'Previous Year Marks (%)',        type: 'number', required: true,  min: 0, max: 100 },
      { name: 'isBPL',          label: 'Is family BPL?',                 type: 'select', required: true,  options: ['yes', 'no'] },
      { name: 'parentIncome',   label: 'Parent Annual Income (₹)',       type: 'number', required: true,  min: 0 },
    ],
    requiredDocuments: ['Aadhaar Card', 'BPL Card', 'School Enrollment Certificate', 'Previous Year Marksheet'],
    optionalDocuments: ['Birth Certificate', 'Caste Certificate'],
  },

  'ws3': {
    schemeId: 'ws3',
    name: 'Janani Suraksha Yojana',
    category: 'Women & Child',
    description: 'Cash incentive for institutional delivery at government hospitals.',
    benefits: '₹1400 cash benefit post-delivery + free antenatal care',
    processingDays: 14,
    eligibilityCriteria: [
      { id: 'pregnant',  label: 'Pregnant or recently delivered',         fieldKey: 'maternalStatus',    type: 'select', value: 'Pregnant', required: true,  hint: 'Must be pregnant or within 1 year of delivery' },
      { id: 'bpl',       label: 'BPL / SC / ST category',                 fieldKey: 'isBPLOrSCST',       type: 'boolean', value: 'yes', required: true, hint: 'Must be BPL, SC, or ST category' },
      { id: 'resident',  label: 'Resident of the ward',                   fieldKey: 'isResident',        type: 'boolean', value: 'yes', required: true, hint: 'Must be a ward resident' },
    ],
    applicationFields: [
      { name: 'maternalStatus',  label: 'Current Status',                type: 'select',   required: true,  options: ['Pregnant', 'Recently delivered (within 1 year)'] },
      { name: 'expectedDueDate', label: 'Expected Due Date / Delivery Date', type: 'date', required: true  },
      { name: 'hospitalName',    label: 'Hospital / Delivery Institution', type: 'text',   required: true  },
      { name: 'isBPLOrSCST',    label: 'BPL / SC / ST category?',         type: 'select', required: true,  options: ['yes', 'no'] },
      { name: 'isResident',     label: 'Resident of this ward?',          type: 'select', required: true,  options: ['yes', 'no'] },
      { name: 'bankAccount',    label: 'Bank Account No. (for cash transfer)', type: 'text', required: true },
      { name: 'asha',           label: 'ASHA Worker Name (if any)',       type: 'text',   required: false  },
    ],
    requiredDocuments: ['Aadhaar Card', 'BPL / SC / ST Certificate', 'Hospital Antenatal Card'],
    optionalDocuments: ['Hospital Delivery Certificate', 'ASHA Worker Certificate'],
  },

  'ws4': {
    schemeId: 'ws4',
    name: 'Old Age Pension Scheme',
    category: 'Senior Citizen',
    description: 'Monthly pension for destitute elderly citizens.',
    benefits: '₹1000/month pension directly to bank account',
    processingDays: 21,
    eligibilityCriteria: [
      { id: 'age',      label: 'Age 60 years or above',                  fieldKey: 'applicantAge',  type: 'age_min',    value: 60,    required: true,  hint: 'Enter your current age' },
      { id: 'income',   label: 'Annual income ≤ ₹1 Lakh',               fieldKey: 'annualIncome',  type: 'income_max', value: 100000, required: true, hint: 'Total annual income from all sources' },
      { id: 'resident', label: 'Ward resident for at least 5 years',     fieldKey: 'residenceYears',type: 'age_min',    value: 5,     required: true,  hint: 'Years of continuous residence in this ward' },
    ],
    applicationFields: [
      { name: 'applicantAge',    label: 'Your Age (years)',              type: 'number', required: true,  min: 60, max: 120 },
      { name: 'annualIncome',    label: 'Annual Income (₹)',             type: 'number', required: true,  min: 0  },
      { name: 'residenceYears',  label: 'Years resident in this ward',   type: 'number', required: true,  min: 0  },
      { name: 'maritalStatus',   label: 'Marital Status',                type: 'select', required: true,  options: ['Married', 'Widowed', 'Divorced', 'Single'] },
      { name: 'isAlonely',       label: 'Living alone?',                 type: 'select', required: true,  options: ['yes', 'no'] },
      { name: 'bankAccount',     label: 'Bank Account No.',              type: 'text',   required: true  },
      { name: 'ifsc',            label: 'IFSC Code',                     type: 'text',   required: true  },
    ],
    requiredDocuments: ['Aadhaar Card', 'Age Proof (Birth Certificate / School Certificate)', 'Income Certificate', 'Residence Proof'],
    optionalDocuments: ['Pension Book (if any)', 'Bank Passbook'],
  },

  'ws5': {
    schemeId: 'ws5',
    name: 'Disability Support Allowance',
    category: 'Disability',
    description: 'Monthly financial aid for persons with disabilities.',
    benefits: '₹1500/month + free bus pass + priority in govt jobs',
    processingDays: 21,
    eligibilityCriteria: [
      { id: 'cert',    label: 'Holds valid disability certificate (≥ 40%)', fieldKey: 'disabilityPercent', type: 'age_min',    value: 40,    required: true,  hint: 'Enter the disability percentage from your certificate' },
      { id: 'income',  label: 'Annual income ≤ ₹2 Lakhs',                   fieldKey: 'annualIncome',      type: 'income_max', value: 200000, required: true, hint: 'Total annual household income' },
    ],
    applicationFields: [
      { name: 'disabilityType',    label: 'Type of Disability',          type: 'select',  required: true,  options: ['Physical', 'Visual', 'Hearing', 'Mental', 'Multiple'] },
      { name: 'disabilityPercent', label: 'Disability Percentage',       type: 'number',  required: true,  min: 1, max: 100, placeholder: 'As per disability certificate' },
      { name: 'certNumber',        label: 'Disability Certificate No.',  type: 'text',    required: true  },
      { name: 'annualIncome',      label: 'Annual Household Income (₹)', type: 'number',  required: true,  min: 0  },
      { name: 'bankAccount',       label: 'Bank Account No.',            type: 'text',    required: true  },
      { name: 'ifsc',              label: 'IFSC Code',                   type: 'text',    required: true  },
    ],
    requiredDocuments: ['Aadhaar Card', 'Disability Certificate (UDID / District)', 'Income Certificate'],
    optionalDocuments: ['Medical Certificate from Govt Hospital', 'Bank Passbook'],
  },

  'ws6': {
    schemeId: 'ws6',
    name: 'Skill Development & Employment',
    category: 'Employment',
    description: 'Free vocational training and job placement assistance.',
    benefits: 'Free 3-6 month skill training + ₹2500 stipend + placement support',
    processingDays: 14,
    eligibilityCriteria: [
      { id: 'age',       label: 'Age between 18 and 35 years',             fieldKey: 'applicantAge',   type: 'age_min',    value: 18,   required: true,  hint: 'Must be between 18-35 years' },
      { id: 'ageMax',    label: 'Age not exceeding 35 years',              fieldKey: 'applicantAge',   type: 'age_max',    value: 35,   required: true,  hint: 'Maximum age is 35' },
      { id: 'unemployed',label: 'Currently unemployed',                    fieldKey: 'employmentStatus',type: 'select',    value: 'Unemployed', required: true, hint: 'Must be currently unemployed' },
      { id: 'education', label: 'Minimum 10th pass qualification',         fieldKey: 'qualification',  type: 'select',    value: '10th Pass', required: false, hint: 'Minimum 10th standard pass' },
    ],
    applicationFields: [
      { name: 'applicantAge',     label: 'Your Age (years)',              type: 'number', required: true,  min: 18, max: 35 },
      { name: 'employmentStatus', label: 'Employment Status',             type: 'select', required: true,  options: ['Unemployed', 'Part-time', 'Contract', 'Self-employed'] },
      { name: 'qualification',    label: 'Highest Qualification',         type: 'select', required: true,  options: ['Below 10th', '10th Pass', '12th Pass', 'Diploma', 'Graduate', 'Post Graduate'] },
      { name: 'preferredTrade',   label: 'Preferred Trade / Skill',       type: 'select', required: true,  options: ['Plumbing', 'Electrician', 'Welding', 'Computer', 'Tailoring', 'Beauty & Wellness', 'Construction', 'Other'] },
      { name: 'phoneNumber',      label: 'Mobile Number',                 type: 'phone',  required: true  },
    ],
    requiredDocuments: ['Aadhaar Card', 'Educational Certificate (10th Marksheet)'],
    optionalDocuments: ['Caste Certificate', 'BPL Card', 'Previous Employment Record'],
  },
};

export function getWelfareConfig(schemeId: string): WelfareSchemeConfig | undefined {
  return WELFARE_SCHEME_CONFIG[schemeId];
}

// ─── Eligibility evaluator ────────────────────────────────────────────────────
export interface EligibilityResult {
  id: string;
  label: string;
  passed: boolean;
  required: boolean;
  hint?: string;
}

export function evaluateEligibility(
  config: WelfareSchemeConfig,
  formValues: Record<string, string>
): EligibilityResult[] {
  return config.eligibilityCriteria.map(c => {
    const raw = formValues[c.fieldKey] ?? '';
    let passed = false;

    switch (c.type) {
      case 'age_min':
      case 'income_max': {
        const num = parseFloat(raw);
        if (isNaN(num) || raw === '') { passed = false; break; }
        passed = c.type === 'age_min' ? num >= (c.value as number) : num <= (c.value as number);
        break;
      }
      case 'age_max': {
        const num = parseFloat(raw);
        passed = !isNaN(num) && raw !== '' && num <= (c.value as number);
        break;
      }
      case 'boolean':
        passed = raw.toLowerCase() === String(c.value).toLowerCase();
        break;
      case 'select':
        passed = raw === c.value || raw !== '';
        break;
      case 'text':
        passed = raw.trim().length > 0;
        break;
      default:
        passed = raw.trim().length > 0;
    }

    return { id: c.id, label: c.label, passed, required: c.required, hint: c.hint };
  });
}

export function canSubmit(results: EligibilityResult[]): boolean {
  return results.filter(r => r.required).every(r => r.passed);
}
