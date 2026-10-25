import React from 'react';
import InstitutionDashboard from './InstitutionDashboard';
import OfficerDashboard from './OfficerDashboard';
import ApproverDashboard from './ApproverDashboard';

export default function DashboardView({ 
  summary, 
  currentRole, 
  setCurrentView,
  onRefresh 
}) {
  if (currentRole === 'INSTITUTION') {
    return (
      <InstitutionDashboard
        setCurrentView={setCurrentView}
        onRefreshGlobal={onRefresh}
      />
    );
  }

  if (currentRole === 'APPROVER') {
    return (
      <ApproverDashboard
        setCurrentView={setCurrentView}
        onRefreshGlobal={onRefresh}
      />
    );
  }

  // Default to AICTE_OFFICER
  return (
    <OfficerDashboard
      setCurrentView={setCurrentView}
      onRefreshGlobal={onRefresh}
    />
  );
}
