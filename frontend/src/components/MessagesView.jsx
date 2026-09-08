import { useEffect, useState } from 'react';
import { Flame, MessageSquarePlus } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { apiRequest } from '../api/client';
import ChatPage from './ChatPage';

function ConversationsPanel() {
  const { openConversation, activeContact, user } = useStudy();
  const [conversations, setConversations] = useState([]);
  const [customContact, setCustomContact] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await apiRequest('/api/conversations');
        const list = res.data?.conversations || res.conversations || [];
        setConversations(list);
      } catch (err) {
        console.error('Unable to fetch conversations list:', err);
      }
    };
    fetchConversations();
  }, []);

  const handleStartCustom = (e) => {
    e.preventDefault();
    const name = customContact.trim();
    if (!name) return;
    openConversation(name);
    setCustomContact('');
    setShowAdd(false);
  };

  const contactsList = [];
  conversations.forEach((conv) => {
    (conv.participants || []).forEach((p) => {
      if (p.username && p.username !== user?.username && !contactsList.some((c) => c.name.toLowerCase() === p.username.toLowerCase())) {
        contactsList.push({ name: p.username, seed: p.username, lastMessage: conv.last_message });
      }
    });
  });

  return (
    <section className="surface mt-5 max-w-md overflow-hidden rounded-[28px] p-3.5 bg-[var(--bg-card)] border border-[var(--border-color)]" aria-label="Contacts panel">
      <div className="mb-3 flex items-center justify-between px-2">
        <p className="m-0 text-xs font-bold uppercase tracking-[.14em] text-[var(--text-secondary)]">Contacts</p>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-bold text-[var(--brand-orange)] hover:underline cursor-pointer"
          onClick={() => setShowAdd(!showAdd)}
        >
          <MessageSquarePlus className="h-4 w-4" /> New
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleStartCustom} className="mb-3 space-y-2 p-2">
          <input
            type="text"
            className="field text-xs py-2"
            placeholder="Enter student username to chat..."
            value={customContact}
            onChange={(e) => setCustomContact(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="w-full rounded-xl py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition cursor-pointer"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 12px var(--brand-glow)' }}
          >
            Start Chat
          </button>
        </form>
      )}

      {contactsList.length > 0 ? (
        <div className="space-y-1">
          {contactsList.map((contact) => (
            <button
              key={contact.name}
              className={`conversation flex w-full items-center gap-3 rounded-2xl p-3 text-left transition cursor-pointer ${
                activeContact === contact.name ? 'is-active bg-[var(--button-background)]' : 'hover:bg-[var(--button-background)]'
              }`}
              type="button"
              onClick={() => openConversation(contact.name)}
            >
              <img
                className="h-11 w-11 rounded-full object-cover border border-[var(--border-color)]"
                src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${contact.seed}`}
                alt={contact.name}
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-[var(--text-primary)]">{contact.name}</span>
                <span className="block truncate text-xs text-[var(--text-muted)]">
                  {contact.lastMessage || 'Tap to open conversation'}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs font-semibold text-[var(--text-muted)]">
          No messages yet. Click "+ New" to start a chat.
        </div>
      )}
    </section>
  );
}

export default function MessagesView() {
  const { streakCount, chatOpen } = useStudy();

  if (chatOpen) {
    return <ChatPage />;
  }

  return (
    <section className="pt-7" aria-labelledby="messages-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[.15em] text-[var(--text-secondary)]">Messages</p>
          <h1 id="messages-title" className="display-face m-0 mt-2 text-[var(--text-primary)]">
            Study chat
          </h1>
        </div>
        <div className={`streak-badge ${streakCount === 0 ? 'no-streak' : ''}`}>
          <Flame className="h-4 w-4" />
          <span>{streakCount} day streak</span>
        </div>
      </div>

      <ConversationsPanel />

    </section>
  );
}
