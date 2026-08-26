import { useEffect, useState } from 'react';
import {
  FileCheck, Clock, CheckCircle, XCircle, Download, Eye,
  RefreshCw, AlertTriangle, Ban, Upload, ChevronRight,
} from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { statusBadge } from '../../components/ui/Badge';
import type { ServiceApplication, ApplicationEvent, ApplicationStatus } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useApplicationStore } from '../../store/applicationStore';
import { usePageSearch } from '../../hooks/usePageSearch';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

// ─── Timeline definition — all statuses in order ─────────────────────────────
const TIMELINE_STEPS: { status: ApplicationStatus; label: string; icon: string }[] = [
  { status: 'submitted',            label: 'Application Submitted',   icon: '📋' },
  { status: 'under_review',         label: 'Under Review',            icon: '🔍' },
  { status: 'document_verification',label: 'Document Verification',   icon: '📄' },
  { status: 'verified',             label: 'Officer Processing',      icon: '⚙️' },
  { status: 'approved',             label: 'Approved',                icon: '✅' },
  { status: 'issued',               label: 'Certificate Issued',      icon: '🎫' },
];

const STATUS_ORDER: ApplicationStatus[] = [
  'submitted','under_review','document_verification',
  'documents_pending','pending_information','verified','approved','issued',
];

function getTimelineIndex(status: ApplicationStatus): number {
  const map: Record<ApplicationStatus, number> = {
    submitted: 0, under_review: 1, document_verification: 2,
    documents_pending: 2, pending_information: 2, verified: 3,
    approved: 4, issued: 5, rejected: -1, cancelled: -1,
  };
  return map[status] ?? 0;
}

// ─── Status colour helpers ────────────────────────────────────────────────────
const STATUS_COLORS: Partial<Record<ApplicationStatus, string>> = {
  submitted:            'text-slate-400  bg-slate-500/15',
  under_review:         'text-amber-400  bg-amber-500/15',
  document_verification:'text-violet-400 bg-violet-500/15',
  documents_pending:    'text-orange-400 bg-orange-500/15',
  pending_information:  'text-yellow-400 bg-yellow-500/15',
  verified:             'text-blue-400   bg-blue-500/15',
  approved:             'text-teal-400   bg-teal-500/15',
  issued:               'text-emerald-400 bg-emerald-500/15',
  rejected:             'text-red-400    bg-red-500/15',
  cancelled:            'text-slate-500  bg-slate-600/15',
};

function StatusPill({ status }: { status: ApplicationStatus }) {
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const cls   = STATUS_COLORS[status] ?? 'text-slate-400 bg-slate-500/15';
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${cls}`}>{label}</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CitizenApplicationsPage() {
  const user = useAuthStore(s => s.user);
  const { applications, loading, loadByCitizen, refreshByCitizen,
          downloadCert, cancelApplication, getEvents } = useApplicationStore();

  const [selected, setSelected] = useState<ServiceApplication | null>(null);
  const [events, setEvents]     = useState<ApplicationEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [cancelReason, setCancelReason]   = useState('');
  const [showCancel, setShowCancel]       = useState(false);
  const [refreshing, setRefreshing]       = useState(false);

  useEffect(() => {
    if (user?.id) loadByCitizen(user.id);
  }, [user?.id]);

  // Search
  const { filtered: searchFiltered, hasQuery } = usePageSearch(
    applications as any[], ['type','appId','status','category','assignedOfficer','certificateNo']
  );
  const displayList = hasQuery ? searchFiltered as ServiceApplication[] : applications;

  // Auto-refresh every 30s so status changes from admin are reflected
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => refreshByCitizen(user.id), 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // ─── Counters (all derived from store — no hardcoding) ───────────────────
  const counts = {
    active:    applications.filter(a => !['issued','rejected','cancelled'].includes(a.status)).length,
    approved:  applications.filter(a => a.status === 'approved').length,
    issued:    applications.filter(a => a.status === 'issued').length,
    rejected:  applications.filter(a => a.status === 'rejected').length,
  };

  // Keep modal in sync with store updates
  const liveSelected = selected
    ? (applications.find(a => a.id === selected.id) ?? selected)
    : null;

  const openDetail = async (app: ServiceApplication) => {
    setSelected(app);
    setEventsLoading(true);
    const ev = await getEvents(app.id);
    setEvents(ev);
    setEventsLoading(false);
  };

  const handleRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await loadByCitizen(user.id);
    setRefreshing(false);
    toast.success('Applications refreshed');
  };

  const handleDownload = async (id: string) => {
    await downloadCert(id);
    toast.success('Certificate opened for download');
  };

  const handleCancel = async () => {
    if (!liveSelected || !user) return;
    try {
      await cancelApplication(liveSelected.id, user.id, cancelReason);
      toast.success('Application cancelled');
      setShowCancel(false);
      setSelected(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not cancel');
    }
  };

  const canCancel = liveSelected &&
    !['approved','issued','rejected','cancelled'].includes(liveSelected.status);

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="My Applications" subtitle="Track your certificate & permit requests" />

      <div className="p-6 space-y-6">

        {/* ── Stats — live from store ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active"    value={counts.active}   icon={Clock}      color="amber" />
          <StatCard label="Approved"  value={counts.approved} icon={CheckCircle} color="teal" />
          <StatCard label="Issued"    value={counts.issued}   icon={FileCheck}   color="emerald" />
          <StatCard label="Rejected"  value={counts.rejected} icon={XCircle}     color="rose" />
        </div>

        {/* Refresh button */}
        <div className="flex justify-end">
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-teal-400 border border-white/10 rounded-xl hover:bg-teal-500/5 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── Application List ── */}
        <div className="space-y-3">
          {loading && (
            <div className="text-center py-12 text-slate-500">
              <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
              Loading applications…
            </div>
          )}

          {!loading && applications.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <div className="text-4xl">📋</div>
              <p className="text-white font-medium">No applications yet</p>
              <p className="text-slate-500 text-sm">Apply for a certificate or permit from the Services page.</p>
              <button onClick={() => window.location.href = '/citizen/services'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition-colors mt-2">
                Browse Services <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {!loading && hasQuery && displayList.length === 0 && applications.length > 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">No applications match your search.</div>
          )}
          {!loading && displayList.map(a => {
            const timelineIdx = getTimelineIndex(a.status);
            const isTerminal  = ['issued','rejected','cancelled'].includes(a.status);
            const isCancelled = a.status === 'cancelled';
            const isRejected  = a.status === 'rejected';
            return (
              <div key={a.id}
                className={clsx(
                  'glass rounded-2xl p-5 border transition-all cursor-pointer',
                  isCancelled ? 'border-slate-700/50 opacity-60' :
                  isRejected  ? 'border-red-500/20 hover:border-red-500/40' :
                                'border-white/5 hover:border-white/15'
                )}
                onClick={() => openDetail(a)}>

                {/* Top row */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{a.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.category === 'certificate' ? 'bg-teal-500/15 text-teal-400' : 'bg-violet-500/15 text-violet-400'}`}>
                        {a.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {a.appId} · {a.department || 'Municipal Administration'} · Submitted {a.submittedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-medium ${a.feePaid ? 'text-emerald-400' : 'text-red-400'}`}>
                      {a.fee === 0 ? 'Free' : `₹${a.fee}`} {a.fee > 0 && (a.feePaid ? '✓' : '✗')}
                    </span>
                    <StatusPill status={a.status} />
                    {a.status === 'issued' && (
                      <button onClick={e => { e.stopPropagation(); handleDownload(a.id); }}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Key dates row */}
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                  {a.expectedCompletionDate && !isTerminal && (
                    <span>📅 Expected: {a.expectedCompletionDate}</span>
                  )}
                  {a.updatedAt && <span>🔄 Updated: {a.updatedAt.split('T')[0]}</span>}
                  {a.assignedOfficer && <span>👤 {a.assignedOfficer}</span>}
                </div>

                {/* Timeline progress bar — only for active/non-terminal */}
                {!isTerminal && (
                  <div className="mt-4">
                    <div className="flex items-center">
                      {TIMELINE_STEPS.map((step, i) => (
                        <div key={step.status} className="flex items-center flex-1">
                          <div className={clsx('w-2.5 h-2.5 rounded-full shrink-0 transition-all', {
                            'bg-teal-500 ring-2 ring-teal-500/30 scale-125': i === timelineIdx,
                            'bg-teal-500': i < timelineIdx,
                            'bg-slate-700': i > timelineIdx,
                          })} />
                          {i < TIMELINE_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 transition-colors ${i < timelineIdx ? 'bg-teal-500' : 'bg-slate-700'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-teal-400 mt-1.5 font-medium">
                      {TIMELINE_STEPS[Math.max(0, Math.min(timelineIdx, TIMELINE_STEPS.length - 1))]?.label}
                    </p>
                  </div>
                )}

                {/* Special status banners */}
                {a.status === 'documents_pending' && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <Upload className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="text-xs text-orange-400">Additional documents required — tap to view</span>
                  </div>
                )}
                {a.status === 'rejected' && a.notes && (
                  <div className="mt-3 flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-red-300 line-clamp-2">{a.rejectionReason ?? a.notes}</span>
                  </div>
                )}
                {a.certificateNo && (
                  <div className="mt-3 p-2 bg-teal-500/10 rounded-lg text-xs text-teal-400 font-medium">
                    🎫 Certificate No: {a.certificateNo}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <Modal isOpen={!!liveSelected} onClose={() => { setSelected(null); setEvents([]); setShowCancel(false); }}
        title="Application Details" size="xl">
        {liveSelected && (
          <div className="space-y-5">

            {/* ── Header info grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {([
                ['Application ID',   liveSelected.appId],
                ['Service',          liveSelected.type],
                ['Department',       liveSelected.department ?? 'Municipal Administration'],
                ['Fee',              `${liveSelected.fee === 0 ? 'Free' : `₹${liveSelected.fee}`} (${liveSelected.feePaid ? 'Paid' : 'Unpaid'})`],
                ['Submitted',        liveSelected.submittedAt],
                ['Expected',         liveSelected.expectedCompletionDate ?? '—'],
                ...(liveSelected.approvedAt ? [['Approved', liveSelected.approvedAt]] : []),
                ...(liveSelected.issuedAt   ? [['Issued',   liveSelected.issuedAt]]   : []),
                ...(liveSelected.certificateNo ? [['Certificate No', liveSelected.certificateNo]] : []),
                ...(liveSelected.assignedOfficer ? [['Officer', liveSelected.assignedOfficer]] : []),
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-white mt-0.5 text-xs sm:text-sm break-all">{v}</p>
                </div>
              ))}
            </div>

            {/* ── Visual Timeline ── */}
            <div>
              <p className="text-sm font-semibold text-white mb-3">Application Timeline</p>
              {eventsLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                  <div className="w-4 h-4 border border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                  Loading timeline…
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-0">
                  {events.map((ev, i) => {
                    const isLast = i === events.length - 1;
                    const isRej  = ev.status === 'rejected' || ev.status === 'cancelled';
                    return (
                      <div key={ev.id} className="flex gap-3">
                        {/* Dot + line */}
                        <div className="flex flex-col items-center">
                          <div className={clsx('w-3 h-3 rounded-full shrink-0 mt-1 ring-2', {
                            'bg-emerald-500 ring-emerald-500/30': ev.status === 'issued' || ev.status === 'approved',
                            'bg-red-500 ring-red-500/30':         isRej,
                            'bg-teal-500 ring-teal-500/30':       isLast && !isRej,
                            'bg-slate-600 ring-slate-600/30':     !isLast && !isRej,
                          })} />
                          {!isLast && <div className="w-0.5 flex-1 bg-slate-700/50 my-1 min-h-[20px]" />}
                        </div>
                        {/* Content */}
                        <div className={`pb-4 flex-1 ${isLast ? 'pb-0' : ''}`}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${isRej ? 'text-red-400' : 'text-white'}`}>
                              {ev.label}
                            </p>
                            <span className="text-xs text-slate-500 shrink-0">
                              {ev.createdAt ? ev.createdAt.toString().replace('T', ' ').slice(0, 16) : ''}
                            </span>
                          </div>
                          {ev.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{ev.description}</p>
                          )}
                          {ev.officerName && (
                            <p className="text-xs text-slate-500 mt-0.5">👤 {ev.officerName}</p>
                          )}
                          {ev.officerRemarks && (
                            <div className="mt-1 p-2 bg-slate-800/60 rounded-lg text-xs text-slate-300">
                              💬 {ev.officerRemarks}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Pending future steps */}
                  {!['issued','rejected','cancelled'].includes(liveSelected.status) && (() => {
                    const current = getTimelineIndex(liveSelected.status);
                    const remaining = TIMELINE_STEPS.slice(current + 1);
                    return remaining.length > 0 ? (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <p className="text-xs text-slate-600 mb-2">Upcoming steps</p>
                        {remaining.map(step => (
                          <div key={step.status} className="flex gap-3 mb-3">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-slate-700 ring-2 ring-slate-700/30 mt-1" />
                            </div>
                            <p className="text-xs text-slate-600 pb-3">{step.icon} {step.label}</p>
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                /* Fallback static timeline when no events (offline) */
                <div className="space-y-2">
                  {TIMELINE_STEPS.map((step, i) => {
                    const curr = getTimelineIndex(liveSelected.status);
                    const done = i < curr;
                    const active = i === curr && !['rejected','cancelled'].includes(liveSelected.status);
                    return (
                      <div key={step.status} className={clsx('flex items-center gap-3 p-2.5 rounded-xl', {
                        'bg-teal-500/10': active,
                        'opacity-40': i > curr,
                      })}>
                        <div className={clsx('w-2.5 h-2.5 rounded-full shrink-0', {
                          'bg-teal-500': done || active,
                          'bg-slate-700': !done && !active,
                        })} />
                        <span className={`text-sm ${active ? 'text-teal-400 font-medium' : done ? 'text-slate-300' : 'text-slate-600'}`}>
                          {step.icon} {step.label}
                        </span>
                        {active && <span className="text-xs text-teal-400 ml-auto">← Current</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Document verification status ── */}
            {liveSelected.documents.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white mb-2">Documents</p>
                <div className="space-y-2">
                  {liveSelected.documents.map(doc => (
                    <div key={doc.name} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                      <div className="flex items-center gap-2">
                        <FileCheck className={`w-4 h-4 ${doc.verified ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className="text-sm text-slate-300">{doc.name}</span>
                      </div>
                      <span className={`text-xs font-medium ${doc.verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {doc.verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Missing documents notice ── */}
            {liveSelected.status === 'documents_pending' && liveSelected.missingDocuments && liveSelected.missingDocuments.length > 0 && (
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                <p className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Additional Documents Required
                </p>
                <ul className="space-y-1">
                  {liveSelected.missingDocuments.map(d => (
                    <li key={d} className="text-sm text-orange-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />{d}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 mt-2">Please visit the office or contact support to submit the above documents.</p>
              </div>
            )}

            {/* ── Rejection reason ── */}
            {liveSelected.status === 'rejected' && (
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                <p className="text-sm font-semibold text-red-400 mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Application Rejected
                </p>
                <p className="text-sm text-red-200">{liveSelected.rejectionReason ?? liveSelected.notes ?? 'No reason provided.'}</p>
                <button
                  onClick={() => { setSelected(null); window.location.href = '/citizen/services'; }}
                  className="mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-medium transition-colors">
                  Reapply →
                </button>
              </div>
            )}

            {/* ── Officer notes ── */}
            {liveSelected.notes && liveSelected.status !== 'rejected' && (
              <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                <p className="text-xs text-amber-400 font-medium">Notes from Officer</p>
                <p className="text-sm text-slate-300 mt-1">{liveSelected.notes}</p>
              </div>
            )}

            {/* ── Certificate actions ── */}
            {liveSelected.status === 'issued' && (
              <div className="space-y-2">
                <button onClick={() => handleDownload(liveSelected.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors">
                  <Download className="w-4 h-4" /> Download Certificate
                </button>
                {liveSelected.certificateNo && (
                  <p className="text-center text-xs text-slate-500">
                    Certificate No: <span className="text-teal-400 font-mono">{liveSelected.certificateNo}</span>
                  </p>
                )}
              </div>
            )}

            {/* ── Cancel application ── */}
            {canCancel && !showCancel && (
              <button onClick={() => setShowCancel(true)}
                className="w-full flex items-center justify-center gap-2 py-2 border border-red-500/30 text-red-400 rounded-xl text-sm hover:bg-red-500/5 transition-colors">
                <Ban className="w-4 h-4" /> Cancel Application
              </button>
            )}

            {canCancel && showCancel && (
              <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20 space-y-3">
                <p className="text-sm text-red-400 font-medium">Cancel this application?</p>
                <textarea rows={2} value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation (optional)"
                  className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none" />
                <div className="flex gap-2">
                  <button onClick={() => setShowCancel(false)}
                    className="flex-1 py-2 border border-white/10 text-slate-400 rounded-xl text-xs hover:bg-white/5">
                    Keep Application
                  </button>
                  <button onClick={handleCancel}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium transition-colors">
                    Confirm Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-1">
              <StatusPill status={liveSelected.status} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
