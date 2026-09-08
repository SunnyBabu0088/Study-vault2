import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Bookmark, Film, Heart, MessageCircle, Send, UserPlus, Volume2, VolumeX, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { apiRequest } from '../api/client';

export default function StartupView() {
  const {
    reels = [],
    loadReels,
    likeReel,
    saveReel,
    shareReel,
    viewReel,
    recordReelWatchTime,
    navigate,
    isCreateChoiceOpen,
    setIsCreateChoiceOpen,
  } = useStudy();
  const safeReels = Array.isArray(reels) ? reels : [];

  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [heartAnimation, setHeartAnimation] = useState(false);
  const [heartCoords, setHeartCoords] = useState({ x: 0, y: 0 });

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState({});

  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const lastTapRef = useRef(0);
  const watchStartTimeRef = useRef(Date.now());
  const touchStartYRef = useRef(0);
  const lastWheelTimeRef = useRef(0);

  const currentReel = safeReels[activeReelIndex] || safeReels[0];

  // Refresh reels feed on mount & lock body scroll
  useEffect(() => {
    loadReels();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [loadReels]);

  // Record view & track watch time telemetry
  useEffect(() => {
    if (!currentReel?.id) return;
    viewReel(currentReel.id);
    watchStartTimeRef.current = Date.now();

    return () => {
      const watchedMs = Date.now() - watchStartTimeRef.current;
      const watchedSecs = Math.floor(watchedMs / 1000);
      if (watchedSecs >= 2) {
        const estimatedDuration = 30;
        const completionPct = Math.min(100, Math.floor((watchedSecs / estimatedDuration) * 100));
        recordReelWatchTime(currentReel.id, watchedSecs, completionPct, completionPct >= 80);
      }
    };
  }, [currentReel?.id, viewReel, recordReelWatchTime]);

  // Keyboard Navigation (ArrowUp / ArrowDown / Space / Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (commentsOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeReelIndex < safeReels.length - 1) {
          setActiveReelIndex((prev) => prev + 1);
          setPaused(false);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeReelIndex > 0) {
          setActiveReelIndex((prev) => prev - 1);
          setPaused(false);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        setPaused((prev) => !prev);
      } else if (e.key === 'Escape') {
        navigate('home-view');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReelIndex, safeReels.length, commentsOpen, navigate]);

  const handleDoubleTap = (e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setHeartCoords({ x, y });
      setHeartAnimation(true);
      setTimeout(() => setHeartAnimation(false), 900);

      if (currentReel && !currentReel.liked) {
        likeReel(currentReel.id);
      }
    } else {
      setPaused((prev) => !prev);
    }
    lastTapRef.current = now;
  };

  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
    const SWIPE_THRESHOLD = 50;
    if (deltaY > SWIPE_THRESHOLD && activeReelIndex < safeReels.length - 1) {
      setActiveReelIndex((prev) => prev + 1);
      setPaused(false);
    } else if (deltaY < -SWIPE_THRESHOLD && activeReelIndex > 0) {
      setActiveReelIndex((prev) => prev - 1);
      setPaused(false);
    }
  };

  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 400) return; // Debounce wheel
    if (e.deltaY > 30 && activeReelIndex < safeReels.length - 1) {
      lastWheelTimeRef.current = now;
      setActiveReelIndex((prev) => prev + 1);
      setPaused(false);
    } else if (e.deltaY < -30 && activeReelIndex > 0) {
      lastWheelTimeRef.current = now;
      setActiveReelIndex((prev) => prev - 1);
      setPaused(false);
    }
  };

  const handleOpenComments = async () => {
    if (!currentReel) return;
    setCommentsOpen(true);
    try {
      const res = await apiRequest(`/api/reels/${currentReel.id}/comments`);
      const list = Array.isArray(res.data?.comments) ? res.data.comments : Array.isArray(res.comments) ? res.comments : [];
      setCommentsList(list);
    } catch (err) {
      console.error('Failed to load reel comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!currentReel || !commentInput.trim()) return;
    try {
      const res = await apiRequest(`/api/reels/${currentReel.id}/comments`, {
        method: 'POST',
        body: { content: commentInput.trim() },
      });
      const newComment = res.data?.comment || res.comment;
      if (newComment) {
        setCommentsList((prev) => [...prev, newComment]);
      }
      setCommentInput('');
    } catch (err) {
      console.error('Add reel comment error:', err);
    }
  };

  const handleShare = () => {
    if (!currentReel) return;
    shareReel(currentReel.id);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentReel.video_url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFollow = (authorName) => {
    setFollowing((prev) => ({ ...prev, [authorName]: !prev[authorName] }));
  };

  const handleBackToHome = () => {
    navigate('home-view');
  };

  if (safeReels.length === 0) {
    return createPortal(
      <div
        className="fixed inset-0 z-[999999] flex h-[100dvh] w-[100vw] flex-col overflow-hidden bg-black text-white"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh', zIndex: 999999, backgroundColor: '#000000', color: '#ffffff' }}
      >
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 cursor-pointer"
            onClick={handleBackToHome}
            aria-label="Back to Home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const authorName = currentReel.author_username || 'Student';
  const isFollowing = Boolean(following[authorName]);

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex h-[100dvh] w-[100vw] flex-col overflow-hidden bg-black text-white select-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 999999,
        backgroundColor: '#000000',
        color: '#ffffff',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      aria-label="Full-Screen Student Reels Discovery Viewer"
      role="dialog"
    >
      {/* Top Header Overlay */}
      <div
        className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 16px) + 8px)' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/80 cursor-pointer"
            onClick={handleBackToHome}
            aria-label="Back to Home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-[#e04980]" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/90">Student Reels</span>
          </div>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/80 cursor-pointer"
          onClick={() => setMuted(!muted)}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="h-5 w-5 text-rose-400" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Main Video Viewport (100vw x 100dvh) */}
      <div
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center bg-black w-full h-full cursor-pointer overflow-hidden"
        onClick={handleDoubleTap}
      >
        <video
          ref={(el) => (videoRefs.current[currentReel.id] = el)}
          key={currentReel.id}
          className="h-full w-full object-cover"
          src={currentReel.video_url}
          autoPlay={!paused}
          loop
          muted={muted}
          playsInline
        />

        {/* Floating Heart Animation on Double Tap */}
        {heartAnimation && (
          <div
            className="absolute pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2 animate-ping"
            style={{ left: heartCoords.x, top: heartCoords.y }}
          >
            <Heart className="h-24 w-24 fill-current text-rose-500 drop-shadow-2xl scale-125 transition-all duration-500" />
          </div>
        )}

        {/* Right Side Vertical Action Bar */}
        <div className="absolute right-4 bottom-24 z-40 flex flex-col items-center gap-5">
          {/* Like Action */}
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-white cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              likeReel(currentReel.id);
            }}
          >
            <div className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur-md transition ${currentReel.liked ? 'bg-rose-500 text-white' : 'bg-black/50 text-white group-hover:bg-black/75'}`}>
              <Heart className={`h-6 w-6 ${currentReel.liked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[11px] font-bold shadow-md">{currentReel.likes_count || 0}</span>
          </button>

          {/* Comment Action */}
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-white cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenComments();
            }}
          >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition group-hover:bg-black/75">
              <MessageCircle className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-bold shadow-md">{currentReel.comments_count || 0}</span>
          </button>

          {/* Share Action */}
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-white cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
          >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition group-hover:bg-black/75">
              <Send className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-bold shadow-md">{copied ? 'Copied' : currentReel.shares_count || 0}</span>
          </button>

          {/* Save Action */}
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-white cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              saveReel(currentReel.id);
            }}
          >
            <div className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur-md transition ${currentReel.saved ? 'bg-amber-500 text-white' : 'bg-black/50 text-white group-hover:bg-black/75'}`}>
              <Bookmark className={`h-6 w-6 ${currentReel.saved ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[11px] font-bold shadow-md">{currentReel.saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Bottom Left Details Overlay */}
        <div
          className="absolute bottom-6 left-5 right-20 z-40 space-y-2 max-w-lg"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        >
          <div className="flex items-center gap-2.5">
            <img
              className="h-9 w-9 rounded-full object-cover border border-white/60 shadow-md shrink-0"
              src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${authorName}`}
              alt={authorName}
            />
            <h3 className="m-0 text-sm font-bold text-white drop-shadow-md">@{authorName}</h3>
            <span className="text-sky-400 text-xs font-bold">✓</span>
            <span className="text-white/60 text-xs font-bold">•</span>
            <button
              type="button"
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer ${
                isFollowing ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-[#e04980] text-white hover:bg-[#c7356c]'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleFollow(authorName);
              }}
            >
              <UserPlus className="h-3 w-3" />
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>

          {currentReel.caption && (
            <p className="m-0 text-xs text-white/95 leading-relaxed line-clamp-3 drop-shadow-sm font-medium">
              {currentReel.caption}
            </p>
          )}
          {currentReel.hashtags && (
            <p className="m-0 text-xs font-bold text-sky-400 drop-shadow-sm">
              {currentReel.hashtags}
            </p>
          )}
        </div>
      </div>

      {/* Slide-Up Reel Comments Sheet */}
      {commentsOpen && (
        <div
          className="fixed inset-0 z-[1000000] flex flex-col justify-end bg-black/70 backdrop-blur-xs"
          onClick={() => setCommentsOpen(false)}
        >
          <div
            className="w-full max-h-[60vh] rounded-t-3xl bg-[var(--surface)] text-[var(--text-primary)] p-5 border-t border-[var(--border-color)] flex flex-col overflow-hidden shadow-2xl max-w-lg mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Comments ({commentsList.length})</h3>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full bg-[var(--button-background)] text-[var(--text-primary)] cursor-pointer"
                onClick={() => setCommentsOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {commentsList.length > 0 ? (
                commentsList.map((c, idx) => (
                  <div key={c.id || idx} className="flex gap-3 text-xs">
                    <img
                      className="h-8 w-8 rounded-full object-cover shrink-0"
                      src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${c.username || 'User'}`}
                      alt="user"
                    />
                    <div>
                      <p className="m-0 font-bold text-[var(--text-primary)]">{c.username || 'Student'}</p>
                      <p className="mt-0.5 m-0 text-[var(--text-secondary)] leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-[var(--text-muted)] py-6">No comments yet. Be the first to comment!</p>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-2 rounded-full p-1.5 px-4 bg-[var(--surface-secondary)]/80 border border-[var(--border)]/60 focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]/30 transition-all duration-200 shadow-xs">
                <input
                  className="create-post-flat-input flex-1 bg-transparent text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border-none p-0 focus:ring-0"
                  style={{ backgroundColor: 'transparent', background: 'transparent' }}
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  type="button"
                  disabled={!commentInput.trim()}
                  className="rounded-full bg-[#3b52cf] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-[0.96] disabled:opacity-40 disabled:scale-100 transition-all duration-150 cursor-pointer shrink-0"
                  onClick={handleAddComment}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
}
