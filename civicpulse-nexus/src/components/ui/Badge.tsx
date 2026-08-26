import { clsx } from 'clsx';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  danger:  'bg-red-500/15 text-red-400 border border-red-500/30',
  info:    'bg-teal-500/15 text-teal-400 border border-teal-500/30',
  neutral: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  purple:  'bg-violet-500/15 text-violet-400 border border-violet-500/30',
};

const DOT_COLORS: Record<Variant, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger:  'bg-red-400',
  info:    'bg-teal-400',
  neutral: 'bg-slate-400',
  purple:  'bg-violet-400',
};

export function Badge({ variant = 'neutral', children, className, dot }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      VARIANTS[variant], className
    )}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', DOT_COLORS[variant])} />}
      {children}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, [Variant, string]> = {
    // Citizen statuses
    active:                ['success', 'Active'],
    inactive:              ['neutral', 'Inactive'],
    suspended:             ['danger',  'Suspended'],
    // Grievance statuses — full lifecycle
    submitted:             ['warning', 'Submitted'],
    acknowledged:          ['info',    'Acknowledged'],
    assigned:              ['info',    'Assigned'],
    pending:               ['warning', 'Pending'],
    in_progress:           ['info',    'In Progress'],
    pending_citizen:       ['warning', 'Action Required'],
    escalated:             ['danger',  'Escalated'],
    resolved:              ['success', 'Resolved'],
    closed:                ['neutral', 'Closed'],
    reopened:              ['warning', 'Reopened'],
    rejected:              ['danger',  'Rejected'],
    // Application statuses
    under_review:          ['warning', 'Under Review'],
    document_verification: ['purple',  'Doc Verification'],
    documents_pending:     ['warning', 'Docs Pending'],
    pending_information:   ['warning', 'Info Needed'],
    verified:              ['purple',  'Verified'],
    approved:              ['success', 'Approved'],
    issued:                ['success', 'Issued'],
    cancelled:             ['neutral', 'Cancelled'],
    // Welfare application statuses
    under_verification:    ['warning', 'Under Verification'],
    eligibility_check:     ['purple',  'Eligibility Check'],
    disbursement_pending:  ['info',    'Disbursement Pending'],
    disbursed:             ['success', 'Disbursed'],
    // Payment
    paid:                  ['success', 'Paid'],
    unpaid:                ['danger',  'Unpaid'],
  };
  const [variant, label] = map[status] ?? ['neutral', status.replace(/_/g, ' ')];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function severityBadge(severity: string) {
  const map: Record<string, Variant> = {
    low: 'success', medium: 'warning', high: 'danger', critical: 'danger',
  };
  return <Badge variant={map[severity] ?? 'neutral'}>{severity.toUpperCase()}</Badge>;
}
