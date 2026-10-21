// src/components/ThemePaletteModal.tsx
'use client';

import React from 'react';
import { Palette, X, Lock, Check, Sparkles, Smartphone, Sun, Moon, BookOpen } from 'lucide-react';

export type ThemeMode = 'obsidian' | 'sepia' | 'light';
export type AccentColor = 'indigo' | 'amber' | 'emerald' | 'rose';

interface ThemePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  currentAccent: AccentColor;
  isPro: boolean;
  onSelectTheme: (theme: ThemeMode) => void;
  onSelectAccent: (accent: AccentColor) => void;
  onOpenProModal: () => void;
}

const THEME_OPTIONS: Array<{
  id: ThemeMode;
  name: string;
  badge: string;
  desc: string;
  icon: typeof Moon;
  bgHex: string;
  cardHex: string;
  textHex: string;
  locked: boolean;
}> = [
  {
    id: 'obsidian',
    name: 'Obsidian Glass',
    badge: 'Standard Dark',
    desc: 'Deep focus midnight aesthetic with low eye strain in low-light environments.',
    icon: Moon,
    bgHex: '#060609',
    cardHex: '#12121a',
    textHex: '#f4f4f5',
    locked: false,
  },
  {
    id: 'light',
    name: 'Daylight Minimal',
    badge: 'Pro Feature',
    desc: 'Crisp, high-contrast alabaster layout optimized for daytime viewing & outdoor study.',
    icon: Sun,
    bgHex: '#f8fafc',
    cardHex: '#ffffff',
    textHex: '#0f172a',
    locked: true,
  },
  {
    id: 'sepia',
    name: 'Sepia Studio',
    badge: 'Pro Feature',
    desc: 'Warm parchment paper and espresso tones inspired by classical leather-bound notebooks.',
    icon: BookOpen,
    bgHex: '#f5eedc',
    cardHex: '#fbf5e8',
    textHex: '#2b2118',
    locked: true,
  },
];

const ACCENT_OPTIONS: Array<{
  id: AccentColor;
  name: string;
  colorHex: string;
  glowHex: string;
  meaning: string;
  locked: boolean;
}> = [
  {
    id: 'indigo',
    name: 'Indigo Craft',
    colorHex: '#6366f1',
    glowHex: 'rgba(99,102,241,0.3)',
    meaning: 'Deep Work & Systems Mastery',
    locked: false,
  },
  {
    id: 'amber',
    name: 'Amber Forge',
    colorHex: '#f59e0b',
    glowHex: 'rgba(245,158,11,0.3)',
    meaning: 'Energy, Grit & Execution',
    locked: true,
  },
  {
    id: 'emerald',
    name: 'Emerald Vitality',
    colorHex: '#10b981',
    glowHex: 'rgba(16,185,129,0.3)',
    meaning: 'Habit Consistency & Health',
    locked: true,
  },
  {
    id: 'rose',
    name: 'Rose Mastery',
    colorHex: '#f43f5e',
    glowHex: 'rgba(244,63,94,0.3)',
    meaning: 'Relentless Drive & Precision',
    locked: true,
  },
];

export function applyThemeAndAccentToDocument(theme: ThemeMode, accent: AccentColor) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('forge_theme', theme);
    localStorage.setItem('forge_accent', accent);

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-accent', accent);

    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }

    // Dynamic viewport meta update
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const targetBg = theme === 'light' ? '#f8fafc' : theme === 'sepia' ? '#f5eedc' : '#060609';
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', targetBg);
    }

    // Native Android Bridge notification
    const win = window as unknown as {
      ForgeAndroidBridge?: {
        setSystemBarTheme?: (themeName: string, isDark: boolean) => void;
      };
    };
    if (win.ForgeAndroidBridge?.setSystemBarTheme) {
      win.ForgeAndroidBridge.setSystemBarTheme(theme, theme === 'obsidian');
    }
  } catch (err) {
    console.error('Failed to apply theme settings:', err);
  }
}

export default function ThemePaletteModal({
  isOpen,
  onClose,
  currentTheme,
  currentAccent,
  isPro,
  onSelectTheme,
  onSelectAccent,
  onOpenProModal,
}: ThemePaletteModalProps) {
  if (!isOpen) return null;

  const handleThemeClick = (themeId: ThemeMode, isLocked: boolean) => {
    if (isLocked && !isPro) {
      onOpenProModal();
      return;
    }
    onSelectTheme(themeId);
    applyThemeAndAccentToDocument(themeId, currentAccent);
  };

  const handleAccentClick = (accentId: AccentColor, isLocked: boolean) => {
    if (isLocked && !isPro) {
      onOpenProModal();
      return;
    }
    onSelectAccent(accentId);
    applyThemeAndAccentToDocument(currentTheme, accentId);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-lg p-5 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold theme-text leading-tight">Theme &amp; Accent Engine</h3>
              <p className="text-xs theme-subtext">Customize your visual workspace across Web &amp; Android</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl glass-panel theme-muted hover:opacity-80 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="modal-body-scroll space-y-6 pr-1">
          {/* Section 1: Surface Themes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider theme-muted">
                1. Base Visual Theme
              </span>
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isPro ? 'Pro Active' : 'Light & Sepia require Pro'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEME_OPTIONS.map((t) => {
                const Icon = t.icon;
                const isSelected = currentTheme === t.id;
                const locked = t.locked && !isPro;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeClick(t.id, locked)}
                    className={`relative p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                    }`}
                    style={{ backgroundColor: t.bgHex }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-xs"
                        style={{
                          backgroundColor: t.cardHex,
                          color: t.textHex,
                          borderColor: isSelected ? 'var(--accent-primary)' : 'rgba(0,0,0,0.1)',
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {locked ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400">
                          <Lock className="w-2.5 h-2.5" /> Pro
                        </span>
                      ) : isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <div className="text-xs font-bold" style={{ color: t.textHex }}>
                        {t.name}
                      </div>
                      <p className="text-[10px] opacity-75 line-clamp-2 mt-0.5" style={{ color: t.textHex }}>
                        {t.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Accent Palettes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider theme-muted">
                2. Highlight &amp; Focus Accent
              </span>
              <span className="text-[11px] theme-muted font-mono">Applies to buttons, flames &amp; rings</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ACCENT_OPTIONS.map((a) => {
                const isSelected = currentAccent === a.id;
                const locked = a.locked && !isPro;

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleAccentClick(a.id, locked)}
                    className={`p-3 rounded-2xl glass-panel border text-left transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: a.colorHex, boxShadow: `0 0 10px ${a.glowHex}` }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>

                      {locked && (
                        <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-bold theme-text">{a.name}</div>
                      <div className="text-[10px] theme-muted truncate">{a.meaning}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Android System Info Badge */}
          <div className="p-3.5 rounded-2xl glass-panel border border-[var(--border-subtle)] flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className="text-xs space-y-0.5 flex-1 min-w-0">
              <div className="font-semibold theme-text">Native Android Sync Ready</div>
              <p className="text-[11px] theme-muted">
                When running inside the Android APK wrapper, status bar icons and bottom navigation automatically adapt to your chosen theme.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div className="text-xs theme-muted">
            Active: <strong className="theme-text capitalize">{currentTheme}</strong> •{' '}
            <strong className="theme-text capitalize">{currentAccent}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-95"
            style={{ background: 'var(--accent-primary)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
