import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Code,
  Brain,
  Image as ImageIcon,
  Paperclip,
  Mic,
  Copy,
  Check,
  Download,
  Trash2,
  Plus,
  History,
  HelpCircle,
  ArrowUp,
  FileText
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function AiAssistantModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeConvId, setActiveConvId] = useState(null);
  
  // Input & Controls State
  const [isThinkActive, setIsThinkActive] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Drawer / History state
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [aiImages, setAiImages] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // Quiz Interaction State inside current session
  const [quizState, setQuizState] = useState({});

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchConversations();
      fetchImages();
      fetchQuizzes();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchConversations = async () => {
    try {
      const res = await apiRequest('/api/ai/conversations');
      const convs = res.data?.conversations || res.conversations || [];
      setConversations(convs);
    } catch (err) {
      console.warn('Failed to load AI conversations:', err);
    }
  };

  const fetchImages = async () => {
    try {
      const res = await apiRequest('/api/ai/images');
      const imgs = res.data?.images || res.images || [];
      setAiImages(imgs);
    } catch (err) {
      console.warn('Failed to load AI images:', err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await apiRequest('/api/ai/quizzes');
      const qzs = res.data?.quizzes || res.quizzes || [];
      setQuizHistory(qzs);
    } catch (err) {
      console.warn('Failed to load AI quizzes:', err);
    }
  };

  const loadConversation = async (convId) => {
    setLoading(true);
    setActiveConvId(convId);
    setShowHistory(false);
    try {
      const res = await apiRequest(`/api/ai/conversations/${convId}/messages`);
      const msgs = res.data?.messages || res.messages || [];
      setMessages(msgs.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata
      })));
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInputMsg('');
    setAttachedFile(null);
    setShowHistory(false);
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await apiRequest(`/api/ai/conversations/${convId}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConvId === convId) startNewChat();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please type your prompt.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0]?.transcript;
        if (transcript) {
          setInputMsg((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file),
        file
      });
    }
  };

  const handleSendMessage = async (customText) => {
    const textToSend = (customText || inputMsg).trim();
    if ((!textToSend && !attachedFile) || loading) return;

    const lower = textToSend.toLowerCase();
    let detectedMode = 'AI';
    if (lower.includes('code') || lower.includes('python') || lower.includes('react') || lower.includes('javascript') || lower.includes('java') || lower.includes('sql') || lower.includes('debug')) {
      detectedMode = 'Code';
    } else if (lower.includes('quiz') || lower.includes('test me') || lower.includes('questions')) {
      detectedMode = 'Quiz';
    } else if (lower.includes('generate image') || lower.includes('create image') || lower.includes('draw') || lower.includes('poster')) {
      detectedMode = 'Image';
    } else if (lower.includes('vault') || lower.includes('my tasks') || lower.includes('my subjects')) {
      detectedMode = 'Study';
    } else if (lower.includes('essay') || lower.includes('email') || lower.includes('resume') || lower.includes('write')) {
      detectedMode = 'Write';
    }

    setInputMsg('');
    const currentAttachment = attachedFile;
    setAttachedFile(null);
    setShowPlusMenu(false);
    setLoading(true);

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: textToSend || (currentAttachment ? `[Attached ${currentAttachment.name}]` : ''),
      metadata: currentAttachment ? { type: 'attachment', file: currentAttachment } : null
    };

    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: {
          conversationId: activeConvId,
          message: textToSend || 'Please analyze the attached item.',
          mode: detectedMode,
          attachedFile: currentAttachment ? currentAttachment.name : null,
          options: {
            isThinkActive
          }
        }
      });

      const responseData = res.data || res;
      if (responseData.conversationId) {
        setActiveConvId(responseData.conversationId);
      }

      const assistantMsg = {
        id: responseData.messageId || `ai-${Date.now()}`,
        role: 'assistant',
        content: responseData.content || (responseData.data && responseData.data.content) || responseData.message || responseData.answer || 'Response received.',
        metadata: responseData.metadata || (responseData.data && responseData.data.metadata) || {}
      };

      setMessages(prev => [...prev, assistantMsg]);
      fetchConversations();
      if (assistantMsg.metadata?.type === 'image') fetchImages();
    } catch (err) {
      console.error('[AI Assistant Modal Error]', err);
      let errorMsg = 'AI service is temporarily unavailable. Please try again.';
      if (err?.status === 401) errorMsg = 'Your session has expired. Please sign in again.';
      else if (err?.status === 403) errorMsg = 'You do not have permission to use StudyVault AI.';
      else if (err?.status === 404) errorMsg = 'AI service endpoint was not found.';
      else if (err?.status === 500) errorMsg = 'StudyVault AI encountered a server error.';
      else if (err?.message?.includes('Failed to fetch')) errorMsg = 'Unable to connect to StudyVault AI.';

      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errorMsg,
          metadata: { type: 'error' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (codeText, id) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleQuizAnswer = (qId, optionIdx) => {
    setQuizState(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999999] h-[100dvh] w-[100vw] bg-black/85 backdrop-blur-2xl text-[var(--text-primary)] flex flex-col overflow-hidden select-none animate-in fade-in duration-300">
      {/* HIDDEN FILE INPUT */}
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />

      {/* TOP AI HUB WORKSPACE HEADER */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]/60 bg-[var(--surface)]/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3b52cf] to-[#7c3aed] text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold m-0 flex items-center gap-2">
              StudyVault AI Hub
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] uppercase tracking-wider font-extrabold border border-indigo-500/20">
                Pro Model
              </span>
            </h2>
          </div>
        </div>

        {/* TOP RIGHT CONTROLS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              showHistory ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions & Gallery</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="relative flex-1 overflow-hidden flex">
        {/* HISTORY SIDEBAR DRAWER */}
        {showHistory && (
          <aside className="absolute left-0 top-0 bottom-0 z-40 w-72 bg-[var(--surface)] border-r border-[var(--border)] p-4 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-left duration-250">
            <button
              type="button"
              onClick={startNewChat}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#3b52cf] hover:bg-[#2e42a8] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New AI Session</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
              <div>
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-2">Recent Sessions</h4>
                <div className="space-y-1">
                  {conversations.length > 0 ? (
                    conversations.map(c => (
                      <div
                        key={c.id}
                        onClick={() => loadConversation(c.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                          activeConvId === c.id ? 'bg-[#3b52cf]/20 text-[#3b52cf] border border-[#3b52cf]/30 font-bold' : 'hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <span className="truncate pr-2">{c.title}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteConversation(e, c.id)}
                          className="text-[var(--text-muted)] hover:text-rose-500 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] italic py-1">No previous chats</p>
                  )}
                </div>
              </div>

              {aiImages.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-2">My AI Creations</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {aiImages.slice(0, 6).map((img, i) => (
                      <div key={img.id || i} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] group">
                        <img src={img.image_url} alt={img.prompt} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-[9px] text-white font-bold p-1 text-center truncate">{img.prompt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* CHAT MESSAGES THREAD */}
        <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-6 max-w-3xl mx-auto w-full">
          {messages.length === 0 ? (
            /* MINIMAL EMPTY STATE */
            <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-4 animate-in fade-in zoom-in-98 duration-300">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#3b52cf] via-[#5c67e6] to-[#7c3aed] text-white shadow-xl shadow-indigo-500/30">
                <Bot className="h-9 w-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] m-0">How can I help you today?</h3>
                <p className="text-xs text-[var(--text-muted)] m-0">Ask StudyVault AI anything below.</p>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              const meta = m.metadata || {};

              return (
                <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-250`}>
                  {!isUser && (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#3b52cf] to-[#7c3aed] text-white flex items-center justify-center shrink-0 shadow-md">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`space-y-3 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-3xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-[#3b52cf] to-[#7c3aed] text-white font-medium rounded-tr-sm shadow-md'
                          : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                      {meta.type === 'image' && meta.imageUrl && (
                        <div className="mt-3 pt-3 border-t border-white/15 space-y-2">
                          <div className="relative rounded-2xl overflow-hidden border border-white/20 max-h-80 bg-black/40 flex items-center justify-center">
                            <img src={meta.imageUrl} alt={meta.prompt} className="w-full h-full object-contain max-h-80" />
                          </div>
                          <div className="flex items-center justify-between text-[11px] opacity-80 pt-1">
                            <span>Style: <strong>{meta.style}</strong> ({meta.aspectRatio})</span>
                            <a
                              href={meta.imageUrl}
                              download="studyvault-ai-image.svg"
                              className="flex items-center gap-1 font-bold text-indigo-300 hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </a>
                          </div>
                        </div>
                      )}

                      {meta.type === 'quiz' && meta.questions && (
                        <div className="mt-4 pt-3 border-t border-[var(--border)]/50 space-y-4">
                          {meta.questions.map((q) => {
                            const selectedOpt = quizState[q.id];
                            const isAnswered = selectedOpt !== undefined;
                            const isCorrect = selectedOpt === q.correctIndex;

                            return (
                              <div key={q.id} className="p-3.5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2 text-left">
                                <p className="font-bold text-xs text-[var(--text-primary)] m-0">Q{q.id}. {q.question}</p>
                                <div className="space-y-1.5 pt-1">
                                  {q.options.map((opt, oIdx) => {
                                    let btnClass = "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]/40";
                                    if (isAnswered) {
                                      if (oIdx === q.correctIndex) btnClass = "bg-emerald-600 text-white font-bold";
                                      else if (selectedOpt === oIdx) btnClass = "bg-rose-600 text-white font-bold";
                                    }

                                    return (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        disabled={isAnswered}
                                        onClick={() => handleQuizAnswer(q.id, oIdx)}
                                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer ${btnClass}`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                                {isAnswered && (
                                  <div className={`p-2.5 rounded-xl text-[11px] ${isCorrect ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                    <p className="font-bold m-0">{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
                                    <p className="m-0 mt-0.5 opacity-90">{q.explanation}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {meta.type === 'code' && meta.codeBlock && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] px-1">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(meta.codeBlock, m.id)}
                          className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                        >
                          {copiedCodeId === m.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedCodeId === m.id ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleSendMessage(`Explain this code step by step:\n${meta.codeBlock}`)}
                          className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                        >
                          <HelpCircle className="h-3 w-3" />
                          <span>Explain Logic</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="h-8 w-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                      You
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* AI TYPING STATE INDICATOR */}
          {loading && (
            <div className="flex items-center gap-3 animate-in fade-in duration-200">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#3b52cf] to-[#7c3aed] text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping delay-100" />
                  <span className="h-2 w-2 rounded-full bg-indigo-300 animate-ping delay-200" />
                </span>
                <span className="ml-1 font-medium">StudyVault AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* SINGLE UNIFIED GLASS PILL INPUT BAR FIXED AT BOTTOM */}
      <footer className="p-4 border-t border-[var(--border)]/60 bg-[var(--surface)]/80 backdrop-blur-md shrink-0">
        <div className="relative max-w-3xl mx-auto w-full">
          {/* ATTACHMENT CHIP PREVIEW */}
          {attachedFile && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
              <span className="truncate max-w-[200px]">{attachedFile.name}</span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="p-0.5 hover:text-rose-500 rounded-full cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* FLOATING PLUS ATTACHMENT POPUP MENU */}
          {showPlusMenu && (
            <div className="absolute left-2 bottom-16 z-50 p-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl flex flex-col gap-1 text-xs font-bold animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => {
                  setShowPlusMenu(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--surface-secondary)] text-[var(--text-primary)] cursor-pointer"
              >
                <ImageIcon className="h-4 w-4 text-indigo-400" />
                <span>Attach Image</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPlusMenu(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--surface-secondary)] text-[var(--text-primary)] cursor-pointer"
              >
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>Attach File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPlusMenu(false);
                  setInputMsg('Fix this code:\n');
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--surface-secondary)] text-[var(--text-primary)] cursor-pointer"
              >
                <Code className="h-4 w-4 text-amber-400" />
                <span>Code Snippet</span>
              </button>
            </div>
          )}

          {/* PILL-SHAPED SINGLE INPUT BAR: + Ask anything Think 🎙 / ↑ */}
          <div className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--surface-secondary)]/90 backdrop-blur-2xl border border-[var(--border)] shadow-xl shadow-black/10 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300">
            {/* LEFT: PLUS (+) BUTTON */}
            <button
              type="button"
              onClick={() => setShowPlusMenu(prev => !prev)}
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all cursor-pointer ${
                showPlusMenu ? 'bg-indigo-600 text-white rotate-45' : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]/60'
              }`}
              title="Add attachment or capability"
            >
              <Plus className="h-4 w-4 transition-transform duration-200" />
            </button>

            {/* CENTER: UNIFIED TRANSPARENT INPUT (NO INNER RECTANGULAR BOX OR BORDER) */}
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything"
              style={{ border: 'none', outline: 'none', background: 'transparent', boxShadow: 'none' }}
              className="flex-1 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs sm:text-sm font-medium border-none outline-none ring-0 shadow-none px-1 py-1"
            />

            {/* RIGHT CONTROLS: THINK TOGGLE BUTTON & SINGLE CIRCULAR ACTION BUTTON (MIC / SEND) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* THINK TOGGLE BUTTON */}
              <button
                type="button"
                onClick={() => setIsThinkActive(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isThinkActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]/60'
                }`}
                title="Toggle Deep AI Reasoning Mode"
              >
                <Brain className="h-3.5 w-3.5" />
                <span>Think {isThinkActive ? '✓' : ''}</span>
              </button>

              {/* SINGLE CIRCULAR ACTION BUTTON: MIC (EMPTY) -> SEND (TYPING/ATTACHMENT) */}
              <button
                type="button"
                onClick={() => {
                  if (inputMsg.trim() || attachedFile) {
                    handleSendMessage();
                  } else {
                    handleMicClick();
                  }
                }}
                disabled={loading}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all cursor-pointer ${
                  inputMsg.trim() || attachedFile
                    ? 'bg-gradient-to-tr from-[#3b52cf] to-[#7c3aed] text-white shadow-md shadow-indigo-500/30 hover:scale-105 active:scale-95'
                    : isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]/60 hover:text-[var(--text-primary)]'
                }`}
                title={inputMsg.trim() || attachedFile ? 'Send Message' : 'Voice Input'}
              >
                {inputMsg.trim() || attachedFile ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
