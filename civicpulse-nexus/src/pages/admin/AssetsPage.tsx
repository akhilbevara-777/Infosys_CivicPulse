import { useState } from 'react';
import { Search, Wrench, CheckCircle, AlertTriangle, Package } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { MUNICIPAL_ASSETS } from '../../services/assetService';
import type { MunicipalAsset, AssetStatus } from '../../types';
import toast from 'react-hot-toast';

const STATUS_COLOR: Record<AssetStatus, string> = {
  operational:       'bg-emerald-500/15 text-emerald-400',
  under_maintenance: 'bg-amber-500/15 text-amber-400',
  decommissioned:    'bg-slate-500/15 text-slate-400',
  disposed:          'bg-red-500/15 text-red-400',
};

const CAT_ICON: Record<string, string> = {
  Vehicle: '🚛', Equipment: '⚙️', 'IT Asset': '💻',
  Building: '🏢', Land: '🗺️', Infrastructure: '🏗️',
};

export default function AssetsPage() {
  const [assets, setAssets] = useState(MUNICIPAL_ASSETS);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<MunicipalAsset | null>(null);
  const [maintenanceDate, setMaintenanceDate] = useState('');

  const categories = [...new Set(MUNICIPAL_ASSETS.map(a => a.category))];
  const today = new Date().toISOString().split('T')[0];

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const ms = !q || a.name.toLowerCase().includes(q) || a.assetId.toLowerCase().includes(q) || a.department.toLowerCase().includes(q);
    const mc = !catFilter || a.category === catFilter;
    const mst = !statusFilter || a.status === statusFilter;
    return ms && mc && mst;
  });

  const stats = {
    total: assets.length,
    operational: assets.filter(a => a.status === 'operational').length,
    maintenance: assets.filter(a => a.status === 'under_maintenance').length,
    maintenanceDue: assets.filter(a => a.nextMaintenanceDate && a.nextMaintenanceDate <= today).length,
    totalValue: assets.reduce((s, a) => s + a.currentValue, 0),
  };

  const handleUpdateStatus = (id: string, status: AssetStatus) => {
    setAssets(prev => prev.map(a => a.id !== id ? a : {
      ...a, status,
      lastMaintenanceDate: status === 'under_maintenance' ? today : a.lastMaintenanceDate,
    }));
    toast.success(`Asset status updated to ${status.replace('_', ' ')}`);
    setSelected(null);
  };

  const handleScheduleMaintenance = () => {
    if (!selected || !maintenanceDate) { toast.error('Select a date'); return; }
    setAssets(prev => prev.map(a => a.id !== selected.id ? a : { ...a, nextMaintenanceDate: maintenanceDate }));
    toast.success('Maintenance scheduled');
    setMaintenanceDate('');
    setSelected(null);
  };

  const liveSelected = selected ? (assets.find(a => a.id === selected.id) ?? selected) : null;

  const fmt = (n: number) =>
    n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` : `₹${(n / 100000).toFixed(0)}L`;

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Asset Management" subtitle="Municipal Assets · Tracking & Maintenance" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Assets"    value={stats.total}                      icon={Package}       color="teal"   />
          <StatCard label="Operational"     value={stats.operational}                icon={CheckCircle}   color="emerald"/>
          <StatCard label="In Maintenance"  value={stats.maintenance}                icon={Wrench}        color="amber"  />
          <StatCard label="Maintenance Due" value={stats.maintenanceDue}             icon={AlertTriangle} color="rose"   />
          <StatCard label="Total Value"     value={fmt(stats.totalValue)}            icon={Package}       color="violet" />
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, ID or department…"
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="w-44 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30">
              <option value="" className="bg-slate-800">All Categories</option>
              {categories.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-44 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30">
              <option value="" className="bg-slate-800">All Statuses</option>
              <option value="operational" className="bg-slate-800">Operational</option>
              <option value="under_maintenance" className="bg-slate-800">Under Maintenance</option>
              <option value="decommissioned" className="bg-slate-800">Decommissioned</option>
            </select>
          </div>
          <p className="text-xs text-slate-500 mt-3">{filtered.length} assets</p>
        </div>

        {/* Asset Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => {
            const isDue = a.nextMaintenanceDate && a.nextMaintenanceDate <= today;
            return (
              <div key={a.id}
                className={`glass rounded-2xl p-5 border transition-all cursor-pointer hover:border-teal-500/20 ${isDue ? 'border-amber-500/30' : 'border-white/5'}`}
                onClick={() => setSelected(a)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CAT_ICON[a.category] ?? '📦'}</span>
                    <div>
                      <p className="text-white font-medium text-sm leading-tight">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.assetId}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-1 ${STATUS_COLOR[a.status]}`}>
                    {a.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <span>🏢 {a.department}</span>
                  <span>📍 {a.location}</span>
                  <span>💰 {fmt(a.currentValue)}</span>
                  <span className={isDue ? 'text-amber-400 font-medium' : ''}>
                    🔧 {a.nextMaintenanceDate ? (isDue ? `Due: ${a.nextMaintenanceDate}` : `Next: ${a.nextMaintenanceDate}`) : 'No schedule'}
                  </span>
                </div>
                {a.assignedTo && (
                  <p className="text-xs text-slate-500 mt-2">👤 {a.assignedTo}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Asset Detail Modal */}
      <Modal isOpen={!!liveSelected} onClose={() => { setSelected(null); setMaintenanceDate(''); }} title="Asset Details" size="lg">
        {liveSelected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-xl">
              <span className="text-4xl">{CAT_ICON[liveSelected.category] ?? '📦'}</span>
              <div>
                <h3 className="text-lg font-bold text-white">{liveSelected.name}</h3>
                <p className="text-sm text-slate-400">{liveSelected.assetId} · {liveSelected.category}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${STATUS_COLOR[liveSelected.status]}`}>
                  {liveSelected.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {([
                ['Department', liveSelected.department],
                ['Location', liveSelected.location],
                ['Purchase Date', liveSelected.purchaseDate],
                ['Purchase Value', fmt(liveSelected.purchaseValue)],
                ['Current Value', fmt(liveSelected.currentValue)],
                ['Assigned To', liveSelected.assignedTo ?? '—'],
                ['Last Maintenance', liveSelected.lastMaintenanceDate ?? '—'],
                ['Next Maintenance', liveSelected.nextMaintenanceDate ?? '—'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-white mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-800/40 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-300">{liveSelected.description}</p>
            </div>

            {/* Depreciation */}
            <div className="bg-slate-800/40 rounded-xl p-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Depreciation</span>
                <span className="text-white font-medium">
                  {Math.round((1 - liveSelected.currentValue / liveSelected.purchaseValue) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${Math.round((1 - liveSelected.currentValue / liveSelected.purchaseValue) * 100)}%` }} />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input type="date" value={maintenanceDate} onChange={e => setMaintenanceDate(e.target.value)}
                  min={today}
                  className="flex-1 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                <button onClick={handleScheduleMaintenance}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap">
                  Schedule Maintenance
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {liveSelected.status !== 'operational' && (
                  <button onClick={() => handleUpdateStatus(liveSelected.id, 'operational')}
                    className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors">
                    Mark Operational
                  </button>
                )}
                {liveSelected.status !== 'under_maintenance' && (
                  <button onClick={() => handleUpdateStatus(liveSelected.id, 'under_maintenance')}
                    className="px-3 py-1.5 text-xs rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors">
                    Send to Maintenance
                  </button>
                )}
                {liveSelected.status !== 'decommissioned' && (
                  <button onClick={() => handleUpdateStatus(liveSelected.id, 'decommissioned')}
                    className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 transition-colors">
                    Decommission
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
