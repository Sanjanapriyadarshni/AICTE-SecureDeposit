import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  FileCheck,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Eye,
  FileText,
  Building2,
  Landmark,
  X,
  AlertCircle,
  HelpCircle,
  Send,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Scale
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import {
  fetchOfficerDashboard,
  fetchVerificationComparison,
  triggerBankVerification,
  resolveDiscrepancy,
  officerApproveVerification,
  requestInstitutionCorrection
} from '../services/api';

export default function OfficerDashboard({ setCurrentView, onRefreshGlobal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Scrutiny Panel / Modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Correction Request Modal
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // Officer Approval Notes
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Simulation scenario selector
  const [simScenario, setSimScenario] = useState('EXACT_MATCH');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOfficerDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load officer dashboard:', err);
      setError('Unable to fetch live officer queue. Showing cached data.');
    } finally {
      setLoading(false);
    }
  }

  async function openScrutinyModal(caseItem) {
    setSelectedCase(caseItem);
    setActionSuccess(null);
    setActionError(null);
    setApprovalNotes('Record scrutinised against simulated CBS and scanned deed. Norms compliant.');
    setLoadingComparison(true);
    try {
      const comp = await fetchVerificationComparison(caseItem.id);
      setComparisonData(comp);
    } catch (err) {
      console.error('Failed to fetch scrutiny comparison:', err);
    } finally {
      setLoadingComparison(false);
    }
  }

  function closeScrutinyModal() {
    setSelectedCase(null);
    setComparisonData(null);
    setActionSuccess(null);
    setActionError(null);
  }

  async function handleOfficerApproval() {
    if (!selectedCase) return;
    setIsSubmittingApproval(true);
    setActionError(null);
    try {
      await officerApproveVerification(selectedCase.id, 'AICTE Scrutiny Officer (Cell-1)', approvalNotes);
      setActionSuccess(`FDR #${selectedCase.fdr_number} successfully verified and promoted to ACTIVE status.`);
      loadDashboard();
      if (onRefreshGlobal) onRefreshGlobal();
      // Reload comparison view
      const comp = await fetchVerificationComparison(selectedCase.id);
      setComparisonData(comp);
    } catch (err) {
      setActionError(err.message || 'Verification approval failed.');
    } finally {
      setIsSubmittingApproval(false);
    }
  }

  async function handleSimulateBankVerification(scenarioToRun) {
    if (!selectedCase) return;
    setIsSimulating(true);
    setActionError(null);
    try {
      const res = await triggerBankVerification(selectedCase.id, scenarioToRun || simScenario, 'AICTE Scrutiny Officer (Cell-1)');
      setActionSuccess(res.message || 'Simulated Bank CBS Check executed successfully.');
      loadDashboard();
      if (onRefreshGlobal) onRefreshGlobal();
      const comp = await fetchVerificationComparison(selectedCase.id);
      setComparisonData(comp);
    } catch (err) {
      setActionError(err.message || 'Simulated verification failed.');
    } finally {
      setIsSimulating(false);
    }
  }

  async function handleSendCorrection(e) {
    e.preventDefault();
    if (!selectedCase || !correctionNote.trim()) return;
    setIsSubmittingCorrection(true);
    setActionError(null);
    try {
      await requestInstitutionCorrection(selectedCase.id, 'AICTE Scrutiny Officer (Cell-1)', correctionNote);
      setActionSuccess(`Correction notice dispatched to ${selectedCase.institution_name}. Status changed to CORRECTION_REQUESTED.`);
      setIsCorrectionModalOpen(false);
      setCorrectionNote('');
      loadDashboard();
      if (onRefreshGlobal) onRefreshGlobal();
      const comp = await fetchVerificationComparison(selectedCase.id);
      setComparisonData(comp);
    } catch (err) {
      setActionError(err.message || 'Failed to dispatch correction notice.');
    } finally {
      setIsSubmittingCorrection(false);
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
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-3" />
        <p className="text-sm font-medium">Loading AICTE Scrutiny Officer Work Queue...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    pending_verification: 0,
    discrepancies_flagged: 0,
    awaiting_correction: 0,
    verified_this_period: 0,
    avg_wait_days: 0
  };

  const workQueue = data?.work_queue || [];
  const priorityCases = data?.priority_cases || [];
  const recentActivity = data?.recent_activity || [];

  // Filtered Queue
  const filteredQueue = workQueue.filter(item => {
    const matchesSearch = 
      (item.fdr_number && item.fdr_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.institution_name && item.institution_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.bank_name && item.bank_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'PENDING' ? item.status === 'PENDING_VERIFICATION' :
      statusFilter === 'DISCREPANCY' ? item.status === 'DISCREPANCY_FLAGGED' :
      statusFilter === 'CORRECTION' ? item.status === 'CORRECTION_REQUESTED' : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Role Banner - AICTE Officer (Consistent Government Navy with restrained teal pill accent) */}
      <div 
        className="rounded-2xl p-6 text-white shadow-sm border border-slate-700/60 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #17365D 0%, #1e4577 55%, #17365D 100%)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-500/25 text-teal-200 border border-teal-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                Scrutiny & Verification Officer Desk
              </span>
              <span className="text-xs text-blue-200/80">• Bureau of Approvals & Vigilance</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-300" />
              AICTE Deposit Verification Portal
            </h1>
            <p className="text-sm text-blue-100/90 mt-1 max-w-2xl">
              Cross-verify institutional deposits against simulated Core Banking Systems, inspect discrepancies, and issue statutory correction notices.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => { setStatusFilter('PENDING'); setSearchQuery(''); }}
              className="px-3.5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold rounded-xl border border-teal-500/40 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              Pending Queue ({summary.pending_verification})
            </button>
            <button
              onClick={() => setCurrentView('verification')}
              className="px-4 py-2.5 bg-white text-[#17365D] hover:bg-slate-100 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Scale className="w-4 h-4 text-[#17365D]" />
              Full Scrutiny Hub
            </button>
          </div>
        </div>

        {/* Subtle Background Pattern */}
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 text-white/5 pointer-events-none">
          <ShieldCheck className="w-64 h-64" />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadDashboard} className="underline font-semibold hover:text-amber-900">Retry</button>
        </div>
      )}

      {/* Summary KPI Cards (Teal / Cyan Accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Pending Verification */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'PENDING' ? 'ring-2 ring-teal-500 border-teal-500 bg-teal-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Verification</span>
            <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{summary.pending_verification}</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
              Avg Wait: {summary.avg_wait_days}d
            </span>
          </div>
          <div className="mt-2 text-xs text-teal-700 font-medium flex items-center gap-1">
            <span>Awaiting CBS cross-verification</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Discrepancies Flagged */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'DISCREPANCY' ? 'ALL' : 'DISCREPANCY')}
          className={`bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'DISCREPANCY' ? 'ring-2 ring-red-500 border-red-500 bg-red-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Discrepancies Flagged</span>
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-red-600">{summary.discrepancies_flagged}</span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
              High Priority
            </span>
          </div>
          <div className="mt-2 text-xs text-red-700 font-medium flex items-center gap-1">
            <span>Amount / lien mismatch alerts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Awaiting Institution Correction */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'CORRECTION' ? 'ALL' : 'CORRECTION')}
          className={`bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'CORRECTION' ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Awaiting Correction</span>
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-600">{summary.awaiting_correction}</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
              Notice Issued
            </span>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium flex items-center gap-1">
            <span>Institutions requested to resubmit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: Verified This Period */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verified This Period</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-700">{summary.verified_this_period}</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active Compliant
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Deeds locked with irrevocable AICTE lien
          </div>
        </div>

      </div>

      {/* Main Grid: Section A & C */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Section A: Verification Work Queue (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                <h2 className="text-base font-bold text-slate-900">Verification Work Queue</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-teal-100 text-teal-800 rounded-full">
                  {filteredQueue.length} Cases
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Examine submitted FDRs, compare against Core Banking Systems, and clear compliance.
              </p>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  statusFilter === 'PENDING' ? 'bg-white text-teal-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('DISCREPANCY')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  statusFilter === 'DISCREPANCY' ? 'bg-white text-red-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Discrepant
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search queue by Institution Name, FDR Number, or Bank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto flex-1">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-60" />
                <p className="text-sm font-medium text-slate-600">No cases matching filter criteria</p>
                <p className="text-xs text-slate-400 mt-1">All cases in this category have been processed or moved to active status.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Institution & FDR No.</th>
                    <th className="px-3 py-3">Bank & Amount</th>
                    <th className="px-3 py-3">Submission & Age</th>
                    <th className="px-3 py-3">Scrutiny Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map((item) => {
                    const isAging = item.case_age_days >= 7;
                    return (
                      <tr key={item.id} className="hover:bg-teal-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{item.institution_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>#{item.fdr_number}</span>
                            {item.document_url && (
                              <a 
                                href={item.document_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-teal-600 hover:text-teal-800 inline-flex items-center gap-0.5 text-[10px]"
                                title="View uploaded receipt"
                              >
                                <FileText className="w-3 h-3" />
                                Doc
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-800">{item.bank_name}</div>
                          <div className="font-mono font-bold text-slate-900">{formatINR(item.amount)}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-slate-600">{item.submission_date}</div>
                          <div className="mt-0.5">
                            {isAging ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 w-fit">
                                <Clock className="w-2.5 h-2.5" />
                                {item.case_age_days}d ago (Urgent)
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {item.case_age_label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={item.status} />
                          {item.discrepancy_count > 0 && (
                            <div className="text-[10px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {item.discrepancy_count} discrepancy
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openScrutinyModal(item)}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Open Scrutiny
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

        {/* Section C: Priority Cases & Section D: Recent Activity (1 Col) */}
        <div className="space-y-6">

          {/* Section C: Priority Cases */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                <h3 className="text-sm font-bold text-slate-900">Priority Scrutiny Alerts</h3>
              </div>
              <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Action Required
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {priorityCases.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  No high-priority red flags in current queue.
                </div>
              ) : (
                priorityCases.map((pc) => (
                  <div 
                    key={pc.id}
                    className="p-3 rounded-lg border border-red-200/80 bg-red-50/30 hover:bg-red-50/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{pc.institution_name}</div>
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                          #{pc.fdr_number} • {formatINR(pc.amount)}
                        </div>
                      </div>
                      <button
                        onClick={() => openScrutinyModal(pc)}
                        className="px-2 py-1 text-[11px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      >
                        Scrutinize
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {pc.priority_reasons && pc.priority_reasons.map((r, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-semibold rounded">
                          {r}
                        </span>
                      ))}
                      {pc.case_age_days >= 7 && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded">
                          Age: {pc.case_age_days}d
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section D: Recent Verification Activity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent Verification Activity</h3>
              <button 
                onClick={() => setCurrentView('audit')}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
              >
                Full Audit
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent verification logs.</p>
              ) : (
                recentActivity.map((log) => (
                  <div key={log.id} className="text-xs border-l-2 border-teal-500 pl-3 py-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-800">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="text-slate-600 font-mono text-[11px] mt-0.5">
                      FDR #{log.fdr_number}
                    </div>
                    <div className="text-slate-700 text-[11px] mt-0.5 line-clamp-2">
                      {log.details}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* SECTION B: DISCREPANCY & VERIFICATION REVIEW PANEL (MODAL / DRAWER) */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    AICTE Scrutiny Dossier
                  </span>
                  <StatusBadge status={selectedCase.status} />
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Scrutiny & Cross-Verification: {selectedCase.institution_name}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  FDR #{selectedCase.fdr_number} • {selectedCase.bank_name} • {formatINR(selectedCase.amount)}
                </p>
              </div>
              <button 
                onClick={closeScrutinyModal}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Notifications */}
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Simulated CBS Test Mode Notice */}
              <div className="p-3.5 bg-cyan-50/70 border border-cyan-200 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-cyan-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-cyan-950">
                  <span className="font-bold uppercase tracking-wider block text-cyan-800 text-[11px]">
                    SIMULATED CBS / SFMS INTEGRATION (DEMO SANDBOX)
                  </span>
                  Bank verification is simulated via internal Core Banking System mock protocol. In accordance with AICTE vigilance directives, authenticity is determined by irrevocable bank records, never by optical scan recognition alone.
                </div>
              </div>

              {loadingComparison ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                  <p className="text-xs font-medium">Fetching Core Banking System ledger and scanned deed...</p>
                </div>
              ) : comparisonData ? (() => {
                const instData = comparisonData.institution_data || comparisonData.institution_submission || {};
                const bankData = comparisonData.bank_confirmed_data || comparisonData.bank_verification || null;
                const hasDiscs = comparisonData.discrepancies && comparisonData.discrepancies.length > 0;

                return (
                <div className="space-y-6">

                  {/* 2-Column Comparison View: Institution Data vs Bank Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Left Column: Institution Submitted Data */}
                    <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/20 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-blue-700" />
                          Institution Submitted Data
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                          Applicant Filing
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-blue-100/60">
                          <span className="text-slate-500">Institution:</span>
                          <span className="font-semibold text-slate-900 text-right">{instData.institution_name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-blue-100/60">
                          <span className="text-slate-500">FDR Number:</span>
                          <span className="font-mono font-bold text-slate-900">{instData.fdr_number}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-blue-100/60">
                          <span className="text-slate-500">Bank / Branch:</span>
                          <span className="font-medium text-slate-800">{instData.bank_name} ({instData.branch_name})</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-blue-100/60">
                          <span className="text-slate-500">Claimed Principal:</span>
                          <span className="font-mono font-bold text-blue-950 text-sm">
                            {formatINR(instData.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-blue-100/60">
                          <span className="text-slate-500">Maturity Date:</span>
                          <span className="font-medium text-slate-900">{instData.maturity_date}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Joint Name / Lien:</span>
                          <span className="font-semibold text-emerald-700">Claimed Marked to AICTE</span>
                        </div>
                      </div>

                      {instData.document_url && (
                        <div className="mt-3 pt-2 border-t border-blue-200/60 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            {instData.document_filename || "Deed Scan"}
                          </span>
                          <a
                            href={instData.document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Scan
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Simulated Bank Confirmed Data */}
                    <div className="p-5 rounded-xl border border-teal-200 bg-teal-50/20 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-teal-200/60">
                        <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Landmark className="w-4 h-4 text-teal-700" />
                          Simulated Bank CBS Records
                        </span>
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-mono font-bold">
                          CBS-CONFIRMED
                        </span>
                      </div>

                      {bankData && bankData.cbs_reference_no ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-teal-100/60">
                            <span className="text-slate-500">CBS Ref No:</span>
                            <span className="font-mono font-bold text-teal-900">{bankData.cbs_reference_no}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-teal-100/60">
                            <span className="text-slate-500">Bank & Branch:</span>
                            <span className="font-medium text-slate-800">{bankData.bank_name || instData.bank_name}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-teal-100/60">
                            <span className="text-slate-500">CBS Ledger Principal:</span>
                            <span className={`font-mono font-bold text-sm ${
                              bankData.verified_amount && bankData.verified_amount !== instData.amount
                                ? 'text-red-600 bg-red-100 px-1 rounded'
                                : 'text-teal-950'
                            }`}>
                              {formatINR(bankData.verified_amount || instData.amount)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-teal-100/60">
                            <span className="text-slate-500">Maturity Date:</span>
                            <span className={`font-medium ${
                              bankData.verified_maturity_date && bankData.verified_maturity_date !== instData.maturity_date
                                ? 'text-red-600 font-bold'
                                : 'text-slate-900'
                            }`}>
                              {bankData.verified_maturity_date || instData.maturity_date}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-teal-100/60">
                            <span className="text-slate-500">Irrevocable Lien to AICTE:</span>
                            <span className={`font-semibold ${
                              bankData.lien_confirmed ? 'text-emerald-700' : 'text-red-600 font-bold'
                            }`}>
                              {bankData.lien_confirmed ? "Registered in CBS" : "NO LIEN FOUND"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Verified Timestamp:</span>
                            <span className="text-slate-500 font-mono text-[10px]">{bankData.verified_at || 'Recently Verified'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                          <p>No CBS ledger record yet simulated for this FDR.</p>
                          <p className="mt-1 text-[11px] text-slate-400">Run a simulated verification check below to generate CBS confirmation.</p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Discrepancies Alert Box if any */}
                  {comparisonData.discrepancies && comparisonData.discrepancies.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-900 uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-red-700" />
                        Discrepancies Detected Against Core Banking Records ({comparisonData.discrepancies.length})
                      </div>
                      <div className="space-y-1.5 mt-2">
                        {comparisonData.discrepancies.map((disc, idx) => {
                          const discType = (disc.discrepancy_type || disc.type || 'DISCREPANCY').replace(/_/g, ' ');
                          return (
                            <div key={idx} className="p-2.5 bg-white rounded-lg border border-red-100 text-xs flex items-start justify-between gap-3">
                              <div>
                                <div className="font-bold text-red-800">{discType}</div>
                                <div className="text-slate-600 text-[11px] mt-0.5">{disc.description}</div>
                                <div className="text-[10px] font-mono text-slate-500 mt-1">
                                  Submitted: <span className="font-bold text-slate-800">{String(disc.submitted_value ?? 'N/A')}</span> | Bank: <span className="font-bold text-red-700">{String(disc.bank_confirmed_value ?? 'N/A')}</span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800">
                                {disc.severity || 'ALERT'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interactive Simulation Panel for Officers */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        Bank CBS Verification Simulator (Test Scenarios)
                      </span>
                      <span className="text-[10px] text-slate-500">Demonstrates automated discrepancy engine</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleSimulateBankVerification('EXACT_MATCH')}
                        disabled={isSimulating}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        {isSimulating ? 'Testing...' : 'Test: Exact Match (No Discrepancy)'}
                      </button>
                      <button
                        onClick={() => handleSimulateBankVerification('AMOUNT_MISMATCH')}
                        disabled={isSimulating}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        {isSimulating ? 'Testing...' : 'Test: Amount Shortfall Mismatch'}
                      </button>
                      <button
                        onClick={() => handleSimulateBankVerification('LIEN_MISSING')}
                        disabled={isSimulating}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                      >
                        {isSimulating ? 'Testing...' : 'Test: Missing AICTE Lien'}
                      </button>
                    </div>
                  </div>

                  {/* Scrutiny Decision Section */}
                  <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Officer Decision & Final Endorsement
                    </h4>
                    
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Scrutiny Verification Notes / Observations:
                      </label>
                      <textarea
                        rows={2}
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="State findings regarding lien clause, principal verification, and bank confirmation..."
                        className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-teal-200/60">
                      <button
                        onClick={() => setIsCorrectionModalOpen(true)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Request Institution Correction
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={closeScrutinyModal}
                          className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleOfficerApproval}
                          disabled={isSubmittingApproval}
                          className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {isSubmittingApproval ? 'Verifying...' : 'Verify Record & Mark Active'}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
                );
              })() : null}

            </div>

          </div>
        </div>
      )}

      {/* MODAL: Request Institution Correction */}
      {isCorrectionModalOpen && selectedCase && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold">Issue Formal Correction Notice</h3>
              </div>
              <button 
                onClick={() => setIsCorrectionModalOpen(false)}
                className="text-amber-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendCorrection} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-slate-600 mb-2">
                  Dispatch formal notice to <strong>{selectedCase.institution_name}</strong> for FDR #{selectedCase.fdr_number}. The deposit status will change to <strong>CORRECTION_REQUESTED</strong>.
                </p>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required Corrections / Observations:
                </label>
                <textarea
                  rows={4}
                  required
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  placeholder="e.g. Please re-upload legible scanned deed showing clear irrevocable lien in favor of Member Secretary, AICTE."
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCorrection}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingCorrection ? 'Dispatching...' : 'Dispatch Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
