import { Flame } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import ChatPage from './ChatPage';

const contacts = [
  { name: 'Aarav', seed: 'Aarav' },
  { name: 'Maya', seed: 'Maya' },
  { name: 'Kabir', seed: 'Kabir' },
];

function ConversationsPanel() {
  const { openConversation, activeContact } = useStudy();

  return (
    <section
      className="surface message-layout mt-5 grid overflow-hidden rounded-[28px] lg:grid-cols-[300px_1fr]"
      aria-label="Messages panel"
    >
      <aside className="conversation-column border-b border-[#e2e5ef] bg-[#fafbfe] p-3 lg:border-b-0 lg:border-r">
        <p className="mb-3 px-2 text-xs font-bold uppercase tracking-[.14em]">Contacts</p>
        {contacts.map((contact) => (
          <button
            key={contact.name}
            className={`conversation flex w-full items-center gap-3 rounded-2xl p-3 text-left ${activeContact === contact.name ? 'is-active' : ''} ${contact.name !== 'Aarav' ? 'mt-1' : ''}`}
            type="button"
            onClick={() => openConversation(contact.name)}
          >
            <img
              className="h-11 w-11 rounded-full object-cover"
              src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${contact.seed}`}
              alt={contact.name}
              loading="lazy"
            />
            <span className="text-sm font-bold">{contact.name}</span>
          </button>
        ))}
      </aside>
      <div className="flex min-h-[520px] flex-col items-center justify-center p-6">
        <p className="text-sm text-[#5a6478]">Select a contact to start a conversation.</p>
      </div>
    </section>
  );
}

export default function MessagesView() {
  const { streakCount, chatOpen } = useStudy();

  return (
    <section className="pt-7" aria-labelledby="messages-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[.15em]">Messages</p>
          <h1 id="messages-title" className="display-face m-0 mt-2">
            Study chat
          </h1>
        </div>
        <div className={`streak-badge ${streakCount === 0 ? 'no-streak' : ''}`}>
          <Flame className="h-4 w-4" />
          <span>{streakCount} day streak</span>
        </div>
      </div>
      <p className="mt-2 max-w-xl">Send notes and updates to your study buddies.</p>

      {chatOpen ? <ChatPage /> : <ConversationsPanel />}
    </section>
  );
}
