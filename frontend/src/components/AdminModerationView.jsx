import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Check, X, RefreshCw, AlertTriangle } from 'lucide-react';

export default function AdminModerationView() {
  const [queue, setQueue] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('queue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (activeTab === 'queue') {
        const res = await fetch('/api/admin/moderation/queue', { headers });
        const data = await res.json();
        setQueue(Array.isArray(data) ? data : []);
      } else {
        const res = await fetch('/api/reports?status=pending', { headers });
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Failed to load moderation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDecision = async (entityType, entityId, decision) => {
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/admin/moderation/decide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId, decision })
      });
      fetchData();
    } catch (err) {
      alert('Failed to process moderation decision');
    }
  };

  const handleReportAction = async (reportId, status) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      alert('Failed to update report status');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Moderation Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage flagged content and review user safety reports.</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'queue'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Review Queue ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          User Reports ({reports.length})
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Queue View */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {queue.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No items currently require manual review.
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                      {item.entity_type}
                    </span>
                    <span className="text-xs text-slate-400">ID: {item.id}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.content || 'Media item'}</p>
                  {item.moderation_reason && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{item.moderation_reason}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDecision(item.entity_type, item.id, 'APPROVED')}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision(item.entity_type, item.id, 'REJECTED')}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reports View */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No pending user reports.
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      {report.reason}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Reported by @{report.reporter_username} for {report.entity_type} ({report.entity_id})
                    </span>
                  </div>
                  {report.description && (
                    <p className="text-sm text-slate-700 dark:text-slate-300">{report.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReportAction(report.id, 'actioned')}
                    className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
                  >
                    Action Content
                  </button>
                  <button
                    onClick={() => handleReportAction(report.id, 'dismissed')}
                    className="px-4 py-2 text-sm font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
