// src/components/forge/QuickHudDrawer.tsx
'use client';

import React from 'react';
import {
  X,
  Play,
  Flame,
  Clock,
  Zap,
  Sparkles,
  AlertTriangle,
  Link2,
} from 'lucide-react';
import { SerializedHabit } from '../ForgeAppShell';

interface QuickHudDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  habits: SerializedHabit[];
  onStartFocusSession: (habit: SerializedHabit) => void;
}

export function QuickHudDrawer({
  isOpen,
  onClose,
  habits,
  onStartFocusSession,
}: QuickHudDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl overflow-y-auto">
      <div className="relative z-10 w-full max-w-lg bg-[var(--forge-surface-low)] border border-[var(--forge-border)] rounded-3xl p-5 sm:p-6 shadow-[0_20px_80px_rgba(0,0,0,0.5)] my-auto flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--forge-border)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--forge-tertiary)] shadow-[0_0_8px_#4cd7f6] animate-ping" />
            <span className="font-mono-forge text-xs uppercase tracking-wider font-bold text-[var(--forge-tertiary)]">
              Quick Starts
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Deck of habits */}
        <div className="space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar pr-0.5">
          {habits.slice(0, 4).map((habit) => {
            const isRebound = habit.isReboundPriority;
            return (
              <div
                key={habit.id}
                className="relative bg-[var(--forge-surface-mid)] border border-[var(--forge-border)] rounded-2xl p-4 shadow-lg overflow-hidden flex flex-col space-y-2.5"
              >
                {/* Badges row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isRebound && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--forge-error-container)] border border-[rgba(255,180,171,0.3)] text-[var(--forge-error)] font-mono-forge text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        REBOUND 🔥
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-[var(--forge-surface-high)] text-[var(--forge-primary)] font-mono-forge text-[10px] font-bold uppercase">
                      {habit.defaultPhase || 'PRACTICE'}
                    </span>
                  </div>

                  <span className="font-mono-forge text-[10px] text-[var(--forge-text-muted)] uppercase truncate max-w-[140px]">
                    {habit.identityTitle}
                  </span>
                </div>

                {/* Habit details */}
                <div>
                  <h4 className="text-base font-bold text-[var(--forge-text-primary)] tracking-tight">
                    {habit.title}
                  </h4>
                  <p className="text-xs text-[var(--forge-text-secondary)] mt-0.5 truncate">
                    ⚡ 2-Min: {habit.gatewayVersion}
                  </p>
                </div>

                {/* 1-Tap trigger button */}
                <button
                  onClick={() => {
                    onClose();
                    onStartFocusSession(habit);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6f00be] hover:brightness-110 text-white font-mono-forge text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(128,131,255,0.4)] active:scale-[0.98] transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START 2-MIN</span>
                </button>

                {/* Footer telemetry */}
                <div className="flex items-center justify-between text-[10px] font-mono-forge text-[var(--forge-text-muted)] pt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--forge-secondary)]" />
                    {habit.reminderTime || 'Untimed'}
                  </span>
                  <span className="flex items-center gap-1 text-[var(--forge-flame)] font-bold">
                    <Flame className="w-3 h-3 fill-current" />
                    {habit.currentStreak}d streak
                  </span>
                  <span className="flex items-center gap-1 text-[var(--forge-primary)] font-bold">
                    <Sparkles className="w-3 h-3" />
                    +1.8 XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
