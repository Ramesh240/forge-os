'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  Zap,
  ArrowRight,
  X,
  CheckCircle2,
  Link as LinkIcon,
} from 'lucide-react';
import { SerializedHabit } from '@/components/ForgeAppShell';

interface HabitChainTransitionModalProps {
  isOpen: boolean;
  habit: SerializedHabit;
  votesEarned: number;
  durationMinutes: number;
  isPerfectDayNow: boolean;
  nextHabit: SerializedHabit | null;
  onContinueChain: (nextHabit: SerializedHabit) => void;
  onClose: () => void;
}

export default function HabitChainTransitionModal({
  isOpen,
  habit,
  votesEarned,
  durationMinutes,
  isPerfectDayNow,
  nextHabit,
  onContinueChain,
  onClose,
}: HabitChainTransitionModalProps) {
  // Fire celebratory confetti when Perfect Day is unlocked
  useEffect(() => {
    if (isOpen && isPerfectDayNow) {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.55 },
          colors: ['#10b981', '#f59e0b', '#6366f1', '#3b82f6', '#ec4899'],
        });

        const timer = setTimeout(() => {
          confetti({
            particleCount: 45,
            angle: 60,
            spread: 60,
            origin: { x: 0.1, y: 0.65 },
            colors: ['#10b981', '#f59e0b', '#3b82f6'],
          });
          confetti({
            particleCount: 45,
            angle: 120,
            spread: 60,
            origin: { x: 0.9, y: 0.65 },
            colors: ['#10b981', '#f59e0b', '#3b82f6'],
          });
        }, 220);

        return () => clearTimeout(timer);
      } catch {
        // Safe fallback in headless / constrained environments
      }
    }
  }, [isOpen, isPerfectDayNow]);

  if (!isOpen) return null;

  return (
    /* Completely opaque, high-contrast dark overlay to prevent background bleed-through */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{
        backgroundColor: 'rgba(5, 5, 8, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Completely solid, opaque dialog surface */}
      <div
        className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-[0_25px_80px_rgba(0,0,0,0.95)] border border-white/20 overflow-hidden"
        style={{
          backgroundColor: '#0d0e15',
          opacity: 1,
        }}
      >
        {/* Subtle Ambient Accent Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-48 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{
            background: isPerfectDayNow ? '#10b981' : 'var(--accent-primary, #6366f1)',
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isPerfectDayNow ? (
          /* ========================================================= */
          /* PERFECT DAY CEREMONY                                      */
          /* ========================================================= */
          <div className="space-y-4 pt-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Trophy className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30">
                Daily Completion Mastery
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                🏆 Perfect Day Forged!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-sm mx-auto leading-relaxed">
                You completed every single habit in your identity queue today. Your continuity chain is rock solid.
              </p>
            </div>

            {/* Reward Stats Pill */}
            <div
              className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl border border-white/10 text-center"
              style={{ backgroundColor: '#141622' }}
            >
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-400 font-mono uppercase">Session Pts</span>
                <p className="text-lg font-black text-emerald-400">+{votesEarned}</p>
              </div>
              <div className="space-y-0.5 border-x border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono uppercase">Multiplier</span>
                <p className="text-lg font-black text-amber-400">1.5x Bonus</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-400 font-mono uppercase">Status</span>
                <p className="text-lg font-black text-indigo-400">Preserved</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg transition hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                style={{ background: 'var(--accent-primary, #6366f1)' }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Claim Perfect Day &amp; Return</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* SESSION LOGGED + CHAIN CONTINUATION PROMPT                */
          /* ========================================================= */
          <div className="space-y-5 pt-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/15">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30">
                Identity Session Logged
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                +{votesEarned} Identity Points Banked
              </h2>
              <p className="text-xs text-zinc-400">
                Completed &quot;{habit.title}&quot; • {durationMinutes} min focus session
              </p>
            </div>

            {/* Chain Continuation Box - 100% Solid Opaque Slate Background */}
            {nextHabit ? (
              <div
                className="p-5 rounded-2xl text-left space-y-3.5 border border-white/15 shadow-xl"
                style={{
                  backgroundColor: '#161824',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                    <LinkIcon className="w-3.5 h-3.5" />
                    Chain Continuation
                  </span>
                  <span className="text-[11px] text-zinc-300 font-mono px-2.5 py-0.5 rounded-md bg-white/10 border border-white/10">
                    {nextHabit.identityTitle}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white leading-snug">
                    {nextHabit.title}
                  </h4>
                  <p className="text-xs text-zinc-300">
                    <strong className="text-emerald-400">⚡ 2m Gateway:</strong> &quot;{nextHabit.gatewayVersion}&quot;
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onContinueChain(nextHabit);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg transition hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: 'var(--accent-primary, #6366f1)' }}
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Start 2-Min Gateway Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            {/* Secondary Dismiss Button */}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              Done for Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
