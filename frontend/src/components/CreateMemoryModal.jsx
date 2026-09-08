import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { apiRequest } from '../api/client';

const SUGGESTED_NAMES = ['Physics', 'Coding', 'Development', 'Designing', 'Projects', 'Notes', 'Study'];

export default function CreateMemoryModal({ isOpen, onClose, onMemoryCreated, onHighlightCreated }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a memory name');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await apiRequest('/api/memories', {
        method: 'POST',
        body: {
          name: name.trim(),
          storyIds: [],
        },
      });
      const created = res.data?.memory || res.data?.highlight || res.memory || res.highlight;
      setName('');
      if (onMemoryCreated) onMemoryCreated(created);
      if (onHighlightCreated) onHighlightCreated(created);
      onClose();
    } catch (err) {
      console.error('Failed to create memory:', err);
      setErrorMsg(err.message || 'Unable to create memory');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      aria-label="Create Memory Modal"
      role="dialog"
    >
      <div
        className="surface relative flex w-full max-w-sm flex-col overflow-hidden rounded-[28px] p-5 sm:p-6 shadow-2xl transition-all bg-[var(--surface)] border border-[var(--border-color)] text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="display-face m-0 text-base font-bold text-[var(--text-primary)]">Create Memory</h2>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Memory Name
            </label>
            <input
              className="field text-sm"
              placeholder="e.g. Physics, Coding, Projects, Notes"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Quick Suggestion Chips */}
          <div>
            <span className="block text-[11px] font-bold text-[var(--text-muted)] mb-1.5">Suggestions:</span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_NAMES.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  className="rounded-full bg-[var(--surface-secondary)] border border-[var(--border-color)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition cursor-pointer"
                  onClick={() => setName(sug)}
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && <p className="text-xs font-semibold text-rose-500">{errorMsg}</p>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent)] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
              disabled={submitting || !name.trim()}
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
