import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  FileText, 
  Upload, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  RefreshCw, 
  Calendar, 
  FileCheck, 
  Coins, 
  HelpCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { 
  fetchInstitutionDashboard, 
  resubmitFDRCorrection 
} from '../services/api';

export default function InstitutionDashboard({ 
  setCurrentView, 
  onRefreshGlobal 
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Correction Resubmission Modal
  const [activeResubmitDoc, setActiveResubmitDoc] = useState(null);
  const [resubmitRemarks, setResubmitRemarks] = useState('');
  const [resubmitFile, setResubmitFile] = useState(null);
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      // Default to demo institution 1 (Delhi Institute of Technology & Management)
      const res = await fetchInstitutionDashboard(1);
      setData(res);
    } catch (err) {
      console.error('Failed to load institution dashboard:', err);
      setError('Unable to load institutional records. Using offline cached data.');
    } finally {
      setLoading(false);
    }
  }

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  async function handleResubmitCorrection(e) {
    e.preventDefault();
    if (!activeResubmitDoc) return;
    setIsSubmittingCorrection(true);
    try {
      await resubmitFDRCorrection(activeResubmitDoc.id, {
        document_url: resubmitFile ? `/uploads/${resubmitFile.name}` : activeResubmitDoc.document_url,
        document_filename: resubmitFile ? resubmitFile.name : activeResubmitDoc.document_filename,
        institution_remarks: resubmitRemarks || "Updated supporting document attached for AICTE review."
      });
      setActionMessage({
        type: 'success',
        text: `FDR #${activeResubmitDoc.fdr_number} re-submitted successfully to AICTE verification queue.`
      });
      setActiveResubmitDoc(null);
      setResubmitRemarks('');
      setResubmitFile(null);
      loadDashboard();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: `Correction resubmission failed: ${err.message}`
      });
    } finally {
      setIsSubmittingCorrection(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading Institutional Security Deposit Portal...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    my_total_fdrs: 0,
    my_total_amount: 0,
    my_total_crores: 0,
    active_fdrs: 0,
    expiring_soon: 0,
    pending_verification: 0
  };

  return (
    <div className="space-y-6">
      
      {/* Institution Role Banner (Blue Accent Theme) */}
      <div 
        className="rounded-2xl p-6 text-white shadow-sm border border-slate-700/60 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #17365D 0%, #1e4577 55%, #17365D 100%)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/25 text-blue-200 border border-blue-400/30">
                Technical Institution Portal
              </span>
              <span className="text-xs text-blue-300/80">• AICTE ID: {data?.aicte_id || 'AICTE-1-10294819'}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-300" />
              {data?.institution_name || 'Delhi Institute of Technology & Management'}
            </h2>
            <p className="text-sm text-blue-100/90 mt-1 max-w-2xl">
              Manage your institution's statutory security deposits, track verification statuses, upload compliance documents, and initiate renewal or refund releases.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setCurrentView('register')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 border border-blue-400/40 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Register New FDR
            </button>
            <button
              onClick={() => setCurrentView('fdrs')}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              View My FDRs
            </button>
            <button
              onClick={() => setCurrentView('renewals')}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Start Renewal
            </button>
          </div>
        </div>

        {/* Subtle Background Pattern */}
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 text-white/5 pointer-events-none">
          <Building2 className="w-64 h-64" />
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
          actionMessage.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* 4 SUMMARY CARDS (INSTITUTION PERSPECTIVE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: My Total FDRs */}
        <div 
          onClick={() => setCurrentView('fdrs')}
          className="bg-white p-5 rounded-xl border border-blue-100 hover:border-blue-300 shadow-xs transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">My Total FDRs</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {summary.my_total_fdrs} <span className="text-sm font-semibold text-slate-500 font-normal">({formatINR(summary.my_total_amount)})</span>
          </div>
          <div className="text-xs text-blue-700 font-medium mt-1 flex items-center justify-between">
            <span>Mandatory Affiliation Deposits</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div className="h-1 w-full bg-blue-600 absolute bottom-0 left-0"></div>
        </div>

        {/* Card 2: Active FDRs */}
        <div 
          onClick={() => setCurrentView('fdrs')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-300 shadow-xs transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active & In-Force</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {summary.active_fdrs} <span className="text-xs text-slate-500 font-normal">In Full Compliance</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center justify-between">
            <span>Irrevocable Joint Lien Active</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div className="h-1 w-full bg-emerald-500 absolute bottom-0 left-0"></div>
        </div>

        {/* Card 3: Expiring Soon */}
        <div 
          onClick={() => setCurrentView('renewals')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-300 shadow-xs transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Expiring & Matured</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            {summary.expiring_soon} <span className="text-xs text-slate-500 font-normal">Action Required</span>
          </div>
          <div className="text-xs text-amber-600 font-medium mt-1 flex items-center justify-between">
            <span>Initiate Timely Renewal</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div className="h-1 w-full bg-amber-500 absolute bottom-0 left-0"></div>
        </div>

        {/* Card 4: Pending Verification */}
        <div 
          onClick={() => setCurrentView('fdrs')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 shadow-xs transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Verification</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            {summary.pending_verification} <span className="text-xs text-slate-500 font-normal">In Review</span>
          </div>
          <div className="text-xs text-blue-600 font-medium mt-1 flex items-center justify-between">
            <span>Awaiting Officer Scrutiny</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div className="h-1 w-full bg-blue-400 absolute bottom-0 left-0"></div>
        </div>

      </div>

      {/* SECTION B: DOCUMENTS REQUIRING ATTENTION (CRITICAL ALERT BOX) */}
      {data?.attention_documents && data.attention_documents.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-300/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-amber-950">Documents Requiring Institutional Attention</h3>
                <p className="text-xs text-amber-800">
                  AICTE Scrutiny Officers have requested clarifications or identified missing documentation on these deposits.
                </p>
              </div>
            </div>
            <span className="bg-amber-200 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
              {data.attention_documents.length} Action{data.attention_documents.length > 1 ? 's' : ''} Needed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {data.attention_documents.map(item => (
              <div 
                key={item.id} 
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span className="text-blue-900">{item.fdr_number}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'CORRECTION_REQUESTED' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Bank: <strong>{item.bank_name}</strong> • Amount: <strong>{formatINR(item.amount)}</strong>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200/80 text-xs text-amber-900 mt-2.5">
                    <span className="font-bold text-[11px] block uppercase text-amber-800">AICTE Officer Observation:</span>
                    <p className="text-[11px] mt-0.5 leading-relaxed">{item.officer_note}</p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">File: {item.document_filename || 'Not provided'}</span>
                  <button
                    onClick={() => setActiveResubmitDoc(item)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Correct / Re-upload
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-COLUMN MAIN BODY: A. RECENT SUBMISSIONS & C. MATURITY CALENDAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SECTION A: MY RECENT FDR SUBMISSIONS (2 COLS) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                My Recent FDR Submissions
              </h3>
              <p className="text-xs text-slate-500">Security deposits registered by your institution under AICTE joint lien</p>
            </div>
            <button
              onClick={() => setCurrentView('fdrs')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              All Records <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">FDR Number</th>
                  <th className="py-2.5 px-3">Bank & Branch</th>
                  <th className="py-2.5 px-3">Amount (₹)</th>
                  <th className="py-2.5 px-3">Submitted</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Required Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!data?.recent_submissions || data.recent_submissions.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No security deposits recorded. Click "Register New FDR" to submit.
                    </td>
                  </tr>
                ) : (
                  data.recent_submissions.map(fdr => (
                    <tr key={fdr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-blue-900">
                        {fdr.fdr_number}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <div className="font-medium text-slate-900">{fdr.bank_name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{fdr.branch_name}</div>
                      </td>
                      <td className="py-3 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                        {formatINR(fdr.amount)}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {fdr.submitted_at}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={fdr.status} />
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold inline-block ${
                          fdr.required_action.includes('Upload') ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300' :
                          fdr.required_action.includes('Renewal') ? 'bg-purple-100 text-purple-900 font-bold' :
                          fdr.required_action.includes('Discrepancy') ? 'bg-red-100 text-red-900 font-bold' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {fdr.required_action}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION C: UPCOMING MATURITY CALENDAR (1 COL) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  Maturity Calendar
                </h3>
                <p className="text-xs text-slate-500">Upcoming 180-day expiry schedule</p>
              </div>
              <button
                onClick={() => setCurrentView('renewals')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Track All
              </button>
            </div>

            <div className="space-y-3">
              {(!data?.upcoming_maturities || data.upcoming_maturities.length === 0) ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                  No security deposits maturing in the next 180 days. All active deposits in safe custody.
                </div>
              ) : (
                data.upcoming_maturities.map(mat => (
                  <div 
                    key={mat.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{mat.fdr_number}</div>
                      <div className="text-[11px] text-slate-500">{mat.bank_name} • {formatINR(mat.amount)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Maturity: {mat.maturity_date}</div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold block mb-1 ${
                        mat.is_overdue ? 'bg-red-100 text-red-800' :
                        mat.days_remaining <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {mat.is_overdue ? 'Matured' : `${mat.days_remaining}d left`}
                      </span>
                      <button
                        onClick={() => setCurrentView('renewals')}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 justify-end"
                      >
                        Renew <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              AICTE norms mandate renewal application submission at least <strong>30 days</strong> before deposit maturity.
            </span>
          </div>
        </div>

      </div>

      {/* SECTION D: MY RELEASE / REFUND REQUESTS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              My Security Deposit Release / Refund Requests
            </h3>
            <p className="text-xs text-slate-500">Track stage-by-stage refund applications after tenure completion</p>
          </div>
          <button
            onClick={() => setCurrentView('releases')}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            Apply for Release <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Request Number</th>
                <th className="py-2.5 px-3">FDR Number</th>
                <th className="py-2.5 px-3">Amount (₹)</th>
                <th className="py-2.5 px-3">Reason for Release</th>
                <th className="py-2.5 px-3">Workflow Status</th>
                <th className="py-2.5 px-3">Latest Scrutiny / Approver Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!data?.my_releases || data.my_releases.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No active release or refund requests for this institution.
                  </td>
                </tr>
              ) : (
                data.my_releases.map(rel => (
                  <tr key={rel.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-900">
                      {rel.request_number}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {rel.fdr_number}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {formatINR(rel.amount)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {rel.reason}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                        rel.status === 'APPROVED_BY_APPROVER' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        rel.status === 'RECOMMENDED_FOR_APPROVAL' ? 'bg-sky-100 text-sky-800 border border-sky-300' :
                        rel.status === 'RETURNED_FOR_CLARIFICATION' ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold animate-pulse' :
                        rel.status === 'OFFICER_REJECTED' || rel.status === 'APPROVER_REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {rel.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-sm">
                      <div className="text-[11px] leading-relaxed truncate" title={rel.latest_update}>
                        {rel.latest_update}
                      </div>
                      {rel.signature_token && (
                        <div className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
                          Token: {rel.signature_token}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CORRECTION RESUBMISSION */}
      {activeResubmitDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Re-submit Corrected Deposit Document</h3>
                <p className="text-xs text-slate-500">FDR #{activeResubmitDoc.fdr_number} • {activeResubmitDoc.bank_name}</p>
              </div>
              <button 
                onClick={() => setActiveResubmitDoc(null)} 
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 mb-4">
              <span className="font-bold text-[11px] block uppercase text-amber-800 mb-0.5">Officer's Correction Instruction:</span>
              <p className="text-[11px] leading-relaxed">{activeResubmitDoc.officer_note}</p>
            </div>

            <form onSubmit={handleResubmitCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Scanned Document / Rectification Receipt (PDF/PNG/JPG)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setResubmitFile(e.target.files[0])}
                  className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-lg p-1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institutional Clarification / Compliance Remarks
                </label>
                <textarea
                  rows={3}
                  value={resubmitRemarks}
                  onChange={(e) => setResubmitRemarks(e.target.value)}
                  placeholder="Explain the correction made or details of rectified joint lien document..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveResubmitDoc(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCorrection}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCorrection ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Submit for AICTE Scrutiny
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
