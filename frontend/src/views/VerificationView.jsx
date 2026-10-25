import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowRightLeft, 
  RotateCw, 
  Landmark, 
  Building2, 
  FileText, 
  Calendar, 
  DollarSign, 
  HelpCircle,
  Check,
  AlertCircle,
  ExternalLink,
  Lock,
  Scan
} from 'lucide-react';
import { 
  fetchFDRs, 
  fetchVerificationComparison, 
  getInitialVerificationComparison,
  triggerBankVerification, 
  resolveDiscrepancy, 
  officerApproveVerification 
} from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function VerificationView({ 
  currentRole, 
  selectedFdrId, 
  setSelectedFdrId,
  onVerificationComplete,
  filterMode = 'ALL'
}) {
  const [fdrList, setFdrList] = useState(() => {
    try {
      const cached = localStorage.getItem('aicte_fdrs');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [activeFdrId, setActiveFdrId] = useState(() => {
    if (selectedFdrId) return selectedFdrId;
    try {
      const cached = localStorage.getItem('aicte_fdrs');
      const list = cached ? JSON.parse(cached) : [];
      if (filterMode === 'DISCREPANCIES') {
        return list.find(f => f.status === 'DISCREPANCY_FLAGGED')?.id || list[0]?.id || 7;
      }
      if (filterMode === 'CORRECTIONS') {
        return list.find(f => f.status === 'CORRECTION_REQUESTED')?.id || list[0]?.id || 7;
      }
      return list.find(f => f.status === 'PENDING_VERIFICATION' || f.status === 'DISCREPANCY_FLAGGED')?.id || list[0]?.id || 7;
    } catch {
      return 7;
    }
  });
  const [comparisonData, setComparisonData] = useState(() => {
    try {
      return getInitialVerificationComparison(selectedFdrId || 7);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [simulationScenario, setSimulationScenario] = useState('EXACT_MATCH');
  
  // Resolution modal state
  const [resolveModalDisc, setResolveModalDisc] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Officer sign-off state
  const [officerNotes, setOfficerNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadFDRList();
  }, [filterMode]);

  useEffect(() => {
    if (activeFdrId) {
      loadComparison(activeFdrId);
    }
  }, [activeFdrId]);

  async function loadFDRList() {
    try {
      const data = await fetchFDRs();
      setFdrList(data);
      if (data.length > 0) {
        let initial = selectedFdrId;
        if (!initial) {
          if (filterMode === 'DISCREPANCIES') {
            initial = data.find(f => f.status === 'DISCREPANCY_FLAGGED')?.id;
          } else if (filterMode === 'CORRECTIONS') {
            initial = data.find(f => f.status === 'CORRECTION_REQUESTED')?.id;
          }
          if (!initial) {
            initial = data.find(f => f.status === 'PENDING_VERIFICATION' || f.status === 'DISCREPANCY_FLAGGED')?.id || data[0].id;
          }
        }
        setActiveFdrId(initial);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadComparison(fdrId) {
    if (!comparisonData) setLoading(true);
    try {
      const data = await fetchVerificationComparison(fdrId);
      setComparisonData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTriggerVerification() {
    setVerifying(true);
    setNotification(null);
    try {
      const res = await triggerBankVerification(activeFdrId, simulationScenario);
      setNotification({
        type: 'success',
        message: `Simulated Bank Verification executed successfully! CBS Reference: ${res.cbs_reference_no}. Detected discrepancies: ${res.discrepancies_detected}.`
      });
      await loadComparison(activeFdrId);
      await loadFDRList();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Simulated verification failed.'
      });
    } finally {
      setVerifying(false);
    }
  }

  async function handleResolveSubmit(e) {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;

    setIsResolving(true);
    try {
      await resolveDiscrepancy(resolveModalDisc.id, resolutionNotes, 'Shri R. K. Sharma (AICTE Officer)');
      setResolveModalDisc(null);
      setResolutionNotes('');
      setNotification({
        type: 'success',
        message: 'Discrepancy formally resolved and logged in immutable audit trail.'
      });
      await loadComparison(activeFdrId);
      await loadFDRList();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsResolving(false);
    }
  }

  async function handleOfficerApproval() {
    setIsApproving(true);
    try {
      await officerApproveVerification(
        activeFdrId, 
        'Shri R. K. Sharma (Deputy Director, AICTE)', 
        officerNotes || 'Verified against Bank CBS records. AICTE lien confirmed active.'
      );
      setNotification({
        type: 'success',
        message: `FDR #${comparisonData.fdr_number} successfully verified and marked ACTIVE.`
      });
      await loadComparison(activeFdrId);
      await loadFDRList();
      if (onVerificationComplete) onVerificationComplete();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsApproving(false);
    }
  }

  // Format currency
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const instData = comparisonData?.institution_data || {};
  const bankData = comparisonData?.bank_confirmed_data || {};
  const discrepancies = comparisonData?.discrepancies || [];
  const unresolvedDiscrepancies = discrepancies.filter(d => !d.resolved);
  const hasCriticalUnresolved = unresolvedDiscrepancies.some(d => d.severity === 'CRITICAL' || d.severity === 'HIGH');

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Verification Console & FDR Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <ArrowRightLeft className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                FDR Verification & Discrepancy Scrutiny
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side reconciliation between Institution-submitted records and Bank Core Banking System (CBS) confirmations
            </p>
          </div>

          {/* FDR Record Picker */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600 shrink-0">
              Select FDR:
            </label>
            <select
              value={activeFdrId || ''}
              onChange={e => setActiveFdrId(parseInt(e.target.value))}
              className="px-3 py-2 text-xs font-mono font-medium border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[280px]"
            >
              {fdrList.map(f => (
                <option key={f.id} value={f.id}>
                  {f.fdr_number} - {f.institution_name.slice(0, 24)}... ({f.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Verification Status Banner */}
        {comparisonData && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-500">Target FDR:</span>
              <span className="font-mono font-bold text-blue-900 text-sm">
                {comparisonData.fdr_number}
              </span>
              <StatusBadge status={comparisonData.status} />
              {unresolvedDiscrepancies.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {unresolvedDiscrepancies.length} Active Discrepancies
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">CBS Source:</span>
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-mono text-[11px]">
                {bankData?.verification_source || 'Simulated Bank API Gateway'}
              </span>
            </div>
          </div>
        )}
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          notification.type === 'error' 
            ? 'bg-red-50 text-red-800 border-red-200' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Simulated Bank Verification Control Box */}
      <div 
        className="bg-aicte-bank-gateway bg-slate-900 p-5 rounded-xl text-white shadow-sm border border-blue-800"
        style={{ background: 'linear-gradient(135deg, #0f2942 0%, #1e3a8a 100%)', color: '#ffffff' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-400 text-slate-900">
                Simulated Bank Gateway
              </span>
              <span className="text-xs text-blue-200">
                Core Banking System (CBS) / SFMS Protocol Emulation
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Bank API Verification Simulation
            </h3>
            <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
              Real banking infrastructure mandates authorized SFMS gateway lines. For this hackathon demo, you can simulate 
              instant verification under various conditions to test automated discrepancy detection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs">
              <label className="block text-[11px] text-blue-200 mb-1 font-semibold">Test Scenario:</label>
              <select
                value={simulationScenario}
                onChange={e => setSimulationScenario(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-800 text-white border border-blue-700 rounded-lg focus:outline-none"
              >
                <option value="EXACT_MATCH">Exact CBS Match (Zero Discrepancy)</option>
                <option value="AMOUNT_MISMATCH">Amount Mismatch (Bank shows ₹5L less)</option>
                <option value="DATE_MISMATCH">Maturity Date Mismatch (1 Year Variance)</option>
                <option value="LIEN_MISSING">Missing AICTE Lien (No Lien in CBS)</option>
              </select>
            </div>

            <button
              onClick={handleTriggerVerification}
              disabled={verifying}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 shrink-0"
            >
              {verifying ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Polling CBS Gateway...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execute Bank Verification</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading && !comparisonData ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <RotateCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          <span>Loading verification records...</span>
        </div>
      ) : !comparisonData ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No comparison data available</p>
        </div>
      ) : (
        <>
          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Card: Institution-Submitted Information */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Institution-Submitted Information
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Claimed Particulars
                  </span>
                </div>

                <div className="p-5 space-y-3.5 text-xs">
                  
                  {/* Institution */}
                  <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Institution:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-xs">
                      {instData.institution_name}
                    </span>
                  </div>

                  {/* FDR Number */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">FDR Certificate Number:</span>
                    <span className="font-mono font-bold text-blue-900">
                      {instData.fdr_number}
                    </span>
                  </div>

                  {/* Bank & Branch */}
                  <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Issuing Bank & Branch:</span>
                    <span className="font-medium text-slate-800 text-right">
                      {instData.bank_name} <br />
                      <span className="text-[11px] text-slate-500">{instData.branch_name}</span>
                    </span>
                  </div>

                  {/* IFSC */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Branch IFSC:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {instData.ifsc_code}
                    </span>
                  </div>

                  {/* Deposit Amount */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Deposit Amount (₹):</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatINR(instData.amount)}
                      </span>
                      <div className="text-[10px] text-slate-400">{instData.amount_in_words}</div>
                    </div>
                  </div>

                  {/* Issue Date */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Issue Date:</span>
                    <span className="font-semibold text-slate-800">{instData.issue_date}</span>
                  </div>

                  {/* Maturity Date */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Maturity Date:</span>
                    <span className="font-semibold text-slate-800">{instData.maturity_date}</span>
                  </div>

                  {/* Tenure */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Stated Tenure:</span>
                    <span className="font-semibold text-slate-800">{instData.tenure_months} Months</span>
                  </div>

                  {/* Lien Status */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Claimed AICTE Joint Lien:</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {instData.joint_holder}
                    </span>
                  </div>

                  {/* Scanned Certificate */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">Uploaded Document:</span>
                    <a
                      href={instData.document_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {instData.document_filename || 'View Certificate Copy'}
                    </a>
                  </div>

                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400">
                Submitted on {new Date(instData.submitted_at).toLocaleDateString()}
              </div>
            </div>

            {/* Right Card: Bank-Confirmed Information */}
            <div className={`rounded-xl border shadow-xs overflow-hidden flex flex-col justify-between ${
              bankData?.is_verified ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-300'
            }`}>
              <div>
                <div className={`p-4 border-b flex items-center justify-between ${
                  bankData?.is_verified ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-100 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Bank-Confirmed Information (SFMS / CBS)
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    bankData?.verification_status === 'CONFIRMED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : bankData?.verification_status === 'MISMATCH_DETECTED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {bankData?.verification_status || 'Awaiting Check'}
                  </span>
                </div>

                {bankData?.is_verified ? (
                  <div className="p-5 space-y-3.5 text-xs">
                    
                    {/* CBS Reference */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">CBS Confirmation Ref:</span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {bankData.cbs_reference_no}
                      </span>
                    </div>

                    {/* Bank Confirmed FDR Number */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">FDR Number in CBS:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {bankData.fdr_number}
                      </span>
                    </div>

                    {/* Confirmed Bank & Branch */}
                    <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Confirmed Bank & Branch:</span>
                      <span className="font-medium text-slate-800 text-right">
                        {bankData.bank_name} <br />
                        <span className="text-[11px] text-slate-500">{bankData.branch_name}</span>
                      </span>
                    </div>

                    {/* Verified Amount */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">CBS Ledger Balance:</span>
                      <div className="text-right">
                        <span className={`font-bold text-sm ${
                          Math.abs(instData.amount - bankData.verified_amount) > 1.0 
                            ? 'text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-300' 
                            : 'text-emerald-700'
                        }`}>
                          {formatINR(bankData.verified_amount)}
                        </span>
                        {Math.abs(instData.amount - bankData.verified_amount) > 1.0 && (
                          <div className="text-[10px] text-red-600 font-bold">
                            ⚠️ Mismatch: Shortfall of {formatINR(Math.abs(instData.amount - bankData.verified_amount))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confirmed Issue Date */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">CBS Stamped Issue Date:</span>
                      <span className={`font-semibold ${
                        instData.issue_date !== bankData.verified_issue_date ? 'text-red-600 font-bold' : 'text-slate-800'
                      }`}>
                        {bankData.verified_issue_date}
                      </span>
                    </div>

                    {/* Confirmed Maturity Date */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">CBS Maturity Date:</span>
                      <span className={`font-semibold ${
                        instData.maturity_date !== bankData.verified_maturity_date ? 'text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded' : 'text-slate-800'
                      }`}>
                        {bankData.verified_maturity_date}
                      </span>
                    </div>

                    {/* CBS Lien Confirmation */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">CBS Lien Endorsement:</span>
                      {bankData.lien_confirmed ? (
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lien Marked in AICTE Favor
                        </span>
                      ) : (
                        <span className="font-semibold text-red-700 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded">
                          <XCircle className="w-3.5 h-3.5" />
                          No Lien Registered in CBS
                        </span>
                      )}
                    </div>

                    {/* Branch Manager */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Authorized Official:</span>
                      <span className="font-medium text-slate-700">{bankData.branch_manager_name}</span>
                    </div>

                    {/* Bank Remarks */}
                    <div className="pt-1">
                      <span className="text-slate-500 block mb-1">Official Bank Remarks:</span>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 italic text-[11px]">
                        "{bankData.bank_remarks || 'Confirmed via Core Banking System.'}"
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 space-y-3">
                    <RotateCw className="w-8 h-8 mx-auto text-slate-400" />
                    <div>
                      <div className="font-semibold text-slate-700">Bank Confirmation Pending</div>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                        Trigger simulated bank verification using the button above to query CBS ledger.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Verified: {bankData?.verified_at ? new Date(bankData.verified_at).toLocaleString() : 'Pending'}</span>
                <span>SFMS Gateway Version 3.4</span>
              </div>
            </div>

          </div>

          {/* Automated Discrepancy Detection Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${unresolvedDiscrepancies.length > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Automated Discrepancy Scrutiny & Detection
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rules engine automatically evaluates amounts, maturity dates, lien endorsement, and duplicate numbers
                  </p>
                </div>
              </div>

              {unresolvedDiscrepancies.length === 0 ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Zero Discrepancies (Clear)
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-300 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {unresolvedDiscrepancies.length} Action Items
                </span>
              )}
            </div>

            {discrepancies.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <h4 className="text-sm font-bold text-slate-800">Complete Data Integrity</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Institution data matches Bank Core Banking System records in amount, dates, and lien marking with zero variances.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {discrepancies.map(d => (
                  <div key={d.id} className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          d.severity === 'CRITICAL' 
                            ? 'bg-red-600 text-white' 
                            : d.severity === 'HIGH'
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {d.severity}
                        </span>
                        <span className="font-bold text-xs text-slate-900">
                          {d.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400">({d.field})</span>
                        {d.resolved ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Resolved
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            Unresolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-medium">
                        {d.description}
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                        <span>Submitted: <strong className="text-slate-800">{d.submitted_value || 'None'}</strong></span>
                        <span>•</span>
                        <span>Bank Confirmed: <strong className="text-emerald-800">{d.bank_confirmed_value || 'None'}</strong></span>
                      </div>
                      {d.resolved && d.resolution_notes && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 mt-1">
                          Resolution note by <strong>{d.resolved_by}</strong>: "{d.resolution_notes}"
                        </div>
                      )}
                    </div>

                    {!d.resolved && currentRole !== 'INSTITUTION' && (
                      <button
                        onClick={() => setResolveModalDisc(d)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
                      >
                        Resolve Discrepancy
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* MANDATORY OCR DISCLAIMER BOX */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-700">
              <Scan className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
                  Statutory Rule: OCR Does Not Prove Authenticity
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {comparisonData?.ocr_info?.disclaimer || "CRITICAL AICTE NOTICE: OCR text extraction is an assistive scanning tool for data population and preliminary visual checks. In strict accordance with AICTE vigilance standards, OCR does NOT prove legal or financial authenticity. Authenticity is exclusively verified against Core Banking System / SFMS records."}
                </p>
              </div>
            </div>

          </div>

          {/* AICTE Officer Sign-Off & Approval Box */}
          {currentRole !== 'INSTITUTION' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  AICTE Officer Verification Sign-Off
                </h3>
              </div>

              {hasCriticalUnresolved ? (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Approval Blocked by Vigilance Protocol:</div>
                    <p className="text-[11px] mt-0.5 leading-relaxed text-amber-800">
                      Cannot grant ACTIVE status while critical discrepancies remain unresolved. Please resolve the 
                      discrepancies above or issue a formal query to the institution / bank.
                    </p>
                  </div>
                </div>
              ) : comparisonData.status === 'ACTIVE' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold">This FDR record has already been officially verified and is ACTIVE in AICTE registry.</span>
                  </div>
                  <span className="text-[11px] text-emerald-800">
                    Notes: {comparisonData.verification_notes || 'All checks passed'}
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Scrutiny Findings & Verification Endorsement Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Scrutinized against Core Banking System SFMS record. Joint lien in favor of Member Secretary, AICTE New Delhi confirmed. Unencumbered and approved as ACTIVE."
                      value={officerNotes}
                      onChange={e => setOfficerNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={handleOfficerApproval}
                      disabled={isApproving}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                      {isApproving ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Affixing Digital Endorsement...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Mark Deposit as ACTIVE</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </>
      )}

      {/* Discrepancy Resolution Modal */}
      {resolveModalDisc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-sm">Resolve Discrepancy</h3>
              </div>
              <button onClick={() => setResolveModalDisc(null)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-xs space-y-1">
              <div className="font-bold text-red-900">{resolveModalDisc.type}</div>
              <div className="text-red-700">{resolveModalDisc.description}</div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Resolution Justification / Bank Rectification Ref *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Bank Branch Manager furnished signed endorsement letter rectifying the ledger entry; AICTE lien clause restored in CBS."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalDisc(null)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isResolving ? 'Recording Resolution...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
