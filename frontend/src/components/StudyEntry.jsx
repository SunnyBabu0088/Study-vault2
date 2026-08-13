import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export default function StudyEntry() {
  const { createTask } = useStudy();
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await createTask({ subject: subject.trim(), title: title.trim(), content: content.trim(), priority, due_date: dueDate });
      setSubject('');
      setTitle('');
      setContent('');
      setDueDate('');
      setPriority('Medium');
      setMessage('Saved!');
      setMessageError(false);
    } catch (error) {
      setMessage(error.message || 'Failed to save');
      setMessageError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="surface rounded-[26px] p-5 sm:p-6" aria-labelledby="entry-title">
      <p className="m-0 text-xs font-bold uppercase tracking-[.15em]">New entry</p>
      <h2 id="entry-title" className="display-face mt-2">
        Add a study item
      </h2>
      <form className="mt-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-bold" htmlFor="subject">
              Subject
            </label>
            <input
              id="subject"
              className="field"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold" htmlFor="priority">
              Priority
            </label>
            <select
              id="priority"
              className="field"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option>Medium</option>
              <option>High</option>
              <option>Low</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-bold" htmlFor="item-title">
            Task title
          </label>
          <input
            id="item-title"
            className="field"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-bold" htmlFor="content">
            Details
          </label>
          <textarea
            id="content"
            className="field min-h-[94px] resize-y"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-bold" htmlFor="due-date">
            Due date
          </label>
          <input
            id="due-date"
            className="field"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <button
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition hover:-translate-y-0.5 disabled:opacity-60"
          type="submit"
          disabled={saving}
        >
          <Plus className="h-4 w-4" />
          {saving ? 'Adding…' : 'Add task'}
        </button>
        {message && (
          <p className="mt-3 min-h-[1.25rem] text-sm font-medium" style={{ color: messageError ? '#d83d72' : '#5a6478' }}>
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
