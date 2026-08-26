import { useState, useEffect } from 'react';
import { Search, Plus, AlertTriangle, CheckCircle, Clock, TrendingUp, RefreshCw, UserCheck } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { statusBadge, severityBadge } from '../../components/ui/Badge';
import { DEPARTMENTS } from '../../data/mockData';
import type { Grievance, GrievanceCategory, GrievanceSeverity } from '../../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { useGrievanceStore } from '../../store/grievanceStore';
import { useAuthStore } from '../../store/authStore';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...['Water Supply','Road Maintenance','Electricity','Sanitation','Public Safety','Healthcare','Education','Other']
    .map(v => ({ value: v, label: v })),
];
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'submitted',      label: 'Submitted' },
  { value: 'acknowledged',   label: 'Acknowledged' },
  { value: 'assigned',       label: 'Assigned' },
  { value: 'in_progress',    label: 'In Progress' },
  { value: 'pending_citizen',label: 'Pending Citizen' },
  { value: 'escalated',      label: 'Escalated' },
  { value: 'resolved',       label: 'Resolved' },
  { value: 'closed',         label: 'Closed' },
  { value: 'reopened',       label: 'Reopened' },
  { value: 'rejected',       label: 'Rejected' },
];
const DEPT_OPTIONS = [
  { value: '', label: 'All Depts' },
  ...DEPARTMENTS.map(d => ({ value: d.name, label: d.name })),
];

interface NewGrievanceForm {
  citizenName: string; ward: string; category: string;
  severity: string; title: string; description: string; assignedDept: string;
}

export default function GrievancesPage() {
  const { grievances, loading, add, updateStatus, escalate, load } = useGrievanceStore();
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [selected, setSelected] = useState<Grievance | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [resolution, setResolution] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [assignOfficerInput, setAssignOfficerInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewGrievanceForm>();

  // Load all grievances from DB on mount
  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = grievances.filter(g => {
    const q = search.toLowerCase();
    const ms = !q || g.title.toLowerCase().includes(q) || g.grievanceId.toLowerCase().includes(q) || g.citizenName.toLowerCase().includes(q);
    const mc = !catFilter || g.category === catFilter;
    const mst = !statusFilter || g.status === statusFilter;
    const md = !deptFilter || g.assignedDept === deptFilter;
    return ms && mc && mst && md;
  });

  const liveSelected = selected ? (grievances.find(g => g.id === selected.id) ?? selected) : null;

  const onAdd = async (data: NewGrievanceForm) => {
    try {
      await add({
        citizenId: `c${Date.now()}`,
        citizenName: data.citizenName,
        ward: data.ward,
        category: data.category as GrievanceCategory,
        severity: data.severity as GrievanceSeverity,
        title: data.title,
        description: data.description,
      });
      toast.success('Grievance registered successfully');
      reset();
      setShowAdd(false);
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handleUpdateStatus = async (id: string, status: Grievance['status']) => {
    try {
      // Pass actor info so backend can record who made the change and fire correct notification
      const actorName = user?.name ?? 'Admin';
      const actorRole = user?.role?.toUpperCase() ?? 'ADMIN';
      await updateStatus(id, status, resolution || undefined, undefined, undefined, actorName, actorRole);
      toast.success(`Status updated to ${status.replace(/_/g, ' ')}`);
      setSelected(null);
      setResolution('');
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handleEscalate = async () => {
    if (!selected || !escalationReason.trim()) { toast.error('Enter escalation reason'); return; }
    try {
      await escalate(selected.id, escalationReason);
      toast.success('Grievance escalated');
      setSelected(null);
      setEscalationReason('');
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handleResolve = async () => {
    if (!selected || !resolution.trim()) { toast.error('Enter resolution details'); return; }
    await handleUpdateStatus(selected.id, 'resolved');
  };

  const counts = {
    pending:    grievances.filter(g => ['submitted','acknowledged','assigned'].includes(g.status)).length,
    inProgress: grievances.filter(g => ['in_progress','pending_citizen','reopened'].includes(g.status)).length,
    escalated:  grievances.filter(g => g.status === 'escalated').length,
    resolved:   grievances.filter(g => ['resolved','closed'].includes(g.status)).length,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Grievance Management" subtitle="Milestone 1 · Complaint Tracking & SLA Monitoring" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending" value={counts.pending} icon={Clock} color="amber" />
          <StatCard label="In Progress" value={counts.inProgress} icon={TrendingUp} color="teal" />
          <StatCard label="Escalated" value={counts.escalated} icon={AlertTriangle} color="rose" />
          <StatCard label="Resolved" value={counts.resolved} icon={CheckCircle} color="emerald" />
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search grievances…"
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            {[
              [catFilter, setCatFilter, CATEGORY_OPTIONS],
              [statusFilter, setStatusFilter, STATUS_OPTIONS],
              [deptFilter, setDeptFilter, DEPT_OPTIONS],
            ].map(([val, setter, opts], i) => (
              <select key={i} value={val as string} onChange={e => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                className="w-44 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                {(opts as {value:string;label:string}[]).map(o => <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>)}
              </select>
            ))}
            {(user?.role === 'admin' || user?.role === 'officer' || user?.role === 'commissioner') && (
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> New Grievance
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-3">{filtered.length} grievances</p>        </div>

        {/* Grievance Cards */}
        <div className="space-y-3">
          {loading && <div className="text-center py-12 text-slate-500">Loading…</div>}
          {!loading && filtered.map(g => (
            <div key={g.id} className="glass rounded-2xl p-5 hover:border-white/10 border border-white/5 transition-all cursor-pointer"
              onClick={() => { setSelected(g); setResolution(''); setEscalationReason(''); }}>
              <div className="flex items-start gap-4">
                <div className={clsx('w-1.5 h-full min-h-[60px] rounded-full self-stretch', {
                  'bg-slate-400':  g.status === 'submitted',
                  'bg-blue-400':   g.status === 'acknowledged' || g.status === 'assigned',
                  'bg-teal-400':   g.status === 'in_progress',
                  'bg-amber-400':  g.status === 'pending_citizen',
                  'bg-red-500':    g.status === 'escalated',
                  'bg-emerald-400':g.status === 'resolved',
                  'bg-slate-500':  g.status === 'closed' || g.status === 'rejected',
                  'bg-orange-400': g.status === 'reopened',
                })} />
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
                      <p className="text-xs text-slate-400 mt-1">
                        {g.grievanceId} · {g.citizenName} · {g.ward} · {g.category}
                      </p>
                    </div>
                    {statusBadge(g.status)}
                  </div>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-1">{g.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                    <span>🏢 {g.assignedDept}</span>
                    {g.assignedOfficer && <span>👤 {g.assignedOfficer}</span>}
                    <span className={clsx('font-medium', new Date(g.slaDeadline) < new Date() ? 'text-red-400' : 'text-amber-400')}>
                      ⏰ SLA: {g.slaDays}d · Due {g.slaDeadline}
                    </span>
                    <span>📅 Filed {g.createdAt}</span>
                  </div>
                  {g.resolution && (
                    <div className="mt-2 p-2 bg-emerald-500/10 rounded-lg text-xs text-emerald-400">
                      ✅ Resolution: {g.resolution}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500">No grievances found matching filters.</div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!liveSelected} onClose={() => { setSelected(null); setResolution(''); setEscalationReason(''); setAssignOfficerInput(''); }} title="Grievance Details" size="lg">
        {liveSelected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {([
                ['Grievance ID', liveSelected.grievanceId], ['Category', liveSelected.category],
                ['Citizen', liveSelected.citizenName], ['Ward', liveSelected.ward],
                ['Department', liveSelected.assignedDept], ['Officer', liveSelected.assignedOfficer || '—'],
                ['SLA Deadline', liveSelected.slaDeadline], ['Filed', liveSelected.createdAt?.toString().split('T')[0]],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-white mt-0.5 text-sm">{v}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-800/40 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-300">{liveSelected.description}</p>
            </div>

            {/* Assign officer */}
            <div className="flex gap-2">
              <input value={assignOfficerInput} onChange={e => setAssignOfficerInput(e.target.value)}
                placeholder={liveSelected.assignedOfficer ? `Reassign (current: ${liveSelected.assignedOfficer})` : 'Assign officer name…'}
                className="flex-1 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
              <button onClick={async () => {
                if (!assignOfficerInput.trim()) { toast.error('Enter officer name'); return; }
                try {
                  await (useGrievanceStore.getState() as any).assign(liveSelected.id, assignOfficerInput.trim());
                  toast.success(`Assigned to ${assignOfficerInput.trim()}`);
                  setAssignOfficerInput('');
                } catch (e) { toast.error(String(e)); }
              }} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-medium transition-colors">
                <UserCheck className="w-3.5 h-3.5" /> Assign
              </button>
            </div>

            {liveSelected.escalation && (
              <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                <p className="text-xs text-red-400 font-medium">Escalation Level {liveSelected.escalation.level}</p>
                <p className="text-sm text-slate-300 mt-1">{liveSelected.escalation.reason}</p>
              </div>
            )}

            {!['resolved','closed','rejected'].includes(liveSelected.status) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Resolution / Notes</label>
                  <textarea rows={2} value={resolution} onChange={e => setResolution(e.target.value)}
                    placeholder="Describe resolution or add notes…"
                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Escalation Reason</label>
                  <input value={escalationReason} onChange={e => setEscalationReason(e.target.value)}
                    placeholder="Reason for escalation…"
                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {liveSelected.status === 'submitted' && (
                    <button onClick={() => handleUpdateStatus(liveSelected.id, 'acknowledged')}
                      className="px-3 py-1.5 text-xs rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors">
                      Acknowledge
                    </button>
                  )}
                  {liveSelected.status === 'acknowledged' && (
                    <button onClick={() => handleUpdateStatus(liveSelected.id, 'assigned')}
                      className="px-3 py-1.5 text-xs rounded-lg border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 transition-colors">
                      Assign to Dept
                    </button>
                  )}
                  {['assigned','reopened'].includes(liveSelected.status) && (
                    <button onClick={() => handleUpdateStatus(liveSelected.id, 'in_progress')}
                      className="px-3 py-1.5 text-xs rounded-lg border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 transition-colors">
                      Mark In Progress
                    </button>
                  )}
                  {['in_progress','escalated','assigned'].includes(liveSelected.status) && (
                    <button onClick={() => {
                      const msg = prompt('Officer message to citizen (optional):') ?? '';
                      (async () => {
                        try {
                          await (useGrievanceStore.getState() as any).updateStatus(
                            liveSelected.id, 'pending_citizen', undefined, msg || undefined,
                            undefined, user?.name, user?.role?.toUpperCase()
                          );
                          toast.success('Awaiting citizen response');
                          setSelected(null);
                        } catch (e) { toast.error(String(e)); }
                      })();
                    }} className="px-3 py-1.5 text-xs rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors">
                      Request Info
                    </button>
                  )}
                  <button onClick={handleEscalate}
                    className="px-3 py-1.5 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                    Escalate
                  </button>
                  <button onClick={handleResolve}
                    className="px-4 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors">
                    Mark Resolved
                  </button>
                  <button onClick={() => handleUpdateStatus(liveSelected.id, 'rejected')}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors">
                    Reject
                  </button>
                </div>
              </>
            )}

            {liveSelected.resolution && (
              <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 font-medium">Resolution</p>
                <p className="text-sm text-slate-300 mt-1">{liveSelected.resolution}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* New Grievance Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Register New Grievance" size="lg">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Citizen Name" placeholder="Full name" error={errors.citizenName?.message}
              {...register('citizenName', { required: 'Required' })} />
            <Select label="Ward" options={[
              { value: '', label: 'Select Ward' },
              ...Array.from({ length: 20 }, (_, i) => ({ value: `Ward ${i + 1}`, label: `Ward ${i + 1}` })),
            ]} error={errors.ward?.message}
              {...register('ward', { required: 'Required' })} />
            <Select label="Category" options={CATEGORY_OPTIONS.filter(o => o.value)} error={errors.category?.message}
              {...register('category', { required: 'Required' })} />
            <Select label="Severity" options={[
              { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
            ]} error={errors.severity?.message}
              {...register('severity', { required: 'Required' })} />
          </div>
          <Input label="Title" placeholder="Brief description of issue" error={errors.title?.message}
            {...register('title', { required: 'Required', minLength: { value: 5, message: 'Too short' } })} />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea rows={3} placeholder="Detailed description…"
              className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              {...register('description', { required: 'Required' })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
              {loading ? 'Registering…' : 'Register Grievance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
