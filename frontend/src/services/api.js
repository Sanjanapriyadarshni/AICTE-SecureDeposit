const API_BASE = '/api';

export async function fetchSummary() {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  if (!res.ok) throw new Error('Failed to load dashboard summary');
  return res.json();
}

export async function fetchInstitutions() {
  const res = await fetch(`${API_BASE}/institutions`);
  if (!res.ok) throw new Error('Failed to load institutions');
  return res.json();
}

export async function fetchFDRs(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.bank && params.bank !== 'ALL') query.append('bank', params.bank);
  if (params.institution_id) query.append('institution_id', params.institution_id);
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/fdrs?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch FDRs');
  return res.json();
}

export async function fetchFDRDetail(fdrId) {
  const res = await fetch(`${API_BASE}/fdrs/${fdrId}`);
  if (!res.ok) throw new Error('Failed to load FDR details');
  return res.json();
}

export async function createFDR(fdrData) {
  const res = await fetch(`${API_BASE}/fdrs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fdrData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create FDR' }));
    throw new Error(err.detail || 'Failed to create FDR');
  }
  return res.json();
}

export async function uploadFDRDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/fdrs/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload document' }));
    throw new Error(err.detail || 'Failed to upload document');
  }
  return res.json();
}

export async function updateFDRStatus(fdrId, status, notes = '', actorRole = 'AICTE_OFFICER', actorName = 'AICTE Officer') {
  const query = new URLSearchParams({
    status,
    notes,
    actor_role: actorRole,
    actor_name: actorName
  });
  const res = await fetch(`${API_BASE}/fdrs/${fdrId}/status?${query.toString()}`, {
    method: 'PATCH'
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function fetchVerificationComparison(fdrId) {
  const res = await fetch(`${API_BASE}/verification/compare/${fdrId}`);
  if (!res.ok) throw new Error('Failed to load verification comparison');
  return res.json();
}

export async function triggerBankVerification(fdrId, scenario = 'EXACT_MATCH', actorName = 'AICTE Verification Cell') {
  const query = new URLSearchParams({
    simulate_scenario: scenario,
    actor_name: actorName
  });
  const res = await fetch(`${API_BASE}/verification/trigger-bank-verification/${fdrId}?${query.toString()}`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Bank verification trigger failed' }));
    throw new Error(err.detail || 'Bank verification trigger failed');
  }
  return res.json();
}

export async function resolveDiscrepancy(discrepancyId, resolutionNotes, resolvedBy = 'AICTE Officer') {
  const res = await fetch(`${API_BASE}/verification/resolve-discrepancy/${discrepancyId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolution_notes: resolutionNotes, resolved_by: resolvedBy })
  });
  if (!res.ok) throw new Error('Failed to resolve discrepancy');
  return res.json();
}

export async function officerApproveVerification(fdrId, officerName, notes) {
  const res = await fetch(`${API_BASE}/verification/officer-approve/${fdrId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ officer_name: officerName, verification_notes: notes })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Approval failed' }));
    throw new Error(err.detail || 'Approval failed');
  }
  return res.json();
}

export async function fetchExpiringFDRs(days = 90) {
  const res = await fetch(`${API_BASE}/renewals/expiring?days=${days}`);
  if (!res.ok) throw new Error('Failed to load expiring FDRs');
  return res.json();
}

export async function fetchRenewalRequests() {
  const res = await fetch(`${API_BASE}/renewals/requests`);
  if (!res.ok) throw new Error('Failed to load renewal requests');
  return res.json();
}

export async function submitRenewal(renewalData) {
  const res = await fetch(`${API_BASE}/renewals/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(renewalData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit renewal' }));
    throw new Error(err.detail || 'Failed to submit renewal');
  }
  return res.json();
}

export async function reviewRenewal(renewalId, action, remarks, officerName = 'AICTE Officer') {
  const query = new URLSearchParams({ officer_name: officerName });
  const res = await fetch(`${API_BASE}/renewals/review/${renewalId}?${query.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, officer_remarks: remarks })
  });
  if (!res.ok) throw new Error('Failed to review renewal');
  return res.json();
}

export async function fetchReminders() {
  const res = await fetch(`${API_BASE}/renewals/reminders`);
  if (!res.ok) throw new Error('Failed to load reminders');
  return res.json();
}

export async function generateReminders() {
  const res = await fetch(`${API_BASE}/renewals/generate-reminders`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to generate reminders');
  return res.json();
}

export async function fetchReleaseRequests(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.institution_id) query.append('institution_id', params.institution_id);
  const res = await fetch(`${API_BASE}/releases?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load release requests');
  return res.json();
}

export async function submitReleaseRequest(releaseData) {
  const res = await fetch(`${API_BASE}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(releaseData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit release application' }));
    throw new Error(err.detail || 'Failed to submit release application');
  }
  return res.json();
}

export async function officerReviewRelease(requestId, action, comments, officerName) {
  const res = await fetch(`${API_BASE}/releases/${requestId}/officer-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, comments, officer_name: officerName })
  });
  if (!res.ok) throw new Error('Failed to review release request');
  return res.json();
}

export async function approverActionRelease(requestId, action, comments, approverName) {
  const res = await fetch(`${API_BASE}/releases/${requestId}/approver-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, comments, approver_name: approverName })
  });
  if (!res.ok) throw new Error('Failed to process final approval');
  return res.json();
}

export async function fetchAuditLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.entity_type && params.entity_type !== 'ALL') query.append('entity_type', params.entity_type);
  if (params.actor_role && params.actor_role !== 'ALL') query.append('actor_role', params.actor_role);
  if (params.fdr_number) query.append('fdr_number', params.fdr_number);
  if (params.search) query.append('search', params.search);
  if (params.limit) query.append('limit', params.limit);

  const res = await fetch(`${API_BASE}/audit?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load audit trail');
  return res.json();
}

export async function resetDemoData() {
  const res = await fetch(`${API_BASE}/reset-demo-data`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo data');
  return res.json();
}
