import React from 'react';
import { 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  RotateCcw, 
  HelpCircle,
  Cpu,
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
    <header className="bg-[#0b1f3a] text-white shadow-md border-b border-slate-700 select-none">
      {/* Indian National Tricolor top bar */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & AICTE Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-sky-700 flex items-center justify-center p-2 shadow-inner border border-blue-400/30">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-sky-300">
                  अखिल भारतीय तकनीकी शिक्षा परिषद • AICTE
                </span>
                <span className="bg-sky-500/20 text-sky-200 border border-sky-400/30 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  SIH 2026
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                AICTE SecureDeposit
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  v2.6 Government-Tech
                </span>
              </h1>
            </div>
          </div>

          {/* Center Info / Verification pill */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span>Bank SFMS Gateway: <strong className="text-emerald-300">Simulated CBS Mock</strong></span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300/90 text-[11px]">Notice: OCR does not substitute legal bank confirmation</span>
          </div>

          {/* Controls: Role Switcher & Reset */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Role Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              <span className="text-[11px] font-medium text-slate-400 px-2">Role:</span>
              
              <button
                type="button"
                onClick={() => setRole('INSTITUTION')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  currentRole === 'INSTITUTION' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Technical Institution / College Registrar Perspective"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Institution</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('AICTE_OFFICER')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  currentRole === 'AICTE_OFFICER' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="AICTE Scrutiny & Verification Officer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AICTE Officer</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('APPROVER')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  currentRole === 'APPROVER' 
                    ? 'bg-amber-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 hover:text-white transition-colors"
              title="Reset sample database to fresh SIH 2026 demo state"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-sky-400 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

          </div>

        </div>
      </div>

      {/* Role Context Bar */}
      <div className="bg-[#08172c] border-t border-slate-800 px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Current Session:</span>
          {currentRole === 'INSTITUTION' && (
            <span className="font-semibold text-sky-300 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-sky-400" />
              {institutionName} (AICTE Affiliated)
            </span>
          )}
          {currentRole === 'AICTE_OFFICER' && (
            <span className="font-semibold text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Shri R. K. Sharma (Deputy Director - Scrutiny & Verification Cell, AICTE New Delhi)
            </span>
          )}
          {currentRole === 'APPROVER' && (
            <span className="font-semibold text-amber-300 flex items-center gap-1">
              <Scale className="w-3 h-3 text-amber-400" />
              Dr. M. S. Verma (Financial Adviser & Approver, Member Secretary Bureau, AICTE)
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 hidden sm:block">
          Official AICTE Security Deposit Portal • SIH 2026
        </div>
      </div>
    </header>
  );
}
