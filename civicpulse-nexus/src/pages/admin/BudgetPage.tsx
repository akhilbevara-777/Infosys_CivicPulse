import { useState } from 'react';
import { IndianRupee, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { BUDGET_ALLOCATIONS, BUDGET_TRANSACTIONS } from '../../services/budgetService';
import type { BudgetAllocation } from '../../types';

const CATEGORY_COLORS: Record<string, string> = {
  Infrastructure: '#14b8a6', Healthcare: '#ef4444', Education: '#8b5cf6',
  Welfare: '#f59e0b', Administration: '#64748b', Emergency: '#f97316', Maintenance: '#06b6d4',
};

export default function BudgetPage() {
  const [allocations] = useState(BUDGET_ALLOCATIONS);
  const [transactions] = useState(BUDGET_TRANSACTIONS);
  const [selected, setSelected] = useState<BudgetAllocation | null>(null);

  const totalAllocated  = allocations.reduce((s, b) => s + b.allocatedAmount, 0);
  const totalSpent      = allocations.reduce((s, b) => s + b.spentAmount, 0);
  const totalCommitted  = allocations.reduce((s, b) => s + b.committedAmount, 0);
  const available       = totalAllocated - totalSpent - totalCommitted;
  const utilizationRate = Math.round((totalSpent / totalAllocated) * 100);

  const barData = allocations.map(b => ({
    name: b.department.split(' ')[0],
    Allocated: Math.round(b.allocatedAmount / 100000),
    Spent:     Math.round(b.spentAmount / 100000),
    Committed: Math.round(b.committedAmount / 100000),
  }));

  const pieData = Object.entries(
    allocations.reduce<Record<string, number>>((acc, b) => {
      acc[b.category] = (acc[b.category] ?? 0) + b.allocatedAmount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Math.round(value / 100000) }));

  const fmt = (n: number) =>
    n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` : `₹${(n / 100000).toFixed(0)}L`;

  const deptTransactions = selected
    ? transactions.filter(t => t.allocationId === selected.id)
    : [];

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Budget Management" subtitle="Fiscal Year 2026-27 · Allocation & Expenditure" />

      <div className="p-6 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Allocated"  value={fmt(totalAllocated)}  icon={IndianRupee}  color="teal"    trend={{ value: 8.2, label: 'vs FY 2025-26' }} />
          <StatCard label="Total Spent"      value={fmt(totalSpent)}      icon={TrendingUp}   color="violet"  />
          <StatCard label="Available"        value={fmt(available)}        icon={CheckCircle}  color="emerald" />
          <StatCard label="Utilization Rate" value={`${utilizationRate}%`} icon={AlertCircle}  color={utilizationRate > 80 ? 'rose' : 'amber'} />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Department Budget vs Expenditure (₹ Lakhs)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="Allocated" fill="#334155" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent"     fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Committed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">By Category (₹L)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[entry.name] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                  formatter={(v) => [`₹${v}L`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 gap-1 mt-2">
              {pieData.map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[c.name] ?? '#64748b' }} />
                    {c.name}
                  </div>
                  <span className="text-white font-medium">₹{c.value}L</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Allocations Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Department Allocations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-white/5 bg-slate-900/40">
                  <th className="text-left px-5 py-3 font-medium">Department</th>
                  <th className="text-left px-5 py-3 font-medium">Category</th>
                  <th className="text-left px-5 py-3 font-medium">Allocated</th>
                  <th className="text-left px-5 py-3 font-medium">Spent</th>
                  <th className="text-left px-5 py-3 font-medium">Committed</th>
                  <th className="text-left px-5 py-3 font-medium">Available</th>
                  <th className="text-left px-5 py-3 font-medium">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allocations.map(b => {
                  const avail = b.allocatedAmount - b.spentAmount - b.committedAmount;
                  const util  = Math.round((b.spentAmount / b.allocatedAmount) * 100);
                  return (
                    <tr key={b.id} className="hover:bg-white/3 transition-colors cursor-pointer" onClick={() => setSelected(b)}>
                      <td className="px-5 py-3 text-white font-medium">{b.department}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${CATEGORY_COLORS[b.category]}20`, color: CATEGORY_COLORS[b.category] ?? '#94a3b8' }}>
                          {b.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-300 font-medium">{fmt(b.allocatedAmount)}</td>
                      <td className="px-5 py-3 text-teal-400 font-medium">{fmt(b.spentAmount)}</td>
                      <td className="px-5 py-3 text-violet-400">{fmt(b.committedAmount)}</td>
                      <td className="px-5 py-3">
                        <span className={avail < 0 ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>{fmt(avail)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${util >= 90 ? 'bg-red-500' : util >= 70 ? 'bg-amber-500' : 'bg-teal-500'}`}
                              style={{ width: `${Math.min(util, 100)}%` }} />
                          </div>
                          <span className={`text-xs font-medium ${util >= 90 ? 'text-red-400' : util >= 70 ? 'text-amber-400' : 'text-teal-400'}`}>
                            {util}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{t.description}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.department} · {t.createdAt} · by {t.createdBy}</p>
                </div>
                <span className={`text-sm font-bold ml-4 shrink-0 ${t.type === 'debit' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {t.type === 'debit' ? '−' : '+'}₹{(t.amount / 100000).toFixed(1)}L
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Allocation Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.department ?? ''} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Category', selected.category],
                ['Fiscal Year', selected.fiscalYear],
                ['Allocated', fmt(selected.allocatedAmount)],
                ['Spent', fmt(selected.spentAmount)],
                ['Committed', fmt(selected.committedAmount)],
                ['Available', fmt(selected.allocatedAmount - selected.spentAmount - selected.committedAmount)],
                ['Approved By', selected.approvedBy],
                ['Approved On', selected.approvedAt],
                ['Last Updated', selected.lastUpdated],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-white mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-300">{selected.description}</p>
            </div>
            {deptTransactions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white mb-2">Transactions ({deptTransactions.length})</p>
                <div className="space-y-2">
                  {deptTransactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl text-sm">
                      <div>
                        <p className="text-white">{t.description}</p>
                        <p className="text-xs text-slate-500">{t.createdAt}</p>
                      </div>
                      <span className={`font-bold ${t.type === 'debit' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {t.type === 'debit' ? '−' : '+'}₹{(t.amount / 100000).toFixed(1)}L
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
