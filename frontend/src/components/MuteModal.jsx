import { useState } from 'react';
import { BellOff, X } from 'lucide-react';

const MUTE_OPTIONS = [
  { id: '6h', label: '6 hours' },
  { id: '12h', label: '12 hours' },
  { id: '1d', label: '1 day (24 hours)' },
  { id: '1w', label: '1 week' },
  { id: 'unmute', label: 'Unmute Notifications' },
];

export default function MuteModal({ isMuted, onSave, onClose }) {
  const [selectedDuration, setSelectedDuration] = useState('1d');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(selectedDuration);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <BellOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="m-0 text-base font-bold text-[var(--text-primary)]">Mute Messages</h3>
              <p className="m-0 text-xs text-[var(--text-muted)]">Silence notifications for this conversation</p>
            </div>
          </div>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-[var(--button-background)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            {MUTE_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  selectedDuration === opt.id
                    ? 'border-[#3b52cf] bg-[#3b52cf]/10 font-bold text-[var(--text-primary)]'
                    : 'border-[var(--border-color)] hover:bg-[var(--button-background)] text-[var(--text-secondary)]'
                }`}
              >
                <input
                  type="radio"
                  name="mute_duration"
                  value={opt.id}
                  checked={selectedDuration === opt.id}
                  onChange={() => setSelectedDuration(opt.id)}
                  className="accent-[#3b52cf] h-4 w-4"
                />
                <span className="text-xs">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              className="px-4 py-2 rounded-full bg-[var(--button-background)] hover:bg-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#3b52cf] hover:bg-[#2d42b3] text-xs font-bold text-white shadow-md transition"
            >
              Confirm Mute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
