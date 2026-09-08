import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronDown, Film, Globe, Image, Lock, RefreshCw, Rocket, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export default function CreateReelPage({ isOpen, onClose, initialVideo = null }) {
  const { createReel } = useStudy();

  const [videoItem, setVideoItem] = useState(initialVideo);
  const [coverItem, setCoverItem] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [visibility, setVisibility] = useState('public');

  const [submitting, setSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const videoPickerRef = useRef(null);
  const coverPickerRef = useRef(null);

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

  useEffect(() => {
    if (initialVideo) {
      setVideoItem(initialVideo);
    }
  }, [initialVideo]);

  if (!isOpen) return null;

  const handleRequestClose = () => {
    if (submitting) return;
    const hasUnsaved = caption.trim() || videoItem;
    if (hasUnsaved) {
      if (window.confirm('Discard Reel draft?\n\nYour video and caption will be lost.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleVideoChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      return;
    }
    setVideoItem({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    });
  };

  const handleCoverChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image for the cover.');
      return;
    }
    setCoverItem({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!videoItem || !videoItem.file) {
      setErrorMessage('A video file is required to publish a Reel.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setUploadStatusText('Uploading reel video...');
    setUploadProgressPercent(35);

    try {
      await createReel({
        video_file: videoItem.file,
        cover_file: coverItem?.file || null,
        caption: caption.trim(),
        hashtags: hashtags.trim(),
        visibility,
      });

      setUploadProgressPercent(100);
      onClose();
    } catch (err) {
      console.error('Create Reel error:', err);
      setErrorMessage(err.message || 'Failed to upload and publish Reel. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadStatusText('');
      setUploadProgressPercent(0);
    }
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
      aria-label="Create Reel Page"
      role="dialog"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-[var(--button-background)] text-[var(--text-primary)] transition hover:bg-[var(--border-color)] cursor-pointer"
            onClick={handleRequestClose}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="m-0 text-base font-bold text-[var(--text-primary)] leading-tight">Create Reel</h1>
            <p className="m-0 text-[11px] text-[var(--text-muted)]">Post a 9:16 vertical video reel</p>
          </div>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-[var(--button-background)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          onClick={handleRequestClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 9:16 VERTICAL VIDEO PREVIEW */}
          {videoItem ? (
            <div className="relative mx-auto max-w-[280px] aspect-[9/16] overflow-hidden rounded-3xl border-2 border-[var(--border-color)] bg-black shadow-xl">
              <video
                className="h-full w-full object-cover"
                src={videoItem.url}
                controls
                autoPlay
                loop
                muted
                playsInline
              />
              <button
                type="button"
                className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md hover:bg-rose-600 transition cursor-pointer"
                onClick={() => videoPickerRef.current?.click()}
              >
                Change Video
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex mx-auto max-w-[280px] aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-[#e04980] bg-[var(--surface)] p-6 text-center text-[#e04980] hover:bg-[#e04980]/10 transition cursor-pointer"
              onClick={() => videoPickerRef.current?.click()}
            >
              <Film className="h-10 w-10" />
              <span className="text-sm font-bold">+ Select 9:16 Video</span>
            </button>
          )}

          <input
            ref={videoPickerRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoChange}
          />

          {/* Cover Thumbnail Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Cover Image (Optional)
            </label>
            <div className="flex items-center gap-3">
              {coverItem ? (
                <img className="h-16 w-16 rounded-xl object-cover border-2 border-[#e04980]" src={coverItem.url} alt="Cover" />
              ) : null}
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 py-2.5 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--border-color)] cursor-pointer"
                onClick={() => coverPickerRef.current?.click()}
              >
                <Image className="h-4 w-4 text-[#e04980]" />
                {coverItem ? 'Change Cover' : '+ Choose Cover Thumbnail'}
              </button>
            </div>
            <input
              ref={coverPickerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>

          {/* Caption */}
          <div className="py-2 border-b border-[var(--border)]/50 focus-within:border-[var(--accent)] transition-colors space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Caption
            </label>
            <textarea
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border-none p-0 resize-none focus:ring-0 leading-relaxed min-h-[80px]"
              placeholder="Write a caption for your reel..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {/* Hashtags */}
          <div className="py-2 border-b border-[var(--border)]/50 focus-within:border-[var(--accent)] transition-colors space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Hashtags
            </label>
            <input
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border-none p-0 focus:ring-0"
              placeholder="#reels #studyvault #tech"
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
                  className="w-full appearance-none bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none border-none p-0 cursor-pointer pr-6 focus:ring-0"
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

          {/* Upload Progress Bar */}
          {submitting && (
            <div className="rounded-xl border border-[#e04980]/30 bg-[#e04980]/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#e04980]">
                <span>{uploadStatusText || 'Publishing Reel...'}</span>
                <span>{uploadProgressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border-color)]">
                <div
                  className="h-full bg-[#e04980] transition-all duration-300"
                  style={{ width: `${uploadProgressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error & Retry */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-center justify-between gap-2 text-xs font-semibold text-rose-500">
              <span className="flex-1">{errorMessage}</span>
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-white font-bold text-[11px] cursor-pointer hover:bg-rose-600"
                onClick={handleSubmit}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Action Buttons */}
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
              className="flex items-center gap-2 rounded-xl bg-[#e04980] px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#c7356c] disabled:opacity-50 cursor-pointer"
              disabled={submitting}
            >
              <Rocket className="h-4 w-4" />
              {submitting ? 'Publishing Reel…' : 'Publish Reel'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
