import { ArrowLeft, ArrowUp } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useStudy } from '../context/StudyContext';

export default function ChatPage() {
  const { messages, contactStatus, activeContact, messageInput, setMessageInput, closeChat, sendMessage, startTyping, profile } = useStudy();
  const listRef = useRef(null);
  const currentUserName = profile?.username || null;

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = messageInput.trim();
    if (!value) return;
    sendMessage(value);
    setMessageInput('');
  };

  return (
    <section className="chat-page view surface rounded-[28px]" aria-label="Opened conversation">
      <div className="flex items-center gap-3 border-b border-[#e2e5ef] px-5 py-4">
        <button
          className="grid h-10 w-10 place-items-center rounded-full"
          type="button"
          aria-label="Back to messages"
          onClick={closeChat}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <img
            className="h-11 w-11 rounded-full object-cover"
            src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${activeContact}`}
            alt={activeContact}
            loading="lazy"
          />
          <div>
            <p className="m-0 font-bold">{activeContact}</p>
            <p className="m-0 text-sm text-[#5a6478]">{contactStatus}</p>
          </div>
        </div>
      </div>

      <div ref={listRef} className="flex max-h-[60vh] flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <p className="m-auto text-sm text-[#9aa3b4]">No messages yet. Say hi!</p>
        )}
        {messages.map((message) => {
          const mine = message.sender_username === currentUserName;
          return (
            <div key={message.id} className={`bubble ${mine ? 'mine' : 'theirs'}`}>
              <p className="m-0">{message.content}</p>
            </div>
          );
        })}
      </div>

      <form className="mt-auto border-t border-[#e2e5ef] p-4" onSubmit={handleSubmit}>
        <div className="flex items-end gap-3">
          <textarea
            className="field min-h-[49px] resize-none"
            required
            placeholder="Type a message"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              startTyping();
            }}
          />
          <button
            className="grid h-[49px] w-[49px] place-items-center rounded-2xl"
            type="submit"
            aria-label="Send"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </form>
    </section>
  );
}
