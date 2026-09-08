import React, { useState } from 'react';
import { AlertOctagon, X, ShieldAlert, CheckCircle2, UserX, AlertTriangle, MessageSquare, HelpCircle } from 'lucide-react';

const REPORT_REASONS = [
  { id: 'nudity_sexual', label: 'Nudity or sexual content', icon: AlertOctagon, color: 'text-rose-500' },
  { id: 'minor_sexual_content', label: 'Sexual content involving minors', icon: ShieldAlert, color: 'text-red-600 font-bold' },
  { id: 'harassment', label: 'Harassment or bullying', icon: AlertTriangle, color: 'text-amber-500' },
  { id: 'hate_speech', label: 'Hate or abusive content', icon: MessageSquare, color: 'text-orange-500' },
  { id: 'impersonation', label: 'Impersonation', icon: UserX, color: 'text-purple-500' },
  { id: 'spam', label: 'Spam or misleading', icon: MessageSquare, color: 'text-blue-500' },
  { id: 'other', label: 'Other issue', icon: HelpCircle, color: 'text-slate-500' },
];

export default function ReportModal({ isOpen, onClose, entityType, entityId, targetName = '' }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Please select a report reason.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          reason: selectedReason,
          description
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to submit report');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h3 className="font-semibold text-lg">Report Content</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">Thank You</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              We've received your report for this {entityType}. Our safety team will review it promptly to maintain a safe learning environment.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Why are you reporting this {entityType} {targetName ? `by ${targetName}` : ''}?
            </p>

            {error && (
              <div className="p-3 text-xs font-medium bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl">
                {error}
              </div>
            )}

            {/* Reasons Options */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {REPORT_REASONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedReason === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedReason(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Additional details */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Additional Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details to help our safety team..."
                rows={2}
                className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-md shadow-rose-600/20"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
