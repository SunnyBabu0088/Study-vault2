import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest, uploadMedia } from '../api/client';
import { connectSocket, getSocket } from '../api/socket';

const StudyContext = createContext(null);

export const useStudy = () => {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
};

export const StudyProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  const [activeView, setActiveView] = useState('vault-view');
  const [activeFilter, setActiveFilter] = useState('all');

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

  const currentUserName = profile?.username || null;

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

  const loadProfile = useCallback(async () => {
    try {
      const result = await apiRequest('/api/profile');
      const data = result.data?.profile || result.data || null;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Unable to load profile:', error.message || error);
      return null;
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

  const streakCount = profile?.streak_count || 0;

  const loadConversation = useCallback(async (id, socket) => {
    seenMessageIdsRef.current.clear();
    if (socket && socket.connected) {
      socket.emit('join_conversation', { conversationId: id }, () => {});
    }
    try {
      const response = await apiRequest(`/api/conversations/${id}/messages`);
      const list = Array.isArray(response.data) ? response.data : [];
      list.forEach((message) => seenMessageIdsRef.current.add(message.id));
      setMessages(list);
      setContactStatus('Online now');
    } catch (error) {
      console.error('Unable to load conversation:', error);
    }
  }, []);

  const openConversation = useCallback(
    async (contact) => {
      setActiveContact(contact);
      setChatOpen(true);
      const socket = connectSocket();
      socketRef.current = socket;

      if (!socket.hasListeners('new_message')) {
        socket.on('new_message', (message) => {
          setMessages((prev) => {
            if (message.conversation_id !== conversationIdRef.current) return prev;
            if (seenMessageIdsRef.current.has(message.id)) return prev;
            seenMessageIdsRef.current.add(message.id);
            return [...prev, message];
          });
          loadProfile();
        });

        socket.on('typing_start', ({ conversationId: cid, username }) => {
          if (cid !== conversationIdRef.current || username === currentUserName) return;
          setContactStatus(`${username} is typing...`);
        });

        socket.on('typing_stop', ({ conversationId: cid }) => {
          if (cid !== conversationIdRef.current) return;
          setContactStatus('Online now');
        });

        socket.on('user_status', () => {});
      }

      try {
        const result = await apiRequest('/api/conversations', {
          method: 'POST',
          body: { participants: [contact] },
        });
        const id = result.data.id;
        conversationIdRef.current = id;
        setConversationId(id);
        await loadConversation(id, socket);
      } catch (error) {
        console.error('Unable to open conversation:', error);
      }
    },
    [currentUserName, loadConversation, loadProfile]
  );

  const closeChat = useCallback(() => {
    conversationIdRef.current = null;
    setChatOpen(false);
    setActiveContact(null);
    setConversationId(null);
    setMessages([]);
    setContactStatus('Online now');
  }, []);

  const sendMessage = useCallback(
    (content) => {
      const socket = getSocket();
      const id = conversationIdRef.current;
      if (!socket || !id || !content.trim()) return;

      socket.emit('send_message', { conversationId: id, content }, (response) => {
        if (response?.error) {
          console.error('Unable to send message:', response.error);
        } else if (response?.data) {
          setMessages((prev) => {
            if (seenMessageIdsRef.current.has(response.data.id)) return prev;
            seenMessageIdsRef.current.add(response.data.id);
            return [...prev, response.data];
          });
        }
        loadProfile();
      });

      socket.emit('typing_stop', { conversationId: id });
      isTypingRef.current = false;
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

  const initialize = useCallback(async () => {
    try {
      await Promise.all([loadTasks(), loadNotes(), loadPosts(), loadProfile()]);
    } catch (error) {
      console.error('Unable to initialize data:', error.message || error);
    } finally {
      setReady(true);
    }
  }, [loadTasks, loadNotes, loadPosts, loadProfile]);

  useEffect(() => {
    initialize();
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [initialize]);

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

  const value = {
    ready,
    tasks,
    notes,
    posts,
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
    toggleTaskCompletion,
    deleteTask,
    toggleLike,
    toggleSave,
    updateProfile,
    loadProfile,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
};
