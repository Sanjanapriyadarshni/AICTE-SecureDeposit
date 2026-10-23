import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  ArrowUpRight, 
  ExternalLink,
  RotateCw,
  Building2,
  Calendar,
  CheckCircle2,
  X,
  Printer
} from 'lucide-react';
import { fetchFDRs, fetchFDRDetail } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function FDRListView({ 
  currentRole, 
  setCurrentView, 
  onSelectFDRForVerification,
  onInitiateRenewal,
  onInitiateRelease 
}) {
  const [fdrs, setFdrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [detailModalFDR, setDetailModalFDR] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const bankOptions = [
    'ALL',
    'State Bank of India',
    'Punjab National Bank',
    'Canara Bank',
    'Bank of Baroda',
    'Union Bank of India',
    'Indian Overseas Bank',
    'Central Bank of India',
    'HDFC Bank',
    'ICICI Bank'
  ];

  const tabs = [
    { id: 'ALL', label: 'All Deposits' },
    { id: 'ACTIVE', label: 'Active & Verified' },
    { id: 'EXPIRING_SOON', label: 'Expiring (<90d)' },
    { id: 'MATURED', label: 'Matured' },
    { id: 'PENDING_VERIFICATION', label: 'Pending Verification' },
    { id: 'DISCREPANCY_FLAGGED', label: 'Discrepancy Flagged' },
    { id: 'RENEWAL_REQUESTED', label: 'Renewal In Review' },
    { id: 'RELEASE_REQUESTED', label: 'Release In Review' },
    { id: 'RELEASED', label: 'Released / Refunded' }
  ];

  useEffect(() => {
    loadFDRs();
  }, [activeTab, selectedBank]);

  async function loadFDRs() {
    setLoading(true);
    try {
      const data = await fetchFDRs({
        status: activeTab,
        bank: selectedBank,
        search: searchTerm
      });
      setFdrs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    loadFDRs();
  }

  async function openDetailModal(fdrId) {
    setLoadingDetail(true);
    try {
      const data = await fetchFDRDetail(fdrId);
      setDetailModalFDR(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
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

  // Remaining days calculation
  const getDaysDiff = (matDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mat = new Date(matDateStr);
    mat.setHours(0, 0, 0, 0);
    const diffTime = mat - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // CSV Export
  const exportToCSV = () => {
    if (fdrs.length === 0) return;
    const headers = ['FDR Number', 'Institution', 'Bank', 'Branch', 'IFSC', 'Amount', 'Issue Date', 'Maturity Date', 'Status'];
    const rows = fdrs.map(f => [
      f.fdr_number,
      `"${f.institution_name.replace(/"/g, '""')}"`,
      f.bank_name,
      `"${f.branch_name.replace(/"/g, '""')}"`,
      f.ifsc_code,
      f.amount,
      f.issue_date,
      f.maturity_date,
      f.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AICTE_SecureDeposit_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      
      {/* Title & Controls Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Security Deposit (FDR) Repository</h2>
          <p className="text-xs text-slate-500">
            Centralized registry of technical institution collateral deposits held under AICTE joint lien
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {(currentRole === 'INSTITUTION' || currentRole === 'AICTE_OFFICER') && (
            <button
              onClick={() => setCurrentView('register')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              + Register New FDR
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 overflow-x-auto shadow-xs">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
              style={activeTab === tab.id ? { backgroundColor: '#0b1f3a', color: '#ffffff' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by FDR number, institution name, or branch..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBank}
            onChange={e => setSelectedBank(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {bankOptions.map(b => (
              <option key={b} value={b}>Bank: {b}</option>
            ))}
          </select>
          <button
            onClick={loadFDRs}
            className="p-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Refresh Table"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RotateCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <span>Fetching security deposit records...</span>
          </div>
        ) : fdrs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No FDR records match the specified filters</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or search queries</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">FDR Number</th>
                  <th className="py-3.5 px-4">Institution Name</th>
                  <th className="py-3.5 px-4">Bank & Branch</th>
                  <th className="py-3.5 px-4">Deposit Amount</th>
                  <th className="py-3.5 px-4">Maturity Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fdrs.map(fdr => {
                  const daysLeft = getDaysDiff(fdr.maturity_date);
                  return (
                    <tr key={fdr.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* FDR Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {fdr.fdr_number}
                      </td>

                      {/* Institution */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {fdr.institution_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Joint Lien: AICTE New Delhi
                        </div>
                      </td>

                      {/* Bank & Branch */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{fdr.bank_name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{fdr.branch_name}</div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatINR(fdr.amount)}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          ROI: {fdr.interest_rate}% p.a.
                        </div>
                      </td>

                      {/* Maturity Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{fdr.maturity_date}</div>
                        <div className="text-[10px]">
                          {daysLeft < 0 ? (
                            <span className="text-rose-600 font-semibold">Overdue by {Math.abs(daysLeft)}d</span>
                          ) : daysLeft <= 90 ? (
                            <span className="text-amber-600 font-semibold">{daysLeft} days remaining</span>
                          ) : (
                            <span className="text-slate-400">{daysLeft} days remaining</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={fdr.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => openDetailModal(fdr.id)}
                          className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors inline-flex items-center gap-1"
                          title="View complete record & certificate"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        {/* Verification Button for Officers / Approvers */}
                        {(fdr.status === 'PENDING_VERIFICATION' || fdr.status === 'DISCREPANCY_FLAGGED' || currentRole !== 'INSTITUTION') && (
                          <button
                            onClick={() => onSelectFDRForVerification && onSelectFDRForVerification(fdr.id)}
                            className="px-2.5 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded border border-blue-200 transition-colors inline-flex items-center gap-1"
                            title="Cross-examine against Bank CBS data"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </button>
                        )}

                        {/* Renewal Button if expiring or matured */}
                        {(fdr.status === 'EXPIRING_SOON' || fdr.status === 'MATURED') && (
                          <button
                            onClick={() => onInitiateRenewal && onInitiateRenewal(fdr)}
                            className="px-2.5 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded border border-amber-200 transition-colors inline-flex items-center gap-1"
                            title="Submit renewal certificate"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Renew</span>
                          </button>
                        )}

                        {/* Release Request Button if eligible */}
                        {(fdr.status === 'ACTIVE' || fdr.status === 'MATURED') && (
                          <button
                            onClick={() => onInitiateRelease && onInitiateRelease(fdr)}
                            className="px-2.5 py-1.5 text-xs bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold rounded border border-sky-200 transition-colors inline-flex items-center gap-1"
                            title="Apply for deposit release & refund"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Release</span>
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {fdrs.length} Fixed Deposit Receipts</span>
          <span>Security Deposits protected under Section 10(k) AICTE Act</span>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModalFDR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                    {detailModalFDR.fdr_number}
                  </span>
                  <StatusBadge status={detailModalFDR.status} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {detailModalFDR.institution_name}
                </h3>
              </div>
              <button
                onClick={() => setDetailModalFDR(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              
              {/* Financial & Deposit Particulars */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Deposit Amount</span>
                  <span className="font-bold text-slate-900 text-sm">{formatINR(detailModalFDR.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Issuing Bank</span>
                  <span className="font-semibold text-slate-800">{detailModalFDR.bank_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">IFSC Code</span>
                  <span className="font-mono font-semibold text-slate-800">{detailModalFDR.ifsc_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Issue Date</span>
                  <span className="font-medium text-slate-800">{detailModalFDR.issue_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Maturity Date</span>
                  <span className="font-medium text-slate-800">{detailModalFDR.maturity_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tenure</span>
                  <span className="font-medium text-slate-800">{detailModalFDR.tenure_months} Months</span>
                </div>
              </div>

              {/* Joint Holder & Lien Information */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5">
                <div className="font-bold text-blue-900">Mandatory AICTE Lien Clause:</div>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  Jointly held with <strong>{detailModalFDR.joint_holder}</strong>. 
                  Lien status: {detailModalFDR.lien_marked ? '✅ Formally Marked' : '❌ Not Confirmed'}.
                </p>
              </div>

              {/* Bank Verification Section */}
              {detailModalFDR.bank_verification ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-emerald-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Core Banking System Confirmation Record
                    </span>
                    <span className="text-[11px] font-mono bg-emerald-200/60 px-2 py-0.5 rounded">
                      {detailModalFDR.bank_verification.cbs_reference_no}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800">
                    <div>Verified Amount: <strong>{formatINR(detailModalFDR.bank_verification.verified_amount)}</strong></div>
                    <div>Source: <strong>{detailModalFDR.bank_verification.verification_source}</strong></div>
                    <div>CBS Lien Marked: <strong>{detailModalFDR.bank_verification.lien_confirmed ? 'Confirmed' : 'Missing'}</strong></div>
                    <div>Verification Date: <strong>{new Date(detailModalFDR.bank_verification.verified_at).toLocaleDateString()}</strong></div>
                  </div>
                  {detailModalFDR.bank_verification.bank_remarks && (
                    <div className="text-[11px] text-emerald-700 italic pt-1 border-t border-emerald-200">
                      Bank Note: "{detailModalFDR.bank_verification.bank_remarks}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 flex items-center justify-between">
                  <span>Awaiting Core Banking System verification call.</span>
                  <button
                    onClick={() => {
                      setDetailModalFDR(null);
                      onSelectFDRForVerification && onSelectFDRForVerification(detailModalFDR.id);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                  >
                    Trigger Verification Now
                  </button>
                </div>
              )}

              {/* Document Scanned Certificate */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="font-semibold text-slate-700">FDR Certificate Document</div>
                    <div className="text-[11px] text-slate-400">
                      {detailModalFDR.document_filename || 'Official FDR Scanned Copy'}
                    </div>
                  </div>
                </div>
                <a
                  href={detailModalFDR.document_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded font-semibold text-slate-700 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View File
                </a>
              </div>

              {/* OCR Disclamer */}
              <div className="text-[10px] text-slate-400 text-center italic">
                Notice: In adherence to AICTE vigilance protocols, OCR text extraction is an assistive scanning aid and does NOT prove legal authenticity.
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Certificate Record
              </button>
              <button
                onClick={() => setDetailModalFDR(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
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
