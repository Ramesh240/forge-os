'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Compass, Sparkles, Check } from 'lucide-react';
import { soundEngine } from '@/lib/sound-engine';

interface QuickCreateFabProps {
  onCreateHabit: () => void;
  onCreateIdentity: () => void;
  soundEnabled?: boolean;
  hidden?: boolean;
}

export default function QuickCreateFab({
  onCreateHabit,
  onCreateIdentity,
  soundEnabled = true,
  hidden = false,
}: QuickCreateFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        soundEngine.playTactileClick(soundEnabled);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, soundEnabled]);

  // Close when hidden changes (e.g. session started or modal opened)
  useEffect(() => {
    if (hidden && isOpen) {
      setIsOpen(false);
    }
  }, [hidden, isOpen]);

  const toggleOpen = () => {
    soundEngine.playTactileClick(soundEnabled);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(10);
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (action: 'HABIT' | 'IDENTITY') => {
    soundEngine.playTactileClick(soundEnabled);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(15);
    }
    setIsOpen(false);
    if (action === 'HABIT') {
      onCreateHabit();
    } else {
      onCreateIdentity();
    }
  };

  if (hidden) return null;

  return (
    <>
      {/* Frosted Backdrop Overlay for Easy Outside Tap Dismissal */}
      {isOpen && (
        <div
          role="presentation"
          onClick={() => {
            soundEngine.playTactileClick(soundEnabled);
            setIsOpen(false);
          }}
          className="fixed inset-0 z-30 bg-black/25 dark:bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Floating Speed-Dial Container (Bottom-Right Thumb Ergonomics) */}
      <div
        ref={containerRef}
        className="fixed z-40 flex flex-col items-end right-4 md:right-8 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-8 select-none pointer-events-auto"
        aria-label="Quick Creation Actions"
      >
        {/* Speed Dial Action Pills (Expands Upwards) */}
        <div
          className={`flex flex-col items-end gap-2.5 mb-3 transition-all duration-300 ease-out origin-bottom-right ${
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
          }`}
          aria-hidden={!isOpen}
        >
          {/* Action 1: New Identity */}
          <button
            type="button"
            onClick={() => handleSelect('IDENTITY')}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-nav shadow-lg border border-[var(--border-subtle)] text-xs font-bold theme-text hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-end">
              <span className="leading-tight text-xs">New Identity</span>
              <span className="text-[10px] font-normal theme-muted">Core Driver</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
          </button>

          {/* Action 2: New Habit */}
          <button
            type="button"
            onClick={() => handleSelect('HABIT')}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-nav shadow-lg border border-[var(--border-subtle)] text-xs font-bold theme-text hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-end">
              <span className="leading-tight text-xs">New Habit</span>
              <span className="text-[10px] font-normal theme-muted">Daily Practice</span>
            </div>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition-transform"
              style={{ background: 'var(--accent-primary)' }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
          </button>
        </div>

        {/* Primary Floating Action Trigger (FAB) */}
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close Quick Creation Menu' : 'Quick Create Habit or Identity'}
          title="Quick Create (Thumb Action)"
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl sm:rounded-full flex items-center justify-center text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] active:scale-95 transition-all duration-300 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 group relative"
          style={{
            background: 'var(--accent-primary)',
            boxShadow: isOpen
              ? '0 0 20px var(--accent-glow), 0 8px 24px rgba(0,0,0,0.4)'
              : '0 4px 16px var(--accent-glow), 0 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          <div
            className={`transition-transform duration-300 ease-out flex items-center justify-center ${
              isOpen ? 'rotate-45 scale-110' : 'rotate-0 scale-100 group-hover:scale-110'
            }`}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>

          {/* Pulse ring indicator when closed to invite thumb tap */}
          {!isOpen && (
            <span
              className="absolute inset-0 rounded-2xl sm:rounded-full pointer-events-none opacity-40 animate-ping -z-10"
              style={{ background: 'var(--accent-primary)' }}
            />
          )}
        </button>
      </div>
    </>
  );
}
