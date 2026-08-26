import { useEffect } from 'react';
import {
  Users, AlertCircle, FileText, CheckCircle2,
  TrendingUp, Clock, Star, Activity, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { GRIEVANCE_TREND, GRIEVANCE_BY_CATEGORY, CERT_TREND, DEPARTMENTS } from '../../data/mockData';
import { statusBadge, severityBadge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { useGrievanceStore } from '../../store/grievanceStore';
import { useApplicationStore } from '../../store/applicationStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { grievances, load: loadGrievances } = useGrievanceStore();
  const { applications, load: loadApplications } = useApplicationStore();

  // Load live data on mount
  useEffect(() => {
    loadGrievances();
    loadApplications();
  }, []);

  // Live-derived stats
  const pendingGrievances = grievances.filter(g =>
    ['submitted','acknowledged','assigned','escalated'].includes(g.status)).length;
  const escalatedCount = grievances.filter(g => g.status === 'escalated').length;
  const pendingApps    = applications.filter(a =>
    ['submitted','under_review','document_verification','documents_pending'].includes(a.status)).length;
  const issuedApps     = applications.filter(a =>
    ['issued','approved'].includes(a.status)).length;

  // Recent items (from live store)
  const recentGrievances   = [...grievances].sort((a, b) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 4);
  const recentApplications = [...applications].sort((a, b) =>
    (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')).slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Governance Dashboard" subtitle="Milestone 1 & 2 · Citizen & Grievance · Certificate & Permit Management" />

      <div className="p-6 space-y-6">
        {/* ── M1 KPIs ── */}
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Milestone 1 — Registration & Redressal</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Registered Citizens" value="2.4M" sub="Active civic accounts"
              icon={Users} color="teal" trend={{ value: 4.2, label: 'vs last month' }} />
            <StatCard label="Grievances/Month" value={grievances.length > 0 ? grievances.length : '—'} sub={`${pendingGrievances} pending · ${escalatedCount} escalated`}
              icon={AlertCircle} color="rose" />
            <StatCard label="Resolution Rate" value="94%" sub="SLA compliance"
              icon={CheckCircle2} color="emerald" trend={{ value: 1.3, label: 'vs last month' }} />
            <StatCard label="Active Departments" value="6" sub="Municipal departments"
              icon={Activity} color="blue" />
          </div>
        </div>

        {/* ── M2 KPIs ── */}
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Milestone 2 — Service Delivery & Approvals</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Applications/Month" value={applications.length > 0 ? applications.length : '—'} sub={`${pendingApps} awaiting review`}
              icon={FileText} color="violet" />
            <StatCard label="Avg Approval Time" value="2.4 days" sub="Certificate processing"
              icon={Clock} color="amber" />
            <StatCard label="Certs Issued/Year" value={issuedApps > 0 ? issuedApps : '—'} sub="Approved + issued"
              icon={CheckCircle2} color="teal" />
            <StatCard label="Citizen Satisfaction" value="4.7/5" sub="Service rating"
              icon={Star} color="amber" trend={{ value: 0.2, label: 'vs last quarter' }} />
          </div>
        </div>

        {/* ── M1 Spec Detail Card: Citizen Service - Grievance Management ── */}
        <div className="glass rounded-2xl p-5 border border-teal-500/20">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-teal-400 font-semibold uppercase tracking-wide">
              Citizen Service — Grievance Management
            </p>
            <button onClick={() => navigate('/admin/grievances')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-400 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {(() => {
            const g = recentGrievances[0];
            return g ? (
              <div className="space-y-2 text-sm">
                <p className="text-white">
                  Citizen: <span className="text-teal-400 font-medium">{g.citizenName}</span>
                  {' '}| Ward: <span className="text-slate-300">{g.ward}</span>
                </p>
                <p className="text-slate-300">
                  Grievance: <span className="font-mono text-xs">{g.grievanceId}</span>
                  {' '}| Category: <span className="text-amber-400">{g.category}</span>
                  {' '}| Severity: <span className="text-red-400 font-medium capitalize">{g.severity}</span>
                </p>
                <p className="text-slate-300">
                  Status: {statusBadge(g.status)}
                  {' '}| Dept: <span className="text-slate-300">{g.assignedDept}</span>
                  {' '}| SLA: <span className="text-amber-400 font-medium">{g.slaDays} days</span>
                </p>
                <p className="text-slate-400 text-xs line-clamp-2">{g.description}</p>
                {g.escalation && (
                  <p className="text-red-400 text-xs">
                    Escalated L{g.escalation.level} · Due: {g.slaDeadline}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigate('/admin/grievances')}
                    className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors">
                    View All Grievances
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No grievances loaded yet. Visit the Grievances page to load live data.</p>
            );
          })()}
        </div>

        {/* ── M2 Spec Detail Card: Service Management - Certificate Generation ── */}
        <div className="glass rounded-2xl p-5 border border-violet-500/20">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-wide">
              Service Management — Certificate Generation
            </p>
            <button onClick={() => navigate('/admin/applications')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {(() => {
              const a = recentApplications[0];
              return a ? (
                <>
                  <p className="text-slate-300">
                    Application: <span className="font-mono text-xs text-teal-400">{a.appId}</span>
                    {' '}| Type: <span className="text-white font-medium">{a.type}</span>
                  </p>
                  <p className="text-slate-300">
                    Applicant: <span className="text-white font-medium">{a.citizenName}</span>
                    {' '}| Fee: ₹{a.fee} <span className={a.feePaid ? 'text-emerald-400' : 'text-red-400'}>{a.feePaid ? '(Paid)' : '(Unpaid)'}</span>
                  </p>
                  <p className="text-slate-300">
                    Documents: <span className={a.documents.every(d => d.verified) ? 'text-emerald-400' : 'text-amber-400'}>
                      {a.documents.filter(d => d.verified).length}/{a.documents.length} verified
                    </span>
                  </p>
                  <p className="text-slate-300">
                    Status: {statusBadge(a.status)}
                    {a.certificateNo && <>{' '}| Cert: <span className="font-mono text-xs text-teal-400">{a.certificateNo}</span></>}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => navigate('/admin/applications')}
                      className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors">
                      View All Applications
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-sm">No applications loaded yet. Visit the Applications page.</p>
              );
            })()}
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Grievance Trend (6 months)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={GRIEVANCE_TREND}>
                <defs>
                  <linearGradient id="filed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                <Legend />
                <Area type="monotone" dataKey="filed" stroke="#ef4444" fill="url(#filed)" strokeWidth={2} name="Filed" />
                <Area type="monotone" dataKey="resolved" stroke="#14b8a6" fill="url(#resolved)" strokeWidth={2} name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">By Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={GRIEVANCE_BY_CATEGORY} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {GRIEVANCE_BY_CATEGORY.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {GRIEVANCE_BY_CATEGORY.map(c => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Certificate trend */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Certificate & Permit Processing (6 months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CERT_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="applications" fill="#8b5cf6" radius={[4,4,0,0]} name="Applications" />
              <Bar dataKey="issued" fill="#14b8a6" radius={[4,4,0,0]} name="Issued" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent Grievances */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Recent Grievances</h3>
              <button onClick={() => navigate('/admin/grievances')} className="text-xs text-teal-400 hover:text-teal-300">View all →</button>
            </div>
            <div className="space-y-3">
              {recentGrievances.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No grievances yet</p>
              ) : recentGrievances.map(g => (
                <div key={g.id} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white truncate">{g.title}</span>
                      {severityBadge(g.severity)}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{g.citizenName} · {g.ward} · {g.assignedDept}</p>
                    <p className="text-xs text-slate-500 mt-0.5">SLA: {g.slaDays}d · {g.slaDeadline}</p>
                  </div>
                  <div className="shrink-0">{statusBadge(g.status)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Performance */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Department Performance</h3>
              <button onClick={() => navigate('/admin/reports')} className="text-xs text-teal-400 hover:text-teal-300">Reports →</button>
            </div>
            <div className="space-y-3">
              {DEPARTMENTS.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{d.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{d.resolvedCount}/{d.grievanceCount} resolved</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${d.slaCompliance >= 95 ? 'text-emerald-400' : d.slaCompliance >= 90 ? 'text-amber-400' : 'text-red-400'}`}>
                      {d.slaCompliance}%
                    </p>
                    <p className="text-xs text-slate-500">SLA</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Service Applications</h3>
            <button onClick={() => navigate('/admin/applications')} className="text-xs text-teal-400 hover:text-teal-300">View all →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-white/5">
                  <th className="text-left pb-3 font-medium">App ID</th>
                  <th className="text-left pb-3 font-medium">Citizen</th>
                  <th className="text-left pb-3 font-medium">Type</th>
                  <th className="text-left pb-3 font-medium">Category</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-left pb-3 font-medium">Fee</th>
                  <th className="text-left pb-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentApplications.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500 text-sm">No applications yet</td></tr>
                ) : recentApplications.map(a => (
                  <tr key={a.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 text-teal-400 font-mono text-xs">{a.appId}</td>
                    <td className="py-3 text-white">{a.citizenName}</td>
                    <td className="py-3 text-slate-300">{a.type}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${a.category === 'certificate' ? 'bg-teal-500/15 text-teal-400' : 'bg-violet-500/15 text-violet-400'}`}>
                        {a.category}
                      </span>
                    </td>
                    <td className="py-3">{statusBadge(a.status)}</td>
                    <td className="py-3 text-slate-300">
                      ₹{a.fee} <span className={`text-xs ${a.feePaid ? 'text-emerald-400' : 'text-red-400'}`}>{a.feePaid ? '✓' : '✗'}</span>
                    </td>
                    <td className="py-3 text-slate-400 text-xs">{a.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
