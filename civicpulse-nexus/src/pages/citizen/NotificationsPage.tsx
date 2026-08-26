import { useEffect, useState } from 'react';
import {
  Bell, CheckCheck, AlertCircle, FileText, Info,
  AlertTriangle, Award, Heart, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/layout/TopBar';
import { StatCard } from '../../components/ui/StatCard';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useSearchStore } from '../../store/searchStore';
import type { AppNotification, NotifType } from '../../types';

// ─── Type → UI mapping ────────────────────────────────────────────────────────
type UICategory = 'grievance' | 'application' | 'welfare' | 'alert' | 'info';

function getCategory(type: NotifType): UICategory {
  if (type.startsWith('GRIEVANCE'))   return 'grievance';
  if (type.startsWith('APPLICATION') || type === 'DOCUMENT_REQUIRED' || type === 'CERTIFICATE_ISSUED') return 'application';
  if (type.startsWith('WELFARE'))     return 'welfare';
  if (type === 'SYSTEM_ALERT' || type === 'GRIEVANCE_SLA_BREACHED' || type === 'GRIEVANCE_SLA_WARNING') return 'alert';
  return 'info';
}

const ICON: Record<UICategory, React.ElementType> = {
  grievance:   AlertCircle,
  application: FileText,
  welfare:     Heart,
  alert:       AlertTriangle,
  info:        Info,
};
const COLOR: Record<UICategory, string> = {
  grievance:   'text-amber-400 bg-amber-500/10',
  application: 'text-teal-400 bg-teal-500/10',
  welfare:     'text-pink-400 bg-pink-500/10',
  alert:       'text-red-400 bg-red-500/10',
  info:        'text-blue-400 bg-blue-500/10',
};

// ─── Navigation target by entity type ────────────────────────────────────────
function getNavPath(n: AppNotification): string | null {
  if (!n.relatedEntityType) return null;
  if (n.relatedEntityType === 'GRIEVANCE')    return '/citizen/grievances';
  if (n.relatedEntityType === 'APPLICATION')  return '/citizen/applications';
  if (n.relatedEntityType === 'WELFARE')      return '/citizen/welfare';
  return null;
}

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(ts: string): string {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const user     = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const {
    notifications, unreadCount, loading,
    load, refresh, markRead, markAllRead,
  } = useNotificationStore();

  const [filter,     setFilter]     = useState<'all' | UICategory>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) load(user.id);
  }, [user?.id]);

  // Auto-refresh every 30 s
  useEffect(() => {
    if (!user?.id) return;
    const t = setInterval(() => refresh(user.id), 30000);
    return () => clearInterval(t);
  }, [user?.id]);

  const handleRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await refresh(user.id);
    setRefreshing(false);
  };

  const handleClick = async (n: AppNotification) => {
    if (!n.isRead) await markRead(n.notificationId);
    const path = getNavPath(n);
    if (path) navigate(path);
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await markAllRead(user.id);
  };

  const { query: sq } = useSearchStore();
  const nq = sq.trim().toLowerCase();

  const categorised = notifications.map(n => ({ ...n, _cat: getCategory(n.type) }));
  const filtered    = categorised.filter(n => {
    const matchCat = filter === 'all' || n._cat === filter;
    const matchQ   = !nq
      || n.title.toLowerCase().includes(nq)
      || n.message.toLowerCase().includes(nq)
      || n.type.toLowerCase().includes(nq);
    return matchCat && matchQ;
  });

  const counts = {
    grievance:   categorised.filter(n => n._cat === 'grievance').length,
    application: categorised.filter(n => n._cat === 'application').length,
    welfare:     categorised.filter(n => n._cat === 'welfare').length,
    alert:       categorised.filter(n => n._cat === 'alert').length,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Notifications" subtitle="Alerts & updates" />

      <div className="p-6 space-y-6">
        {/* Stats — all live from store */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total"       value={notifications.length} icon={Bell}         color="teal"   />
          <StatCard label="Unread"      value={unreadCount}          icon={AlertCircle}   color="amber"  />
          <StatCard label="Grievance"   value={counts.grievance}     icon={AlertCircle}   color="rose"   />
          <StatCard label="Application" value={counts.application}   icon={FileText}      color="violet" />
        </div>

        {/* Filters + actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {(['all','grievance','application','welfare','alert','info'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors capitalize ${
                  filter === f ? 'bg-teal-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/10'
                }`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading && (
            <div className="text-center py-12 text-slate-500">
              <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
              Loading…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <Bell className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-500 text-sm">No notifications.</p>
            </div>
          )}
          {!loading && filtered.map(n => {
            const cat  = n._cat as UICategory;
            const Icon = ICON[cat];
            const path = getNavPath(n);
            return (
              <div key={n.notificationId}
                className={`glass rounded-2xl p-4 border transition-all cursor-pointer ${
                  n.isRead ? 'border-white/5 opacity-70 hover:opacity-90' : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => handleClick(n)}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${COLOR[cat]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-medium">{n.title}</p>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />}
                        {path && (
                          <span className="text-xs text-teal-400/60 hover:text-teal-400">→</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 shrink-0">{relativeTime(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                    {n.relatedEntityId && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        {n.relatedEntityType === 'GRIEVANCE' ? '📋' : n.relatedEntityType === 'APPLICATION' ? '📄' : '❤️'}{' '}
                        {n.relatedEntityId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
