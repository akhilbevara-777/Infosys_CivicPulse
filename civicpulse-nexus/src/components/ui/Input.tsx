import { clsx } from 'clsx';
import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  hint?: string;
}

export function Input({ label, error, icon: Icon, hint, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          {...props}
          className={clsx(
            'w-full bg-slate-800/60 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500',
            'focus:outline-none focus:ring-2 transition-all duration-200',
            Icon && 'pl-9',
            error
              ? 'border-red-500/50 focus:ring-red-500/30'
              : 'border-white/10 focus:ring-teal-500/30 focus:border-teal-500/50',
            className
          )}
        />
      </div>
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        {...props}
        className={clsx(
          'w-full bg-slate-800/60 border rounded-xl px-3 py-2.5 text-sm text-white',
          'focus:outline-none focus:ring-2 transition-all duration-200',
          error
            ? 'border-red-500/50 focus:ring-red-500/30'
            : 'border-white/10 focus:ring-teal-500/30 focus:border-teal-500/50',
          className
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-800">
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
