import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  ArrowUpRight, 
  CheckCheck, 
  XCircle 
} from 'lucide-react';

export default function StatusBadge({ status, size = 'sm' }) {
  const configs = {
    ACTIVE: {
      label: 'Active & Verified',
      icon: CheckCircle2,
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20'
    },
    EXPIRING_SOON: {
      label: 'Expiring Soon',
      icon: Clock,
      classes: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20'
    },
    MATURED: {
      label: 'Matured (Renewal Due)',
      icon: AlertCircle,
      classes: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20'
    },
    PENDING_VERIFICATION: {
      label: 'Pending Verification',
      icon: Clock,
      classes: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20'
    },
    DISCREPANCY_FLAGGED: {
      label: 'Discrepancy Flagged',
      icon: AlertTriangle,
      classes: 'bg-red-50 text-red-700 border-red-300 ring-red-500/20 animate-pulse font-semibold'
    },
    RENEWAL_REQUESTED: {
      label: 'Renewal In Review',
      icon: RefreshCw,
      classes: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20'
    },
    RELEASE_REQUESTED: {
      label: 'Release In Review',
      icon: ArrowUpRight,
      classes: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20'
    },
    RECOMMENDED_FOR_APPROVAL: {
      label: 'Recommended by Officer',
      icon: CheckCircle2,
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20'
    },
    APPROVED_BY_APPROVER: {
      label: 'Sanctioned & Approved',
      icon: CheckCheck,
      classes: 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-500/20'
    },
    RELEASED: {
      label: 'Released & Refunded',
      icon: CheckCheck,
      classes: 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-500/20'
    },
    REJECTED: {
      label: 'Rejected',
      icon: XCircle,
      classes: 'bg-zinc-100 text-zinc-700 border-zinc-300 ring-zinc-500/20'
    }
  };

  const config = configs[status] || {
    label: status,
    icon: AlertCircle,
    classes: 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-500/20'
  };

  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.classes}`}>
      <Icon className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
}
