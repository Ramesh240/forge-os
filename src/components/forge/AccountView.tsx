// src/components/forge/AccountView.tsx
'use client';

import React, { useState } from 'react';
import {
  Palette,
  Volume2,
  Bell,
  BellRing,
  Download,
  ShieldAlert,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Trash2,
  CheckCircle2,
  Sparkles,
  Flame,
} from 'lucide-react';
import { soundEngine } from '@/lib/sound-engine';
import { SerializedIdentity, UserProfile } from '../ForgeAppShell';

type ThemeMode = 'obsidian' | 'sepia' | 'light';

interface AccountViewProps {
  currentUser?: UserProfile | null;
  googleAuthEnabled: boolean;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notifPermission: string;
  onRequestNotifications: () => void;
  installPromptEvent: any;
  onInstallPWA: () => void;
  onSeedSampleHistory: () => Promise<void>;
  onRunAudit: () => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  identities: SerializedIdentity[];
  totalHours: number;
  streak: number;
}

export function AccountView({
  currentUser,
  googleAuthEnabled,
  theme,
  onSelectTheme,
  soundEnabled,
  onToggleSound,
  notifPermission,
  onRequestNotifications,
  installPromptEvent,
  onInstallPWA,
  onSeedSampleHistory,
  onRunAudit,
  onSignInWithGoogle,
  onSignOut,
  onDeleteAccount,
  identities,
  totalHours,
  streak,
}: AccountViewProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleTestChime = () => {
    soundEngine.playMicroClearedChime(true);
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await onSeedSampleHistory();
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      await onRunAudit();
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. USER IDENTITY PROFILE CARD
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--forge-surface-low)]/90 backdrop-blur-xl border border-[var(--forge-border)] rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          {currentUser?.image ? (
            <img
              src={currentUser.image}
              alt={currentUser.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[var(--forge-primary)]/40 shadow-[0_0_16px_rgba(192,193,255,0.3)]"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8083ff] to-[#6f00be] flex items-center justify-center text-white shadow-[0_0_16px_rgba(192,193,255,0.3)]">
              <UserIcon className="w-7 h-7" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--forge-text-primary)] truncate">
                {currentUser?.name || 'Systems Architect'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[var(--forge-primary-tint)] border border-[var(--forge-border-mid)] text-[var(--forge-primary)] font-mono-forge text-[10px] font-bold">
                TIER IV
              </span>
            </div>
            <p className="text-xs text-[var(--forge-text-secondary)] font-mono-forge truncate">
              {currentUser?.email || 'local-architect@forge.os'}
            </p>
          </div>
        </div>

        {/* Quick telemetry mini-row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[var(--forge-border)] text-center font-mono-forge">
          <div className="bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] rounded-xl p-2.5">
            <span className="text-[10px] text-[var(--forge-text-muted)] uppercase">Hours</span>
            <p className="text-base font-bold text-[var(--forge-text-primary)] mt-0.5">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] rounded-xl p-2.5">
            <span className="text-[10px] text-[var(--forge-text-muted)] uppercase">Streak</span>
            <p className="text-base font-bold text-[var(--forge-flame)] mt-0.5 flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              {streak}d
            </p>
          </div>
          <div className="bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] rounded-xl p-2.5">
            <span className="text-[10px] text-[var(--forge-text-muted)] uppercase">Archetypes</span>
            <p className="text-base font-bold text-[var(--forge-tertiary)] mt-0.5">
              {identities.length}
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. APPEARANCE & THEME ENGINE
      ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[var(--forge-primary)]" />
            <span className="font-mono-forge text-xs uppercase tracking-wider font-bold text-[var(--forge-text-secondary)]">
              Theme & Appearance
            </span>
          </div>
          <span className="font-mono-forge text-[10px] tracking-wider text-[var(--forge-tertiary)] uppercase">
            3 Themes
          </span>
        </div>

        {/* 3 Theme Preview Tiles */}
        <div className="grid grid-cols-3 gap-3">
          {/* Tile 1: Obsidian Dark */}
          <button
            onClick={() => onSelectTheme('obsidian')}
            className={`relative flex flex-col p-3 rounded-2xl border text-left transition-all overflow-hidden ${
              theme === 'obsidian'
                ? 'bg-[var(--forge-surface-low)] border-[var(--forge-primary)] shadow-[0_0_20px_rgba(192,193,255,0.25)] ring-2 ring-[var(--forge-primary)]'
                : 'bg-[var(--forge-surface-low)] border-[var(--forge-border)] opacity-70 hover:opacity-100'
            }`}
          >
            {theme === 'obsidian' && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--forge-primary)] fill-current" />
              </div>
            )}
            <div className="h-10 w-full rounded-xl bg-[#0e0e12] p-2 flex flex-col justify-between mb-2 border border-white/10 shadow-inner">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#c0c1ff] shadow-[0_0_6px_#c0c1ff]" />
                <span className="h-1 w-6 rounded bg-[#353438]" />
              </div>
              <div className="h-2 w-3/4 rounded bg-[#8083ff]/40" />
            </div>
            <span className="font-bold text-xs text-[var(--forge-text-primary)]">
              Obsidian
            </span>
            <span className="font-mono-forge text-[9px] text-[var(--forge-primary)] uppercase mt-0.5">
              Default Dark
            </span>
          </button>

          {/* Tile 2: Parchment / Sepia */}
          <button
            onClick={() => onSelectTheme('sepia')}
            className={`relative flex flex-col p-3 rounded-2xl border text-left transition-all overflow-hidden ${
              theme === 'sepia'
                ? 'bg-[var(--forge-surface-low)] border-[#b45309] shadow-[0_0_20px_rgba(180,83,9,0.3)] ring-2 ring-[#b45309]'
                : 'bg-[var(--forge-surface-low)] border-[var(--forge-border)] opacity-70 hover:opacity-100'
            }`}
          >
            {theme === 'sepia' && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="w-4 h-4 text-[#ea580c] fill-current" />
              </div>
            )}
            <div className="h-10 w-full rounded-xl bg-[#ede8d8] p-2 flex flex-col justify-between mb-2 border border-[rgba(100,70,30,0.2)] shadow-inner">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#b45309]" />
                <span className="h-1 w-6 rounded bg-[#8a735c]" />
              </div>
              <div className="h-2 w-3/4 rounded bg-[#b45309]/50" />
            </div>
            <span className="font-bold text-xs text-[var(--forge-text-primary)]">
              Monastic
            </span>
            <span className="font-mono-forge text-[9px] text-[#f59e0b] uppercase mt-0.5 font-bold">
              Warm Sepia
            </span>
          </button>

          {/* Tile 3: Daylight Minimal */}
          <button
            onClick={() => onSelectTheme('light')}
            className={`relative flex flex-col p-3 rounded-2xl border text-left transition-all overflow-hidden ${
              theme === 'light'
                ? 'bg-[var(--forge-surface-low)] border-[#4f46e5] shadow-[0_0_20px_rgba(79,70,229,0.3)] ring-2 ring-[#4f46e5]'
                : 'bg-[var(--forge-surface-low)] border-[var(--forge-border)] opacity-70 hover:opacity-100'
            }`}
          >
            {theme === 'light' && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="w-4 h-4 text-[#4f46e5] fill-current" />
              </div>
            )}
            <div className="h-10 w-full rounded-xl bg-[#f8fafc] p-2 flex flex-col justify-between mb-2 border border-slate-300 shadow-inner">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#4f46e5]" />
                <span className="h-1 w-6 rounded bg-[#cbd5e1]" />
              </div>
              <div className="h-2 w-3/4 rounded bg-[#4f46e5]/40" />
            </div>
            <span className="font-bold text-xs text-[var(--forge-text-primary)]">
              Contrast
            </span>
            <span className="font-mono-forge text-[9px] text-[#4f46e5] uppercase mt-0.5 font-bold">
              Daylight
            </span>
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SOUND & AUDIO ENGINE MODULE
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[var(--forge-surface-low)] border border-[var(--forge-border)] rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-start gap-3 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--forge-surface-high)] flex items-center justify-center text-[var(--forge-primary)] shrink-0 mt-0.5">
            <Volume2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="text-sm font-bold text-[var(--forge-text-primary)]">
              Audio & Chimes
            </h4>
            <p className="text-xs text-[var(--forge-text-secondary)] line-clamp-1">
              Cadence sounds, gateway fanfare, and cues.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestChime}
            className="px-2.5 py-1 rounded-lg bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-xs font-mono-forge text-[var(--forge-text-primary)] transition-all active:scale-95 border border-[var(--forge-border)]"
          >
            Test
          </button>

          <button
            onClick={onToggleSound}
            className={`relative w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
              soundEnabled ? 'bg-[var(--forge-primary-btn)]' : 'bg-[var(--forge-surface-highest)]'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. NOTIFICATIONS PERMISSION MODULE
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[var(--forge-surface-low)] border border-[var(--forge-border)] rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-start gap-3 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--forge-surface-high)] flex items-center justify-center text-[var(--forge-secondary)] shrink-0 mt-0.5">
            {notifPermission === 'granted' ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="text-sm font-bold text-[var(--forge-text-primary)]">
              Daily Reminders
            </h4>
            <p className="text-xs text-[var(--forge-text-secondary)]">
              {notifPermission === 'granted'
                ? 'Active for daily habit schedules'
                : 'Scheduled time alerts for habits'}
            </p>
          </div>
        </div>

        <button
          onClick={onRequestNotifications}
          className={`px-3 py-1.5 rounded-xl font-mono-forge text-xs font-bold transition-all ${
            notifPermission === 'granted'
              ? 'bg-[var(--forge-emerald-tint)] border border-[rgba(16,185,129,0.3)] text-[var(--forge-emerald)]'
              : 'bg-gradient-to-r from-[#8083ff] to-[#6f00be] text-white shadow-md'
          }`}
        >
          {notifPermission === 'granted' ? 'Active ✓' : 'Enable'}
        </button>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. PWA INSTALLATION BANNER
      ───────────────────────────────────────────────────────────── */}
      {installPromptEvent && (
        <section className="bg-gradient-to-r from-[#8083ff]/15 via-[#6f00be]/15 to-transparent border border-[var(--forge-border-mid)] rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--forge-primary-btn)] flex items-center justify-center text-white">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--forge-text-primary)]">
                Install ForgeOS App
              </h4>
              <p className="text-xs text-[var(--forge-text-secondary)]">
                Standalone PWA home-screen cockpit with offline support
              </p>
            </div>
          </div>

          <button
            onClick={onInstallPWA}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6f00be] text-white font-mono-forge text-xs font-bold shadow-md hover:brightness-110 active:scale-95"
          >
            Install
          </button>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. MAINTENANCE & DATA ENGINE
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[var(--forge-surface-low)] border border-[var(--forge-border)] rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[var(--forge-text-primary)] font-mono-forge uppercase tracking-wider">
          System Diagnostics
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleAudit}
            disabled={isAuditing}
            className="py-3 px-4 rounded-xl bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-left flex items-center justify-between border border-[var(--forge-border)] transition-all text-xs font-mono-forge text-[var(--forge-text-primary)]"
          >
            <span>Run Guardrail Audit</span>
            <RefreshCw className={`w-4 h-4 text-[var(--forge-primary)] ${isAuditing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="py-3 px-4 rounded-xl bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-left flex items-center justify-between border border-[var(--forge-border)] transition-all text-xs font-mono-forge text-[var(--forge-text-primary)]"
          >
            <span>Seed Sample History</span>
            <Sparkles className={`w-4 h-4 text-[var(--forge-secondary)] ${isSeeding ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Auth Row */}
        {googleAuthEnabled && (
          <div className="pt-2 border-t border-[var(--forge-border)] flex items-center justify-between">
            <span className="text-xs text-[var(--forge-text-secondary)] font-mono-forge">
              {currentUser ? `Signed in as ${currentUser.email}` : 'Sign in to sync across devices'}
            </span>
            {currentUser ? (
              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--forge-surface-high)] text-xs font-mono-forge text-[var(--forge-error)] hover:bg-[var(--forge-surface-highest)] transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={onSignInWithGoogle}
                className="px-4 py-2 rounded-xl bg-[var(--forge-primary-btn)] text-white font-bold text-xs shadow-md hover:brightness-110 transition-all"
              >
                Sign In with Google
              </button>
            )}
          </div>
        )}

        {/* Danger Zone: Wipe Account */}
        <div className="pt-2 border-t border-[var(--forge-border)] flex items-center justify-between">
          <span className="text-xs text-[var(--forge-text-muted)]">
            Reset all identities, chains, and logs
          </span>
          {showConfirmDelete ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onDeleteAccount}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-mono-forge text-xs font-bold hover:bg-red-700 shadow-md"
              >
                Confirm Wipe
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--forge-surface-high)] text-xs font-mono-forge text-[var(--forge-text-primary)]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="text-xs font-mono-forge text-[var(--forge-error)] hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All Data</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
