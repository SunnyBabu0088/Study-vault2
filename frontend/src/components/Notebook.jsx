import { useState } from 'react';
import { useStudy } from '../context/StudyContext';

const themeOptions = [
  { value: 'lavender', label: 'Lavender' },
  { value: 'sunrise', label: 'Sunrise' },
  { value: 'mint', label: 'Mint' },
  { value: 'midnight', label: 'Midnight' },
];

export default function Notebook() {
  const { notes, noteThemes, createNote } = useStudy();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [theme, setTheme] = useState('lavender');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await createNote({ title: title.trim(), content: content.trim(), theme });
      setTitle('');
      setContent('');
      setMessage('Saved!');
    } catch (error) {
      setMessage(error.message || 'Unable to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="surface mt-6 rounded-[26px] p-5 sm:p-6 dark:bg-[#161e2d] dark:border-[#263244]" aria-labelledby="notebook-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[.15em] text-[#5a6478] dark:text-[#94a3b8]">Notebook</p>
          <h2 id="notebook-title" className="display-face mt-2 text-[#0f1729] dark:text-[#f8fafc]">
            Quick notes
          </h2>
          <p className="mt-1 text-sm text-[#5a6478] dark:text-[#94a3b8]">Save ideas or reminders as you go.</p>
        </div>
        <select
          className="field w-auto"
          aria-label="Note theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          {themeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <form className="mt-4 grid gap-3 sm:grid-cols-[.7fr_1.3fr_auto]" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-[#0f1729] dark:text-[#f8fafc]" htmlFor="note-title">
            Note title
          </label>
          <input
            id="note-title"
            className="field"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-[#0f1729] dark:text-[#f8fafc]" htmlFor="note-content">
            Note content
          </label>
          <textarea
            id="note-content"
            className="field min-h-[49px] resize-y"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button className="self-end rounded-xl bg-[#0f1729] dark:bg-[#3b52cf] text-white px-4 py-3 font-bold transition hover:bg-[#3b52cf] dark:hover:bg-[#2563eb]" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save note'}
        </button>
      </form>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {notes.map((note) => {
          const isMidnight = note.theme === 'midnight';
          return (
            <article
              key={note.id}
              className="rounded-2xl border border-[#e2e5ef] dark:border-[#263244] p-4 shadow-sm"
              style={{ background: noteThemes[note.theme] || noteThemes.lavender, color: isMidnight ? '#fff' : 'var(--text-primary)' }}
            >
              <h3 className="m-0 font-bold text-[#0f1729] dark:text-[#f8fafc]">{note.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#334155] dark:text-[#cbd5e1]">{note.content}</p>
            </article>
          );
        })}
      </div>
      {message && <p className="mt-3 text-sm font-medium text-[#5a6478] dark:text-[#94a3b8]">{message}</p>}
    </section>
  );
}
