import { useState } from 'react';
import { Bookmark, Check, ChevronLeft, ChevronRight, Edit2, GitBranch, Heart, MessageCircle, MoreVertical, Share2, Trash2, X } from 'lucide-react';
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

function PostMediaContainer({ post }) {
  const items = parseMediaItems(post);
  const [index, setIndex] = useState(0);
  if (items.length === 0) return null;

  const current = items[index] || items[0];

  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl border border-[#e2e5ef] dark:border-[#263244] bg-black">
      {current.type === 'video' ? (
        <video className="max-h-80 w-full object-contain" src={current.url} controls />
      ) : (
        <img className="max-h-80 w-full object-contain" src={current.url} alt={post.title || 'Post media'} loading="lazy" />
      )}

      {items.length > 1 && (
        <>
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {index + 1} / {items.length}
          </span>
          <button
            type="button"
            disabled={index === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white disabled:opacity-30 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => Math.max(0, prev - 1));
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={index === items.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white disabled:opacity-30 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => Math.min(items.length - 1, prev + 1));
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

export default function PostCard({ post, onExtend, onEdit, onOpenDetail }) {
  const { toggleLike, toggleSave, submitSuggestion, loadSuggestions, suggestions, user, loadPosts } = useStudy();
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestInput, setSuggestInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = user && (post.user_id === user.id || post.author_username === user.username);
  const postSuggestions = suggestions[post.id] || [];

  const handleShare = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(`${post.title}: ${post.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSuggest = () => {
    setSuggestOpen((prev) => {
      const next = !prev;
      if (next) {
        loadSuggestions(post);
      }
      return next;
    });
  };

  const handleSubmitSuggestion = async () => {
    if (!suggestInput.trim()) return;
    await submitSuggestion(post, suggestInput.trim());
    setSuggestInput('');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await apiRequest(`/api/posts/${post.id}`, { method: 'DELETE' });
        await loadPosts();
      } catch (err) {
        console.error('Failed to delete post:', err);
      }
    }
  };

  const authorName = post.author_username || 'Student';
  const timeFormatted = post.created_at
    ? new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'Recently';

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(post);
    }
  };

  return (
    <article className="post-card relative transition hover:shadow-md">
      {/* Header with Author Profile */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f0f2f8] dark:border-[#263244]">
        <div className="flex items-center gap-3">
          <img
            className="h-10 w-10 rounded-full object-cover border border-[#e2e5ef] dark:border-[#263244]"
            src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${authorName}`}
            alt={authorName}
          />
          <div>
            <p className="m-0 font-bold text-sm text-[#0f1729] dark:text-[#f8fafc]">{authorName}</p>
            <p className="m-0 text-xs text-[#5a6478] dark:text-[#94a3b8]">{timeFormatted}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={post.visibility === 'private' ? 'badge-private' : 'badge-public'}>
            {post.visibility === 'private' ? 'Private' : 'Public'}
          </span>

          {isOwner && (
            <div className="relative">
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full text-[#5a6478] dark:text-[#94a3b8] hover:bg-[#f0f2f8] dark:hover:bg-[#1f2937]"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 z-20 w-32 rounded-xl border border-[#e2e5ef] dark:border-[#263244] bg-white dark:bg-[#161e2d] p-1 shadow-lg">
                  {onEdit && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-[#0f1729] dark:text-[#f8fafc] hover:bg-[#f8f9fd] dark:hover:bg-[#111827]"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(post);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-[#d83d72] hover:bg-[#fff1f5] dark:hover:bg-rose-950/40"
                    onClick={() => {
                      setMenuOpen(false);
                      handleDelete();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title & Body */}
      <div className="mt-3 cursor-pointer" onClick={handleCardClick}>
        <h3 className="m-0 font-bold text-base text-[#0f1729] dark:text-[#f8fafc]">{post.title}</h3>
        <p className="mt-2 text-sm text-[#334155] dark:text-[#cbd5e1] leading-relaxed line-clamp-3">{post.content}</p>
        {post.hashtags && <p className="mt-2 text-xs font-bold text-[var(--brand-orange)]">{post.hashtags}</p>}

        <PostMediaContainer post={post} />

        {post.scheduled_date && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#fff8e6] dark:bg-amber-950/40 px-2.5 py-1 text-xs font-bold text-[#b45309] dark:text-amber-400">
            <span>📅 Scheduled for {new Date(post.scheduled_date).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="post-actions">
        <button type="button" className={post.liked ? 'liked' : ''} onClick={() => toggleLike(post)}>
          <Heart className={`h-3.5 w-3.5 ${post.liked ? 'fill-current' : ''}`} />
          <span>{post.likes || post.like_count || 0}</span>
        </button>
        <button type="button" onClick={handleToggleSuggest}>
          <MessageCircle className="h-3.5 w-3.5" /> Suggest
        </button>
        <button type="button" onClick={handleShare}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Share'}
        </button>
        <button type="button" className={post.saved ? 'liked' : ''} onClick={() => toggleSave(post)}>
          <Bookmark className={`h-3.5 w-3.5 ${post.saved ? 'fill-current' : ''}`} />
          {post.saved ? 'Saved' : 'Save'}
        </button>
        {onExtend && (
          <button type="button" onClick={() => onExtend(post)}>
            <GitBranch className="h-3.5 w-3.5" /> Extend
          </button>
        )}
      </div>

      {/* Suggestions Section */}
      {suggestOpen && (
        <div className="mt-3 border-t border-[#f0f2f8] dark:border-[#263244] pt-3">
          <div className="flex gap-2">
            <input
              type="text"
              className="field flex-1 text-xs py-2"
              placeholder="Add your suggestion…"
              value={suggestInput}
              onChange={(e) => setSuggestInput(e.target.value)}
            />
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition cursor-pointer"
              style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 12px var(--brand-glow)' }}
              onClick={handleSubmitSuggestion}
            >
              Send
            </button>
          </div>
          {postSuggestions.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {postSuggestions.map((item, index) => (
                <div key={index} className="rounded-xl border border-[#e2e5ef] dark:border-[#263244] bg-[#f8f9fd] dark:bg-[#111827] p-2.5 text-xs text-[#0f1729] dark:text-[#f8fafc]">
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
