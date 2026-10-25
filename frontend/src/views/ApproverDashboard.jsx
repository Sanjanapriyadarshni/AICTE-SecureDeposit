import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  FileCheck,
  Building2,
  Landmark,
  Coins,
  Send,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Scale,
  ArrowRight,
  Lock,
  RotateCcw,
  Ban
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import {
  fetchApproverDashboard,
  approverActionRelease
} from '../services/api';

export default function ApproverDashboard({ setCurrentView, onRefreshGlobal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(false);

  // Decision Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decisionAction, setDecisionAction] = useState('APPROVE'); // 'APPROVE' | 'REJECT' | 'RETURN_FOR_CLARIFICATION'
  const [decisionComments, setDecisionComments] = useState('');
  const [approverName, setApproverName] = useState('Dr. S. K. Murthy (Competent Authority / Member Secretary)');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApproverDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load approver dashboard:', err);
      setError('Unable to fetch live approval queue. Showing offline cached data.');
    } finally {
      setLoading(false);
    }
  }

  function openDecisionModal(requestItem, defaultAction = 'APPROVE') {
    setSelectedRequest(requestItem);
    setDecisionAction(defaultAction);
    setDecisionComments(
      defaultAction === 'APPROVE' 
        ? 'Clearance checklist verified against AICTE norms. 10-year tenure and NOC confirmed. Financial release and refund authorized.'
        : defaultAction === 'RETURN_FOR_CLARIFICATION'
        ? 'Please clarify university affiliation endorsement and re-verify beneficiary bank account credentials.'
        : 'Rejection: Failure to meet mandatory 10-year compliance retention period.'
    );
    setActionSuccess(null);
    setActionError(null);
  }

  function closeDecisionModal() {
    setSelectedRequest(null);
    setActionSuccess(null);
    setActionError(null);
  }

  async function handleExecuteDecision(e) {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!decisionComments.trim()) {
      setActionError('Mandatory requirement: Please enter detailed decision remarks.');
      return;
    }

    setIsSubmittingDecision(true);
    setActionError(null);

    try {
      const res = await approverActionRelease(
        selectedRequest.id,
        decisionAction,
        decisionComments,
        approverName
      );

      const actionText = 
        decisionAction === 'APPROVE' ? 'SANCTIONED & APPROVED' :
        decisionAction === 'RETURN_FOR_CLARIFICATION' ? 'RETURNED FOR CLARIFICATION' : 'REJECTED';

      setActionSuccess(`Application #${selectedRequest.request_number} successfully ${actionText}. Audit token logged.`);
      loadDashboard();
      if (onRefreshGlobal) onRefreshGlobal();
      setTimeout(() => {
        closeDecisionModal();
      }, 1500);
    } catch (err) {
      setActionError(err.message || 'Approval action failed. Ensure all clearances are satisfied.');
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-3" />
        <p className="text-sm font-medium">Loading Financial Approver Executive Desk...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    awaiting_decision_count: 0,
    total_value_awaiting: 0,
    total_value_awaiting_lakhs: 0,
    total_value_awaiting_crores: 0,
    verified_ready_count: 0,
    recently_approved_count: 0,
    recently_approved_amount: 0
  };

  const approvalQueue = data?.approval_queue || [];
  const recentDecisions = data?.recent_decisions || [];
  const pendingClarifications = data?.pending_clarifications || [];

  const filteredQueue = approvalQueue.filter(item => {
    const matchesSearch = 
      (item.request_number && item.request_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.institution_name && item.institution_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.fdr_number && item.fdr_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesEligibility = filterEligibleOnly ? item.clearance_status?.is_eligible_for_approval : true;

    return matchesSearch && matchesEligibility;
  });

  return (
    <div className="space-y-6">
      
      {/* Role Banner - Approver (Consistent Government Navy with restrained amber pill accent) */}
      <div 
        className="rounded-2xl p-6 text-white shadow-sm border border-slate-700/60 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #17365D 0%, #1e4577 55%, #17365D 100%)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/25 text-amber-200 border border-amber-400/30 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                Competent Authority / Financial Approver Desk
              </span>
              <span className="text-xs text-blue-200/80">• Statutory Release Sanction</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Scale className="w-6 h-6 text-amber-300" />
              AICTE Security Deposit Release & Refund Authority
            </h1>
            <p className="text-sm text-blue-100/90 mt-1 max-w-2xl">
              Sanction statutory release of Fixed Deposit Receipts, authorize refund disbursals, and issue digital clearance tokens.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => { setFilterEligibleOnly(!filterEligibleOnly); setSearchQuery(''); }}
              className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl border shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                filterEligibleOnly 
                  ? 'bg-amber-600 text-white border-amber-400' 
                  : 'bg-amber-700/70 hover:bg-amber-700 text-white border-amber-500/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {filterEligibleOnly ? 'Showing Ready Only' : `Ready for Decision (${summary.verified_ready_count})`}
            </button>
            <button
              onClick={() => setCurrentView('releases')}
              className="px-4 py-2.5 bg-white text-[#17365D] hover:bg-slate-100 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Coins className="w-4 h-4 text-[#17365D]" />
              Release Workflow
            </button>
          </div>
        </div>

        {/* Subtle Background Pattern */}
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 text-white/5 pointer-events-none">
          <Scale className="w-64 h-64" />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadDashboard} className="underline font-semibold hover:text-amber-900">Retry</button>
        </div>
      )}

      {/* Summary KPI Cards (Orange / Amber Accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Release Requests Awaiting Decision */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Awaiting Decision</span>
            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{summary.awaiting_decision_count}</span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
              In Docket
            </span>
          </div>
          <div className="mt-2 text-xs text-orange-700 font-medium">
            Submitted with officer recommendation
          </div>
        </div>

        {/* Card 2: Total Value Awaiting Approval */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Value Awaiting</span>
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-700 font-mono">
              {formatINR(summary.total_value_awaiting)}
            </span>
            <span className="text-xs font-medium text-slate-500">
              ₹{summary.total_value_awaiting_lakhs} Lakh
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Cumulative principal refund liability
          </div>
        </div>

        {/* Card 3: Verified Requests Ready for Decision */}
        <div 
          onClick={() => setFilterEligibleOnly(!filterEligibleOnly)}
          className={`bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition-all hover:shadow-md ${
            filterEligibleOnly ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ready for Decision</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-700">{summary.verified_ready_count}</span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              100% Cleared
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <span>Zero discrepancies, officer endorsed</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: Recently Approved Requests */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Approved Releases</span>
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-blue-900">{summary.recently_approved_count}</span>
            <span className="text-xs font-bold text-blue-800 font-mono">
              {formatINR(summary.recently_approved_amount)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Digital release tokens generated
          </div>
        </div>

      </div>

      {/* Main Grid: Section A & C/D */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Section A: Release Approval Queue (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <h2 className="text-base font-bold text-slate-900">Release Approval Docket</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">
                  {filteredQueue.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review verified security deposit release applications. Disbursal requires 3-tier clearance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterEligibleOnly(false)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  !filterEligibleOnly ? 'bg-orange-700 text-white shadow-xs font-semibold' : 'bg-slate-200 text-slate-700'
                }`}
              >
                All Docket ({approvalQueue.length})
              </button>
              <button
                onClick={() => setFilterEligibleOnly(true)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  filterEligibleOnly ? 'bg-emerald-700 text-white shadow-xs font-semibold' : 'bg-slate-200 text-slate-700'
                }`}
              >
                Fully Cleared Only
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search approval queue by Application Ref, Institution Name, or FDR Number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Approval Queue Table */}
          <div className="overflow-x-auto flex-1">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-60" />
                <p className="text-sm font-medium text-slate-600">No release applications pending your decision</p>
                <p className="text-xs text-slate-400 mt-1">All applications in this filter have been decided or are currently under officer review.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Docket & Institution</th>
                    <th className="px-3 py-3">Refund Amount</th>
                    <th className="px-3 py-3">Officer Review</th>
                    <th className="px-3 py-3">Clearance Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map((item) => {
                    const isEligible = item.clearance_status?.is_eligible_for_approval;
                    return (
                      <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{item.institution_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                            <span className="font-bold text-orange-900">{item.request_number}</span>
                            <span>• FDR #{item.fdr_number}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-mono font-bold text-sm text-slate-900">{formatINR(item.amount)}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{item.reason}</div>
                        </td>
                        <td className="px-3 py-3">
                          {item.officer_recommendation === 'RECOMMENDED' ? (
                            <div>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Recommended
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">{item.officer_name || 'Officer Cell-1'}</div>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-medium flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" />
                              Under Review
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className={`w-2 h-2 rounded-full ${item.clearance_status?.officer_scrutiny === 'RECOMMENDED' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                              <span>Officer Endorsement</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className={`w-2 h-2 rounded-full ${item.clearance_status?.university_noc === 'CLEAR' ? 'bg-emerald-500' : 'bg-red-400'}`}></span>
                              <span>University NOC</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className={`w-2 h-2 rounded-full ${item.clearance_status?.vigilance === 'CLEAR' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                              <span>Vigilance Clean</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openDecisionModal(item)}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            Review & Decide
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Section C: Recent Decisions & Section D: Pending Clarifications (1 Col) */}
        <div className="space-y-6">

          {/* Section D: Pending Clarifications */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Returned for Clarification</h3>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {pendingClarifications.length} Active
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {pendingClarifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">No applications currently returned for clarification.</p>
              ) : (
                pendingClarifications.map((pc) => (
                  <div key={pc.id} className="p-3 bg-amber-50/40 rounded-lg border border-amber-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{pc.request_number}</span>
                      <span className="font-mono">{formatINR(pc.amount)}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      FDR #{pc.fdr_number}
                    </div>
                    <div className="text-[11px] text-amber-900 font-medium mt-1 bg-white p-2 rounded border border-amber-100">
                      Observation: {pc.return_reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section C: Recent Decisions Log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent Executive Decisions</h3>
              <button
                onClick={() => setCurrentView('audit')}
                className="text-xs text-orange-700 hover:text-orange-900 font-semibold"
              >
                Full Audit
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentDecisions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent decision records logged.</p>
              ) : (
                recentDecisions.map((dec) => {
                  const isApp = dec.decision === 'APPROVED';
                  const isRet = dec.decision === 'RETURNED';
                  return (
                    <div key={dec.id} className={`text-xs border-l-2 pl-3 py-1 ${
                      isApp ? 'border-emerald-500' : isRet ? 'border-amber-500' : 'border-red-500'
                    }`}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                          isApp ? 'bg-emerald-100 text-emerald-800' : isRet ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {dec.decision}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">{dec.decision_date}</span>
                      </div>
                      <div className="font-semibold text-slate-800 mt-1">
                        {dec.request_number} • {formatINR(dec.amount)}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                        {dec.decision_reason || 'Norms verified.'}
                      </div>
                      {dec.signature_token && (
                        <div className="mt-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                          {dec.signature_token}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* SECTION B: DECISION REVIEW PANEL (MODAL) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/20 text-orange-300 border border-orange-400/30">
                    Statutory Sanction Dossier
                  </span>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Security Deposit Release Application: {selectedRequest.request_number}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  {selectedRequest.institution_name} • FDR #{selectedRequest.fdr_number} • Amount: {formatINR(selectedRequest.amount)}
                </p>
              </div>
              <button 
                onClick={closeDecisionModal}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Feedback */}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div className="p-3 bg-red-50 border-b border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Modal Content */}
            <form onSubmit={handleExecuteDecision} className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Simulated Disbursal Protocol Notice */}
              <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl flex items-start gap-3">
                <Coins className="w-5 h-5 text-orange-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-orange-950">
                  <span className="font-bold uppercase tracking-wider block text-orange-900 text-[11px]">
                    SIMULATED TREASURY REFUND SANCTION (DEMO WORKFLOW)
                  </span>
                  Approving this request issues a simulated digital release sanction token (`DIGI-SIGN-AICTE-...`) and releases the institution lien. Simulated Core Banking protocols apply; no real financial transactions take place.
                </div>
              </div>

              {/* 3-Point Mandatory Clearance Verification Checklist */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Statutory 3-Point Pre-Sanction Clearance Checklist
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  
                  {/* Point 1: Scrutiny Officer Endorsement */}
                  <div className={`p-3 rounded-lg border text-xs ${
                    selectedRequest.clearance_status?.officer_scrutiny === 'RECOMMENDED' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {selectedRequest.clearance_status?.officer_scrutiny === 'RECOMMENDED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                      1. Officer Scrutiny
                    </div>
                    <div className="text-[11px]">
                      {selectedRequest.clearance_status?.officer_scrutiny === 'RECOMMENDED' 
                        ? 'Formally recommended for release by Scrutiny Cell.'
                        : 'Awaiting officer formal endorsement.'}
                    </div>
                  </div>

                  {/* Point 2: University NOC */}
                  <div className={`p-3 rounded-lg border text-xs ${
                    selectedRequest.clearance_status?.university_noc === 'CLEAR' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {selectedRequest.clearance_status?.university_noc === 'CLEAR' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      2. Affiliating Body NOC
                    </div>
                    <div className="text-[11px]">
                      {selectedRequest.clearance_status?.university_noc === 'CLEAR' 
                        ? 'University No-Objection Certificate verified on record.'
                        : 'University NOC document missing.'}
                    </div>
                  </div>

                  {/* Point 3: Vigilance Clean */}
                  <div className={`p-3 rounded-lg border text-xs ${
                    selectedRequest.clearance_status?.vigilance === 'CLEAR' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {selectedRequest.clearance_status?.vigilance === 'CLEAR' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      3. Vigilance Clearance
                    </div>
                    <div className="text-[11px]">
                      {selectedRequest.clearance_status?.vigilance === 'CLEAR' 
                        ? 'Zero pending discrepancies or fraud alerts.'
                        : 'Discrepancy blocked in Vigilance engine.'}
                    </div>
                  </div>

                </div>
              </div>

              {/* Application Details & Beneficiary Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left: Request & Justification */}
                <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 text-xs space-y-2">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                    Application Summary
                  </h5>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Reason for Release:</span>
                    <span className="font-medium text-slate-800">{selectedRequest.reason}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Requested Amount:</span>
                    <span className="font-mono font-bold text-slate-900">{formatINR(selectedRequest.amount)}</span>
                  </div>
                  <div className="py-1">
                    <span className="text-slate-500 block mb-0.5">Applicant Justification:</span>
                    <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 text-[11px]">
                      {selectedRequest.justification_details || "Mandatory 10-year term completed."}
                    </p>
                  </div>
                  {selectedRequest.officer_comments && (
                    <div className="py-1">
                      <span className="text-slate-500 block mb-0.5">Scrutiny Officer Remarks:</span>
                      <p className="text-teal-900 bg-teal-50 p-2 rounded border border-teal-200 text-[11px]">
                        "{selectedRequest.officer_comments}" — {selectedRequest.officer_name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Refund Beneficiary Credentials */}
                <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 text-xs space-y-2">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                    Verified Refund Disbursal Credentials
                  </h5>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Beneficiary Legal Name:</span>
                    <span className="font-semibold text-slate-900">{selectedRequest.beneficiary_details?.name || selectedRequest.institution_name}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Bank Account Number:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedRequest.beneficiary_details?.account || "981273918237"}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">IFSC Code:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedRequest.beneficiary_details?.ifsc || "SBIN0001234"}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Affiliation NOC:</span>
                    {selectedRequest.noc_document_url ? (
                      <a 
                        href={selectedRequest.noc_document_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View NOC Document
                      </a>
                    ) : (
                      <span className="text-red-600 font-bold">Missing</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Decision Selector & Mandatory Comments */}
              <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/30 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Executive Decision Action
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDecisionAction('APPROVE')}
                      className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        decisionAction === 'APPROVE'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Release & Refund
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecisionAction('RETURN_FOR_CLARIFICATION')}
                      className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        decisionAction === 'RETURN_FOR_CLARIFICATION'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Return for Clarification
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecisionAction('REJECT')}
                      className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        decisionAction === 'REJECT'
                          ? 'bg-red-600 text-white border-red-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Ban className="w-4 h-4" />
                      Reject Release Application
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Mandatory Decision Justification / Sanction Order Remarks:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={decisionComments}
                    onChange={(e) => setDecisionComments(e.target.value)}
                    placeholder="Provide statutory justification for your decision..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Signing Authority Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-orange-200">
                  <button
                    type="button"
                    onClick={closeDecisionModal}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDecision}
                    className={`px-5 py-2 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ${
                      decisionAction === 'APPROVE'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : decisionAction === 'RETURN_FOR_CLARIFICATION'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    {isSubmittingDecision ? 'Processing...' : `Confirm & Sanction (${decisionAction})`}
                  </button>
                </div>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
