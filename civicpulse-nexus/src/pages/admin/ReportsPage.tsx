import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { GRIEVANCE_TREND, GRIEVANCE_BY_CATEGORY, CERT_TREND, GRIEVANCES, APPLICATIONS, DEPARTMENTS } from '../../data/mockData';
import { TrendingUp, Star, DollarSign, Shield, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const WARD_DATA = [
  { ward: 'Ward 3',  grievances: 18, resolved: 16 },
  { ward: 'Ward 5',  grievances: 24, resolved: 21 },
  { ward: 'Ward 7',  grievances: 12, resolved: 11 },
  { ward: 'Ward 9',  grievances: 9,  resolved: 8  },
  { ward: 'Ward 11', grievances: 15, resolved: 13 },
  { ward: 'Ward 12', grievances: 22, resolved: 19 },
  { ward: 'Ward 15', grievances: 7,  resolved: 7  },
  { ward: 'Ward 18', grievances: 11, resolved: 10 },
];

const REVENUE_DATA = [
  { month: 'Mar', PropertyTax: 1800000, Licenses: 520000, Fees: 180000 },
  { month: 'Apr', PropertyTax: 2100000, Licenses: 610000, Fees: 210000 },
  { month: 'May', PropertyTax: 1950000, Licenses: 580000, Fees: 195000 },
  { month: 'Jun', PropertyTax: 2300000, Licenses: 650000, Fees: 230000 },
  { month: 'Jul', PropertyTax: 2050000, Licenses: 600000, Fees: 205000 },
  { month: 'Aug', PropertyTax: 2200000, Licenses: 640000, Fees: 220000 },
];

const SAT_DATA = [
  { month: 'Mar', score: 4.5 }, { month: 'Apr', score: 4.6 },
  { month: 'May', score: 4.5 }, { month: 'Jun', score: 4.7 },
  { month: 'Jul', score: 4.7 }, { month: 'Aug', score: 4.7 },
];

const DEPT_KPI = [
  { name: 'Water', sla: 94, sat: 4.6, resolved: 321, complaints: 342 },
  { name: 'Roads', sla: 91, sat: 4.4, resolved: 265, complaints: 289 },
  { name: 'Health', sla: 91, sat: 4.8, resolved: 79,  complaints: 87  },
  { name: 'Electricity', sla: 93, sat: 4.5, resolved: 184, complaints: 198 },
  { name: 'Sanitation', sla: 96, sat: 4.6, resolved: 149, complaints: 156 },
  { name: 'Education', sla: 95, sat: 4.7, resolved: 61,  complaints: 64  },
];

const APP_STATUS_DATA = [
  { name: 'Submitted',     value: 1, color: '#64748b' },
  { name: 'Under Review',  value: 1, color: '#f59e0b' },
  { name: 'Docs Pending',  value: 1, color: '#8b5cf6' },
  { name: 'Approved/Issued', value: 3, color: '#14b8a6' },
];

const TOTAL_REVENUE = 12400000;

type ReportTab = 'executive' | 'grievance' | 'services' | 'revenue' | 'department';

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('executive');

  const totalGrievances = GRIEVANCES.length;
  const resolvedGrievances = GRIEVANCES.filter(g => g.status === 'resolved' || g.status === 'closed').length;
  const resolutionRate = 94; // spec value
  const avgSLA = Math.round(DEPARTMENTS.reduce((acc, d) => acc + d.slaCompliance, 0) / DEPARTMENTS.length);
  const issuedApps = APPLICATIONS.filter(a => a.status === 'issued' || a.status === 'approved').length;

  const TABS: { id: ReportTab; label: string }[] = [
    { id: 'executive',  label: '📊 Executive Dashboard' },
    { id: 'grievance',  label: '📋 Grievance Reports'   },
    { id: 'services',   label: '🏛️ Service Reports'     },
    { id: 'revenue',    label: '💰 Revenue Reports'     },
    { id: 'department', label: '🏢 Department Reports'  },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Executive Dashboard & Reports" subtitle="Milestone 4 · Governance Analytics" />

      <div className="p-6 space-y-6">

        {/* ── Spec KPI row: Citizen SAT 4.7/5 | Service SLA 94% | Revenue $12.4M ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Citizen Satisfaction" value="4.7/5" sub="Rating · Met"
            icon={Star} color="amber" trend={{ value: 0.2, label: 'vs last quarter' }} />
          <StatCard label="Service SLA" value="94%" sub="Met · All departments"
            icon={Shield} color="emerald" trend={{ value: 1.3, label: 'vs last month' }} />
          <StatCard label="Revenue Collected" value="$12.4M" sub="Collected YTD"
            icon={DollarSign} color="teal" trend={{ value: 8.2, label: 'vs last year' }} />
          <StatCard label="Resolution Rate" value={`${resolutionRate}%`} sub="Grievance resolution"
            icon={TrendingUp} color="violet" trend={{ value: 1.3, label: 'vs last month' }} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? 'bg-teal-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/10'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── EXECUTIVE TAB ── */}
        {tab === 'executive' && (
          <div className="space-y-4">
            {/* Spec detail card */}
            <div className="glass rounded-2xl p-5 border border-teal-500/20">
              <p className="text-xs text-teal-400 font-semibold uppercase tracking-wide mb-4">
                Analytics Dashboard — Governance KPIs
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-slate-300">Services: <span className="text-white font-medium">24.7K requests</span> | 94% resolved | Avg 2.4 days</p>
                <p className="text-slate-300">Grievances: <span className="text-white font-medium">12.4K filed</span> | 94% resolved | MTTR 47 hrs</p>
                <p className="text-slate-300">Revenue: <span className="text-emerald-400 font-medium">$12.4M</span> | Property Tax 67% | Licenses 23%</p>
                <p className="text-slate-300">Budget: <span className="text-amber-400">$47M allocated</span> | $41M utilized | 87%</p>
                <p className="text-slate-300">Departments: Water 94% | Health 91% | Education 89%</p>
                <p className="text-slate-300">Citizen SAT: <span className="text-amber-400 font-medium">4.7/5</span> | Complaints ↓ 23% | Services ↑ 47%</p>
                <div className="flex gap-2 mt-3">
                  {['Export Report', 'Drill Down', 'Share'].map(a => (
                    <button key={a} onClick={() => toast.success(`${a} triggered`)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors">
                      [{a}]
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Grievance Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={GRIEVANCE_TREND}>
                    <defs>
                      <linearGradient id="ef" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="tb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    <Legend />
                    <Area type="monotone" dataKey="filed" stroke="#ef4444" fill="url(#ef)" strokeWidth={2} name="Filed" />
                    <Area type="monotone" dataKey="resolved" stroke="#14b8a6" fill="url(#tb)" strokeWidth={2} name="Resolved" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Citizen Satisfaction Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={SAT_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis domain={[4.0, 5.0]} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="SAT Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dept KPI table */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Department Performance KPIs</h3>
                <button onClick={() => toast.success('Report exported')}
                  className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors">
                  Export <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-white/5 bg-slate-900/40">
                      <th className="text-left px-5 py-3 font-medium">Department</th>
                      <th className="text-left px-5 py-3 font-medium">SLA %</th>
                      <th className="text-left px-5 py-3 font-medium">SAT Score</th>
                      <th className="text-left px-5 py-3 font-medium">Resolved</th>
                      <th className="text-left px-5 py-3 font-medium">Total</th>
                      <th className="text-left px-5 py-3 font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {DEPT_KPI.map(d => {
                      const rate = Math.round((d.resolved / d.complaints) * 100);
                      return (
                        <tr key={d.name} className="hover:bg-white/3 transition-colors">
                          <td className="px-5 py-3 text-white font-medium">{d.name}</td>
                          <td className="px-5 py-3">
                            <span className={`text-sm font-bold ${d.sla >= 95 ? 'text-emerald-400' : d.sla >= 90 ? 'text-amber-400' : 'text-red-400'}`}>{d.sla}%</span>
                          </td>
                          <td className="px-5 py-3 text-amber-400 font-medium">{d.sat}/5</td>
                          <td className="px-5 py-3 text-teal-400">{d.resolved}</td>
                          <td className="px-5 py-3 text-slate-400">{d.complaints}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${rate >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${rate}%` }} />
                              </div>
                              <span className="text-xs text-slate-400">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── GRIEVANCE TAB ── */}
        {tab === 'grievance' && (
          <div className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">By Category</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={GRIEVANCE_BY_CATEGORY} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {GRIEVANCE_BY_CATEGORY.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {GRIEVANCE_BY_CATEGORY.map(c => (
                    <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />{c.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2 glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Ward-wise Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-white/5">
                        <th className="text-left pb-2">Ward</th>
                        <th className="text-left pb-2">Filed</th>
                        <th className="text-left pb-2">Resolved</th>
                        <th className="text-left pb-2">Pending</th>
                        <th className="text-left pb-2">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {WARD_DATA.map(w => {
                        const rate = Math.round((w.resolved / w.grievances) * 100);
                        return (
                          <tr key={w.ward} className="hover:bg-white/3">
                            <td className="py-2 text-white font-medium">{w.ward}</td>
                            <td className="py-2 text-slate-300">{w.grievances}</td>
                            <td className="py-2 text-emerald-400">{w.resolved}</td>
                            <td className="py-2 text-amber-400">{w.grievances - w.resolved}</td>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${rate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-xs text-slate-400">{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SERVICES TAB ── */}
        {tab === 'services' && (
          <div className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Certificate & Permit Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={CERT_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    <Legend />
                    <Bar dataKey="applications" fill="#8b5cf6" radius={[4,4,0,0]} name="Received" />
                    <Bar dataKey="issued" fill="#14b8a6" radius={[4,4,0,0]} name="Issued" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Application Status Split</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={APP_STATUS_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {APP_STATUS_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {APP_STATUS_DATA.map(c => (
                    <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                      {c.name} ({c.value})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REVENUE TAB ── */}
        {tab === 'revenue' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Property Tax', value: '$8.3M', pct: 67, color: 'text-teal-400' },
                { label: 'Licenses & Fees', value: '$2.9M', pct: 23, color: 'text-violet-400' },
                { label: 'Service Fees', value: '$1.2M', pct: 10, color: 'text-amber-400' },
              ].map(r => (
                <div key={r.label} className="glass rounded-2xl p-4 text-center">
                  <p className={`text-2xl font-bold ${r.color}`}>{r.value}</p>
                  <p className="text-sm text-slate-400 mt-1">{r.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.pct}% of total</p>
                </div>
              ))}
            </div>
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Revenue by Source (₹)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    formatter={(v: number) => [`₹${(v/100000).toFixed(1)}L`, '']} />
                  <Legend />
                  <Bar dataKey="PropertyTax" fill="#14b8a6" radius={[4,4,0,0]} name="Property Tax" />
                  <Bar dataKey="Licenses" fill="#8b5cf6" radius={[4,4,0,0]} name="Licenses" />
                  <Bar dataKey="Fees" fill="#f59e0b" radius={[4,4,0,0]} name="Service Fees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── DEPARTMENT TAB ── */}
        {tab === 'department' && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Department SLA Compliance</h3>
              <div className="space-y-4">
                {DEPARTMENTS.map(d => (
                  <div key={d.id}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div>
                        <span className="text-white font-medium">{d.name}</span>
                        <span className="text-xs text-slate-500 ml-2">{d.head}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>{d.resolvedCount}/{d.grievanceCount} resolved</span>
                        <span className={`font-bold text-sm ${d.slaCompliance >= 95 ? 'text-emerald-400' : d.slaCompliance >= 90 ? 'text-amber-400' : 'text-red-400'}`}>
                          {d.slaCompliance}% SLA
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${d.slaCompliance >= 95 ? 'bg-emerald-500' : d.slaCompliance >= 90 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${d.slaCompliance}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
