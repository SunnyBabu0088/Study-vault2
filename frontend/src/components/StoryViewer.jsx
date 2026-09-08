import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit3, Heart, MinusCircle, MoreVertical, PlusCircle, Share2, Trash2, X, Music } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { apiRequest } from '../api/client';

export default function StoryViewer({ stories, currentIndex, onClose, onSelectIndex, onHighlightUpdated, onMemoryUpdated }) {
  const { openConversation, setIsStoryOpen } = useStudy();
  const currentStory = stories[currentIndex];

  const [liked, setLiked] = useState(currentStory?.reacted || false);
  const [replyText, setReplyText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [userMemories, setUserMemories] = useState([]);
  const [showMemoryPicker, setShowMemoryPicker] = useState(false);
  const [addedMsg, setAddedMsg] = useState('');

  // Story Video, Audio & Progress state
  const videoRef = useRef(null);
  const storyAudioRef = useRef(null);
  const isVideo = Boolean(
    currentStory?.mediaType === 'video' ||
    (typeof currentStory?.mediaUrl === 'string' &&
      (currentStory.mediaUrl.endsWith('.mp4') || currentStory.mediaUrl.endsWith('.webm') || currentStory.mediaUrl.includes('video')))
  );

  const [storyDuration, setStoryDuration] = useState(5000); // Default 5000ms for images
  const [elapsedTime, setElapsedTime] = useState(0); // 0 to storyDuration
  const [isPaused, setIsPaused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isHoldTriggered, setIsHoldTriggered] = useState(false);

  const holdTimerRef = useRef(null);

  // Rename Highlight state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameText, setRenameText] = useState('');

  // Lock scroll & notify app context that story viewer is open
  useEffect(() => {
    if (setIsStoryOpen) setIsStoryOpen(true);
    document.body.style.overflow = 'hidden';

    return () => {
      if (setIsStoryOpen) setIsStoryOpen(false);
      document.body.style.overflow = '';
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, [setIsStoryOpen]);

  // Reset state on story change
  useEffect(() => {
    setLiked(currentStory?.reacted || false);
    setReplyText('');
    setCopied(false);
    setShowMoreMenu(false);
    setShowMemoryPicker(false);
    setIsRenaming(false);
    setAddedMsg('');
    setElapsedTime(0);
    setIsPaused(false);
    setIsTyping(false);
    setIsHoldTriggered(false);
    setStoryDuration(5000);

    // Record view in backend
    if (currentStory && currentStory.id && !currentStory.id.startsWith('story-')) {
      apiRequest(`/api/stories/${currentStory.id}/view`, { method: 'POST' }).catch(() => {});
    }
  }, [currentIndex, currentStory]);

  // Story Music Preview Playback Synchronization
  useEffect(() => {
    if (storyAudioRef.current) {
      storyAudioRef.current.pause();
      storyAudioRef.current = null;
    }

    const music = currentStory?.music;
    if (music && music.previewUrl) {
      const audio = new Audio(music.previewUrl);
      storyAudioRef.current = audio;
      audio.currentTime = Number(music.startTime) || 0;
      audio.volume = 0.85;

      const stopTime = Number(music.endTime) || Math.min((Number(music.startTime) || 0) + 15, 30);

      audio.ontimeupdate = () => {
        if (audio.currentTime >= stopTime) {
          audio.currentTime = Number(music.startTime) || 0;
          audio.play().catch(() => {});
        }
      };

      if (!isPaused && !showMoreMenu && !showMemoryPicker && !isRenaming && !isTyping) {
        audio.play().catch(() => {});
      }
    }

    return () => {
      if (storyAudioRef.current) {
        storyAudioRef.current.pause();
        storyAudioRef.current = null;
      }
    };
  }, [currentIndex, currentStory, isPaused, showMoreMenu, showMemoryPicker, isRenaming, isTyping]);

  // Video and Music play/pause synchronization
  useEffect(() => {
    if (isVideo && videoRef.current) {
      if (showMoreMenu || showMemoryPicker || isRenaming || isPaused || isTyping) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    if (storyAudioRef.current) {
      if (showMoreMenu || showMemoryPicker || isRenaming || isPaused || isTyping) {
        storyAudioRef.current.pause();
      } else {
        storyAudioRef.current.play().catch(() => {});
      }
    }
  }, [isVideo, showMoreMenu, showMemoryPicker, isRenaming, isPaused, isTyping]);

  // Auto-advance loop for Image stories
  useEffect(() => {
    if (isVideo || showMoreMenu || showMemoryPicker || isRenaming || isPaused || isTyping) {
      return;
    }

    const stepTime = 50;
    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const nextTime = prev + stepTime;
        if (nextTime >= storyDuration) {
          clearInterval(interval);
          if (currentIndex < stories.length - 1) {
            onSelectIndex(currentIndex + 1);
          } else {
            onClose();
          }
          return storyDuration;
        }
        return nextTime;
      });
    }, stepTime);

    return () => clearInterval(interval);
  }, [currentIndex, stories.length, onClose, onSelectIndex, showMoreMenu, showMemoryPicker, isRenaming, isPaused, isTyping, isVideo, storyDuration]);

  // Video Event Handlers for accurate timing sync
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setElapsedTime(videoRef.current.currentTime * 1000);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setStoryDuration(videoRef.current.duration * 1000);
    }
  };

  const handleVideoEnded = () => {
    if (currentIndex < stories.length - 1) {
      onSelectIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  // Fetch memories for memory picker
  useEffect(() => {
    const fetchUserMemories = async () => {
      try {
        const res = await apiRequest('/api/memories');
        const list = res.data?.memories || res.data?.highlights || res.memories || res.highlights || [];
        setUserMemories(list);
      } catch (_) {}
    };
    fetchUserMemories();
  }, []);

  // Keyboard Navigation (Left / Right / Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) onSelectIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < stories.length - 1) {
          onSelectIndex(currentIndex + 1);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stories.length, onClose, onSelectIndex]);

  if (!currentStory) return null;

  // Pointer event handlers for hold-to-pause & tap navigation (left 33% = prev, right 67% = next)
  const handlePointerDown = (e) => {
    if (showMoreMenu || showMemoryPicker || isRenaming) return;

    setIsHoldTriggered(false);
    holdTimerRef.current = setTimeout(() => {
      setIsPaused(true);
      setIsHoldTriggered(true);
    }, 350);
  };

  const handlePointerUp = (e) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    if (isHoldTriggered) {
      setIsPaused(false);
      setIsHoldTriggered(false);
      return;
    }

    const clickX = e.clientX;
    const windowWidth = window.innerWidth;

    if (clickX < windowWidth * 0.33) {
      if (currentIndex > 0) {
        onSelectIndex(currentIndex - 1);
      }
    } else {
      if (currentIndex < stories.length - 1) {
        onSelectIndex(currentIndex + 1);
      } else {
        onClose();
      }
    }
  };

  const handlePointerCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    if (isHoldTriggered) {
      setIsPaused(false);
      setIsHoldTriggered(false);
    }
  };

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    const nextLiked = !liked;
    setLiked(nextLiked);

    if (currentStory.id && !currentStory.id.startsWith('story-')) {
      try {
        const res = await apiRequest(`/api/stories/${currentStory.id}/react`, {
          method: 'POST',
          body: { reactionType: 'heart' },
        });
        if (res.reacted !== undefined) {
          setLiked(res.reacted);
        }
      } catch (err) {
        console.error('Failed to react to story:', err);
      }
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareText = `${currentStory.name}'s Story: ${currentStory.content}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentStory.name}'s Story on StudyVault`,
          text: shareText,
          url: window.location.href,
        });
        setAddedMsg('Shared!');
        setTimeout(() => setAddedMsg(''), 2000);
        return;
      } catch (_) {}
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setAddedMsg('Copied link!');
      setTimeout(() => {
        setCopied(false);
        setAddedMsg('');
      }, 2000);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!replyText.trim()) return;

    const message = replyText.trim();
    setReplyText('');

    if (currentStory.id && !currentStory.id.startsWith('story-')) {
      try {
        await apiRequest(`/api/stories/${currentStory.id}/reply`, {
          method: 'POST',
          body: { message },
        });
        setAddedMsg('Reply sent!');
        setTimeout(() => setAddedMsg(''), 2500);
      } catch (err) {
        console.error('Failed to send reply:', err);
        setAddedMsg('Failed to send reply');
        setTimeout(() => setAddedMsg(''), 2500);
      }
    } else {
      openConversation(currentStory.name);
      setAddedMsg('Reply sent!');
      setTimeout(() => setAddedMsg(''), 2500);
    }
  };

  const handleAddToMemory = async (memId, memName) => {
    try {
      await apiRequest(`/api/memories/${memId}/stories`, {
        method: 'POST',
        body: { storyId: currentStory.id },
      });
      setAddedMsg(`Added to ${memName}!`);
      setShowMemoryPicker(false);
      if (onMemoryUpdated) onMemoryUpdated();
      if (onHighlightUpdated) onHighlightUpdated();
      setTimeout(() => setAddedMsg(''), 2500);
    } catch (err) {
      console.error('Failed to add story to memory:', err);
    }
  };

  const handleSaveRename = async (e) => {
    e.preventDefault();
    const memId = currentStory.memoryId || currentStory.highlightId;
    if (!renameText.trim() || !memId) return;
    try {
      await apiRequest(`/api/memories/${memId}`, {
        method: 'PUT',
        body: { name: renameText.trim() },
      });
      setAddedMsg('Memory renamed!');
      setIsRenaming(false);
      if (onMemoryUpdated) onMemoryUpdated();
      if (onHighlightUpdated) onHighlightUpdated();
      setTimeout(() => setAddedMsg(''), 2500);
    } catch (err) {
      console.error('Failed to rename memory:', err);
    }
  };

  const handleRemoveStoryFromMemory = async () => {
    const memId = currentStory.memoryId || currentStory.highlightId;
    if (!memId || !currentStory.id) return;
    try {
      await apiRequest(`/api/memories/${memId}/stories/${currentStory.id}`, {
        method: 'DELETE',
      });
      setAddedMsg('Story removed');
      setShowMoreMenu(false);
      if (onMemoryUpdated) onMemoryUpdated();
      if (onHighlightUpdated) onHighlightUpdated();
      setTimeout(() => setAddedMsg(''), 2500);
    } catch (err) {
      console.error('Failed to remove story from memory:', err);
    }
  };

  const handleDeleteMemory = async () => {
    const memId = currentStory.memoryId || currentStory.highlightId;
    if (!memId) return;
    if (window.confirm(`Delete memory "${currentStory.name}"?`)) {
      try {
        await apiRequest(`/api/memories/${memId}`, { method: 'DELETE' });
        if (onMemoryUpdated) onMemoryUpdated();
        if (onHighlightUpdated) onHighlightUpdated();
        onClose();
      } catch (err) {
        console.error('Failed to delete memory:', err);
      }
    }
  };

  const progressPercent = storyDuration > 0 ? Math.min((elapsedTime / storyDuration) * 100, 100) : 0;

  const content = (
    <div
      className="fixed inset-0 z-[999999] flex h-[100dvh] w-[100vw] flex-col justify-between overflow-hidden p-4 sm:p-6 transition-colors duration-200 select-none bg-[var(--background)] text-[var(--text-primary)]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 999999,
        background: currentStory.gradient || 'var(--background)',
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      aria-label="Full-Screen Story Viewer"
      role="dialog"
    >
      {/* Top Header & High-Contrast Progress Bars */}
      <div className="relative z-20 max-w-xl mx-auto w-full" onPointerDown={(e) => e.stopPropagation()}>
        {/* Story Segment Bars (━━━━ ━━━━ ━━━━) */}
        <div className="flex gap-1.5 pt-2 pb-1 w-full" aria-label="Story progress bars">
          {stories.map((s, idx) => {
            let widthStr = '0%';
            if (idx < currentIndex) {
              widthStr = '100%';
            } else if (idx === currentIndex) {
              widthStr = `${progressPercent}%`;
            } else {
              widthStr = '0%';
            }

            return (
              <div
                key={s.id || idx}
                className="story-progress-track h-1.5 flex-1 overflow-hidden rounded-full backdrop-blur-xs shadow-inner"
                style={{
                  backgroundColor: 'var(--story-progress-track, rgba(255, 255, 255, 0.35))'
                }}
              >
                <div
                  className="story-progress-active h-full shadow-md transition-all ease-linear"
                  style={{
                    width: widthStr,
                    backgroundColor: 'var(--story-progress-active, #ffffff)',
                    transitionDuration: isPaused ? '0ms' : isVideo ? '100ms' : '50ms'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Author Header */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-full border-2 border-[var(--accent)] p-0.5">
              <img
                className="h-full w-full rounded-full object-cover"
                src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${currentStory.seed}`}
                alt={currentStory.name}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="m-0 font-bold text-base leading-tight text-white drop-shadow-md">{currentStory.name}</p>
                {isPaused && (
                  <span className="rounded-full bg-black/40 dark:bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    PAUSED
                  </span>
                )}
              </div>
              <p className="m-0 text-xs text-white/80 drop-shadow-xs">
                {currentStory.statusText || 'Story'} · {currentStory.timeAgo}
              </p>
              {currentStory?.music && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-md w-fit max-w-[200px]">
                  <Music className="h-3 w-3 text-orange-400 animate-pulse flex-shrink-0" />
                  <span className="truncate text-[10px] font-bold text-white/95">
                    {currentStory.music.title} • {currentStory.music.artist}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            {/* 3-Dot Options Menu */}
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white transition hover:bg-black/60 border border-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreMenu(!showMoreMenu);
              }}
              title="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white transition hover:bg-black/60 border border-white/20"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close story viewer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* More Menu (⋮) Dropdown */}
            {showMoreMenu && (
              <div
                className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--text-primary)] shadow-2xl backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                {(currentStory.memoryId || currentStory.highlightId) && (
                  <>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-[var(--surface-secondary)] cursor-pointer"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setIsRenaming(true);
                        setRenameText(currentStory.name);
                      }}
                    >
                      <Edit3 className="h-4 w-4 text-[var(--accent)]" /> Edit memory
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-[var(--surface-secondary)] cursor-pointer"
                      onClick={handleRemoveStoryFromMemory}
                    >
                      <MinusCircle className="h-4 w-4 text-amber-500" /> Remove story from memory
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-semibold text-rose-500 hover:bg-[var(--surface-secondary)] cursor-pointer"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleDeleteMemory();
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Delete memory
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-[var(--surface-secondary)] cursor-pointer"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowMemoryPicker(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4 text-[#56c4e8]" /> Add story to memory
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-[var(--surface-secondary)]"
                  onClick={(e) => {
                    setShowMoreMenu(false);
                    handleShare(e);
                  }}
                >
                  <Share2 className="h-4 w-4" /> Share story
                </button>
                <div className="my-1 border-t border-[var(--border)]" />
                <button
                  type="button"
                  className="flex w-full items-center justify-center rounded-xl px-3 py-1.5 text-center font-bold text-[var(--text-muted)] hover:bg-[var(--surface-secondary)]"
                  onClick={() => setShowMoreMenu(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rename Memory Form Overlay */}
      {isRenaming && (
        <form
          onSubmit={handleSaveRename}
          className="relative z-20 max-w-md mx-auto w-full bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border-color)] mt-4 space-y-3 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="m-0 text-xs font-bold text-[var(--text-primary)]">Edit Memory Name</p>
          <input
            className="field text-xs text-[var(--text-primary)]"
            value={renameText}
            onChange={(e) => setRenameText(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-xs text-[var(--text-secondary)] cursor-pointer"
              onClick={() => setIsRenaming(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent)] px-4 py-1.5 text-xs font-bold text-white shadow-sm cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Story Main Body Content */}
      <div className="relative z-10 my-auto flex flex-1 flex-col items-center justify-center p-4 text-center max-w-xl mx-auto w-full pointer-events-none">
        {currentStory.mediaUrl && (
          isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              muted={false}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              onLoadedMetadata={handleVideoLoadedMetadata}
              className="mb-6 max-h-[350px] w-auto max-w-full rounded-3xl object-contain shadow-2xl pointer-events-auto border border-white/20"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story Media"
              className="mb-6 max-h-[300px] rounded-3xl object-cover shadow-2xl pointer-events-auto border border-white/20"
            />
          )
        )}
        <div className="rounded-2xl bg-black/40 p-5 backdrop-blur-md border border-white/20 text-white max-w-md w-full">
          <p className="display-face text-xl sm:text-2xl font-bold leading-relaxed tracking-wide m-0">
            "{currentStory.content}"
          </p>
        </div>

        {addedMsg && (
          <div className="mt-4 rounded-full bg-[var(--surface)] px-5 py-2 text-xs font-bold text-[var(--text-primary)] border border-[var(--border-color)] shadow-xl animate-bounce">
            {addedMsg}
          </div>
        )}
      </div>

      {/* Memory Picker Overlay */}
      {showMemoryPicker && (
        <div
          className="absolute inset-x-4 top-24 z-40 max-w-md mx-auto rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-5 text-[var(--text-primary)] shadow-2xl backdrop-blur-lg"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-3">
            <p className="m-0 text-xs font-bold">Add to Memory</p>
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] cursor-pointer"
              onClick={() => setShowMemoryPicker(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {userMemories.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {userMemories.map((mem) => (
                <button
                  key={mem.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl bg-[var(--surface-secondary)] px-4 py-2.5 text-left text-xs font-bold transition hover:bg-[var(--border-color)] cursor-pointer"
                  onClick={() => handleAddToMemory(mem.id, mem.name)}
                >
                  <span>○ {mem.name}</span>
                  <PlusCircle className="h-4 w-4 text-[var(--accent)]" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-[var(--text-secondary)]">
              No memories created yet. Create a memory on your profile first!
            </div>
          )}
        </div>
      )}

      {/* Single-Row Action Bar: [ Reply Input... ] | ♡ React | ↗ Share */}
      <div
        className="relative z-20 max-w-xl mx-auto w-full pb-3 px-2"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 rounded-full bg-[var(--surface)] p-2 backdrop-blur-xl border border-[var(--border)] shadow-2xl">
          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="flex flex-1 items-center gap-1.5 min-w-0">
            <input
              type="text"
              placeholder={`Reply to ${currentStory.name || 'user'}...`}
              className="w-full rounded-full border border-[var(--border)] bg-[var(--input-background)] px-4 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
            />
          </form>

          {/* React Heart Icon Button */}
          <button
            type="button"
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
              liked
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-rose-500'
            }`}
            onClick={handleToggleLike}
            title={liked ? 'Reacted!' : 'React'}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          </button>

          {/* Share Button */}
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            onClick={handleShare}
            title="Share story"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
