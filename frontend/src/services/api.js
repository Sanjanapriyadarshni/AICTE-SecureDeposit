import {
  INITIAL_INSTITUTIONS,
  INITIAL_FDRS,
  INITIAL_BANK_VERIFICATIONS,
  INITIAL_RENEWALS,
  INITIAL_RELEASES,
  INITIAL_REMINDERS,
  INITIAL_AUDIT_LOGS
} from './mockData';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

// --- LocalStorage Store Management ---
const STORAGE_KEYS = {
  INSTITUTIONS: 'aicte_institutions',
  FDRS: 'aicte_fdrs',
  BANK_VERIFICATIONS: 'aicte_bank_verifications',
  RENEWALS: 'aicte_renewals',
  RELEASES: 'aicte_releases',
  REMINDERS: 'aicte_reminders',
  AUDIT_LOGS: 'aicte_audit_logs',
  MODE: 'aicte_data_mode'
};

let isApiOnline = true;
const listeners = new Set();

export function getDataSourceStatus() {
  return {
    isLive: isApiOnline,
    mode: isApiOnline ? 'API' : 'LOCAL_STORAGE'
  };
}

export function subscribeDataSourceStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setOnlineState(online) {
  if (isApiOnline !== online) {
    isApiOnline = online;
    listeners.forEach(fn => fn(getDataSourceStatus()));
  }
}

export function initLocalStorage(forceReset = false) {
  if (typeof window === 'undefined') return;

  if (forceReset || !localStorage.getItem(STORAGE_KEYS.INSTITUTIONS)) {
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(INITIAL_INSTITUTIONS));
  }
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.FDRS)) {
    localStorage.setItem(STORAGE_KEYS.FDRS, JSON.stringify(INITIAL_FDRS));
  }
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.BANK_VERIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.BANK_VERIFICATIONS, JSON.stringify(INITIAL_BANK_VERIFICATIONS));
  }
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.RENEWALS)) {
    localStorage.setItem(STORAGE_KEYS.RENEWALS, JSON.stringify(INITIAL_RENEWALS));
  }
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.RELEASES)) {
    localStorage.setItem(STORAGE_KEYS.RELEASES, JSON.stringify(INITIAL_RELEASES));
  }
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.REMINDERS)) {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(INITIAL_REMINDERS));
  }
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  }
}

// Ensure local storage is initialized on script evaluation
initLocalStorage(false);

function getLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocal(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

function appendLocalAudit(action, entityType, entityId, fdrNumber, actorRole, actorName, details) {
  const logs = getLocal(STORAGE_KEYS.AUDIT_LOGS) || [];
  const nextId = logs.length > 0 ? Math.max(...logs.map(l => l.id || 0)) + 1 : 1;
  const newLog = {
    id: nextId,
    entity_type: entityType,
    entity_id: entityId,
    fdr_number: fdrNumber,
    action: action,
    actor_role: actorRole,
    actor_name: actorName,
    details: details,
    ip_address: "10.14.2.14",
    timestamp: new Date().toISOString()
  };
  logs.unshift(newLog);
  setLocal(STORAGE_KEYS.AUDIT_LOGS, logs);
  return newLog;
}

// Compute Summary from LocalStorage
export function computeLocalSummary() {
  const fdrs = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
  const auditLogs = getLocal(STORAGE_KEYS.AUDIT_LOGS) || INITIAL_AUDIT_LOGS;

  const total_fdrs = fdrs.length;
  const total_amount = fdrs.reduce((acc, f) => acc + (parseFloat(f.amount) || 0), 0);
  const total_amount_crores = Math.round((total_amount / 10000000) * 100) / 100;

  const active_count = fdrs.filter(f => f.status === 'ACTIVE').length;
  const expiring_count = fdrs.filter(f => f.status === 'EXPIRING_SOON').length;
  const matured_count = fdrs.filter(f => f.status === 'MATURED').length;
  const pending_count = fdrs.filter(f => f.status === 'PENDING_VERIFICATION').length;
  const discrepancy_count = fdrs.filter(f => f.status === 'DISCREPANCY_FLAGGED').length;
  const renewal_requested_count = fdrs.filter(f => f.status === 'RENEWAL_REQUESTED').length;
  const release_requested_count = fdrs.filter(f => f.status === 'RELEASE_REQUESTED').length;
  const released_count = fdrs.filter(f => f.status === 'RELEASED').length;

  // Bank distribution
  const bankMap = {};
  fdrs.forEach(f => {
    const b = f.bank_name || 'Other Bank';
    if (!bankMap[b]) bankMap[b] = { count: 0, amount: 0 };
    bankMap[b].count += 1;
    bankMap[b].amount += (parseFloat(f.amount) || 0);
  });
  const bank_distribution = Object.entries(bankMap).map(([bank, data]) => ({
    bank,
    count: data.count,
    amount: data.amount
  })).sort((a, b) => b.amount - a.amount);

  // Status distribution
  const status_distribution = [
    { name: "Active", value: active_count, color: "#10b981" },
    { name: "Expiring Soon", value: expiring_count, color: "#f59e0b" },
    { name: "Matured", value: matured_count, color: "#ef4444" },
    { name: "Pending Verification", value: pending_count, color: "#3b82f6" },
    { name: "Discrepancy Flagged", value: discrepancy_count, color: "#dc2626" },
    { name: "Renewal Requested", value: renewal_requested_count, color: "#8b5cf6" },
    { name: "Release Requested", value: release_requested_count, color: "#0ea5e9" },
    { name: "Released / Refunded", value: released_count, color: "#64748b" }
  ];

  // Monthly maturities forecast (next 6 months)
  const monthly_maturities = [
    { month: "Oct 2026", count: 0, amount: 0.0 },
    { month: "Nov 2026", count: 1, amount: 0.35 },
    { month: "Dec 2026", count: 1, amount: 0.40 },
    { month: "Jan 2027", count: 0, amount: 0.0 },
    { month: "Feb 2027", count: 0, amount: 0.0 },
    { month: "Mar 2027", count: 0, amount: 0.0 }
  ];

  return {
    total_fdrs,
    total_amount,
    total_amount_crores,
    active_count,
    expiring_count,
    matured_count,
    pending_count,
    discrepancy_count,
    renewal_requested_count,
    release_requested_count,
    released_count,
    bank_distribution,
    status_distribution,
    monthly_maturities,
    recent_activities: auditLogs.slice(0, 6)
  };
}

export function getInitialSummary() {
  return computeLocalSummary();
}

let currentActiveRole = 'AICTE_OFFICER';

export function setActiveRole(role) {
  currentActiveRole = role;
}

export function getActiveRole() {
  return currentActiveRole;
}

const AUTH_TOKEN_KEY = 'aicte_auth_token';
const AUTH_USER_KEY = 'aicte_auth_user';

export const DEMO_CREDENTIALS = [
  {
    role: 'INSTITUTION',
    roleLabel: 'Technical Institution',
    email: 'institution@demo.aicte.local',
    password: 'Institution@2026',
    name: 'Prof. Alok Kumar Singhal',
    designation: 'Registrar & Authorized Signatory',
    institution_id: 1,
    institutionName: 'Delhi Institute of Technology & Management',
    desc: 'Submit FDRs, manage compliance documents, track institution FDR deposits & apply for release'
  },
  {
    role: 'AICTE_OFFICER',
    roleLabel: 'AICTE Scrutiny Officer',
    email: 'officer@demo.aicte.local',
    password: 'Officer@2026',
    name: 'Shri R. K. Sharma',
    designation: 'Deputy Director - Scrutiny & Verification Cell',
    institution_id: null,
    institutionName: 'AICTE HQ, New Delhi',
    desc: 'Perform technical document verification, bank data matching, flag discrepancies & submit scrutiny reports'
  },
  {
    role: 'APPROVER',
    roleLabel: 'Financial Approver',
    email: 'approver@demo.aicte.local',
    password: 'Approver@2026',
    name: 'Dr. M. S. Verma',
    designation: 'Financial Adviser & Approving Authority',
    institution_id: null,
    institutionName: 'Member Secretary Bureau, AICTE',
    desc: 'Competent Authority for final financial sanction, digital signature authorization & treasury release'
  }
];

export function getStoredAuth() {
  if (typeof window === 'undefined') return { token: null, user: null };
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function setStoredAuth(token, user) {
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);

    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      if (user.role) setActiveRole(user.role);
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (err) {
    console.warn('Auth storage error:', err);
  }
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (err) {
    console.warn('Auth clear error:', err);
  }
}

export async function loginUser(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // Try real backend API first
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass })
    });
    if (res.ok) {
      const data = await res.json();
      setStoredAuth(data.token, data.user);
      setOnlineState(true);
      return data;
    } else {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Invalid email or password');
    }
  } catch (apiErr) {
    // If API returned 401 or known error detail, propagate it
    if (apiErr.message && !apiErr.message.includes('Failed to fetch') && !apiErr.message.includes('NetworkError')) {
      throw apiErr;
    }

    // Fallback: Verify against demo credentials in local storage mode
    const demo = DEMO_CREDENTIALS.find(d => d.email.toLowerCase() === cleanEmail && d.password === cleanPass);
    if (demo) {
      const mockToken = `local_demo_token_${demo.role.toLowerCase()}_${Date.now()}`;
      const mockUser = {
        id: demo.role === 'INSTITUTION' ? 1 : (demo.role === 'AICTE_OFFICER' ? 2 : 3),
        email: demo.email,
        name: demo.name,
        role: demo.role,
        institution_id: demo.institution_id,
        designation: demo.designation
      };
      setStoredAuth(mockToken, mockUser);
      appendLocalAudit(
        "LOGIN_SUCCESS",
        "SYSTEM",
        mockUser.id,
        null,
        mockUser.role,
        mockUser.name,
        `User ${mockUser.email} logged in via local fallback authentication.`
      );
      return { token: mockToken, user: mockUser };
    }
    throw new Error('Invalid email or password. Please use the documented demo credentials.');
  }
}

export async function logoutUser() {
  const { token, user } = getStoredAuth();
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Role': user?.role || currentActiveRole
        }
      });
    } catch {}
  }
  clearStoredAuth();
}

// Wrapper for resilient fetch with fallback
async function fetchWithFallback(url, options = {}, fallbackFn = null) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const { token, user } = getStoredAuth();
    const headers = {
      ...(options.headers || {}),
      'X-User-Role': user?.role || currentActiveRole
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      setOnlineState(true);
      return await res.json();
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    setOnlineState(false);
    if (fallbackFn) {
      return fallbackFn();
    }
    throw err;
  }
}

// --- API Methods with Dual Mode (Backend + LocalStorage) ---

export async function fetchSummary() {
  return fetchWithFallback(`${API_BASE}/analytics/summary`, {}, () => {
    return computeLocalSummary();
  });
}

export function computeLocalInstitutionDashboard(institutionId = 1) {
  const fdrs = (getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS).filter(f => String(f.institution_id) === String(institutionId));
  const insts = getLocal(STORAGE_KEYS.INSTITUTIONS) || INITIAL_INSTITUTIONS;
  const inst = insts.find(i => String(i.id) === String(institutionId)) || insts[0];
  const releases = (getLocal(STORAGE_KEYS.RELEASES) || INITIAL_RELEASES).filter(r => String(r.institution_id) === String(institutionId));

  const total_fdrs = fdrs.length;
  const total_amount = fdrs.reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const active_count = fdrs.filter(f => f.status === 'ACTIVE').length;
  const expiring_soon_count = fdrs.filter(f => f.status === 'EXPIRING_SOON' || f.status === 'MATURED').length;
  const pending_count = fdrs.filter(f => ['PENDING_VERIFICATION', 'DISCREPANCY_FLAGGED', 'CORRECTION_REQUESTED'].includes(f.status)).length;

  const today = new Date();

  const recent_submissions = fdrs.slice(0, 8).map(f => {
    const mat = new Date(f.maturity_date);
    const diff = Math.ceil((mat - today) / (1000 * 60 * 60 * 24));
    let nextAction = "In Custody (Compliant)";
    if (f.status === 'CORRECTION_REQUESTED') nextAction = "Upload Clarified Documents";
    else if (f.status === 'DISCREPANCY_FLAGGED') nextAction = "Review Discrepancy Flag";
    else if (['EXPIRING_SOON', 'MATURED'].includes(f.status)) nextAction = "Submit Renewal Application";
    else if (f.status === 'ACTIVE' && diff <= 0) nextAction = "Apply for Release / NOC";
    else if (f.status === 'PENDING_VERIFICATION') nextAction = "Awaiting AICTE Verification";

    return {
      id: f.id,
      fdr_number: f.fdr_number,
      bank_name: f.bank_name,
      branch_name: f.branch_name,
      amount: f.amount,
      issue_date: f.issue_date,
      maturity_date: f.maturity_date,
      status: f.status,
      submitted_at: f.created_at ? f.created_at.substring(0, 10) : '2026-10-20',
      document_url: f.document_url,
      document_filename: f.document_filename,
      required_action: nextAction
    };
  });

  const attention_docs = fdrs.filter(f => f.status === 'CORRECTION_REQUESTED' || !f.document_url || f.status === 'DISCREPANCY_FLAGGED').map(f => ({
    id: f.id,
    fdr_number: f.fdr_number,
    bank_name: f.bank_name,
    amount: f.amount,
    status: f.status,
    issue_type: f.status === 'CORRECTION_REQUESTED' ? 'CORRECTION_REQUESTED' : (!f.document_url ? 'MISSING_DOCUMENT' : 'DISCREPANCY_ALERT'),
    officer_note: f.verification_notes || "Document verification pending scrutiny correction.",
    document_filename: f.document_filename || "Missing Scan",
    document_url: f.document_url
  }));

  const renewals = getLocal(STORAGE_KEYS.RENEWALS) || INITIAL_RENEWALS;
  const upcoming_maturities = fdrs.filter(f => f.status !== 'RELEASED').map(f => {
    const mat = new Date(f.maturity_date);
    const diffDays = Math.ceil((mat - today) / (1000 * 60 * 60 * 24));
    const hasRen = renewals.find(r => String(r.fdr_id) === String(f.id) && ['PENDING_OFFICER_REVIEW', 'APPROVED'].includes(r.status));
    return {
      id: f.id,
      fdr_number: f.fdr_number,
      bank_name: f.bank_name,
      amount: f.amount,
      maturity_date: f.maturity_date,
      days_remaining: diffDays,
      is_overdue: diffDays < 0,
      renewal_status: hasRen ? (hasRen.status === 'APPROVED' ? 'RENEWED' : 'IN_REVIEW') : 'NOT_STARTED'
    };
  }).filter(m => m.days_remaining <= 180).sort((a, b) => a.days_remaining - b.days_remaining);

  const my_releases = releases.map(r => ({
    id: r.id,
    request_number: r.request_number,
    fdr_number: r.fdr_number,
    amount: r.amount,
    reason: r.reason_for_release,
    status: r.status,
    created_at: r.created_at ? r.created_at.substring(0, 10) : '2026-10-21',
    latest_update: r.approver_comments || r.officer_comments || "Application submitted, queued for scrutiny.",
    signature_token: r.approver_signature_token
  }));

  return {
    institution_id: inst ? inst.id : 1,
    institution_name: inst ? inst.name : "Delhi Institute of Technology & Management",
    aicte_id: inst ? inst.aicte_id : "AICTE-1-10294819",
    summary: {
      my_total_fdrs: total_fdrs,
      my_total_amount: total_amount,
      my_total_crores: Math.round((total_amount / 10000000) * 100) / 100,
      active_fdrs: active_count,
      expiring_soon: expiring_soon_count,
      pending_verification: pending_count
    },
    recent_submissions,
    attention_documents: attention_docs,
    upcoming_maturities,
    my_releases
  };
}

export function computeLocalOfficerDashboard() {
  const fdrs = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
  const auditLogs = getLocal(STORAGE_KEYS.AUDIT_LOGS) || INITIAL_AUDIT_LOGS;

  const pending_fdrs = fdrs.filter(f => f.status === 'PENDING_VERIFICATION');
  const discrepancy_fdrs = fdrs.filter(f => f.status === 'DISCREPANCY_FLAGGED');
  const awaiting_correction_fdrs = fdrs.filter(f => f.status === 'CORRECTION_REQUESTED');
  const verified_fdrs = fdrs.filter(f => f.status === 'ACTIVE');

  const queue_fdrs = fdrs.filter(f => ['PENDING_VERIFICATION', 'DISCREPANCY_FLAGGED', 'CORRECTION_REQUESTED'].includes(f.status));
  const now = new Date();

  const work_queue = queue_fdrs.map(f => {
    const created = f.created_at ? new Date(f.created_at) : new Date();
    const caseAge = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
    const discs = f.discrepancies ? f.discrepancies.filter(d => !d.resolved).length : (f.discrepancy_count || 0);

    return {
      id: f.id,
      institution_id: f.institution_id,
      institution_name: f.institution_name,
      fdr_number: f.fdr_number,
      bank_name: f.bank_name,
      branch_name: f.branch_name,
      amount: f.amount,
      submission_date: f.created_at ? f.created_at.substring(0, 10) : '2026-10-22',
      status: f.status,
      discrepancy_count: discs,
      case_age_days: caseAge,
      case_age_label: caseAge > 0 ? `${caseAge}d ago` : 'Today',
      document_url: f.document_url,
      document_filename: f.document_filename,
      verification_notes: f.verification_notes
    };
  });

  const priority_cases = [];
  queue_fdrs.forEach(f => {
    const reasons = [];
    if (!f.document_url) reasons.push("Missing Scanned Receipt");
    if (f.status === 'DISCREPANCY_FLAGGED') reasons.push("Vigilance Discrepancy");
    const created = f.created_at ? new Date(f.created_at) : new Date();
    const caseAge = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
    if (caseAge >= 7) reasons.push(`Wait Time (${caseAge}d)`);

    if (reasons.length > 0) {
      priority_cases.push({
        id: f.id,
        fdr_number: f.fdr_number,
        institution_name: f.institution_name,
        bank_name: f.bank_name,
        amount: f.amount,
        status: f.status,
        priority_reasons: reasons,
        case_age_days: caseAge
      });
    }
  });

  const recent_activity = auditLogs.filter(l => ['OFFICER_VERIFICATION_APPROVED', 'DISCREPANCY_FLAGGED', 'DISCREPANCY_RESOLVED', 'BANK_VERIFICATION_CONFIRMED', 'INSTITUTION_CORRECTION_REQUESTED', 'RELEASE_OFFICER_RECOMMENDED', 'RENEWAL_APPROVED'].includes(l.action)).slice(0, 8).map(a => ({
    id: a.id,
    fdr_number: a.fdr_number,
    action: a.action,
    actor_name: a.actor_name,
    details: a.details,
    timestamp: a.timestamp ? a.timestamp.substring(0, 16).replace('T', ' ') : '2026-10-24 12:00'
  }));

  return {
    summary: {
      pending_verification: pending_fdrs.length,
      discrepancies_flagged: discrepancy_fdrs.length,
      awaiting_correction: awaiting_correction_fdrs.length,
      verified_this_period: verified_fdrs.length,
      avg_wait_days: 1.5
    },
    work_queue,
    priority_cases: priority_cases.slice(0, 6),
    recent_activity
  };
}

export function computeLocalApproverDashboard() {
  const releases = getLocal(STORAGE_KEYS.RELEASES) || INITIAL_RELEASES;
  const fdrs = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
  const insts = getLocal(STORAGE_KEYS.INSTITUTIONS) || INITIAL_INSTITUTIONS;

  const awaiting_releases = releases.filter(r => r.status === 'RECOMMENDED_FOR_APPROVAL');
  const awaiting_count = awaiting_releases.length;
  const total_val_awaiting = awaiting_releases.reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);

  const approved_releases = releases.filter(r => r.status === 'APPROVED_BY_APPROVER');
  const approved_count = approved_releases.length;
  const total_approved_amount = approved_releases.reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);

  let verified_ready_count = 0;
  awaiting_releases.forEach(r => {
    const fdr = fdrs.find(f => String(f.id) === String(r.fdr_id));
    if (fdr && fdr.status !== 'DISCREPANCY_FLAGGED') verified_ready_count++;
  });

  const all_pending = releases.filter(r => ['RECOMMENDED_FOR_APPROVAL', 'SUBMITTED', 'UNDER_REVIEW'].includes(r.status));
  const approval_queue = all_pending.map(r => {
    const fdr = fdrs.find(f => String(f.id) === String(r.fdr_id));
    const inst = insts.find(i => String(i.id) === String(r.institution_id));
    const hasDisc = fdr && (fdr.status === 'DISCREPANCY_FLAGGED' || (fdr.discrepancies && fdr.discrepancies.some(d => !d.resolved)));

    const officerRec = r.status === 'RECOMMENDED_FOR_APPROVAL' ? 'RECOMMENDED' : 'AWAITING_OFFICER_SCRUTINY';
    const academicClearance = r.noc_document_url ? 'CLEAR' : 'PENDING_NOC';
    const vigilanceClearance = !hasDisc ? 'CLEAR' : 'DISCREPANCY_BLOCKED';

    return {
      id: r.id,
      request_number: r.request_number,
      fdr_id: r.fdr_id,
      fdr_number: r.fdr_number,
      institution_name: inst ? inst.name : (fdr ? fdr.institution_name : "Technical College"),
      amount: r.amount,
      reason: r.reason_for_release,
      justification_details: r.justification_details,
      officer_recommendation: officerRec,
      officer_comments: r.officer_comments,
      officer_name: r.officer_name,
      officer_reviewed_at: r.officer_reviewed_at ? r.officer_reviewed_at.substring(0, 16).replace('T', ' ') : null,
      verification_status: fdr && fdr.status in ['ACTIVE', 'RELEASE_REQUESTED'] && !hasDisc ? 'CBS_CONFIRMED' : 'UNCONFIRMED',
      clearance_status: {
        officer_scrutiny: officerRec,
        university_noc: academicClearance,
        vigilance: vigilanceClearance,
        is_eligible_for_approval: (officerRec === 'RECOMMENDED' && !hasDisc)
      },
      beneficiary_details: {
        name: r.refund_beneficiary_name,
        account: r.refund_bank_account,
        ifsc: r.refund_ifsc
      },
      status: r.status,
      request_date: r.created_at ? r.created_at.substring(0, 10) : '2026-10-21',
      noc_document_url: r.noc_document_url
    };
  });

  const recent_decisions = releases.filter(r => ['APPROVED_BY_APPROVER', 'APPROVER_REJECTED', 'RETURNED_FOR_CLARIFICATION'].includes(r.status)).slice(0, 8).map(r => ({
    id: r.id,
    request_number: r.request_number,
    fdr_number: r.fdr_number,
    amount: r.amount,
    decision: r.status === 'APPROVED_BY_APPROVER' ? 'APPROVED' : (r.status === 'RETURNED_FOR_CLARIFICATION' ? 'RETURNED' : 'REJECTED'),
    status: r.status,
    decision_reason: r.approver_comments,
    approver_name: r.approver_name,
    signature_token: r.approver_signature_token,
    decision_date: r.approver_action_at ? r.approver_action_at.substring(0, 16).replace('T', ' ') : 'Recently'
  }));

  const pending_clarifications = releases.filter(r => r.status === 'RETURNED_FOR_CLARIFICATION').map(r => ({
    id: r.id,
    request_number: r.request_number,
    fdr_number: r.fdr_number,
    amount: r.amount,
    return_reason: r.approver_comments,
    approver_name: r.approver_name,
    returned_at: r.approver_action_at ? r.approver_action_at.substring(0, 16).replace('T', ' ') : 'Recently',
    required_resolution: `Address approver observation: ${r.approver_comments}`
  }));

  return {
    summary: {
      awaiting_decision_count: awaiting_count,
      total_value_awaiting: total_val_awaiting,
      total_value_awaiting_lakhs: Math.round((total_val_awaiting / 100000) * 100) / 100,
      total_value_awaiting_crores: Math.round((total_val_awaiting / 10000000) * 100) / 100,
      verified_ready_count,
      recently_approved_count: approved_count,
      recently_approved_amount: total_approved_amount
    },
    approval_queue,
    recent_decisions,
    pending_clarifications
  };
}

export async function fetchInstitutionDashboard(institutionId = 1) {
  return fetchWithFallback(`${API_BASE}/analytics/institution/${institutionId}`, {}, () => {
    return computeLocalInstitutionDashboard(institutionId);
  });
}

export async function fetchOfficerDashboard() {
  return fetchWithFallback(`${API_BASE}/analytics/officer`, {}, () => {
    return computeLocalOfficerDashboard();
  });
}

export async function fetchApproverDashboard() {
  return fetchWithFallback(`${API_BASE}/analytics/approver`, {}, () => {
    return computeLocalApproverDashboard();
  });
}

export async function fetchInstitutions() {
  return fetchWithFallback(`${API_BASE}/institutions`, {}, () => {
    return getLocal(STORAGE_KEYS.INSTITUTIONS) || INITIAL_INSTITUTIONS;
  });
}

export async function fetchFDRs(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.bank && params.bank !== 'ALL') query.append('bank', params.bank);
  if (params.institution_id) query.append('institution_id', params.institution_id);
  if (params.search) query.append('search', params.search);

  return fetchWithFallback(`${API_BASE}/fdrs?${query.toString()}`, {}, () => {
    let list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    if (params.status && params.status !== 'ALL') {
      list = list.filter(f => f.status === params.status);
    }
    if (params.bank && params.bank !== 'ALL') {
      list = list.filter(f => f.bank_name === params.bank);
    }
    if (params.institution_id) {
      list = list.filter(f => String(f.institution_id) === String(params.institution_id));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(f => 
        (f.fdr_number && f.fdr_number.toLowerCase().includes(q)) ||
        (f.institution_name && f.institution_name.toLowerCase().includes(q)) ||
        (f.bank_name && f.bank_name.toLowerCase().includes(q)) ||
        (f.branch_name && f.branch_name.toLowerCase().includes(q))
      );
    }
    return list;
  });
}

export async function fetchFDRDetail(fdrId) {
  return fetchWithFallback(`${API_BASE}/fdrs/${fdrId}`, {}, () => {
    const list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const fdr = list.find(f => String(f.id) === String(fdrId));
    if (!fdr) throw new Error('FDR record not found in local store');
    return fdr;
  });
}

export async function createFDR(fdrData) {
  // Always update local storage first or as fallback
  const performLocalCreate = () => {
    const list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const instList = getLocal(STORAGE_KEYS.INSTITUTIONS) || INITIAL_INSTITUTIONS;
    const inst = instList.find(i => String(i.id) === String(fdrData.institution_id)) || instList[0];

    const hasDuplicate = list.some(f => f.fdr_number.toUpperCase() === fdrData.fdr_number.trim().toUpperCase());
    const initialStatus = hasDuplicate ? 'DISCREPANCY_FLAGGED' : 'PENDING_VERIFICATION';

    const nextId = list.length > 0 ? Math.max(...list.map(f => f.id || 0)) + 1 : 1;
    const newFdr = {
      id: nextId,
      institution_id: inst.id,
      institution_name: inst.name,
      fdr_number: fdrData.fdr_number.trim().toUpperCase(),
      bank_name: fdrData.bank_name,
      branch_name: fdrData.branch_name,
      ifsc_code: fdrData.ifsc_code.trim().toUpperCase(),
      amount: parseFloat(fdrData.amount) || 0,
      amount_in_words: fdrData.amount_in_words || `Rupees ${parseFloat(fdrData.amount).toLocaleString('en-IN')} Only`,
      interest_rate: parseFloat(fdrData.interest_rate) || 7.1,
      issue_date: fdrData.issue_date,
      maturity_date: fdrData.maturity_date,
      tenure_months: parseInt(fdrData.tenure_months) || 60,
      joint_holder: fdrData.joint_holder || "Member Secretary, AICTE New Delhi",
      purpose: fdrData.purpose || "Mandatory Security Deposit",
      lien_marked: Boolean(fdrData.lien_marked),
      document_url: fdrData.document_url || "/uploads/fdr_sample_general.pdf",
      document_filename: fdrData.document_filename || "fdr_certificate.pdf",
      status: initialStatus,
      discrepancy_count: hasDuplicate ? 1 : 0,
      verification_notes: hasDuplicate ? "Duplicate FDR Number detected in database." : "Awaiting Bank SFMS / CBS Verification Call.",
      ocr_extracted_text: "[OCR Assist] Document registered. Automated preliminary text extraction completed. In compliance with AICTE guidelines, OCR does NOT prove legal authenticity.",
      ocr_confidence_score: 95.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      discrepancies: hasDuplicate ? [{
        id: Date.now(),
        fdr_id: nextId,
        discrepancy_type: "DUPLICATE_FDR_NUMBER",
        severity: "CRITICAL",
        field_name: "fdr_number",
        submitted_value: fdrData.fdr_number.toUpperCase(),
        bank_confirmed_value: "Already registered in system",
        description: `Duplicate FDR Number detected! FDR #${fdrData.fdr_number.toUpperCase()} is already associated with an existing institution.`,
        resolved: false,
        resolution_notes: null,
        resolved_by: null,
        detected_at: new Date().toISOString(),
        resolved_at: null
      }] : []
    };

    list.unshift(newFdr);
    setLocal(STORAGE_KEYS.FDRS, list);

    appendLocalAudit(
      "FDR_REGISTERED",
      "FDR",
      newFdr.id,
      newFdr.fdr_number,
      "INSTITUTION",
      inst.authorized_signatory || "Institution Registrar",
      `New FDR ${newFdr.fdr_number} for ₹${newFdr.amount.toLocaleString('en-IN')} submitted by ${inst.name}. Status: ${initialStatus}.`
    );

    return newFdr;
  };

  try {
    const res = await fetch(`${API_BASE}/fdrs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fdrData)
    });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      const list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
      const filtered = list.filter(f => f.fdr_number !== data.fdr_number);
      filtered.unshift(data);
      setLocal(STORAGE_KEYS.FDRS, filtered);
      return data;
    }
  } catch {
    setOnlineState(false);
  }
  return performLocalCreate();
}

export async function uploadFDRDocument(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/fdrs/upload`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      setOnlineState(true);
      return await res.json();
    }
  } catch {
    setOnlineState(false);
  }

  // Fallback simulated document upload with OCR assist disclaimer
  const safeFilename = `fdr_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  return {
    filename: safeFilename,
    url: `/uploads/${safeFilename}`,
    ocr_disclaimer: "OCR and automated document extraction is an assistive tool for preliminary visual cross-referencing only. Never claim or consider OCR as legal proof of authenticity. Final authenticity is established exclusively through direct Core Banking System / SFMS confirmation.",
    extracted_snippet: `CERTIFICATE OF FIXED DEPOSIT RECEIPT | AICTE Joint Lien Deposit | Verified format`,
    ocr_confidence: 96.5
  };
}

export async function updateFDRStatus(fdrId, status, notes = '', actorRole = 'AICTE_OFFICER', actorName = 'AICTE Officer') {
  const performLocalUpdate = () => {
    const list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const fdr = list.find(f => String(f.id) === String(fdrId));
    if (fdr) {
      fdr.status = status;
      if (notes) fdr.verification_notes = notes;
      fdr.updated_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.FDRS, list);

      appendLocalAudit(
        `STATUS_UPDATED_TO_${status}`,
        "FDR",
        fdr.id,
        fdr.fdr_number,
        actorRole,
        actorName,
        `FDR status updated to ${status}. Notes: ${notes || 'No remarks entered'}.`
      );
    }
    return fdr;
  };

  try {
    const query = new URLSearchParams({ status, notes, actor_role: actorRole, actor_name: actorName });
    const res = await fetch(`${API_BASE}/fdrs/${fdrId}/status?${query.toString()}`, { method: 'PATCH' });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalUpdate();
      return data;
    }
  } catch {
    setOnlineState(false);
  }
  return performLocalUpdate();
}

export function getInitialVerificationComparison(fdrId = 7) {
  const list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
  const fdr = (list && list.length > 0)
    ? (list.find(f => String(f.id) === String(fdrId)) || list[0])
    : INITIAL_FDRS[0];
  if (!fdr) return null;
  const bankVerifs = getLocal(STORAGE_KEYS.BANK_VERIFICATIONS) || INITIAL_BANK_VERIFICATIONS;
  const bankVerif = bankVerifs[fdr?.id] || bankVerifs[String(fdr?.id)] || null;

  return {
    fdr_id: fdr.id,
    fdr_number: fdr.fdr_number,
    status: fdr.status,
    institution_data: {
      institution_name: fdr.institution_name,
      fdr_number: fdr.fdr_number,
      bank_name: fdr.bank_name,
      branch_name: fdr.branch_name,
      ifsc_code: fdr.ifsc_code,
      amount: fdr.amount,
      amount_in_words: fdr.amount_in_words,
      interest_rate: fdr.interest_rate,
      issue_date: fdr.issue_date,
      maturity_date: fdr.maturity_date,
      tenure_months: fdr.tenure_months,
      joint_holder: fdr.joint_holder,
      lien_marked: fdr.lien_marked,
      purpose: fdr.purpose,
      document_url: fdr.document_url,
      document_filename: fdr.document_filename,
      submitted_at: fdr.created_at
    },
    bank_confirmed_data: {
      is_verified: bankVerif !== null,
      verification_source: bankVerif ? bankVerif.verification_source : "Simulated Bank API Gateway / SFMS (Awaiting Call)",
      cbs_reference_no: bankVerif?.cbs_reference_no || null,
      fdr_number: bankVerif?.fdr_number || null,
      bank_name: bankVerif?.bank_name || null,
      branch_name: bankVerif?.branch_name || null,
      branch_manager_name: bankVerif?.branch_manager_name || null,
      verified_amount: bankVerif?.verified_amount ?? null,
      verified_interest_rate: bankVerif?.verified_interest_rate ?? null,
      verified_issue_date: bankVerif?.verified_issue_date || null,
      verified_maturity_date: bankVerif?.verified_maturity_date || null,
      lien_confirmed: bankVerif?.lien_confirmed ?? null,
      joint_clause_confirmed: bankVerif?.joint_clause_confirmed ?? null,
      verification_status: bankVerif?.verification_status || "UNVERIFIED",
      bank_remarks: bankVerif?.bank_remarks || null,
      verified_at: bankVerif?.verified_at || null
    },
    discrepancies: (fdr.discrepancies || []).map(d => ({
      id: d.id,
      type: d.discrepancy_type || d.type,
      severity: d.severity,
      field: d.field_name || d.field,
      submitted_value: d.submitted_value,
      bank_confirmed_value: d.bank_confirmed_value,
      description: d.description,
      resolved: d.resolved,
      resolution_notes: d.resolution_notes,
      resolved_by: d.resolved_by,
      detected_at: d.detected_at,
      resolved_at: d.resolved_at
    })),
    ocr_info: {
      extracted_text: fdr?.ocr_extracted_text || "AICTE FDR DOCUMENT OCR SCAN SAMPLE",
      confidence: fdr?.ocr_confidence_score || 0.94,
      disclaimer: "CRITICAL AICTE NOTICE: OCR text extraction is an assistive scanning tool for data population and preliminary visual checks. In strict accordance with AICTE vigilance standards, OCR does NOT prove legal or financial authenticity. Authenticity is exclusively verified against Core Banking System / SFMS records."
    }
  };
}

export async function fetchVerificationComparison(fdrId) {
  return fetchWithFallback(`${API_BASE}/verification/compare/${fdrId}`, {}, () => {
    return getInitialVerificationComparison(fdrId);
  });
}

export async function triggerBankVerification(fdrId, scenario = 'EXACT_MATCH', actorName = 'AICTE Verification Cell') {
  const performLocalVerification = () => {
    const list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const fdr = list.find(f => String(f.id) === String(fdrId));
    if (!fdr) throw new Error('FDR not found');

    const bankVerifs = getLocal(STORAGE_KEYS.BANK_VERIFICATIONS) || INITIAL_BANK_VERIFICATIONS;
    const cbsRef = `CBS-SFMS-SIM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    let verifStatus = "CONFIRMED";
    let verifAmount = fdr.amount;
    let lienConfirmed = true;
    let jointConfirmed = true;
    let remarks = "Simulated Bank CBS confirmed: Deposit active and lien registered to Member Secretary, AICTE.";
    const detectedDiscs = [];

    if (scenario === 'AMOUNT_MISMATCH') {
      verifStatus = "MISMATCH_DETECTED";
      verifAmount = fdr.amount * 0.85; // 15% shortfall
      remarks = `Simulated CBS Alert: Principal ledger shows ₹${verifAmount.toLocaleString('en-IN')}, shortfall against ₹${fdr.amount.toLocaleString('en-IN')}.`;
      detectedDiscs.push({
        id: Date.now() + 1,
        fdr_id: fdr.id,
        discrepancy_type: "AMOUNT_MISMATCH",
        severity: "CRITICAL",
        field_name: "amount",
        submitted_value: `₹${fdr.amount.toLocaleString('en-IN')}`,
        bank_confirmed_value: `₹${verifAmount.toLocaleString('en-IN')}`,
        description: `Deposit Amount Mismatch! Institution submitted ₹${fdr.amount.toLocaleString('en-IN')}, but Core Banking System confirms only ₹${verifAmount.toLocaleString('en-IN')}.`,
        resolved: false,
        resolution_notes: null,
        resolved_by: null,
        detected_at: new Date().toISOString()
      });
    } else if (scenario === 'MISSING_LIEN') {
      verifStatus = "MISMATCH_DETECTED";
      lienConfirmed = false;
      remarks = "Simulated CBS Alert: No lien in favor of Member Secretary, AICTE found in account parameters.";
      detectedDiscs.push({
        id: Date.now() + 2,
        fdr_id: fdr.id,
        discrepancy_type: "MISSING_LIEN_CONFIRMATION",
        severity: "CRITICAL",
        field_name: "lien_marked",
        submitted_value: "Claimed: Yes",
        bank_confirmed_value: "CBS Ledger: No Lien",
        description: "Lien not marked in favor of AICTE in bank records. AICTE norms mandate irrevocable lien in favor of Member Secretary, AICTE.",
        resolved: false,
        resolution_notes: null,
        resolved_by: null,
        detected_at: new Date().toISOString()
      });
    }

    bankVerifs[fdr.id] = {
      id: Date.now(),
      fdr_id: fdr.id,
      fdr_number: fdr.fdr_number,
      bank_name: fdr.bank_name,
      branch_name: fdr.branch_name,
      branch_manager_name: `Branch Manager, ${fdr.branch_name}`,
      verified_amount: verifAmount,
      verified_issue_date: fdr.issue_date,
      verified_maturity_date: fdr.maturity_date,
      verified_interest_rate: fdr.interest_rate,
      lien_confirmed: lienConfirmed,
      joint_clause_confirmed: jointConfirmed,
      cbs_reference_no: cbsRef,
      verification_source: "Simulated Bank API Gateway / SFMS",
      verification_status: verifStatus,
      bank_remarks: remarks,
      verified_at: new Date().toISOString()
    };
    setLocal(STORAGE_KEYS.BANK_VERIFICATIONS, bankVerifs);

    if (detectedDiscs.length > 0) {
      fdr.status = "DISCREPANCY_FLAGGED";
      fdr.discrepancies = detectedDiscs;
      fdr.discrepancy_count = detectedDiscs.length;
    } else {
      fdr.status = "ACTIVE";
      fdr.discrepancies = [];
      fdr.discrepancy_count = 0;
    }
    fdr.updated_at = new Date().toISOString();
    setLocal(STORAGE_KEYS.FDRS, list);

    appendLocalAudit(
      detectedDiscs.length > 0 ? "DISCREPANCY_FLAGGED" : "BANK_VERIFICATION_CONFIRMED",
      "VERIFICATION",
      fdr.id,
      fdr.fdr_number,
      "AICTE_OFFICER",
      actorName,
      `Simulated Bank CBS verification executed (Scenario: ${scenario}). CBS Ref: ${cbsRef}. Discrepancies: ${detectedDiscs.length}.`
    );

    return {
      fdr_id: fdr.id,
      fdr_number: fdr.fdr_number,
      cbs_reference_no: cbsRef,
      verification_status: verifStatus,
      discrepancies_detected: detectedDiscs.length,
      fdr_status: fdr.status,
      message: detectedDiscs.length === 0 ? "CBS verified with zero discrepancies. Status marked ACTIVE." : "Discrepancy detected and flagged for officer scrutiny."
    };
  };

  try {
    const query = new URLSearchParams({ simulate_scenario: scenario, actor_name: actorName });
    const res = await fetch(`${API_BASE}/verification/trigger-bank-verification/${fdrId}?${query.toString()}`, { 
      method: 'POST',
      headers: { 'X-User-Role': currentActiveRole }
    });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalVerification();
      return data;
    } else {
      const err = await res.json().catch(() => ({}));
      if (res.status === 403) throw new Error(err.detail || 'Access Denied: Only AICTE Verification Officers can trigger bank verification.');
    }
  } catch (err) {
    if (err.message && err.message.includes('Access Denied')) throw err;
    setOnlineState(false);
  }
  return performLocalVerification();
}

export async function resolveDiscrepancy(discrepancyId, resolutionNotes, resolvedBy = 'AICTE Officer') {
  const performLocalResolve = () => {
    const list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    let foundDisc = null;
    let targetFdr = null;

    list.forEach(f => {
      if (f.discrepancies) {
        const d = f.discrepancies.find(item => String(item.id) === String(discrepancyId));
        if (d) {
          foundDisc = d;
          targetFdr = f;
          d.resolved = true;
          d.resolution_notes = resolutionNotes;
          d.resolved_by = resolvedBy;
          d.resolved_at = new Date().toISOString();
        }
      }
    });

    if (targetFdr) {
      const remaining = targetFdr.discrepancies.filter(d => !d.resolved);
      targetFdr.discrepancy_count = remaining.length;
      if (remaining.length === 0) {
        targetFdr.status = 'ACTIVE';
        targetFdr.verification_notes = `All discrepancies resolved by ${resolvedBy}: ${resolutionNotes}`;
      }
      targetFdr.updated_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.FDRS, list);

      appendLocalAudit(
        "DISCREPANCY_RESOLVED",
        "DISCREPANCY",
        discrepancyId,
        targetFdr.fdr_number,
        "AICTE_OFFICER",
        resolvedBy,
        `Discrepancy resolved: "${resolutionNotes}". Remaining active discrepancies: ${remaining.length}.`
      );
    }

    return {
      success: true,
      discrepancy_id: discrepancyId,
      remaining_unresolved: targetFdr ? targetFdr.discrepancy_count : 0
    };
  };

  try {
    const res = await fetch(`${API_BASE}/verification/resolve-discrepancy/${discrepancyId}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Role': currentActiveRole 
      },
      body: JSON.stringify({ resolution_notes: resolutionNotes, resolved_by: resolvedBy })
    });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalResolve();
      return data;
    } else {
      const err = await res.json().catch(() => ({}));
      if (res.status === 403) throw new Error(err.detail || 'Access Denied: Only AICTE Verification Officers can resolve discrepancies.');
    }
  } catch (err) {
    if (err.message && err.message.includes('Access Denied')) throw err;
    setOnlineState(false);
  }
  return performLocalResolve();
}

export async function officerApproveVerification(fdrId, officerName, notes) {
  const performLocalApprove = () => {
    const list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const fdr = list.find(f => String(f.id) === String(fdrId));
    if (fdr) {
      fdr.status = 'ACTIVE';
      fdr.verification_notes = notes || 'Verified and approved by AICTE Officer.';
      fdr.updated_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.FDRS, list);

      appendLocalAudit(
        "OFFICER_VERIFICATION_APPROVED",
        "VERIFICATION",
        fdr.id,
        fdr.fdr_number,
        "AICTE_OFFICER",
        officerName || "AICTE Officer",
        `FDR verified against Core Banking System. Status promoted to ACTIVE. Officer notes: ${notes}.`
      );
    }
    return { success: true, fdr_id: fdrId, status: "ACTIVE" };
  };

  try {
    const res = await fetch(`${API_BASE}/verification/officer-approve/${fdrId}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Role': currentActiveRole
      },
      body: JSON.stringify({ officer_name: officerName, verification_notes: notes })
    });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalApprove();
      return data;
    } else {
      const err = await res.json().catch(() => ({}));
      if (res.status === 403) throw new Error(err.detail || 'Access Denied: Only AICTE Verification Officers can approve verification.');
    }
  } catch (err) {
    if (err.message && err.message.includes('Access Denied')) throw err;
    setOnlineState(false);
  }
  return performLocalApprove();
}

export async function fetchExpiringFDRs(days = 90) {
  return fetchWithFallback(`${API_BASE}/renewals/expiring?days=${days}`, {}, () => {
    const list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() + parseInt(days));

    return list.filter(f => {
      if (f.status === 'RELEASED') return false;
      const mat = new Date(f.maturity_date);
      return mat <= cutoff;
    }).map(f => {
      const mat = new Date(f.maturity_date);
      const diffDays = Math.ceil((mat - now) / (1000 * 60 * 60 * 24));
      return {
        ...f,
        days_to_maturity: diffDays,
        is_overdue: diffDays < 0,
        urgency: diffDays < 0 ? 'CRITICAL_OVERDUE' : diffDays <= 30 ? 'EXPIRING_30_DAYS' : 'EXPIRING_90_DAYS'
      };
    }).sort((a, b) => a.days_to_maturity - b.days_to_maturity);
  });
}

export async function fetchRenewalRequests() {
  return fetchWithFallback(`${API_BASE}/renewals/requests`, {}, () => {
    return getLocal(STORAGE_KEYS.RENEWALS) || INITIAL_RENEWALS;
  });
}

export async function submitRenewal(renewalData) {
  const performLocalSubmit = () => {
    const renewals = getLocal(STORAGE_KEYS.RENEWALS) || INITIAL_RENEWALS;
    const fdrs = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const fdr = fdrs.find(f => String(f.id) === String(renewalData.fdr_id));

    const nextId = renewals.length > 0 ? Math.max(...renewals.map(r => r.id || 0)) + 1 : 1;
    const reqNum = `RNW-AICTE-2026-${String(nextId).padStart(4, '0')}`;

    const newReq = {
      id: nextId,
      fdr_id: parseInt(renewalData.fdr_id),
      institution_id: fdr ? fdr.institution_id : 1,
      request_number: reqNum,
      old_fdr_number: fdr ? fdr.fdr_number : "OLD-FDR",
      new_fdr_number: renewalData.new_fdr_number.toUpperCase(),
      renewed_amount: parseFloat(renewalData.renewed_amount) || (fdr ? fdr.amount : 0),
      renewed_issue_date: renewalData.renewed_issue_date,
      renewed_maturity_date: renewalData.renewed_maturity_date,
      renewal_document_url: renewalData.renewal_document_url || "/uploads/fdr_renewal_receipt.pdf",
      status: "PENDING_OFFICER_REVIEW",
      officer_remarks: null,
      requested_at: new Date().toISOString(),
      processed_at: null
    };

    renewals.unshift(newReq);
    setLocal(STORAGE_KEYS.RENEWALS, renewals);

    if (fdr) {
      fdr.status = "RENEWAL_REQUESTED";
      fdr.updated_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.FDRS, fdrs);
    }

    appendLocalAudit(
      "RENEWAL_SUBMITTED",
      "RENEWAL",
      newReq.id,
      newReq.new_fdr_number,
      "INSTITUTION",
      fdr ? fdr.institution_name : "Institution",
      `Renewal application ${reqNum} submitted. Replacement FDR #${newReq.new_fdr_number} for ₹${newReq.renewed_amount.toLocaleString('en-IN')}.`
    );

    return newReq;
  };

  try {
    const res = await fetch(`${API_BASE}/renewals/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renewalData)
    });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalSubmit();
      return data;
    }
  } catch {
    setOnlineState(false);
  }
  return performLocalSubmit();
}

export async function reviewRenewal(renewalId, action, remarks, officerName = 'AICTE Officer') {
  const performLocalReview = () => {
    const renewals = getLocal(STORAGE_KEYS.RENEWALS) || INITIAL_RENEWALS;
    const fdrs = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const req = renewals.find(r => String(r.id) === String(renewalId));

    if (req) {
      req.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      req.officer_remarks = remarks;
      req.processed_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.RENEWALS, renewals);

      const fdr = fdrs.find(f => String(f.id) === String(req.fdr_id));
      if (fdr) {
        if (action === 'APPROVE') {
          fdr.fdr_number = req.new_fdr_number;
          fdr.issue_date = req.renewed_issue_date;
          fdr.maturity_date = req.renewed_maturity_date;
          fdr.amount = req.renewed_amount;
          fdr.status = 'ACTIVE';
          fdr.verification_notes = `Renewal approved by ${officerName}. New maturity: ${req.renewed_maturity_date}`;
        } else {
          fdr.status = 'EXPIRING_SOON';
          fdr.verification_notes = `Renewal application rejected: ${remarks}`;
        }
        fdr.updated_at = new Date().toISOString();
        setLocal(STORAGE_KEYS.FDRS, fdrs);
      }

      appendLocalAudit(
        action === 'APPROVE' ? "RENEWAL_APPROVED" : "RENEWAL_REJECTED",
        "RENEWAL",
        req.id,
        req.new_fdr_number,
        "AICTE_OFFICER",
        officerName,
        `Renewal request ${req.request_number} ${action === 'APPROVE' ? 'approved' : 'rejected'} by ${officerName}. Remarks: ${remarks}.`
      );
    }
    return req;
  };

  try {
    const query = new URLSearchParams({ officer_name: officerName });
    const res = await fetch(`${API_BASE}/renewals/review/${renewalId}?${query.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, officer_remarks: remarks })
    });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalReview();
      return data;
    }
  } catch {
    setOnlineState(false);
  }
  return performLocalReview();
}

export async function fetchReminders() {
  return fetchWithFallback(`${API_BASE}/renewals/reminders`, {}, () => {
    return getLocal(STORAGE_KEYS.REMINDERS) || INITIAL_REMINDERS;
  });
}

export async function generateReminders() {
  const performLocalGenerate = () => {
    const reminders = getLocal(STORAGE_KEYS.REMINDERS) || INITIAL_REMINDERS;
    const fdrs = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const now = new Date();

    let createdCount = 0;
    fdrs.forEach(f => {
      if (f.status === 'RELEASED') return;
      const mat = new Date(f.maturity_date);
      const diff = Math.ceil((mat - now) / (1000 * 60 * 60 * 24));

      if (diff <= 90) {
        const nextId = reminders.length > 0 ? Math.max(...reminders.map(r => r.id || 0)) + 1 : 1;
        const reminderType = diff < 0 ? "OVERDUE_ALERT" : diff <= 30 ? "30_DAYS_NOTICE" : "60_DAYS_NOTICE";
        reminders.unshift({
          id: nextId,
          fdr_id: f.id,
          fdr_number: f.fdr_number,
          institution_name: f.institution_name,
          reminder_type: reminderType,
          scheduled_date: new Date().toISOString().split('T')[0],
          days_to_maturity: diff,
          sent_date: new Date().toISOString(),
          recipient_email: "registrar@institution.ac.in",
          status: "SENT",
          subject: `Automated Statutory Notice: AICTE FDR Renewal Due - #${f.fdr_number}`,
          content: `Notice issued to ${f.institution_name} regarding FDR #${f.fdr_number} maturing in ${diff} days.`
        });
        createdCount++;
      }
    });

    setLocal(STORAGE_KEYS.REMINDERS, reminders);

    appendLocalAudit(
      "REMINDERS_BATCH_DISPATCHED",
      "REMINDER",
      0,
      "BATCH",
      "SYSTEM",
      "AICTE Automated Notice Dispatcher",
      `Automated batch executed. Generated and dispatched ${createdCount} statutory maturity notices.`
    );

    return { generated_count: createdCount, message: `Successfully generated ${createdCount} renewal reminders.` };
  };

  try {
    const res = await fetch(`${API_BASE}/renewals/generate-reminders`, { method: 'POST' });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalGenerate();
      return data;
    }
  } catch {
    setOnlineState(false);
  }
  return performLocalGenerate();
}

export async function fetchReleaseRequests(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.institution_id) query.append('institution_id', params.institution_id);

  return fetchWithFallback(`${API_BASE}/releases?${query.toString()}`, {}, () => {
    let list = getLocal(STORAGE_KEYS.RELEASES) || INITIAL_RELEASES;
    if (params.status && params.status !== 'ALL') {
      list = list.filter(r => r.status === params.status);
    }
    if (params.institution_id) {
      list = list.filter(r => String(r.institution_id) === String(params.institution_id));
    }
    return list;
  });
}

export async function submitReleaseRequest(releaseData) {
  const performLocalSubmit = () => {
    const releases = getLocal(STORAGE_KEYS.RELEASES) || INITIAL_RELEASES;
    const fdrs = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const fdr = fdrs.find(f => String(f.id) === String(releaseData.fdr_id));

    const nextId = releases.length > 0 ? Math.max(...releases.map(r => r.id || 0)) + 1 : 1;
    const reqNum = `REL-AICTE-2026-${String(nextId).padStart(4, '0')}`;

    const newRel = {
      id: nextId,
      fdr_id: parseInt(releaseData.fdr_id),
      institution_id: fdr ? fdr.institution_id : 1,
      request_number: reqNum,
      fdr_number: fdr ? fdr.fdr_number : "FDR-RELEASE",
      amount: fdr ? fdr.amount : 3500000.0,
      reason_for_release: releaseData.reason_for_release || "Completion of 10-Year Mandatory Retention Period",
      justification_details: releaseData.justification_details || "Mandatory tenure completed with all compliances.",
      refund_beneficiary_name: releaseData.refund_beneficiary_name,
      refund_bank_account: releaseData.refund_bank_account,
      refund_ifsc: releaseData.refund_ifsc.toUpperCase(),
      noc_document_url: releaseData.noc_document_url || "/uploads/aicte_noc_sample.pdf",
      status: "SUBMITTED",
      officer_comments: null,
      officer_name: null,
      officer_reviewed_at: null,
      approver_comments: null,
      approver_name: null,
      approver_signature_token: null,
      approver_action_at: null,
      created_at: new Date().toISOString()
    };

    releases.unshift(newRel);
    setLocal(STORAGE_KEYS.RELEASES, releases);

    if (fdr) {
      fdr.status = "RELEASE_REQUESTED";
      fdr.updated_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.FDRS, fdrs);
    }

    appendLocalAudit(
      "RELEASE_REQUESTED",
      "RELEASE",
      newRel.id,
      newRel.fdr_number,
      "INSTITUTION",
      fdr ? fdr.institution_name : "Institution",
      `Security Deposit Release Application ${reqNum} submitted for FDR #${newRel.fdr_number} (₹${newRel.amount.toLocaleString('en-IN')}).`
    );

    return newRel;
  };

  try {
    const res = await fetch(`${API_BASE}/releases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(releaseData)
    });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalSubmit();
      return data;
    }
  } catch {
    setOnlineState(false);
  }
  return performLocalSubmit();
}

export async function officerReviewRelease(requestId, action, comments, officerName) {
  const performLocalReview = () => {
    const releases = getLocal(STORAGE_KEYS.RELEASES) || INITIAL_RELEASES;
    const req = releases.find(r => String(r.id) === String(requestId));

    if (req) {
      req.status = action === 'RECOMMEND' ? 'RECOMMENDED_FOR_APPROVAL' : 'REJECTED_BY_OFFICER';
      req.officer_comments = comments;
      req.officer_name = officerName;
      req.officer_reviewed_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.RELEASES, releases);

      appendLocalAudit(
        action === 'RECOMMEND' ? "RELEASE_OFFICER_RECOMMENDED" : "RELEASE_OFFICER_REJECTED",
        "RELEASE",
        req.id,
        req.fdr_number,
        "AICTE_OFFICER",
        officerName,
        `Release Request ${req.request_number} ${action === 'RECOMMEND' ? 'recommended for Competent Authority approval' : 'rejected'} by AICTE Officer. Remarks: ${comments}.`
      );
    }
    return req;
  };

  try {
    const res = await fetch(`${API_BASE}/releases/${requestId}/officer-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comments, officer_name: officerName })
    });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalReview();
      return data;
    }
  } catch {
    setOnlineState(false);
  }
  return performLocalReview();
}

export async function requestInstitutionCorrection(fdrId, officerName, correctionNote) {
  const performLocalCorrection = () => {
    const list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const fdr = list.find(f => String(f.id) === String(fdrId));
    if (fdr) {
      fdr.status = 'CORRECTION_REQUESTED';
      fdr.verification_notes = correctionNote;
      fdr.updated_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.FDRS, list);

      appendLocalAudit(
        "INSTITUTION_CORRECTION_REQUESTED",
        "FDR",
        fdr.id,
        fdr.fdr_number,
        "AICTE_OFFICER",
        officerName || "AICTE Officer",
        `Correction requested by officer: ${correctionNote}`
      );
    }
    return { success: true, fdr_id: fdrId, status: "CORRECTION_REQUESTED" };
  };

  try {
    const res = await fetch(`${API_BASE}/verification/request-correction/${fdrId}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Role': currentActiveRole
      },
      body: JSON.stringify({ officer_name: officerName, correction_note: correctionNote })
    });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalCorrection();
      return data;
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
  } catch (err) {
    if (err.message && err.message.includes('Access Denied')) throw err;
    setOnlineState(false);
  }
  return performLocalCorrection();
}

export async function resubmitFDRCorrection(fdrId, payload) {
  const performLocalResubmit = () => {
    const list = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const fdr = list.find(f => String(f.id) === String(fdrId));
    if (fdr) {
      if (payload.document_url) fdr.document_url = payload.document_url;
      if (payload.document_filename) fdr.document_filename = payload.document_filename;
      fdr.status = 'PENDING_VERIFICATION';
      fdr.verification_notes = `Correction re-submitted: ${payload.institution_remarks || 'Document updated'}`;
      fdr.updated_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.FDRS, list);

      appendLocalAudit(
        "FDR_CORRECTION_RESUBMITTED",
        "FDR",
        fdr.id,
        fdr.fdr_number,
        "INSTITUTION",
        fdr.institution_name,
        `Institution re-submitted corrected document: ${payload.institution_remarks || 'Updated'}`
      );
    }
    return { success: true, fdr_id: fdrId, status: "PENDING_VERIFICATION" };
  };

  try {
    const res = await fetch(`${API_BASE}/fdrs/${fdrId}/resubmit-correction`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Role': currentActiveRole
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalResubmit();
      return data;
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
  } catch (err) {
    if (err.message && err.message.includes('Access Denied')) throw err;
    setOnlineState(false);
  }
  return performLocalResubmit();
}

export async function approverActionRelease(requestId, action, comments, approverName) {
  const performLocalApproverAction = () => {
    const releases = getLocal(STORAGE_KEYS.RELEASES) || INITIAL_RELEASES;
    const fdrs = getLocal(STORAGE_KEYS.FDRS) || INITIAL_FDRS;
    const req = releases.find(r => String(r.id) === String(requestId));

    if (req) {
      const isApproved = action === 'APPROVE';
      const isReturn = action === 'RETURN' || action === 'RETURN_FOR_CLARIFICATION';
      const sigToken = isApproved ? `DIGI-SIGN-AICTE-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : null;

      let newStatus = 'APPROVED_BY_APPROVER';
      if (isReturn) newStatus = 'RETURNED_FOR_CLARIFICATION';
      else if (!isApproved) newStatus = 'APPROVER_REJECTED';

      req.status = newStatus;
      req.approver_comments = comments;
      req.approver_name = approverName;
      req.approver_signature_token = sigToken;
      req.approver_action_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.RELEASES, releases);

      const fdr = fdrs.find(f => String(f.id) === String(req.fdr_id));
      if (fdr) {
        if (isApproved) {
          fdr.status = 'RELEASED';
          fdr.verification_notes = `Release and financial refund authorized by Competent Authority (${approverName}). Sanction token: ${sigToken}.`;
        } else {
          fdr.status = 'ACTIVE';
          fdr.verification_notes = `Release application ${isReturn ? 'returned for clarification' : 'rejected'}: ${comments}`;
        }
        fdr.updated_at = new Date().toISOString();
        setLocal(STORAGE_KEYS.FDRS, fdrs);
      }

      appendLocalAudit(
        isApproved ? "RELEASE_SANCTIONED_BY_APPROVER" : (isReturn ? "RELEASE_RETURNED_FOR_CLARIFICATION" : "RELEASE_REJECTED_BY_APPROVER"),
        "RELEASE",
        req.id,
        req.fdr_number,
        "FINANCIAL_APPROVER",
        approverName,
        `Release Request ${req.request_number} ${isApproved ? 'SANCTIONED and authorized' : (isReturn ? 'RETURNED for clarification' : 'REJECTED')} by Competent Authority. Token: ${sigToken || 'NONE'}. Remarks: ${comments}.`
      );
    }
    return req;
  };

  try {
    const res = await fetch(`${API_BASE}/releases/${requestId}/approver-action`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Role': currentActiveRole
      },
      body: JSON.stringify({ action, comments, approver_name: approverName })
    });
    if (res.ok) {
      setOnlineState(true);
      const data = await res.json();
      performLocalApproverAction();
      return data;
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server returned ${res.status}`);
    }
  } catch (err) {
    if (err.message && (err.message.includes('Access Denied') || err.message.includes('Approval Denied') || err.message.includes('mandatory'))) {
      throw err;
    }
    setOnlineState(false);
  }
  return performLocalApproverAction();
}

export async function fetchAuditLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.entity_type && params.entity_type !== 'ALL') query.append('entity_type', params.entity_type);
  if (params.actor_role && params.actor_role !== 'ALL') query.append('actor_role', params.actor_role);
  if (params.fdr_number) query.append('fdr_number', params.fdr_number);
  if (params.search) query.append('search', params.search);
  if (params.limit) query.append('limit', params.limit);

  return fetchWithFallback(`${API_BASE}/audit?${query.toString()}`, {}, () => {
    let list = getLocal(STORAGE_KEYS.AUDIT_LOGS) || INITIAL_AUDIT_LOGS;
    if (params.entity_type && params.entity_type !== 'ALL') {
      list = list.filter(l => l.entity_type === params.entity_type);
    }
    if (params.actor_role && params.actor_role !== 'ALL') {
      list = list.filter(l => l.actor_role === params.actor_role);
    }
    if (params.fdr_number) {
      list = list.filter(l => l.fdr_number && l.fdr_number.includes(params.fdr_number));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(l => 
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.actor_name && l.actor_name.toLowerCase().includes(q))
      );
    }
    if (params.limit) {
      list = list.slice(0, parseInt(params.limit));
    }
    return list;
  });
}

export async function resetDemoData() {
  initLocalStorage(true);
  try {
    const res = await fetch(`${API_BASE}/reset-demo-data`, { method: 'POST' });
    if (res.ok) {
      setOnlineState(true);
      return await res.json();
    }
  } catch {
    setOnlineState(false);
  }
  return { success: true, message: "Demo data reset successfully in LocalStorage store." };
}
