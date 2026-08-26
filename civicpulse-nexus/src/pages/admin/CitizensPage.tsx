import { useState } from 'react';
import { Search, UserPlus, Eye, Edit2, AlertCircle, FileText } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { GRIEVANCES, APPLICATIONS } from '../../data/mockData';
import type { Citizen } from '../../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useCitizenStore } from '../../store/citizenStore';

const WARD_OPTIONS = [
  { value: '', label: 'All Wards' },
  ...Array.from({ length: 20 }, (_, i) => ({ value: `Ward ${i + 1}`, label: `Ward ${i + 1}` })),
];
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

interface NewCitizenForm {
  name: string; email: string; phone: string;
  ward: string; address: string; aadhaar: string;
}

export default function CitizensPage() {
  const { citizens, loading, add } = useCitizenStore();
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Citizen | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewCitizenForm>();

  const filtered = citizens.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.citizenId.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchWard = !wardFilter || c.ward === wardFilter;
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchWard && matchStatus;
  });

  const activeCount = citizens.filter(c => c.status === 'active').length;

  const onAdd = async (data: NewCitizenForm) => {
    try {
      await add({ ...data, status: 'active' });
      toast.success(`Citizen ${data.name} registered successfully`);
      reset();
      setShowAdd(false);
    } catch (e) {
      toast.error(String(e));
    }
  };

  const citizenGrievances = selected ? GRIEVANCES.filter(g => g.citizenId === selected.id) : [];
  const citizenApps = selected ? APPLICATIONS.filter(a => a.citizenId === selected.id) : [];

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Citizen Management" subtitle="Milestone 1 · Registration & KYC" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Citizens" value={citizens.length.toLocaleString()} icon={AlertCircle} color="teal" />
          <StatCard label="Active" value={activeCount} icon={AlertCircle} color="emerald" />
          <StatCard label="Inactive" value={citizens.filter(c => c.status === 'inactive').length} icon={AlertCircle} color="amber" />
          <StatCard label="Suspended" value={citizens.filter(c => c.status === 'suspended').length} icon={AlertCircle} color="rose" />
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, ID or email…"
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div className="w-40">
              <select value={wardFilter} onChange={e => setWardFilter(e.target.value)}
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                {WARD_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>)}
              </select>
            </div>
            <div className="w-40">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>)}
              </select>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition-colors">
              <UserPlus className="w-4 h-4" /> Register Citizen
            </button>
          </div>
          <p className="text-xs text-slate-500">{filtered.length} citizens found</p>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-white/5 bg-slate-900/40">
                  <th className="text-left px-5 py-3 font-medium">Citizen ID</th>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Contact</th>
                  <th className="text-left px-5 py-3 font-medium">Ward</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Grievances</th>
                  <th className="text-left px-5 py-3 font-medium">Applications</th>
                  <th className="text-left px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-500">Loading…</td></tr>
                )}
                {!loading && filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-teal-400">{c.citizenId}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500/30 to-violet-500/30 flex items-center justify-center text-xs font-bold text-white">
                          {c.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-white">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-xs">{c.phone}</td>
                    <td className="px-5 py-3"><Badge variant="info">{c.ward}</Badge></td>
                    <td className="px-5 py-3">{statusBadge(c.status)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-sm font-bold ${c.grievancesCount > 2 ? 'text-red-400' : 'text-slate-300'}`}>{c.grievancesCount}</span>
                    </td>
                    <td className="px-5 py-3 text-center text-slate-300">{c.applicationsCount}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Citizen Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Citizen Profile" size="xl">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-xl font-bold text-white">
                {selected.name[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                <p className="text-sm text-slate-400">{selected.citizenId} · {selected.ward}</p>
                <div className="mt-1">{statusBadge(selected.status)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {([
                ['Email', selected.email], ['Phone', selected.phone],
                ['Address', selected.address], ['Aadhaar', selected.aadhaar],
                ['Registered', selected.registeredAt],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-white mt-0.5 break-all">{v}</p>
                </div>
              ))}
            </div>

            {citizenGrievances.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" /> Grievances ({citizenGrievances.length})
                </h4>
                <div className="space-y-2">
                  {citizenGrievances.map(g => (
                    <div key={g.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl text-sm">
                      <div>
                        <span className="text-white font-medium">{g.title}</span>
                        <p className="text-xs text-slate-400">{g.grievanceId} · {g.category}</p>
                      </div>
                      {statusBadge(g.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {citizenApps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" /> Applications ({citizenApps.length})
                </h4>
                <div className="space-y-2">
                  {citizenApps.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl text-sm">
                      <div>
                        <span className="text-white font-medium">{a.type}</span>
                        <p className="text-xs text-slate-400">{a.appId} · ₹{a.fee}</p>
                      </div>
                      {statusBadge(a.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Citizen Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Register New Citizen" size="lg">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name" placeholder="As per Aadhaar" error={errors.name?.message}
              {...register('name', { required: 'Required', minLength: { value: 2, message: 'Too short' } })} />
            <Input label="Email" type="email" placeholder="email@example.com" error={errors.email?.message}
              {...register('email', { required: 'Required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid' } })} />
            <Input label="Phone" placeholder="10-digit number" error={errors.phone?.message}
              {...register('phone', { required: 'Required', pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid' } })} />
            <Select label="Ward" options={WARD_OPTIONS.filter(o => o.value)} error={errors.ward?.message}
              {...register('ward', { required: 'Required' })} />
          </div>
          <Input label="Address" placeholder="Full residential address" error={errors.address?.message}
            {...register('address', { required: 'Required', minLength: { value: 10, message: 'Too short' } })} />
          <Input label="Aadhaar Number" placeholder="XXXX-XXXX-XXXX" error={errors.aadhaar?.message}
            {...register('aadhaar', { required: 'Required', pattern: { value: /^\d{4}-?\d{4}-?\d{4}$/, message: 'Invalid format' } })} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 transition-all text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
              {loading ? 'Registering…' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
