import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, Clock, PieChart, Sparkles, X } from 'lucide-react';
import { apiRequest } from '../api/client';

export default function VaultAnalyticsModal({ onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiRequest('/api/vault/analytics');
        const data = res.data || res;
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden animate-fadeIn">
      <header className="sticky top-0 z-30 w-full bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-[var(--button-background)] text-[var(--text-primary)] transition"
            onClick={onClose}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
              Analytics & Insights
            </span>
            <h2 className="m-0 text-base font-bold text-[var(--text-primary)]">Academic Performance</h2>
          </div>
        </div>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-[var(--button-background)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-6">
        {loading ? (
          <div className="text-center py-12 text-sm text-[var(--text-muted)]">Loading analytics...</div>
        ) : (
          <>
            {/* INSIGHTS CARDS */}
            <div className="surface p-5 rounded-3xl border border-[var(--border-color)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--brand-orange)] uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> AI Study Insights
              </div>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)] m-0 pl-4 list-disc">
                <li>Your most studied subject this week is <strong>Machine Learning</strong>.</li>
                <li>Peak study hours are between <strong>7:00 PM and 9:30 PM</strong>.</li>
                <li>You have completed <strong>3 active study sessions</strong> today.</li>
              </ul>
            </div>

            {/* SUBJECT BREAKDOWN */}
            <div className="surface p-5 rounded-3xl border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="m-0 text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[var(--brand-orange)]" /> Subject Time Breakdown
                </h3>
              </div>

              <div className="space-y-3">
                {(analytics?.subject_breakdown || [
                  { subject_name: 'Machine Learning', total_seconds: 2400 },
                  { subject_name: 'DBMS', subject_color: '#FF641F', total_seconds: 1500 },
                  { subject_name: 'Python', total_seconds: 2100 },
                  { subject_name: 'AI', total_seconds: 1800 },
                ]).map((item) => {
                  const mins = Math.round(item.total_seconds / 60);
                  const pct = Math.min(100, Math.round((mins / 60) * 100));
                  return (
                    <div key={item.subject_name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[var(--text-primary)]">{item.subject_name}</span>
                        <span className="text-[var(--text-muted)]">{mins} mins</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[var(--button-background)] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--brand-gradient)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
