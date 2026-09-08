import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Bookmark, Heart, MessageCircle, MoreVertical, Send, Smile, Volume2, VolumeX, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { apiRequest } from '../api/client';

export default function ReelsViewer({ isOpen, onClose, initialReelId }) {
  const { reels = [], likeReel, saveReel, shareReel, viewReel, user } = useStudy();
  const safeReels = Array.isArray(reels) ? reels : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [heartAnimation, setHeartAnimation] = useState(false);
  const [heartCoords, setHeartCoords] = useState({ x: 0, y: 0 });

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsClosing, setCommentsClosing] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [commentsList, setCommentsList] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [copied, setCopied] = useState(false);

  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const lastTapRef = useRef(0);
  const touchStartRef = useRef(0);

  // Set initial reel index
  useEffect(() => {
    if (initialReelId && safeReels.length > 0) {
      const idx = safeReels.findIndex((r) => r.id === initialReelId);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [initialReelId, safeReels]);

  // Lock body scroll when viewer is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const currentReel = safeReels[currentIndex] || safeReels[0];

  // Record view on reel change
  useEffect(() => {
    if (isOpen && currentReel?.id) {
      viewReel(currentReel.id);
    }
  }, [isOpen, currentReel?.id, viewReel]);

  if (!isOpen || !currentReel) return null;

  const handleDoubleTap = (e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setHeartCoords({ x, y });
      setHeartAnimation(true);
      setTimeout(() => setHeartAnimation(false), 900);

      if (!currentReel.liked) {
        likeReel(currentReel.id);
      }
    } else {
      setPaused((prev) => !prev);
    }
    lastTapRef.current = now;
  };

  const handleNextReel = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setPaused(false);
    }
  };

  const handlePrevReel = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setPaused(false);
    }
  };

  const handleOpenComments = async () => {
    setCommentsOpen(true);
    setCommentsClosing(false);
    setDragOffsetY(0);
    try {
      const res = await apiRequest(`/api/reels/${currentReel.id}/comments`);
      const list = Array.isArray(res.data?.comments) ? res.data.comments : Array.isArray(res.comments) ? res.comments : [];
      setCommentsList(list);
    } catch (err) {
      console.error('Failed to load reel comments:', err);
    }
  };

  const handleCloseComments = () => {
    if (commentsClosing) return;
    setCommentsClosing(true);
    setTimeout(() => {
      setCommentsOpen(false);
      setCommentsClosing(false);
      setDragOffsetY(0);
    }, 280);
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartRef.current;
    if (deltaY > 0) {
      setDragOffsetY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffsetY > 100) {
      handleCloseComments();
    } else {
      setDragOffsetY(0);
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
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
    shareReel(currentReel.id);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentReel.video_url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const authorName = currentReel.author_username || 'Student';

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
      aria-label="Full Screen Reels Viewer"
      role="dialog"
    >
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 cursor-pointer"
          onClick={onClose}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-white/90">Reels</span>
          <span className="text-xs font-semibold text-white/60">({currentIndex + 1}/{reels.length})</span>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 cursor-pointer"
          onClick={() => setMuted(!muted)}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="h-5 w-5 text-rose-400" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Main 9:16 Video Stage */}
      <div
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center bg-black w-full h-full cursor-pointer"
        onClick={handleDoubleTap}
      >
        <video
          ref={(el) => (videoRefs.current[currentReel.id] = el)}
          key={currentReel.id}
          className="h-full w-full max-w-[430px] object-cover"
          src={currentReel.video_url}
          autoPlay={!paused}
          loop
          muted={muted}
          playsInline
        />

        {/* Floating Heart Animation on Double-Tap */}
        {heartAnimation && (
          <div
            className="absolute pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2 animate-ping"
            style={{ left: heartCoords.x, top: heartCoords.y }}
          >
            <Heart className="h-20 w-20 fill-current text-rose-500 drop-shadow-2xl scale-125 transition-all duration-500" />
          </div>
        )}

        {/* Next / Previous Navigation Overlays */}
        {currentIndex > 0 && (
          <button
            type="button"
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold text-white/80 backdrop-blur-sm hover:bg-black/70 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevReel();
            }}
          >
            ▲ Swipe / Click Previous
          </button>
        )}

        {currentIndex < reels.length - 1 && (
          <button
            type="button"
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold text-white/80 backdrop-blur-sm hover:bg-black/70 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNextReel();
            }}
          >
            ▼ Swipe / Click Next
          </button>
        )}

        {/* Right Vertical Side Actions */}
        <div
          className="absolute right-4 bottom-24 z-30 flex flex-col items-center gap-4.5 select-none"
          style={{
            paddingRight: 'env(safe-area-inset-right, 0px)'
          }}
        >
          {/* Like Action */}
          <button
            type="button"
            className="flex flex-col items-center gap-1.5 text-white cursor-pointer group outline-none"
            onClick={(e) => {
              e.stopPropagation();
              likeReel(currentReel.id);
            }}
            aria-label="Like reel"
          >
            <div
              className={`grid h-12 w-12 place-items-center rounded-[18px] backdrop-blur-xl border shadow-lg transition-all duration-200 active:scale-90 group-hover:scale-105 ${
                currentReel.liked
                  ? 'bg-rose-500/25 border-rose-500/40 text-rose-500 shadow-rose-500/30'
                  : 'bg-slate-900/55 dark:bg-slate-900/55 border-white/15 text-white group-hover:bg-slate-900/75 group-hover:border-white/30 shadow-black/25'
              }`}
            >
              <Heart
                className={`h-6 w-6 transition-transform duration-200 ${
                  currentReel.liked ? 'fill-current scale-110 text-rose-500' : 'text-white'
                }`}
              />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">{currentReel.likes_count || 0}</span>
          </button>

          {/* Comment Action */}
          <button
            type="button"
            className="flex flex-col items-center gap-1.5 text-white cursor-pointer group outline-none"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenComments();
            }}
            aria-label="Comment on reel"
          >
            <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-slate-900/55 dark:bg-slate-900/55 backdrop-blur-xl border border-white/15 text-white shadow-lg shadow-black/25 transition-all duration-200 active:scale-90 group-hover:scale-105 group-hover:bg-slate-900/75 group-hover:border-white/30">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">{currentReel.comments_count || 0}</span>
          </button>

          {/* Share Action */}
          <button
            type="button"
            className="flex flex-col items-center gap-1.5 text-white cursor-pointer group outline-none"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            aria-label="Share reel"
          >
            <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-slate-900/55 dark:bg-slate-900/55 backdrop-blur-xl border border-white/15 text-white shadow-lg shadow-black/25 transition-all duration-200 active:scale-90 group-hover:scale-105 group-hover:bg-slate-900/75 group-hover:border-white/30">
              <Send className="h-6 w-6 text-white" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">{copied ? 'Copied' : currentReel.shares_count || 0}</span>
          </button>

          {/* Save Action */}
          <button
            type="button"
            className="flex flex-col items-center gap-1.5 text-white cursor-pointer group outline-none"
            onClick={(e) => {
              e.stopPropagation();
              saveReel(currentReel.id);
            }}
            aria-label="Save reel"
          >
            <div
              className={`grid h-12 w-12 place-items-center rounded-[18px] backdrop-blur-xl border shadow-lg transition-all duration-200 active:scale-90 group-hover:scale-105 ${
                currentReel.saved
                  ? 'bg-amber-500/25 border-amber-500/40 text-amber-400 shadow-amber-500/30'
                  : 'bg-slate-900/55 dark:bg-slate-900/55 border-white/15 text-white group-hover:bg-slate-900/75 group-hover:border-white/30 shadow-black/25'
              }`}
            >
              <Bookmark
                className={`h-6 w-6 transition-transform duration-200 ${
                  currentReel.saved ? 'fill-current scale-110 text-amber-400' : 'text-white'
                }`}
              />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-md">{currentReel.saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Bottom Details Bar */}
        <div className="absolute bottom-6 left-5 right-20 z-30 space-y-2 max-w-lg bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <img
              className="h-9 w-9 rounded-full object-cover border border-white/60 shadow-md shrink-0"
              src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${authorName}`}
              alt={authorName}
            />
            <h3 className="m-0 text-sm font-bold text-white drop-shadow-md">@{authorName}</h3>
            <span className="text-sky-400 text-xs font-bold">✓</span>
            <span className="text-white/60 text-xs font-bold">•</span>
            <span className="text-xs font-bold text-sky-400 cursor-pointer hover:underline">Follow</span>
          </div>
          {currentReel.caption && (
            <p className="m-0 text-xs text-white/90 leading-relaxed line-clamp-2 drop-shadow-sm">
              {currentReel.caption}
            </p>
          )}
          {currentReel.hashtags && (
            <p className="m-0 text-[11px] font-bold text-sky-400 drop-shadow-sm">
              {currentReel.hashtags}
            </p>
          )}
        </div>
      </div>

      {/* Slide-Up Reel Comments Bottom Sheet */}
      {commentsOpen && (
        <div
          className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-xs transition-opacity duration-300 ${
            commentsClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleCloseComments}
        >
          <div
            className={`w-full max-h-[78vh] h-auto rounded-t-[28px] bg-[var(--surface)]/95 dark:bg-slate-950/95 text-[var(--text-primary)] backdrop-blur-2xl border-t border-white/10 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              commentsClosing ? 'translate-y-full' : 'translate-y-0'
            }`}
            style={{
              transform: dragOffsetY > 0 ? `translate3d(0, ${dragOffsetY}px, 0)` : undefined,
              transition: dragOffsetY > 0 ? 'none' : undefined,
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Handle */}
            <div
              className="w-full py-2.5 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-10 h-1 rounded-full bg-[var(--text-muted)]/40 hover:bg-[var(--text-muted)]/60 transition-colors" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-[var(--border)]/40 shrink-0">
              <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">
                Comments ({commentsList.length})
              </h3>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--border)] active:scale-95 transition-all cursor-pointer"
                onClick={handleCloseComments}
                aria-label="Close comments"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Comments List (Scrollable Continuous Surface) */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {commentsList.length > 0 ? (
                commentsList.map((c, idx) => (
                  <div key={c.id || idx} className="flex items-start gap-3 text-xs border-b border-[var(--border)]/30 pb-3 last:border-none last:pb-0">
                    <img
                      className="h-8 w-8 rounded-full object-cover shrink-0 border border-[var(--border)]"
                      src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${c.username || 'User'}`}
                      alt="user"
                    />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text-primary)]">{c.username || 'Student'}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Just now</span>
                      </div>
                      <p className="m-0 text-[var(--text-secondary)] leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-[var(--text-muted)] space-y-1">
                  <p className="font-semibold text-[var(--text-primary)] m-0">No comments yet</p>
                  <p className="m-0">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>

            {/* Bottom Rounded Comment Input Bar */}
            <div className="px-4 pt-3 pb-3 border-t border-[var(--border)]/40 bg-[var(--surface)]/95 shrink-0">
              <div className="flex items-center gap-2 rounded-full p-1.5 px-4 bg-[var(--surface-secondary)]/80 border border-[var(--border)]/60 focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]/30 transition-all duration-200 shadow-xs">
                <button type="button" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95 transition-transform cursor-pointer">
                  <Smile className="h-4 w-4" />
                </button>
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
                  className="rounded-full bg-[#3b52cf] dark:bg-[#3b52cf] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-[0.96] disabled:opacity-40 disabled:scale-100 transition-all duration-150 cursor-pointer shrink-0"
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
