import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Film, ImagePlus, Lightbulb, Sparkles, X } from 'lucide-react';
import CreateIdeaModal from './CreateIdeaModal';
import CreateReelPage from './CreateReelPage';

export default function CreateChoicePage({ isOpen, onClose }) {
  const [selectedFlow, setSelectedFlow] = useState(null); // 'post' | 'reel' | 'idea' | null
  const [initialPostMedia, setInitialPostMedia] = useState([]);
  const [initialReelVideo, setInitialReelVideo] = useState(null);

  const postPickerRef = useRef(null);
  const reelPickerRef = useRef(null);

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

  if (!isOpen) return null;

  const handleSelectPostOption = () => {
    if (postPickerRef.current) {
      postPickerRef.current.value = '';
      postPickerRef.current.click();
    }
  };

  const handleSelectReelOption = () => {
    if (reelPickerRef.current) {
      reelPickerRef.current.value = '';
      reelPickerRef.current.click();
    }
  };

  const handleSelectIdeaOption = () => {
    setSelectedFlow('idea');
  };

  const handlePostMediaSelected = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formattedItems = [];
    const maxSizeBytes = 50 * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
      if (file.size > maxSizeBytes) continue;

      formattedItems.push({
        id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name,
      });
    }

    if (formattedItems.length > 0) {
      setInitialPostMedia(formattedItems);
      setSelectedFlow('post');
    }
  };

  const handleReelVideoSelected = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file for your Reel.');
      return;
    }

    setInitialReelVideo({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    });
    setSelectedFlow('reel');
  };

  if (selectedFlow === 'post') {
    return (
      <CreateIdeaModal
        isOpen={true}
        onClose={() => {
          setSelectedFlow(null);
          setInitialPostMedia([]);
          onClose();
        }}
        initialMedia={initialPostMedia}
      />
    );
  }

  if (selectedFlow === 'reel') {
    return (
      <CreateReelPage
        isOpen={true}
        onClose={() => {
          setSelectedFlow(null);
          setInitialReelVideo(null);
          onClose();
        }}
        initialVideo={initialReelVideo}
      />
    );
  }

  if (selectedFlow === 'idea') {
    return (
      <CreateIdeaModal
        isOpen={true}
        onClose={() => {
          setSelectedFlow(null);
          onClose();
        }}
      />
    );
  }

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
      aria-label="Create Content Selector"
      role="dialog"
    >
      {/* Native Hidden File Inputs */}
      <input
        ref={postPickerRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handlePostMediaSelected}
      />
      <input
        ref={reelPickerRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleReelVideoSelected}
      />

      {/* Header */}
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
          <div>
            <h1 className="m-0 text-base font-bold text-[var(--text-primary)] leading-tight">Create Content</h1>
            <p className="m-0 text-[11px] text-[var(--text-muted)]">Choose what you want to share with your circle</p>
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

      {/* Choices Area */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-lg mx-auto w-full space-y-4 overflow-y-auto">
        <div className="text-center mb-1">
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-orange)] border border-[var(--brand-soft-border)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="display-face text-lg font-bold text-[var(--text-primary)]">What would you like to create?</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Select an option to open the composer.</p>
        </div>

        {/* Choice A: Create Post */}
        <button
          type="button"
          className="group relative flex items-center gap-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--brand-orange)] hover:shadow-md cursor-pointer"
          onClick={handleSelectPostOption}
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-orange)] transition group-hover:scale-105 group-hover:bg-[var(--brand-orange)] group-hover:text-white">
            <ImagePlus className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Create Post</h3>
              <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[9px] font-bold text-[var(--brand-orange)]">Feed Post</span>
            </div>
            <p className="mt-0.5 m-0 text-xs text-[var(--text-secondary)]">
              Share notes, projects, achievements or study-related content.
            </p>
          </div>
        </button>

        {/* Choice B: Create Reel */}
        <button
          type="button"
          className="group relative flex items-center gap-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-4 text-left transition hover:border-[#e04980] hover:shadow-md cursor-pointer"
          onClick={handleSelectReelOption}
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e04980]/10 text-[#e04980] transition group-hover:scale-105 group-hover:bg-[#e04980] group-hover:text-white">
            <Film className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Create Reel</h3>
              <span className="rounded-full bg-[#e04980]/10 px-2 py-0.5 text-[9px] font-bold text-[#e04980]">9:16 Video</span>
            </div>
            <p className="mt-0.5 m-0 text-xs text-[var(--text-secondary)]">
              Upload a short educational/student 9:16 vertical video reel.
            </p>
          </div>
        </button>

        {/* Choice C: Create Startup Idea */}
        <button
          type="button"
          className="group relative flex items-center gap-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-4 text-left transition hover:border-[#f59e0b] hover:shadow-md cursor-pointer"
          onClick={handleSelectIdeaOption}
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] transition group-hover:scale-105 group-hover:bg-[#f59e0b] group-hover:text-white">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="m-0 text-sm font-bold text-[var(--text-primary)]">Create Startup Idea</h3>
              <span className="rounded-full bg-[#f59e0b]/10 px-2 py-0.5 text-[9px] font-bold text-[#f59e0b]">Startup Project</span>
            </div>
            <p className="mt-0.5 m-0 text-xs text-[var(--text-secondary)]">
              Share an innovative project, problem-solution, or startup concept.
            </p>
          </div>
        </button>
      </div>
    </div>,
    document.body
  );
}
