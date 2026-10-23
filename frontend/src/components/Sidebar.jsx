import React from 'react';
import { 
  LayoutDashboard, 
  FilePlus2, 
  Files, 
  CheckCheck, 
  Clock, 
  ArrowUpRight, 
  History, 
  AlertTriangle,
  FileCheck2,
  Bell
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  setCurrentView, 
  currentRole, 
  summary 
}) {
  const pendingVerificationCount = summary?.pending_count || 0;
  const discrepancyCount = summary?.discrepancy_count || 0;
  const expiringCount = summary?.expiring_count || 0;
  const renewalRequestedCount = summary?.renewal_requested_count || 0;
  const releaseRequestedCount = summary?.release_requested_count || 0;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['INSTITUTION', 'AICTE_OFFICER', 'APPROVER'],
      badge: null
    },
    {
      id: 'register',
      label: 'Register New FDR',
      icon: FilePlus2,
      roles: ['INSTITUTION', 'AICTE_OFFICER'],
      badge: null,
      highlight: currentRole === 'INSTITUTION'
    },
    {
      id: 'fdrs',
      label: 'FDR Repository',
      icon: Files,
      roles: ['INSTITUTION', 'AICTE_OFFICER', 'APPROVER'],
      badge: summary?.total_fdrs ? `${summary.total_fdrs}` : null
    },
    {
      id: 'verification',
      label: 'Verification & Discrepancy',
      icon: CheckCheck,
      roles: ['AICTE_OFFICER', 'APPROVER', 'INSTITUTION'],
      badge: (discrepancyCount > 0 || pendingVerificationCount > 0) ? (
        <span className="flex items-center gap-1">
          {discrepancyCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {discrepancyCount} Flagged
            </span>
          )}
          {pendingVerificationCount > 0 && (
            <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingVerificationCount} New
            </span>
          )}
        </span>
      ) : null
    },
    {
      id: 'renewals',
      label: 'Maturity & Renewals',
      icon: Clock,
      roles: ['INSTITUTION', 'AICTE_OFFICER', 'APPROVER'],
      badge: (expiringCount > 0 || renewalRequestedCount > 0) ? (
        <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
          {expiringCount + renewalRequestedCount} Due
        </span>
      ) : null
    },
    {
      id: 'releases',
      label: 'Release & Refund Workflow',
      icon: ArrowUpRight,
      roles: ['INSTITUTION', 'AICTE_OFFICER', 'APPROVER'],
      badge: releaseRequestedCount > 0 ? (
        <span className="bg-sky-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
          {releaseRequestedCount} Req
        </span>
      ) : null
    },
    {
      id: 'audit',
      label: 'Audit Trail & Logs',
      icon: History,
      roles: ['INSTITUTION', 'AICTE_OFFICER', 'APPROVER'],
      badge: null
    }
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-100px)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation Menu
        </div>

        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-950 font-bold border border-blue-300 shadow-xs'
                  : 'text-slate-700 font-medium hover:text-slate-900 hover:bg-slate-100'
              }`}
              style={isActive ? { backgroundColor: '#eff6ff', color: '#172554' } : {}}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <div>{item.badge}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Official AICTE Help & Integrity Notice Box */}
      <div className="p-4 m-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <FileCheck2 className="w-4 h-4 text-blue-600" />
          <span>Statutory Compliance</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          All deposits are held under joint lien with Member Secretary, AICTE New Delhi as per AICTE Approval Process Handbook.
        </p>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
          SIH 2026 Innovation Prototype
        </div>
      </div>
    </aside>
  );
}
