import type { BudgetAllocation, BudgetTransaction, BudgetCategory } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Mock Budget Allocations ──────────────────────────────────────────────────
export const BUDGET_ALLOCATIONS: BudgetAllocation[] = [
  {
    id: 'ba1', department: 'Road & Infrastructure', category: 'Infrastructure',
    fiscalYear: '2026-27', allocatedAmount: 50000000, spentAmount: 32500000, committedAmount: 8000000,
    description: 'Road repairs, pothole filling, new road construction',
    approvedBy: 'Commissioner Mehta', approvedAt: '2026-04-01', lastUpdated: '2026-08-08',
  },
  {
    id: 'ba2', department: 'Water Department', category: 'Infrastructure',
    fiscalYear: '2026-27', allocatedAmount: 35000000, spentAmount: 18200000, committedAmount: 5000000,
    description: 'Water pipeline upgrades, pump maintenance, new connections',
    approvedBy: 'Commissioner Mehta', approvedAt: '2026-04-01', lastUpdated: '2026-08-07',
  },
  {
    id: 'ba3', department: 'Public Health', category: 'Healthcare',
    fiscalYear: '2026-27', allocatedAmount: 20000000, spentAmount: 11500000, committedAmount: 3000000,
    description: 'Healthcare camps, medicine procurement, sanitation drives',
    approvedBy: 'Commissioner Mehta', approvedAt: '2026-04-01', lastUpdated: '2026-08-05',
  },
  {
    id: 'ba4', department: 'Education Dept', category: 'Education',
    fiscalYear: '2026-27', allocatedAmount: 25000000, spentAmount: 14000000, committedAmount: 4000000,
    description: 'School infrastructure, teacher training, scholarship disbursements',
    approvedBy: 'Commissioner Mehta', approvedAt: '2026-04-01', lastUpdated: '2026-08-06',
  },
  {
    id: 'ba5', department: 'Municipal Administration', category: 'Welfare',
    fiscalYear: '2026-27', allocatedAmount: 30000000, spentAmount: 22000000, committedAmount: 2000000,
    description: 'Welfare scheme disbursements, housing subsidies, pension payments',
    approvedBy: 'Commissioner Mehta', approvedAt: '2026-04-01', lastUpdated: '2026-08-09',
  },
  {
    id: 'ba6', department: 'Sanitation Dept', category: 'Maintenance',
    fiscalYear: '2026-27', allocatedAmount: 15000000, spentAmount: 9800000, committedAmount: 1500000,
    description: 'Garbage collection vehicles, waste treatment plant maintenance',
    approvedBy: 'Commissioner Mehta', approvedAt: '2026-04-01', lastUpdated: '2026-08-08',
  },
  {
    id: 'ba7', department: 'Electricity Board', category: 'Infrastructure',
    fiscalYear: '2026-27', allocatedAmount: 28000000, spentAmount: 15000000, committedAmount: 6000000,
    description: 'Street lighting upgrades, transformer installation, cable laying',
    approvedBy: 'Commissioner Mehta', approvedAt: '2026-04-01', lastUpdated: '2026-08-07',
  },
  {
    id: 'ba8', department: 'All Departments', category: 'Emergency',
    fiscalYear: '2026-27', allocatedAmount: 10000000, spentAmount: 1200000, committedAmount: 0,
    description: 'Emergency response fund for natural disasters and urgent repairs',
    approvedBy: 'Commissioner Mehta', approvedAt: '2026-04-01', lastUpdated: '2026-08-01',
  },
];

export const BUDGET_TRANSACTIONS: BudgetTransaction[] = [
  { id: 'bt1', allocationId: 'ba1', department: 'Road & Infrastructure', amount: 5000000, type: 'debit', description: 'Phase 1 road repair contract', createdAt: '2026-05-15', createdBy: 'Admin Sharma' },
  { id: 'bt2', allocationId: 'ba2', department: 'Water Department', amount: 3200000, type: 'debit', description: 'Pipeline replacement Ward 5-12', createdAt: '2026-06-01', createdBy: 'Admin Sharma' },
  { id: 'bt3', allocationId: 'ba5', department: 'Municipal Administration', amount: 267000, type: 'debit', description: 'PMAY disbursement — Ramesh Kumar', referenceId: 'wa1', createdAt: '2026-08-01', createdBy: 'Admin Sharma' },
  { id: 'bt4', allocationId: 'ba3', department: 'Public Health', amount: 2000000, type: 'debit', description: 'Mobile health clinic procurement', createdAt: '2026-07-10', createdBy: 'Admin Sharma' },
  { id: 'bt5', allocationId: 'ba7', department: 'Electricity Board', amount: 1500000, type: 'debit', description: 'LED streetlight replacement Phase 2', createdAt: '2026-07-20', createdBy: 'Admin Sharma' },
];

const budgetService = {
  async getAllocations(): Promise<BudgetAllocation[]> {
    await delay(300);
    return [...BUDGET_ALLOCATIONS];
  },

  async getAllocationsByDept(dept: string): Promise<BudgetAllocation[]> {
    await delay(200);
    return BUDGET_ALLOCATIONS.filter(b => b.department === dept || b.department === 'All Departments');
  },

  async getTransactions(allocationId?: string): Promise<BudgetTransaction[]> {
    await delay(200);
    if (allocationId) return BUDGET_TRANSACTIONS.filter(t => t.allocationId === allocationId);
    return [...BUDGET_TRANSACTIONS];
  },

  async recordTransaction(data: Omit<BudgetTransaction, 'id'>): Promise<BudgetTransaction> {
    await delay(400);
    return { id: `bt${Date.now()}`, ...data };
  },

  async getStats(): Promise<{
    totalAllocated: number; totalSpent: number; totalCommitted: number;
    available: number; utilizationRate: number; departmentCount: number;
  }> {
    await delay(200);
    const totalAllocated = BUDGET_ALLOCATIONS.reduce((s, b) => s + b.allocatedAmount, 0);
    const totalSpent = BUDGET_ALLOCATIONS.reduce((s, b) => s + b.spentAmount, 0);
    const totalCommitted = BUDGET_ALLOCATIONS.reduce((s, b) => s + b.committedAmount, 0);
    return {
      totalAllocated,
      totalSpent,
      totalCommitted,
      available: totalAllocated - totalSpent - totalCommitted,
      utilizationRate: Math.round((totalSpent / totalAllocated) * 100),
      departmentCount: new Set(BUDGET_ALLOCATIONS.map(b => b.department)).size,
    };
  },

  async updateAllocation(id: string, updates: Partial<BudgetAllocation>): Promise<BudgetAllocation> {
    await delay(400);
    const alloc = BUDGET_ALLOCATIONS.find(b => b.id === id);
    if (!alloc) throw new Error('Allocation not found');
    return { ...alloc, ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
  },
};

export default budgetService;
