import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, ChevronDown, ImagePlus, Trash2, Video, Sparkles, X, AlertCircle, Plus, Smile, Globe, Lock } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useStudy } from '../context/StudyContext';
import StoryCameraView from './StoryCameraView';
import ModeSelectorCarousel from './ModeSelectorCarousel';

const ASPECT_RATIOS = [
  { id: 'original', label: 'Original', class: 'aspect-auto' },
  { id: '1:1', label: '1:1', class: 'aspect-square' },
  { id: '4:5', label: '4:5', class: 'aspect-[4/5]' },
  { id: '2:3', label: '2:3', class: 'aspect-[2/3]' },
  { id: '3:2', label: '3:2', class: 'aspect-[3/2]' },
  { id: '9:16', label: '9:16', class: 'aspect-[9/16]' },
  { id: '16:9', label: '16:9', class: 'aspect-[16/9]' },
];

const CONTENT_TYPES = [
  { id: 'POST', label: 'POST' },
  { id: 'STORY', label: 'STORY' },
  { id: 'REEL', label: 'REEL' },
  { id: 'IDEA', label: 'IDEA' },
  { id: 'LIVE', label: 'LIVE' },
];

export default function UnifiedCreateModal({ isOpen, onClose, initialMedia = [], defaultMode = 'POST' }) {
  const { user, refreshPosts, refreshStories, refreshReels } = useStudy();

  const [activeMode, setActiveMode] = useState(defaultMode);
  const [mediaItems, setMediaItems] = useState(initialMedia || []);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isModeMoving, setIsModeMoving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [category, setCategory] = useState('startup');
  const [visibility, setVisibility] = useState('public');

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const pickerRef = useRef(null);

  // Sync initial media and mode
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setMediaItems(initialMedia || []);
      setActiveMediaIndex(0);
      setErrorMsg('');
      setSuccessMsg('');
      setTitle('');
      setCaption('');
      setHashtags('');
      setIsTyping(false);
      setIsClosing(false);

      if (defaultMode === 'STORY' || defaultMode === 'REEL') setAspectRatio('9:16');
      else if (defaultMode === 'IDEA') setAspectRatio('1:1');
      else setAspectRatio('4:5');

      setActiveMode(defaultMode);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialMedia, defaultMode]);

  const handleClose = () => {
    if (uploading || isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 180);
  };

  // Adjust aspect ratio default & trigger smooth content transition on mode switch
  const handleModeSwitch = (mode) => {
    if (mode === activeMode) return;
    setIsTransitioning(true);
    setIsModeMoving(true);

    setTimeout(() => {
      setActiveMode(mode);
      setErrorMsg('');
      if (mode === 'STORY' || mode === 'REEL') setAspectRatio('9:16');
      else if (mode === 'IDEA') setAspectRatio('1:1');
      else setAspectRatio('4:5');
      setIsTransitioning(false);
    }, 140);

    setTimeout(() => {
      setIsModeMoving(false);
    }, 320);
  };

  const handleAddMediaClick = () => {
    if (pickerRef.current) {
      pickerRef.current.value = '';
      pickerRef.current.click();
    }
  };

  const handleMediaFilesSelected = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
      newItems.push({
        id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name
      });
    }

    if (newItems.length > 0) {
      setMediaItems((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemoveMedia = (index) => {
    setMediaItems((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (activeMediaIndex >= updated.length) {
        setActiveMediaIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Str = reader.result.split(',')[1];
        resolve(base64Str);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadSingleMedia = async (mediaItem) => {
    if (!mediaItem || !mediaItem.file) return mediaItem?.url || null;

    const base64Content = await fileToBase64(mediaItem.file);
    const res = await apiRequest('/api/uploads', {
      method: 'POST',
      body: {
        filename: mediaItem.name || 'upload.png',
        mimeType: mediaItem.file.type || 'image/png',
        content: base64Content
      }
    });

    const storedName = res.upload?.stored_name || res.stored_name;
    return `/uploads/public/${storedName}`;
  };

  const handlePublish = async () => {
    if (activeMode === 'LIVE') return;
    setErrorMsg('');
    setUploading(true);

    try {
      let uploadedUrl = null;
      let uploadedType = 'image';

      if (mediaItems.length > 0) {
        const primaryItem = mediaItems[activeMediaIndex] || mediaItems[0];
        uploadedUrl = await uploadSingleMedia(primaryItem);
        uploadedType = primaryItem.type;
      }

      if (activeMode === 'POST') {
        if (!caption.trim() && !uploadedUrl) {
          throw new Error('Please add a caption or media to publish your post.');
        }

        await apiRequest('/api/posts', {
          method: 'POST',
          body: {
            title: title.trim() || 'Study Post',
            content: caption.trim() || 'StudyVault update',
            hashtags: hashtags.trim(),
            visibility,
            media_url: uploadedUrl,
            media_type: uploadedType,
            category
          }
        });

        if (refreshPosts) refreshPosts();
        setSuccessMsg('Post published successfully!');
      } else if (activeMode === 'STORY') {
        if (!uploadedUrl && !caption.trim()) {
          throw new Error('Please select media or enter text for your story.');
        }

        await apiRequest('/api/stories', {
          method: 'POST',
          body: {
            content: caption.trim() || 'New Story',
            mediaUrl: uploadedUrl,
            mediaType: uploadedType,
            background: 'linear-gradient(135deg, #FF3218 0%, #FF641F 45%, #FF9A32 75%, #FFD04A 100%)'
          }
        });

        if (refreshStories) refreshStories();
        setSuccessMsg('Story shared successfully!');
      } else if (activeMode === 'REEL') {
        if (!uploadedUrl || uploadedType !== 'video') {
          throw new Error('Reels require a video upload. Please select a video file.');
        }

        await apiRequest('/api/reels', {
          method: 'POST',
          body: {
            video_url: uploadedUrl,
            cover_url: uploadedUrl,
            caption: caption.trim(),
            hashtags: hashtags.trim(),
            visibility
          }
        });

        if (refreshReels) refreshReels();
        setSuccessMsg('Reel published successfully!');
      } else if (activeMode === 'IDEA') {
        if (!title.trim() && !caption.trim()) {
          throw new Error('Please enter a title or description for your startup idea.');
        }

        await apiRequest('/api/posts', {
          method: 'POST',
          body: {
            title: title.trim() || 'Startup Idea',
            content: caption.trim(),
            hashtags: hashtags.trim(),
            visibility,
            media_url: uploadedUrl,
            media_type: uploadedType,
            category: 'startup'
          }
        });

        if (refreshPosts) refreshPosts();
        setSuccessMsg('Idea published successfully!');
      }

      setTimeout(() => {
        handleClose();
      }, 800);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to publish content.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const currentMedia = mediaItems[activeMediaIndex];
  const selectedRatioObj = ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[1];
  const modeIndex = Math.max(0, CONTENT_TYPES.findIndex((t) => t.id === activeMode));

  const getHeaderTitle = () => {
    switch (activeMode) {
      case 'STORY': return 'New Story';
      case 'REEL': return 'New Reel';
      case 'IDEA': return 'New Idea';
      case 'LIVE': return 'New Live';
      default: return 'New Post';
    }
  };

  const getActionButtonText = () => {
    if (uploading) return 'Publishing...';
    switch (activeMode) {
      case 'STORY': return 'Share Story';
      case 'REEL': return 'Publish Reel';
      case 'IDEA': return 'Publish Idea';
      case 'LIVE': return 'Coming Soon';
      default: return 'Publish Post';
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[999999] flex h-[100dvh] w-[100vw] flex-col overflow-hidden bg-[var(--background)] text-[var(--text-primary)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] select-none ${
        isClosing ? 'opacity-0 scale-[0.98] blur-sm duration-500' : 'opacity-100 scale-100 blur-none animate-in fade-in-50 zoom-in-98 duration-500'
      }`}
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
      aria-label="Fullscreen Content Creator"
      role="dialog"
    >
      {/* SOFT STATIC RGB AMBIENT BACKGROUND LIGHT (STILL ONCE OPEN - ZERO CONTINUOUS ANIMATION) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-25 mix-blend-screen overflow-hidden z-0"
        aria-hidden="true"
      >
        <div
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'rgba(0, 122, 255, 0.25)' }}
        />
        <div
          className="absolute top-[20%] -right-[10%] w-[55vw] h-[55vw] rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'rgba(124, 58, 237, 0.25)' }}
        />
        <div
          className="absolute -bottom-[10%] left-[20%] w-[65vw] h-[65vw] rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'rgba(0, 210, 255, 0.20)' }}
        />
        <div
          className="absolute bottom-[10%] right-[10%] w-[50vw] h-[50vw] rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'rgba(217, 70, 239, 0.20)' }}
        />
      </div>

      <input
        ref={pickerRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleMediaFilesSelected}
      />

      {/* TOP HEADER */}
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 py-3 shrink-0 z-20">
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel</span>
        </button>

        <h2 className="text-sm font-bold text-[var(--text-primary)] m-0 transition-all duration-200">{getHeaderTitle()}</h2>

        <button
          type="button"
          disabled={uploading || activeMode === 'LIVE'}
          onClick={handlePublish}
          className="rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm active:scale-95 disabled:opacity-50 transition-all duration-150 cursor-pointer hover:opacity-95"
          style={{ background: 'var(--brand-gradient)', boxShadow: '0 3px 12px var(--brand-glow)' }}
        >
          {getActionButtonText()}
        </button>
      </header>

      {/* ALERTS */}
      {errorMsg && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 p-3 text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 shrink-0 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 shrink-0 animate-fade-in">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* MAIN CONTENT WORKSPACE (UNIFIED 300MS TRANSITION PIPELINE FOR ALL MODES) */}
      {activeMode === 'STORY' ? (
        <div className={`fixed inset-0 z-[9999999] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isTransitioning ? 'opacity-0 scale-[0.98] translate-x-2 pointer-events-none' : 'opacity-100 scale-100 translate-x-0'}`}>
          <StoryCameraView
            onClose={handleClose}
            onModeSelect={handleModeSwitch}
          />
        </div>
      ) : (
        <div className={`flex-1 overflow-y-auto w-full max-w-xl mx-auto px-4 py-4 pb-32 space-y-6 bg-[var(--background)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isTransitioning ? 'opacity-0 scale-[0.98] -translate-x-2' : 'opacity-100 scale-100 translate-x-0'}`}>
          
          {/* MEDIA PREVIEW AREA */}
        <div className="flex flex-col items-center justify-center space-y-3">
          {currentMedia ? (
            <div className={`relative max-h-[38dvh] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/40 border border-[var(--border)] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${selectedRatioObj.class}`}>
              {currentMedia.type === 'video' ? (
                <video src={currentMedia.url} controls className="h-full w-full object-contain rounded-2xl transition-opacity duration-300" />
              ) : (
                <img src={currentMedia.url} alt="Preview" className="h-full w-full object-contain rounded-2xl transition-opacity duration-300" />
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-[var(--border)]/70 rounded-2xl bg-transparent space-y-2 transition-all duration-200">
              <div className="p-2.5 bg-[var(--accent-soft)] text-[var(--accent)] rounded-xl">
                <ImagePlus className="h-6 w-6" />
              </div>
              <p className="font-medium text-xs text-[var(--text-secondary)] m-0">No media selected</p>
              <button
                type="button"
                onClick={handleAddMediaClick}
                className="text-xs font-bold text-[var(--accent)] hover:underline active:scale-95 transition-transform"
              >
                + Select Photo or Video
              </button>
            </div>
          )}

          {/* MINIMAL HORIZONTAL ASPECT RATIO SELECTOR WITH SLIDING UNDERLINE */}
          <div className="relative flex items-center gap-3 overflow-x-auto max-w-full px-1 py-1 scrollbar-none">
            {ASPECT_RATIOS.map((ratio) => {
              const isSelected = aspectRatio === ratio.id;
              return (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`relative px-2.5 py-1 text-[11px] outline-none transition-colors duration-200 shrink-0 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'text-[var(--accent)] font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
                  }`}
                >
                  <span>{ratio.label}</span>
                  {isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)] rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* CAROUSEL THUMBNAILS & MEDIA ACTIONS */}
          {mediaItems.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto max-w-full px-1 py-1">
              {mediaItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 active:scale-95 ${
                    idx === activeMediaIndex ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => setActiveMediaIndex(idx)}
                >
                  {item.type === 'video' ? (
                    <div className="h-full w-full bg-slate-900 flex items-center justify-center text-white">
                      <Video className="h-4 w-4" />
                    </div>
                  ) : (
                    <img src={item.url} alt="thumb" className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMedia(idx);
                    }}
                    className="absolute top-0.5 right-0.5 grid h-4 w-4 place-items-center rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddMediaClick}
                className="h-12 w-12 shrink-0 rounded-lg border border-dashed border-[var(--border)] bg-transparent flex items-center justify-center text-[var(--accent)] hover:border-[var(--accent)] active:scale-95 transition-all duration-150 cursor-pointer"
                title="Add media"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* 100% FLAT CONTINUOUS FORM SECTIONS (NO CARD CONTAINERS / NO BOXED BACKGROUNDS) */}
        <div className="space-y-5 pt-2">

          {activeMode === 'LIVE' ? (
            <div className="py-8 text-center space-y-2 border-b border-[var(--border)]/50">
              <Sparkles className="h-6 w-6 text-rose-500 mx-auto animate-pulse" />
              <p className="font-bold text-sm text-[var(--text-primary)] m-0">StudyVault Live</p>
              <p className="text-xs text-[var(--text-muted)] m-0">Live streaming is coming soon for student study rooms.</p>
            </div>
          ) : (
            <>
              {/* POST / IDEA TITLE ROW */}
              {(activeMode === 'IDEA' || activeMode === 'POST') && (
                <div className="py-2 border-b border-[var(--border)]/40 focus-within:border-[var(--accent)] transition-colors duration-200 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    {activeMode === 'IDEA' ? 'IDEA TITLE *' : 'POST TITLE'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder={activeMode === 'IDEA' ? 'e.g. AI-powered Study Companion' : 'e.g. Final Semester Exam Notes'}
                    className="create-post-flat-input w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:outline-none focus-visible:outline-none border-none p-0 focus:ring-0 focus-visible:ring-0"
                    style={{ backgroundColor: 'transparent', background: 'transparent' }}
                  />
                </div>
              )}

              {/* CAPTION & DETAILS ROW */}
              <div className="py-2 border-b border-[var(--border)]/40 focus-within:border-[var(--accent)] transition-colors duration-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {activeMode === 'STORY' ? 'STORY TEXT' : activeMode === 'REEL' ? 'CAPTION' : activeMode === 'IDEA' ? 'DESCRIPTION & PROBLEM-SOLUTION *' : 'CAPTION & DETAILS'}
                  </label>
                  <span className="text-[10px] font-medium text-[var(--text-muted)] transition-colors">{caption.length}/2,200</span>
                </div>
                <div className="relative flex items-start gap-2">
                  <textarea
                    rows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder={
                      activeMode === 'STORY'
                        ? 'Write story caption...'
                        : activeMode === 'REEL'
                        ? 'Write reel caption...'
                        : activeMode === 'IDEA'
                        ? 'Describe your startup concept, problem, and key solution...'
                        : 'Write a caption for your post...'
                    }
                    className="create-post-flat-input w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:outline-none focus-visible:outline-none border-none p-0 resize-none focus:ring-0 focus-visible:ring-0 leading-relaxed"
                    style={{ backgroundColor: 'transparent', background: 'transparent' }}
                  />
                  <button type="button" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] pt-0.5 active:scale-95 transition-transform">
                    <Smile className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* HASHTAGS ROW */}
              {activeMode !== 'STORY' && (
                <div className="py-2 border-b border-[var(--border)]/40 focus-within:border-[var(--accent)] transition-colors duration-200 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">HASHTAGS</label>
                  <input
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder="#study #coding #notes"
                    className="create-post-flat-input w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:outline-none focus-visible:outline-none border-none p-0 focus:ring-0 focus-visible:ring-0"
                    style={{ backgroundColor: 'transparent', background: 'transparent' }}
                  />
                </div>
              )}

              {/* VISIBILITY ROW */}
              {activeMode !== 'STORY' && (
                <div className="py-2 border-b border-[var(--border)]/40 focus-within:border-[var(--accent)] transition-colors duration-200 space-y-1 relative">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">VISIBILITY</label>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {visibility === 'private' ? (
                        <Lock className="h-4 w-4 text-[var(--text-primary)] shrink-0" />
                      ) : (
                        <Globe className="h-4 w-4 text-[var(--text-primary)] shrink-0" />
                      )}
                      <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                        onFocus={() => setIsTyping(true)}
                        onBlur={() => setIsTyping(false)}
                        className="create-post-flat-input w-full appearance-none bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none focus:outline-none focus-visible:outline-none border-none p-0 cursor-pointer pr-6 focus:ring-0 focus-visible:ring-0"
                        style={{ backgroundColor: 'transparent', background: 'transparent' }}
                      >
                        <option value="public" className="bg-[var(--surface)] text-[var(--text-primary)]">Public</option>
                        <option value="private" className="bg-[var(--surface)] text-[var(--text-primary)]">Private</option>
                      </select>
                    </div>
                    <ChevronDown className="h-4 w-4 text-[var(--text-muted)] pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )}

      {/* ModeSelectorCarousel Component */}
      <ModeSelectorCarousel activeMode={activeMode} onModeSelect={handleModeSwitch} />
    </div>,
    document.body
  );
}
