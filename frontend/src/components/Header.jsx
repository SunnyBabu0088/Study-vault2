import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Heart, Menu, Plus, User, Image, Film, Sparkles, Camera } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export default function Header() {
  const { navigate, activeView, openStoryActivity, openCreateModal, closeCreateModal, isCreateModalOpen, setIsProfileMenuOpen } = useStudy();
  const filePickerRef = useRef(null);
  const menuRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [glassStage, setGlassStage] = useState('idle'); // 'idle' | 'pressed' | 'frosted' | 'blurring' | 'revealed' | 'closing'
  const [originCoords, setOriginCoords] = useState({ x: 0, y: 0 });

  const isHomeView = activeView === 'home-view';
  const isProfileView = activeView === 'profile-view';

  // Reverse animation when Create Modal closes
  useEffect(() => {
    if (!isCreateModalOpen && (glassStage === 'revealed' || glassStage === 'blurring')) {
      setGlassStage('closing');
      const timer = setTimeout(() => {
        setGlassStage('idle');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isCreateModalOpen, glassStage]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  // GLASS BLUR REVEAL SEQUENCE
  const handlePlusButtonClick = (e) => {
    if (glassStage !== 'idle') return;

    // Capture exact Plus button center position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setOriginCoords({ x, y });

    // Respect prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      openCreateModal([], 'POST');
      return;
    }

    // Phase 1: Button Tactile Press (0ms - 180ms)
    setGlassStage('pressed');

    // Phase 2: Frosted Glass Panel Appears (180ms - 600ms)
    setTimeout(() => {
      setGlassStage('frosted');
    }, 180);

    // Phase 3: Background Blur Increase (600ms - 1100ms)
    setTimeout(() => {
      setGlassStage('blurring');
    }, 600);

    // Phase 4: Create Content Sharpen & Reveal (900ms - 1400ms)
    setTimeout(() => {
      openCreateModal([], 'POST');
    }, 900);

    // Phase 5 Complete: Final Settle (1400ms) - ALL ANIMATION STOPS!
    setTimeout(() => {
      setGlassStage('revealed');
    }, 1400);
  };

  const handleSelectOption = (mode) => {
    setIsMenuOpen(false);
    if (mode === 'POST_FILE') {
      if (filePickerRef.current) {
        filePickerRef.current.value = '';
        filePickerRef.current.click();
      }
    } else {
      openCreateModal([], mode);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    const formatted = [];
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          formatted.push({
            id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            file,
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video/') ? 'video' : 'image',
            name: file.name
          });
        }
      }
    }
    openCreateModal(formatted, 'POST');
  };

  return (
    <>
      {/* FROSTED GLASS BLUR REVEAL PORTAL OVERLAY */}
      {glassStage !== 'idle' && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-[999998] pointer-events-none select-none overflow-hidden transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)] ${
            glassStage === 'closing' ? 'opacity-0 duration-700' : 'opacity-100 duration-400'
          }`}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Frosted Glass Backdrop Wash Layer */}
          <div
            className={`absolute inset-0 bg-[var(--background)]/60 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              glassStage === 'pressed' ? 'opacity-20 backdrop-blur-none' : glassStage === 'frosted' ? 'opacity-60 backdrop-blur-md' : 'opacity-100 backdrop-blur-xl'
            }`}
          />

          {/* Faded Ambient Glass Light Accent (Static Soft Ambient Lighting) */}
          <div
            className="absolute rounded-full pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              left: originCoords.x || '90%',
              top: originCoords.y || '40px',
              width: glassStage === 'pressed' ? '100px' : glassStage === 'frosted' ? '120vmax' : '260vmax',
              height: glassStage === 'pressed' ? '100px' : glassStage === 'frosted' ? '120vmax' : '260vmax',
              transform: 'translate3d(-50%, -50%, 0) scale(1)',
              background: `
                radial-gradient(circle at 20% 30%, rgba(0, 122, 255, 0.25), transparent 55%),
                radial-gradient(circle at 50% 35%, rgba(124, 58, 237, 0.22), transparent 55%),
                radial-gradient(circle at 80% 40%, rgba(217, 70, 239, 0.20), transparent 50%),
                radial-gradient(circle at 50% 100%, rgba(0, 210, 255, 0.18), transparent 55%),
                radial-gradient(circle at center, rgba(10, 15, 25, 0.85) 0%, rgba(10, 15, 25, 0.95) 100%)
              `,
              filter: 'blur(40px)',
              opacity: glassStage === 'closing' ? 0 : 0.95,
            }}
          />
        </div>,
        document.body
      )}

      <header className="w-full px-4 pt-4 sm:px-7 sm:pt-6">
        <input
          ref={filePickerRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Left Side: Logo + Title */}
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-lg cursor-pointer transition hover:scale-105"
              style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
              aria-label="StudyVault Home"
              onClick={() => navigate('home-view')}
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="m-0 font-bold tracking-tight text-base text-[var(--text-primary)] cursor-pointer" onClick={() => navigate('home-view')}>
                StudyVault
              </p>
            </div>
          </div>

          {/* Right Side: + & Activity on Home, ☰ Hamburger on Profile, User icon on other views */}
          <div className="flex items-center gap-2 relative" ref={menuRef}>
            {isHomeView ? (
              <>
                {/* CALM SOFT FADED MULTI-COLOR PLUS BUTTON */}
                <button
                  type="button"
                  onClick={handlePlusButtonClick}
                  aria-label="Create content"
                  aria-expanded={isMenuOpen || glassStage !== 'idle'}
                  className={`group relative grid h-10 w-10 place-items-center rounded-full overflow-hidden
                    border border-white/30
                    shadow-sm
                    hover:shadow-md hover:scale-[1.04] hover:brightness-105
                    ${glassStage === 'pressed' ? 'scale-95 brightness-125' : 'active:scale-[0.94]'}
                    transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]
                    cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-orange)]`}
                  style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
                >
                  {/* Faded Glass Top Highlight */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />

                  {/* ROTATING PLUS → CLOSE ICON */}
                  <Plus
                    className={`h-5 w-5 text-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      glassStage !== 'idle' || isMenuOpen ? 'rotate-45 scale-105' : 'rotate-0 scale-100'
                    }`}
                  />
                </button>

                {/* CREATE CONTENT MENU POPUP */}
                {isMenuOpen && (
                  <div
                    className="absolute right-0 top-12 z-[9999] w-52 rounded-2xl p-1.5
                      bg-[var(--surface)]/95 backdrop-blur-2xl
                      border border-[var(--border)]
                      shadow-2xl shadow-black/25
                      animate-in fade-in slide-in-from-top-2 duration-200 ease-out"
                  >
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => handleSelectOption('POST_FILE')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                      >
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                          <Image className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="m-0 leading-tight font-bold">New Post</p>
                          <p className="m-0 text-[10px] text-[var(--text-muted)] font-normal">Photo or Video Post</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectOption('STORY')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                      >
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
                          <Camera className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="m-0 leading-tight font-bold">Add Story</p>
                          <p className="m-0 text-[10px] text-[var(--text-muted)] font-normal">Disappears in 24h</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectOption('REEL')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                      >
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                          <Film className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="m-0 leading-tight font-bold">Create Reel</p>
                          <p className="m-0 text-[10px] text-[var(--text-muted)] font-normal">Vertical Video Reel</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectOption('IDEA')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                      >
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="m-0 leading-tight font-bold">Startup Idea</p>
                          <p className="m-0 text-[10px] text-[var(--text-muted)] font-normal">Pitch a project idea</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Heart Activity Button */}
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full bg-rose-500/15 dark:bg-rose-500/20 border border-rose-500/20 dark:border-rose-500/30 text-rose-500 dark:text-rose-400 shadow-xs transition hover:scale-105 cursor-pointer"
                  onClick={openStoryActivity}
                  aria-label="View story activity notifications"
                  title="Story Activity"
                >
                  <Heart className="h-5 w-5 fill-current text-rose-500 dark:text-rose-400" />
                </button>
              </>
            ) : isProfileView ? (
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] transition hover:bg-[var(--border)] hover:scale-105 shadow-xs cursor-pointer"
                type="button"
                aria-label="Menu"
                title="Menu"
                onClick={() => setIsProfileMenuOpen(true)}
              >
                <Menu className="h-5 w-5 text-[var(--text-primary)]" />
              </button>
            ) : (
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] transition hover:bg-[var(--border)] hover:scale-105 shadow-xs cursor-pointer"
                type="button"
                aria-label="Profile"
                title="Profile"
                onClick={() => navigate('profile-view')}
              >
                <User className="h-5 w-5 text-[var(--text-primary)]" />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
