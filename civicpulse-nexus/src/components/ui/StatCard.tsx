import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'teal' | 'violet' | 'amber' | 'emerald' | 'rose' | 'blue';
  className?: string;
}

const COLOR_MAP = {
  teal:    { icon: 'text-teal-400', bg: 'bg-teal-500/10',    ring: 'ring-teal-500/20',    glow: 'shadow-teal-500/10' },
  violet:  { icon: 'text-violet-400', bg: 'bg-violet-500/10', ring: 'ring-violet-500/20',  glow: 'shadow-violet-500/10' },
  amber:   { icon: 'text-amber-400', bg: 'bg-amber-500/10',   ring: 'ring-amber-500/20',   glow: 'shadow-amber-500/10' },
  emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', glow: 'shadow-emerald-500/10' },
  rose:    { icon: 'text-rose-400', bg: 'bg-rose-500/10',     ring: 'ring-rose-500/20',    glow: 'shadow-rose-500/10' },
  blue:    { icon: 'text-blue-400', bg: 'bg-blue-500/10',     ring: 'ring-blue-500/20',    glow: 'shadow-blue-500/10' },
};

export function StatCard({ label, value, sub, icon: Icon, trend, color = 'teal', className }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={clsx(
      'stat-card rounded-2xl p-5 animate-fade-in',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className={clsx('p-2.5 rounded-xl ring-1', c.bg, c.ring)}>
          <Icon className={clsx('w-5 h-5', c.icon)} />
        </div>
        {trend && (
          <span className={clsx(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            trend.value >= 0
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          )}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        {trend && <p className="text-xs text-slate-500 mt-1">{trend.label}</p>}
      </div>
    </div>
  );
}
