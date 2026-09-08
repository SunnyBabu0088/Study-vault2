import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Eye, Heart, MessageSquare, Sparkles, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { apiRequest } from '../api/client';
import StoryViewer from './StoryViewer';

export default function StoriesStrip() {
  const { setIsStoryOpen, user, showStoryActivity, closeStoryActivity, storyRefreshTrigger } = useStudy();
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [storiesList, setStoriesList] = useState([]);
  const [activityList, setActivityList] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Lock scroll when story activity page is active
  useEffect(() => {
    if (showStoryActivity) {
      document.body.style.overflow = 'hidden';
    } else if (activeStoryIndex === null) {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showStoryActivity, activeStoryIndex]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await apiRequest('/api/stories');
        const list = res.data?.stories || res.stories || [];
        if (Array.isArray(list)) {
          const formatted = list.map((s) => ({
            id: s.id,
            seed: s.name || 'Student',
            name: s.name || 'Student',
            you: Boolean(user && (s.user_id === user.id || s.name === user.username)),
            presence: 'presence-online',
            statusText: 'Online now',
            content: s.content,
            mediaUrl: s.media_url,
            mediaType: s.media_type,
            timeAgo: s.created_at ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            gradient: s.background || 'linear-gradient(135deg, #FF3218 0%, #FF641F 45%, #FF9A32 75%, #FFD04A 100%)',
            reacted: s.reacted,
            reaction_count: s.reaction_count,
          }));
          setStoriesList(formatted);
        }
      } catch (_) {
        setStoriesList([]);
      }
    };

    fetchStories();
  }, [user, storyRefreshTrigger]);

  useEffect(() => {
    if (!showStoryActivity) return;
    const fetchActivity = async () => {
      setLoadingActivity(true);
      try {
        const res = await apiRequest('/api/stories/activity');
        const list = res.data?.activity || res.activity || [];
        setActivityList(list);
      } catch (_) {
        setActivityList([]);
      } finally {
        setLoadingActivity(false);
      }
    };
    fetchActivity();
  }, [showStoryActivity]);

  const handleStoryClick = (index) => {
    setActiveStoryIndex(index);
    if (setIsStoryOpen) setIsStoryOpen(true);
  };

  const handleCloseViewer = () => {
    setActiveStoryIndex(null);
    if (setIsStoryOpen) setIsStoryOpen(false);
  };

  return (
    <section className="px-2 py-1 sm:px-4" aria-label="Stories">
      {/* Story Avatar Rings Horizontal Strip */}
      {storiesList.length > 0 ? (
        <div className="story-strip flex gap-4 overflow-x-auto pb-1">
          {storiesList.map((story, index) => (
            <article key={story.id || story.seed} className="w-[68px] shrink-0 text-center">
              <button
                type="button"
                className={`story-ring ${story.you ? 'you' : ''} relative mx-auto block h-[60px] w-[60px] cursor-pointer rounded-full p-0 transition hover:scale-105`}
                onClick={() => handleStoryClick(index)}
                aria-label={`View ${story.name}'s story`}
              >
                <img
                  className="h-full w-full rounded-full border-2 border-[var(--surface)] object-cover"
                  src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${story.seed}`}
                  alt={story.name}
                  loading="lazy"
                />
                <span className={`presence-dot ${story.presence} absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full`} />
              </button>
              <p className="mt-1.5 truncate text-[11px] font-bold text-[var(--text-primary)]">{story.name}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface rounded-2xl p-4 border border-[var(--border)] text-center text-xs text-[var(--text-muted)] font-medium">
          No stories yet
        </div>
      )}

      {/* FULL-SCREEN STORY ACTIVITY PAGE */}
      {showStoryActivity &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] flex h-[100dvh] w-[100vw] flex-col overflow-hidden bg-[var(--background)] text-[var(--text-primary)] select-none"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100dvh',
              zIndex: 999999,
            }}
            aria-label="Story Activity Page"
            role="dialog"
          >
            {/* Top Full-Screen Navigation Bar */}
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-primary)] transition hover:bg-[var(--border)] cursor-pointer"
                  onClick={closeStoryActivity}
                  aria-label="Back to home"
                  title="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="m-0 text-base font-bold text-[var(--text-primary)] leading-tight">Story Activity</h1>
                  <p className="m-0 text-[11px] text-[var(--text-secondary)]">Recent reactions, replies & views</p>
                </div>
              </div>

              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] cursor-pointer"
                onClick={closeStoryActivity}
                aria-label="Close activity page"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Responsive Activity List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-2xl mx-auto w-full">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Activity History</span>
                <span className="text-xs font-bold text-white px-2.5 py-0.5 rounded-full shadow-xs" style={{ background: 'var(--brand-gradient)' }}>
                  {activityList.length} items
                </span>
              </div>

              {loadingActivity ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">Loading activity...</div>
              ) : activityList.length > 0 ? (
                activityList.map((notif) => {
                  const IconComponent = notif.type === 'reaction' ? Heart : notif.type === 'reply' ? MessageSquare : Eye;
                  const colorClass = notif.type === 'reaction' ? 'text-rose-500' : notif.type === 'reply' ? 'text-indigo-500' : 'text-emerald-500';
                  return (
                    <div
                      key={notif.id}
                      className="flex items-center gap-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 shadow-sm transition hover:bg-[var(--surface-secondary)] cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <img
                          className="h-12 w-12 rounded-full border border-[var(--border)] object-cover"
                          src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${notif.seed || 'Student'}`}
                          alt={notif.seed || 'Student'}
                        />
                        <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-xs">
                          <IconComponent className={`h-3.5 w-3.5 ${colorClass}`} />
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-semibold text-[var(--text-primary)] leading-snug">{notif.text}</p>
                        <p className="m-0 mt-0.5 text-xs text-[var(--text-muted)]">
                          {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-sm font-bold text-[var(--text-muted)]">
                  No activity yet
                </div>
              )}

              <div className="pt-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-xs font-bold text-[var(--text-muted)] border border-[var(--border)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" /> You're all caught up!
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Full-Screen Story Viewer */}
      {activeStoryIndex !== null && (
        <StoryViewer
          stories={storiesList}
          currentIndex={activeStoryIndex}
          onClose={handleCloseViewer}
          onSelectIndex={setActiveStoryIndex}
        />
      )}
    </section>
  );
}
