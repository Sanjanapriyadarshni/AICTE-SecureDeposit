import React, { useState, useEffect } from 'react';
import { 
  FilePlus2, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Building2, 
  Landmark, 
  Calendar, 
  ShieldCheck,
  Scan,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { createFDR, uploadFDRDocument, fetchInstitutions, fetchFDRs } from '../services/api';

export default function RegisterFDRView({ 
  currentRole, 
  onSuccess,
  onCancel 
}) {
  const [institutions, setInstitutions] = useState([]);
  const [existingFDRs, setExistingFDRs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    institution_id: 1,
    fdr_number: '',
    bank_name: 'State Bank of India',
    branch_name: '',
    ifsc_code: '',
    amount: '',
    amount_in_words: '',
    interest_rate: 7.15,
    issue_date: new Date().toISOString().split('T')[0],
    tenure_months: 60,
    maturity_date: '',
    joint_holder: 'Member Secretary, AICTE New Delhi',
    purpose: 'Mandatory Security Deposit for Technical Institution Affiliation',
    lien_marked: true,
    document_url: '',
    document_filename: ''
  });

  const [ocrAssistData, setOcrAssistData] = useState(null);

  const bankOptions = [
    'State Bank of India',
    'Punjab National Bank',
    'Canara Bank',
    'Bank of Baroda',
    'Union Bank of India',
    'Indian Overseas Bank',
    'Central Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank'
  ];

  useEffect(() => {
    loadInitData();
  }, []);

  async function loadInitData() {
    try {
      const [instList, fdrList] = await Promise.all([
        fetchInstitutions(),
        fetchFDRs()
      ]);
      setInstitutions(instList);
      setExistingFDRs(fdrList);
      if (instList.length > 0) {
        setFormData(prev => ({
          ...prev,
          institution_id: instList[0].id
        }));
      }
      calculateMaturity(formData.issue_date, formData.tenure_months);
    } catch (err) {
      console.error(err);
    }
  }

  // Calculate maturity date from issue date + tenure
  function calculateMaturity(issueDateStr, tenure) {
    if (!issueDateStr) return;
    const dt = new Date(issueDateStr);
    dt.setMonth(dt.getMonth() + parseInt(tenure || 60));
    const matStr = dt.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, maturity_date: matStr }));
  }

  // Number to Indian words converter helper
  function convertAmountToWords(num) {
    const val = parseFloat(num);
    if (!val || isNaN(val)) return '';
    if (val >= 10000000) {
      const cr = (val / 10000000).toFixed(2);
      return `Rupees ${cr} Crores Only`;
    } else if (val >= 100000) {
      const lakh = (val / 100000).toFixed(2);
      return `Rupees ${lakh} Lakhs Only`;
    }
    return `Rupees ${val.toLocaleString('en-IN')} Only`;
  }

  function handleAmountChange(e) {
    const val = e.target.value;
    const words = convertAmountToWords(val);
    setFormData(prev => ({
      ...prev,
      amount: val,
      amount_in_words: words
    }));
  }

  function handleFDRNumberChange(e) {
    const rawVal = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, fdr_number: rawVal }));

    // Check duplicate
    if (rawVal.trim().length > 3) {
      const match = existingFDRs.find(f => f.fdr_number.toUpperCase() === rawVal.trim());
      if (match) {
        setDuplicateWarning(`Warning: FDR #${rawVal} is already registered by ${match.institution_name}! Submitting will trigger an automated DUPLICATE_FDR_NUMBER discrepancy flag.`);
      } else {
        setDuplicateWarning('');
      }
    } else {
      setDuplicateWarning('');
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');
    try {
      const res = await uploadFDRDocument(file);
      setFormData(prev => ({
        ...prev,
        document_url: res.url,
        document_filename: res.filename
      }));
      setOcrAssistData(res);
    } catch (err) {
      setErrorMsg(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  function applyQuickOcrValues() {
    // Fill in demo helper values if fields are empty
    setFormData(prev => ({
      ...prev,
      fdr_number: prev.fdr_number || `FDR-${prev.bank_name.slice(0, 3).toUpperCase()}-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      branch_name: prev.branch_name || 'Connaught Place Main Branch, New Delhi',
      ifsc_code: prev.ifsc_code || 'SBIN0000691',
      amount: prev.amount || '3500000',
      amount_in_words: prev.amount_in_words || 'Rupees Thirty Five Lakh Only'
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fdr_number) {
      setErrorMsg('FDR Number is mandatory.');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrorMsg('Please enter a valid deposit amount.');
      return;
    }
    if (!formData.ifsc_code || formData.ifsc_code.length < 5) {
      setErrorMsg('Please enter a valid Bank IFSC code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        tenure_months: parseInt(formData.tenure_months),
        interest_rate: parseFloat(formData.interest_rate)
      };

      const res = await createFDR(payload);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register FDR');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <FilePlus2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Security Deposit / FDR Registration</h2>
            <p className="text-xs text-slate-500">
              Submit newly issued Fixed Deposit Receipt with joint lien in favor of Member Secretary, AICTE New Delhi
            </p>
          </div>
        </div>

        {/* AICTE Legal Integrity Notice */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-xs text-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Mandatory AICTE Approval Process Requirements:</div>
            <p className="text-[11px] leading-relaxed text-amber-700">
              Technical institutions must maintain unencumbered Fixed Deposits in Scheduled Commercial Banks. 
              The FDR certificate must clearly state: <em>"Jointly held in favor of Member Secretary, AICTE New Delhi"</em> with 
              lien marked in bank records. Bank verification will be executed via automated SFMS API gateway.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {duplicateWarning && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{duplicateWarning}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Institution & Bank Information */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            1. Institution & Bank Particulars
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Institution Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technical Institution Name *
              </label>
              <select
                value={formData.institution_id}
                onChange={e => setFormData({ ...formData, institution_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.aicte_id}) - {inst.state}
                  </option>
                ))}
              </select>
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Approved Scheduled Bank *
              </label>
              <select
                value={formData.bank_name}
                onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {bankOptions.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Branch Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issuing Branch Name & Address *
              </label>
              <input
                type="text"
                placeholder="e.g. Connaught Place Main Branch, New Delhi"
                value={formData.branch_name}
                onChange={e => setFormData({ ...formData, branch_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* IFSC Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch IFSC Code (11-Digits) *
              </label>
              <input
                type="text"
                placeholder="e.g. SBIN0000691"
                maxLength={11}
                value={formData.ifsc_code}
                onChange={e => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

          </div>
        </div>

        {/* Section 2: Deposit Particulars */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-600" />
            2. Fixed Deposit Details & Tenure
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* FDR Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                FDR Certificate Number *
              </label>
              <input
                type="text"
                placeholder="e.g. FDR-SBIN-89410294"
                value={formData.fdr_number}
                onChange={handleFDRNumberChange}
                className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Cross-verified against duplicate records</span>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deposit Principal Amount (₹) *
              </label>
              <input
                type="number"
                placeholder="e.g. 3500000"
                value={formData.amount}
                onChange={handleAmountChange}
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {formData.amount_in_words && (
                <span className="text-[11px] text-blue-700 font-medium mt-1 block">
                  {formData.amount_in_words}
                </span>
              )}
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rate of Interest (% p.a.)
              </label>
              <input
                type="number"
                step="0.05"
                value={formData.interest_rate}
                onChange={e => setFormData({ ...formData, interest_rate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue / Start Date *
              </label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={e => {
                  setFormData({ ...formData, issue_date: e.target.value });
                  calculateMaturity(e.target.value, formData.tenure_months);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Tenure Months */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tenure (Months) *
              </label>
              <select
                value={formData.tenure_months}
                onChange={e => {
                  setFormData({ ...formData, tenure_months: parseInt(e.target.value) });
                  calculateMaturity(formData.issue_date, e.target.value);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={36}>36 Months (3 Years)</option>
                <option value={60}>60 Months (5 Years - Standard Norm)</option>
                <option value={96}>96 Months (8 Years)</option>
                <option value={120}>120 Months (10 Years - Permanent Affiliation)</option>
              </select>
            </div>

            {/* Maturity Date (Auto calculated) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Calculated Maturity Date *
              </label>
              <input
                type="date"
                value={formData.maturity_date}
                onChange={e => setFormData({ ...formData, maturity_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

          </div>

          {/* Clauses & Declarations */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mandatory Joint Holder Clause
              </label>
              <input
                type="text"
                readOnly
                value={formData.joint_holder}
                className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Standard statutory clause for AICTE security deposit</span>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <input
                type="checkbox"
                id="lien_marked"
                checked={formData.lien_marked}
                onChange={e => setFormData({ ...formData, lien_marked: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="lien_marked" className="text-xs text-slate-700 font-medium cursor-pointer">
                I solemnly certify that an irrevocable lien has been officially endorsed in bank CBS records in favor of Member Secretary, AICTE New Delhi.
              </label>
            </div>
          </div>

        </div>

        {/* Section 3: Document Upload & OCR Assist */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              3. FDR Scanned Certificate Upload & Document Assist
            </h3>
            <button
              type="button"
              onClick={applyQuickOcrValues}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
            >
              <Scan className="w-3.5 h-3.5" />
              Auto-Populate Sample Values
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {formData.document_filename ? formData.document_filename : 'Upload Original Scanned FDR Certificate'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supported formats: PDF, PNG, JPG, JPEG (Max 15MB)
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs">
                <span>Browse Local Document</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {isUploading && (
                <div className="text-xs text-blue-600 flex items-center justify-center gap-2 font-medium">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Uploading & running automated document extraction...</span>
                </div>
              )}
            </div>
          </div>

          {/* CRITICAL AICTE OCR Disclaimer Notice Banner */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
            <Scan className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-blue-950 uppercase tracking-wide text-[11px]">
                Statutory AICTE OCR Integrity Notice
              </span>
              <p className="text-[11px] leading-relaxed text-blue-800">
                OCR and automated text extraction serves exclusively as a visual assistive tool for data population and preliminary checks. 
                <strong> Under no circumstances does OCR prove legal or financial authenticity.</strong> AICTE statutory clearance is 
                contingent strictly on Core Banking System / SFMS direct confirmation.
              </p>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Registering Security Deposit...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit FDR for AICTE Verification</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
