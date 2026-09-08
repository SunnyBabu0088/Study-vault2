import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Globe, ImagePlus, Lock, Plus, RefreshCw, Rocket, Trash2, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { uploadMedia } from '../api/client';

export default function CreateIdeaModal({ isOpen, onClose, initialData = null, initialMedia = [] }) {
  const { createPost, updatePost } = useStudy();

  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [hashtags, setHashtags] = useState(initialData?.hashtags || '');
  const [visibility, setVisibility] = useState(initialData?.visibility || 'public');
  const [schedule, setSchedule] = useState(
    initialData?.scheduled_date ? new Date(initialData.scheduled_date).toISOString().slice(0, 16) : ''
  );

  const [mediaList, setMediaList] = useState([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const addMediaInputRef = useRef(null);

  // Lock body scroll when composer is active
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

  // Sync initialMedia or initialData when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialData?.title || '');
    setContent(initialData?.content || '');
    setHashtags(initialData?.hashtags || '');
    setVisibility(initialData?.visibility || 'public');
    setSchedule(initialData?.scheduled_date ? new Date(initialData.scheduled_date).toISOString().slice(0, 16) : '');
    setErrorMessage('');
    setSubmitting(false);

    if (initialMedia && initialMedia.length > 0) {
      setMediaList(initialMedia);
      setActiveMediaIndex(0);
    } else if (initialData?.media_url) {
      try {
        const parsed = JSON.parse(initialData.media_url);
        if (Array.isArray(parsed)) {
          setMediaList(parsed.map((m, idx) => ({ id: `prev-${idx}`, url: m.url || m, type: m.type || initialData.media_type || 'image' })));
        } else {
          setMediaList([{ id: 'prev-0', url: initialData.media_url, type: initialData.media_type || 'image' }]);
        }
      } catch (_) {
        setMediaList([{ id: 'prev-0', url: initialData.media_url, type: initialData.media_type || 'image' }]);
      }
      setActiveMediaIndex(0);
    } else {
      setMediaList([]);
      setActiveMediaIndex(0);
    }
  }, [isOpen, initialData, initialMedia]);

  if (!isOpen) return null;

  const handleRequestClose = () => {
    if (submitting) return;
    const hasUnsavedContent = title.trim() || content.trim() || mediaList.length > 0;
    if (hasUnsavedContent && !initialData) {
      if (window.confirm('Discard draft?\n\nYour title, details, and selected media will be lost.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const validateAndProcessFiles = (filesList) => {
    const validItems = [];
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB max per file

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert(`File "${file.name}" is not a valid image or video format.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        alert(`File "${file.name}" exceeds the 50MB size limit.`);
        continue;
      }
      // Duplicate check
      const isDuplicate = mediaList.some(
        (existing) => existing.file && existing.file.name === file.name && existing.file.size === file.size
      );
      if (isDuplicate) continue;

      const isVideo = file.type.startsWith('video/');
      validItems.push({
        id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        url: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        name: file.name,
      });
    }

    if (validItems.length > 0) {
      setMediaList((prev) => [...prev, ...validItems]);
    }
  };

  const handleAddMoreMedia = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFiles(files);
    }
    if (addMediaInputRef.current) addMediaInputRef.current.value = '';
  };

  const handleRemoveMedia = (indexToRemove) => {
    setMediaList((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (activeMediaIndex >= next.length && next.length > 0) {
        setActiveMediaIndex(next.length - 1);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!title.trim()) {
      setErrorMessage('Post title is required');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Idea details are required');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setUploadStatusText('Preparing post...');
    setUploadProgressPercent(10);

    try {
      // Process & upload media files
      const uploadedMediaItems = [];

      for (let i = 0; i < mediaList.length; i++) {
        const item = mediaList[i];
        if (item.file) {
          const fileNum = i + 1;
          const totalFiles = mediaList.length;
          setUploadStatusText(`Uploading media ${fileNum} of ${totalFiles}...`);
          setUploadProgressPercent(Math.round(20 + ((i / totalFiles) * 70)));

          const uploadedUrl = await uploadMedia(item.file);
          uploadedMediaItems.push({
            url: uploadedUrl,
            type: item.type,
          });
        } else if (item.url) {
          uploadedMediaItems.push({
            url: item.url,
            type: item.type,
          });
        }
      }

      setUploadProgressPercent(95);
      setUploadStatusText('Saving startup idea...');

      let finalMediaUrl = null;
      let finalMediaType = null;

      if (uploadedMediaItems.length === 1) {
        finalMediaUrl = uploadedMediaItems[0].url;
        finalMediaType = uploadedMediaItems[0].type;
      } else if (uploadedMediaItems.length > 1) {
        finalMediaUrl = JSON.stringify(uploadedMediaItems);
        finalMediaType = 'carousel';
      }

      if (initialData?.id) {
        await updatePost(initialData.id, {
          title: title.trim(),
          content: content.trim(),
          hashtags: hashtags.trim(),
          visibility,
          scheduled_date: schedule ? new Date(schedule).toISOString() : null,
          media_url: finalMediaUrl,
          media_type: finalMediaType,
        });
      } else {
        await createPost({
          title: title.trim(),
          content: content.trim(),
          hashtags: hashtags.trim(),
          visibility,
          scheduled_date: schedule ? new Date(schedule).toISOString() : '',
          media_url: finalMediaUrl,
          media_type: finalMediaType,
        });
      }

      setUploadProgressPercent(100);
      onClose();
    } catch (err) {
      console.error('Create/Update idea error:', err);
      setErrorMessage(err.message || 'Failed to upload media and publish idea. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadStatusText('');
      setUploadProgressPercent(0);
    }
  };

  const currentMedia = mediaList[activeMediaIndex] || mediaList[0];

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
      aria-label="Create Startup Idea Page"
      role="dialog"
    >
      {/* FULL-SCREEN TOP NAVIGATION HEADER */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-[var(--button-background)] text-[var(--text-primary)] transition hover:bg-[var(--border-color)] cursor-pointer"
            onClick={handleRequestClose}
            aria-label="Back to Startup Wall"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="m-0 text-base font-bold text-[var(--text-primary)] leading-tight">
              {initialData ? 'Edit Startup Idea' : 'Create Startup Idea'}
            </h1>
            <p className="m-0 text-[11px] text-[var(--text-muted)]">Share your concept with your circle</p>
          </div>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-[var(--button-background)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)] cursor-pointer"
          onClick={handleRequestClose}
          aria-label="Close composer"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* SCROLLABLE FULL-SCREEN FORM BODY */}
      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* INSTAGRAM-STYLE MEDIA PREVIEW CAROUSEL */}
          {mediaList.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-black/90">
              {/* Active Media Container */}
              <div className="relative flex items-center justify-center min-h-[240px] max-h-[380px] w-full bg-black">
                {currentMedia?.type === 'video' ? (
                  <video
                    className="max-h-[380px] w-full object-contain"
                    src={currentMedia.url}
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img
                    className="max-h-[380px] w-full object-contain"
                    src={currentMedia.url}
                    alt="Preview"
                  />
                )}

                {/* Remove Current Item Button */}
                <button
                  type="button"
                  className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/75 px-3 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-md hover:bg-rose-600 transition cursor-pointer"
                  onClick={() => handleRemoveMedia(activeMediaIndex)}
                  title="Remove this media item"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-300" /> Remove
                </button>

                {/* Multiple Media Badge & Navigation */}
                {mediaList.length > 1 && (
                  <>
                    <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                      {activeMediaIndex + 1} / {mediaList.length}
                    </span>

                    <button
                      type="button"
                      disabled={activeMediaIndex === 0}
                      className="absolute left-2 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm disabled:opacity-30 cursor-pointer"
                      onClick={() => setActiveMediaIndex((prev) => Math.max(0, prev - 1))}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      disabled={activeMediaIndex === mediaList.length - 1}
                      className="absolute right-2 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm disabled:opacity-30 cursor-pointer"
                      onClick={() => setActiveMediaIndex((prev) => Math.min(mediaList.length - 1, prev + 1))}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Bottom Thumbnail Strip & Add More Button */}
              <div className="flex items-center gap-2 overflow-x-auto p-2 bg-[var(--surface-secondary)] border-t border-[var(--border-color)]">
                {mediaList.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    className={`relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                      idx === activeMediaIndex ? 'border-[#3b52cf] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => setActiveMediaIndex(idx)}
                  >
                    {item.type === 'video' ? (
                      <video className="h-full w-full object-cover pointer-events-none" src={item.url} />
                    ) : (
                      <img className="h-full w-full object-cover" src={item.url} alt="thumb" />
                    )}
                  </button>
                ))}

                <button
                  type="button"
                  className="flex h-14 shrink-0 items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#3b52cf] px-3.5 text-xs font-bold text-[#3b52cf] hover:bg-[#3b52cf]/10 transition cursor-pointer"
                  onClick={() => addMediaInputRef.current?.click()}
                  title="Add more images or videos"
                >
                  <Plus className="h-4 w-4" /> Add More
                </button>
              </div>
            </div>
          )}

          {/* If no media yet, show Add Media button */}
          {mediaList.length === 0 && (
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#c8cdd9] dark:border-[#263244] bg-[var(--bg-input)] py-6 text-xs font-bold text-[#3b52cf] dark:text-[#60a5fa] transition hover:border-[#3b52cf] cursor-pointer"
                onClick={() => addMediaInputRef.current?.click()}
              >
                <ImagePlus className="h-5 w-5" /> + Select Images / Videos from Gallery
              </button>
            </div>
          )}

          <input
            ref={addMediaInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleAddMoreMedia}
          />

          {/* Title Input */}
          <div className="py-2 border-b border-[var(--border)]/50 focus-within:border-[var(--accent)] transition-colors space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Post Title *
            </label>
            <input
              className="create-post-flat-input w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border-none p-0 focus:ring-0"
              style={{ backgroundColor: 'transparent', background: 'transparent' }}
              required
              placeholder="e.g. Final Semester Exam Notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Details Input */}
          <div className="py-2 border-b border-[var(--border)]/50 focus-within:border-[var(--accent)] transition-colors space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Idea Details *
              </label>
              <span className="text-[10px] font-medium text-[var(--text-muted)]">{content.length}/2,200</span>
            </div>
            <textarea
              className="create-post-flat-input w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border-none p-0 resize-none focus:ring-0 leading-relaxed min-h-[90px]"
              style={{ backgroundColor: 'transparent', background: 'transparent' }}
              required
              placeholder="Write a caption for your post..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Hashtags Input */}
          <div className="py-2 border-b border-[var(--border)]/50 focus-within:border-[var(--accent)] transition-colors space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Hashtags
            </label>
            <input
              className="create-post-flat-input w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border-none p-0 focus:ring-0"
              style={{ backgroundColor: 'transparent', background: 'transparent' }}
              placeholder="#study #coding #notes"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
          </div>

          {/* Visibility */}
          <div className="py-2 border-b border-[var(--border)]/50 focus-within:border-[var(--accent)] transition-colors space-y-1 relative">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Visibility
            </label>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                {visibility === 'private' ? (
                  <Lock className="h-4 w-4 text-[var(--text-primary)] shrink-0" />
                ) : (
                  <Globe className="h-4 w-4 text-[var(--text-primary)] shrink-0" />
                )}
                <select
                  className="create-post-flat-input w-full appearance-none bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none border-none p-0 cursor-pointer pr-6 focus:ring-0"
                  style={{ backgroundColor: 'transparent', background: 'transparent' }}
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option value="public" className="bg-[var(--surface)] text-[var(--text-primary)]">Public</option>
                  <option value="private" className="bg-[var(--surface)] text-[var(--text-primary)]">Private</option>
                </select>
              </div>
              <ChevronDown className="h-4 w-4 text-[var(--text-muted)] pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* UPLOAD STATUS & PROGRESS BAR */}
          {submitting && (
            <div className="rounded-xl border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--brand-orange)]">
                <span>{uploadStatusText || 'Publishing idea...'}</span>
                <span>{uploadProgressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border-color)]">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${uploadProgressPercent}%`, background: 'var(--brand-gradient)' }}
                />
              </div>
            </div>
          )}

          {/* ERROR MESSAGE & RETRY */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-center justify-between gap-2 text-xs font-semibold text-rose-500">
              <span className="flex-1">{errorMessage}</span>
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-white font-bold text-[11px] shadow-xs cursor-pointer hover:bg-rose-600"
                onClick={handleSubmit}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)] pb-8">
            <button
              type="button"
              className="rounded-xl px-5 py-3 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--button-background)] cursor-pointer"
              onClick={handleRequestClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white shadow-md transition hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
              disabled={submitting}
            >
              <Rocket className="h-4 w-4" />
              {submitting ? 'Publishing…' : initialData ? 'Update Idea' : 'Publish Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
