import { useState } from 'react';
import { Edit3, X } from 'lucide-react';

export default function NicknameModal({ contactName, currentNickname, onSave, onClose }) {
  const [nicknameInput, setNicknameInput] = useState(currentNickname || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(nicknameInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="m-0 text-base font-bold text-[var(--text-primary)]">Edit Nickname</h3>
              <p className="m-0 text-xs text-[var(--text-muted)]">Set a private nickname for {contactName}</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Custom Nickname (visible only to you)
            </label>
            <input
              type="text"
              className="field w-full py-2.5 px-3.5 rounded-xl text-sm"
              placeholder={`e.g. Study Buddy (default: ${contactName})`}
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              autoFocus
              maxLength={50}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
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
              Save Nickname
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
