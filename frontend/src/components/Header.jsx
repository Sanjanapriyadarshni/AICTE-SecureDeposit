import React from 'react';
import { 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  RotateCcw, 
  HelpCircle,
  Landmark,
  Scale
} from 'lucide-react';

export default function Header({ 
  currentRole, 
  setRole, 
  onResetData, 
  isResetting,
  institutionName = "Delhi Institute of Technology & Management" 
}) {
  return (
    <header 
      className="bg-aicte-navy bg-slate-900 text-white shadow-md border-b border-slate-700 select-none"
      style={{ backgroundColor: '#0b1f3a', color: '#ffffff' }}
    >
      {/* Indian National Tricolor top bar */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/3" style={{ backgroundColor: '#FF9933' }}></div>
        <div className="h-full w-1/3" style={{ backgroundColor: '#FFFFFF' }}></div>
        <div className="h-full w-1/3" style={{ backgroundColor: '#138808' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & AICTE Title */}
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center p-2 shadow-inner border border-blue-400/40 shrink-0"
              style={{ backgroundColor: '#1d4ed8' }}
            >
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-sky-300">
                  अखिल भारतीय तकनीकी शिक्षा परिषद • AICTE
                </span>
                <span 
                  className="bg-sky-900/80 text-sky-200 border border-sky-400/40 text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(12, 74, 110, 0.8)' }}
                >
                  SIH 2026
                </span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                AICTE SecureDeposit
                <span 
                  className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-400/40"
                  style={{ backgroundColor: 'rgba(6, 78, 59, 0.8)' }}
                >
                  v2.6 Government-Tech
                </span>
              </h1>
            </div>
          </div>

          {/* Center Info / Verification pill */}
          <div 
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span>Bank SFMS Gateway: <strong className="text-emerald-300 font-semibold">Simulated CBS Mock</strong></span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300 text-[11px] font-medium">Notice: OCR does not substitute legal bank confirmation</span>
          </div>

          {/* Controls: Role Switcher & Reset */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Role Switcher */}
            <div 
              className="flex items-center p-1 rounded-lg border border-slate-700"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
            >
              <span className="text-[11px] font-bold text-slate-300 px-2">Role:</span>
              
              <button
                type="button"
                onClick={() => setRole('INSTITUTION')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  currentRole === 'INSTITUTION' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-200 hover:text-white hover:bg-slate-800'
                }`}
                style={currentRole === 'INSTITUTION' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                title="Technical Institution / College Registrar Perspective"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Institution</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('AICTE_OFFICER')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  currentRole === 'AICTE_OFFICER' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-200 hover:text-white hover:bg-slate-800'
                }`}
                style={currentRole === 'AICTE_OFFICER' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                title="AICTE Scrutiny & Verification Officer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AICTE Officer</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('APPROVER')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  currentRole === 'APPROVER' 
                    ? 'bg-amber-600 text-white shadow-sm' 
                    : 'text-slate-200 hover:text-white hover:bg-slate-800'
                }`}
                style={currentRole === 'APPROVER' ? { backgroundColor: '#d97706', color: '#ffffff' } : {}}
                title="Financial Adviser & Competent Approving Authority"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Approver</span>
              </button>
            </div>

            {/* Reset Demo Data Button */}
            <button
              onClick={onResetData}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white border border-slate-600 transition-colors"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
              title="Reset sample database to fresh SIH 2026 demo state"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-sky-400 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

          </div>

        </div>
      </div>

      {/* Role Context Bar */}
      <div 
        className="bg-aicte-dark border-t border-slate-800 px-4 sm:px-6 lg:px-8 py-2 text-xs text-slate-200 flex items-center justify-between"
        style={{ backgroundColor: '#08172c', color: '#cbd5e1' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Active Session:</span>
          {currentRole === 'INSTITUTION' && (
            <span className="font-bold text-sky-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              {institutionName} (AICTE Affiliated)
            </span>
          )}
          {currentRole === 'AICTE_OFFICER' && (
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Shri R. K. Sharma (Deputy Director - Scrutiny & Verification Cell, AICTE New Delhi)
            </span>
          )}
          {currentRole === 'APPROVER' && (
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              Dr. M. S. Verma (Financial Adviser & Approver, Member Secretary Bureau, AICTE)
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 hidden sm:block font-medium">
          Official AICTE Security Deposit Portal • SIH 2026
        </div>
      </div>
    </header>
  );
}
