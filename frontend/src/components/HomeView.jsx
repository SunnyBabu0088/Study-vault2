import { useRef } from 'react';
import { PlusCircle } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import StoriesStrip from './StoriesStrip';
import PostCard from './PostCard';

export default function HomeView() {
  const { posts = [], navigate, openCreateModal } = useStudy();
  const safePosts = Array.isArray(posts) ? posts : [];
  const fileInputRef = useRef(null);

  const handlePostFirstIdea = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleMediaSelected = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      openCreateModal([], 'POST');
      return;
    }

    const formattedItems = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
      formattedItems.push({
        id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name,
      });
    }

    openCreateModal(formattedItems, 'POST');
  };

  return (
    <section className="pt-2 pb-10" aria-label="Home section">
      {/* Hidden file picker for direct media picker launch */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleMediaSelected}
      />

      {/* Your Circle / Study Stories */}
      <div className="mt-1">
        <StoriesStrip />
      </div>

      {/* Social Feed Section */}
      <div className="mt-6">
        {safePosts.length > 0 ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {safePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onExtend={() => navigate('startup-view')}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center max-w-2xl mx-auto shadow-xs">
            <p className="font-bold text-[var(--text-primary)]">No feed posts yet</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Share an idea on the Startup Wall to get the feed started.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95 active:scale-95 cursor-pointer"
                style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
                onClick={handlePostFirstIdea}
              >
                <PlusCircle className="w-4 h-4" /> Post First Idea
              </button>
              <button
                type="button"
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--border)]/30 active:scale-95 cursor-pointer"
                onClick={() => navigate('startup-view')}
              >
                Go to Startup Wall
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
