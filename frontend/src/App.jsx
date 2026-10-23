import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import RegisterFDRView from './views/RegisterFDRView';
import FDRListView from './views/FDRListView';
import VerificationView from './views/VerificationView';
import RenewalsView from './views/RenewalsView';
import ReleasesView from './views/ReleasesView';
import AuditView from './views/AuditView';
import { fetchSummary, resetDemoData } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState('AICTE_OFFICER'); // 'INSTITUTION', 'AICTE_OFFICER', 'APPROVER'
  const [currentView, setCurrentView] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Cross-view navigation context
  const [targetVerificationFdrId, setTargetVerificationFdrId] = useState(null);
  const [targetRenewalFdr, setTargetRenewalFdr] = useState(null);
  const [targetReleaseFdr, setTargetReleaseFdr] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const data = await fetchSummary();
      setSummary(data);
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

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      
      {/* Official Government Header */}
      <Header
        currentRole={currentRole}
        setRole={setCurrentRole}
        onResetData={handleResetDemo}
        isResetting={isResetting}
        institutionName="Delhi Institute of Technology & Management"
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`p-4 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold text-white ${
            toastMessage.type === 'error' ? 'bg-red-600' : 'bg-slate-900 border border-slate-700'
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
        
        {/* Navigation Sidebar */}
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
              preSelectedFDR={targetReleaseFdr}
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
