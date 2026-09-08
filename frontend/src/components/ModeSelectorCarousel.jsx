import React, { useRef, useState } from 'react';

const CONTENT_TYPES = ['POST', 'STORY', 'REEL', 'IDEA', 'LIVE'];

export default function ModeSelectorCarousel({ activeMode, onModeSelect }) {
  const selectedIndex = Math.max(0, CONTENT_TYPES.indexOf(activeMode));
  const touchStartRef = useRef({ x: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Handle Touch/Pointer Swiping Gesture
  const handlePointerDown = (e) => {
    setIsDragging(true);
    touchStartRef.current = {
      x: e.clientX ?? e.touches?.[0]?.clientX ?? 0,
    };
    setDragOffset(0);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const deltaX = currentX - touchStartRef.current.x;
    setDragOffset(deltaX);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Swipe Threshold: 35px
    if (dragOffset < -35 && selectedIndex < CONTENT_TYPES.length - 1) {
      onModeSelect(CONTENT_TYPES[selectedIndex + 1]);
    } else if (dragOffset > 35 && selectedIndex > 0) {
      onModeSelect(CONTENT_TYPES[selectedIndex - 1]);
    }

    setDragOffset(0);
  };

  // Keyboard Arrow Key Navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' && selectedIndex < CONTENT_TYPES.length - 1) {
      onModeSelect(CONTENT_TYPES[selectedIndex + 1]);
    } else if (e.key === 'ArrowLeft' && selectedIndex > 0) {
      onModeSelect(CONTENT_TYPES[selectedIndex - 1]);
    }
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-4 z-[99999999] flex justify-center pointer-events-auto select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Content mode navigation"
    >
      {/* ONE FIXED-WIDTH CONTAINER (VIEWPORT POSITION & X-COORDINATES ARE 100% IMMUTABLE) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className="relative grid grid-cols-5 items-center rounded-full bg-black/75 backdrop-blur-2xl border border-white/20 p-1.5 shadow-2xl w-[92vw] max-w-[360px] sm:max-w-[400px] outline-none focus-visible:ring-2 focus-visible:ring-[#3b52cf]"
      >
        {/* SHARED ACTIVE PILL (SLIDES SMOOTHLY BETWEEN THE 5 FIXED EQUAL SLOTS) */}
        <div
          className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-gradient-to-r from-[#3b52cf] via-[#5c67e6] to-[#7c3aed] shadow-lg shadow-indigo-600/40 border border-white/25 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: 'calc((100% - 12px) / 5)',
            transform: `translate3d(calc(${selectedIndex * 100}% + ${isDragging ? dragOffset * 0.15 : 0}px), 0, 0)`,
          }}
        />

        {/* 5 PERMANENT FIXED SLOTS FOR TEXT (LABEL X-COORDINATES NEVER CHANGE) */}
        {CONTENT_TYPES.map((type) => {
          const isSelected = type === activeMode;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onModeSelect(type)}
              className={`relative z-10 w-full py-2 text-[11px] sm:text-xs font-extrabold tracking-wider text-center transition-opacity duration-200 cursor-pointer ${
                isSelected
                  ? 'text-white opacity-100'
                  : 'text-white/70 opacity-40 hover:opacity-80'
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
