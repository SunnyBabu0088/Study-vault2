import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Archive,
  ArrowLeft,
  Bookmark,
  Check,
  ChevronRight,
  Edit3,
  Grid,
  Heart,
  LogOut,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  Plus,
  Save,
  Shield,
  Sun,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
  Bell,
  MapPin,
  MessageSquare,
  AtSign,
  Share2,
  Slash,
  EyeOff,
  Lock,
  Ban,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { apiRequest, uploadMedia } from '../api/client';
import PostCard from './PostCard';
import StoryViewer from './StoryViewer';
import CreateMemoryModal from './CreateMemoryModal';
import AddStoryToMemoryModal from './AddStoryToMemoryModal';

export default function ProfileView() {
  const { profile, updateProfile, logout, posts, notes, user, theme, setTheme, isProfileMenuOpen, setIsProfileMenuOpen } = useStudy();

  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'saved' | 'tagged'
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedPostForModal, setSelectedPostForModal] = useState(null);

  // Settings Sub-Page State
  const [activeSettingsPage, setActiveSettingsPage] = useState(null);
  const [dbSettings, setDbSettings] = useState({
    notifications: { messages: true, story_replies: true, likes: true, study_reminders: true },
    privacy: { profile_visibility: 'public', story_visibility: 'everyone', location_sharing: false },
    academic: { college: 'StudyVault University', course: 'B.Tech', department: 'AIML', semester: 'Sem 4' },
    content: { show_like_counts: true, show_share_counts: true },
    app: { archive_stories: true, language: 'English', text_size: 'medium', high_contrast: false },
  });

  // Memories state
  const [memories, setMemories] = useState([]);
  const [showCreateMemory, setShowCreateMemory] = useState(false);
  const [activeMemoryIndex, setActiveMemoryIndex] = useState(null);
  const [selectedMemoryForAdd, setSelectedMemoryForAdd] = useState(null);

  // Profile Edit Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roll, setRoll] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Privacy & Controls States
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [closeFriends, setCloseFriends] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [closeFriendsSearch, setCloseFriendsSearch] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [storyLocationSettings, setStoryLocationSettings] = useState({
    story_privacy: 'everyone',
    story_replies: 'everyone',
    story_sharing: 'allow',
    location_sharing: 'off',
  });
  const [privacyToast, setPrivacyToast] = useState({ text: '', isError: false });

  const fetchAccountPrivacy = async () => {
    try {
      const res = await apiRequest('/api/privacy/account');
      const data = res.data || res;
      setIsPrivateAccount(Boolean(data.is_private));
    } catch (err) {
      console.error('Failed to fetch account privacy:', err);
    }
  };

  const handleToggleAccountPrivacy = async (newVal) => {
    setIsPrivateAccount(newVal);
    setPrivacyToast({ text: '', isError: false });
    try {
      const res = await apiRequest('/api/privacy/account', {
        method: 'PUT',
        body: { is_private: newVal },
      });
      const data = res.data || res;
      setIsPrivateAccount(Boolean(data.is_private));
      setPrivacyToast({ text: 'Privacy settings updated.', isError: false });
    } catch (err) {
      setIsPrivateAccount(!newVal);
      setPrivacyToast({ text: 'Unable to save settings. Please try again.', isError: true });
    }
  };

  const fetchCloseFriends = async () => {
    try {
      const res = await apiRequest('/api/privacy/close-friends');
      const data = res.data || res;
      setCloseFriends(data.close_friends || []);
      setAvailableUsers(data.available_users || []);
    } catch (err) {
      console.error('Failed to fetch close friends:', err);
    }
  };

  const handleAddCloseFriend = async (friendId) => {
    try {
      const res = await apiRequest('/api/privacy/close-friends', {
        method: 'POST',
        body: { friend_id: friendId },
      });
      const data = res.data || res;
      setCloseFriends(data.close_friends || []);
      setAvailableUsers(data.available_users || []);
      setPrivacyToast({ text: 'Added to Close Friends.', isError: false });
    } catch (err) {
      setPrivacyToast({ text: 'Unable to add close friend. Please try again.', isError: true });
    }
  };

  const handleRemoveCloseFriend = async (friendId) => {
    try {
      const res = await apiRequest(`/api/privacy/close-friends/${friendId}`, {
        method: 'DELETE',
      });
      const data = res.data || res;
      setCloseFriends(data.close_friends || []);
      setAvailableUsers(data.available_users || []);
      setPrivacyToast({ text: 'Removed from Close Friends.', isError: false });
    } catch (err) {
      setPrivacyToast({ text: 'Unable to remove close friend. Please try again.', isError: true });
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await apiRequest('/api/privacy/blocked');
      const data = res.data || res;
      setBlockedUsers(data.blocked_users || []);
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
    }
  };

  const handleUnblockUser = async (blockedUserId) => {
    try {
      const res = await apiRequest(`/api/privacy/blocked/${blockedUserId}`, {
        method: 'DELETE',
      });
      const data = res.data || res;
      setBlockedUsers(data.blocked_users || []);
      setPrivacyToast({ text: 'User unblocked successfully.', isError: false });
    } catch (err) {
      setPrivacyToast({ text: 'Unable to unblock user. Please try again.', isError: true });
    }
  };

  const fetchStoryLocationSettings = async () => {
    try {
      const res = await apiRequest('/api/privacy/story-location');
      const data = res.data || res;
      setStoryLocationSettings({
        story_privacy: data.story_privacy || 'everyone',
        story_replies: data.story_replies || 'everyone',
        story_sharing: data.story_sharing || 'allow',
        location_sharing: data.location_sharing || 'off',
      });
    } catch (err) {
      console.error('Failed to fetch story location settings:', err);
    }
  };

  const handleSaveStoryLocation = async (newPart) => {
    const updated = { ...storyLocationSettings, ...newPart };
    setStoryLocationSettings(updated);
    setPrivacyToast({ text: '', isError: false });
    try {
      const res = await apiRequest('/api/privacy/story-location', {
        method: 'PUT',
        body: updated,
      });
      const data = res.data || res;
      setStoryLocationSettings({
        story_privacy: data.story_privacy || 'everyone',
        story_replies: data.story_replies || 'everyone',
        story_sharing: data.story_sharing || 'allow',
        location_sharing: data.location_sharing || 'off',
      });
      setPrivacyToast({ text: 'Story & Location settings updated.', isError: false });
    } catch (err) {
      setPrivacyToast({ text: 'Unable to save settings. Please try again.', isError: true });
    }
  };

  useEffect(() => {
    setPrivacyToast({ text: '', isError: false });
    if (activeSettingsPage === 'privacy') {
      fetchAccountPrivacy();
    } else if (activeSettingsPage === 'close-friends') {
      fetchCloseFriends();
    } else if (activeSettingsPage === 'blocked') {
      fetchBlockedUsers();
    } else if (activeSettingsPage === 'story-location') {
      fetchStoryLocationSettings();
    }
  }, [activeSettingsPage]);

  const [availableStories, setAvailableStories] = useState([]);
  const avatarInputRef = useRef(null);

  const fetchMemories = async () => {
    try {
      const res = await apiRequest('/api/memories');
      const list = res.data?.memories || res.data?.highlights || res.memories || res.highlights || [];
      setMemories(list);
    } catch (err) {
      console.error('Unable to fetch memories:', err);
    }
  };

  const fetchUserStories = async () => {
    try {
      const res = await apiRequest('/api/stories');
      const list = res.data?.stories || res.stories || [];
      const formatted = list.map((s) => ({
        id: s.id,
        seed: s.name || 'Story',
        name: s.name || 'Story',
        content: s.content,
      }));
      setAvailableStories(formatted);
    } catch (_) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await apiRequest('/api/settings');
      const s = res.data?.settings || res.settings;
      if (s) setDbSettings((prev) => ({ ...prev, ...s }));
    } catch (err) {
      console.error('Unable to fetch settings:', err);
    }
  };

  useEffect(() => {
    fetchMemories();
    fetchUserStories();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (profile || user) {
      const data = profile || user;
      setUsername(data.username || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setRoll(data.roll_number || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url || '');
    }
  }, [profile, user]);

  const currentUsername = username || user?.username || profile?.username || 'student';
  const currentUserId = user?.id || profile?.id;
  const defaultFallbackAvatar = `https://api.dicebear.com/6.x/avataaars/svg?seed=${encodeURIComponent(currentUsername)}`;
  const displayAvatar = avatarUrl || profile?.avatar_url || user?.avatar_url || defaultFallbackAvatar;

  const { userPosts, savedPosts } = useMemo(() => {
    const my = [];
    const saved = [];

    (posts || []).forEach((post) => {
      if (post.saved) saved.push(post);

      const isMine =
        (currentUserId && String(post.user_id) === String(currentUserId)) ||
        (post.author_username && post.author_username.toLowerCase() === (user?.username || '').toLowerCase()) ||
        (post.author_username && post.author_username.toLowerCase() === (profile?.username || '').toLowerCase()) ||
        (!post.user_id && !post.author_username);

      if (isMine) my.push(post);
    });

    return { userPosts: my.length > 0 ? my : (posts || []), savedPosts: saved };
  }, [posts, currentUserId, user?.username, profile?.username]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadMedia(file);
      if (url) {
        setAvatarUrl(url);
        await updateProfile({ avatar_url: url });
        setMessage('Profile picture updated successfully');
        setMessageError(false);
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setMessage(err.message || 'Avatar upload failed');
      setMessageError(true);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        roll_number: roll.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      });
      setMessage('Profile updated successfully');
      setMessageError(false);
      setTimeout(() => {
        setShowEditModal(false);
        setMessage('');
      }, 700);
    } catch (error) {
      setMessage(error.message || 'Unable to update profile. Please try again.');
      setMessageError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSettingsDb = async (newPart) => {
    try {
      const updated = { ...dbSettings, ...newPart };
      setDbSettings(updated);
      await apiRequest('/api/settings', {
        method: 'PUT',
        body: newPart,
      });
    } catch (err) {
      console.error('Failed to update settings in DB:', err);
    }
  };

  const viewerMemoryStories = useMemo(() => {
    if (activeMemoryIndex === null || !memories[activeMemoryIndex]) return [];
    const mem = memories[activeMemoryIndex];
    const storiesList = mem.stories || [];

    if (storiesList.length === 0) {
      return [
        {
          id: `empty-${mem.id}`,
          memoryId: mem.id,
          highlightId: mem.id,
          seed: mem.name,
          name: mem.name,
          you: true,
          presence: 'presence-online',
          statusText: `Memory · ${mem.name}`,
          content: `No stories in "${mem.name}" yet. Tap "+ Add story to memory" in the menu to add your active stories!`,
          timeAgo: 'Empty',
          gradient: 'linear-gradient(135deg, #FF3218 0%, #FF641F 45%, #FF9A32 75%, #FFD04A 100%)',
        },
      ];
    }

    return storiesList.map((st, i) => ({
      id: st.story_id || st.id || `st-${i}`,
      memoryId: mem.id,
      highlightId: mem.id,
      seed: `${mem.name}-${i}`,
      name: mem.name,
      you: true,
      presence: 'presence-online',
      statusText: `Memory · ${mem.name} (${i + 1}/${storiesList.length})`,
      content: st.content || `Story item #${i + 1} in ${mem.name}`,
      mediaUrl: st.media_url,
      mediaType: st.media_type,
      timeAgo: 'Saved',
      gradient: st.background || 'linear-gradient(135deg, #FF3218 0%, #FF641F 45%, #FF9A32 75%, #FFD04A 100%)',
    }));
  }, [activeMemoryIndex, memories]);

  return (
    <section className="profile-section pt-1 pb-12 px-3 sm:px-6 max-w-3xl mx-auto transition-all">
      {/* 1. Instagram-Style Profile Header (Avatar Left, Username & Stats Right) */}
      <div className="mt-2 flex flex-col space-y-4">
        <div className="flex items-center gap-5 sm:gap-8">
          {/* Avatar Left (90px - 110px) */}
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-full p-1 border-2 border-[var(--brand-orange)] shadow-md bg-[var(--surface)]">
            <img
              className="h-full w-full rounded-full object-cover"
              src={displayAvatar}
              alt=""
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultFallbackAvatar;
              }}
            />
          </div>

          {/* Right of Avatar: Username, Handle, Stats */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h2 className="m-0 text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] truncate">
                {currentUsername}
              </h2>
              <p className="m-0 text-xs font-semibold text-[var(--text-muted)]">@{currentUsername.toLowerCase()}</p>
              {roll && (
                <p className="mt-0.5 m-0 text-xs text-[var(--brand-orange)] font-semibold">
                  Roll No: {roll}
                </p>
              )}
            </div>

            {/* Stats: Posts  Friends  Following (No Divider Lines) */}
            <div className="flex items-center gap-6 sm:gap-8 text-center">
              <div>
                <p className="m-0 text-base font-bold text-[var(--text-primary)]">{userPosts.length}</p>
                <p className="m-0 text-[11px] text-[var(--text-muted)] font-medium">Posts</p>
              </div>
              <div>
                <p className="m-0 text-base font-bold text-[var(--text-primary)]">{profile?.friends_count || 120}</p>
                <p className="m-0 text-[11px] text-[var(--text-muted)] font-medium">Friends</p>
              </div>
              <div>
                <p className="m-0 text-base font-bold text-[var(--text-primary)]">{profile?.following_count || 85}</p>
                <p className="m-0 text-[11px] text-[var(--text-muted)] font-medium">Following</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="pt-1">
          <p className="m-0 text-xs text-[var(--text-primary)] leading-relaxed font-medium">
            {bio ? bio : 'Everything is possible for one who believes.'}
          </p>
        </div>

        {/* Action Buttons (Edit Profile | View Archive) */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] py-2.5 text-xs font-bold text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--border-color)] cursor-pointer"
            onClick={() => setShowEditModal(true)}
          >
            <Edit3 className="h-4 w-4 text-[var(--brand-orange)]" /> Edit Profile
          </button>

          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] py-2.5 text-xs font-bold text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--border-color)] cursor-pointer"
            onClick={() => setShowArchiveModal(true)}
          >
            <Archive className="h-4 w-4 text-[#e04980]" /> View Archive
          </button>
        </div>
      </div>

      {/* 3. Memories Section */}
      <div className="mt-8 pt-4 border-t border-[var(--border-color)]">
        <p className="m-0 mb-3 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
          MEMORIES
        </p>

        <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none">
          {memories.map((mem, idx) => (
            <div key={mem.id} className="relative w-[70px] shrink-0 text-center">
              <button
                type="button"
                className="mx-auto grid h-[64px] w-[64px] place-items-center rounded-full p-0.5 shadow-xs transition hover:scale-105 cursor-pointer"
                style={{ background: 'var(--brand-gradient)' }}
                onClick={() => setActiveMemoryIndex(idx)}
                aria-label={`Open memory ${mem.name}`}
              >
                <img
                  className="h-full w-full rounded-full border-2 border-[var(--surface)] object-cover"
                  src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${mem.name}`}
                  alt=""
                />
              </button>
              <p className="mt-1.5 m-0 truncate text-[11px] font-bold text-[var(--text-primary)]">{mem.name}</p>
            </div>
          ))}

          {/* Creation (+) Button Item */}
          <div className="w-[70px] shrink-0 text-center">
            <button
              type="button"
              className="mx-auto grid h-[64px] w-[64px] place-items-center rounded-full border-2 border-dashed border-[var(--brand-orange)] bg-[var(--brand-soft)] text-[var(--brand-orange)] transition hover:scale-105 cursor-pointer"
              onClick={() => setShowCreateMemory(true)}
              aria-label="New Memory"
              title="Create New Memory"
            >
              <Plus className="h-6 w-6" />
            </button>
            <p className="mt-1.5 m-0 truncate text-[11px] font-bold text-[var(--brand-orange)]">New (+)</p>
          </div>
        </div>
      </div>

      {/* 4. Profile Content Tabs (Posts | Saved | Tagged) */}
      <div className="mt-6 flex border-b border-[var(--border-color)] text-center">
        <button
          type="button"
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'posts'
              ? 'border-[var(--brand-orange)] text-[var(--brand-orange)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setActiveTab('posts')}
        >
          <Grid className="h-4 w-4" /> Posts ({userPosts.length})
        </button>
        <button
          type="button"
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'saved'
              ? 'border-[var(--brand-orange)] text-[var(--brand-orange)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark className="h-4 w-4" /> Saved ({savedPosts.length})
        </button>
        <button
          type="button"
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'tagged'
              ? 'border-[var(--brand-orange)] text-[var(--brand-orange)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setActiveTab('tagged')}
        >
          <Tag className="h-4 w-4" /> Tagged ({notes.length})
        </button>
      </div>

      {/* 5. Tab Content Displays */}
      <div className="mt-4">
        {/* Posts Tab: 3-Column Instagram Square Grid */}
        {activeTab === 'posts' && (
          <div>
            {userPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="group relative aspect-square w-full overflow-hidden rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-color)] cursor-pointer"
                    onClick={() => setSelectedPostForModal(post)}
                  >
                    {post.media_url ? (
                      post.media_type === 'video' ? (
                        <video src={post.media_url} className="h-full w-full object-cover" />
                      ) : (
                        <img src={post.media_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                      )
                    ) : (
                      <div className="flex h-full w-full flex-col justify-between p-2.5 bg-gradient-to-br from-[#3b52cf]/10 via-purple-500/5 to-rose-500/10">
                        <span className="text-[10px] font-bold text-[#3b52cf] uppercase tracking-wider">{post.category || 'Note'}</span>
                        <p className="m-0 text-xs font-bold text-[var(--text-primary)] line-clamp-3 leading-tight">{post.title || post.content}</p>
                        <span className="text-[9px] text-[var(--text-muted)] font-medium">StudyVault</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-secondary)] px-5 py-12 text-center">
                <p className="font-bold text-sm text-[var(--text-primary)] m-0">No posts yet</p>
                <p className="mt-1 text-xs text-[var(--text-muted)] m-0">Your published notes and startup ideas will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Saved Tab: 3-Column Square Grid */}
        {activeTab === 'saved' && (
          <div>
            {savedPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                {savedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="group relative aspect-square w-full overflow-hidden rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-color)] cursor-pointer"
                    onClick={() => setSelectedPostForModal(post)}
                  >
                    {post.media_url ? (
                      post.media_type === 'video' ? (
                        <video src={post.media_url} className="h-full w-full object-cover" />
                      ) : (
                        <img src={post.media_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                      )
                    ) : (
                      <div className="flex h-full w-full flex-col justify-between p-2.5 bg-gradient-to-br from-amber-500/10 to-[#3b52cf]/10">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Saved</span>
                        <p className="m-0 text-xs font-bold text-[var(--text-primary)] line-clamp-3 leading-tight">{post.title || post.content}</p>
                        <span className="text-[9px] text-[var(--text-muted)] font-medium">Bookmark</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-secondary)] px-5 py-12 text-center">
                <p className="font-bold text-sm text-[var(--text-primary)] m-0">No saved posts yet</p>
                <p className="mt-1 text-xs text-[var(--text-muted)] m-0">Posts and reels you save will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Tagged Tab */}
        {activeTab === 'tagged' && (
          <div>
            {notes.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-2xl p-4 border border-[var(--border-color)] bg-[var(--surface)] shadow-xs">
                    <h4 className="m-0 font-bold text-sm text-[var(--text-primary)]">{note.title}</h4>
                    <p className="mt-1.5 m-0 text-xs text-[var(--text-secondary)] leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-secondary)] px-5 py-12 text-center">
                <p className="font-bold text-sm text-[var(--text-primary)] m-0">No tagged posts yet</p>
                <p className="mt-1 text-xs text-[var(--text-muted)] m-0">Tagged notes and study content will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Full-Screen Post Viewer Portal */}
      {selectedPostForModal && createPortal(
        <div
          className="fixed inset-0 z-[999999] flex h-[100dvh] w-[100vw] flex-col items-center justify-center bg-black/80 text-[var(--text-primary)] backdrop-blur-md select-none p-4"
          onClick={() => setSelectedPostForModal(null)}
        >
          <div
            className="relative flex h-full max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-color)] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3 bg-[var(--surface)] shrink-0">
              <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Post View</h3>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full bg-[var(--button-background)] text-[var(--text-primary)] cursor-pointer"
                onClick={() => setSelectedPostForModal(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <PostCard post={selectedPostForModal} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 7. Full-Screen View Archive Portal */}
      {showArchiveModal && createPortal(
        <div
          className="fixed inset-0 z-[999999] flex h-[100dvh] w-[100vw] flex-col overflow-y-auto bg-[var(--background)] text-[var(--text-primary)] select-none"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh', zIndex: 999999, backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
        >
          <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 shadow-xs">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] cursor-pointer hover:bg-[var(--border-color)] transition"
              onClick={() => setShowArchiveModal(false)}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="m-0 text-base font-bold text-[var(--text-primary)]">Archived Content</h2>
            <div className="w-16" />
          </div>

          <div className="flex-1 max-w-lg mx-auto w-full p-5 space-y-4">
            <p className="m-0 text-xs text-[var(--text-muted)] text-center">Only you can see your archived stories and posts.</p>
            {availableStories.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {availableStories.map((st) => (
                  <div key={st.id} className="rounded-2xl p-4 border border-[var(--border-color)] bg-[var(--surface)] space-y-1">
                    <p className="m-0 font-bold text-xs text-[var(--text-primary)]">{st.name}</p>
                    <p className="m-0 text-[11px] text-[var(--text-secondary)]">{st.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-secondary)] p-8 text-center">
                <Archive className="h-8 w-8 mx-auto text-[#e04980] mb-2" />
                <p className="font-bold text-sm text-[var(--text-primary)] m-0">No archived content yet</p>
                <p className="mt-1 text-xs text-[var(--text-muted)] m-0">Items you archive will appear here safely.</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 8. Full-Screen Edit Profile Page Portal */}
      {showEditModal && createPortal(
        <div
          className="fixed inset-0 z-[999999] flex h-[100dvh] w-[100vw] flex-col overflow-y-auto bg-[var(--background)] text-[var(--text-primary)] select-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 999999,
            backgroundColor: 'var(--background)',
            color: 'var(--text-primary)',
          }}
          aria-label="Full-Screen Edit Profile Page"
          role="dialog"
        >
          <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 shadow-xs">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] cursor-pointer hover:bg-[var(--border-color)] transition"
              onClick={() => setShowEditModal(false)}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="m-0 text-base font-bold text-[var(--text-primary)]">Edit Profile</h2>
            <div className="w-16" />
          </div>

          <div className="flex-1 max-w-lg mx-auto w-full p-5 space-y-5">
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            <div className="text-center">
              <div className="relative mx-auto h-24 w-24 rounded-full border-2 border-[#3b52cf] p-1 shadow-md bg-[var(--surface)]">
                <img
                  className="h-full w-full rounded-full object-cover"
                  src={displayAvatar}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultFallbackAvatar;
                  }}
                />
                <button
                  type="button"
                  className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-[#3b52cf] text-white shadow-md transition hover:scale-110 cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Upload profile picture"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                className="mt-3 text-xs font-bold text-[#3b52cf] hover:underline cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                {uploadingAvatar ? 'Uploading image…' : 'Change Profile Picture'}
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSaveProfile}>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Username</label>
                <input className="field text-sm" required value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Email</label>
                <input className="field text-sm" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Phone</label>
                <input className="field text-sm" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Roll Number</label>
                <input className="field text-sm" value={roll} onChange={(e) => setRoll(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Bio</label>
                <textarea className="field text-sm min-h-[90px] py-2.5" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              {message && (
                <div className={`p-3 rounded-xl text-center text-xs font-bold ${messageError ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {message}
                </div>
              )}
              <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#3b52cf] py-3 text-sm font-bold text-white shadow-md cursor-pointer hover:bg-[#2e42a8] transition" disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 9. Full-Screen Hamburger Profile Menu Portal ☰ */}
      {(isProfileMenuOpen || showMenuModal) && createPortal(
        <div
          className="fixed inset-0 z-[999999] flex h-[100dvh] w-[100vw] flex-col overflow-y-auto bg-[var(--background)] text-[var(--text-primary)] select-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 999999,
            backgroundColor: 'var(--background)',
            color: 'var(--text-primary)',
          }}
          aria-label="Full-Screen Menu"
          role="dialog"
        >
          <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 shadow-xs">
            {activeSettingsPage ? (
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-bold text-[#3b52cf] cursor-pointer hover:bg-[var(--border-color)] transition"
                onClick={() => setActiveSettingsPage(null)}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] cursor-pointer hover:bg-[var(--border-color)] transition"
                onClick={() => {
                  setShowMenuModal(false);
                  setIsProfileMenuOpen(false);
                }}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}

            <h2 className="m-0 text-base font-bold text-[var(--text-primary)]">
              {activeSettingsPage === 'privacy'
                ? 'Account Privacy'
                : activeSettingsPage === 'close-friends'
                ? 'Close Friends'
                : activeSettingsPage === 'blocked'
                ? 'Blocked Accounts'
                : activeSettingsPage === 'story-location'
                ? 'Story & Location Settings'
                : activeSettingsPage
                ? activeSettingsPage.replace('-', ' ')
                : 'Menu'}
            </h2>
            <div className="w-16" />
          </div>

          <div className="flex-1 max-w-lg mx-auto w-full p-5 space-y-6">
            {activeSettingsPage === 'privacy' ? (
              /* 1. Account Privacy Page */
              <div className="space-y-5">
                <div>
                  <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Account Privacy</h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)] m-0">
                    Control who can view your posts, stories, reels, and study profile.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="m-0 font-bold text-xs text-[var(--text-primary)]">Private Account</p>
                      <p className="m-0 text-[11px] text-[var(--text-muted)]">Only approved friends can view your content</p>
                    </div>
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        isPrivateAccount ? 'bg-[#3b52cf]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                      onClick={() => handleToggleAccountPrivacy(!isPrivateAccount)}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isPrivateAccount ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-4 space-y-3 text-xs">
                  <p className="m-0 font-bold text-[var(--text-primary)]">When your account is private:</p>
                  <ul className="m-0 pl-4 space-y-1.5 text-[var(--text-secondary)] list-disc">
                    <li>Only approved followers/friends can view private posts, reels, and stories.</li>
                    <li>Other users cannot freely access your profile content.</li>
                    <li>Follow requests require explicit approval.</li>
                  </ul>
                </div>

                {privacyToast.text && (
                  <div className={`p-3 rounded-xl text-center text-xs font-bold ${privacyToast.isError ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {privacyToast.text}
                  </div>
                )}
              </div>
            ) : activeSettingsPage === 'close-friends' ? (
              /* 2. Close Friends Page */
              <div className="space-y-5">
                <div>
                  <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Close Friends</h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)] m-0">
                    Share stories and study notes exclusively with your close circle.
                  </p>
                </div>

                <input
                  type="text"
                  className="field text-xs py-2.5"
                  placeholder="Search users…"
                  value={closeFriendsSearch}
                  onChange={(e) => setCloseFriendsSearch(e.target.value)}
                />

                {privacyToast.text && (
                  <div className={`p-3 rounded-xl text-center text-xs font-bold ${privacyToast.isError ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {privacyToast.text}
                  </div>
                )}

                {/* Close Friends List */}
                <div>
                  <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Your Close Friends ({closeFriends.length})
                  </p>
                  {closeFriends.length > 0 ? (
                    <div className="space-y-2">
                      {closeFriends
                        .filter((u) => u.username.toLowerCase().includes(closeFriendsSearch.toLowerCase()))
                        .map((u) => (
                          <div key={u.id} className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-3">
                            <div className="flex items-center gap-3">
                              <img
                                className="h-10 w-10 rounded-full object-cover border border-[var(--border-color)]"
                                src={u.avatar_url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${u.username}`}
                                alt=""
                              />
                              <div>
                                <p className="m-0 font-bold text-xs text-[var(--text-primary)]">{u.username}</p>
                                <p className="m-0 text-[11px] text-[var(--text-muted)]">{u.email || u.roll_number || 'Student'}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                              onClick={() => handleRemoveCloseFriend(u.id)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-secondary)] p-5 text-center text-xs text-[var(--text-muted)]">
                      No close friends added yet.
                    </div>
                  )}
                </div>

                {/* Available Users List */}
                <div>
                  <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Available Users
                  </p>
                  {availableUsers.length > 0 ? (
                    <div className="space-y-2">
                      {availableUsers
                        .filter((u) => u.username.toLowerCase().includes(closeFriendsSearch.toLowerCase()))
                        .map((u) => (
                          <div key={u.id} className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-3">
                            <div className="flex items-center gap-3">
                              <img
                                className="h-10 w-10 rounded-full object-cover border border-[var(--border-color)]"
                                src={u.avatar_url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${u.username}`}
                                alt=""
                              />
                              <div>
                                <p className="m-0 font-bold text-xs text-[var(--text-primary)]">{u.username}</p>
                                <p className="m-0 text-[11px] text-[var(--text-muted)]">{u.email || u.roll_number || 'Student'}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="rounded-xl bg-[#3b52cf] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#2e42a8] transition cursor-pointer"
                              onClick={() => handleAddCloseFriend(u.id)}
                            >
                              Add
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-secondary)] p-5 text-center text-xs text-[var(--text-muted)]">
                      No other available users found.
                    </div>
                  )}
                </div>
              </div>
            ) : activeSettingsPage === 'blocked' ? (
              /* 3. Blocked Accounts Page */
              <div className="space-y-5">
                <div>
                  <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Blocked Accounts</h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)] m-0">
                    Blocked accounts cannot interact with your posts, stories, or profile.
                  </p>
                </div>

                {privacyToast.text && (
                  <div className={`p-3 rounded-xl text-center text-xs font-bold ${privacyToast.isError ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {privacyToast.text}
                  </div>
                )}

                {blockedUsers.length > 0 ? (
                  <div className="space-y-2">
                    {blockedUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-3">
                        <div className="flex items-center gap-3">
                          <img
                            className="h-10 w-10 rounded-full object-cover border border-[var(--border-color)]"
                            src={u.avatar_url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${u.username}`}
                            alt=""
                          />
                          <div>
                            <p className="m-0 font-bold text-xs text-[var(--text-primary)]">{u.username}</p>
                            <p className="m-0 text-[11px] text-[var(--text-muted)]">{u.email || u.roll_number || 'Blocked User'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--border-color)] transition cursor-pointer"
                          onClick={() => handleUnblockUser(u.id)}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-secondary)] p-8 text-center space-y-1">
                    <EyeOff className="h-8 w-8 mx-auto text-[var(--text-muted)] mb-2" />
                    <p className="font-bold text-sm text-[var(--text-primary)] m-0">No blocked accounts</p>
                    <p className="text-xs text-[var(--text-muted)] m-0">Accounts you block will appear here.</p>
                  </div>
                )}
              </div>
            ) : activeSettingsPage === 'story-location' ? (
              /* 4. Story & Location Settings Page */
              <div className="space-y-5">
                <div>
                  <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Story & Location Settings</h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)] m-0">
                    Manage who can view your stories, send replies, and see your location.
                  </p>
                </div>

                {privacyToast.text && (
                  <div className={`p-3 rounded-xl text-center text-xs font-bold ${privacyToast.isError ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {privacyToast.text}
                  </div>
                )}

                {/* Story Privacy */}
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-4 space-y-3">
                  <p className="m-0 font-bold text-xs text-[var(--text-primary)]">Story Privacy</p>
                  <div className="space-y-2 text-xs">
                    {[
                      { id: 'everyone', label: 'Everyone' },
                      { id: 'friends', label: 'Friends' },
                      { id: 'close_friends', label: 'Close Friends' },
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-[var(--surface-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">{opt.label}</span>
                        <input
                          type="radio"
                          name="story_privacy"
                          checked={storyLocationSettings.story_privacy === opt.id}
                          onChange={() => handleSaveStoryLocation({ story_privacy: opt.id })}
                          className="accent-[#3b52cf] h-4 w-4"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Story Replies */}
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-4 space-y-3">
                  <p className="m-0 font-bold text-xs text-[var(--text-primary)]">Story Replies</p>
                  <div className="space-y-2 text-xs">
                    {[
                      { id: 'everyone', label: 'Everyone' },
                      { id: 'following', label: 'People you follow' },
                      { id: 'off', label: 'Off' },
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-[var(--surface-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">{opt.label}</span>
                        <input
                          type="radio"
                          name="story_replies"
                          checked={storyLocationSettings.story_replies === opt.id}
                          onChange={() => handleSaveStoryLocation({ story_replies: opt.id })}
                          className="accent-[#3b52cf] h-4 w-4"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Story Sharing */}
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-4 space-y-3">
                  <p className="m-0 font-bold text-xs text-[var(--text-primary)]">Story Sharing</p>
                  <div className="space-y-2 text-xs">
                    {[
                      { id: 'allow', label: 'Allow sharing' },
                      { id: 'disable', label: 'Disable sharing' },
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-[var(--surface-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">{opt.label}</span>
                        <input
                          type="radio"
                          name="story_sharing"
                          checked={storyLocationSettings.story_sharing === opt.id}
                          onChange={() => handleSaveStoryLocation({ story_sharing: opt.id })}
                          className="accent-[#3b52cf] h-4 w-4"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location Sharing */}
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-4 space-y-3">
                  <p className="m-0 font-bold text-xs text-[var(--text-primary)]">Location Sharing</p>
                  <p className="m-0 text-[11px] text-[var(--text-muted)]">Defaults to Off for maximum privacy.</p>
                  <div className="space-y-2 text-xs pt-1">
                    {[
                      { id: 'off', label: 'Off (Recommended)' },
                      { id: 'posting', label: 'Only while posting' },
                      { id: 'friends', label: 'Friends' },
                      { id: 'close_friends', label: 'Close Friends' },
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-[var(--surface-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">{opt.label}</span>
                        <input
                          type="radio"
                          name="location_sharing"
                          checked={storyLocationSettings.location_sharing === opt.id}
                          onChange={() => handleSaveStoryLocation({ location_sharing: opt.id })}
                          className="accent-[#3b52cf] h-4 w-4"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeSettingsPage === 'notifications' ? (
              <div className="space-y-4">
                <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Notifications Settings</h3>
                <div className="space-y-3">
                  {Object.entries(dbSettings.notifications || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between rounded-xl border border-[var(--border-color)] p-3.5 text-xs bg-[var(--surface)]">
                      <span className="font-semibold text-[var(--text-primary)] capitalize">{key.replace('_', ' ')}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={(e) =>
                          handleUpdateSettingsDb({
                            notifications: { ...dbSettings.notifications, [key]: e.target.checked },
                          })
                        }
                        className="h-4 w-4 rounded accent-[#3b52cf]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : activeSettingsPage === 'appearance' ? (
              <div className="space-y-4">
                <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Appearance & Theme</h3>
                <p className="text-xs text-[var(--text-muted)] m-0">Select your preferred visual style for StudyVault.</p>
                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-xs font-bold transition cursor-pointer ${
                      theme === 'light'
                        ? 'border-[#3b52cf] bg-[#3b52cf]/10 text-[#3b52cf]'
                        : 'border-[var(--border-color)] bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-color)]'
                    }`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="flex items-center gap-3"><Sun className="h-5 w-5 text-amber-500" /> Light Mode</div>
                    {theme === 'light' && <Check className="h-5 w-5 text-[#3b52cf]" />}
                  </button>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-xs font-bold transition cursor-pointer ${
                      theme === 'dark'
                        ? 'border-[#3b52cf] bg-[#3b52cf]/10 text-[#3b52cf]'
                        : 'border-[var(--border-color)] bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-color)]'
                    }`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="flex items-center gap-3"><Moon className="h-5 w-5 text-indigo-400" /> Dark Mode</div>
                    {theme === 'dark' && <Check className="h-5 w-5 text-[#3b52cf]" />}
                  </button>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-xs font-bold transition cursor-pointer ${
                      theme === 'system'
                        ? 'border-[#3b52cf] bg-[#3b52cf]/10 text-[#3b52cf]'
                        : 'border-[var(--border-color)] bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-color)]'
                    }`}
                    onClick={() => setTheme('system')}
                  >
                    <div className="flex items-center gap-3"><Monitor className="h-5 w-5 text-[var(--text-secondary)]" /> System Default</div>
                    {theme === 'system' && <Check className="h-5 w-5 text-[#3b52cf]" />}
                  </button>
                </div>
              </div>
            ) : activeSettingsPage ? (
              <div className="space-y-4">
                <h3 className="m-0 text-sm font-bold text-[var(--text-primary)] capitalize">
                  {activeSettingsPage.replace('-', ' ')}
                </h3>
                <p className="text-xs text-[var(--text-muted)] m-0">Configure preferences for {activeSettingsPage.replace('-', ' ')}.</p>
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--text-primary)]">Enable Feature</span>
                    <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#3b52cf]" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Profile Actions</p>
                  <div className="space-y-1.5">
                    <button type="button" className="w-full flex items-center justify-between rounded-xl p-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition cursor-pointer text-left" onClick={() => { setShowMenuModal(false); setIsProfileMenuOpen(false); setShowEditModal(true); }}>
                      <span className="flex items-center gap-3"><Edit3 className="h-4 w-4 text-[var(--text-secondary)] shrink-0" /> Edit Profile</span>
                      <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                    <button type="button" className="w-full flex items-center justify-between rounded-xl p-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition cursor-pointer text-left" onClick={() => { setShowMenuModal(false); setIsProfileMenuOpen(false); setShowArchiveModal(true); }}>
                      <span className="flex items-center gap-3"><Archive className="h-4 w-4 text-[var(--text-secondary)] shrink-0" /> View Archive</span>
                      <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                    <button type="button" className="w-full flex items-center justify-between rounded-xl p-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition cursor-pointer text-left" onClick={() => setActiveSettingsPage('appearance')}>
                      <span className="flex items-center gap-3"><Sun className="h-4 w-4 text-[var(--text-secondary)] shrink-0" /> Appearance / Theme</span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#3b52cf] capitalize">{theme} <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" /></span>
                    </button>
                    <button type="button" className="w-full flex items-center justify-between rounded-xl p-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition cursor-pointer text-left" onClick={() => setActiveSettingsPage('notifications')}>
                      <span className="flex items-center gap-3"><Bell className="h-4 w-4 text-[var(--text-secondary)] shrink-0" /> Notifications</span>
                      <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                    <button type="button" className="w-full flex items-center justify-between rounded-xl p-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition cursor-pointer text-left" onClick={() => setActiveSettingsPage('academic')}>
                      <span className="flex items-center gap-3"><Shield className="h-4 w-4 text-[var(--text-secondary)] shrink-0" /> Academic Profile</span>
                      <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Privacy & Controls</p>
                  <div className="space-y-1.5">
                    {[
                      { id: 'privacy', Icon: Lock, label: 'Account Privacy' },
                      { id: 'close-friends', Icon: Users, label: 'Close Friends' },
                      { id: 'blocked', Icon: Ban, label: 'Blocked Accounts' },
                      { id: 'story-location', Icon: MapPin, label: 'Story & Location Settings' },
                    ].map(({ id, Icon, label }) => (
                      <button
                        key={id}
                        type="button"
                        className="w-full flex items-center justify-between rounded-xl p-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition cursor-pointer text-left"
                        onClick={() => setActiveSettingsPage(id)}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                          {label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                  <div className="rounded-xl border border-[var(--border-color)] p-3.5 text-xs space-y-1 bg-[var(--surface-secondary)]">
                    <p className="m-0 font-bold text-[var(--text-primary)]">Data & Privacy</p>
                    <p className="m-0 text-[11px] text-[var(--text-muted)]">StudyVault respects user privacy and data ownership.</p>
                  </div>
                  <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 py-3 text-xs font-bold text-rose-500 shadow-xs transition hover:bg-rose-500/20 cursor-pointer" onClick={() => { setShowMenuModal(false); logout(); }}>
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                  <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 shadow-xs transition hover:bg-rose-500/15 cursor-pointer" onClick={async () => { if (window.confirm("ARE YOU SURE?\n\nThis will permanently delete your account and all associated notes, tasks, posts, and study records. This action CANNOT be undone.")) { try { await apiRequest('/api/auth/account', { method: 'DELETE' }); setShowMenuModal(false); logout(); } catch (err) { alert(err.message || 'Failed to delete account.'); } } }}>
                    <Trash2 className="h-4 w-4" /> Delete Account & Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Create Memory Modal */}
      <CreateMemoryModal
        isOpen={showCreateMemory}
        onClose={() => setShowCreateMemory(false)}
        onMemoryCreated={() => fetchMemories()}
      />

      {/* Add Story to Memory Modal */}
      <AddStoryToMemoryModal
        isOpen={Boolean(selectedMemoryForAdd)}
        onClose={() => setSelectedMemoryForAdd(null)}
        memory={selectedMemoryForAdd}
        availableStories={availableStories}
        onStoriesAdded={() => fetchMemories()}
      />

      {/* Memory Viewer */}
      {activeMemoryIndex !== null && viewerMemoryStories.length > 0 && (
        <StoryViewer
          stories={viewerMemoryStories}
          currentIndex={0}
          onClose={() => setActiveMemoryIndex(null)}
          onSelectIndex={() => {}}
          onMemoryUpdated={() => fetchMemories()}
          onHighlightUpdated={() => fetchMemories()}
        />
      )}
    </section>
  );
}
