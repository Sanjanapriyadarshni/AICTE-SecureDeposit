import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  Mail, 
  RefreshCw, 
  Send, 
  FileText, 
  AlertCircle, 
  Building2,
  Calendar,
  X,
  Check
} from 'lucide-react';
import { 
  fetchExpiringFDRs, 
  fetchRenewalRequests, 
  submitRenewal, 
  reviewRenewal, 
  fetchReminders, 
  generateReminders 
} from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function RenewalsView({ 
  currentRole, 
  preSelectedFDR, 
  onRefreshSummary 
}) {
  const [expiringFDRs, setExpiringFDRs] = useState([]);
  const [renewalRequests, setRenewalRequests] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState(90);
  const [activeTab, setActiveTab] = useState('expiring'); // 'expiring', 'requests', 'notices'
  const [notification, setNotification] = useState(null);

  // Renewal submit modal
  const [renewalModalFDR, setRenewalModalFDR] = useState(preSelectedFDR || null);
  const [newFDRNumber, setNewFDRNumber] = useState('');
  const [renewedAmount, setRenewedAmount] = useState('');
  const [renewedIssueDate, setRenewedIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [renewedMaturityDate, setRenewedMaturityDate] = useState('');
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);

  // Renewal review modal (Officer)
  const [reviewModalReq, setReviewModalReq] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isProcessingReview, setIsProcessingReview] = useState(false);

  // Notice preview modal
  const [previewNotice, setPreviewNotice] = useState(null);

  useEffect(() => {
    loadData();
  }, [dayFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [expList, reqList, remList] = await Promise.all([
        fetchExpiringFDRs(dayFilter),
        fetchRenewalRequests(),
        fetchReminders()
      ]);
      setExpiringFDRs(expList);
      setRenewalRequests(reqList);
      setReminders(remList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate 5 years default renewed maturity
  function openRenewalSubmitModal(fdr) {
    setRenewalModalFDR(fdr);
    setRenewedAmount(fdr.amount);
    const issueDate = new Date();
    const matDate = new Date();
    matDate.setFullYear(issueDate.getFullYear() + 5);
    setRenewedIssueDate(issueDate.toISOString().split('T')[0]);
    setRenewedMaturityDate(matDate.toISOString().split('T')[0]);
    setNewFDRNumber(`FDR-${fdr.bank_name.slice(0, 3).toUpperCase()}-2026-${Math.floor(100000 + Math.random() * 900000)}`);
  }

  async function handleRenewalSubmit(e) {
    e.preventDefault();
    if (!newFDRNumber.trim() || !renewedAmount) return;

    setIsSubmittingRenewal(true);
    try {
      await submitRenewal({
        fdr_id: renewalModalFDR.id,
        new_fdr_number: newFDRNumber.trim().toUpperCase(),
        renewed_amount: parseFloat(renewedAmount),
        renewed_issue_date: renewedIssueDate,
        renewed_maturity_date: renewedMaturityDate,
        renewal_document_url: '/uploads/renewal_fdr_receipt.pdf'
      });
      setNotification({
        type: 'success',
        message: `Renewal application submitted successfully for ${renewalModalFDR.fdr_number}!`
      });
      setRenewalModalFDR(null);
      await loadData();
      if (onRefreshSummary) onRefreshSummary();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsSubmittingRenewal(false);
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setIsProcessingReview(true);
    try {
      await reviewRenewal(
        reviewModalReq.id,
        reviewAction,
        reviewRemarks || 'Scrutinized and verified against renewal receipts.',
        'Shri R. K. Sharma (Deputy Director, AICTE)'
      );
      setNotification({
        type: 'success',
        message: `Renewal application ${reviewModalReq.request_number} marked as ${reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED'}.`
      });
      setReviewModalReq(null);
      await loadData();
      if (onRefreshSummary) onRefreshSummary();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsProcessingReview(false);
    }
  }

  async function handleGenerateReminders() {
    setLoading(true);
    try {
      const res = await generateReminders();
      setNotification({
        type: 'success',
        message: res.message || 'Maturity notices dispatched.'
      });
      await loadData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
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

  const getDaysDiff = (matDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mat = new Date(matDateStr);
    mat.setHours(0, 0, 0, 0);
    const diffTime = mat - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Maturity Reminders & Renewal Tracking
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated statutory alerts, 30/60/90-day expiry schedules, and institutional renewal applications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRole !== 'INSTITUTION' && (
            <button
              onClick={handleGenerateReminders}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Statutory Notices</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('expiring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'expiring' ? 'bg-[#0b1f3a] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Expiring & Matured Deposits ({expiringFDRs.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'requests' ? 'bg-[#0b1f3a] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Renewal Applications Queue ({renewalRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'notices' ? 'bg-[#0b1f3a] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Dispatched Notices & Advisories ({reminders.length})
          </button>
        </div>

        {activeTab === 'expiring' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Horizon:</span>
            <select
              value={dayFilter}
              onChange={e => setDayFilter(parseInt(e.target.value))}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value={30}>Next 30 Days & Matured</option>
              <option value={60}>Next 60 Days & Matured</option>
              <option value={90}>Next 90 Days & Matured</option>
              <option value={365}>Entire Next 12 Months</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Expiring & Matured Deposits */}
      {activeTab === 'expiring' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RotateCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Checking maturity schedules...</span>
            </div>
          ) : expiringFDRs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800">No deposits expiring in this horizon</p>
              <p className="text-xs text-slate-400 mt-1">All registered technical institution FDRs remain active.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">FDR Number</th>
                    <th className="py-3 px-4">Institution Name</th>
                    <th className="py-3 px-4">Bank & Branch</th>
                    <th className="py-3 px-4">Amount (₹)</th>
                    <th className="py-3 px-4">Maturity Date</th>
                    <th className="py-3 px-4">Status & Countdown</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiringFDRs.map(fdr => {
                    const daysLeft = getDaysDiff(fdr.maturity_date);
                    return (
                      <tr key={fdr.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-900">{fdr.fdr_number}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-xs line-clamp-1">{fdr.institution_name}</td>
                        <td className="py-3.5 px-4">{fdr.bank_name}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{formatINR(fdr.amount)}</td>
                        <td className="py-3.5 px-4 font-medium">{fdr.maturity_date}</td>
                        <td className="py-3.5 px-4">
                          {daysLeft < 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              Matured ({Math.abs(daysLeft)}d ago)
                            </span>
                          ) : daysLeft <= 30 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              Urgent: {daysLeft}d left
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              {daysLeft} days remaining
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openRenewalSubmitModal(fdr)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Submit Renewal</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Renewal Applications Queue */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {renewalRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-800">No active renewal applications</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Application Ref</th>
                    <th className="py-3 px-4">Old FDR #</th>
                    <th className="py-3 px-4">Renewed FDR #</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">New Maturity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Scrutiny Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {renewalRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-900">{req.request_number}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{req.old_fdr_number}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">{req.new_fdr_number}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{formatINR(req.renewed_amount)}</td>
                      <td className="py-3.5 px-4">{req.renewed_maturity_date}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {req.status === 'PENDING_OFFICER_REVIEW' && currentRole !== 'INSTITUTION' ? (
                          <button
                            onClick={() => {
                              setReviewModalReq(req);
                              setReviewAction('APPROVE');
                              setReviewRemarks('Renewal verified with bank issuance receipt. AICTE lien intact.');
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs"
                          >
                            Review & Decide
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {req.officer_remarks || 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Dispatched Statutory Notices */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {reminders.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-800">No statutory notices dispatched yet</p>
              <button
                onClick={handleGenerateReminders}
                className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold"
              >
                Generate Notices Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Notice Type</th>
                    <th className="py-3 px-4">Target FDR #</th>
                    <th className="py-3 px-4">Institution Name</th>
                    <th className="py-3 px-4">Recipient Email</th>
                    <th className="py-3 px-4">Dispatched At</th>
                    <th className="py-3 px-4 text-right">View Letter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reminders.map(rem => (
                    <tr key={rem.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {rem.reminder_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-900">{rem.fdr_number}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{rem.institution_name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{rem.recipient_email}</td>
                      <td className="py-3.5 px-4">{new Date(rem.sent_date).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setPreviewNotice(rem)}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold"
                        >
                          View Notice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Renewal Submit Modal */}
      {renewalModalFDR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Submit FDR Renewal Certificate</h3>
              </div>
              <button onClick={() => setRenewalModalFDR(null)}>×</button>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900">
              Target FDR: <strong>{renewalModalFDR.fdr_number}</strong> ({renewalModalFDR.institution_name})
            </div>

            <form onSubmit={handleRenewalSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New FDR Number *</label>
                <input
                  type="text"
                  value={newFDRNumber}
                  onChange={e => setNewFDRNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Renewed Principal Amount (₹) *</label>
                <input
                  type="number"
                  value={renewedAmount}
                  onChange={e => setRenewedAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Renewal Start Date</label>
                  <input
                    type="date"
                    value={renewedIssueDate}
                    onChange={e => setRenewedIssueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Maturity Date *</label>
                  <input
                    type="date"
                    value={renewedMaturityDate}
                    onChange={e => setRenewedMaturityDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                Notice: AICTE joint lien endorsement must be maintained in bank records for the extended tenure.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewalModalFDR(null)}
                  className="px-3 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRenewal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  {isSubmittingRenewal ? 'Submitting Renewal...' : 'Submit Renewal Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renewal Scrutiny / Review Modal (Officer) */}
      {reviewModalReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Review Renewal Application</h3>
              <button onClick={() => setReviewModalReq(null)}>×</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border text-xs space-y-1">
              <div>Ref: <strong>{reviewModalReq.request_number}</strong></div>
              <div>Replacing Old FDR: <strong className="font-mono">{reviewModalReq.old_fdr_number}</strong> with <strong className="font-mono text-emerald-800">{reviewModalReq.new_fdr_number}</strong></div>
              <div>Renewed Amount: <strong>{formatINR(reviewModalReq.renewed_amount)}</strong></div>
              <div>Extended Maturity: <strong>{reviewModalReq.renewed_maturity_date}</strong></div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Decision *</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      value="APPROVE"
                      checked={reviewAction === 'APPROVE'}
                      onChange={() => setReviewAction('APPROVE')}
                    />
                    <span className="font-bold text-emerald-700">Approve & Update FDR</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      value="REJECT"
                      checked={reviewAction === 'REJECT'}
                      onChange={() => setReviewAction('REJECT')}
                    />
                    <span className="font-bold text-red-700">Reject Application</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scrutiny Remarks *</label>
                <textarea
                  rows={3}
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalReq(null)}
                  className="px-3 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingReview}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  {isProcessingReview ? 'Saving...' : 'Affix Scrutiny Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice Preview Modal */}
      {previewNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Official AICTE Statutory Notice</h3>
              </div>
              <button onClick={() => setPreviewNotice(null)}>×</button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono whitespace-pre-wrap text-slate-800 leading-relaxed max-h-96 overflow-y-auto">
              {previewNotice.content}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Dispatched to {previewNotice.recipient_email}
              </span>
              <button
                onClick={() => setPreviewNotice(null)}
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
