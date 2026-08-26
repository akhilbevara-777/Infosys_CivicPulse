import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, Users, FileText, AlertCircle,
  Shield, ScrollText, BarChart3, LogOut, ChevronRight, Bell, Menu, X,
  Heart, IndianRupee, Package, UserCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useGrievanceStore } from '../../store/grievanceStore';
import { useApplicationStore } from '../../store/applicationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useState, useEffect } from 'react';
import type { UserRole } from '../../types';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: string | number;
}

function getNav(role: UserRole, pendingGrievances: number, pendingApps: number, unreadNotifs: number): NavItem[] {
  if (role === 'citizen') return [
    { label: 'Dashboard',       to: '/citizen/dashboard',    icon: LayoutDashboard },
    { label: 'My Grievances',   to: '/citizen/grievances',   icon: AlertCircle },
    { label: 'Apply Services',  to: '/citizen/services',     icon: FileText },
    { label: 'My Applications', to: '/citizen/applications', icon: ScrollText },
    { label: 'Welfare Schemes', to: '/citizen/welfare',      icon: Heart },
    { label: 'Notifications',   to: '/citizen/notifications',icon: Bell, badge: unreadNotifs || undefined },
    { label: 'My Profile',      to: '/citizen/profile',      icon: UserCircle },
  ];
  return [
    { label: 'Dashboard',    to: '/admin/dashboard',      icon: LayoutDashboard },
    { label: 'Citizens',     to: '/admin/citizens',       icon: Users },
    { label: 'Grievances',   to: '/admin/grievances',     icon: AlertCircle,  badge: pendingGrievances || undefined },
    { label: 'Services',     to: '/admin/services',       icon: FileText },
    { label: 'Applications', to: '/admin/applications',   icon: ScrollText,   badge: pendingApps || undefined },
    { label: 'Welfare',      to: '/admin/welfare',        icon: Heart },
    { label: 'Budget',       to: '/admin/budget',         icon: IndianRupee },
    { label: 'Assets',       to: '/admin/assets',         icon: Package },
    { label: 'Reports',      to: '/admin/reports',        icon: BarChart3 },
  ];
}

const ROLE_COLOR: Record<UserRole, string> = {
  citizen:      'from-teal-500 to-teal-400',
  admin:        'from-violet-500 to-violet-400',
  officer:      'from-blue-500 to-blue-400',
  commissioner: 'from-amber-500 to-amber-400',
};

const ROLE_LABEL: Record<UserRole, string> = {
  citizen:      'Citizen',
  admin:        'Admin',
  officer:      'Officer',
  commissioner: 'Commissioner',
};

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const grievances    = useGrievanceStore(s => s.grievances);
  const applications  = useApplicationStore(s => s.applications);
  const { unreadCount, load: loadNotifs } = useNotificationStore();

  // Load notifications once when user logs in
  useEffect(() => {
    if (user?.id && user.role === 'citizen') loadNotifs(user.id);
  }, [user?.id]);

  if (!user) return null;

  const pendingGrievances = grievances.filter(g =>
    ['submitted','acknowledged','assigned','escalated'].includes(g.status)
  ).length;
  const pendingApps = applications.filter(a => a.status === 'submitted' || a.status === 'under_review' || a.status === 'documents_pending').length;
  // Use real unreadCount from notification store for citizen
  const citizenUnread = user?.role === 'citizen' ? unreadCount : 0;

  const nav = getNav(user.role, pendingGrievances, pendingApps, citizenUnread);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/15 rounded-xl ring-1 ring-teal-500/25">
            <Building2 className="w-6 h-6 text-teal-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">CivicPulse Nexus</p>
            <p className="text-xs text-slate-500 truncate">Smart Governance</p>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden',
            ROLE_COLOR[user.role]
          )}>
            {user.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : user.name[0].toUpperCase()
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">{ROLE_LABEL[user.role]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
              isActive
                ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/10 text-teal-400 border border-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && Number(item.badge) > 0 && (
              <span className="bg-teal-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {item.badge}
              </span>
            )}
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass rounded-xl text-slate-400 hover:text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-64 glass-dark" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 glass-dark border-r border-white/8 h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
