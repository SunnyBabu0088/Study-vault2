import { useState } from 'react';
import { Check, GitBranch, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export default function PostCard({ post, onExtend }) {
  const { toggleLike, toggleSave, submitSuggestion, loadSuggestions, suggestions } = useStudy();
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestInput, setSuggestInput] = useState('');
  const [copied, setCopied] = useState(false);

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

  return (
    <article className="post-card">
      <div className="flex items-center justify-between">
        <h3 className="m-0 font-bold">{post.title}</h3>
        <span className={post.visibility === 'private' ? 'badge-private' : 'badge-public'}>
          {post.visibility === 'private' ? 'Private' : 'Public'}
        </span>
      </div>
      {post.bio && <p className="mt-1 text-xs text-[#5a6478]">{post.bio}</p>}
      {post.media_url && (
        <img className="media-preview" src={post.media_url} alt={post.title} loading="lazy" />
      )}
      <p className="mt-2 text-sm">{post.content}</p>
      {post.hashtags && <p className="mt-1 text-xs font-bold text-[#3b52cf]">{post.hashtags}</p>}
      {post.scheduled_date && (
        <p className="mt-1 text-xs text-[#5a6478]">
          📅 Scheduled: {new Date(post.scheduled_date).toLocaleString()}
        </p>
      )}
      <div className="post-actions">
        <button type="button" className={post.liked ? 'liked' : ''} onClick={() => toggleLike(post)}>
          <Heart className={`h-3.5 w-3.5 ${post.liked ? 'fill-current' : ''}`} />
          <span>{post.likes || 0}</span>
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
        <button type="button" onClick={() => onExtend(post)}>
          <GitBranch className="h-3.5 w-3.5" /> Extend
        </button>
      </div>
      {suggestOpen && (
        <div className="mt-3">
          <textarea
            className="field min-h-[50px] text-sm"
            placeholder="Add your suggestion…"
            value={suggestInput}
            onChange={(e) => setSuggestInput(e.target.value)}
          />
          <button
            type="button"
            className="mt-2 rounded-lg bg-[#3b52cf] px-3 py-1.5 text-xs font-bold text-white"
            onClick={handleSubmitSuggestion}
          >
            Send
          </button>
          {postSuggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {postSuggestions.map((item, index) => (
                <p
                  key={index}
                  className="rounded-lg border border-[#e2e5ef] bg-[#f8f9fd] p-2 text-xs"
                >
                  {item}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
