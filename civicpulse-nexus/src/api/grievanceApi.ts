import { api } from './client';
import type { Grievance, GrievanceCategory, GrievanceSeverity, GrievanceHistoryEntry } from '../types';
import { checkSLAEscalation, getDeptForCategory, getSLADays, computeSLA } from '../services/grievanceService';
import { GRIEVANCES } from '../data/mockData';

const EP = '/api/grievances';

const catToBackend: Record<GrievanceCategory, string> = {
  'Water Supply':    'WATER_SUPPLY',
  'Road Maintenance':'ROAD_MAINTENANCE',
  'Electricity':     'ELECTRICITY',
  'Sanitation':      'SANITATION',
  'Public Safety':   'PUBLIC_SAFETY',
  'Healthcare':      'HEALTHCARE',
  'Education':       'EDUCATION',
  'Other':           'OTHER',
};
const catFromBackend: Record<string, GrievanceCategory> = Object.fromEntries(
  Object.entries(catToBackend).map(([k, v]) => [v, k as GrievanceCategory])
);

const sevToBackend: Record<GrievanceSeverity, string> = {
  low:'LOW', medium:'MEDIUM', high:'HIGH', critical:'CRITICAL',
};

// Backend uses UPPER_SNAKE; frontend uses lower_snake (with underscores kept)
const statusFromBackend = (s: string): Grievance['status'] =>
  s.toLowerCase() as Grievance['status'];

function fromBackend(g: any): Grievance {
  const base: Grievance = {
    ...g,
    status:       statusFromBackend(g.status),
    category:     catFromBackend[g.category] ?? g.category,
    severity:     (g.severity as string).toLowerCase() as GrievanceSeverity,
    escalation:   g.escalationLevel
      ? { level: g.escalationLevel, escalatedAt: g.escalatedAt ?? '', reason: g.escalationReason ?? '' }
      : undefined,
    slaDeadline:  g.slaDeadline?.toString() ?? '',
    createdAt:    g.createdAt?.toString() ?? '',
    updatedAt:    g.updatedAt?.toString() ?? '',
    resolvedAt:   g.resolvedAt?.toString(),
    citizenResponseAt: g.citizenResponseAt?.toString(),
    reopenedAt:   g.reopenedAt?.toString(),
    // strip raw backend fields
    escalationLevel: undefined, escalatedAt: undefined, escalationReason: undefined,
  };
  // Apply SLA computation on top
  const sla = computeSLA(base);
  return {
    ...base,
    // Backend may provide slaStatus / slaRemainingDays — use computed if not present
    slaStatus:        g.slaStatus ?? sla.slaStatus,
    slaRemainingDays: g.slaRemainingDays ?? sla.slaRemainingDays,
  };
}

function historyFromBackend(h: any): GrievanceHistoryEntry {
  return {
    ...h,
    status:    statusFromBackend(h.status),
    createdAt: h.createdAt?.toString() ?? '',
  };
}

export const grievanceApi = {
  async getAll(search?: string): Promise<Grievance[]> {
    try {
      const res = await api.get(EP, { params: search ? { search } : {} });
      return (res.data as any[]).map(fromBackend).map(checkSLAEscalation);
    } catch (e: any) {
      if (e?.offline) return GRIEVANCES.map(checkSLAEscalation);
      throw e;
    }
  },

  async getByCitizen(citizenId: string): Promise<Grievance[]> {
    try {
      const res = await api.get(EP, { params: { citizenId } });
      return (res.data as any[]).map(fromBackend).map(checkSLAEscalation);
    } catch (e: any) {
      if (e?.offline) return GRIEVANCES.filter(g => g.citizenId === citizenId).map(checkSLAEscalation);
      throw e;
    }
  },

  async getById(id: string): Promise<Grievance> {
    try {
      const res = await api.get(`${EP}/${id}`);
      return checkSLAEscalation(fromBackend(res.data));
    } catch (e: any) {
      if (e?.offline) {
        const g = GRIEVANCES.find(g => g.id === id);
        if (g) return checkSLAEscalation(g);
      }
      throw e;
    }
  },

  async getHistory(grievanceId: string): Promise<GrievanceHistoryEntry[]> {
    try {
      const res = await api.get(`${EP}/${grievanceId}/history`);
      return (res.data as any[]).map(historyFromBackend);
    } catch (e: any) {
      if (e?.offline) return [];
      throw e;
    }
  },

  async create(data: {
    citizenId: string; citizenName: string; ward: string;
    category: GrievanceCategory; severity: GrievanceSeverity;
    title: string; description: string;
  }): Promise<Grievance> {
    try {
      const payload = { ...data, category: catToBackend[data.category], severity: sevToBackend[data.severity] };
      const res = await api.post(EP, payload);
      return checkSLAEscalation(fromBackend(res.data));
    } catch (e: any) {
      if (e?.offline) {
        const slaDays = getSLADays(data.severity);
        const slaDeadline = new Date(Date.now() + slaDays * 86400000).toISOString().split('T')[0];
        const base: Grievance = {
          id: `g${Date.now()}`,
          grievanceId: `GRV-${new Date().getFullYear()}-${Math.floor(800 + Math.random() * 200)}`,
          ...data,
          status: 'submitted',
          assignedDept: getDeptForCategory(data.category),
          slaDeadline, slaDays,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return checkSLAEscalation(base);
      }
      // Extract clean error message from backend
      const msg = e?.response?.data?.error ?? e?.message ?? 'Failed to file grievance';
      throw new Error(msg);
    }
  },

  async updateStatus(g: Grievance, status: Grievance['status'],
                      resolution?: string, officerMessage?: string,
                      rejectionReason?: string,
                      actor?: string, actorRole?: string): Promise<Grievance> {
    try {
      const res = await api.patch(`${EP}/${g.id}/status`, null, {
        params: {
          status: status.toUpperCase(),
          ...(resolution       ? { resolution }       : {}),
          ...(officerMessage   ? { officerMessage }   : {}),
          ...(rejectionReason  ? { rejectionReason }  : {}),
          ...(actor            ? { actor }             : {}),
          ...(actorRole        ? { actorRole }         : {}),
        },
      });
      return checkSLAEscalation(fromBackend(res.data));
    } catch (e: any) {
      if (e?.offline) return checkSLAEscalation({
        ...g, status,
        resolution:      resolution      ?? g.resolution,
        officerMessage:  officerMessage  ?? g.officerMessage,
        rejectionReason: rejectionReason ?? g.rejectionReason,
        resolvedAt:      status === 'resolved' ? new Date().toISOString() : g.resolvedAt,
        updatedAt:       new Date().toISOString(),
      });
      throw e;
    }
  },

  async assign(g: Grievance, officer: string, dept?: string): Promise<Grievance> {
    try {
      const res = await api.patch(`${EP}/${g.id}/assign`, null, {
        params: { officer, ...(dept ? { dept } : {}) },
      });
      return checkSLAEscalation(fromBackend(res.data));
    } catch (e: any) {
      if (e?.offline) return checkSLAEscalation({
        ...g,
        assignedOfficer: officer,
        assignedDept: dept ?? g.assignedDept,
        status: g.status === 'submitted' ? 'acknowledged' : 'assigned',
        updatedAt: new Date().toISOString(),
      });
      throw e;
    }
  },

  async escalate(g: Grievance, reason: string): Promise<Grievance> {
    try {
      const res = await api.post(`${EP}/${g.id}/escalate`, null, { params: { reason } });
      return checkSLAEscalation(fromBackend(res.data));
    } catch (e: any) {
      if (e?.offline) return checkSLAEscalation({
        ...g, status: 'escalated',
        escalation: { level: (g.escalation?.level ?? 0) + 1, escalatedAt: new Date().toISOString().split('T')[0], reason },
        updatedAt: new Date().toISOString(),
      });
      throw e;
    }
  },

  async citizenRespond(g: Grievance, citizenId: string, response: string): Promise<Grievance> {
    try {
      const res = await api.post(`${EP}/${g.id}/respond`, null, { params: { citizenId, response } });
      return checkSLAEscalation(fromBackend(res.data));
    } catch (e: any) {
      if (e?.offline) return checkSLAEscalation({
        ...g, status: 'in_progress',
        citizenResponse: response, citizenResponseAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      throw e;
    }
  },

  async acceptResolution(g: Grievance, citizenId: string): Promise<Grievance> {
    try {
      const res = await api.post(`${EP}/${g.id}/accept-resolution`, null, { params: { citizenId } });
      return fromBackend(res.data);
    } catch (e: any) {
      if (e?.offline) return { ...g, status: 'closed', updatedAt: new Date().toISOString() };
      throw e;
    }
  },

  async reopen(g: Grievance, citizenId: string, reason: string): Promise<Grievance> {
    try {
      const res = await api.post(`${EP}/${g.id}/reopen`, null, { params: { citizenId, reason } });
      return checkSLAEscalation(fromBackend(res.data));
    } catch (e: any) {
      if (e?.offline) return checkSLAEscalation({
        ...g, status: 'reopened', reopenReason: reason,
        reopenedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      throw e;
    }
  },

  async getStats() {
    try {
      const res = await api.get(`${EP}/stats`);
      return res.data;
    } catch (e: any) {
      if (e?.offline) {
        const all   = GRIEVANCES.map(checkSLAEscalation);
        const total = all.length;
        const resolved = all.filter(g => ['resolved','closed'].includes(g.status)).length;
        return {
          total,
          pending:        all.filter(g => ['submitted','acknowledged','assigned'].includes(g.status)).length,
          inProgress:     all.filter(g => ['in_progress','pending_citizen','reopened'].includes(g.status)).length,
          escalated:      all.filter(g => g.status === 'escalated').length,
          resolved,
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        };
      }
      throw e;
    }
  },
};
