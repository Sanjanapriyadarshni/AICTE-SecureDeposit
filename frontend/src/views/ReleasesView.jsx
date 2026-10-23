import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Scale, 
  ShieldCheck, 
  XCircle, 
  RotateCw, 
  Building2, 
  Landmark, 
  CheckCheck, 
  Printer, 
  AlertCircle,
  ExternalLink,
  Lock,
  Stamp
} from 'lucide-react';
import { 
  fetchReleaseRequests, 
  fetchFDRs, 
  submitReleaseRequest, 
  officerReviewRelease, 
  approverActionRelease 
} from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ReleasesView({ 
  currentRole, 
  preSelectedFDR,
  onRefreshSummary 
}) {
  const [requests, setRequests] = useState([]);
  const [eligibleFDRs, setEligibleFDRs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Apply modal
  const [showApplyModal, setShowApplyModal] = useState(!!preSelectedFDR);
  const [selectedFDRId, setSelectedFDRId] = useState(preSelectedFDR?.id || '');
  const [reason, setReason] = useState('Completion of 10-Year Mandatory Retention Period');
  const [justification, setJustification] = useState('Institution has maintained continuous unblemished accreditation and completed mandatory 10-year lock-in period as per AICTE Approval Process Handbook.');
  const [beneficiaryName, setBeneficiaryName] = useState('College Corpus Fund Account');
  const [bankAccount, setBankAccount] = useState('00102030405060');
  const [ifsc, setIfsc] = useState('SBIN0000691');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Officer review modal
  const [officerModalReq, setOfficerModalReq] = useState(null);
  const [officerAction, setOfficerAction] = useState('RECOMMEND');
  const [officerComments, setOfficerComments] = useState('');
  const [isOfficerReviewing, setIsOfficerReviewing] = useState(false);

  // Approver action modal
  const [approverModalReq, setApproverModalReq] = useState(null);
  const [approverAction, setApproverAction] = useState('APPROVE');
  const [approverComments, setApproverComments] = useState('');
  const [isApproverProcessing, setIsApproverProcessing] = useState(false);

  // Official Sanction Certificate modal
  const [sanctionModalReq, setSanctionModalReq] = useState(null);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [reqList, fdrList] = await Promise.all([
        fetchReleaseRequests({ status: statusFilter }),
        fetchFDRs()
      ]);
      setRequests(reqList);
      // FDRs eligible for release: active, matured, or not currently released
      const eligible = fdrList.filter(f => f.status !== 'RELEASED' && f.status !== 'RELEASE_REQUESTED');
      setEligibleFDRs(eligible);
      if (eligible.length > 0 && !selectedFDRId) {
        setSelectedFDRId(eligible[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplySubmit(e) {
    e.preventDefault();
    if (!selectedFDRId || !bankAccount || !ifsc) return;

    setIsSubmitting(true);
    try {
      await submitReleaseRequest({
        fdr_id: parseInt(selectedFDRId),
        reason_for_release: reason,
        justification_details: justification,
        refund_beneficiary_name: beneficiaryName,
        refund_bank_account: bankAccount,
        refund_ifsc: ifsc.trim().toUpperCase(),
        noc_document_url: '/uploads/noc_institution_release.pdf'
      });
      setNotification({
        type: 'success',
        message: 'Security deposit release application submitted! Transferred to AICTE Scrutiny Cell.'
      });
      setShowApplyModal(false);
      await loadData();
      if (onRefreshSummary) onRefreshSummary();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOfficerSubmit(e) {
    e.preventDefault();
    setIsOfficerReviewing(true);
    try {
      await officerReviewRelease(
        officerModalReq.id,
        officerAction,
        officerComments || 'Verified against university records and compliance criteria. Recommended for sanction.',
        'Shri R. K. Sharma (Deputy Director, AICTE)'
      );
      setNotification({
        type: 'success',
        message: `Application ${officerModalReq.request_number} marked as ${officerAction === 'RECOMMEND' ? 'RECOMMENDED FOR APPROVAL' : 'REJECTED'}.`
      });
      setOfficerModalReq(null);
      await loadData();
      if (onRefreshSummary) onRefreshSummary();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsOfficerReviewing(false);
    }
  }

  async function handleApproverSubmit(e) {
    e.preventDefault();
    setIsApproverProcessing(true);
    try {
      const res = await approverActionRelease(
        approverModalReq.id,
        approverAction,
        approverComments || 'Financial release sanctioned. Digital authorization token affixed to order.',
        'Dr. M. S. Verma (Financial Adviser & Approver, AICTE)'
      );
      setNotification({
        type: 'success',
        message: `Final release authorized by Approver! Signature Token: ${res.signature_token}`
      });
      setApproverModalReq(null);
      await loadData();
      if (onRefreshSummary) onRefreshSummary();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsApproverProcessing(false);
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

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <ArrowUpRight className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Security Deposit Release & Refund Workflow
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Two-tier statutory clearance: Institutional application &rarr; Officer scrutiny & recommendation &rarr; Competent Authority digital sanction
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>Apply for Deposit Release / Refund</span>
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Two-Tier Workflow Progress Architecture */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Statutory Multi-Stage Approval Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Step 1 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                Institution Application
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                Initiation
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Institution files closure NOC, justification of 10-year lock-in fulfillment, and designated refund bank credentials.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                AICTE Officer Scrutiny
              </span>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded">
                Scrutiny
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Verification Officer verifies student interest protection, court clearance, university NOC, and submits formal recommendation.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                Financial Approver Sanction
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                Sanction
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Competent Authority (Member Secretary / Financial Adviser) executes final authorization with cryptographic digital signature token.
            </p>
          </div>

        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-600">Filter Pipeline:</span>
        {['ALL', 'SUBMITTED', 'RECOMMENDED_FOR_APPROVAL', 'APPROVED_BY_APPROVER', 'OFFICER_REJECTED'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === st ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            style={statusFilter === st ? { backgroundColor: '#0b1f3a', color: '#ffffff' } : {}}
          >
            {st === 'ALL' ? 'All Applications' : st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RotateCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <span>Loading release pipeline...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ArrowUpRight className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-800">No release applications found</p>
            <p className="text-xs text-slate-400 mt-1">Institutions with completed tenures can apply for security refund.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Request Ref</th>
                  <th className="py-3 px-4">FDR Number</th>
                  <th className="py-3 px-4">Release Amount</th>
                  <th className="py-3 px-4">Reason & Justification</th>
                  <th className="py-3 px-4">Refund Bank Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Ref */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {req.request_number}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* FDR Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {req.fdr_number}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatINR(req.amount)}
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800">{req.reason_for_release}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{req.justification_details}</div>
                      {req.officer_comments && (
                        <div className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mt-1">
                          Officer: {req.officer_comments}
                        </div>
                      )}
                    </td>

                    {/* Refund Bank */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-slate-800 font-semibold">{req.refund_beneficiary_name}</div>
                      <div className="text-[11px] text-slate-500">A/c: {req.refund_bank_account}</div>
                      <div className="text-[10px] text-slate-400">IFSC: {req.refund_ifsc}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={req.status} />
                      {req.approver_signature_token && (
                        <div className="text-[10px] font-mono text-teal-700 font-bold mt-0.5">
                          {req.approver_signature_token}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      
                      {/* Officer Review Button (Stage 1) */}
                      {req.status === 'SUBMITTED' && currentRole === 'AICTE_OFFICER' && (
                        <button
                          onClick={() => {
                            setOfficerModalReq(req);
                            setOfficerAction('RECOMMEND');
                            setOfficerComments('Academic compliance verified; no outstanding university queries. Recommended for sanction.');
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs"
                        >
                          Scrutinize & Recommend
                        </button>
                      )}

                      {/* Approver Action Button (Stage 2) */}
                      {req.status === 'RECOMMENDED_FOR_APPROVAL' && currentRole === 'APPROVER' && (
                        <button
                          onClick={() => {
                            setApproverModalReq(req);
                            setApproverAction('APPROVE');
                            setApproverComments('Sanction granted in compliance with Chapter 1 AICTE regulations.');
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1 inline-flex"
                        >
                          <Stamp className="w-3.5 h-3.5" />
                          <span>Sanction Release</span>
                        </button>
                      )}

                      {/* View Sanction Certificate if Approved */}
                      {req.status === 'APPROVED_BY_APPROVER' && (
                        <button
                          onClick={() => setSanctionModalReq(req)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Sanction Order</span>
                        </button>
                      )}

                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply for Release Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Apply for Deposit Release & Refund</h3>
              </div>
              <button onClick={() => setShowApplyModal(false)}>×</button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-3 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select FDR to Release *</label>
                <select
                  value={selectedFDRId}
                  onChange={e => setSelectedFDRId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  required
                >
                  {eligibleFDRs.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.fdr_number} - {f.institution_name.slice(0, 24)} (₹{formatINR(f.amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Statutory Grounds for Release *</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Completion of 10-Year Mandatory Retention Period">Completion of 10-Year Mandatory Retention Period</option>
                  <option value="Closure of Institute with AICTE NOC">Closure of Institute with AICTE NOC</option>
                  <option value="Excess Security Deposit Readjustment">Excess Security Deposit Readjustment</option>
                  <option value="Replacement with New Bank Guarantee / Collateral">Replacement with New Collateral</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Justification *</label>
                <textarea
                  rows={2}
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                <span className="font-bold text-slate-800 block">Designated Refund Bank Account</span>
                <div>
                  <label className="block text-slate-500 mb-0.5">Beneficiary Account Name</label>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={e => setBeneficiaryName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded bg-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 mb-0.5">Bank Account Number</label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={e => setBankAccount(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded font-mono bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-0.5">IFSC Code</label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={e => setIfsc(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 border rounded font-mono uppercase bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-3 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Release Application'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Officer Scrutiny Modal (Stage 1) */}
      {officerModalReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Officer Scrutiny & Recommendation</h3>
              </div>
              <button onClick={() => setOfficerModalReq(null)}>×</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border text-xs space-y-1">
              <div>Ref: <strong>{officerModalReq.request_number}</strong> | FDR: <strong className="font-mono">{officerModalReq.fdr_number}</strong></div>
              <div>Amount to Release: <strong>{formatINR(officerModalReq.amount)}</strong></div>
              <div>Reason: <strong>{officerModalReq.reason_for_release}</strong></div>
            </div>

            <form onSubmit={handleOfficerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recommendation *</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="officerAction"
                      value="RECOMMEND"
                      checked={officerAction === 'RECOMMEND'}
                      onChange={() => setOfficerAction('RECOMMEND')}
                    />
                    <span className="font-bold text-emerald-700">Recommend to Financial Approver</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="officerAction"
                      value="REJECT"
                      checked={officerAction === 'REJECT'}
                      onChange={() => setOfficerAction('REJECT')}
                    />
                    <span className="font-bold text-red-700">Reject Application</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scrutiny Findings & Comments *</label>
                <textarea
                  rows={3}
                  value={officerComments}
                  onChange={e => setOfficerComments(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOfficerModalReq(null)}
                  className="px-3 py-2 border rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOfficerReviewing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  {isOfficerReviewing ? 'Saving...' : 'Forward to Approver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approver Sanction Modal (Stage 2) */}
      {approverModalReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Financial Approver Sanction Order</h3>
              </div>
              <button onClick={() => setApproverModalReq(null)}>×</button>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs space-y-1 text-amber-900">
              <div>Application Ref: <strong>{approverModalReq.request_number}</strong></div>
              <div>Release Sanction Amount: <strong className="text-sm font-bold">{formatINR(approverModalReq.amount)}</strong></div>
              <div>Officer Recommendation: <em>"{approverModalReq.officer_comments}"</em></div>
            </div>

            <form onSubmit={handleApproverSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sanction Decision *</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="approverAction"
                      value="APPROVE"
                      checked={approverAction === 'APPROVE'}
                      onChange={() => setApproverAction('APPROVE')}
                    />
                    <span className="font-bold text-emerald-700">Grant Sanction & Release Deposit</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="approverAction"
                      value="REJECT"
                      checked={approverAction === 'REJECT'}
                      onChange={() => setApproverAction('REJECT')}
                    />
                    <span className="font-bold text-red-700">Reject Sanction</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Financial Remarks *</label>
                <textarea
                  rows={3}
                  value={approverComments}
                  onChange={e => setApproverComments(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 border rounded-lg text-[11px] text-slate-600">
                🔒 Authorizing will generate a cryptographic digital signature token and mark deposit as RELEASED.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApproverModalReq(null)}
                  className="px-3 py-2 border rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApproverProcessing}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Stamp className="w-3.5 h-3.5" />
                  <span>{isApproverProcessing ? 'Affixing Authorization...' : 'Affix Digital Sanction'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Sanction Certificate Modal */}
      {sanctionModalReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header of Sanction Order */}
            <div className="text-center border-b pb-4 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Government of India • Ministry of Education
              </div>
              <h2 className="text-lg font-bold text-slate-900 uppercase">
                All India Council for Technical Education
              </h2>
              <div className="text-xs text-slate-600">
                Finance & Approval Bureau • Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
              </div>
              <div className="pt-2 text-xs font-mono font-bold text-blue-900">
                FORMAL SANCTION ORDER: {sanctionModalReq.request_number}
              </div>
            </div>

            {/* Letter Body */}
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>To:</strong> The Branch Manager / Authorized Officer, Issuing Bank<br />
                <strong>Subject:</strong> Release and Refund of Mandatory Security Deposit under AICTE Joint Lien.
              </p>

              <p>
                Sanction of the Competent Authority, All India Council for Technical Education, is hereby conveyed for 
                the discharge of joint lien and release of Fixed Deposit Receipt:
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 font-medium">
                <div>FDR Number: <span className="font-mono font-bold text-slate-900">{sanctionModalReq.fdr_number}</span></div>
                <div>Principal Amount: <span className="font-bold text-slate-900">{formatINR(sanctionModalReq.amount)}</span></div>
                <div>Beneficiary: <span className="font-bold text-slate-900">{sanctionModalReq.refund_beneficiary_name}</span></div>
                <div>A/c Number: <span className="font-mono font-bold text-slate-900">{sanctionModalReq.refund_bank_account}</span></div>
                <div>IFSC Code: <span className="font-mono font-bold text-slate-900">{sanctionModalReq.refund_ifsc}</span></div>
                <div>Approval Ground: <span className="font-bold text-slate-900">{sanctionModalReq.reason_for_release}</span></div>
              </div>

              <p>
                The bank is instructed to remit the principal amount along with accrued interest into the institution's designated 
                account. The lien marked in favor of Member Secretary, AICTE New Delhi stands discharged.
              </p>

              {/* Digital Signature Block */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">DIGITAL AUTHORIZATION TOKEN</div>
                  <div className="font-mono font-bold text-emerald-800 text-xs">
                    {sanctionModalReq.approver_signature_token}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Timestamp: {new Date(sanctionModalReq.approver_action_at || sanctionModalReq.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900">{sanctionModalReq.approver_name}</div>
                  <div className="text-[11px] text-slate-500">Financial Adviser & Approving Authority</div>
                  <div className="text-[10px] text-slate-400">AICTE New Delhi</div>
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sanction Certificate</span>
              </button>
              <button
                onClick={() => setSanctionModalReq(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
