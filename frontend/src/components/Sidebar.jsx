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
  Scale,
  RotateCcw,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  setCurrentView, 
  currentRole, 
  summary 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const pendingVerificationCount = summary?.pending_count || 0;
  const discrepancyCount = summary?.discrepancy_count || 0;
  const expiringCount = summary?.expiring_count || 0;
  const renewalRequestedCount = summary?.renewal_requested_count || 0;
  const releaseRequestedCount = summary?.release_requested_count || 0;

  // Strict role-specific navigation definitions
  const roleMenus = {
    INSTITUTION: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        badge: null
      },
      {
        id: 'register',
        label: 'Register New FDR',
        icon: FilePlus2,
        badge: null,
        highlight: true
      },
      {
        id: 'fdrs',
        label: 'My FDRs',
        icon: Files,
        badge: summary?.total_fdrs ? `${summary.total_fdrs}` : null
      },
      {
        id: 'renewals',
        label: 'Maturity & Renewals',
        icon: Clock,
        badge: (expiringCount > 0 || renewalRequestedCount > 0) ? (
          <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {expiringCount + renewalRequestedCount} Due
          </span>
        ) : null
      },
      {
        id: 'releases',
        label: 'My Release Requests',
        icon: ArrowUpRight,
        badge: releaseRequestedCount > 0 ? (
          <span className="bg-sky-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {releaseRequestedCount}
          </span>
        ) : null
      },
      {
        id: 'audit',
        label: 'My Activity',
        icon: History,
        badge: null
      }
    ],

    AICTE_OFFICER: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        badge: null
      },
      {
        id: 'verification',
        label: 'Verification Queue',
        icon: CheckCheck,
        badge: pendingVerificationCount > 0 ? (
          <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {pendingVerificationCount} New
          </span>
        ) : null
      },
      {
        id: 'discrepancy_review',
        label: 'Discrepancy Review',
        icon: AlertTriangle,
        badge: discrepancyCount > 0 ? (
          <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
            {discrepancyCount} Flagged
          </span>
        ) : null
      },
      {
        id: 'fdrs',
        label: 'FDR Registry',
        icon: Files,
        badge: summary?.total_fdrs ? `${summary.total_fdrs}` : null
      },
      {
        id: 'correction_requests',
        label: 'Correction Requests',
        icon: FileCheck2,
        badge: null
      },
      {
        id: 'audit',
        label: 'Verification History',
        icon: History,
        badge: null
      }
    ],

    APPROVER: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        badge: null
      },
      {
        id: 'releases',
        label: 'Release Approval Queue',
        icon: Scale,
        badge: releaseRequestedCount > 0 ? (
          <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
            {releaseRequestedCount} Awaiting
          </span>
        ) : null
      },
      {
        id: 'approved_decisions',
        label: 'Approved Decisions',
        icon: CheckCheck,
        badge: null
      },
      {
        id: 'returned_requests',
        label: 'Returned Requests',
        icon: RotateCcw,
        badge: null
      },
      {
        id: 'audit',
        label: 'Decision Audit Trail',
        icon: History,
        badge: null
      }
    ]
  };

  const navItems = roleMenus[currentRole] || roleMenus.AICTE_OFFICER;

  const roleTitle = currentRole === 'INSTITUTION' 
    ? 'Institution Portal' 
    : (currentRole === 'AICTE_OFFICER' ? 'Scrutiny Officer Portal' : 'Financial Approver Portal');

  function handleNavClick(viewId) {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
  }

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between shrink-0 md:min-h-[calc(100vh-100px)]">
      <div className="p-3 md:p-4 space-y-1">
        
        {/* Header bar: on mobile includes collapse toggle */}
        <div className="flex items-center justify-between px-2 py-1.5 md:py-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation Menu
            </div>
            <div className="text-xs font-semibold text-[#17365D]">
              {roleTitle}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center gap-1.5 text-xs font-semibold text-[#17365D] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md border border-slate-200 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            <span>{mobileMenuOpen ? 'Hide' : 'Menu'}</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className={`space-y-1 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive 
                    ? 'bg-[#17365D] text-white shadow-sm font-semibold' 
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                } ${item.highlight && !isActive ? 'border border-blue-200 bg-blue-50/60 text-blue-900 font-semibold' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : (item.highlight ? 'text-blue-600' : 'text-[#3D7199]')}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <div className="shrink-0 ml-2">
                    {item.badge}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

      </div>

      {/* Sidebar bottom notice card */}
      <div className="p-3 md:p-4 border-t border-slate-100 bg-[#F3F6FA] text-xs space-y-2">
        <div className="text-[11px] font-semibold text-[#17365D] flex items-center gap-1.5">
          <span>AICTE Statutory Compliance</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          Fixed Deposit Receipts are pledged in joint name under statutory lien. Modifications require multi-factor administrative clearance.
        </p>
      </div>

    </aside>
  );
}
