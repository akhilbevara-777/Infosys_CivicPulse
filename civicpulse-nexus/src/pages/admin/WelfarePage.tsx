import { useState, useEffect } from 'react';
import { Search, Users, IndianRupee, CheckCircle, Clock, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { statusBadge } from '../../components/ui/Badge';
import { WELFARE_SCHEMES } from '../../services/welfareService';
import { BUDGET_ALLOCATIONS } from '../../services/budgetService';
import { welfareApi } from '../../api/welfareApi';
import type { WelfareScheme, WelfareApplication } from '../../types';
import toast from 'react-hot-toast';

// ─── Static chart data (derived from mock schemes for charts — visual only) ──
const SCHEME_CATEGORY_COLORS: Record<string, string> = {
  Housing: '#14b8a6', Education: '#8b5cf6', Healthcare: '#ef4444',
  Agriculture: '#10b981', 'Women & Child': '#ec4899', 'Senior Citizen': '#f59e0b',
  Disability: '#3b82f6', Employment: '#f97316',
};

const welfareBudget = BUDGET_ALLOCATIONS.find(b => b.category === 'Welfare');

type Tab = 'dashboard' | 'schemes' | 'applications' | 'eligibility' | 'compliance';

export default function WelfarePage() {
  const [apps,    setApps]    = useState<WelfareApplication[]>([]);
  const [schemes, setSchemes] = useState<WelfareScheme[]>(WELFARE_SCHEMES); // seed with mock; overwritten by API
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState<Tab>('dashboard');
  const [search,  setSearch]  = useState('');
  const [selectedScheme, setSelectedScheme] = useState<WelfareScheme | null>(null);
  const [selectedApp,    setSelectedApp]    = useState<WelfareApplication | null>(null);
  const [notes,          setNotes]          = useState('');
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disbursementRef,setDisbursementRef]= useState('');
  const [refreshing,     setRefreshing]     = useState(false);

  // ─── Load from backend ───────────────────────────────────────────────────
  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sc, ap] = await Promise.all([
        welfareApi.getSchemes(),
        welfareApi.getApplications(),   // admin — no citizenId filter
      ]);
      if (sc.length > 0) setSchemes(sc);
      setApps(ap);
    } catch { /* keep mock schemes if backend offline */ }
    finally { setLoading(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
    toast.success('Welfare data refreshed');
  };

  // ─── Derived stats (live from DB apps) ───────────────────────────────────
  const pendingApps      = apps.filter(a => ['submitted','under_verification','eligibility_check'].includes(a.status)).length;
  const disbursedApps    = apps.filter(a => a.status === 'disbursed').length;
  const totalDisbursedAmt= apps.reduce((s, a) => s + (a.disbursementAmount ?? 0), 0);
  const totalBeneficiaries = schemes.reduce((s, sc) => s + sc.beneficiariesCount, 0);
  const totalBudget        = schemes.reduce((s, sc) => s + sc.budget, 0);
  const utilization        = totalBudget > 0 ? Math.round((totalDisbursedAmt / totalBudget) * 100) : 87;

  const FUND_CHART = schemes.map(s => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    Allocated: Math.round(s.budget / 100000),
    Disbursed: Math.round((s.budget * (utilization / 100)) / 100000),
    Beneficiaries: s.beneficiariesCount,
  }));
  const PIE_DATA = Object.entries(
    schemes.reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + s.beneficiariesCount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const filteredApps = apps.filter(a => {
    const q = search.toLowerCase();
    return !q || a.citizenName.toLowerCase().includes(q) || a.schemeName.toLowerCase().includes(q) || a.appId.toLowerCase().includes(q);
  });

  const handleUpdateStatus = async (id: string, status: WelfareApplication['status']) => {
    try {
      const disbAmt = disburseAmount ? Number(disburseAmount) : undefined;
      const ref     = disbursementRef.trim() || undefined;
      const updated = await welfareApi.updateStatus(id, status, notes.trim() || undefined,
        undefined, disbAmt, ref);
      setApps(prev => prev.map(a => a.id === updated.id ? updated : a));
      toast.success(`Application ${status.replace(/_/g, ' ')}`);
      setSelectedApp(null);
      setNotes('');
      setDisburseAmount('');
      setDisbursementRef('');
    } catch (e: any) {
      toast.error(e?.message ?? String(e));
    }
  };

  const liveApp = selectedApp ? (apps.find(a => a.id === selectedApp.id) ?? selectedApp) : null;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dashboard',   label: '📊 Dashboard'    },
    { id: 'schemes',     label: '🏛️ Schemes'      },
    { id: 'applications',label: '📋 Applications' },
    { id: 'eligibility', label: '✅ Eligibility'  },
    { id: 'compliance',  label: '🛡️ Compliance'   },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Welfare & Fund Allocation" subtitle="Milestone 3 · Scheme Management & Budget Distribution" />
      <div className="p-6 space-y-6">

        {/* M3 KPI Cards — live data */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Beneficiaries Active" value={totalBeneficiaries.toLocaleString()} icon={Users} color="teal"
            sub="Across all schemes" />
          <StatCard label="Budget Utilization" value={`${utilization}%`} icon={IndianRupee} color="amber"
            sub={`₹${(totalBudget/10000000).toFixed(1)}Cr allocated`} />
          <StatCard label="Funds Disbursed" value={`₹${(totalDisbursedAmt/10000000).toFixed(2)}Cr`} icon={CheckCircle} color="emerald"
            sub="Total disbursed" />
          <StatCard label="Pending Review" value={pendingApps} icon={Clock} color="rose"
            sub={`${disbursedApps} disbursed`} />
        </div>

        {/* Tabs + refresh */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? 'bg-teal-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/10'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={handleRefresh} disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-teal-400 border border-white/10 rounded-xl hover:bg-teal-500/5 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${(refreshing || loading) ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* ── DASHBOARD TAB ── */}
        {tab === 'dashboard' && (
          <div className="space-y-4">
            {/* Scheme: PM Awas Yojana highlight card (matches spec screenshot) */}
            <div className="glass rounded-2xl p-5 border border-teal-500/20">
              <p className="text-xs text-teal-400 font-semibold mb-3 uppercase tracking-wide">Welfare Service — Scheme Management</p>
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  <p className="text-white font-medium">Scheme: PM Awas Yojana (Urban) &nbsp;·&nbsp; Beneficiaries: 2,847</p>
                  <p className="text-slate-400">Eligibility: Verified &nbsp;|&nbsp; Documents: Approved</p>
                  <p className="text-slate-400">Fund: ₹2.4M Allocated · ₹2.1M Disbursed &nbsp;|&nbsp; 87% of fund</p>
                  <p className="text-slate-400">Beneficiary: Ramesh Kumar &nbsp;|&nbsp; Amount: ₹2,400 &nbsp;|&nbsp; Status: Paid</p>
                  {welfareBudget && (
                    <p className="text-slate-400">
                      Budget: Housing ₹{(welfareBudget.allocatedAmount/10000000).toFixed(1)}Cr &nbsp;|&nbsp;
                      Health ₹60M &nbsp;|&nbsp; Education ₹4M
                    </p>
                  )}
                  <p className="text-amber-400 text-xs">⚠ Alert: 13% budget remaining &nbsp;|&nbsp; Reallocation needed</p>
                  <div className="flex gap-2 mt-3">
                    {(['Verify', 'Disburse', 'Report'] as const).map(a => (
                      <button key={a} onClick={() => toast.success(`${a} action triggered`)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors">
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Fund Distribution by Category</p>
                  <div className="space-y-2">
                    {['Housing ₹12M', 'Health ₹6M', 'Education ₹4M', 'Others ₹2M'].map((item, i) => {
                      const widths = [60, 30, 20, 10];
                      return (
                        <div key={item}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">{item}</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${widths[i]}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Fund Allocation vs Disbursement (₹ Lakhs)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={FUND_CHART} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    <Bar dataKey="Allocated" fill="#334155" radius={[4,4,0,0]} name="Allocated (₹L)" />
                    <Bar dataKey="Disbursed" fill="#14b8a6" radius={[4,4,0,0]} name="Disbursed (₹L)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Beneficiaries by Category</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {PIE_DATA.map((entry, i) => (
                        <Cell key={i} fill={SCHEME_CATEGORY_COLORS[entry.name] ?? '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-1">
                  {PIE_DATA.map(c => (
                    <div key={c.name} className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SCHEME_CATEGORY_COLORS[c.name] ?? '#64748b' }} />
                        {c.name}
                      </div>
                      <span className="text-white">{c.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SCHEMES TAB ── */}
        {tab === 'schemes' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schemes.map(s => (
              <div key={s.id}
                className="glass rounded-2xl p-5 border border-white/5 hover:border-teal-500/20 transition-all cursor-pointer"
                onClick={() => setSelectedScheme(s)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.department}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${s.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{s.description}</p>
                <div className="bg-emerald-500/10 rounded-lg px-3 py-1.5 text-xs text-emerald-400 mb-3">{s.benefits}</div>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="bg-slate-800/40 rounded-lg p-2">
                    <p className="text-slate-500">Budget</p>
                    <p className="text-white font-medium mt-0.5">₹{(s.budget/100000).toFixed(0)}L</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-lg p-2">
                    <p className="text-slate-500">Utilized</p>
                    <p className="text-amber-400 font-medium mt-0.5">87%</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-lg p-2">
                    <p className="text-slate-500">Enrolled</p>
                    <p className="text-teal-400 font-medium mt-0.5">{s.beneficiariesCount.toLocaleString()}</p>
                  </div>
                </div>
                {s.applicationDeadline && <p className="text-xs text-amber-400 mt-2">⏰ Deadline: {s.applicationDeadline}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ── APPLICATIONS TAB ── */}
        {tab === 'applications' && (
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search citizen, scheme, or ID…"
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-white/5">
                    <th className="text-left pb-2 font-medium">App ID</th>
                    <th className="text-left pb-2 font-medium">Citizen</th>
                    <th className="text-left pb-2 font-medium">Scheme</th>
                    <th className="text-left pb-2 font-medium">Ward</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                    <th className="text-left pb-2 font-medium">Disbursed</th>
                    <th className="text-left pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredApps.map(a => (
                    <tr key={a.id} className="hover:bg-white/3 transition-colors cursor-pointer" onClick={() => setSelectedApp(a)}>
                      <td className="py-2.5 font-mono text-xs text-teal-400">{a.appId}</td>
                      <td className="py-2.5 text-white font-medium">{a.citizenName}</td>
                      <td className="py-2.5 text-slate-300 text-xs">{a.schemeName}</td>
                      <td className="py-2.5 text-slate-400 text-xs">{a.ward}</td>
                      <td className="py-2.5">{statusBadge(a.status)}</td>
                      <td className="py-2.5 text-emerald-400 text-xs">{a.disbursementAmount ? `₹${a.disbursementAmount.toLocaleString()}` : '—'}</td>
                      <td className="py-2.5 text-slate-500 text-xs">{a.submittedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ELIGIBILITY TAB ── */}
        {tab === 'eligibility' && (
          <div className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {schemes.map(s => {
                const schemeApps = apps.filter(a => a.schemeId === s.id);
                const approved = schemeApps.filter(a => a.status === 'approved' || a.status === 'disbursed').length;
                const pending  = schemeApps.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
                const rejected = schemeApps.filter(a => a.status === 'rejected').length;
                return (
                  <div key={s.id} className="glass rounded-2xl p-5 border border-white/5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-white font-medium text-sm">{s.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400">{s.category}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Eligibility Criteria:</p>
                    <ul className="space-y-1 mb-4">
                      {s.eligibility.map(e => (
                        <li key={e} className="flex items-center gap-2 text-xs text-slate-400">
                          <CheckCircle className="w-3 h-3 text-teal-500 shrink-0" /> {e}
                        </li>
                      ))}
                    </ul>
                    <div className="grid grid-cols-3 gap-2 text-xs text-center">
                      <div className="bg-teal-500/10 rounded-lg p-2">
                        <p className="text-teal-400 font-bold text-base">{approved}</p>
                        <p className="text-slate-500">Verified</p>
                      </div>
                      <div className="bg-amber-500/10 rounded-lg p-2">
                        <p className="text-amber-400 font-bold text-base">{pending}</p>
                        <p className="text-slate-500">Pending</p>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-2">
                        <p className="text-red-400 font-bold text-base">{rejected}</p>
                        <p className="text-slate-500">Rejected</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COMPLIANCE TAB ── */}
        {tab === 'compliance' && (
          <div className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-4">
              {[
                { title: 'Document Compliance', icon: Shield, color: 'text-teal-400', value: '94%', detail: 'All required documents verified', checks: ['Aadhaar verified: 247K', 'Income certificate: 189K', 'BPL card validated: 76K', 'Bank account linked: 242K'] },
                { title: 'Fund Utilization', icon: IndianRupee, color: 'text-amber-400', value: '87%', detail: '₹21M of ₹24M allocated disbursed', checks: ['Housing subsidy: ₹12M disbursed', 'Education grants: ₹4M released', 'Health benefits: ₹3M paid', 'Pension: ₹2M monthly active'] },
                { title: 'Beneficiary Verification', icon: Users, color: 'text-violet-400', value: '98.2%', detail: 'Active beneficiary rate', checks: ['Living verification: 99%', 'Duplicate check: 0 found', 'Address verified: 96%', 'Last activity: 30 days'] },
              ].map(c => (
                <div key={c.title} className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <c.icon className={`w-5 h-5 ${c.color}`} />
                    <p className="text-white font-medium text-sm">{c.title}</p>
                  </div>
                  <p className={`text-3xl font-bold mb-1 ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-slate-500 mb-3">{c.detail}</p>
                  <ul className="space-y-1.5">
                    {c.checks.map(check => (
                      <li key={check} className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /> {check}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Budget alert */}
            <div className="glass rounded-2xl p-5 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <p className="text-white font-medium text-sm">Budget Alerts & Reallocation Recommendations</p>
              </div>
              <div className="space-y-3">
                {[
                  { scheme: 'PM Awas Yojana', remaining: 13, action: 'Request additional ₹5M from Housing Ministry', severity: 'high' },
                  { scheme: 'Education Scholarship', remaining: 32, action: 'Adequate. Extend deadline by 30 days.', severity: 'low' },
                  { scheme: 'Old Age Pension', remaining: 8, action: 'Urgent: Reallocate ₹2M from Emergency fund', severity: 'critical' },
                  { scheme: 'Disability Support', remaining: 45, action: 'Surplus. Can absorb ₹1M from Pension scheme.', severity: 'low' },
                ].map(a => (
                  <div key={a.scheme} className={`flex items-start justify-between p-3 rounded-xl border ${
                    a.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                    a.severity === 'high' ? 'bg-amber-500/5 border-amber-500/20' :
                    'bg-slate-800/30 border-white/5'
                  }`}>
                    <div>
                      <p className="text-white text-sm font-medium">{a.scheme}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.action}</p>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ml-4 ${
                      a.severity === 'critical' ? 'text-red-400' :
                      a.severity === 'high' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {a.remaining}% left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Scheme Detail Modal */}
      <Modal isOpen={!!selectedScheme} onClose={() => setSelectedScheme(null)} title={selectedScheme?.name ?? ''} size="md">
        {selectedScheme && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">{selectedScheme.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Category', selectedScheme.category], ['Department', selectedScheme.department],
                ['Budget', `₹${(selectedScheme.budget/100000).toFixed(0)}L`], ['Beneficiaries', selectedScheme.beneficiariesCount.toLocaleString()],
                ['Utilization', '87%'], ['Status', selectedScheme.status],
                ...(selectedScheme.applicationDeadline ? [['Deadline', selectedScheme.applicationDeadline]] : []),
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-white mt-0.5 capitalize">{v}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Eligibility</p>
              <ul className="space-y-1.5">{selectedScheme.eligibility.map(e => (
                <li key={e} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />{e}
                </li>
              ))}</ul>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 font-medium mb-1">Benefits</p>
              <p className="text-sm text-white">{selectedScheme.benefits}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Application Detail Modal */}
      <Modal isOpen={!!liveApp} onClose={() => { setSelectedApp(null); setNotes(''); setDisburseAmount(''); setDisbursementRef(''); }} title="Welfare Application" size="md">
        {liveApp && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['App ID', liveApp.appId], ['Citizen', liveApp.citizenName], ['Scheme', liveApp.schemeName],
                ['Ward', liveApp.ward], ['Submitted', liveApp.submittedAt],
                ...(liveApp.updatedAt ? [['Updated', liveApp.updatedAt.toString().split('T')[0]]] : []),
                ...(liveApp.approvedAt ? [['Approved', liveApp.approvedAt]] : []),
                ...(liveApp.disbursedAt ? [['Disbursed', liveApp.disbursedAt]] : []),
                ...(liveApp.disbursementAmount ? [['Amount', `₹${liveApp.disbursementAmount.toLocaleString()}`]] : []),
                ...(liveApp.disbursementReference ? [['Ref', liveApp.disbursementReference]] : []),
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-white mt-0.5 text-sm break-all">{v}</p>
                </div>
              ))}
            </div>

            {/* Eligibility result */}
            {liveApp.eligibilityResult && liveApp.eligibilityResult.length > 0 && (
              <div className="bg-slate-800/40 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-2">Eligibility Check Result</p>
                <div className="space-y-1">
                  {liveApp.eligibilityResult.map((r, i) => (
                    <p key={i} className={`text-xs ${r.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>{r}</p>
                  ))}
                </div>
              </div>
            )}

            {liveApp.notes && (
              <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                <p className="text-xs text-amber-400 font-medium">Notes</p>
                <p className="text-sm text-slate-300 mt-1">{liveApp.notes}</p>
              </div>
            )}
            {liveApp.rejectionReason && (
              <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                <p className="text-xs text-red-400 font-medium">Rejection Reason</p>
                <p className="text-sm text-slate-300 mt-1">{liveApp.rejectionReason}</p>
              </div>
            )}

            {liveApp.status !== 'disbursed' && liveApp.status !== 'rejected' && (
              <div className="space-y-2">
                <input value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Notes / rejection reason (optional)"
                  className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                {(liveApp.status === 'approved' || liveApp.status === 'disbursement_pending') && (
                  <div className="flex gap-2">
                    <input value={disburseAmount} onChange={e => setDisburseAmount(e.target.value)}
                      placeholder="Disbursement amount (₹)" type="number"
                      className="flex-1 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                    <input value={disbursementRef} onChange={e => setDisbursementRef(e.target.value)}
                      placeholder="Transaction ref"
                      className="flex-1 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {['submitted'].includes(liveApp.status) && (
                    <button onClick={() => handleUpdateStatus(liveApp.id, 'under_verification')}
                      className="px-3 py-1.5 text-xs rounded-lg border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 transition-colors">
                      Start Verification
                    </button>
                  )}
                  {['submitted','under_verification','eligibility_check'].includes(liveApp.status) && (
                    <button onClick={() => handleUpdateStatus(liveApp.id, 'approved')}
                      className="px-3 py-1.5 text-xs rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors">
                      Approve
                    </button>
                  )}
                  {['approved'].includes(liveApp.status) && (
                    <button onClick={() => handleUpdateStatus(liveApp.id, 'disbursement_pending')}
                      className="px-3 py-1.5 text-xs rounded-lg border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-colors">
                      Mark Disbursement Pending
                    </button>
                  )}
                  {['approved','disbursement_pending'].includes(liveApp.status) && (
                    <button onClick={() => handleUpdateStatus(liveApp.id, 'disbursed')}
                      className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors">
                      Disburse Funds
                    </button>
                  )}
                  <button onClick={() => handleUpdateStatus(liveApp.id, 'rejected')}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-center">{statusBadge(liveApp.status)}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
