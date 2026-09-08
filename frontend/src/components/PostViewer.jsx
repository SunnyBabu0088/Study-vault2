import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { apiRequest } from '../api/client';

function parseMediaItems(post) {
  if (!post || !post.media_url) return [];
  try {
    const parsed = JSON.parse(post.media_url);
    if (Array.isArray(parsed)) {
      return parsed.map((m) => (typeof m === 'string' ? { url: m, type: 'image' } : m));
    }
  } catch (_) {}
  return [{ url: post.media_url, type: post.media_type || 'image' }];
}

export default function PostViewer({ isOpen, onClose, post }) {
  const { toggleLike, toggleSave, user } = useStudy();

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [heartAnimation, setHeartAnimation] = useState(false);
  const [heartCoords, setHeartCoords] = useState({ x: 0, y: 0 });

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [copied, setCopied] = useState(false);

  const lastTapRef = useRef(0);

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

  if (!isOpen || !post) return null;

  const mediaItems = parseMediaItems(post);
  const currentMedia = mediaItems[activeMediaIndex] || mediaItems[0];
  const authorName = post.author_username || 'Student';

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

      if (!post.liked) {
        toggleLike(post);
      }
    }
    lastTapRef.current = now;
  };

  const handleOpenComments = async () => {
    setCommentsOpen(true);
    try {
      const res = await apiRequest(`/api/posts/${post.id}/comments`);
      const list = Array.isArray(res.data?.comments) ? res.data.comments : Array.isArray(res.comments) ? res.comments : [];
      setCommentsList(list);
    } catch (err) {
      console.error('Failed to load post comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    try {
      const res = await apiRequest(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        body: { content: commentInput.trim() },
      });
      const newComment = res.data?.comment || res.comment;
      if (newComment) {
        setCommentsList((prev) => [...prev, newComment]);
      }
      setCommentInput('');
    } catch (err) {
      console.error('Add post comment error:', err);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${post.title}: ${post.content}`);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex h-[100dvh] w-[100vw] flex-col overflow-hidden bg-[var(--background)] text-[var(--text-primary)] opacity-100"
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
        opacity: 1,
      }}
      aria-label="Full Screen Post Viewer"
      role="dialog"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-[var(--button-background)] text-[var(--text-primary)] transition hover:bg-[var(--border-color)] cursor-pointer"
            onClick={onClose}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <img
              className="h-10 w-10 rounded-full object-cover border border-[var(--border-color)]"
              src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${authorName}`}
              alt={authorName}
            />
            <div>
              <h1 className="m-0 text-sm font-bold text-[var(--text-primary)] leading-tight">{authorName}</h1>
              <p className="m-0 text-[11px] text-[var(--text-muted)]">
                {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-[var(--button-background)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full space-y-4">
        {/* Post Title & Text Content */}
        <div>
          <h2 className="display-face text-lg font-bold text-[var(--text-primary)]">{post.title}</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{post.content}</p>
          {post.hashtags && <p className="mt-2 text-xs font-bold text-[#3b52cf] dark:text-[#60a5fa]">{post.hashtags}</p>}
        </div>

        {/* Media Preview Container with Double-Tap to Like */}
        {currentMedia && (
          <div
            className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-black cursor-pointer min-h-[260px] flex items-center justify-center"
            onClick={handleDoubleTap}
          >
            {currentMedia.type === 'video' ? (
              <video className="max-h-[70vh] w-full object-contain" src={currentMedia.url} controls />
            ) : (
              <img className="max-h-[70vh] w-full object-contain" src={currentMedia.url} alt={post.title} />
            )}

            {/* Double Tap Heart Overlay */}
            {heartAnimation && (
              <div
                className="absolute pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2 animate-ping"
                style={{ left: heartCoords.x, top: heartCoords.y }}
              >
                <Heart className="h-20 w-20 fill-current text-rose-500 drop-shadow-2xl scale-125 transition-all duration-500" />
              </div>
            )}

            {/* Multi-Image Carousel Controls */}
            {mediaItems.length > 1 && (
              <>
                <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                  {activeMediaIndex + 1} / {mediaItems.length}
                </span>

                <button
                  type="button"
                  disabled={activeMediaIndex === 0}
                  className="absolute left-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm disabled:opacity-30 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMediaIndex((prev) => Math.max(0, prev - 1));
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  disabled={activeMediaIndex === mediaItems.length - 1}
                  className="absolute right-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm disabled:opacity-30 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMediaIndex((prev) => Math.min(mediaItems.length - 1, prev + 1));
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-color)]">
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-4 py-2 text-xs font-bold transition cursor-pointer ${
              post.liked ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
            }`}
            onClick={() => toggleLike(post)}
          >
            <Heart className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} />
            <span>{post.likes || post.like_count || 0}</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] cursor-pointer"
            onClick={handleOpenComments}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Comment</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] cursor-pointer"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-4 py-2 text-xs font-bold transition cursor-pointer ${
              post.saved ? 'bg-amber-500/15 text-amber-600 border-amber-500/30' : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
            }`}
            onClick={() => toggleSave(post)}
          >
            <Bookmark className={`h-4 w-4 ${post.saved ? 'fill-current' : ''}`} />
            <span>{post.saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Slide-Up Post Comments Sheet */}
      {commentsOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs"
          onClick={() => setCommentsOpen(false)}
        >
          <div
            className="w-full max-h-[60vh] rounded-t-3xl bg-[var(--surface)] text-[var(--text-primary)] p-5 border-t border-[var(--border-color)] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Comments ({commentsList.length})</h3>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full bg-[var(--button-background)] text-[var(--text-primary)]"
                onClick={() => setCommentsOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
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
                      <p className="mt-0.5 m-0 text-[var(--text-secondary)]">{c.content}</p>
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
