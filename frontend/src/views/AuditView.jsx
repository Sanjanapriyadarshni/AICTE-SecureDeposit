import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ShieldCheck, 
  Building2, 
  Scale, 
  FileText, 
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { fetchAuditLogs } from '../services/api';

export default function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, [entityFilter, roleFilter]);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await fetchAuditLogs({
        entity_type: entityFilter,
        actor_role: roleFilter,
        search: searchQuery,
        limit: 150
      });
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    loadLogs();
  }

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Actor Role', 'Actor Name', 'Action', 'Entity', 'FDR Number', 'Details'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      l.actor_role,
      `"${(l.actor_name || '').replace(/"/g, '""')}"`,
      l.action,
      l.entity_type,
      l.fdr_number || '',
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csv);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `AICTE_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (logs.length === 0) return;
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const link = document.createElement('a');
    link.href = jsonStr;
    link.download = `AICTE_Audit_Trail_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <History className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Statutory Audit History & Decision Registry
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological record of registrations, SFMS bank checks, discrepancy detections, recommendations, and sanction orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            title="Download JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, FDR number, actor name, or keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">Entity: All Entities</option>
            <option value="FDR">FDR</option>
            <option value="VERIFICATION">Bank Verification</option>
            <option value="DISCREPANCY">Discrepancy</option>
            <option value="RENEWAL">Renewal</option>
            <option value="RELEASE">Release & Refund</option>
          </select>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">Actor: All Roles</option>
            <option value="INSTITUTION">Institution</option>
            <option value="AICTE_OFFICER">AICTE Officer</option>
            <option value="FINANCIAL_APPROVER">Financial Approver</option>
            <option value="SYSTEM">System / Gateway</option>
          </select>

          <button
            onClick={loadLogs}
            className="p-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-600"
            title="Refresh logs"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Trail Timeline List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RotateCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <span>Retrieving immutable audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-800">No audit records match the criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map(log => {
              const roleColors = {
                INSTITUTION: 'bg-blue-50 text-blue-700 border-blue-200',
                AICTE_OFFICER: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                FINANCIAL_APPROVER: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
                SYSTEM: 'bg-slate-100 text-slate-700 border-slate-300'
              };

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs">
                  
                  {/* Left: Icon & Details */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 shrink-0 mt-0.5">
                      {log.actor_role === 'FINANCIAL_APPROVER' ? (
                        <Scale className="w-4 h-4 text-amber-600" />
                      ) : log.actor_role === 'AICTE_OFFICER' ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      ) : log.actor_role === 'INSTITUTION' ? (
                        <Building2 className="w-4 h-4 text-blue-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-600" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {log.action}
                        </span>
                        {log.fdr_number && (
                          <span className="font-mono text-xs bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded">
                            {log.fdr_number}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {log.entity_type}
                        </span>
                      </div>

                      <p className="text-slate-700 text-xs leading-relaxed max-w-3xl">
                        {log.details}
                      </p>

                      <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-3 flex-wrap">
                        <span>Actor: <strong className="text-slate-800">{log.actor_name}</strong></span>
                        <span>•</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] uppercase font-bold border ${roleColors[log.actor_role] || 'bg-slate-100 text-slate-700'}`}>
                          {log.actor_role}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400 text-[10px]">Host: {log.ip_address || '127.0.0.1'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Timestamp */}
                  <div className="text-right shrink-0 text-slate-400 text-[11px] whitespace-nowrap">
                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Displaying {logs.length} audit trail records</span>
          <span>Security logs preserved under Indian Evidence Act & IT Act 2000</span>
        </div>
      </div>

    </div>
  );
}
