import { useEffect, useState } from 'react';
import {
  Plus, AlertTriangle, CheckCircle, Clock, TrendingUp,
  RefreshCw, MessageSquare, RotateCcw, ChevronRight,
} from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { statusBadge, severityBadge } from '../../components/ui/Badge';
import type { Grievance, GrievanceCategory, GrievanceSeverity, GrievanceHistoryEntry } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useGrievanceStore } from '../../store/grievanceStore';
import { usePageSearch } from '../../hooks/usePageSearch';
import { DEPARTMENTS } from '../../data/mockData';
import { computeSLA } from '../../services/grievanceService';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const CATEGORY_OPTS = [
  'Water Supply', 'Road Maintenance', 'Electricity', 'Sanitation',
  'Public Safety', 'Healthcare', 'Education', 'Other',
].map(v => ({ value: v, label: v }));

const DEPT_OPTS = DEPARTMENTS.map(d => ({ value: d.name, label: d.name }));

interface GrievanceForm {
  category: string; severity: string; title: string; description: string; assignedDept: string;
}

// ─── SLA indicator component ─────────────────────────────────────────────────
function SLABadge({ g }: { g: Grievance }) {
  const { slaStatus, slaLabel } = computeSLA(g);
  const cls =
    slaStatus === 'BREACHED'  ? 'text-red-400 bg-red-500/10 border-red-500/20' :
    slaStatus === 'DUE_SOON'  ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
    slaStatus === 'RESOLVED'  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>
      ⏰ {slaLabel}
    </span>
  );
}

// ─── Status colour bar ───────────────────────────────────────────────────────
const STATUS_BAR: Record<string, string> = {
  submitted:      'bg-slate-400',
  acknowledged:   'bg-blue-400',
  assigned:       'bg-blue-500',
  in_progress:    'bg-teal-400',
  pending_citizen:'bg-amber-400',
  escalated:      'bg-red-500',
  resolved:       'bg-emerald-400',
  closed:         'bg-slate-500',
  reopened:       'bg-orange-400',
  rejected:       'bg-red-600',
};

export default function CitizenGrievancesPage() {
  const user = useAuthStore(s => s.user);
  const {
    grievances, loading, add, loadByCitizen, refreshByCitizen,
    getHistory, updateStatus, citizenRespond, acceptResolution, reopen,
  } = useGrievanceStore();

  const [showAdd,        setShowAdd]       = useState(false);
  const [selected,       setSelected]      = useState<Grievance | null>(null);
  const [history,        setHistory]       = useState<GrievanceHistoryEntry[]>([]);
  const [histLoading,    setHistLoading]   = useState(false);
  const [refreshing,     setRefreshing]    = useState(false);
  const [citizenReply,   setCitizenReply]  = useState('');
  const [reopenReason,   setReopenReason]  = useState('');
  const [showReopen,     setShowReopen]    = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GrievanceForm>();

  useEffect(() => { if (user?.id) loadByCitizen(user.id); }, [user?.id]);

  // Search
  const { filtered: searchFiltered, hasQuery } = usePageSearch(
    grievances as any[], ['title','grievanceId','category','assignedDept','assignedOfficer','status']
  );
  const displayList = hasQuery ? searchFiltered as Grievance[] : grievances;

  // Auto-refresh every 30s
  useEffect(() => {
    if (!user?.id) return;
    const t = setInterval(() => refreshByCitizen(user.id), 30000);
    return () => clearInterval(t);
  }, [user?.id]);

  const counts = {
    pending:    grievances.filter(g => ['submitted','acknowledged','assigned'].includes(g.status)).length,
    inProgress: grievances.filter(g => ['in_progress','pending_citizen','reopened'].includes(g.status)).length,
    escalated:  grievances.filter(g => g.status === 'escalated').length,
    resolved:   grievances.filter(g => ['resolved','closed'].includes(g.status)).length,
  };

  const liveSelected = selected ? (grievances.find(g => g.id === selected.id) ?? selected) : null;

  const openDetail = async (g: Grievance) => {
    setSelected(g);
    setShowReopen(false);
    setCitizenReply('');
    setHistLoading(true);
    const h = await getHistory(g.id);
    setHistory(h);
    setHistLoading(false);
  };

  const handleRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await loadByCitizen(user.id);
    setRefreshing(false);
    toast.success('Grievances refreshed');
  };

  const onAdd = async (data: GrievanceForm) => {
    if (!user) return;
    try {
      await add({
        citizenId: user.id, citizenName: user.name, ward: user.ward || 'Ward 1',
        category: data.category as GrievanceCategory, severity: data.severity as GrievanceSeverity,
        title: data.title, description: data.description,
      });
      toast.success('Grievance filed successfully');
      reset();
      setShowAdd(false);
    } catch (e) { toast.error(String(e)); }
  };

  const handleCitizenRespond = async () => {
    if (!liveSelected || !user || !citizenReply.trim()) { toast.error('Please enter a response'); return; }
    try {
      await citizenRespond(liveSelected.id, user.id, citizenReply.trim());
      toast.success('Response submitted');
      setCitizenReply('');
      // refresh history
      const h = await getHistory(liveSelected.id);
      setHistory(h);
    } catch (e) { toast.error(String(e)); }
  };

  const handleAcceptResolution = async () => {
    if (!liveSelected || !user) return;
    try {
      await acceptResolution(liveSelected.id, user.id);
      toast.success('Resolution accepted — grievance closed');
      setSelected(null);
    } catch (e) { toast.error(String(e)); }
  };

  const handleReopen = async () => {
    if (!liveSelected || !user || !reopenReason.trim()) { toast.error('Please provide a reason'); return; }
    try {
      await reopen(liveSelected.id, user.id, reopenReason.trim());
      toast.success('Grievance reopened');
      setShowReopen(false);
      setReopenReason('');
      const h = await getHistory(liveSelected.id);
      setHistory(h);
    } catch (e) { toast.error(String(e)); }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="My Grievances" subtitle="File & track your complaints" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending"    value={counts.pending}    icon={Clock}         color="amber"   />
          <StatCard label="In Progress" value={counts.inProgress} icon={TrendingUp}    color="teal"    />
          <StatCard label="Escalated"  value={counts.escalated}  icon={AlertTriangle}  color="rose"    />
          <StatCard label="Resolved"   value={counts.resolved}   icon={CheckCircle}    color="emerald" />
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-teal-400 border border-white/10 rounded-xl hover:bg-teal-500/5 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> File New Grievance
          </button>
        </div>

        {/* Grievance list */}
        <div className="space-y-3">
          {loading && (
            <div className="text-center py-12 text-slate-500">
              <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
              Loading…
            </div>
          )}
          {!loading && grievances.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <div className="text-4xl">📋</div>
              <p className="text-white font-medium">No grievances filed yet</p>
              <p className="text-slate-500 text-sm">File a grievance and we'll assign it to the right department.</p>
            </div>
          )}
          {!loading && hasQuery && displayList.length === 0 && grievances.length > 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">No grievances match your search.</div>
          )}
          {!loading && displayList.map(g => {
            const { slaStatus } = computeSLA(g);
            return (
              <div key={g.id}
                className={clsx('glass rounded-2xl p-5 border transition-all cursor-pointer', {
                  'border-red-500/20 hover:border-red-500/40':   slaStatus === 'BREACHED',
                  'border-orange-500/20 hover:border-orange-500/40': slaStatus === 'DUE_SOON',
                  'border-amber-500/20 hover:border-amber-500/30': g.status === 'pending_citizen',
                  'border-white/5 hover:border-white/15':        !['BREACHED','DUE_SOON'].includes(slaStatus) && g.status !== 'pending_citizen',
                })}
                onClick={() => openDetail(g)}>
                <div className="flex items-start gap-3">
                  <div className={clsx('w-1.5 min-h-[60px] rounded-full self-stretch shrink-0', STATUS_BAR[g.status] ?? 'bg-slate-500')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium">{g.title}</span>
                          {severityBadge(g.severity)}
                          {g.escalation && (
                            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                              Escalated L{g.escalation.level}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{g.grievanceId} · {g.category} · {g.ward}</p>
                      </div>
                      {statusBadge(g.status)}
                    </div>
                    <p className="text-sm text-slate-400 mt-1.5 line-clamp-1">{g.description}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <SLABadge g={g} />
                      {g.assignedOfficer && <span className="text-xs text-slate-500">👤 {g.assignedOfficer}</span>}
                      <span className="text-xs text-slate-500">🏢 {g.assignedDept}</span>
                      <span className="text-xs text-slate-500">📅 {g.createdAt.split('T')[0]}</span>
                    </div>
                    {/* Action-required banner */}
                    {g.status === 'pending_citizen' && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        Additional information required — tap to respond
                      </div>
                    )}
                    {g.status === 'resolved' && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
                        ✅ Resolved — tap to view resolution or reopen
                      </div>
                    )}
                    {g.resolution && (
                      <div className="mt-2 p-2 bg-emerald-500/10 rounded-lg text-xs text-emerald-400 line-clamp-1">
                        ✅ {g.resolution}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <Modal isOpen={!!liveSelected} onClose={() => { setSelected(null); setHistory([]); setShowReopen(false); }}
        title="Grievance Details" size="xl">
        {liveSelected && (
          <div className="space-y-5">
            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {([
                ['Grievance ID',  liveSelected.grievanceId],
                ['Category',     liveSelected.category],
                ['Severity',     liveSelected.severity],
                ['Department',   liveSelected.assignedDept],
                ['Officer',      liveSelected.assignedOfficer || 'Being assigned'],
                ['SLA Deadline', liveSelected.slaDeadline],
                ['Filed',        liveSelected.createdAt.split('T')[0]],
                ['Updated',      liveSelected.updatedAt.split('T')[0]],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-white mt-0.5 capitalize text-xs sm:text-sm">{v}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-slate-800/40 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-300">{liveSelected.description}</p>
            </div>

            {/* SLA status */}
            <div className="flex items-center gap-3">
              <SLABadge g={liveSelected} />
              <span className="text-xs text-slate-500">
                {computeSLA(liveSelected).slaStatus === 'BREACHED'
                  ? '⚠ This grievance has exceeded its SLA deadline'
                  : computeSLA(liveSelected).slaStatus === 'DUE_SOON'
                  ? '⚠ SLA deadline is approaching'
                  : ''}
              </span>
            </div>

            {/* ── Timeline ── */}
            <div>
              <p className="text-sm font-semibold text-white mb-3">Status Timeline</p>
              {histLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <div className="w-4 h-4 border border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                  Loading timeline…
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-0">
                  {history.map((h, i) => {
                    const isLast = i === history.length - 1;
                    const isNeg  = h.status === 'rejected' || h.status === 'closed';
                    return (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={clsx('w-3 h-3 rounded-full shrink-0 mt-1 ring-2', {
                            'bg-emerald-500 ring-emerald-500/30': h.status === 'resolved' || h.status === 'closed',
                            'bg-red-500 ring-red-500/30':         h.status === 'rejected' || h.status === 'escalated',
                            'bg-amber-500 ring-amber-500/30':     h.status === 'pending_citizen',
                            'bg-teal-500 ring-teal-500/30':       isLast && !isNeg,
                            'bg-slate-600 ring-slate-600/30':     !isLast && !isNeg,
                          })} />
                          {!isLast && <div className="w-0.5 flex-1 bg-slate-700/50 my-1 min-h-[20px]" />}
                        </div>
                        <div className={`flex-1 pb-4 ${isLast ? 'pb-0' : ''}`}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${h.status === 'rejected' || h.status === 'escalated' ? 'text-red-400' : 'text-white'}`}>
                              {h.label}
                            </p>
                            <span className="text-xs text-slate-500 shrink-0">
                              {h.createdAt ? h.createdAt.replace('T', ' ').slice(0, 16) : ''}
                            </span>
                          </div>
                          {h.description && <p className="text-xs text-slate-400 mt-0.5">{h.description}</p>}
                          {h.actorName && h.actorRole !== 'SYSTEM' && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {h.actorRole === 'CITIZEN' ? '👤' : '🏛️'} {h.actorName}
                            </p>
                          )}
                          {h.remarks && (
                            <div className="mt-1 p-2 bg-slate-800/60 rounded-lg text-xs text-slate-300">
                              💬 {h.remarks}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Offline / empty fallback */
                <div className="text-center py-4 text-slate-500 text-sm">No timeline data available.</div>
              )}
            </div>

            {/* Officer message to citizen */}
            {liveSelected.officerMessage && (
              <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                <p className="text-xs text-blue-400 font-medium mb-1">📨 Message from Officer</p>
                <p className="text-sm text-slate-300">{liveSelected.officerMessage}</p>
              </div>
            )}

            {/* Escalation info */}
            {liveSelected.escalation && (
              <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                <p className="text-xs text-red-400 font-medium">Escalated to Level {liveSelected.escalation.level}</p>
                <p className="text-sm text-slate-300 mt-1">{liveSelected.escalation.reason}</p>
              </div>
            )}

            {/* Rejection reason */}
            {liveSelected.status === 'rejected' && (
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                <p className="text-sm font-semibold text-red-400 mb-1">Grievance Rejected</p>
                <p className="text-sm text-red-200">{liveSelected.rejectionReason ?? 'No reason provided.'}</p>
              </div>
            )}

            {/* Resolution */}
            {liveSelected.resolution && (
              <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 font-medium mb-1">✅ Resolution</p>
                <p className="text-sm text-slate-300">{liveSelected.resolution}</p>
              </div>
            )}

            {/* ── PENDING_CITIZEN: citizen response ── */}
            {liveSelected.status === 'pending_citizen' && (
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 space-y-3">
                <p className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Additional Information Required
                </p>
                {liveSelected.officerMessage && (
                  <p className="text-sm text-slate-300 bg-slate-800/40 rounded-lg p-2">{liveSelected.officerMessage}</p>
                )}
                <textarea rows={3} value={citizenReply} onChange={e => setCitizenReply(e.target.value)}
                  placeholder="Type your response here…"
                  className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                <button onClick={handleCitizenRespond} disabled={!citizenReply.trim()}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                  Submit Response
                </button>
              </div>
            )}

            {/* ── RESOLVED: accept or reopen ── */}
            {liveSelected.status === 'resolved' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button onClick={handleAcceptResolution}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors">
                    ✓ Accept Resolution
                  </button>
                  <button onClick={() => setShowReopen(s => !s)}
                    className="flex-1 py-2.5 border border-orange-500/30 text-orange-400 hover:bg-orange-500/5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Reopen
                  </button>
                </div>
                {showReopen && (
                  <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/20 space-y-2">
                    <textarea rows={2} value={reopenReason} onChange={e => setReopenReason(e.target.value)}
                      placeholder="Why are you reopening this grievance?"
                      className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none" />
                    <button onClick={handleReopen} disabled={!reopenReason.trim()}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors">
                      Confirm Reopen
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center pt-1">{statusBadge(liveSelected.status)}</div>
          </div>
        )}
      </Modal>

      {/* ── New Grievance Modal — UNCHANGED ── */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="File New Grievance" size="lg">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" options={[{ value: '', label: 'Select' }, ...CATEGORY_OPTS]}
              error={errors.category?.message}
              {...register('category', { required: 'Required' })} />
            <Select label="Severity" options={[
              { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
            ]} error={errors.severity?.message}
              {...register('severity', { required: 'Required' })} />
            <Select label="Department" options={[{ value: '', label: 'Select dept' }, ...DEPT_OPTS]}
              error={errors.assignedDept?.message}
              {...register('assignedDept', { required: 'Required' })} />
          </div>
          <Input label="Title" placeholder="Brief summary" error={errors.title?.message}
            {...register('title', { required: 'Required', minLength: { value: 5, message: 'Too short' } })} />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea rows={3} placeholder="Describe the issue in detail…"
              className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              {...register('description', { required: 'Required' })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
              {loading ? 'Submitting…' : 'File Grievance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
