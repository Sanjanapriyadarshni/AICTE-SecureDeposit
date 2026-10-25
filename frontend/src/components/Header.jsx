import React from 'react';
import { 
  ShieldCheck, 
  Building2, 
  RotateCcw, 
  Landmark,
  Scale,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function Header({ 
  currentRole, 
  currentUser,
  setRole, 
  onLogout,
  onResetData, 
  isResetting,
  institutionName = "Delhi Institute of Technology & Management",
  dataSourceStatus
}) {
  const roleName = currentRole === 'INSTITUTION' 
    ? 'Institution' 
    : (currentRole === 'AICTE_OFFICER' ? 'AICTE Officer' : 'Approver');

  const roleAccent = currentRole === 'INSTITUTION'
    ? 'bg-blue-600 text-white'
    : (currentRole === 'AICTE_OFFICER' ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white');

  return (
    <header 
      className="bg-[#17365D] text-white shadow-md border-b border-slate-700 select-none"
      style={{ backgroundColor: '#17365D', color: '#ffffff' }}
    >
      {/* Indian National Tricolor top bar */}
      <div className="h-1.5 w-full flex">
        <div style={{ width: '33.3333%', backgroundColor: '#FF9933' }}></div>
        <div style={{ width: '33.3333%', backgroundColor: '#FFFFFF' }}></div>
        <div style={{ width: '33.3333%', backgroundColor: '#138808' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & AICTE Title */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg bg-blue-600/90 flex items-center justify-center p-2 shadow-inner border border-blue-400/40 shrink-0"
              style={{ backgroundColor: '#1d4ed8' }}
            >
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-sky-200">
                  अखिल भारतीय तकनीकी शिक्षा परिषद • AICTE
                </span>
                <span 
                  className="bg-sky-900/80 text-sky-200 border border-sky-400/30 text-[9px] font-bold px-1.5 py-0.2 rounded"
                  style={{ backgroundColor: 'rgba(12, 74, 110, 0.8)' }}
                >
                  SIH 2026
                </span>
              </div>
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                AICTE SecureDeposit
                <span 
                  className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-400/40 hidden sm:inline"
                  style={{ backgroundColor: 'rgba(6, 78, 59, 0.8)' }}
                >
                  v2.6 Government-Tech
                </span>
              </h1>
            </div>
          </div>

          {/* Center Info / Verification notice */}
          <div 
            className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-600/80 text-xs text-slate-200"
            style={{ backgroundColor: 'rgba(15, 36, 62, 0.9)' }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span>Bank SFMS Gateway: <strong className="text-emerald-300 font-semibold">Simulated CBS Mock</strong></span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300 text-[11px] font-medium">Notice: OCR does not substitute legal bank confirmation</span>
          </div>

          {/* Right Controls: User Profile, Role Quick Switch & Sign Out */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Quick Demo Role Switcher for Hackathon Testing */}
            <div 
              className="flex items-center p-0.5 rounded-lg border border-slate-600"
              style={{ backgroundColor: 'rgba(15, 36, 62, 0.95)' }}
            >
              <button
                type="button"
                onClick={() => setRole('INSTITUTION')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  currentRole === 'INSTITUTION' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-200 hover:text-white hover:bg-slate-700/60'
                }`}
                style={currentRole === 'INSTITUTION' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                title="Switch perspective to College Registrar"
              >
                <Building2 className="w-3 h-3" />
                <span>Institution</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('AICTE_OFFICER')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  currentRole === 'AICTE_OFFICER' 
                    ? 'bg-teal-700 text-white shadow-sm' 
                    : 'text-slate-200 hover:text-white hover:bg-slate-700/60'
                }`}
                style={currentRole === 'AICTE_OFFICER' ? { backgroundColor: '#0f766e', color: '#ffffff' } : {}}
                title="Switch perspective to AICTE Verification Officer"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Officer</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('APPROVER')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  currentRole === 'APPROVER' 
                    ? 'bg-amber-600 text-white shadow-sm' 
                    : 'text-slate-200 hover:text-white hover:bg-slate-700/60'
                }`}
                style={currentRole === 'APPROVER' ? { backgroundColor: '#d97706', color: '#ffffff' } : {}}
                title="Switch perspective to Competent Financial Approver"
              >
                <Scale className="w-3 h-3" />
                <span>Approver</span>
              </button>
            </div>

            {/* Reset Demo Button */}
            <button
              onClick={onResetData}
              disabled={isResetting}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white border border-slate-600 transition-colors"
              style={{ backgroundColor: 'rgba(15, 36, 62, 0.95)' }}
              title="Reset sample database to fresh SIH 2026 demo state"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-sky-400 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-[11px]">Reset Demo</span>
            </button>

            {/* Sign Out Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-500/40 transition-colors"
                title="Sign out of current authenticated session"
              >
                <LogOut className="w-3.5 h-3.5 text-red-300" />
                <span className="text-[11px]">Sign Out</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Role Context Bar */}
      <div 
        className="bg-[#0f243e] border-t border-slate-700/80 px-4 sm:px-6 lg:px-8 py-2 text-xs text-slate-200 flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: '#0f243e', color: '#cbd5e1' }}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-slate-400 font-medium shrink-0">Logged In Official:</span>
          {currentUser ? (
            <div className="flex items-center gap-2 truncate">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleAccent}`}>
                {roleName}
              </span>
              <span className="font-semibold text-white truncate">
                {currentUser.name}
              </span>
              <span className="text-slate-400 text-[11px] hidden md:inline truncate">
                ({currentUser.designation || currentUser.email})
              </span>
            </div>
          ) : (
            <div>
              {currentRole === 'INSTITUTION' && (
                <span className="font-bold text-sky-300 flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Prof. Alok Kumar Singhal • {institutionName}</span>
                </span>
              )}
              {currentRole === 'AICTE_OFFICER' && (
                <span className="font-bold text-emerald-300 flex items-center gap-1.5 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Shri R. K. Sharma • Scrutiny & Verification Cell, AICTE HQ</span>
                </span>
              )}
              {currentRole === 'APPROVER' && (
                <span className="font-bold text-amber-300 flex items-center gap-1.5 truncate">
                  <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Dr. M. S. Verma • Financial Adviser & Approver, Member Secretary Bureau</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <div 
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-600 text-[11px]"
            style={{ backgroundColor: 'rgba(15, 36, 62, 0.8)' }}
            title="Active database communication channel"
          >
            <span className={`w-2 h-2 rounded-full ${dataSourceStatus?.isLive ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
            <span className="text-slate-400 font-medium">Channel:</span>
            <span className={dataSourceStatus?.isLive ? "text-emerald-300 font-semibold" : "text-amber-300 font-semibold"}>
              {dataSourceStatus?.isLive ? "🟢 Live API (FastAPI)" : "🟡 LocalStorage Demo Mode"}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 hidden xl:block font-medium">
            AICTE FDR Portal • SIH 2026
          </div>
        </div>
      </div>
    </header>
  );
}
