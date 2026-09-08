import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Headphones, Pause, Play, RotateCcw, Video, FileText, Sparkles, Volume2 } from 'lucide-react';
import { apiRequest } from '../api/client';

export default function StudyRoomModal({ item, onClose, onSessionUpdate }) {
  const [activeTab, setActiveTab] = useState(item?.material_type === 'video' ? 'watch' : item?.material_type === 'audio' ? 'listen' : 'read');
  const [sessionId, setSessionId] = useState(null);
  
  // Timer state
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [completed, setCompleted] = useState(Boolean(item?.progress_percentage >= 100));

  // Video/Audio tracking
  const [videoPosition, setVideoPosition] = useState(item?.last_position_seconds || 0);
  const videoRef = useRef(null);

  // Start Study Session on mount
  useEffect(() => {
    let timerInterval;

    const startSession = async () => {
      try {
        const res = await apiRequest('/api/vault/study-sessions', {
          method: 'POST',
          body: {
            subject_id: item?.subject_id || null,
            material_id: item?.id || null,
            activity_type: activeTab,
          },
        });
        const id = res.data?.session?.id || res.session?.id;
        setSessionId(id);
      } catch (err) {
        console.error('Failed to start study session:', err);
      }
    };

    startSession();

    // Active timer loop (only increments when active and not paused)
    timerInterval = setInterval(() => {
      if (!isPaused && document.visibilityState === 'visible') {
        setActiveSeconds((prev) => prev + 1);
      }
    }, 1000);

    // Pause timer on window blur
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsPaused(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timerInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [item, activeTab, isPaused]);

  // Periodic Heartbeat every 15 seconds to sync session duration
  useEffect(() => {
    if (!sessionId || activeSeconds === 0) return;

    const sendHeartbeat = async () => {
      try {
        await apiRequest(`/api/vault/study-sessions/${sessionId}/heartbeat`, {
          method: 'PATCH',
          body: {
            duration_seconds: activeSeconds,
            status: isPaused ? 'paused' : completed ? 'completed' : 'active',
          },
        });
        if (onSessionUpdate) onSessionUpdate();
      } catch (err) {
        console.error('Heartbeat failed:', err);
      }
    };

    const heartbeatTimer = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(heartbeatTimer);
  }, [sessionId, activeSeconds, isPaused, completed, onSessionUpdate]);

  // Resume video position when video element loads
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current && item?.last_position_seconds) {
      videoRef.current.currentTime = item.last_position_seconds;
    }
  };

  // Video Time Update -> Track Position
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const currentPos = Math.floor(videoRef.current.currentTime);
      const totalDur = Math.floor(videoRef.current.duration) || item?.duration_seconds || 2700;
      setVideoPosition(currentPos);

      const percent = Math.min(100, Math.round((currentPos / totalDur) * 100));

      if (currentPos % 5 === 0) {
        apiRequest('/api/vault/material-progress', {
          method: 'POST',
          body: {
            material_id: item?.id,
            last_position_seconds: currentPos,
            watched_seconds: activeSeconds,
            progress_percentage: percent,
            completed: percent >= 95,
          },
        }).catch(() => {});
      }
    }
  };

  const handleFinish = async () => {
    setCompleted(true);
    setIsPaused(true);
    if (sessionId) {
      try {
        await apiRequest(`/api/vault/study-sessions/${sessionId}/heartbeat`, {
          method: 'PATCH',
          body: {
            duration_seconds: activeSeconds,
            status: 'completed',
          },
        });
        await apiRequest('/api/vault/material-progress', {
          method: 'POST',
          body: {
            material_id: item?.id,
            last_position_seconds: videoPosition,
            watched_seconds: activeSeconds,
            progress_percentage: 100,
            completed: true,
          },
        });
        if (onSessionUpdate) onSessionUpdate();
      } catch (err) {
        console.error('Failed to complete study session:', err);
      }
    }
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden animate-fadeIn">
      {/* TOP ROOM HEADER */}
      <header className="sticky top-0 z-30 w-full bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-[var(--button-background)] text-[var(--text-primary)] transition"
            onClick={onClose}
            aria-label="Exit Study Room"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand-orange)] border border-[var(--brand-soft-border)] text-[10px] font-bold uppercase tracking-wider">
              Study Room
            </span>
            <h2 className="m-0 text-base font-bold text-[var(--text-primary)] truncate max-w-xs sm:max-w-md">
              {item?.title || 'Machine Learning Fundamentals'}
            </h2>
          </div>
        </div>

        {/* ACTIVE TIMER DISPLAY */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--button-background)] border border-[var(--border-color)]">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{formatTimer(activeSeconds)}</span>
          </div>

          <button
            type="button"
            className="p-2 rounded-full bg-[var(--button-background)] hover:bg-[var(--border-color)] text-[var(--text-primary)] transition cursor-pointer"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume Timer' : 'Pause Timer'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-500 fill-emerald-500" /> : <Pause className="w-4 h-4 text-amber-500 fill-amber-500" />}
          </button>

          <button
            type="button"
            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            onClick={handleFinish}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Finish
          </button>
        </div>
      </header>

      {/* MODE TABS (Read, Watch, Listen, Practice) */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold">
        <button
          type="button"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'read' ? 'text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--button-background)]'
          }`}
          style={activeTab === 'read' ? { background: 'var(--brand-gradient)', boxShadow: '0 2px 8px var(--brand-glow)' } : {}}
          onClick={() => setActiveTab('read')}
        >
          <BookOpen className="w-4 h-4" /> 📖 Read
        </button>

        <button
          type="button"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'watch' ? 'text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--button-background)]'
          }`}
          style={activeTab === 'watch' ? { background: 'var(--brand-gradient)', boxShadow: '0 2px 8px var(--brand-glow)' } : {}}
          onClick={() => setActiveTab('watch')}
        >
          <Video className="w-4 h-4" /> 🎥 Watch
        </button>

        <button
          type="button"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'listen' ? 'text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--button-background)]'
          }`}
          style={activeTab === 'listen' ? { background: 'var(--brand-gradient)', boxShadow: '0 2px 8px var(--brand-glow)' } : {}}
          onClick={() => setActiveTab('listen')}
        >
          <Headphones className="w-4 h-4" /> 🎧 Listen
        </button>
      </div>

      {/* STUDY CONTENT WORKSPACE */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* READ MODE */}
        {activeTab === 'read' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="surface p-6 rounded-3xl border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--brand-orange)] uppercase tracking-wider">{item?.subject_name || 'Machine Learning'} • {item?.topic || 'Chapter Notes'}</span>
                <span className="text-xs text-[var(--text-muted)]">Active Reading Mode</span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] m-0">{item?.title}</h1>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item?.description}</p>
              
              <div className="border-t border-[var(--border-color)] pt-4 space-y-3 text-sm text-[var(--text-primary)] leading-relaxed">
                <p>
                  <strong>1. Introduction & Overview:</strong> Machine learning algorithms build a model based on sample data, known as training data, to make predictions or decisions without being explicitly programmed to do so.
                </p>
                <p>
                  <strong>2. Key Concepts:</strong> Supervised learning uses labeled training datasets, while unsupervised learning discovers hidden patterns or data groupings without human guidance.
                </p>
                <p>
                  <strong>3. Model Evaluation:</strong> Cross-validation techniques split the dataset into k folds to evaluate model generalization and prevent overfitting.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* WATCH MODE (VIDEO LESSON) */}
        {activeTab === 'watch' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="rounded-3xl overflow-hidden border border-[var(--border-color)] bg-black shadow-2xl relative">
              <video
                ref={videoRef}
                controls
                className="w-full max-h-[60vh] object-contain"
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
                onPlay={() => setIsPaused(false)}
                onPause={() => setIsPaused(true)}
              >
                <source src={item?.content_url || 'https://www.w3schools.com/html/mov_bbb.mp4'} type="video/mp4" />
                Your browser does not support HTML5 video playback.
              </video>
            </div>

            <div className="surface p-5 rounded-3xl border border-[var(--border-color)] space-y-2">
              <h3 className="m-0 text-lg font-bold text-[var(--text-primary)]">{item?.title}</h3>
              <p className="m-0 text-xs text-[var(--text-muted)]">Resuming from {formatTimer(videoPosition)} • {item?.difficulty || 'Medium'} Difficulty</p>
              <p className="m-0 text-xs text-[var(--text-secondary)] pt-1">{item?.description}</p>
            </div>
          </div>
        )}

        {/* LISTEN MODE (AUDIO LESSON) */}
        {activeTab === 'listen' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="surface p-8 rounded-3xl border border-[var(--border-color)] flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-6 rounded-full bg-[var(--brand-soft)] text-[var(--brand-orange)] border border-[var(--brand-soft-border)] shadow-lg animate-pulse">
                <Volume2 className="w-12 h-12" />
              </div>
              <div>
                <h3 className="m-0 text-xl font-bold text-[var(--text-primary)]">{item?.title}</h3>
                <p className="m-0 text-xs text-[var(--text-muted)] mt-1">{item?.topic || 'Audio Lecture'}</p>
              </div>

              <audio controls className="w-full max-w-md mt-4">
                <source src={item?.content_url || 'https://www.w3schools.com/html/horse.mp3'} type="audio/mpeg" />
                Your browser does not support audio playback.
              </audio>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
