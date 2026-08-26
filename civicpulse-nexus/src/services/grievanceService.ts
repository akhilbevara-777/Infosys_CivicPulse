import type { Grievance, GrievanceCategory, GrievanceSeverity, GrievanceSLAStatus } from '../types';
import { GRIEVANCES, DEPARTMENTS } from '../data/mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── SLA days by severity ────────────────────────────────────────────────────
export function getSLADays(severity: GrievanceSeverity): number {
  const map: Record<GrievanceSeverity, number> = {
    critical: 1, high: 3, medium: 7, low: 14,
  };
  return map[severity];
}

// ─── Department auto-assignment ───────────────────────────────────────────────
export function getDeptForCategory(category: GrievanceCategory): string {
  const map: Record<GrievanceCategory, string> = {
    'Water Supply':    'Water Department',
    'Road Maintenance':'Road & Infrastructure',
    'Electricity':     'Electricity Board',
    'Sanitation':      'Sanitation Dept',
    'Public Safety':   'Electricity Board',
    'Healthcare':      'Public Health',
    'Education':       'Education Dept',
    'Other':           'Municipal Administration',
  };
  return map[category] ?? 'Municipal Administration';
}

// ─── SLA calculation (computed from slaDeadline + current time) ──────────────
export function computeSLA(g: Grievance): { slaStatus: GrievanceSLAStatus; slaRemainingDays: number; slaLabel: string } {
  if (g.status === 'resolved' || g.status === 'closed') {
    return { slaStatus: 'RESOLVED', slaRemainingDays: 0, slaLabel: 'SLA met' };
  }
  if (!g.slaDeadline) {
    return { slaStatus: 'ON_TRACK', slaRemainingDays: g.slaDays, slaLabel: `SLA: ${g.slaDays}d` };
  }
  const deadline = new Date(g.slaDeadline);
  const now      = new Date();
  const msLeft   = deadline.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / 86400000);

  if (daysLeft < 0) {
    const overdue = Math.abs(daysLeft);
    return { slaStatus: 'BREACHED', slaRemainingDays: daysLeft, slaLabel: `SLA BREACHED (${overdue}d ago)` };
  }
  if (daysLeft === 0) {
    // Check hours
    const hoursLeft = Math.ceil(msLeft / 3600000);
    if (hoursLeft <= 0) return { slaStatus: 'BREACHED', slaRemainingDays: 0, slaLabel: 'SLA BREACHED' };
    return { slaStatus: 'DUE_SOON', slaRemainingDays: 0, slaLabel: `SLA: Due in ${hoursLeft}h` };
  }
  if (daysLeft === 1) {
    return { slaStatus: 'DUE_SOON', slaRemainingDays: 1, slaLabel: 'SLA: Due tomorrow' };
  }
  return { slaStatus: 'ON_TRACK', slaRemainingDays: daysLeft, slaLabel: `SLA: ${daysLeft}d remaining` };
}

// ─── Auto-escalation check (applied after every load) ────────────────────────
export function checkSLAEscalation(g: Grievance): Grievance {
  if (g.status === 'resolved' || g.status === 'closed' || g.status === 'rejected') return g;
  const { slaStatus, slaRemainingDays } = computeSLA(g);

  if (slaStatus === 'BREACHED' && g.status !== 'escalated') {
    return {
      ...g,
      status: 'escalated',
      slaStatus,
      slaRemainingDays,
      escalation: {
        level: (g.escalation?.level ?? 0) + 1,
        escalatedAt: new Date().toISOString().split('T')[0],
        reason: 'SLA deadline exceeded — auto escalated',
      },
    };
  }
  return { ...g, slaStatus, slaRemainingDays };
}

// ─── Status transition rules (mirrors backend) ───────────────────────────────
export const GRIEVANCE_TRANSITIONS: Record<Grievance['status'], Grievance['status'][]> = {
  submitted:       ['acknowledged', 'rejected'],
  acknowledged:    ['assigned', 'rejected'],
  assigned:        ['in_progress', 'rejected'],
  in_progress:     ['pending_citizen', 'escalated', 'resolved', 'rejected'],
  pending_citizen: ['in_progress', 'resolved', 'closed'],
  escalated:       ['in_progress', 'resolved', 'rejected'],
  resolved:        ['closed', 'reopened'],
  closed:          [],
  reopened:        ['in_progress', 'assigned'],
  rejected:        [],
};

// ─── Mock service (offline fallback) ─────────────────────────────────────────
const grievanceService = {
  async getAll(): Promise<Grievance[]> {
    await delay(400);
    return GRIEVANCES.map(checkSLAEscalation);
  },

  async getById(id: string): Promise<Grievance | undefined> {
    await delay(200);
    const g = GRIEVANCES.find(g => g.id === id);
    return g ? checkSLAEscalation(g) : undefined;
  },

  async getByCitizen(citizenId: string): Promise<Grievance[]> {
    await delay(300);
    return GRIEVANCES.filter(g => g.citizenId === citizenId).map(checkSLAEscalation);
  },

  async create(data: {
    citizenId: string; citizenName: string; ward: string;
    category: GrievanceCategory; severity: GrievanceSeverity;
    title: string; description: string;
  }): Promise<Grievance> {
    await delay(700);
    const slaDays = getSLADays(data.severity);
    const slaDeadline = new Date(Date.now() + slaDays * 86400000).toISOString().split('T')[0];
    const assignedDept = getDeptForCategory(data.category);
    return {
      id: `g${Date.now()}`,
      grievanceId: `GRV-${new Date().getFullYear()}-${Math.floor(800 + Math.random() * 200)}`,
      ...data,
      status: 'submitted',
      assignedDept,
      slaDeadline,
      slaDays,
      ...computeSLA({ slaDeadline, slaDays, status: 'submitted' } as any),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateStatus(grievance: Grievance, status: Grievance['status'], resolution?: string): Promise<Grievance> {
    await delay(400);
    return {
      ...grievance,
      status,
      resolution: resolution || grievance.resolution,
      resolvedAt: status === 'resolved' ? new Date().toISOString() : grievance.resolvedAt,
      updatedAt: new Date().toISOString(),
    };
  },

  async escalate(grievance: Grievance, reason: string): Promise<Grievance> {
    await delay(400);
    return {
      ...grievance,
      status: 'escalated',
      escalation: {
        level: (grievance.escalation?.level ?? 0) + 1,
        escalatedAt: new Date().toISOString().split('T')[0],
        reason,
      },
      updatedAt: new Date().toISOString(),
    };
  },

  async assign(grievance: Grievance, officer: string, dept?: string): Promise<Grievance> {
    await delay(300);
    return {
      ...grievance,
      assignedOfficer: officer,
      assignedDept: dept ?? grievance.assignedDept,
      status: grievance.status === 'submitted' ? 'acknowledged' : 'assigned',
      updatedAt: new Date().toISOString(),
    };
  },

  async getStats(): Promise<{
    total: number; pending: number; inProgress: number;
    escalated: number; resolved: number; resolutionRate: number;
  }> {
    await delay(200);
    const all   = GRIEVANCES.map(checkSLAEscalation);
    const total = all.length;
    const resolved = all.filter(g => g.status === 'resolved' || g.status === 'closed').length;
    return {
      total,
      pending:        all.filter(g => ['submitted','acknowledged','assigned'].includes(g.status)).length,
      inProgress:     all.filter(g => ['in_progress','pending_citizen','reopened'].includes(g.status)).length,
      escalated:      all.filter(g => g.status === 'escalated').length,
      resolved,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    };
  },
};

export default grievanceService;
