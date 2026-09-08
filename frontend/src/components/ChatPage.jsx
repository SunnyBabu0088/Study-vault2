import { ArrowLeft, ArrowUp, BellOff, Edit3, MoreVertical, Palette, Phone, Plus, Search, Trash2, User, Video, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { useCallContext } from '../context/CallContext';
import { getSocket } from '../api/socket';
import ThemeSelectorModal, { CHAT_THEMES } from './ThemeSelectorModal';
import NicknameModal from './NicknameModal';
import MuteModal from './MuteModal';
import AudioCallModal from './AudioCallModal';
import VideoCallModal from './VideoCallModal';

export default function ChatPage() {
  const { startCall } = useCallContext();

  const {
    messages,
    contactStatus,
    activeContact,
    conversationId,
    conversationSettings,
    updateChatTheme,
    updateChatNickname,
    updateChatMute,
    clearChatMessages,
    messageInput,
    setMessageInput,
    closeChat,
    sendMessage,
    startTyping,
    profile,
    navigate,
  } = useStudy();

  const listRef = useRef(null);
  const textareaRef = useRef(null);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  // Modals state
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // In-chat search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUserName = profile?.username || null;
  const socket = getSocket();

  // Active theme object
  const activeThemeId = conversationSettings?.theme_id || 'minimalist';
  const themeConfig = useMemo(() => {
    return CHAT_THEMES.find((t) => t.id === activeThemeId) || CHAT_THEMES[3]; // default minimalist
  }, [activeThemeId]);

  // Display Name: Nickname if available, otherwise actual contact name
  const displayName = conversationSettings?.nickname || activeContact || 'Friend';

  // Check if conversation is currently muted
  const isMuted = useMemo(() => {
    if (!conversationSettings?.muted_until) return false;
    return new Date(conversationSettings.muted_until) > new Date();
  }, [conversationSettings?.muted_until]);

  // Deduplicate messages by unique message ID or unique combination of created_at + content
  const uniqueMessages = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const msg of messages) {
      const key = msg.id || `${msg.created_at || ''}_${msg.content || ''}_${msg.sender_id || msg.sender_username || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(msg);
      }
    }
    return result;
  }, [messages]);

  // Filter messages for search
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return uniqueMessages;
    const term = searchQuery.toLowerCase().trim();
    return uniqueMessages.filter((m) => String(m.content || '').toLowerCase().includes(term));
  }, [uniqueMessages, searchQuery]);

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  // Auto-clear toast errors after 3 seconds
  useEffect(() => {
    if (sendError) {
      const timer = setTimeout(() => {
        setSendError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sendError]);

  const handleSend = async () => {
    const value = messageInput.trim();
    if (!value || sending) return;

    setSending(true);
    setSendError('');

    try {
      await sendMessage(value);
      setMessageInput('');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('Send message error:', err);
      setSendError(typeof err?.message === 'string' ? err.message : 'Unable to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section
      className={`fixed inset-0 z-50 flex flex-col w-full h-[100dvh] font-sans overflow-hidden transition-all duration-300 ${themeConfig.bgStyle}`}
      style={{
        backgroundImage: themeConfig.overlayStyle !== 'none' ? themeConfig.overlayStyle : undefined,
      }}
      aria-label="Full screen chat screen"
    >
      {/* CALL MODALS */}
      {showAudioCall && (
        <AudioCallModal
          contactName={displayName}
          avatarSeed={activeContact}
          socket={socket}
          conversationId={conversationId}
          onEndCall={() => setShowAudioCall(false)}
        />
      )}

      {showVideoCall && (
        <VideoCallModal
          contactName={displayName}
          avatarSeed={activeContact}
          socket={socket}
          conversationId={conversationId}
          onEndCall={() => setShowVideoCall(false)}
        />
      )}

      {/* THEME SELECTOR MODAL */}
      {showThemeModal && (
        <ThemeSelectorModal
          currentThemeId={activeThemeId}
          onSelectTheme={async (themeId) => {
            await updateChatTheme(conversationId, themeId);
            setShowThemeModal(false);
          }}
          onClose={() => setShowThemeModal(false)}
        />
      )}

      {/* NICKNAME MODAL */}
      {showNicknameModal && (
        <NicknameModal
          contactName={activeContact}
          currentNickname={conversationSettings?.nickname}
          onSave={async (nickname) => {
            await updateChatNickname(conversationId, nickname);
            setShowNicknameModal(false);
          }}
          onClose={() => setShowNicknameModal(false)}
        />
      )}

      {/* MUTE MODAL */}
      {showMuteModal && (
        <MuteModal
          isMuted={isMuted}
          onSave={async (duration) => {
            await updateChatMute(conversationId, duration);
            setShowMuteModal(false);
          }}
          onClose={() => setShowMuteModal(false)}
        />
      )}

      {/* CLEAR CHAT CONFIRM MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="m-0 text-base font-bold text-[var(--text-primary)]">Clear Conversation?</h3>
                <p className="m-0 text-xs text-[var(--text-muted)]">This will clear messages from your view.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-[var(--button-background)] text-xs font-bold text-[var(--text-primary)] transition"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition shadow-md"
                onClick={async () => {
                  await clearChatMessages(conversationId);
                  setShowClearConfirm(false);
                }}
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP FIXED CHAT HEADER */}
      <header className="sticky top-0 z-30 w-full bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center justify-center h-10 w-10 rounded-full transition hover:bg-[var(--button-background)] text-[var(--text-primary)]"
            type="button"
            aria-label="Back to contacts"
            onClick={closeChat}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('profile-view')}>
            <div className="relative">
              <img
                className="h-10 w-10 rounded-full object-cover border border-[var(--border-color)]"
                src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${activeContact || 'Friend'}`}
                alt={displayName}
                loading="lazy"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[var(--bg-card)]" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <h2 className="m-0 text-base font-bold text-[var(--text-primary)]">{displayName}</h2>
                {isMuted && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 text-[10px] font-bold">
                    <BellOff className="w-3 h-3" /> Muted
                  </span>
                )}
              </div>
              <p className="m-0 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {contactStatus || 'Online now'}
                {conversationSettings?.nickname && (
                  <span className="text-[10px] text-[var(--text-muted)]">(@{activeContact})</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* HEADER ACTIONS: AUDIO CALL, VIDEO CALL, 3-DOT MENU */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition cursor-pointer"
            aria-label="Audio call"
            title="Start Audio Call"
            onClick={() => startCall(activeContact, 'voice', conversationId)}
          >
            <Phone className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition cursor-pointer"
            aria-label="Video call"
            title="Start Video Call"
            onClick={() => startCall(activeContact, 'video', conversationId)}
          >
            <Video className="h-5 w-5" />
          </button>

          {/* 3-DOT OPTIONS DROPDOWN */}
          <div className="relative">
            <button
              className="flex items-center justify-center h-10 w-10 rounded-full transition hover:bg-[var(--button-background)] text-[var(--text-primary)]"
              type="button"
              aria-label="Chat options"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-1.5 space-y-1 animate-fadeIn">
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-[var(--text-primary)] hover:bg-[var(--button-background)] transition"
                  onClick={() => {
                    setShowMenu(false);
                    navigate('profile-view');
                  }}
                >
                  <User className="h-4 w-4 text-[var(--text-muted)]" /> View Profile
                </button>

                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-[var(--text-primary)] hover:bg-[var(--button-background)] transition"
                  onClick={() => {
                    setShowMenu(false);
                    setShowNicknameModal(true);
                  }}
                >
                  <Edit3 className="h-4 w-4 text-indigo-500" /> Nickname
                </button>

                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-[var(--text-primary)] hover:bg-[var(--button-background)] transition"
                  onClick={() => {
                    setShowMenu(false);
                    setShowThemeModal(true);
                  }}
                >
                  <Palette className="h-4 w-4 text-amber-500" /> Chat Theme
                </button>

                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-[var(--text-primary)] hover:bg-[var(--button-background)] transition"
                  onClick={() => {
                    setShowMenu(false);
                    setShowMuteModal(true);
                  }}
                >
                  <BellOff className="h-4 w-4 text-rose-400" /> Mute Messages
                </button>

                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-[var(--text-primary)] hover:bg-[var(--button-background)] transition"
                  onClick={() => {
                    setShowMenu(false);
                    setSearchOpen(!searchOpen);
                  }}
                >
                  <Search className="h-4 w-4 text-sky-400" /> Search in Conversation
                </button>

                <div className="border-t border-[var(--border-color)] my-1" />

                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-amber-500 hover:bg-amber-500/10 transition"
                  onClick={() => {
                    setShowMenu(false);
                    setShowClearConfirm(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Clear Chat
                </button>

                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-rose-500 hover:bg-rose-500/10 transition"
                  onClick={() => {
                    setShowMenu(false);
                    closeChat();
                  }}
                >
                  <X className="h-4 w-4" /> Close Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* INLINE SEARCH BAR */}
      {searchOpen && (
        <div className="w-full bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-2 flex items-center gap-2 animate-fadeIn z-20">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            className="flex-1 field py-1.5 px-3 text-xs bg-transparent border-none focus:outline-none"
            placeholder="Search messages in conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button type="button" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={() => setSearchQuery('')}>
              Clear
            </button>
          )}
          <button type="button" className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={() => setSearchOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TEMPORARY ERROR TOAST */}
      {sendError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold shadow-lg animate-bounce">
          {sendError}
        </div>
      )}

      {/* MESSAGE SCROLL AREA */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-12">
            <img
              className="h-16 w-16 rounded-full object-cover border-2 border-[var(--border-color)] shadow-sm"
              src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${activeContact || 'Friend'}`}
              alt={displayName}
            />
            <p className="font-bold text-base text-[var(--text-primary)] m-0">{displayName}</p>
            <p className="text-xs text-[var(--text-muted)] max-w-xs m-0">
              {searchQuery ? 'No matching messages found for your search query.' : `This is the start of your direct conversation history with ${displayName}. Say hi! 👋`}
            </p>
          </div>
        ) : (
          filteredMessages.map((message, idx) => {
            const mine = message.sender_username === currentUserName || message.sender_id === profile?.id;
            return (
              <div key={message.id || `${message.created_at || idx}-${idx}`} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-2.5 text-sm max-w-[80%] sm:max-w-[70%] break-words shadow-xs ${
                    mine
                      ? 'rounded-2xl rounded-tr-xs text-white'
                      : 'rounded-2xl rounded-tl-xs border border-[var(--border-color)]'
                  }`}
                  style={{
                    background: mine ? themeConfig.mineBubble : themeConfig.theirsBubble,
                    color: mine ? '#ffffff' : themeConfig.textColor,
                  }}
                >
                  <p className="m-0 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1">
                  {message.created_at
                    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now'}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* FIXED BOTTOM CHAT COMPOSER */}
      <footer className="sticky bottom-0 z-30 w-full bg-[var(--bg-card)]/90 backdrop-blur-md border-t border-[var(--border-color)] p-3 px-4 shadow-lg">
        <form className="flex items-center gap-2 max-w-4xl mx-auto w-full" onSubmit={handleSubmit}>
          <button
            type="button"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--button-background)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] transition flex-shrink-0"
            aria-label="Add attachment"
          >
            <Plus className="h-5 w-5" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            className="field flex-1 py-2.5 px-4 rounded-full min-h-[44px] max-h-32 resize-none text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)] focus:outline-none focus:border-[var(--brand-orange)]"
            required
            placeholder={`Message ${displayName}...`}
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              startTyping();
            }}
            onKeyDown={handleKeyDown}
          />

          <button
            className="flex items-center justify-center h-10 w-10 rounded-full disabled:opacity-40 text-white transition flex-shrink-0 shadow-md hover:opacity-95 active:scale-95 cursor-pointer"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
            type="submit"
            aria-label="Send message"
            disabled={sending || !messageInput.trim()}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </footer>
    </section>
  );
}
