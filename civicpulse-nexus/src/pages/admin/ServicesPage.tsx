import { useState } from 'react';
import { Search, Plus, Award, Clock, CheckCircle } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { statusBadge } from '../../components/ui/Badge';
import { useApplicationStore } from '../../store/applicationStore';
import { REQUIRED_DOCS, SERVICE_FEES } from '../../services/applicationService';
import type { CertificateType, PermitType } from '../../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const CERT_TYPES: CertificateType[] = [
  'Birth Certificate', 'Death Certificate', 'Income Certificate',
  'Residence Certificate', 'Marriage Certificate', 'Caste Certificate',
];
const PERMIT_TYPES: PermitType[] = [
  'Trade License', 'Building Permit', 'Food License', 'Event Permit', 'Signage Permit',
];

const SERVICE_DESC: Record<string, { desc: string; days: number }> = {
  'Birth Certificate':     { desc: 'Official record of birth for a child', days: 3 },
  'Death Certificate':     { desc: 'Official record of death', days: 2 },
  'Income Certificate':    { desc: 'Certifies annual family income', days: 7 },
  'Residence Certificate': { desc: 'Proof of domicile / residence', days: 5 },
  'Marriage Certificate':  { desc: 'Official marriage registration', days: 10 },
  'Caste Certificate':     { desc: 'Certifies caste for reservations', days: 14 },
  'Trade License':         { desc: 'License to operate a business', days: 21 },
  'Building Permit':       { desc: 'Permission to construct / renovate', days: 30 },
  'Food License':          { desc: 'FSSAI food business license', days: 15 },
  'Event Permit':          { desc: 'Permission to organise a public event', days: 7 },
  'Signage Permit':        { desc: 'Permission for outdoor signage', days: 5 },
};

interface NewServiceForm {
  citizenName: string;
  type: string;
  category: string;
  citizenId: string;
}

export default function ServicesPage() {
  const { applications, add } = useApplicationStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [infoType, setInfoType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<NewServiceForm>({
    defaultValues: { category: 'certificate' },
  });
  const watchCategory = watch('category', 'certificate');

  const filtered = applications.filter(a => {
    const q = search.toLowerCase();
    const ms = !q || a.type.toLowerCase().includes(q) || a.citizenName.toLowerCase().includes(q) || a.appId.toLowerCase().includes(q);
    const mc = !catFilter || a.category === catFilter;
    return ms && mc;
  });

  const certCount = applications.filter(a => a.category === 'certificate').length;
  const permitCount = applications.filter(a => a.category === 'permit').length;
  const issuedCount = applications.filter(a => a.status === 'issued').length;
  const pendingCount = applications.filter(a => ['submitted', 'under_review', 'documents_pending'].includes(a.status)).length;

  const onAdd = async (data: NewServiceForm) => {
    setSubmitting(true);
    try {
      await add({
        citizenId: data.citizenId || `c${Date.now()}`,
        citizenName: data.citizenName,
        type: data.type as CertificateType | PermitType,
        category: data.category as 'certificate' | 'permit',
      });
      toast.success(`${data.type} application submitted`);
      reset({ category: 'certificate' });
      setShowAdd(false);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions = watchCategory === 'permit'
    ? PERMIT_TYPES.map(v => ({ value: v, label: v }))
    : CERT_TYPES.map(v => ({ value: v, label: v }));

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Services Catalogue" subtitle="Milestone 2 · Certificate & Permit Applications" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Certificates" value={certCount} icon={Award} color="teal" />
          <StatCard label="Permits" value={permitCount} icon={Award} color="violet" />
          <StatCard label="Issued" value={issuedCount} icon={CheckCircle} color="emerald" />
          <StatCard label="In Progress" value={pendingCount} icon={Clock} color="amber" />
        </div>

        {/* Service Cards */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Available Services</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(SERVICE_DESC).map(([name, info]) => {
              const isCert = CERT_TYPES.includes(name as CertificateType);
              const docs = REQUIRED_DOCS[name] ?? [];
              const fee = SERVICE_FEES[name] ?? 0;
              return (
                <div key={name}
                  className="glass rounded-2xl p-4 border border-white/5 hover:border-teal-500/20 transition-all cursor-pointer"
                  onClick={() => setInfoType(name)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{info.desc}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${isCert ? 'bg-teal-500/15 text-teal-400' : 'bg-violet-500/15 text-violet-400'}`}>
                      {isCert ? 'cert' : 'permit'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                    <span>⏱ {info.days}d</span>
                    <span>📄 {docs.length} docs</span>
                    <span className={fee === 0 ? 'text-emerald-400' : ''}>{fee === 0 ? 'Free' : `₹${fee}`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applications Table */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-white">Applications</h3>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Application
            </button>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[180px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="w-40 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30">
              <option value="" className="bg-slate-800">All Types</option>
              <option value="certificate" className="bg-slate-800">Certificate</option>
              <option value="permit" className="bg-slate-800">Permit</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-white/5">
                  <th className="text-left pb-2 font-medium">App ID</th>
                  <th className="text-left pb-2 font-medium">Citizen</th>
                  <th className="text-left pb-2 font-medium">Type</th>
                  <th className="text-left pb-2 font-medium">Fee</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-2.5 font-mono text-xs text-teal-400">{a.appId}</td>
                    <td className="py-2.5 text-white">{a.citizenName}</td>
                    <td className="py-2.5 text-slate-300">{a.type}</td>
                    <td className="py-2.5">
                      <span className={`text-sm font-medium ${a.feePaid ? 'text-emerald-400' : 'text-red-400'}`}>
                        {SERVICE_FEES[a.type] === 0 ? 'Free' : `₹${a.fee}`}
                      </span>
                    </td>
                    <td className="py-2.5">{statusBadge(a.status)}</td>
                    <td className="py-2.5 text-xs text-slate-500">{a.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Service Info Modal */}
      <Modal isOpen={!!infoType} onClose={() => setInfoType(null)} title={infoType || ''} size="sm">
        {infoType && SERVICE_DESC[infoType] && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">{SERVICE_DESC[infoType].desc}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-800/40 rounded-xl p-3">
                <p className="text-xs text-slate-500">Processing</p>
                <p className="text-white font-medium mt-0.5">{SERVICE_DESC[infoType].days}d</p>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-3">
                <p className="text-xs text-slate-500">Fee</p>
                <p className={`font-medium mt-0.5 ${SERVICE_FEES[infoType] === 0 ? 'text-emerald-400' : 'text-white'}`}>
                  {SERVICE_FEES[infoType] === 0 ? 'Free' : `₹${SERVICE_FEES[infoType]}`}
                </p>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-3">
                <p className="text-xs text-slate-500">Docs</p>
                <p className="text-white font-medium mt-0.5">{(REQUIRED_DOCS[infoType] ?? []).length}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Required Documents</p>
              <ul className="space-y-1.5">
                {(REQUIRED_DOCS[infoType] ?? []).map(d => (
                  <li key={d} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* New Application Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Service Application" size="md">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <Input label="Citizen Name" placeholder="Full name" error={errors.citizenName?.message}
            {...register('citizenName', { required: 'Required' })} />
          <Input label="Citizen ID (optional)" placeholder="c1, c2… or leave blank"
            {...register('citizenId')} />
          <Select label="Category" options={[
            { value: 'certificate', label: 'Certificate' },
            { value: 'permit', label: 'Permit' },
          ]} error={errors.category?.message}
            {...register('category', { required: 'Required' })} />
          <Select label="Service Type" options={[{ value: '', label: 'Select type' }, ...typeOptions]}
            error={errors.type?.message}
            {...register('type', { required: 'Required' })} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
