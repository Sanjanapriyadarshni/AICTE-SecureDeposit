import React from 'react';
import { 
  Building2, 
  ShieldAlert, 
  FileCheck, 
  Clock, 
  ArrowUpRight, 
  TrendingUp, 
  AlertTriangle,
  Landmark,
  CheckCircle,
  FileText,
  RotateCw
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function DashboardView({ 
  summary, 
  currentRole, 
  setCurrentView,
  onRefresh 
}) {
  if (!summary) {
    return (
      <div className="p-8 text-center text-slate-500">
        <RotateCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
        Loading AICTE SecureDeposit metrics...
      </div>
    );
  }

  // Format currency in Indian notation
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      
      {/* Role-Specific Header Banner */}
      <div className="bg-gradient-to-r from-[#0b1f3a] via-[#12315b] to-[#0f2942] rounded-2xl p-6 text-white shadow-sm border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30">
                {currentRole === 'INSTITUTION' && 'Technical Institution Portal'}
                {currentRole === 'AICTE_OFFICER' && 'AICTE Scrutiny & Verification Cell'}
                {currentRole === 'APPROVER' && 'Competent Authority & Financial Sanction'}
              </span>
              <span className="text-xs text-slate-400">• SIH 2026 Portal</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {currentRole === 'INSTITUTION' && 'Institution Security Deposit Overview'}
              {currentRole === 'AICTE_OFFICER' && 'AICTE FDR Verification & Vigilance Console'}
              {currentRole === 'APPROVER' && 'Financial Oversight & Release Authorization'}
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {currentRole === 'INSTITUTION' && 'Track mandatory fixed deposit receipts, monitor maturity dates, and submit automated renewal or NOC release applications.'}
              {currentRole === 'AICTE_OFFICER' && 'Cross-examine institution submissions against simulated Bank SFMS/CBS data, detect discrepancies, and recommend release files.'}
              {currentRole === 'APPROVER' && 'Authorize high-value security deposit releases, verify compliance reports, and affix digital authorization tokens.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentRole === 'INSTITUTION' && (
              <button
                onClick={() => setCurrentView('register')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Register New FDR
              </button>
            )}
            {currentRole === 'AICTE_OFFICER' && (
              <button
                onClick={() => setCurrentView('verification')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                Verify Pending Records ({summary.pending_count + summary.discrepancy_count})
              </button>
            )}
            {currentRole === 'APPROVER' && (
              <button
                onClick={() => setCurrentView('releases')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                Review Sanctions ({summary.release_requested_count})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Deposits */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Custody Value</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{summary.total_amount_crores} Cr
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{summary.total_fdrs} Total FDR Receipts</span>
            <span className="text-emerald-600 font-medium">100% Lien Marked</span>
          </div>
        </div>

        {/* Active & Verified */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active & In-Force</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {summary.active_count}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>CBS Verified</span>
            <span className="text-emerald-600 font-medium">{Math.round((summary.active_count / (summary.total_fdrs || 1)) * 100)}% Compliance</span>
          </div>
        </div>

        {/* Expiring & Matured */}
        <div 
          onClick={() => setCurrentView('renewals')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Expiring / Matured</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 flex items-center gap-2">
            {summary.expiring_count + summary.matured_count}
            <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {summary.expiring_count} in 90d, {summary.matured_count} past
            </span>
          </div>
          <div className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
            <span>Renewal Notice Active</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Discrepancies & Pending */}
        <div 
          onClick={() => setCurrentView('verification')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Discrepancy & Verification</span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-700 flex items-center gap-2">
            {summary.discrepancy_count} Flagged
            {summary.pending_count > 0 && (
              <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                +{summary.pending_count} New
              </span>
            )}
          </div>
          <div className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
            <span>Requires Scrutiny Action</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* Grid: Status Distribution & Bank Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Breakdown Table & Progress */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">FDR Portfolio Status Breakdown</h3>
              <p className="text-xs text-slate-500">Live classification of technical institution fixed deposits</p>
            </div>
            <button
              onClick={() => setCurrentView('fdrs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View Full Registry <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <div className="text-xs text-emerald-700 font-medium">Active & Valid</div>
              <div className="text-xl font-bold text-emerald-800 mt-1">{summary.active_count}</div>
            </div>
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
              <div className="text-xs text-amber-700 font-medium">Expiring &lt;90d</div>
              <div className="text-xl font-bold text-amber-800 mt-1">{summary.expiring_count}</div>
            </div>
            <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
              <div className="text-xs text-red-700 font-medium">Discrepancy Alerts</div>
              <div className="text-xl font-bold text-red-800 mt-1">{summary.discrepancy_count}</div>
            </div>
            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
              <div className="text-xs text-purple-700 font-medium">Renewal In Review</div>
              <div className="text-xl font-bold text-purple-800 mt-1">{summary.renewal_requested_count}</div>
            </div>
          </div>

          {/* Visual Progress Bar representation */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-600 flex justify-between">
              <span>Deposit Health Ratio</span>
              <span>{summary.active_count} of {summary.total_fdrs} Healthy</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${(summary.active_count / (summary.total_fdrs || 1)) * 100}%` }} 
                className="bg-emerald-500 h-full" 
                title={`Active: ${summary.active_count}`}
              />
              <div 
                style={{ width: `${(summary.expiring_count / (summary.total_fdrs || 1)) * 100}%` }} 
                className="bg-amber-400 h-full" 
                title={`Expiring: ${summary.expiring_count}`}
              />
              <div 
                style={{ width: `${(summary.discrepancy_count / (summary.total_fdrs || 1)) * 100}%` }} 
                className="bg-red-500 h-full" 
                title={`Discrepancy: ${summary.discrepancy_count}`}
              />
              <div 
                style={{ width: `${(summary.pending_count / (summary.total_fdrs || 1)) * 100}%` }} 
                className="bg-blue-400 h-full" 
                title={`Pending: ${summary.pending_count}`}
              />
              <div 
                style={{ width: `${(summary.matured_count / (summary.total_fdrs || 1)) * 100}%` }} 
                className="bg-rose-600 h-full" 
                title={`Matured: ${summary.matured_count}`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 flex-wrap gap-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Active</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Expiring Soon</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Discrepancy Flagged</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Pending</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Matured</span>
            </div>
          </div>

          {/* Upcoming Maturity Calendar Table */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Maturity Forecast Schedule
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {summary.monthly_maturities?.map((m, idx) => (
                <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                  <div className="text-[11px] font-semibold text-slate-600">{m.month}</div>
                  <div className="text-base font-bold text-slate-900 mt-1">{m.count} FDR</div>
                  <div className="text-[10px] text-slate-500">₹{m.amount.toFixed(2)} Cr</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bank-Wise Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Approved Banks</h3>
              <span className="text-xs font-medium text-slate-500">Scheduled Commercial Banks</span>
            </div>

            <div className="space-y-3">
              {summary.bank_distribution?.map((b, idx) => {
                const percent = Math.round((b.amount / (summary.total_amount || 1)) * 100);
                return (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800">{b.bank}</span>
                      <span className="text-slate-600 font-bold">{formatINR(b.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                      <span>{b.count} FDR records</span>
                      <span>{percent}% of total deposit</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Direct SFMS / CBS verification simulated with Reserve Bank of India authorized schedule.</span>
          </div>
        </div>

      </div>

      {/* Recent Audit Timeline Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Immutable Audit Trail</h3>
            <p className="text-xs text-slate-500">Live record changes, verifications, recommendations and approvals</p>
          </div>
          <button
            onClick={() => setCurrentView('audit')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Explore Complete Log <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {summary.recent_activities?.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
              <div className="mt-0.5 p-1.5 rounded-md bg-white border border-slate-200 text-blue-600 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{log.action}</span>
                    {log.fdr_number && (
                      <span className="font-mono text-[11px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                        {log.fdr_number}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-1">{log.details}</p>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                  <span>Actor: <strong className="text-slate-700">{log.actor_name}</strong></span>
                  <span>•</span>
                  <span className="bg-slate-200/80 px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold text-slate-600">
                    {log.actor_role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
