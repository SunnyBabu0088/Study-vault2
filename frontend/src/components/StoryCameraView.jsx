import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Zap,
  ZapOff,
  RefreshCw,
  Sparkles,
  Type,
  Repeat,
  Grid,
  Timer,
  Image as ImageIcon,
  Palette,
  Trash2,
  Share2,
  Globe,
  Lock,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Music,
  Play,
  Pause,
  Search,
  Volume2,
  VolumeX,
  Sliders,
  Check
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { apiRequest } from '../api/client';
import ModeSelectorCarousel from './ModeSelectorCarousel';
import StoryMusicSelector from './StoryMusicSelector';

// EXACTLY 5 UNIQUE PHOTO/VIDEO FILTERS
const FIVE_FILTERS = [
  { id: 'original', name: 'Original', css: 'none' },
  { id: 'glow', name: 'Glow', css: 'brightness(1.08) contrast(1.05) saturate(1.25) sepia(0.08)' },
  { id: 'dream', name: 'Dream', css: 'brightness(1.12) contrast(0.92) saturate(1.2) sepia(0.12)' },
  { id: 'vivid', name: 'Vivid', css: 'saturate(1.75) contrast(1.15) brightness(1.02)' },
  { id: 'cinema', name: 'Cinema', css: 'contrast(1.22) saturate(0.85) sepia(0.15) brightness(0.98)' },
];

const CONTENT_TYPES = ['POST', 'STORY', 'REEL', 'IDEA', 'LIVE'];

const COLOR_PALETTE = ['#FFFFFF', '#3B52CF', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6', '#000000'];

export default function StoryCameraView({ onClose, onModeSelect }) {
  const { refreshStories } = useStudy();

  // Camera & Stream State
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [cameraAllowed, setCameraAllowed] = useState(null);
  const [flashOn, setFlashOn] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Story Capture / Media State
  const [capturedMedia, setCapturedMedia] = useState(null); // { type: 'image'|'video', url, file }
  const [activeFilter, setActiveFilter] = useState(FIVE_FILTERS[0]);
  const [showFilterTray, setShowFilterTray] = useState(false);
  const [timerMode, setTimerMode] = useState(0); // 0 | 3 | 10
  const [countdown, setCountdown] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [isLoopMode, setIsLoopMode] = useState(false);

  // EXPANDABLE STORY TOOLS MENU STATE
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

  // Story Tools & Overlays
  const [showEffectsSheet, setShowEffectsSheet] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBg, setTextBg] = useState(true);

  // REAL DRAGGABLE STORY TEXT POSITION & GESTURES
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const [textScaleVal, setTextScaleVal] = useState(1.0);
  const [textRotation, setTextRotation] = useState(0);
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isNearDelete, setIsNearDelete] = useState(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, initialX: 0, initialY: 0 });

  // MUSIC & AUDIO ENGINE STATE
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [activeMusicCategory, setActiveMusicCategory] = useState('All');
  const [previewingSongId, setPreviewingSongId] = useState(null);
  const previewAudioRef = useRef(null);
  const storyAudioRef = useRef(null);

  // Music Audio Mixing Controls
  const [musicVolume, setMusicVolume] = useState(0.8);
  const [originalVideoVolume, setOriginalVideoVolume] = useState(1.0);
  const [musicTrimStart, setMusicTrimStart] = useState(0);
  const [musicPos, setMusicPos] = useState({ x: 0, y: -120 });
  const [isDraggingMusic, setIsDraggingMusic] = useState(false);
  const musicDragStartRef = useRef({ pointerX: 0, pointerY: 0, initialX: 0, initialY: 0 });

  // Drawing Canvas State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#F43F5E');
  const [isDrawMode, setIsDrawMode] = useState(false);

  // Publish / Metadata State
  const [visibility, setVisibility] = useState('public');
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const galleryInputRef = useRef(null);

  // Start Live WebRTC Camera
  useEffect(() => {
    let currentStream = null;

    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
            audio: false,
          });
          currentStream = mediaStream;
          setStream(mediaStream);
          setCameraAllowed(true);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } else {
          setCameraAllowed(false);
        }
      } catch (err) {
        console.warn('Camera access error:', err);
        setCameraAllowed(false);
      }
    }

    if (!capturedMedia) {
      initCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, capturedMedia]);

  // Handle Story Background Audio Sync
  useEffect(() => {
    if (selectedSong && selectedSong.url) {
      if (!storyAudioRef.current) {
        storyAudioRef.current = new Audio(selectedSong.url);
        storyAudioRef.current.loop = true;
      } else {
        storyAudioRef.current.src = selectedSong.url;
      }
      storyAudioRef.current.volume = musicVolume;
      storyAudioRef.current.currentTime = musicTrimStart;
      storyAudioRef.current.play().catch(() => {});
    } else {
      if (storyAudioRef.current) {
        storyAudioRef.current.pause();
        storyAudioRef.current = null;
      }
    }

    return () => {
      if (storyAudioRef.current) {
        storyAudioRef.current.pause();
      }
    };
  }, [selectedSong]);

  // Handle Music Volume & Trim adjustment
  useEffect(() => {
    if (storyAudioRef.current) {
      storyAudioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  useEffect(() => {
    if (capturedMedia?.type === 'video' && videoRef.current) {
      videoRef.current.volume = originalVideoVolume;
    }
  }, [originalVideoVolume, capturedMedia]);

  // Flip Camera Front ↔ Back
  const handleFlipCamera = () => {
    setIsFlipping(true);
    setTimeout(() => setIsFlipping(false), 350);
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Trigger Shutter / Photo Capture
  const handleShutterClick = () => {
    if (timerMode > 0) {
      setCountdown(timerMode);
      let time = timerMode;
      const interval = setInterval(() => {
        time -= 1;
        if (time <= 0) {
          clearInterval(interval);
          setCountdown(null);
          captureFrame();
        } else {
          setCountdown(time);
        }
      }, 1000);
    } else {
      captureFrame();
    }
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (activeFilter.css !== 'none') {
          ctx.filter = activeFilter.css;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedMedia({
          type: 'image',
          url: dataUrl,
          file: null,
        });
      }
    }
  };

  // Gallery Picker Handler
  const handleGallerySelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      setCapturedMedia({
        type: isVideo ? 'video' : 'image',
        url,
        file,
      });
      setActiveFilter(FIVE_FILTERS[0]);
    }
  };

  // Song Preview Audio Handler
  const toggleSongPreview = (song) => {
    if (previewingSongId === song.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewingSongId(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      previewAudioRef.current = new Audio(song.url);
      previewAudioRef.current.play().catch(() => {});
      setPreviewingSongId(song.id);
    }
  };

  const handleSelectSong = (song) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewingSongId(null);
    }
    setSelectedSong(song);
    setShowMusicPanel(false);
  };

  const handleRemoveMusic = () => {
    if (storyAudioRef.current) {
      storyAudioRef.current.pause();
      storyAudioRef.current = null;
    }
    setSelectedSong(null);
  };

  // POINTER / TOUCH GESTURE HANDLERS FOR DRAGGABLE STORY TEXT
  const handleTextPointerDown = (e) => {
    e.stopPropagation();
    setIsTextSelected(true);
    setIsDraggingText(true);
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    dragStartRef.current = {
      pointerX: clientX,
      pointerY: clientY,
      initialX: textPos.x,
      initialY: textPos.y,
    };
  };

  const handleTextPointerMove = (e) => {
    if (!isDraggingText) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    const deltaX = clientX - dragStartRef.current.pointerX;
    const deltaY = clientY - dragStartRef.current.pointerY;

    const newX = Math.max(-170, Math.min(170, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(-280, Math.min(280, dragStartRef.current.initialY + deltaY));

    setTextPos({ x: newX, y: newY });

    if (newY > 200) {
      setIsNearDelete(true);
    } else {
      setIsNearDelete(false);
    }
  };

  const handleTextPointerUp = () => {
    if (isDraggingText) {
      setIsDraggingText(false);
      if (isNearDelete) {
        setStoryText('');
        setTextPos({ x: 0, y: 0 });
        setIsNearDelete(false);
        setIsTextSelected(false);
      }
    }
  };

  // DRAGGABLE MUSIC STICKER LABEL HANDLERS
  const handleMusicPointerDown = (e) => {
    e.stopPropagation();
    setIsDraggingMusic(true);
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    musicDragStartRef.current = {
      pointerX: clientX,
      pointerY: clientY,
      initialX: musicPos.x,
      initialY: musicPos.y,
    };
  };

  const handleMusicPointerMove = (e) => {
    if (!isDraggingMusic) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    const deltaX = clientX - musicDragStartRef.current.pointerX;
    const deltaY = clientY - musicDragStartRef.current.pointerY;

    const newX = Math.max(-160, Math.min(160, musicDragStartRef.current.initialX + deltaX));
    const newY = Math.max(-260, Math.min(260, musicDragStartRef.current.initialY + deltaY));

    setMusicPos({ x: newX, y: newY });
  };

  const handleMusicPointerUp = () => {
    setIsDraggingMusic(false);
  };

  const handleCanvasBackgroundTap = () => {
    if (isTextSelected) {
      setIsTextSelected(false);
    }
  };

  // Drawing Canvas logic
  const startDrawing = (e) => {
    if (!isDrawMode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawMode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // File Upload Helper
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (err) => reject(err);
    });
  };

  // Share Story Handler
  const handleShareStory = async () => {
    if (!capturedMedia && !storyText.trim() && !selectedSong) return;
    setPublishing(true);
    setErrorMsg('');

    try {
      let mediaUrl = null;
      let mediaType = 'image';

      if (capturedMedia) {
        mediaType = capturedMedia.type;
        if (capturedMedia.file) {
          const base64Content = await fileToBase64(capturedMedia.file);
          const uploadRes = await apiRequest('/api/uploads', {
            method: 'POST',
            body: {
              filename: capturedMedia.file.name || 'story.png',
              mimeType: capturedMedia.file.type || 'image/png',
              content: base64Content,
            },
          });
          const storedName = uploadRes.upload?.stored_name || uploadRes.stored_name;
          mediaUrl = `/uploads/public/${storedName}`;
        } else {
          mediaUrl = capturedMedia.url;
        }
      }

      await apiRequest('/api/stories', {
        method: 'POST',
        body: {
          content: storyText.trim() || (selectedSong ? `♪ ${selectedSong.title}` : 'My Story'),
          mediaUrl: mediaUrl || '',
          mediaType: mediaType || 'image',
          background: selectedSong ? `audio:${selectedSong.title}` : activeFilter.name,
          visibility,
          music: selectedSong
            ? {
                provider: selectedSong.provider || 'itunes',
                trackId: selectedSong.trackId || selectedSong.id,
                title: selectedSong.title,
                artist: selectedSong.artist,
                album: selectedSong.album || '',
                artworkUrl: selectedSong.artworkUrl || '',
                previewUrl: selectedSong.previewUrl || '',
                startTime: selectedSong.startTime || 0,
                endTime: selectedSong.endTime || 15,
                duration: selectedSong.duration || 30,
              }
            : null,
        },
      });

      if (refreshStories) await refreshStories();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to share story');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div
      onPointerMove={(e) => {
        handleTextPointerMove(e);
        handleMusicPointerMove(e);
      }}
      onPointerUp={() => {
        handleTextPointerUp();
        handleMusicPointerUp();
      }}
      className="fixed inset-0 z-[9999999] h-[100dvh] w-[100vw] bg-black text-white flex flex-col overflow-hidden select-none animate-in fade-in duration-300"
      style={{
        paddingTop: 'env(safe-area-inset-top, 12px)',
        paddingBottom: 'env(safe-area-inset-bottom, 12px)',
      }}
    >
      {/* HIDDEN GALLERY INPUT */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleGallerySelect}
      />

      {/* TOP GLASS CONTROLS BAR */}
      <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-md active:scale-90 transition-transform cursor-pointer"
          aria-label="Close Story Camera"
        >
          <X className="h-5 w-5" />
        </button>

        {/* TOP CENTER FLASH & CAMERA FLIP TOGGLES */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFlashOn((prev) => !prev)}
            className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur-md border border-white/20 shadow-md active:scale-90 transition-all cursor-pointer ${
              flashOn ? 'bg-amber-400 text-black border-amber-300' : 'bg-black/40 text-white'
            }`}
            title="Toggle Flash"
          >
            {flashOn ? <Zap className="h-5 w-5 fill-current" /> : <ZapOff className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={handleFlipCamera}
            className={`grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-md active:scale-90 transition-transform cursor-pointer ${
              isFlipping ? 'rotate-180' : ''
            }`}
            title="Flip Camera"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* TOP RIGHT SHARE / ACTION BUTTON */}
        {capturedMedia || selectedSong || storyText ? (
          <button
            type="button"
            disabled={publishing}
            onClick={handleShareStory}
            className="flex items-center gap-2 rounded-full text-white px-5 py-2 text-xs font-bold active:scale-95 disabled:opacity-50 transition-all cursor-pointer hover:opacity-95"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
          >
            {publishing ? (
              <span>Sharing...</span>
            ) : (
              <>
                <span>Share Story</span>
                <Share2 className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* EXPANDABLE LEFT-SIDE STORY TOOLS MENU */}
      <div className="absolute top-20 left-4 z-40 flex flex-col items-center gap-3 pointer-events-auto">
        {/* EXPANDABLE PROMINENT PLUS (+) / CLOSE (×) BUTTON */}
        <button
          type="button"
          onClick={() => setIsToolsExpanded((prev) => !prev)}
          className={`grid h-11 w-11 place-items-center rounded-full border border-white/30 shadow-xl active:scale-95 transition-all cursor-pointer ${
            isToolsExpanded ? 'ring-2 ring-white/60' : ''
          }`}
          style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
          title={isToolsExpanded ? 'Close Tools' : 'Open Tools'}
          aria-expanded={isToolsExpanded}
        >
          <Plus
            className={`h-6 w-6 text-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isToolsExpanded ? 'rotate-45' : 'rotate-0'
            }`}
          />
        </button>

        {/* STAGGERED UNFOLDING STORY TOOLS LIST */}
        {isToolsExpanded && (
          <div className="flex flex-col gap-3 transition-all duration-300">
            {/* 1. FILTERS TOOL (DIRECTLY UNDERNEATH PLUS BUTTON) */}
            <button
              type="button"
              onClick={() => setShowFilterTray((prev) => !prev)}
              className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur-md border border-white/20 shadow-md active:scale-90 transition-all duration-250 animate-in fade-in slide-in-from-top-2 cursor-pointer ${
                showFilterTray || activeFilter.id !== 'original' ? 'bg-[var(--accent)] text-white' : 'bg-black/50 text-white'
              }`}
              style={{ animationDelay: '50ms' }}
              title="Five Filters"
            >
              <Sliders className="h-5 w-5 text-indigo-300" />
            </button>

            {/* 2. TEXT TOOL */}
            <button
              type="button"
              onClick={() => setShowTextEditor((prev) => !prev)}
              className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur-md border border-white/20 shadow-md active:scale-90 transition-all duration-250 animate-in fade-in slide-in-from-top-2 cursor-pointer ${
                showTextEditor || storyText ? 'bg-[var(--accent)] text-white' : 'bg-black/50 text-white'
              }`}
              style={{ animationDelay: '100ms' }}
              title="Add Text"
            >
              <Type className="h-5 w-5" />
            </button>

            {/* 3. MUSIC TOOL */}
            <button
              type="button"
              onClick={() => setShowMusicPanel(true)}
              className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur-md border border-white/20 shadow-md active:scale-90 transition-all duration-250 animate-in fade-in slide-in-from-top-2 cursor-pointer ${
                selectedSong ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-black/50 text-white'
              }`}
              style={{ animationDelay: '150ms' }}
              title="Add Music"
            >
              <Music className="h-5 w-5" />
            </button>

            {/* 4. EFFECTS TOOL */}
            <button
              type="button"
              onClick={() => setShowEffectsSheet((prev) => !prev)}
              className="grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-md active:scale-90 transition-all duration-250 animate-in fade-in slide-in-from-top-2 cursor-pointer"
              style={{ animationDelay: '200ms' }}
              title="Story Effects"
            >
              <Sparkles className="h-5 w-5 text-amber-300" />
            </button>

            {/* 5. LAYOUT GRID TOOL */}
            <button
              type="button"
              onClick={() => setShowGrid((prev) => !prev)}
              className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur-md border border-white/20 shadow-md active:scale-90 transition-all duration-250 animate-in fade-in slide-in-from-top-2 cursor-pointer ${
                showGrid ? 'bg-emerald-500 text-white' : 'bg-black/50 text-white'
              }`}
              style={{ animationDelay: '250ms' }}
              title="Layout Grid"
            >
              <Grid className="h-5 w-5" />
            </button>

            {/* 6. TIMER TOOL */}
            <button
              type="button"
              onClick={() => setTimerMode((prev) => (prev === 0 ? 3 : prev === 3 ? 10 : 0))}
              className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur-md border border-white/20 shadow-md active:scale-90 transition-all duration-250 animate-in fade-in slide-in-from-top-2 cursor-pointer ${
                timerMode > 0 ? 'bg-amber-500 text-white' : 'bg-black/50 text-white'
              }`}
              style={{ animationDelay: '300ms' }}
              title="Capture Timer"
            >
              <div className="flex flex-col items-center">
                <Timer className="h-4 w-4" />
                {timerMode > 0 && <span className="text-[9px] font-bold leading-none">{timerMode}s</span>}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* FLOATING 5-FILTER TRAY PANEL (WHEN FILTERS TOOL IS TOGGLED) */}
      {showFilterTray && (
        <div className="absolute top-20 left-18 z-40 flex flex-col gap-2 p-2 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/20 shadow-2xl animate-in fade-in slide-in-from-left-3 duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-auto">
          {FIVE_FILTERS.map((filter) => {
            const isSelected = activeFilter.id === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--accent)] text-white shadow-md scale-105 ring-1 ring-white/40'
                    : 'bg-black/40 text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <div
                  className="h-4 w-4 rounded-full border border-white/30 shrink-0"
                  style={{ filter: filter.css, backgroundColor: '#4f46e5' }}
                />
                <span>{filter.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* MAIN 9:16 CAMERA & MEDIA DISPLAY CANVAS AREA */}
      <div
        onClick={handleCanvasBackgroundTap}
        className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-black"
      >
        {/* Flash Highlight Layer */}
        {flashOn && <div className="absolute inset-0 z-15 bg-white/30 pointer-events-none" />}

        {/* Countdown Timer Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-35 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <span className="text-8xl font-black text-white animate-bounce">{countdown}</span>
          </div>
        )}

        {/* 9:16 Framing Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 z-15 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white/15" />
            ))}
          </div>
        )}

        {/* DRAWING CANVAS OVERLAY */}
        {isDrawMode && (
          <canvas
            ref={canvasRef}
            width={window.innerWidth || 360}
            height={window.innerHeight || 640}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="absolute inset-0 z-25 cursor-crosshair touch-none"
          />
        )}

        {/* CAPTURED MEDIA PREVIEW OR LIVE WEBRTC VIDEO */}
        {capturedMedia ? (
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
            {capturedMedia.type === 'video' ? (
              <video
                ref={videoRef}
                src={capturedMedia.url}
                controls
                autoPlay
                loop
                className="h-full w-full object-cover transition-all duration-200"
                style={{ filter: activeFilter.css }}
              />
            ) : (
              <img
                src={capturedMedia.url}
                alt="Captured Story"
                className="h-full w-full object-cover transition-all duration-200"
                style={{ filter: activeFilter.css }}
              />
            )}

            {/* Trash / Retake Reset Button */}
            <button
              type="button"
              onClick={() => {
                setCapturedMedia(null);
                setStoryText('');
                setTextPos({ x: 0, y: 0 });
              }}
              className="absolute top-20 right-4 z-30 grid h-10 w-10 place-items-center rounded-full bg-rose-600/90 text-white shadow-xl active:scale-95 transition-transform cursor-pointer"
              title="Retake Story"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ) : cameraAllowed ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover transition-all duration-200"
            style={{ filter: activeFilter.css }}
          />
        ) : (
          /* CAMERA PERMISSION FALLBACK STATE */
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-sm">
            <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20">
              <ImageIcon className="h-10 w-10 text-white/80" />
            </div>
            <p className="font-bold text-base m-0">Live Story Camera</p>
            <p className="text-xs text-white/70 m-0">
              Enable camera permissions or select a photo/video from your device gallery to create a Story.
            </p>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="rounded-full text-white px-6 py-2.5 text-xs font-bold shadow-lg cursor-pointer transition hover:opacity-95 active:scale-95"
              style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
            >
              Choose from Gallery
            </button>
          </div>
        )}

        {/* REAL DRAGGABLE MUSIC STICKER LABEL OVERLAY */}
        {selectedSong && (
          <div
            onPointerDown={handleMusicPointerDown}
            className="absolute z-35 flex items-center gap-2 rounded-full bg-black/75 backdrop-blur-md border border-white/25 px-4 py-2 shadow-2xl cursor-grab active:cursor-grabbing touch-none select-none"
            style={{
              transform: `translate3d(${musicPos.x}px, ${musicPos.y}px, 0)`,
              willChange: 'transform',
            }}
          >
            <Music className="h-4 w-4 text-indigo-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-none">{selectedSong.title}</span>
              <span className="text-[9px] text-white/70 leading-none mt-0.5">{selectedSong.artist}</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveMusic}
              className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white cursor-pointer"
              title="Remove music"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* REAL DRAGGABLE, MOVABLE & RESIZABLE STORY TEXT OVERLAY */}
        {storyText && (
          <div
            onPointerDown={handleTextPointerDown}
            className={`absolute z-30 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none transition-shadow duration-150 ${
              isTextSelected ? 'ring-2 ring-white/70 ring-offset-2 ring-offset-black/50 rounded-2xl p-1' : ''
            }`}
            style={{
              transform: `translate3d(${textPos.x}px, ${textPos.y}px, 0) scale(${textScaleVal}) rotate(${textRotation}deg)`,
              willChange: 'transform',
            }}
          >
            <p
              className={`m-0 font-extrabold tracking-wide text-center max-w-xs break-words text-lg ${
                textBg ? 'px-4 py-2 rounded-2xl bg-black/65 backdrop-blur-md border border-white/25 shadow-xl' : ''
              }`}
              style={{ color: textColor }}
            >
              {storyText}
            </p>

            {/* Selection Resize & Rotate Controls */}
            {isTextSelected && (
              <div className="absolute -top-9 right-0 flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/20 rounded-full px-2 py-0.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTextScaleVal((s) => Math.max(0.6, s - 0.15));
                  }}
                  className="p-1 hover:text-blue-400 text-white"
                  title="Smaller"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTextScaleVal((s) => Math.min(2.2, s + 0.15));
                  }}
                  className="p-1 hover:text-blue-400 text-white"
                  title="Bigger"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTextRotation((r) => (r + 15) % 360);
                  }}
                  className="p-1 hover:text-blue-400 text-white"
                  title="Rotate"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TRASH / DELETE TARGET ZONE DURING TEXT DRAGGING */}
        {isDraggingText && (
          <div
            className={`absolute bottom-28 z-40 flex items-center justify-center p-3 rounded-full backdrop-blur-md border transition-all duration-200 ${
              isNearDelete
                ? 'bg-rose-600 text-white border-rose-400 scale-125 shadow-rose-600/50 shadow-xl'
                : 'bg-black/60 text-white/70 border-white/20 scale-100'
            }`}
          >
            <Trash2 className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* WORLDWIDE FULL-SCREEN MUSIC SELECTOR & STORY MUSIC EDITOR */}
      <StoryMusicSelector
        isOpen={showMusicPanel}
        onClose={() => setShowMusicPanel(false)}
        initialSelectedMusic={selectedSong}
        onAttachMusic={(music) => setSelectedSong(music)}
      />

      {/* TEXT EDITOR POPUP SHEET */}
      {showTextEditor && (
        <div className="absolute top-20 left-6 right-6 z-50 p-4 rounded-3xl bg-black/85 backdrop-blur-2xl border border-white/20 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Add Story Text</span>
            <button
              type="button"
              onClick={() => setShowTextEditor(false)}
              className="text-xs font-bold text-white/80 hover:text-white"
            >
              Done
            </button>
          </div>
          <input
            type="text"
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            placeholder="Type your story message..."
            className="w-full bg-white/10 text-white placeholder:text-white/50 text-sm font-semibold rounded-2xl px-4 py-3 outline-none border border-white/20"
            autoFocus
          />
          <div className="flex items-center justify-between pt-1">
            {/* Color Palette */}
            <div className="flex items-center gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTextColor(c)}
                  className={`h-6 w-6 rounded-full border border-white/40 cursor-pointer ${
                    textColor === c ? 'scale-115 ring-2 ring-white' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            {/* Toggle Background Box */}
            <button
              type="button"
              onClick={() => setTextBg((prev) => !prev)}
              className={`px-3 py-1 text-[11px] font-bold rounded-xl border border-white/20 ${
                textBg ? 'bg-white text-black' : 'bg-transparent text-white'
              }`}
            >
              Box
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM SHUTTER & GALLERY CONTROL ROW (SHOWN ONLY BEFORE MEDIA CAPTURE) */}
      {!capturedMedia && (
        <div className="absolute bottom-20 left-0 right-0 z-30 flex items-center justify-around px-8 pointer-events-auto">
          {/* Gallery Thumbnail Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="grid h-12 w-12 place-items-center rounded-2xl bg-black/40 backdrop-blur-md border border-white/25 text-white shadow-lg active:scale-90 transition-transform cursor-pointer"
            title="Open Gallery"
          >
            <ImageIcon className="h-6 w-6 text-white" />
          </button>

          {/* LARGE CIRCULAR CAPTURE SHUTTER BUTTON */}
          <button
            type="button"
            onClick={handleShutterClick}
            className="group grid h-20 w-20 place-items-center rounded-full border-4 border-white/90 bg-white/30 backdrop-blur-md shadow-2xl active:scale-95 transition-all cursor-pointer"
            aria-label="Take Photo"
          >
            <div className="h-14 w-14 rounded-full bg-white group-active:scale-90 transition-transform" />
          </button>

          {/* VISIBILITY SELECTOR DROPDOWN (Public / Private) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setVisibility((prev) => (prev === 'public' ? 'private' : 'public'))}
              className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/25 px-3 py-2 text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              {visibility === 'public' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              <span className="capitalize">{visibility}</span>
            </button>
          </div>
        </div>
      )}

      {/* FLOATING BOTTOM MODE CAROUSEL NAVIGATION (POST | STORY | REEL | IDEA | LIVE) */}
      <ModeSelectorCarousel activeMode="STORY" onModeSelect={onModeSelect} />
    </div>
  );
}
