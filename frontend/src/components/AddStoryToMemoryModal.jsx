import { useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { apiRequest } from '../api/client';

export default function AddStoryToMemoryModal({ isOpen, onClose, memory, highlight, availableStories = [], onStoriesAdded }) {
  const activeMemory = memory || highlight;
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !activeMemory) return null;

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setErrorMsg('Select at least one story to add');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      for (const stId of selectedIds) {
        await apiRequest(`/api/memories/${activeMemory.id}/stories`, {
          method: 'POST',
          body: { storyId: stId },
        });
      }
      setSelectedIds([]);
      if (onStoriesAdded) onStoriesAdded();
      onClose();
    } catch (err) {
      console.error('Failed to add stories to memory:', err);
      setErrorMsg(err.message || 'Unable to add story');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      aria-label="Add Story to Memory Modal"
      role="dialog"
    >
      <div
        className="surface relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] p-5 sm:p-6 shadow-2xl transition-all bg-[var(--surface)] border border-[var(--border-color)] text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div>
            <h2 className="display-face m-0 text-base font-bold text-[var(--text-primary)]">Add to {activeMemory.name}</h2>
            <p className="m-0 text-xs text-[var(--text-muted)]">Select stories to add to this memory</p>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Story Selector Form */}
        <form onSubmit={handleAdd} className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
          {availableStories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
              {availableStories.map((story) => {
                const isSelected = selectedIds.includes(story.id);
                return (
                  <div
                    key={story.id}
                    className={`relative flex cursor-pointer flex-col items-center justify-between overflow-hidden rounded-2xl border-2 p-3 transition ${
                      isSelected
                        ? 'border-[#3b52cf] bg-[#eaedfa] dark:bg-[#1e293b]'
                        : 'border-[var(--border-color)] bg-[var(--surface-secondary)] hover:border-[#3b52cf]/50'
                    }`}
                    onClick={() => toggleSelect(story.id)}
                  >
                    <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[var(--surface)]">
                      <img
                        className="h-full w-full object-cover"
                        src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${story.seed || story.name}`}
                        alt={story.name}
                      />
                    </div>
                    <p className="mt-2 text-center text-xs font-bold text-[var(--text-primary)] line-clamp-1">{story.content || story.name}</p>

                    <div
                      className={`absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full text-white ${
                        isSelected ? 'bg-[#3b52cf]' : 'bg-[var(--border-color)]'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-secondary)] p-5 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-[var(--text-muted)]" />
              <p className="mt-2 text-xs font-bold text-[var(--text-primary)]">No available stories</p>
              <p className="text-[11px] text-[var(--text-muted)]">Post a story first to add it to this memory.</p>
            </div>
          )}

          {errorMsg && <p className="text-xs font-semibold text-rose-500">{errorMsg}</p>}

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
              className="rounded-xl bg-[#3b52cf] px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 cursor-pointer"
              disabled={submitting || selectedIds.length === 0}
            >
              {submitting ? 'Adding…' : 'Add to Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
