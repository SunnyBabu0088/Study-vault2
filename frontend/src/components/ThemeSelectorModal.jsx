import { Check, X, Sparkles } from 'lucide-react';

export const CHAT_THEMES = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk & Neon Glow',
    description: 'Futuristic dark city aesthetic with glowing electric blue and neon pink circuits.',
    previewBg: 'linear-gradient(135deg, #090a0f 0%, #1a0826 50%, #001a2e 100%)',
    previewBorder: '#ff007f',
    bgStyle: 'bg-[#090a0f] text-[#00f3ff]',
    overlayStyle: 'radial-gradient(circle at 20% 20%, rgba(255, 0, 127, 0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(0, 243, 255, 0.15), transparent 40%)',
    mineBubble: 'linear-gradient(135deg, #ff007f, #b000ff)',
    theirsBubble: 'rgba(15, 23, 42, 0.85)',
    textColor: '#f8fafc',
  },
  {
    id: 'gradient',
    name: 'Vibrant Tie-Dye',
    description: 'Smooth liquid tie-dye transition with pastel pink, purple, and gold tones.',
    previewBg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 40%, #a1c4fd 100%)',
    previewBorder: '#a1c4fd',
    bgStyle: 'bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 dark:from-purple-950 dark:via-slate-900 dark:to-indigo-950',
    overlayStyle: 'radial-gradient(circle at 50% 50%, rgba(244, 114, 182, 0.18), transparent 60%)',
    mineBubble: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    theirsBubble: 'rgba(255, 255, 255, 0.9)',
    textColor: '#0f172a',
  },
  {
    id: 'nature',
    name: 'Chill Nature',
    description: 'Calming ocean ripples, misty forest greens, and earthy organic tones.',
    previewBg: 'linear-gradient(135deg, #064e3b 0%, #022c22 50%, #0f172a 100%)',
    previewBorder: '#10b981',
    bgStyle: 'bg-[#041e17] text-[#ecfdf5]',
    overlayStyle: 'radial-gradient(circle at 10% 90%, rgba(16, 185, 129, 0.18), transparent 45%), radial-gradient(circle at 90% 10%, rgba(20, 184, 166, 0.15), transparent 45%)',
    mineBubble: 'linear-gradient(135deg, #059669, #0d9488)',
    theirsBubble: 'rgba(6, 78, 59, 0.75)',
    textColor: '#ecfdf5',
  },
  {
    id: 'minimalist',
    name: 'Minimalist Monochrome',
    description: 'Deep charcoal and black background with subtle geometric lines and clean typography.',
    previewBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    previewBorder: 'var(--brand-orange)',
    bgStyle: 'bg-[var(--bg-primary)]',
    overlayStyle: 'none',
    mineBubble: 'var(--brand-gradient)',
    theirsBubble: 'var(--bg-card)',
    textColor: 'var(--text-primary)',
  },
  {
    id: 'arctic',
    name: 'Crisp Arctic Frost',
    description: 'Frosted ice textures with bright cool cyan and crisp white gradient.',
    previewBg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
    previewBorder: '#0284c7',
    bgStyle: 'bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-100 dark:from-slate-950 dark:via-cyan-950 dark:to-slate-900',
    overlayStyle: 'radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.25), transparent 50%)',
    mineBubble: 'linear-gradient(135deg, #0284c7, #2563eb)',
    theirsBubble: 'rgba(255, 255, 255, 0.95)',
    textColor: '#0c4a6e',
  },
];

export default function ThemeSelectorModal({ currentThemeId, onSelectTheme, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="m-0 text-lg font-bold text-[var(--text-primary)]">Chat Theme</h3>
              <p className="m-0 text-xs text-[var(--text-muted)]">Select a per-conversation visual style</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {CHAT_THEMES.map((theme) => {
            const isSelected = currentThemeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                className={`relative flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all group overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'border-[var(--brand-orange)] ring-2 ring-[var(--brand-orange)]/30 shadow-lg'
                    : 'border-[var(--border-color)] hover:border-[var(--brand-orange)]/60 hover:shadow-md'
                }`}
                onClick={() => {
                  onSelectTheme(theme.id);
                }}
              >
                {/* PREVIEW CONTAINER */}
                <div
                  className="h-20 w-full rounded-xl mb-3 flex flex-col justify-between p-2 shadow-inner overflow-hidden relative"
                  style={{ background: theme.previewBg }}
                >
                  <div className="self-end px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-black/40 backdrop-blur-xs">
                    Preview
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-5 px-2 rounded-lg text-[10px] text-white flex items-center font-medium shadow-xs"
                      style={{ background: theme.mineBubble }}
                    >
                      Hello! 👋
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="m-0 text-sm font-bold text-[var(--text-primary)]">{theme.name}</h4>
                    {isSelected && (
                      <span className="p-1 rounded-full text-white" style={{ background: 'var(--brand-gradient)' }}>
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="m-0 mt-1 text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            className="px-5 py-2.5 rounded-full bg-[var(--button-background)] hover:bg-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] transition"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
