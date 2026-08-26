import { api } from './client';
import type { BudgetAllocation, BudgetTransaction } from '../types';
import { BUDGET_ALLOCATIONS, BUDGET_TRANSACTIONS } from '../services/budgetService';

const EP = '/api/budget';

export const budgetApi = {
  async getAllocations(dept?: string): Promise<BudgetAllocation[]> {
    try {
      const res = await api.get(`${EP}/allocations`, { params: dept ? { dept } : {} });
      return res.data;
    } catch (e: any) {
      if (e?.offline) return dept
        ? BUDGET_ALLOCATIONS.filter(b => b.department === dept)
        : [...BUDGET_ALLOCATIONS];
      throw e;
    }
  },

  async getTransactions(allocationId?: string): Promise<BudgetTransaction[]> {
    try {
      const res = await api.get(`${EP}/transactions`, { params: allocationId ? { allocationId } : {} });
      return (res.data as any[]).map(t => ({ ...t, type: t.type?.toLowerCase() as 'credit' | 'debit' }));
    } catch (e: any) {
      if (e?.offline) return allocationId
        ? BUDGET_TRANSACTIONS.filter(t => t.allocationId === allocationId)
        : [...BUDGET_TRANSACTIONS];
      throw e;
    }
  },

  async getStats() {
    try {
      const res = await api.get(`${EP}/stats`);
      return res.data;
    } catch (e: any) {
      if (e?.offline) {
        const ta = BUDGET_ALLOCATIONS.reduce((s, b) => s + b.allocatedAmount, 0);
        const ts = BUDGET_ALLOCATIONS.reduce((s, b) => s + b.spentAmount, 0);
        const tc = BUDGET_ALLOCATIONS.reduce((s, b) => s + b.committedAmount, 0);
        return { totalAllocated: ta, totalSpent: ts, totalCommitted: tc,
          available: ta - ts - tc, utilizationRate: Math.round((ts / ta) * 100),
          departmentCount: new Set(BUDGET_ALLOCATIONS.map(b => b.department)).size };
      }
      throw e;
    }
  },
};
