import { Bell, Search, Sun, Moon, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useSearchStore } from '../../store/searchStore';
import { clsx } from 'clsx';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

// Pages where search is shown for citizen
const SEARCH_PAGES = [
  '/citizen/dashboard',
  '/citizen/grievances',
  '/citizen/services',
  '/citizen/applications',
  '/citizen/welfare',
  '/citizen/notifications',
];

export function TopBar({ title, subtitle }: TopBarProps) {
  const user        = useAuthStore(s => s.user);
  const navigate    = useNavigate();
  const location    = useLocation();
  const { unreadCount, refresh } = useNotificationStore();
  const { query, setQuery, clear } = useSearchStore();
  const [dark,          setDark]          = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const now     = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  // Show search only on relevant citizen pages
  const showSearch = user?.role === 'citizen' &&
    SEARCH_PAGES.some(p => location.pathname.startsWith(p));

  // Clear search when navigating away
  useEffect(() => {
    clear();
  }, [location.pathname]);

  // Poll unread count every 30s for citizen
  useEffect(() => {
    if (!user?.id || user.role !== 'citizen') return;
    refresh(user.id);
    const t = setInterval(() => refresh(user.id), 30000);
    return () => clearInterval(t);
  }, [user?.id, user?.role]);

  const handleBellClick = () => {
    if (user?.role === 'citizen') navigate('/citizen/notifications');
  };

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        clear();
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="glass-dark border-b border-white/8 px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-white truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* Search — existing UI, now wired */}
      {showSearch && (
        <div className={clsx(
          'hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all duration-200',
          searchFocused || query ? 'bg-slate-800 border-teal-500/50 w-64' : 'bg-slate-800/50 border-white/10 text-slate-400 w-48'
        )}>
          <Search className="w-4 h-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Search… (Ctrl+K)"
            onChange={e => setQuery(e.target.value)}
            className="bg-transparent text-white placeholder-slate-500 text-sm outline-none flex-1 min-w-0"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {query && (
            <button onClick={() => { clear(); inputRef.current?.focus(); }}
              className="text-slate-400 hover:text-white transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/10">
        <span className="text-teal-400 font-medium">{timeStr}</span>
        <span className="text-slate-600 mx-1">·</span>
        <span>{dateStr}</span>
      </div>

      <button onClick={() => setDark(!dark)}
        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Bell — real unread count */}
      <button onClick={handleBellClick}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-1 ring-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {user && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
          {user.avatar
            ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            : user.name[0].toUpperCase()
          }
        </div>
      )}
    </header>
  );
}
