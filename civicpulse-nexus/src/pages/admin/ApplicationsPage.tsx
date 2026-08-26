import { useState, useEffect } from 'react';
import { Search, FileCheck, Clock, CheckCircle, XCircle, Eye, Download, CreditCard, UserCheck, PenLine, RefreshCw } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { statusBadge } from '../../components/ui/Badge';
import type { ServiceApplication, ApplicationStatus } from '../../types';
import toast from 'react-hot-toast';
import { useApplicationStore } from '../../store/applicationStore';
import { useAuthStore } from '../../store/authStore';
import { WORKFLOW_TRANSITIONS, STATUS_LABELS, WORKFLOW_TEMPLATES } from '../../services/applicationService';

const STATUS_OPTS = [
  { value: '', label: 'All Statuses' },
  { value: 'submitted',             label: 'Submitted' },
  { value: 'under_review',          label: 'Under Review' },
  { value: 'document_verification', label: 'Doc Verification' },
  { value: 'documents_pending',     label: 'Docs Pending' },
  { value: 'pending_information',   label: 'Info Needed' },
  { value: 'verified',              label: 'Verified' },
  { value: 'approved',              label: 'Approved' },
  { value: 'issued',                label: 'Issued' },
  { value: 'rejected',              label: 'Rejected' },
  { value: 'cancelled',             label: 'Cancelled' },
];

const CAT_OPTS = [
  { value: '', label: 'All Types' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'permit', label: 'Permit' },
];

export default function ApplicationsPage() {
  const { applications, loading, updateStatus, verifyDocument, markFeePaid, downloadCert, assignOfficer, signApplication, load } = useApplicationStore();
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [selected, setSelected] = useState<ServiceApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [assignOfficerInput, setAssignOfficerInput] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'workflow' | 'signature'>('details');
  const [refreshing, setRefreshing] = useState(false);

  // Load all applications from DB on mount
  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  const filtered = applications.filter(a => {
    const q = search.toLowerCase();
    const ms = !q || a.citizenName.toLowerCase().includes(q) || a.appId.toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
    const mst = !statusFilter || a.status === statusFilter;
    const mc = !catFilter || a.category === catFilter;
    return ms && mst && mc;
  });

  const counts = {
    pending: applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length,
    docsPending: applications.filter(a => a.status === 'documents_pending').length,
    approved: applications.filter(a => a.status === 'approved' || a.status === 'issued').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const liveSelected = selected ? (applications.find(a => a.id === selected.id) ?? selected) : null;
  const availableTransitions = liveSelected ? WORKFLOW_TRANSITIONS[liveSelected.status] : [];
  const workflowSteps = liveSelected ? WORKFLOW_TEMPLATES[liveSelected.category]?.steps ?? [] : [];

  const handleUpdateStatus = async (id: string, status: ApplicationStatus) => {
    try {
      await updateStatus(id, status, notes.trim() || undefined);
      toast.success(`Status → ${STATUS_LABELS[status]}`);
      setNotes('');
    } catch (e) { toast.error(String(e)); }
  };

  const handleVerifyDoc = async (appId: string, docName: string) => {
    try {
      await verifyDocument(appId, docName);
      toast.success(`${docName} verified`);
    } catch (e) { toast.error(String(e)); }
  };

  const handleFeePaid = async (id: string) => {
    try {
      await markFeePaid(id);
      toast.success('Fee marked as paid');
    } catch (e) { toast.error(String(e)); }
  };

  const handleDownload = async (id: string) => {
    await downloadCert(id);
    toast.success('Certificate opened for print/download');
  };

  const handleAssign = async () => {
    if (!liveSelected || !assignOfficerInput.trim()) { toast.error('Enter officer name'); return; }
    try {
      await assignOfficer(liveSelected.id, assignOfficerInput.trim());
      toast.success(`Assigned to ${assignOfficerInput}`);
      setAssignOfficerInput('');
    } catch (e) { toast.error(String(e)); }
  };

  const handleSign = async () => {
    if (!liveSelected || !user) return;
    try {
      await signApplication(liveSelected.id, user.name);
      toast.success('Digitally signed successfully');
    } catch (e) { toast.error(String(e)); }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Applications" subtitle="Milestone 2 · Certificate & Permit Management" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending Review" value={counts.pending} icon={Clock} color="amber" />
          <StatCard label="Docs Pending" value={counts.docsPending} icon={FileCheck} color="violet" />
          <StatCard label="Approved / Issued" value={counts.approved} icon={CheckCircle} color="emerald" />
          <StatCard label="Rejected" value={counts.rejected} icon={XCircle} color="rose" />
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, app ID or type…"
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            {[
              [statusFilter, setStatusFilter, STATUS_OPTS],
              [catFilter, setCatFilter, CAT_OPTS],
            ].map(([val, setter, opts], i) => (
              <select key={i} value={val as string}
                onChange={e => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                className="w-44 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                {(opts as { value: string; label: string }[]).map(o => (
                  <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>
                ))}
              </select>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">{filtered.length} applications</p>
          <div className="flex justify-end mt-2">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-teal-400 border border-white/10 rounded-xl hover:bg-teal-500/5 transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-white/5 bg-slate-900/40">
                  <th className="text-left px-5 py-3 font-medium">App ID</th>
                  <th className="text-left px-5 py-3 font-medium">Citizen</th>
                  <th className="text-left px-5 py-3 font-medium">Type</th>
                  <th className="text-left px-5 py-3 font-medium">Officer</th>
                  <th className="text-left px-5 py-3 font-medium">Fee</th>
                  <th className="text-left px-5 py-3 font-medium">Docs</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Downloads</th>
                  <th className="text-left px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && <tr><td colSpan={9} className="px-5 py-8 text-center text-slate-500">Loading…</td></tr>}
                {!loading && filtered.map(a => {
                  const verifiedDocs = a.documents.filter(d => d.verified).length;
                  return (
                    <tr key={a.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-teal-400">{a.appId}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/30 to-teal-500/30 flex items-center justify-center text-xs font-bold text-white">
                            {a.citizenName[0]}
                          </div>
                          <span className="text-white font-medium">{a.citizenName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-slate-300 text-xs">{a.type}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${a.category === 'certificate' ? 'bg-teal-500/15 text-teal-400' : 'bg-violet-500/15 text-violet-400'}`}>
                            {a.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">{a.assignedOfficer ?? <span className="text-slate-600">unassigned</span>}</td>
                      <td className="px-5 py-3">
                        <span className={`text-sm font-medium ${a.feePaid ? 'text-emerald-400' : 'text-red-400'}`}>
                          ₹{a.fee}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">{a.feePaid ? '✓' : '✗'}</span>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        <span className={verifiedDocs === a.documents.length ? 'text-emerald-400' : 'text-amber-400'}>
                          {verifiedDocs}/{a.documents.length}
                        </span>
                      </td>
                      <td className="px-5 py-3">{statusBadge(a.status)}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{a.downloadCount ?? 0}×</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelected(a); setNotes(''); setActiveTab('details'); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-all" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          {(a.status === 'issued' || a.status === 'approved') && (
                            <button onClick={() => handleDownload(a.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Download">
                              <Download className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Detail Modal */}
      <Modal isOpen={!!liveSelected} onClose={() => { setSelected(null); setNotes(''); }} title="Application Details" size="xl">
        {liveSelected && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
              {(['details', 'workflow', 'signature'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${
                    activeTab === tab ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}>
                  {tab === 'details' ? '📋 Details' : tab === 'workflow' ? '⚙️ Workflow' : '🔐 Signature'}
                </button>
              ))}
            </div>

            {/* DETAILS TAB */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {([
                    ['App ID', liveSelected.appId],
                    ['Citizen', liveSelected.citizenName],
                    ['Type', liveSelected.type],
                    ['Category', liveSelected.category],
                    ['Fee', `₹${liveSelected.fee} (${liveSelected.feePaid ? 'Paid' : 'Unpaid'})`],
                    ['Submitted', liveSelected.submittedAt],
                    ...(liveSelected.approvedAt ? [['Approved', liveSelected.approvedAt]] : []),
                    ...(liveSelected.issuedAt ? [['Issued', liveSelected.issuedAt]] : []),
                    ...(liveSelected.certificateNo ? [['Certificate No', liveSelected.certificateNo]] : []),
                    ...(liveSelected.validUntil ? [['Valid Until', liveSelected.validUntil]] : []),
                    ['Downloads', `${liveSelected.downloadCount ?? 0} times`],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="bg-slate-800/40 rounded-xl p-3">
                      <p className="text-xs text-slate-500">{k}</p>
                      <p className="text-white mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>

                {/* Assign Officer */}
                <div className="flex gap-2">
                  <input value={assignOfficerInput} onChange={e => setAssignOfficerInput(e.target.value)}
                    placeholder={liveSelected.assignedOfficer ? `Reassign (current: ${liveSelected.assignedOfficer})` : 'Assign officer name…'}
                    className="flex-1 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                  <button onClick={handleAssign}
                    className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-medium transition-colors">
                    <UserCheck className="w-3.5 h-3.5" /> Assign
                  </button>
                </div>

                {/* Fee payment */}
                {!liveSelected.feePaid && (
                  <button onClick={() => handleFeePaid(liveSelected.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">
                    <CreditCard className="w-4 h-4" /> Mark Fee as Paid (₹{liveSelected.fee})
                  </button>
                )}

                {/* Documents */}
                <div>
                  <p className="text-sm font-semibold text-white mb-2">Documents</p>
                  <div className="space-y-2">
                    {liveSelected.documents.map(doc => (
                      <div key={doc.name} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                        <div className="flex items-center gap-2">
                          <FileCheck className={`w-4 h-4 ${doc.verified ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span className="text-sm text-slate-300">{doc.name}</span>
                        </div>
                        {doc.verified ? (
                          <span className="text-xs text-emerald-400 font-medium">✓ Verified</span>
                        ) : (
                          <button onClick={() => handleVerifyDoc(liveSelected.id, doc.name)}
                            className="text-xs px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors">
                            Verify
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {liveSelected.notes && (
                  <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                    <p className="text-xs text-amber-400 font-medium">Notes</p>
                    <p className="text-sm text-slate-300 mt-1">{liveSelected.notes}</p>
                  </div>
                )}

                {availableTransitions.length > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes (optional)</label>
                      <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Internal notes or reason…"
                        className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {availableTransitions.map(s => (
                        <button key={s} onClick={() => handleUpdateStatus(liveSelected.id, s)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                            s === 'issued' ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : s === 'rejected' ? 'bg-red-600 hover:bg-red-500 text-white'
                            : s === 'approved' ? 'bg-teal-600 hover:bg-teal-500 text-white'
                            : 'border border-white/10 text-slate-300 hover:bg-white/5'
                          }`}>
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {(liveSelected.status === 'issued' || liveSelected.status === 'approved') && (
                  <button onClick={() => handleDownload(liveSelected.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-xl text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" /> Download / Print Certificate
                  </button>
                )}
              </div>
            )}

            {/* WORKFLOW TAB */}
            {activeTab === 'workflow' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Template: <span className="text-teal-400 capitalize">{liveSelected.category}</span> workflow
                  · {workflowSteps.length} steps
                </p>
                {workflowSteps.map((step, i) => {
                  const statusMap: Record<ApplicationStatus, number> = {
                    submitted: 0, under_review: 1, documents_pending: 2,
                    verified: 3, approved: 4, issued: 6, rejected: -1,
                  };
                  const currentIdx = statusMap[liveSelected.status] ?? 0;
                  const stepStatus = i < currentIdx ? 'completed' : i === currentIdx ? 'in_progress' : 'pending';
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                      stepStatus === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20' :
                      stepStatus === 'in_progress' ? 'bg-teal-500/10 border-teal-500/30' :
                      'bg-slate-800/30 border-white/5'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        stepStatus === 'completed' ? 'bg-emerald-500 text-white' :
                        stepStatus === 'in_progress' ? 'bg-teal-500 text-white' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {stepStatus === 'completed' ? '✓' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${stepStatus === 'pending' ? 'text-slate-500' : 'text-white'}`}>
                          {step.name}
                        </p>
                        <p className="text-xs text-slate-500">{step.assignedRole} · Est. {step.days}d</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        stepStatus === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                        stepStatus === 'in_progress' ? 'bg-teal-500/15 text-teal-400' :
                        'bg-slate-700/50 text-slate-500'
                      }`}>
                        {stepStatus.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SIGNATURE TAB */}
            {activeTab === 'signature' && (
              <div className="space-y-4">
                {liveSelected.digitalSignature ? (
                  <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 space-y-3">
                    <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                      🔐 Digitally Signed
                    </p>
                    {([
                      ['Signed By', liveSelected.digitalSignature.signedBy],
                      ['Signature ID', liveSelected.digitalSignature.signatureId],
                      ['Verification Code', liveSelected.digitalSignature.verificationCode],
                      ['Signed At', new Date(liveSelected.digitalSignature.signedAt).toLocaleString('en-IN')],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between gap-3">
                        <span className="text-xs text-slate-500 shrink-0">{k}</span>
                        <span className="text-xs text-white font-mono text-right break-all">{v}</span>
                      </div>
                    ))}
                    {liveSelected.qrCode && (
                      <div className="bg-slate-800/60 rounded-xl p-3 mt-2">
                        <p className="text-xs text-slate-500 mb-1">QR Verification Code</p>
                        <p className="text-xs font-mono text-teal-400 break-all">{liveSelected.qrCode}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="text-4xl">✍️</div>
                    <p className="text-slate-400 text-sm">This application has not been digitally signed yet.</p>
                    {(user?.role === 'commissioner' || user?.role === 'admin') && (
                      <button onClick={handleSign}
                        className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors mx-auto">
                        <PenLine className="w-4 h-4" /> Sign Digitally as {user.name}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
