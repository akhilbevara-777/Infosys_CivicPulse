import { useEffect } from 'react';
import {
  FileText, AlertCircle, CheckCircle, Clock,
  Bell, AlertTriangle, Upload, ChevronRight, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { statusBadge, severityBadge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { useGrievanceStore } from '../../store/grievanceStore';
import { useApplicationStore } from '../../store/applicationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useWelfareStore } from '../../store/welfareStore';
import { usePageSearch } from '../../hooks/usePageSearch';
import { computeSLA } from '../../services/grievanceService';

// Quick Apply services — clicking navigates to /citizen/services pre-filtered
const QUICK_SERVICES = [
  { name: 'Birth Certificate',     icon: '📄' },
  { name: 'Income Certificate',    icon: '💰' },
  { name: 'Residence Certificate', icon: '🏠' },
  { name: 'Trade License',         icon: '🏪' },
];

// Progress steps for applications
const APP_STEPS: Record<string, number> = {
  submitted: 1, under_review: 2, document_verification: 3,
  documents_pending: 3, pending_information: 3,
  verified: 4, approved: 5, issued: 6,
};

function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-800/40 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export default function CitizenDashboard() {
  const user     = useAuthStore(s => s.user);
  const navigate = useNavigate();

  const {
    grievances, loading: gLoading, loadByCitizen: loadGrievances,
  } = useGrievanceStore();
  const {
    applications, loading: aLoading, loadByCitizen: loadApplications,
  } = useApplicationStore();
  const {
    notifications, unreadCount, load: loadNotifs,
  } = useNotificationStore();
  const {
    applications: welfareApps, loading: wLoading, loadByCitizen: loadWelfare,
  } = useWelfareStore();

  const isLoading = gLoading || aLoading;

  // Load all data on mount
  useEffect(() => {
    if (!user?.id) return;
    loadGrievances(user.id);
    loadApplications(user.id);
    loadNotifs(user.id);
    loadWelfare(user.id);
  }, [user?.id]);

  // ── Search ──────────────────────────────────────────────────────────────────
  const { filtered: filteredGrievances, hasQuery } = usePageSearch(
    grievances as any[], ['title','grievanceId','category','assignedDept','status']
  );
  const { filtered: filteredApps } = usePageSearch(
    applications as any[], ['type','appId','status','category']
  );
  const displayGrievances = hasQuery ? filteredGrievances : grievances.slice(0, 3);
  const displayApps       = hasQuery ? filteredApps       : applications.slice(0, 3);

  // ── Real-time stats (all derived from stores — auto-updates after any action) ─
  const stats = {
    totalGrievances:     grievances.length,
    pendingGrievances:   grievances.filter(g =>
      ['submitted','acknowledged','assigned'].includes(g.status)).length,
    inProgress:          grievances.filter(g =>
      ['in_progress','pending_citizen','reopened','escalated'].includes(g.status)).length,
    resolved:            grievances.filter(g => ['resolved','closed'].includes(g.status)).length,
    activeApps:          applications.filter(a =>
      !['issued','rejected','cancelled'].includes(a.status)).length,
    approvedApps:        applications.filter(a => a.status === 'approved').length,
    issuedCerts:         applications.filter(a => a.status === 'issued').length,
    pendingApps:         applications.filter(a =>
      ['submitted','under_review','document_verification','documents_pending'].includes(a.status)).length,
    welfareApps:         welfareApps.length,
  };

  // ── SLA Alerts: grievances approaching or breached SLA ─────────────────────
  const slaAlerts = grievances
    .filter(g => !['resolved','closed','rejected'].includes(g.status))
    .map(g => ({ ...g, sla: computeSLA(g) }))
    .filter(g => g.sla.slaStatus === 'DUE_SOON' || g.sla.slaStatus === 'BREACHED')
    .slice(0, 3);

  // ── Pending Actions: apps needing citizen document upload ──────────────────
  const pendingActions = applications
    .filter(a => a.status === 'documents_pending')
    .slice(0, 3);

  // ── Active application for progress display ────────────────────────────────
  const activeApp = applications.find(a =>
    !['issued','rejected','cancelled'].includes(a.status)
  );

  // ── Latest welfare application ─────────────────────────────────────────────
  const latestWelfare = [...welfareApps]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Citizen'}`}
        subtitle={`Citizen Portal · ${user?.ward || ''}`}
      />

      <div className="p-6 space-y-6">

        {/* ── Row 1: Grievance Stats ── */}
        <div>
          {!hasQuery && (
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">
              My Grievances
            </p>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Grievances" value={isLoading ? '…' : stats.totalGrievances}
              icon={AlertCircle} color="rose" />
            <StatCard label="Pending"           value={isLoading ? '…' : stats.pendingGrievances}
              icon={Clock} color="amber" />
            <StatCard label="In Progress"       value={isLoading ? '…' : stats.inProgress}
              icon={AlertCircle} color="teal" />
            <StatCard label="Resolved"          value={isLoading ? '…' : stats.resolved}
              icon={CheckCircle} color="emerald" />
          </div>
        </div>

        {/* ── Row 2: Application Stats ── */}
        <div>
          {!hasQuery && (
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">
              My Applications
            </p>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Active Applications" value={isLoading ? '…' : stats.activeApps}
              icon={FileText} color="violet" />
            <StatCard label="Approved"            value={isLoading ? '…' : stats.approvedApps}
              icon={CheckCircle} color="teal" />
            <StatCard label="Issued Certificates" value={isLoading ? '…' : stats.issuedCerts}
              icon={CheckCircle} color="emerald" />
            <StatCard label="Welfare Applied"     value={wLoading ? '…' : stats.welfareApps}
              icon={FileText} color="amber" />
          </div>
        </div>

        {/* ── Quick Apply ── */}
        {!hasQuery && (
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Quick Apply</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_SERVICES.map(s => (
                <button key={s.name}
                  onClick={() => navigate('/citizen/services')}
                  className="glass rounded-2xl p-4 text-left border border-white/5 hover:border-teal-500/30 transition-all group">
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-sm text-white font-medium mt-2">{s.name}</p>
                  <p className="text-xs text-slate-500 group-hover:text-teal-400 mt-0.5 transition-colors">
                    Apply now →
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── SLA Alerts ── */}
        {!hasQuery && slaAlerts.length > 0 && (
          <div className="glass rounded-2xl p-5 border border-red-500/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                SLA Alerts
                <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                  {slaAlerts.length}
                </span>
              </h3>
              <button onClick={() => navigate('/citizen/grievances')}
                className="text-xs text-red-400 hover:text-red-300">View →</button>
            </div>
            <div className="space-y-2">
              {slaAlerts.map(g => (
                <div key={g.id}
                  onClick={() => navigate('/citizen/grievances')}
                  className="flex items-center justify-between p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl cursor-pointer hover:bg-red-500/10 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{g.title}</p>
                    <p className="text-xs text-slate-500">{g.grievanceId}</p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ml-2 px-2 py-0.5 rounded-full ${
                    g.sla.slaStatus === 'BREACHED'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {g.sla.slaLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Pending Actions ── */}
        {!hasQuery && pendingActions.length > 0 && (
          <div className="glass rounded-2xl p-5 border border-amber-500/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                Pending Actions
                <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                  {pendingActions.length}
                </span>
              </h3>
              <button onClick={() => navigate('/citizen/applications')}
                className="text-xs text-amber-400 hover:text-amber-300">View →</button>
            </div>
            <div className="space-y-2">
              {pendingActions.map(a => (
                <div key={a.id}
                  onClick={() => navigate('/citizen/applications')}
                  className="flex items-center justify-between p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl cursor-pointer hover:bg-amber-500/10 transition-colors">
                  <div>
                    <p className="text-sm text-white">Upload documents for <span className="text-amber-400 font-mono">{a.appId}</span></p>
                    <p className="text-xs text-slate-500">{a.type}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── My Grievances + My Applications ── */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Grievances */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                My Grievances
                {hasQuery && filteredGrievances.length > 0 && (
                  <span className="text-xs text-teal-400 ml-2">({filteredGrievances.length} found)</span>
                )}
              </h3>
              <button onClick={() => navigate('/citizen/grievances')}
                className="text-xs text-teal-400 hover:text-teal-300">View all →</button>
            </div>
            {gLoading ? <LoadingSkeleton /> : displayGrievances.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-slate-500 text-sm">
                  {hasQuery ? 'No grievances match your search.' : 'No grievances filed yet.'}
                </p>
                {!hasQuery && (
                  <button onClick={() => navigate('/citizen/grievances')}
                    className="text-xs text-teal-400 hover:text-teal-300">File one now →</button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayGrievances.map((g: any) => (
                  <div key={g.id}
                    onClick={() => navigate('/citizen/grievances')}
                    className="flex items-start justify-between p-3 bg-slate-800/40 rounded-xl cursor-pointer hover:bg-slate-800/60 transition-colors">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{g.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500">{g.grievanceId}</span>
                        {severityBadge(g.severity)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">⏰ {g.slaDeadline}</p>
                    </div>
                    <div className="shrink-0 ml-2">{statusBadge(g.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applications */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                My Applications
                {hasQuery && filteredApps.length > 0 && (
                  <span className="text-xs text-teal-400 ml-2">({filteredApps.length} found)</span>
                )}
              </h3>
              <button onClick={() => navigate('/citizen/applications')}
                className="text-xs text-teal-400 hover:text-teal-300">View all →</button>
            </div>
            {aLoading ? <LoadingSkeleton /> : displayApps.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-slate-500 text-sm">
                  {hasQuery ? 'No applications match your search.' : 'No applications submitted yet.'}
                </p>
                {!hasQuery && (
                  <button onClick={() => navigate('/citizen/services')}
                    className="text-xs text-teal-400 hover:text-teal-300">Browse services →</button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayApps.map((a: any) => (
                  <div key={a.id}
                    onClick={() => navigate('/citizen/applications')}
                    className="flex items-start justify-between p-3 bg-slate-800/40 rounded-xl cursor-pointer hover:bg-slate-800/60 transition-colors">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{a.type}</p>
                      <p className="text-xs text-slate-500 mt-1">{a.appId} · ₹{a.fee}</p>
                      {a.certificateNo && <p className="text-xs text-teal-400 mt-1">🎫 {a.certificateNo}</p>}
                    </div>
                    <div className="shrink-0 ml-2">{statusBadge(a.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Application Progress (active app) ── */}
        {!hasQuery && activeApp && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Application Progress</h3>
              <button onClick={() => navigate('/citizen/applications')}
                className="text-xs text-teal-400 hover:text-teal-300">Details →</button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white text-sm font-medium">{activeApp.type}</p>
                  <p className="text-xs text-slate-500 font-mono">{activeApp.appId}</p>
                </div>
                {statusBadge(activeApp.status)}
              </div>
              {/* Progress bar */}
              {activeApp.status !== 'rejected' && activeApp.status !== 'cancelled' && (
                <div className="mt-3">
                  <div className="flex items-center gap-1">
                    {['Submitted','Under Review','Doc Verification','Verified','Approved','Issued'].map((label, i) => {
                      const current = APP_STEPS[activeApp.status] ?? 1;
                      const done    = i + 1 < current;
                      const active  = i + 1 === current;
                      return (
                        <div key={label} className="flex items-center flex-1">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                            active ? 'bg-teal-500 ring-2 ring-teal-500/30 scale-125' :
                            done   ? 'bg-teal-500' : 'bg-slate-700'
                          }`} />
                          {i < 5 && <div className={`flex-1 h-0.5 ${i + 1 < current ? 'bg-teal-500' : 'bg-slate-700'}`} />}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-teal-400 mt-1.5 font-medium capitalize">
                    Current: {activeApp.status.replace(/_/g, ' ')}
                    {activeApp.expectedCompletionDate && (
                      <span className="text-slate-500 font-normal ml-2">· Expected: {activeApp.expectedCompletionDate}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Welfare Update ── */}
        {!hasQuery && latestWelfare && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Welfare Update</h3>
              <button onClick={() => navigate('/citizen/welfare')}
                className="text-xs text-teal-400 hover:text-teal-300">View all →</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
              <div>
                <p className="text-white text-sm font-medium">{latestWelfare.schemeName}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{latestWelfare.appId}</p>
                <p className="text-xs text-slate-500 mt-0.5">Applied: {latestWelfare.submittedAt}</p>
                {latestWelfare.disbursementAmount && (
                  <p className="text-xs text-emerald-400 mt-0.5">
                    💰 Disbursed: ₹{latestWelfare.disbursementAmount.toLocaleString()}
                  </p>
                )}
              </div>
              {statusBadge(latestWelfare.status)}
            </div>
          </div>
        )}

        {/* ── Recent Notifications ── */}
        {!hasQuery && notifications.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Recent Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-teal-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button onClick={() => navigate('/citizen/notifications')}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                <Bell className="w-3 h-3" /> View all →
              </button>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 5).map(n => (
                <div key={n.notificationId}
                  onClick={() => navigate('/citizen/notifications')}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-slate-800/60' : 'bg-slate-800/30'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${!n.isRead ? 'text-white' : 'text-slate-400'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.message}</p>
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Profile Overview ── */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Profile Overview</h3>
            <button onClick={() => navigate('/citizen/profile')}
              className="text-xs text-teal-400 hover:text-teal-300">Edit →</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {([
              ['Name',     user?.name     || '—'],
              ['Email',    user?.email    || '—'],
              ['Phone',    user?.phone    || '—'],
              ['Ward',     user?.ward     || '—'],
              ['City',     user?.city     || '—'],
              ['District', user?.district || '—'],
              ['State',    user?.state    || '—'],
              ['Pincode',  user?.pincode  || '—'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="bg-slate-800/40 rounded-xl p-3">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="text-white mt-0.5 break-all text-xs">{v}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
