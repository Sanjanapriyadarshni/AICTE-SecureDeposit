import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import RegisterFDRView from './views/RegisterFDRView';
import FDRListView from './views/FDRListView';
import VerificationView from './views/VerificationView';
import RenewalsView from './views/RenewalsView';
import ReleasesView from './views/ReleasesView';
import AuditView from './views/AuditView';
import { 
  fetchSummary, 
  resetDemoData, 
  getInitialSummary, 
  getDataSourceStatus, 
  subscribeDataSourceStatus,
  setActiveRole,
  getStoredAuth,
  setStoredAuth,
  logoutUser,
  DEMO_CREDENTIALS
} from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const getInitialParam = (param, defaultVal) => {
    if (typeof window !== 'undefined') {
      const url = new URLSearchParams(window.location.search);
      return url.get(param) || defaultVal;
    }
    return defaultVal;
  };

  const [auth, setAuth] = useState(() => getStoredAuth());
  const [currentRole, setCurrentRole] = useState(() => {
    const stored = getStoredAuth();
    if (stored?.user?.role) return stored.user.role;
    return getInitialParam('role', 'AICTE_OFFICER');
  });
  const [currentView, setCurrentView] = useState(() => getInitialParam('view', 'dashboard'));
  const [summary, setSummary] = useState(() => getInitialSummary());
  const [dataSourceStatus, setDataSourceStatus] = useState(() => getDataSourceStatus());
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Cross-view navigation context
  const [targetVerificationFdrId, setTargetVerificationFdrId] = useState(null);
  const [targetRenewalFdr, setTargetRenewalFdr] = useState(null);
  const [targetReleaseFdr, setTargetReleaseFdr] = useState(null);

  useEffect(() => {
    setActiveRole(currentRole);
  }, [currentRole]);

  useEffect(() => {
    loadSummary();
    const unsubscribe = subscribeDataSourceStatus(status => {
      setDataSourceStatus(status);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') !== currentView || params.get('role') !== currentRole) {
        params.set('view', currentView);
        params.set('role', currentRole);
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      }
    }
  }, [currentView, currentRole]);

  async function loadSummary() {
    try {
      const data = await fetchSummary();
      if (data) setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    }
  }

  function showToast(msg, type = 'success') {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }

  function handleLoginSuccess(token, user) {
    setAuth({ token, user });
    setCurrentRole(user.role);
    setCurrentView('dashboard');
    loadSummary();
    showToast(`Welcome, ${user.name}! Signed in as ${user.role}.`);
  }

  async function handleLogout() {
    await logoutUser();
    setAuth({ token: null, user: null });
    showToast('You have been signed out successfully.');
  }

  function handleRoleChange(newRole) {
    const match = DEMO_CREDENTIALS.find(d => d.role === newRole);
    if (match) {
      const user = {
        id: match.role === 'INSTITUTION' ? 1 : (match.role === 'AICTE_OFFICER' ? 2 : 3),
        email: match.email,
        name: match.name,
        role: match.role,
        institution_id: match.institution_id,
        designation: match.designation
      };
      setStoredAuth(auth.token || `token_${newRole}`, user);
      setAuth({ token: auth.token || `token_${newRole}`, user });
      setCurrentRole(newRole);
      setCurrentView('dashboard');
      loadSummary();
      showToast(`Switched active perspective to ${match.roleLabel} (${match.name})`);
    } else {
      setCurrentRole(newRole);
    }
  }

  async function handleResetDemo() {
    if (!window.confirm('Reset database to pristine sample data for Smart India Hackathon demo?')) {
      return;
    }
    setIsResetting(true);
    try {
      await resetDemoData();
      await loadSummary();
      showToast('Demo database successfully reset with fresh AICTE institutions, FDRs, discrepancy cases & audit trail!');
    } catch (err) {
      showToast(err.message || 'Failed to reset demo data', 'error');
    } finally {
      setIsResetting(false);
    }
  }

  // Cross-view handlers
  function handleSelectFDRForVerification(fdrId) {
    setTargetVerificationFdrId(fdrId);
    setCurrentView('verification');
  }

  function handleInitiateRenewal(fdr) {
    setTargetRenewalFdr(fdr);
    setCurrentView('renewals');
  }

  function handleInitiateRelease(fdr) {
    setTargetReleaseFdr(fdr);
    setCurrentView('releases');
  }

  function handleFDRRegistered(newFdr) {
    showToast(`FDR #${newFdr.fdr_number} registered successfully! Status: ${newFdr.status}`);
    loadSummary();
    if (newFdr.status === 'DISCREPANCY_FLAGGED' || newFdr.status === 'PENDING_VERIFICATION') {
      setTargetVerificationFdrId(newFdr.id);
      setCurrentView('verification');
    } else {
      setCurrentView('fdrs');
    }
  }

  // If not authenticated, render official Login page
  if (!auth?.token || !auth?.user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const currentUser = auth.user;

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col font-sans">
      
      {/* Official Government Header */}
      <Header
        currentRole={currentRole}
        currentUser={currentUser}
        setRole={handleRoleChange}
        onLogout={handleLogout}
        onResetData={handleResetDemo}
        isResetting={isResetting}
        institutionName={currentUser?.institution_id === 1 ? "Delhi Institute of Technology & Management" : "Technical Institution"}
        dataSourceStatus={dataSourceStatus}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`p-4 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold text-white ${
            toastMessage.type === 'error' ? 'bg-red-600' : 'bg-[#17365D] border border-slate-600'
          }`}>
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-300" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <span>{toastMessage.msg}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">×</button>
          </div>
        </div>
      )}

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        
        {/* Role-Specific Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          currentRole={currentRole}
          summary={summary}
        />

        {/* Dynamic View Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              summary={summary}
              currentRole={currentRole}
              setCurrentView={setCurrentView}
              onRefresh={loadSummary}
            />
          )}

          {currentView === 'register' && (
            <RegisterFDRView
              currentRole={currentRole}
              onSuccess={handleFDRRegistered}
              onCancel={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'fdrs' && (
            <FDRListView
              currentRole={currentRole}
              setCurrentView={setCurrentView}
              onSelectFDRForVerification={handleSelectFDRForVerification}
              onInitiateRenewal={handleInitiateRenewal}
              onInitiateRelease={handleInitiateRelease}
            />
          )}

          {currentView === 'verification' && (
            <VerificationView
              currentRole={currentRole}
              filterMode="ALL"
              selectedFdrId={targetVerificationFdrId}
              setSelectedFdrId={setTargetVerificationFdrId}
              onVerificationComplete={loadSummary}
            />
          )}

          {currentView === 'discrepancy_review' && (
            <VerificationView
              currentRole={currentRole}
              filterMode="DISCREPANCIES"
              selectedFdrId={targetVerificationFdrId}
              setSelectedFdrId={setTargetVerificationFdrId}
              onVerificationComplete={loadSummary}
            />
          )}

          {currentView === 'correction_requests' && (
            <VerificationView
              currentRole={currentRole}
              filterMode="CORRECTIONS"
              selectedFdrId={targetVerificationFdrId}
              setSelectedFdrId={setTargetVerificationFdrId}
              onVerificationComplete={loadSummary}
            />
          )}

          {currentView === 'renewals' && (
            <RenewalsView
              currentRole={currentRole}
              preSelectedFDR={targetRenewalFdr}
              onRefreshSummary={loadSummary}
            />
          )}

          {currentView === 'releases' && (
            <ReleasesView
              currentRole={currentRole}
              filterStatus="ALL"
              preSelectedFDR={targetReleaseFdr}
              onRefreshSummary={loadSummary}
            />
          )}

          {currentView === 'approved_decisions' && (
            <ReleasesView
              currentRole={currentRole}
              filterStatus="APPROVED_BY_APPROVER"
              onRefreshSummary={loadSummary}
            />
          )}

          {currentView === 'returned_requests' && (
            <ReleasesView
              currentRole={currentRole}
              filterStatus="RETURNED_FOR_CLARIFICATION"
              onRefreshSummary={loadSummary}
            />
          )}

          {currentView === 'audit' && (
            <AuditView />
          )}
        </main>

      </div>

      {/* Official Government Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">AICTE SecureDeposit</span>
            <span>• Smart India Hackathon (SIH 2026) Technical Prototype</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Designed for National Technical Education Compliance • All Deposits Guaranteed under AICTE Lien
          </div>
        </div>
      </footer>

    </div>
  );
}
