// ─── Service Application Configuration Registry ──────────────────────────────
// Single source of truth for all service types: docs, form fields, fees, etc.

export type FieldType = 'text' | 'date' | 'number' | 'phone' | 'aadhaar' | 'select' | 'textarea';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];       // for select fields
  pattern?: RegExp;
  patternMsg?: string;
  min?: number;
  max?: number;
}

export interface ServiceConfig {
  serviceId: string;
  serviceName: string;
  category: 'certificate' | 'permit';
  description: string;
  processingDays: number;
  fee: number;
  department: string;
  requiredDocuments: string[];
  optionalDocuments: string[];
  requiredFormFields: FormField[];
}

const WARD_OPTIONS = Array.from({ length: 20 }, (_, i) => `Ward ${i + 1}`);

export const SERVICE_CONFIG: Record<string, ServiceConfig> = {
  'Birth Certificate': {
    serviceId: 'birth-cert',
    serviceName: 'Birth Certificate',
    category: 'certificate',
    description: 'Official record of birth issued by Municipal Corporation.',
    processingDays: 3,
    fee: 50,
    department: 'Municipal Administration',
    requiredDocuments: ['Hospital Record', 'Aadhaar Card', 'Parent ID'],
    optionalDocuments: ['Baptism Certificate'],
    requiredFormFields: [
      { name: 'childName',    label: 'Child\'s Full Name',  type: 'text',   required: true,  placeholder: 'As to appear on certificate' },
      { name: 'dateOfBirth',  label: 'Date of Birth',       type: 'date',   required: true },
      { name: 'placeOfBirth', label: 'Place of Birth',       type: 'text',   required: true,  placeholder: 'Hospital / Address' },
      { name: 'gender',       label: 'Gender',               type: 'select', required: true,  options: ['Male', 'Female', 'Other'] },
      { name: 'fatherName',   label: 'Father\'s Full Name',  type: 'text',   required: true,  placeholder: 'As per Aadhaar' },
      { name: 'motherName',   label: 'Mother\'s Full Name',  type: 'text',   required: true,  placeholder: 'As per Aadhaar' },
      { name: 'parentAadhaar',label: 'Parent Aadhaar No.',   type: 'aadhaar',required: true,  placeholder: 'XXXX-XXXX-XXXX' },
      { name: 'parentPhone',  label: 'Parent Phone No.',     type: 'phone',  required: true,  placeholder: '10-digit mobile' },
    ],
  },

  'Death Certificate': {
    serviceId: 'death-cert',
    serviceName: 'Death Certificate',
    category: 'certificate',
    description: 'Official record of death for legal and insurance purposes.',
    processingDays: 2,
    fee: 50,
    department: 'Municipal Administration',
    requiredDocuments: ['Hospital Death Record', 'Aadhaar Card'],
    optionalDocuments: ['Post-mortem Report'],
    requiredFormFields: [
      { name: 'deceasedName',  label: 'Name of Deceased',    type: 'text',   required: true },
      { name: 'dateOfDeath',   label: 'Date of Death',        type: 'date',   required: true },
      { name: 'placeOfDeath',  label: 'Place of Death',       type: 'text',   required: true,  placeholder: 'Hospital / Address' },
      { name: 'causeOfDeath',  label: 'Cause of Death',       type: 'text',   required: true },
      { name: 'applicantName', label: 'Applicant\'s Name',    type: 'text',   required: true,  placeholder: 'Person filing this certificate' },
      { name: 'relation',      label: 'Relation to Deceased', type: 'select', required: true,  options: ['Spouse','Son','Daughter','Parent','Sibling','Other'] },
      { name: 'contactPhone',  label: 'Contact Phone',        type: 'phone',  required: true },
    ],
  },

  'Income Certificate': {
    serviceId: 'income-cert',
    serviceName: 'Income Certificate',
    category: 'certificate',
    description: 'Certifies annual family income for government schemes.',
    processingDays: 7,
    fee: 30,
    department: 'Municipal Administration',
    requiredDocuments: ['Salary Slip', 'Bank Statement', 'Aadhaar Card'],
    optionalDocuments: ['IT Returns', 'Form 16'],
    requiredFormFields: [
      { name: 'applicantName',  label: 'Applicant Full Name',   type: 'text',   required: true },
      { name: 'aadhaarNo',      label: 'Aadhaar Number',         type: 'aadhaar',required: true,  placeholder: 'XXXX-XXXX-XXXX' },
      { name: 'occupation',     label: 'Occupation',             type: 'select', required: true,  options: ['Salaried','Self-employed','Daily wages','Farmer','Unemployed','Other'] },
      { name: 'annualIncome',   label: 'Annual Income (₹)',      type: 'number', required: true,  min: 0,    placeholder: 'Total family annual income' },
      { name: 'familyMembers',  label: 'No. of Family Members',  type: 'number', required: true,  min: 1,    max: 20 },
      { name: 'address',        label: 'Residential Address',    type: 'textarea',required: true, placeholder: 'Full address' },
      { name: 'ward',           label: 'Ward',                   type: 'select', required: true,  options: WARD_OPTIONS },
      { name: 'purpose',        label: 'Purpose of Certificate', type: 'text',   required: true,  placeholder: 'e.g. School admission, BPL scheme' },
    ],
  },

  'Residence Certificate': {
    serviceId: 'residence-cert',
    serviceName: 'Residence Certificate',
    category: 'certificate',
    description: 'Proof of domicile / permanent residence.',
    processingDays: 5,
    fee: 30,
    department: 'Municipal Administration',
    requiredDocuments: ['Utility Bill', 'Aadhaar Card', 'Landlord Declaration'],
    optionalDocuments: ['Rental Agreement', 'Voter ID'],
    requiredFormFields: [
      { name: 'applicantName',      label: 'Applicant Full Name',    type: 'text',    required: true },
      { name: 'aadhaarNo',          label: 'Aadhaar Number',          type: 'aadhaar', required: true, placeholder: 'XXXX-XXXX-XXXX' },
      { name: 'residenceAddress',   label: 'Current Address',         type: 'textarea',required: true },
      { name: 'ward',               label: 'Ward',                    type: 'select',  required: true, options: WARD_OPTIONS },
      { name: 'yearsOfResidence',   label: 'Years at this Address',   type: 'number',  required: true, min: 0, max: 100 },
      { name: 'ownershipType',      label: 'Ownership Type',          type: 'select',  required: true, options: ['Own House','Rented','Government Quarters','Family Property'] },
      { name: 'purpose',            label: 'Purpose',                 type: 'text',    required: true, placeholder: 'e.g. Job application, Passport' },
    ],
  },

  'Marriage Certificate': {
    serviceId: 'marriage-cert',
    serviceName: 'Marriage Certificate',
    category: 'certificate',
    description: 'Official marriage registration certificate.',
    processingDays: 10,
    fee: 100,
    department: 'Municipal Administration',
    requiredDocuments: ['Marriage Photos', 'Aadhaar Cards (both)', 'Witness IDs'],
    optionalDocuments: ['Religious Marriage Certificate'],
    requiredFormFields: [
      { name: 'groomName',     label: 'Groom\'s Full Name',    type: 'text',    required: true },
      { name: 'groomAadhaar',  label: 'Groom\'s Aadhaar No.',  type: 'aadhaar', required: true, placeholder: 'XXXX-XXXX-XXXX' },
      { name: 'brideName',     label: 'Bride\'s Full Name',    type: 'text',    required: true },
      { name: 'brideAadhaar',  label: 'Bride\'s Aadhaar No.',  type: 'aadhaar', required: true, placeholder: 'XXXX-XXXX-XXXX' },
      { name: 'marriageDate',  label: 'Date of Marriage',       type: 'date',    required: true },
      { name: 'marriagePlace', label: 'Place of Marriage',      type: 'text',    required: true },
      { name: 'religion',      label: 'Religion',               type: 'select',  required: true, options: ['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Other'] },
      { name: 'witnessName',   label: 'Witness Full Name',      type: 'text',    required: true },
      { name: 'witnessPhone',  label: 'Witness Phone',          type: 'phone',   required: true },
    ],
  },

  'Caste Certificate': {
    serviceId: 'caste-cert',
    serviceName: 'Caste Certificate',
    category: 'certificate',
    description: 'Certifies caste category for educational and employment reservations.',
    processingDays: 14,
    fee: 0,
    department: 'Municipal Administration',
    requiredDocuments: ['Aadhaar Card', 'Parent Caste Certificate', 'School Records'],
    optionalDocuments: ['Ration Card'],
    requiredFormFields: [
      { name: 'applicantName',  label: 'Applicant Full Name',   type: 'text',    required: true },
      { name: 'aadhaarNo',      label: 'Aadhaar Number',         type: 'aadhaar', required: true, placeholder: 'XXXX-XXXX-XXXX' },
      { name: 'casteName',      label: 'Caste Name',             type: 'text',    required: true },
      { name: 'subCaste',       label: 'Sub-Caste (if any)',     type: 'text',    required: false },
      { name: 'category',       label: 'Category',               type: 'select',  required: true, options: ['SC','ST','OBC','General'] },
      { name: 'fatherName',     label: 'Father\'s Name',         type: 'text',    required: true },
      { name: 'religion',       label: 'Religion',               type: 'select',  required: true, options: ['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Other'] },
      { name: 'address',        label: 'Residential Address',    type: 'textarea',required: true },
      { name: 'purpose',        label: 'Purpose',                type: 'text',    required: true, placeholder: 'e.g. College admission, Govt job' },
    ],
  },

  'Trade License': {
    serviceId: 'trade-license',
    serviceName: 'Trade License',
    category: 'permit',
    description: 'License to legally operate a business/trade within the municipality.',
    processingDays: 21,
    fee: 200,
    department: 'Municipal Administration',
    requiredDocuments: ['Business Registration', 'NOC from Fire Dept', 'Aadhaar Card'],
    optionalDocuments: ['GST Registration', 'Shop Photo'],
    requiredFormFields: [
      { name: 'businessName',    label: 'Business Name',          type: 'text',    required: true },
      { name: 'tradeType',       label: 'Type of Trade',          type: 'select',  required: true, options: ['Retail Shop','Wholesale','Restaurant','Manufacturing','Service','Medical','Other'] },
      { name: 'businessAddress', label: 'Business Address',       type: 'textarea',required: true },
      { name: 'ward',            label: 'Ward',                   type: 'select',  required: true, options: WARD_OPTIONS },
      { name: 'ownerName',       label: 'Owner\'s Full Name',     type: 'text',    required: true },
      { name: 'ownerAadhaar',    label: 'Owner\'s Aadhaar No.',   type: 'aadhaar', required: true, placeholder: 'XXXX-XXXX-XXXX' },
      { name: 'contactPhone',    label: 'Contact Phone',          type: 'phone',   required: true },
      { name: 'employeeCount',   label: 'Number of Employees',    type: 'number',  required: true, min: 0 },
      { name: 'annualTurnover',  label: 'Annual Turnover (₹)',    type: 'number',  required: false, min: 0 },
    ],
  },

  'Building Permit': {
    serviceId: 'building-permit',
    serviceName: 'Building Permit',
    category: 'permit',
    description: 'Permission to construct, renovate or extend a building.',
    processingDays: 30,
    fee: 500,
    department: 'Road & Infrastructure',
    requiredDocuments: ['Site Plan', 'Property Documents', 'Structural Certificate'],
    optionalDocuments: ['Architect\'s Certificate', 'Soil Test Report'],
    requiredFormFields: [
      { name: 'ownerName',         label: 'Property Owner Name',    type: 'text',    required: true },
      { name: 'ownerAadhaar',      label: 'Owner\'s Aadhaar No.',   type: 'aadhaar', required: true, placeholder: 'XXXX-XXXX-XXXX' },
      { name: 'propertyAddress',   label: 'Property Address',       type: 'textarea',required: true },
      { name: 'ward',              label: 'Ward',                   type: 'select',  required: true, options: WARD_OPTIONS },
      { name: 'plotArea',          label: 'Plot Area (sq.ft)',       type: 'number',  required: true, min: 1 },
      { name: 'constructionArea',  label: 'Construction Area (sq.ft)',type: 'number', required: true, min: 1 },
      { name: 'constructionType',  label: 'Construction Type',      type: 'select',  required: true, options: ['Residential','Commercial','Industrial','Mixed'] },
      { name: 'floors',            label: 'Number of Floors',       type: 'number',  required: true, min: 1, max: 50 },
      { name: 'purpose',           label: 'Purpose',                type: 'text',    required: true, placeholder: 'e.g. New construction, Extension' },
      { name: 'architectName',     label: 'Architect\'s Name',      type: 'text',    required: true },
      { name: 'contactPhone',      label: 'Contact Phone',          type: 'phone',   required: true },
    ],
  },

  'Food License': {
    serviceId: 'food-license',
    serviceName: 'Food License',
    category: 'permit',
    description: 'FSSAI-compliant food business license.',
    processingDays: 15,
    fee: 150,
    department: 'Public Health',
    requiredDocuments: ['Identity Proof', 'Premises Proof', 'NOC'],
    optionalDocuments: ['Water Test Report'],
    requiredFormFields: [
      { name: 'businessName',    label: 'Food Business Name',     type: 'text',    required: true },
      { name: 'foodCategory',    label: 'Food Category',          type: 'select',  required: true, options: ['Restaurant','Bakery','Catering','Street Food','Packaged Food','Dairy','Other'] },
      { name: 'businessAddress', label: 'Business Address',       type: 'textarea',required: true },
      { name: 'ward',            label: 'Ward',                   type: 'select',  required: true, options: WARD_OPTIONS },
      { name: 'ownerName',       label: 'Owner Name',             type: 'text',    required: true },
      { name: 'ownerAadhaar',    label: 'Owner\'s Aadhaar No.',   type: 'aadhaar', required: true, placeholder: 'XXXX-XXXX-XXXX' },
      { name: 'contactPhone',    label: 'Contact Phone',          type: 'phone',   required: true },
      { name: 'seatingCapacity', label: 'Seating Capacity',       type: 'number',  required: false, min: 0 },
    ],
  },

  'Event Permit': {
    serviceId: 'event-permit',
    serviceName: 'Event Permit',
    category: 'permit',
    description: 'Permission to organise a public event or gathering.',
    processingDays: 7,
    fee: 75,
    department: 'Municipal Administration',
    requiredDocuments: ['Event Details', 'Venue Proof', 'Police NOC'],
    optionalDocuments: ['Insurance Certificate'],
    requiredFormFields: [
      { name: 'organizerName',       label: 'Organizer Name',         type: 'text',    required: true },
      { name: 'organizerPhone',      label: 'Organizer Phone',        type: 'phone',   required: true },
      { name: 'eventName',           label: 'Event Name',             type: 'text',    required: true },
      { name: 'eventType',           label: 'Event Type',             type: 'select',  required: true, options: ['Cultural','Religious','Political','Sports','Commercial','Wedding','Other'] },
      { name: 'eventDate',           label: 'Event Date',             type: 'date',    required: true },
      { name: 'eventEndDate',        label: 'End Date (if multi-day)',type: 'date',    required: false },
      { name: 'venueName',           label: 'Venue Name',             type: 'text',    required: true },
      { name: 'venueAddress',        label: 'Venue Address',          type: 'textarea',required: true },
      { name: 'ward',                label: 'Ward',                   type: 'select',  required: true, options: WARD_OPTIONS },
      { name: 'expectedAttendees',   label: 'Expected Attendees',     type: 'number',  required: true, min: 1 },
    ],
  },

  'Signage Permit': {
    serviceId: 'signage-permit',
    serviceName: 'Signage Permit',
    category: 'permit',
    description: 'Permission to display outdoor signage / hoarding.',
    processingDays: 5,
    fee: 50,
    department: 'Municipal Administration',
    requiredDocuments: ['Signage Design', 'Location Photos', 'Owner Consent'],
    optionalDocuments: ['Structural Safety Certificate'],
    requiredFormFields: [
      { name: 'applicantName',   label: 'Applicant Name',         type: 'text',    required: true },
      { name: 'applicantPhone',  label: 'Contact Phone',          type: 'phone',   required: true },
      { name: 'signageAddress',  label: 'Signage Location',       type: 'textarea',required: true },
      { name: 'ward',            label: 'Ward',                   type: 'select',  required: true, options: WARD_OPTIONS },
      { name: 'signageType',     label: 'Signage Type',           type: 'select',  required: true, options: ['Hoarding','Banner','LED Board','Wall Painting','Neon Sign','Other'] },
      { name: 'width',           label: 'Width (ft)',             type: 'number',  required: true, min: 1 },
      { name: 'height',          label: 'Height (ft)',            type: 'number',  required: true, min: 1 },
      { name: 'duration',        label: 'Duration (months)',      type: 'number',  required: true, min: 1, max: 12 },
    ],
  },
};

export const getServiceConfig = (name: string): ServiceConfig | undefined => SERVICE_CONFIG[name];
