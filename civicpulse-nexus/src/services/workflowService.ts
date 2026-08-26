import type { WorkflowInstance, WorkflowStep, WorkflowStepStatus, ServiceApplication, DigitalSignature } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Workflow templates ───────────────────────────────────────────────────────
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

// ─── Generate digital signature ───────────────────────────────────────────────
export function generateDigitalSignature(signedBy: string): DigitalSignature {
  const signatureId = `SIG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const verificationCode = Math.random().toString(36).slice(2, 10).toUpperCase();
  return {
    signedBy,
    signedAt: new Date().toISOString(),
    signatureId,
    verificationCode,
  };
}

// ─── Create workflow instance for an application ──────────────────────────────
export function createWorkflowInstance(app: ServiceApplication): WorkflowInstance {
  const template = WORKFLOW_TEMPLATES[app.category] ?? WORKFLOW_TEMPLATES.certificate;
  const now = new Date();
  let dayOffset = 0;

  const steps: WorkflowStep[] = template.steps.map((t, i) => {
    dayOffset += t.days;
    const dueDate = new Date(now.getTime() + dayOffset * 86400000).toISOString().split('T')[0];
    return {
      id: `step-${i}`,
      name: t.name,
      assignedRole: t.assignedRole,
      status: i === 0 ? 'completed' : 'pending',
      completedAt: i === 0 ? now.toISOString().split('T')[0] : undefined,
      dueDate,
    };
  });

  const slaDays = Object.values(template.steps).reduce((sum, s) => sum + s.days, 0);
  return {
    id: `wf-${Date.now()}`,
    referenceId: app.id,
    referenceType: 'application',
    templateName: app.category,
    currentStep: 1,
    steps,
    createdAt: now.toISOString().split('T')[0],
    updatedAt: now.toISOString().split('T')[0],
    slaDeadline: new Date(now.getTime() + slaDays * 86400000).toISOString().split('T')[0],
    priority: 'normal',
  };
}

// ─── In-memory store of workflow instances ────────────────────────────────────
const instances: Map<string, WorkflowInstance> = new Map();

const workflowService = {
  async getForApplication(appId: string): Promise<WorkflowInstance | undefined> {
    await delay(200);
    return instances.get(appId);
  },

  async createForApplication(app: ServiceApplication): Promise<WorkflowInstance> {
    await delay(300);
    const existing = instances.get(app.id);
    if (existing) return existing;
    const wf = createWorkflowInstance(app);
    instances.set(app.id, wf);
    return wf;
  },

  async advanceStep(
    appId: string,
    stepId: string,
    status: WorkflowStepStatus,
    actorName: string,
    notes?: string
  ): Promise<WorkflowInstance> {
    await delay(400);
    const wf = instances.get(appId);
    if (!wf) throw new Error('Workflow not found');

    const today = new Date().toISOString().split('T')[0];
    const updatedSteps = wf.steps.map(s => {
      if (s.id !== stepId) return s;
      return { ...s, status, completedAt: today, assignedTo: actorName, notes: notes || s.notes };
    });

    // Advance currentStep pointer
    const completedIdx = updatedSteps.findIndex(s => s.id === stepId);
    const nextStep = Math.min(completedIdx + 1, updatedSteps.length - 1);
    if (status === 'completed' && nextStep > completedIdx) {
      updatedSteps[nextStep] = { ...updatedSteps[nextStep], status: 'in_progress' };
    }

    // Add digital signature if this is a signing step
    let digitalSignature = wf.digitalSignature;
    const completedStep = updatedSteps.find(s => s.id === stepId);
    if (completedStep?.name.includes('Signing') && status === 'completed') {
      digitalSignature = generateDigitalSignature(actorName);
    }

    const allDone = updatedSteps.every(s => s.status === 'completed' || s.status === 'skipped');
    const updated: WorkflowInstance = {
      ...wf,
      steps: updatedSteps,
      currentStep: nextStep,
      updatedAt: today,
      completedAt: allDone ? today : undefined,
      digitalSignature,
    };
    instances.set(appId, updated);
    return updated;
  },

  async signWorkflow(appId: string, signerName: string): Promise<WorkflowInstance> {
    await delay(500);
    const wf = instances.get(appId);
    if (!wf) throw new Error('Workflow not found');
    const sig = generateDigitalSignature(signerName);
    const updated = { ...wf, digitalSignature: sig, updatedAt: new Date().toISOString().split('T')[0] };
    instances.set(appId, updated);
    return updated;
  },

  async assignStep(appId: string, stepId: string, assignTo: string): Promise<WorkflowInstance> {
    await delay(200);
    const wf = instances.get(appId);
    if (!wf) throw new Error('Workflow not found');
    const updated = {
      ...wf,
      steps: wf.steps.map(s => s.id === stepId ? { ...s, assignedTo: assignTo } : s),
    };
    instances.set(appId, updated);
    return updated;
  },
};

export default workflowService;
