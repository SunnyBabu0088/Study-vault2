import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  Play,
  Pause,
  Heart,
  Music,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  Sliders,
  Globe,
  Loader2,
  Clock,
  Radio
} from 'lucide-react';
import { apiRequest } from '../api/client';

const WORLDWIDE_CATEGORIES = [
  'TRENDING',
  'POPULAR',
  'NEW RELEASES',
  'STUDY',
  'FOCUS',
  'MOTIVATION',
  'CALM',
  'INSTRUMENTAL',
  'WORKOUT',
  'CHILL',
  'LOFI',
  'CHRISTIAN',
  'GOSPEL',
  'WORSHIP',
  'DEVOTIONAL',
  'ROMANTIC',
  'PARTY',
  'CLASSICAL',
  'ORIGINALS',
  'FAVORITES',
  'RECENT'
];

const LANGUAGES = [
  'All Languages',
  'English',
  'Telugu',
  'Hindi',
  'Tamil',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Punjabi',
  'Urdu',
  'Korean',
  'Japanese',
  'Spanish',
  'French',
  'German',
  'Arabic'
];

export default function StoryMusicSelector({
  isOpen,
  onClose,
  initialSelectedMusic = null,
  onAttachMusic,
}) {
  const [activeCategory, setActiveCategory] = useState('TRENDING');
  const [activeLanguage, setActiveLanguage] = useState('All Languages');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Audio Preview state
  const [previewingTrackId, setPreviewingTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0); // 0 to 1
  const audioRef = useRef(null);

  // Favorites cache
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // Selected Music & Trimmer editor state
  const [editingMusic, setEditingMusic] = useState(initialSelectedMusic);
  const [clipStartTime, setClipStartTime] = useState(initialSelectedMusic?.startTime || 0);
  const [clipDuration, setClipDuration] = useState(15); // Default 15s snippet for stories
  const [musicVolume, setMusicVolume] = useState(1);
  const [isTrimming, setIsTrimming] = useState(Boolean(initialSelectedMusic));

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setPreviewingTrackId(null);
    }
    return () => {
      document.body.style.overflow = '';
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isOpen]);

  // Sync initial music
  useEffect(() => {
    if (initialSelectedMusic) {
      setEditingMusic(initialSelectedMusic);
      setClipStartTime(initialSelectedMusic.startTime || 0);
      setIsTrimming(true);
    }
  }, [initialSelectedMusic]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load favorites set
  useEffect(() => {
    if (!isOpen) return;
    apiRequest('/api/music/favorites')
      .then((res) => {
        const favs = res?.data?.favorites || res?.favorites || [];
        setFavoriteIds(new Set(favs.map((f) => f.trackId)));
      })
      .catch(() => {});
  }, [isOpen]);

  // Fetch Tracks based on category, language, search
  const fetchTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeCategory === 'FAVORITES') {
        const res = await apiRequest('/api/music/favorites');
        const favs = res?.data?.favorites || res?.favorites || [];
        setTracks(favs);
        setLoading(false);
        return;
      }

      if (activeCategory === 'RECENT') {
        const res = await apiRequest('/api/music/recent');
        const rec = res?.data?.recent || res?.recent || [];
        setTracks(rec);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (debouncedQuery) {
        params.append('q', debouncedQuery);
      }
      if (activeCategory && activeCategory !== 'ALL') {
        params.append('category', activeCategory);
      }
      if (activeLanguage && activeLanguage !== 'All Languages') {
        params.append('language', activeLanguage);
      }
      params.append('limit', '30');

      const res = await apiRequest(`/api/music/search?${params.toString()}`);
      const list = res?.data?.tracks || res?.tracks || [];
      setTracks(list);
    } catch (err) {
      console.error('[StoryMusicSelector] Fetch tracks error:', err);
      setError('Unable to load music catalog. Please check your connection.');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, activeCategory, activeLanguage]);

  useEffect(() => {
    if (isOpen && !isTrimming) {
      fetchTracks();
    }
  }, [isOpen, isTrimming, fetchTracks]);

  // Clean Audio Cleanup
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPreviewingTrackId(null);
    setPreviewProgress(0);
  }, []);

  // Play / Pause Track Preview
  const togglePlayTrack = (track) => {
    if (!track.previewUrl) {
      alert("This track's preview is temporarily unavailable in your region.");
      return;
    }

    if (previewingTrackId === track.trackId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    stopAudio();

    const audio = new Audio(track.previewUrl);
    audioRef.current = audio;
    audio.volume = musicVolume;

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setPreviewProgress(audio.currentTime / audio.duration);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setPreviewingTrackId(null);
      setPreviewProgress(0);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setPreviewingTrackId(null);
      alert('Playback preview failed. Please check network connection.');
    };

    audio.play().then(() => {
      setPreviewingTrackId(track.trackId);
      setIsPlaying(true);
    }).catch((e) => {
      console.error('Audio play error:', e);
      setIsPlaying(false);
    });
  };

  // Toggle Favorite
  const toggleFavorite = async (track, e) => {
    e.stopPropagation();
    try {
      const res = await apiRequest('/api/music/favorites', {
        method: 'POST',
        body: {
          provider: track.provider || 'itunes',
          trackId: track.trackId,
          title: track.title,
          artist: track.artist,
          artworkUrl: track.artworkUrl,
          previewUrl: track.previewUrl,
        },
      });
      const isFav = res?.data?.isFavorite ?? res?.isFavorite;
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(track.trackId);
        else next.delete(track.trackId);
        return next;
      });
    } catch (err) {
      console.error('Toggle favorite failed:', err);
    }
  };

  // Add Track -> opens Trimmer
  const handleAddTrack = (track) => {
    stopAudio();
    setEditingMusic({
      provider: track.provider || 'itunes',
      trackId: track.trackId,
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      artworkUrl: track.artworkUrl,
      previewUrl: track.previewUrl,
      duration: track.duration || 30,
      startTime: 0,
      endTime: 15,
    });
    setClipStartTime(0);
    setIsTrimming(true);
  };

  // Preview trimmed snippet
  const playTrimmedSnippet = () => {
    if (!editingMusic?.previewUrl) return;

    if (isPlaying) {
      stopAudio();
      return;
    }

    const audio = new Audio(editingMusic.previewUrl);
    audioRef.current = audio;
    audio.currentTime = clipStartTime;
    audio.volume = musicVolume;

    const stopTime = Math.min(clipStartTime + clipDuration, 30);

    audio.ontimeupdate = () => {
      if (audio.currentTime >= stopTime) {
        audio.pause();
        audio.currentTime = clipStartTime;
        setIsPlaying(false);
      }
    };

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => setIsPlaying(false));
  };

  // Confirm Attachment
  const handleConfirmMusic = () => {
    stopAudio();
    const finalMusic = {
      ...editingMusic,
      startTime: clipStartTime,
      endTime: Math.min(clipStartTime + clipDuration, 30),
      duration: clipDuration,
      volume: musicVolume,
    };
    onAttachMusic(finalMusic);
    onClose();
  };

  // Remove Music entirely
  const handleRemoveMusic = () => {
    stopAudio();
    onAttachMusic(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-[#080A0D] text-white flex flex-col select-none overflow-hidden"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      {/* TOP HEADER */}
      <header className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#0E1218]/90 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => {
            stopAudio();
            onClose();
          }}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white/80 hover:text-white cursor-pointer"
          aria-label="Back to Story"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div
            className="grid h-6 w-6 place-items-center rounded-lg shadow-sm"
            style={{ background: 'var(--brand-gradient)' }}
          >
            <Music className="h-3.5 w-3.5 text-white" />
          </div>
          <h1 className="text-sm font-bold tracking-wide text-white m-0">
            {isTrimming ? 'Story Music Editor' : 'Worldwide Music'}
          </h1>
        </div>

        {isTrimming ? (
          <button
            type="button"
            onClick={handleConfirmMusic}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer"
            style={{ background: 'var(--brand-gradient)' }}
          >
            Done
          </button>
        ) : (
          <div className="w-8" />
        )}
      </header>

      {/* VIEW A: STORY MUSIC TIMELINE TRIMMER / EDITOR */}
      {isTrimming && editingMusic ? (
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center justify-between max-w-md mx-auto w-full">
          {/* TRACK ARTWORK & INFO */}
          <div className="flex flex-col items-center text-center space-y-4 w-full pt-4">
            <div className="relative group">
              <img
                src={editingMusic.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop'}
                alt={editingMusic.title}
                className="w-48 h-48 rounded-3xl object-cover shadow-2xl border border-white/15 shadow-black/60"
              />
              <button
                type="button"
                onClick={playTrimmedSnippet}
                className="absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="h-7 w-7 fill-white" /> : <Play className="h-7 w-7 fill-white ml-1" />}
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{editingMusic.title}</h2>
              <p className="text-xs text-white/60 font-medium mt-1">{editingMusic.artist}</p>
            </div>
          </div>

          {/* TIMELINE / SECTION SCRUBBER (00:00 - 00:30) */}
          <div className="w-full space-y-3 my-8 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-bold text-white/80">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-orange-400" /> Story Clip Window
              </span>
              <span className="font-mono text-orange-400">
                00:{String(Math.floor(clipStartTime)).padStart(2, '0')} — 00:{String(Math.floor(Math.min(clipStartTime + clipDuration, 30))).padStart(2, '0')} (15s)
              </span>
            </div>

            {/* Simulated Audio Waveform Bar */}
            <div className="relative h-12 w-full bg-black/40 rounded-xl overflow-hidden flex items-center justify-between px-1.5">
              {Array.from({ length: 36 }).map((_, idx) => {
                const height = Math.max(16, (Math.sin(idx * 0.45) * 22 + 24) % 36);
                const barTime = (idx / 36) * 30;
                const isSelectedWindow = barTime >= clipStartTime && barTime <= (clipStartTime + clipDuration);

                return (
                  <div
                    key={idx}
                    className={`w-1 rounded-full transition-colors ${
                      isSelectedWindow ? 'bg-gradient-to-t from-[#FF3218] to-[#FFD04A]' : 'bg-white/20'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={clipStartTime}
              onChange={(e) => {
                stopAudio();
                setClipStartTime(Number(e.target.value));
              }}
              className="w-full accent-[#FF641F] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-white/40">
              <span>00:00</span>
              <span>00:15</span>
              <span>00:30 (Max Preview)</span>
            </div>
          </div>

          {/* ACTION BUTTONS: CHANGE SONG / REMOVE */}
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={() => {
                stopAudio();
                setIsTrimming(false);
              }}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-98 transition-all text-xs font-bold text-white border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Change Music Track
            </button>

            <button
              type="button"
              onClick={handleRemoveMusic}
              className="w-full py-2.5 text-center text-xs font-semibold text-rose-400/90 hover:text-rose-400 cursor-pointer"
            >
              Remove Music From Story
            </button>
          </div>
        </div>
      ) : (
        /* VIEW B: FULL-SCREEN MUSIC DISCOVERY & SEARCH */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* SEARCH BAR */}
          <div className="p-3 border-b border-white/10 bg-[#0E1218]">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs, artists, albums (e.g. Taylor Swift, Anirudh)..."
                className="w-full bg-white/5 text-white placeholder:text-white/40 text-xs font-medium rounded-2xl pl-10 pr-9 py-2.5 outline-none border border-white/10 focus:border-orange-500/60 transition-colors"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* CATEGORIES HORIZONTAL SCROLL STRIP */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto scrollbar-none bg-[#0A0D12] border-b border-white/5">
            {WORLDWIDE_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    stopAudio();
                    setActiveCategory(cat);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'text-white shadow-md'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  style={isActive ? { background: 'var(--brand-gradient)', boxShadow: '0 2px 10px var(--brand-glow)' } : {}}
                >
                  {cat === 'FAVORITES' ? '❤️ Favorites' : cat === 'RECENT' ? '⏱️ Recent' : cat}
                </button>
              );
            })}
          </div>

          {/* LANGUAGE FILTER STRIP */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto scrollbar-none bg-black/30 border-b border-white/5">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1 pl-1 pr-1">
              <Globe className="h-3 w-3" /> Lang:
            </span>
            {LANGUAGES.map((lang) => {
              const isSelected = activeLanguage === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    stopAudio();
                    setActiveLanguage(lang);
                  }}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected ? 'bg-white/20 text-white font-bold' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>

          {/* TRACK LISTING CONTAINER */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-none">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/50 space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                <p className="text-xs font-medium">Searching worldwide music catalog...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 px-4">
                <p className="text-xs text-rose-400 font-medium">{error}</p>
                <button
                  type="button"
                  onClick={fetchTracks}
                  className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  Retry Search
                </button>
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-20 px-4 text-white/40 space-y-2">
                <Music className="h-10 w-10 mx-auto text-white/20" />
                <p className="text-sm font-bold text-white/80">No tracks found</p>
                <p className="text-xs">Try searching for an artist, song title, or change the language filter.</p>
              </div>
            ) : (
              tracks.map((track) => {
                const isCurrentPlaying = previewingTrackId === track.trackId && isPlaying;
                const isFav = favoriteIds.has(track.trackId);

                return (
                  <div
                    key={track.trackId}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all group"
                  >
                    {/* LEFT: PLAY BUTTON + ARTWORK + METADATA */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      {/* Artwork with overlay play button */}
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/10">
                        <img
                          src={track.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop'}
                          alt={track.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={() => togglePlayTrack(track)}
                          className="absolute inset-0 m-auto grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur-xs text-white border border-white/20 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          aria-label={isCurrentPlaying ? 'Pause Preview' : 'Play Preview'}
                        >
                          {isCurrentPlaying ? (
                            <Pause className="h-4 w-4 fill-white" />
                          ) : (
                            <Play className="h-4 w-4 fill-white ml-0.5" />
                          )}
                        </button>
                      </div>

                      {/* Song & Artist Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{track.title}</p>
                          {isCurrentPlaying && (
                            <span className="flex items-center gap-0.5 h-3">
                              <span className="w-0.5 h-full bg-orange-400 animate-pulse" />
                              <span className="w-0.5 h-2/3 bg-orange-400 animate-pulse delay-75" />
                              <span className="w-0.5 h-full bg-orange-400 animate-pulse delay-150" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 truncate mt-0.5">
                          {track.artist} {track.genre ? `• ${track.genre}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT: FAVORITE & ADD BUTTONS */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(track, e)}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          isFav ? 'text-rose-500' : 'text-white/30 hover:text-white/70'
                        }`}
                        aria-label="Favorite Track"
                      >
                        <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddTrack(track)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                        style={{ background: 'var(--brand-gradient)' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
