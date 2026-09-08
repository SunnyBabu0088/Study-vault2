import React, { useState, useEffect, useRef } from 'react';
import { Home, LayoutDashboard, MessagesSquare, Rocket, User } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

const navItems = [
  { view: 'home-view', label: 'Home', Icon: Home },
  { view: 'messages-view', label: 'Messages', Icon: MessagesSquare },
  { view: 'startup-view', label: 'Startup', Icon: Rocket },
  { view: 'vault-view', label: 'Vault', Icon: LayoutDashboard },
  { view: 'profile-view', label: 'Profile', Icon: User },
];

export default function BottomNav() {
  const { activeView, navigate } = useStudy();
  const [mounted, setMounted] = useState(false);

  const activeIndex = navItems.findIndex((item) => item.view === activeView);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // Fluid Pill Stretch & Direction State
  const [movingState, setMovingState] = useState({ isMoving: false, direction: 'right', distance: 1 });
  const [activePulseTab, setActivePulseTab] = useState(null);
  const prevIndexRef = useRef(safeActiveIndex);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (prevIndexRef.current !== safeActiveIndex) {
      const prev = prevIndexRef.current;
      const curr = safeActiveIndex;
      const distance = Math.abs(curr - prev);
      const direction = curr > prev ? 'right' : 'left';

      setMovingState({ isMoving: true, direction, distance });
      prevIndexRef.current = curr;

      const timer = setTimeout(() => {
        setMovingState({ isMoving: false, direction, distance: 0 });
      }, 340);

      return () => clearTimeout(timer);
    }
  }, [safeActiveIndex]);

  const handleTabClick = (view) => {
    if (activeView === view) {
      // Micro-interaction on tapping already-active tab
      setActivePulseTab(view);
      setTimeout(() => setActivePulseTab(null), 180);
      return;
    }
    navigate(view);
  };

  return (
    <>
      {/* DARK / LIGHT THEME MULTI-STOP GRADIENT FADE BEHIND FLOATING NAV */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[99998] h-[145px] pointer-events-none select-none transition-colors duration-200"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(var(--bg-rgb, 9, 13, 22), 0) 0%,
            rgba(var(--bg-rgb, 9, 13, 22), 0.18) 25%,
            rgba(var(--bg-rgb, 9, 13, 22), 0.55) 55%,
            rgba(var(--bg-rgb, 9, 13, 22), 0.88) 80%,
            rgba(var(--bg-rgb, 9, 13, 22), 0.98) 100%
          )`,
        }}
        aria-hidden="true"
      />

      <nav
        className="fixed bottom-3.5 left-3 sm:left-5 right-3 sm:right-5 z-[99999] mx-auto w-auto max-w-[720px] rounded-[40px] p-1.5 bg-[var(--nav-background)]/85 backdrop-blur-2xl border border-[var(--border)] shadow-xl shadow-black/15 transition-colors duration-200 select-none"
        style={{
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="Primary navigation"
      >
        <div className="relative flex items-center justify-between w-full">
          {/* PREMIUM FLUID MORPHING ACTIVE INDICATOR PILL */}
          <div
            className={`absolute top-0 bottom-0 left-0 rounded-[32px] pointer-events-none ${
              mounted ? 'transition-all duration-340 ease-[cubic-bezier(0.22,1,0.36,1)]' : ''
            }`}
            style={{
              width: '20%',
              background: 'var(--brand-gradient)',
              boxShadow: '0 4px 16px var(--brand-glow)',
              transform: `translate3d(${safeActiveIndex * 100}%, 0, 0) scaleX(${
                movingState.isMoving ? 1 + Math.min(movingState.distance * 0.07, 0.16) : 1
              })`,
              transformOrigin: movingState.direction === 'right' ? 'left center' : 'right center',
              willChange: 'transform',
            }}
            aria-hidden="true"
          />

          {/* NAVIGATION DESTINATIONS */}
          {navItems.map(({ view, label, Icon }) => {
            const isActive = activeView === view;
            const isPulsing = activePulseTab === view;

            return (
              <button
                key={view}
                type="button"
                onClick={() => handleTabClick(view)}
                className={`relative z-10 flex flex-1 flex-col items-center justify-center gap-1 rounded-[32px] py-2 px-1 text-[11px] outline-none cursor-pointer transition-transform duration-100 ease-out ${
                  isPulsing ? 'scale-90' : 'active:scale-[0.96]'
                }`}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? 'text-white scale-105 -translate-y-0.5 drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]'
                      : 'text-[var(--text-secondary)] scale-100 translate-y-0 hover:text-[var(--text-primary)]'
                  }`}
                />
                <span
                  className={`leading-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? 'text-white font-bold opacity-100 -translate-y-0.5 scale-[1.02]'
                      : 'text-[var(--text-secondary)] font-medium opacity-75 translate-y-0 scale-100'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
