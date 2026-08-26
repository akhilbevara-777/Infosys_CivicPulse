import { api } from './client';

export const reportingApi = {
  async getGovernanceDashboard() {
    try {
      const res = await api.get('/api/reports/governance');
      return res.data;
    } catch (e: any) {
      if (e?.offline) return {
        citizens:     { total: 8, active: 7, inactive: 1, suspended: 0 },
        grievances:   { total: 6, pending: 2, inProgress: 2, escalated: 1, resolved: 1, resolutionRate: 17 },
        applications: { total: 6, pending: 2, issued: 3, rejected: 0, certificates: 4, permits: 2 },
        budget:       { totalAllocated: 213000000, totalSpent: 124200000, available: 60800000, utilizationRate: 58 },
        welfare:      { totalSchemes: 5, activeSchemes: 5, totalBeneficiaries: 9347, totalBudget: 115000000, totalDisbursed: 267000, pendingApplications: 2 },
        kpis:         { citizenSatisfaction: 4.7, serviceSLA: 94, revenueCollected: 12400000, avgApprovalDays: 2.4 },
      };
      throw e;
    }
  },
};
