import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest, setUnauthorizedHandler, uploadMedia } from '../api/client';
import { connectSocket, disconnectSocket, getSocket } from '../api/socket';

const StudyContext = createContext(null);

export const useStudy = () => {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
};

export const StudyProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalMedia, setCreateModalMedia] = useState([]);
  const [createModalMode, setCreateModalMode] = useState('POST');

  const openCreateModal = useCallback((media = [], mode = 'POST') => {
    setCreateModalMedia(media);
    setCreateModalMode(mode);
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setCreateModalMedia([]);
    setCreateModalMode('POST');
  }, []);
  const [activeReelIndex, setActiveReelIndex] = useState(0);

  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [showStoryActivity, setShowStoryActivity] = useState(false);

  const [isAiHubOpen, setIsAiHubOpen] = useState(false);
  const openAiHub = useCallback(() => setIsAiHubOpen(true), []);
  const closeAiHub = useCallback(() => setIsAiHubOpen(false), []);

  const openStoryActivity = useCallback(() => {
    setShowStoryActivity(true);
    setIsStoryOpen(true);
  }, []);

  const closeStoryActivity = useCallback(() => {
    setShowStoryActivity(false);
    setIsStoryOpen(false);
  }, []);

  // Theme Management (light | dark | system)
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('studyvault-theme') || localStorage.getItem('theme') || localStorage.getItem('studyvault_theme') || 'system';
  });

  const applyThemeClass = useCallback((themeMode) => {
    const root = document.documentElement;
    let isDark = false;
    if (themeMode === 'dark') {
      isDark = true;
    } else if (themeMode === 'light') {
      isDark = false;
    } else if (themeMode === 'system') {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const setTheme = useCallback(
    (newTheme) => {
      setThemeState(newTheme);
      localStorage.setItem('studyvault-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      localStorage.setItem('studyvault_theme', newTheme);
      applyThemeClass(newTheme);
    },
    [applyThemeClass]
  );

  useEffect(() => {
    applyThemeClass(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyThemeClass('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, applyThemeClass]);

  const [activeView, setActiveView] = useState('home-view');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [activeContact, setActiveContact] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contactStatus, setContactStatus] = useState('Online now');
  const [chatOpen, setChatOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  const [suggestions, setSuggestions] = useState({});

  const socketRef = useRef(null);
  const conversationIdRef = useRef(null);
  const seenMessageIdsRef = useRef(new Set());
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const currentUserName = profile?.username || user?.username || null;

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setProfile(null);
    setTasks([]);
    setNotes([]);
    setPosts([]);
    setReels([]);
    disconnectSocket();
    setReady(true);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
  }, [handleUnauthorized]);

  const loadTasks = useCallback(async () => {
    try {
      const result = await apiRequest('/api/tasks?limit=100&page=1');
      setTasks(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Unable to load tasks:', error.message || error);
    }
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      const result = await apiRequest('/api/notes?limit=100&page=1');
      setNotes(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Unable to load notes:', error.message || error);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const result = await apiRequest('/api/posts?limit=100&page=1');
      setPosts(Array.isArray(result.data?.posts) ? result.data.posts : []);
    } catch (error) {
      console.error('Unable to load posts:', error.message || error);
    }
  }, []);

  const loadReels = useCallback(async () => {
    try {
      const result = await apiRequest('/api/reels');
      setReels(Array.isArray(result.data?.reels) ? result.data.reels : Array.isArray(result.reels) ? result.reels : []);
    } catch (error) {
      console.error('Unable to load reels:', error.message || error);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const result = await apiRequest('/api/profile');
      const data = result.data?.profile || result.data || null;
      setProfile(data);
      if (data) setUser(data);
      return data;
    } catch (error) {
      console.error('Unable to load profile:', error.message || error);
      return null;
    }
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      await Promise.allSettled([loadTasks(), loadNotes(), loadPosts(), loadReels(), loadProfile()]);
    } catch (error) {
      console.error('Unable to load user data:', error.message || error);
    }
  }, [loadTasks, loadNotes, loadPosts, loadReels, loadProfile]);

  const checkAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const result = await apiRequest('/api/auth/me');
      const currentUser = result.data?.user || result.user || null;
      if (currentUser) {
        setUser(currentUser);
        setProfile(currentUser);
        await Promise.allSettled([loadTasks(), loadNotes(), loadPosts(), loadReels()]);
      } else {
        setUser(null);
      }
    } catch (_) {
      setUser(null);
    } finally {
      setAuthLoading(false);
      setReady(true);
    }
  }, [loadTasks, loadNotes, loadPosts, loadReels]);

  const login = useCallback(
    async (email, password) => {
      const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      const loggedUser = result.data?.user || result.user;
      const token = result.data?.token || result.token;
      if (token) localStorage.setItem('studyvault_token', token);
      setUser(loggedUser);
      setProfile(loggedUser);
      await loadUserData();
      return loggedUser;
    },
    [loadUserData]
  );

  const register = useCallback(
    async (payload) => {
      const result = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: payload,
      });
      const registeredUser = result.data?.user || result.user;
      const token = result.data?.token || result.token;
      if (token) localStorage.setItem('studyvault_token', token);
      setUser(registeredUser);
      setProfile(registeredUser);
      await loadUserData();
      return registeredUser;
    },
    [loadUserData]
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (_) {
      // ignore network failure on logout
    } finally {
      localStorage.removeItem('studyvault_token');
      setUser(null);
      setProfile(null);
      setTasks([]);
      setNotes([]);
      setPosts([]);
      closeChat();
      disconnectSocket();
      setActiveView('vault-view');
    }
  }, []);

  const createTask = useCallback(
    async (values) => {
      const result = await apiRequest('/api/tasks', {
        method: 'POST',
        body: {
          subject: values.subject,
          title: values.title,
          content: values.content,
          priority: values.priority,
          due_date: values.due_date || null,
          completed: false,
        },
      });
      await loadTasks();
      return result;
    },
    [loadTasks]
  );

  const createNote = useCallback(
    async (values) => {
      const result = await apiRequest('/api/notes', {
        method: 'POST',
        body: { title: values.title, content: values.content, theme: values.theme },
      });
      await loadNotes();
      return result;
    },
    [loadNotes]
  );

  const createPost = useCallback(
    async (values) => {
      let mediaUrl = values.media_url;
      if (values.media_file) {
        try {
          mediaUrl = await uploadMedia(values.media_file);
        } catch (error) {
          throw new Error(`Media upload failed: ${error.message}`);
        }
      }

      const result = await apiRequest('/api/posts', {
        method: 'POST',
        body: {
          title: values.title,
          content: values.content,
          hashtags: values.hashtags,
          visibility: values.visibility,
          scheduled_date: values.scheduled_date || null,
          media_url: mediaUrl || null,
          media_type: values.media_type || null,
          category: 'startup',
        },
      });
      await loadPosts();
      return result;
    },
    [loadPosts]
  );

  const updatePost = useCallback(
    async (id, values) => {
      let mediaUrl = values.media_url;
      if (values.media_file) {
        try {
          mediaUrl = await uploadMedia(values.media_file);
        } catch (error) {
          throw new Error(`Media upload failed: ${error.message}`);
        }
      }

      const result = await apiRequest(`/api/posts/${id}`, {
        method: 'PUT',
        body: {
          title: values.title,
          content: values.content,
          hashtags: values.hashtags,
          visibility: values.visibility,
          scheduled_date: values.scheduled_date || null,
          media_url: mediaUrl || values.media_url || null,
          media_type: values.media_type || null,
        },
      });
      await loadPosts();
      return result;
    },
    [loadPosts]
  );

  const [storyRefreshTrigger, setStoryRefreshTrigger] = useState(0);
  const refreshStories = useCallback(async () => {
    setStoryRefreshTrigger((v) => v + 1);
  }, []);

  const toggleTaskCompletion = useCallback(
    async (task, completed) => {
      await apiRequest(`/api/tasks/${task.id}/complete`, { method: 'PATCH', body: { completed } });
      await loadTasks();
    },
    [loadTasks]
  );

  const deleteTask = useCallback(
    async (task) => {
      await apiRequest(`/api/tasks/${task.id}`, { method: 'DELETE' });
      await loadTasks();
    },
    [loadTasks]
  );

  const toggleLike = useCallback(
    async (post) => {
      const method = post.liked ? 'DELETE' : 'POST';
      await apiRequest(`/api/interactions/posts/${post.id}/like`, { method });
      await loadPosts();
    },
    [loadPosts]
  );

  const toggleSave = useCallback(
    async (post) => {
      const method = post.saved ? 'DELETE' : 'POST';
      await apiRequest(`/api/interactions/posts/${post.id}/save`, { method });
      await loadPosts();
    },
    [loadPosts]
  );

  const loadSuggestions = useCallback(async (post) => {
    try {
      const result = await apiRequest(`/api/interactions/posts/${post.id}/suggestions`);
      const items = Array.isArray(result.data?.suggestions)
        ? result.data.suggestions
        : Array.isArray(result.data)
          ? result.data
          : [];
      const texts = items.map((item) => item.content).filter(Boolean);
      setSuggestions((prev) => ({ ...prev, [post.id]: texts }));
      return texts;
    } catch (error) {
      console.error('Unable to load suggestions:', error.message || error);
      return [];
    }
  }, []);

  const submitSuggestion = useCallback(
    async (post, content) => {
      await apiRequest(`/api/interactions/posts/${post.id}/suggestions`, {
        method: 'POST',
        body: { content },
      });
      await loadSuggestions(post);
    },
    [loadSuggestions]
  );

  const updateProfile = useCallback(
    async (payload) => {
      const result = await apiRequest('/api/profile', { method: 'PUT', body: payload });
      await loadProfile();
      return result;
    },
    [loadProfile]
  );

  const streakCount = profile?.streak_count || user?.streak_count || 0;

  const loadConversation = useCallback(async (id, socket) => {
    seenMessageIdsRef.current.clear();
    if (socket && socket.connected) {
      socket.emit('join_conversation', { conversationId: id }, () => {});
    }
    try {
      const response = await apiRequest(`/api/conversations/${id}/messages`);
      const list = Array.isArray(response.data?.messages)
        ? response.data.messages
        : Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.messages)
            ? response.messages
            : [];

      list.forEach((message) => {
        if (message.id) seenMessageIdsRef.current.add(message.id);
      });
      setMessages(list);
      setContactStatus('Online now');
    } catch (error) {
      console.error('Unable to load conversation history:', error);
    }
  }, []);

  const [conversationSettings, setConversationSettings] = useState({
    theme_id: 'minimalist',
    nickname: null,
    muted_until: null,
  });

  const loadConversationSettings = useCallback(async (id) => {
    try {
      const res = await apiRequest(`/api/conversations/${id}/settings`);
      const settings = res.data?.settings || res.settings || { theme_id: 'minimalist', nickname: null, muted_until: null };
      setConversationSettings(settings);
      return settings;
    } catch (err) {
      console.error('Unable to load conversation settings:', err);
      return { theme_id: 'minimalist', nickname: null, muted_until: null };
    }
  }, []);

  const updateChatTheme = useCallback(async (id, themeId) => {
    try {
      const res = await apiRequest(`/api/conversations/${id}/theme`, {
        method: 'PUT',
        body: { theme_id: themeId },
      });
      const settings = res.data?.settings || res.settings;
      if (settings) {
        setConversationSettings((prev) => ({ ...prev, ...settings }));
      }
      return settings;
    } catch (err) {
      console.error('Unable to update theme:', err);
    }
  }, []);

  const updateChatNickname = useCallback(async (id, nickname) => {
    try {
      const res = await apiRequest(`/api/conversations/${id}/nickname`, {
        method: 'PUT',
        body: { nickname },
      });
      const settings = res.data?.settings || res.settings;
      if (settings) {
        setConversationSettings((prev) => ({ ...prev, ...settings }));
      }
      return settings;
    } catch (err) {
      console.error('Unable to update nickname:', err);
    }
  }, []);

  const updateChatMute = useCallback(async (id, duration) => {
    try {
      const res = await apiRequest(`/api/conversations/${id}/mute`, {
        method: 'POST',
        body: { duration },
      });
      const settings = res.data?.settings || res.settings;
      if (settings) {
        setConversationSettings((prev) => ({ ...prev, ...settings }));
      }
      return settings;
    } catch (err) {
      console.error('Unable to update mute:', err);
    }
  }, []);

  const clearChatMessages = useCallback(async (id) => {
    try {
      await apiRequest(`/api/conversations/${id}/clear`, { method: 'POST' });
      setMessages([]);
    } catch (err) {
      console.error('Unable to clear chat:', err);
    }
  }, []);

  const openConversation = useCallback(
    async (contact) => {
      const contactName = typeof contact === 'string' ? contact : contact.name;
      setActiveContact(contactName);
      setChatOpen(true);
      if (window.location.hash !== `#messages/${contactName.toLowerCase()}`) {
        window.history.pushState(null, '', `#messages/${contactName.toLowerCase()}`);
      }
      const socket = connectSocket();
      socketRef.current = socket;

      socket.off('new_message');
      socket.on('new_message', (message) => {
        if (message.conversation_id !== conversationIdRef.current) return;
        setMessages((prev) => {
          if (seenMessageIdsRef.current.has(message.id)) return prev;
          seenMessageIdsRef.current.add(message.id);
          return [...prev, message];
        });
        loadProfile();
      });

      socket.off('typing_start');
      socket.on('typing_start', ({ conversationId: cid, username }) => {
        if (cid !== conversationIdRef.current || username === currentUserName) return;
        setContactStatus(`${username} is typing...`);
      });

      socket.off('typing_stop');
      socket.on('typing_stop', ({ conversationId: cid }) => {
        if (cid !== conversationIdRef.current) return;
        setContactStatus('Online now');
      });

      try {
        const result = await apiRequest('/api/conversations', {
          method: 'POST',
          body: { participants: [contactName] },
        });
        const id = result.data?.conversation?.id || result.data?.id || result.conversation?.id || result.id;
        conversationIdRef.current = id;
        setConversationId(id);
        await Promise.all([loadConversation(id, socket), loadConversationSettings(id)]);
      } catch (error) {
        console.error('Unable to open conversation:', error);
      }
    },
    [currentUserName, loadConversation, loadConversationSettings, loadProfile]
  );

  const closeChat = useCallback(() => {
    conversationIdRef.current = null;
    setChatOpen(false);
    setActiveContact(null);
    setConversationId(null);
    setMessages([]);
    setConversationSettings({ theme_id: 'minimalist', nickname: null, muted_until: null });
    setContactStatus('Online now');
    if (window.location.hash.startsWith('#messages/')) {
      window.history.pushState(null, '', '#messages');
    }
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      const trimmed = String(content || '').trim();
      const id = conversationIdRef.current;
      if (!id || !trimmed) return null;

      const socket = getSocket() || connectSocket();

      return new Promise((resolve, reject) => {
        let acked = false;

        if (socket && socket.connected) {
          socket.emit('send_message', { conversationId: id, content: trimmed }, (response) => {
            acked = true;
            if (response?.error) {
              const err = new Error(typeof response.error === 'string' ? response.error : response.error.message || 'Failed to send message');
              reject(err);
            } else {
              const msgData = response?.data || response?.message || response;
              if (msgData && msgData.id) {
                setMessages((prev) => {
                  if (seenMessageIdsRef.current.has(msgData.id)) return prev;
                  seenMessageIdsRef.current.add(msgData.id);
                  return [...prev, msgData];
                });
              }
              loadProfile();
              resolve(msgData);
            }
          });
        }

        setTimeout(async () => {
          if (!acked) {
            try {
              const result = await apiRequest(`/api/conversations/${id}/messages`, {
                method: 'POST',
                body: { content: trimmed },
              });
              const msgData = result.data?.message || result.data || result.message;
              if (msgData && msgData.id) {
                setMessages((prev) => {
                  if (seenMessageIdsRef.current.has(msgData.id)) return prev;
                  seenMessageIdsRef.current.add(msgData.id);
                  return [...prev, msgData];
                });
              }
              loadProfile();
              resolve(msgData);
            } catch (err) {
              reject(err);
            }
          }
        }, 1200);

        socket.emit('typing_stop', { conversationId: id });
        isTypingRef.current = false;
      });
    },
    [loadProfile]
  );

  const startTyping = useCallback(() => {
    const socket = getSocket();
    const id = conversationIdRef.current;
    if (!socket || !id || isTypingRef.current) return;
    isTypingRef.current = true;
    socket.emit('typing_start', { conversationId: id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing_stop', { conversationId: id });
    }, 2000);
  }, []);

  const navigate = useCallback((view) => {
    setActiveView(view);
    if (view !== 'messages-view') {
      closeChat();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [closeChat]);

  useEffect(() => {
    checkAuth();
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [checkAuth]);

  const noteThemes = useMemo(
    () => ({
      lavender: 'linear-gradient(135deg,#f1edff,#ffffff)',
      sunrise: 'linear-gradient(135deg,#fff1d6,#ffffff)',
      mint: 'linear-gradient(135deg,#dcf8ed,#ffffff)',
      midnight: 'linear-gradient(135deg,#202942,#39466b)',
    }),
    []
  );

  const vaultTasks = useMemo(
    () => tasks.filter((t) => t.category === 'vault' || !t.category),
    [tasks]
  );
  const filteredTasks = useMemo(() => {
    if (activeFilter === 'all') return vaultTasks;
    if (activeFilter === 'open') return vaultTasks.filter((t) => !t.completed);
    return vaultTasks.filter((t) => t.completed);
  }, [vaultTasks, activeFilter]);

  const totalCount = vaultTasks.length;
  const openCount = vaultTasks.filter((t) => !t.completed).length;
  const priorityCount = vaultTasks.filter((t) => !t.completed && t.priority === 'High').length;



  const createReel = useCallback(
    async (values) => {
      let videoUrl = values.video_url;
      if (values.video_file) {
        try {
          videoUrl = await uploadMedia(values.video_file);
        } catch (error) {
          throw new Error(`Video upload failed: ${error.message}`);
        }
      }
      let coverUrl = values.cover_url;
      if (values.cover_file) {
        try {
          coverUrl = await uploadMedia(values.cover_file);
        } catch (_) {}
      }

      const result = await apiRequest('/api/reels', {
        method: 'POST',
        body: {
          video_url: videoUrl,
          cover_url: coverUrl || null,
          caption: values.caption,
          hashtags: values.hashtags,
          visibility: values.visibility || 'public',
        },
      });
      await loadReels();
      return result;
    },
    [loadReels]
  );

  const likeReel = useCallback(
    async (reelId) => {
      setReels((prev) =>
        prev.map((r) =>
          r.id === reelId
            ? {
                ...r,
                liked: !r.liked,
                likes_count: r.liked ? Math.max(0, r.likes_count - 1) : r.likes_count + 1,
              }
            : r
        )
      );
      try {
        await apiRequest(`/api/reels/${reelId}/like`, { method: 'POST' });
      } catch (err) {
        console.error('Like reel failed:', err);
        await loadReels();
      }
    },
    [loadReels]
  );

  const saveReel = useCallback(
    async (reelId) => {
      setReels((prev) =>
        prev.map((r) => (r.id === reelId ? { ...r, saved: !r.saved } : r))
      );
      try {
        await apiRequest(`/api/reels/${reelId}/save`, { method: 'POST' });
      } catch (err) {
        console.error('Save reel failed:', err);
        await loadReels();
      }
    },
    [loadReels]
  );

  const shareReel = useCallback(
    async (reelId) => {
      setReels((prev) =>
        prev.map((r) => (r.id === reelId ? { ...r, shares_count: (r.shares_count || 0) + 1 } : r))
      );
      try {
        await apiRequest(`/api/reels/${reelId}/share`, { method: 'POST' });
      } catch (err) {
        console.error('Share reel failed:', err);
      }
    },
    []
  );

  const viewReel = useCallback(
    async (reelId) => {
      try {
        await apiRequest(`/api/reels/${reelId}/view`, { method: 'POST' });
      } catch (_) {}
    },
    []
  );

  const recordReelWatchTime = useCallback(
    async (reelId, watchedSeconds, completionPercentage, completed = false, replayed = false) => {
      try {
        await apiRequest(`/api/reels/${reelId}/watch`, {
          method: 'POST',
          body: {
            watched_seconds: watchedSeconds,
            completion_percentage: completionPercentage,
            completed,
            replayed,
          },
        });
      } catch (_) {}
    },
    []
  );


  const value = {
    user,
    isAuthenticated: Boolean(user),
    authLoading,
    ready,
    login,
    register,
    logout,
    tasks,
    notes,
    posts,
    reels,
    loadReels,
    createReel,
    likeReel,
    saveReel,
    shareReel,
    viewReel,
    recordReelWatchTime,
    isCreateChoiceOpen,
    setIsCreateChoiceOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createModalMedia,
    createModalMode,
    openCreateModal,
    closeCreateModal,
    isProfileMenuOpen,
    setIsProfileMenuOpen,
    activeReelIndex,
    setActiveReelIndex,
    profile,
    streakCount,
    activeView,
    activeFilter,
    navigate,
    setActiveFilter,
    filteredTasks,
    totalCount,
    openCount,
    priorityCount,
    noteThemes,
    activeContact,
    conversationId,
    conversationSettings,
    updateChatTheme,
    updateChatNickname,
    updateChatMute,
    clearChatMessages,
    messages,
    contactStatus,
    chatOpen,
    messageInput,
    setMessageInput,
    openConversation,
    closeChat,
    sendMessage,
    startTyping,
    suggestions,
    loadSuggestions,
    submitSuggestion,
    createTask,
    createNote,
    createPost,
    updatePost,
    loadTasks,
    loadNotes,
    loadPosts,
    refreshPosts: loadPosts,
    refreshReels: loadReels,
    refreshStories,
    storyRefreshTrigger,
    loadUserData,
    toggleTaskCompletion,
    deleteTask,
    toggleLike,
    toggleSave,
    updateProfile,
    loadProfile,
    theme,
    setTheme,
    isStoryOpen,
    setIsStoryOpen,
    showStoryActivity,
    openStoryActivity,
    closeStoryActivity,
    isAiHubOpen,
    openAiHub,
    closeAiHub,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
};
