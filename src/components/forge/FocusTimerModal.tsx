// src/components/forge/FocusTimerModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  Swords,
  LockOpen,
  FastForward,
  CheckCircle2,
  Hourglass,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SkillStage } from '@/lib/forge-engine';
import { SerializedHabit } from '../ForgeAppShell';

interface FocusTimerModalProps {
  activeHabit: SerializedHabit | null;
  secondsElapsed: number;
  isRunning: boolean;
  onTogglePlayPause: () => void;
  onAbort: () => void;
  stage: SkillStage;
  onSetStage: (stage: SkillStage) => void;
  isChallenge: boolean;
  onToggleChallenge: () => void;
  difficulty: number;
  onSetDifficulty: (diff: number) => void;
  timerMode: 'FLOW' | 'POMO_25_5' | 'POMO_50_10';
  onActivatePomodoroMode: (mode: 'FLOW' | 'POMO_25_5' | 'POMO_50_10') => void;
  pomoPhase: 'WORK' | 'BREAK';
  pomoSecondsLeft: number;
  pomoCyclesCompleted: number;
  onTransitionPomodoro: () => void;
  showDebrief: boolean;
  onSetShowDebrief: (show: boolean) => void;
  bottleneckNote: string;
  onSetBottleneckNote: (note: string) => void;
  insightNote: string;
  onSetInsightNote: (note: string) => void;
  onFinishSession: (microOnly: boolean) => Promise<void>;
  isSubmitting: boolean;
  scorePreview: number;
}

export function FocusTimerModal({
  activeHabit,
  secondsElapsed,
  isRunning,
  onTogglePlayPause,
  onAbort,
  stage,
  onSetStage,
  isChallenge,
  onToggleChallenge,
  difficulty,
  onSetDifficulty,
  timerMode,
  onActivatePomodoroMode,
  pomoPhase,
  pomoSecondsLeft,
  pomoCyclesCompleted,
  onTransitionPomodoro,
  showDebrief,
  onSetShowDebrief,
  bottleneckNote,
  onSetBottleneckNote,
  insightNote,
  onSetInsightNote,
  onFinishSession,
  isSubmitting,
  scorePreview,
}: FocusTimerModalProps) {
  if (!activeHabit) return null;

  const MICRO_THRESHOLD = 120; // 2 minutes
  const microCleared = secondsElapsed >= MICRO_THRESHOLD;
  const sessionMins = Math.max(2, Math.round(secondsElapsed / 60));

  // Timer display calculation
  let displayMins = 0;
  let displaySecs = 0;

  if (timerMode === 'FLOW') {
    if (!microCleared) {
      // Countdown remaining in 2-min gateway
      const left = Math.max(0, MICRO_THRESHOLD - secondsElapsed);
      displayMins = Math.floor(left / 60);
      displaySecs = left % 60;
    } else {
      // Stopwatch upwards
      displayMins = Math.floor(secondsElapsed / 60);
      displaySecs = secondsElapsed % 60;
    }
  } else {
    // Pomodoro countdown
    displayMins = Math.floor(pomoSecondsLeft / 60);
    displaySecs = pomoSecondsLeft % 60;
  }

  const minStr = displayMins.toString().padStart(2, '0');
  const secStr = displaySecs.toString().padStart(2, '0');

  // Orbital SVG ring calculation: r = 106, perimeter = 2 * PI * 106 ≈ 666
  const perimeter = 666;
  const progressRatio = microCleared
    ? 1
    : Math.min(1, secondsElapsed / MICRO_THRESHOLD);
  const strokeDashoffset = perimeter * (1 - progressRatio);

  const frictionLabels = [
    '',
    'Tier 1: Trivial',
    'Tier 2: Light Load',
    'Tier 3: Optimal Edge',
    'Tier 4: High Strain',
    'Tier 5: Cognitive Redline',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto">
      {/* Ambient glowing orb backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] rounded-full bg-[var(--forge-primary)]/15 blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] rounded-full bg-[var(--forge-tertiary)]/10 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg bg-[#131317]/95 border border-[rgba(255,255,255,0.12)] rounded-3xl p-5 sm:p-7 shadow-[0_16px_64px_rgba(0,0,0,0.8)] my-auto flex flex-col space-y-5">
        {/* Top Header Bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--forge-primary-tint)] border border-[rgba(192,193,255,0.25)] text-[var(--forge-primary)] font-mono-forge text-[10px] font-bold uppercase tracking-wider">
                {activeHabit.identityTitle || 'Core Archetype'}
              </span>
              {timerMode !== 'FLOW' && (
                <span className="px-2 py-0.5 rounded-full bg-[#f43f5e]/20 text-[#f43f5e] font-mono-forge text-[10px] font-bold uppercase">
                  {pomoPhase} PHASE
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight truncate">
              {activeHabit.title}
            </h3>
            <p className="text-xs text-[var(--forge-text-secondary)] mt-0.5 truncate">
              2-Min Gateway: {activeHabit.gatewayVersion}
            </p>
          </div>

          <button
            onClick={onAbort}
            className="w-9 h-9 rounded-xl bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-[var(--forge-text-muted)] hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Abort Gateway"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────
            MODE A: LIVE FOCUS CHRONOMETER
        ─────────────────────────────────────────────────────────── */}
        {!showDebrief ? (
          <>
            {/* Center Orbital SVG Ring Core */}
            <div className="relative flex items-center justify-center py-2">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                {/* SVG Ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
                  {/* Track base */}
                  <circle
                    cx="128"
                    cy="128"
                    r="106"
                    className="text-[var(--forge-surface-highest)] stroke-current"
                    fill="none"
                    strokeWidth="8"
                  />
                  {/* Active glowing arc */}
                  <circle
                    cx="128"
                    cy="128"
                    r="106"
                    className="text-[var(--forge-primary)] stroke-current transition-all duration-1000 ease-linear"
                    fill="none"
                    strokeWidth="8"
                    strokeDasharray={perimeter}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      filter:
                        'drop-shadow(0 0 12px rgba(192, 193, 255, 0.75)) drop-shadow(0 0 24px rgba(128, 131, 255, 0.4))',
                    }}
                  />
                </svg>

                {/* Center Orbital Contents */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                  <div className="flex items-center gap-1.5 mb-1 text-[var(--forge-text-secondary)] font-mono-forge text-[11px] uppercase tracking-widest">
                    <Hourglass className="w-3.5 h-3.5 text-[var(--forge-primary)] animate-pulse" />
                    <span>
                      {timerMode !== 'FLOW'
                        ? `${pomoPhase} COUNTDOWN`
                        : microCleared
                        ? 'FLOW CHRONOMETER'
                        : 'GATEWAY BURN'}
                    </span>
                  </div>

                  {/* Massive 68px Monospace Timer */}
                  <div className="font-mono-forge text-6xl sm:text-7xl font-extrabold tracking-tight text-[var(--forge-primary)] select-none drop-shadow-[0_0_24px_rgba(192,193,255,0.45)]">
                    <span>{minStr}</span>
                    <span className="animate-pulse text-[var(--forge-primary)]/70">:</span>
                    <span>{secStr}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--forge-surface-highest)] font-mono-forge text-[10px] text-[var(--forge-text-secondary)] uppercase tracking-wider">
                      {microCleared ? `+${scorePreview.toFixed(1)} XP Minting` : 'Gateway 02:00'}
                    </span>
                    <span className="font-mono-forge text-xs text-[var(--forge-tertiary)] font-bold">
                      {timerMode}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mastery Phase Selector */}
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono-forge">
                <span className="uppercase text-[var(--forge-text-muted)] tracking-wider">
                  Mastery Phase Level
                </span>
                <span className="text-[var(--forge-primary)] font-bold">
                  {stage} Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-1 bg-[#0e0e12] rounded-xl border border-white/5">
                {(['PASSIVE', 'PRACTICE', 'ACTIVE'] as const).map((s) => {
                  const isActive = stage === s;
                  const rate = s === 'PASSIVE' ? 'x0.8' : s === 'PRACTICE' ? 'x1.2' : 'x1.75';
                  return (
                    <button
                      key={s}
                      onClick={() => onSetStage(s)}
                      className={`py-2 px-1 rounded-lg text-center transition-all ${
                        isActive
                          ? 'bg-[var(--forge-surface-high)] text-[var(--forge-primary)] shadow-[0_0_12px_rgba(192,193,255,0.2)] font-bold'
                          : 'text-[var(--forge-text-muted)] hover:text-white'
                      }`}
                    >
                      <div className="font-mono-forge text-[11px] uppercase">{s}</div>
                      <div className="text-[10px] text-[var(--forge-text-faint)] mt-0.5">
                        {rate} Multiplier
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resistance Mode & Friction Matrix */}
            <div className="bg-[#1b1b22] border border-white/5 rounded-2xl p-3.5 space-y-3">
              {/* Resistance Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--forge-secondary-tint)] flex items-center justify-center text-[var(--forge-secondary)]">
                    <Swords className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">Resistance Mode</span>
                      <span className="px-1.5 py-0.2 rounded bg-[var(--forge-secondary-tint)] text-[var(--forge-secondary)] font-mono-forge text-[9px] font-bold">
                        +1.5x Multiplier
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--forge-text-secondary)]">
                      Deliberate high-friction cognitive challenge
                    </p>
                  </div>
                </div>

                <button
                  onClick={onToggleChallenge}
                  className={`relative w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    isChallenge ? 'bg-[var(--forge-secondary)]' : 'bg-[var(--forge-surface-highest)]'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      isChallenge ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Perceived Friction Slider (1 to 5) */}
              <div className="space-y-1.5 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between text-xs font-mono-forge">
                  <span className="text-[var(--forge-text-muted)] uppercase">
                    Perceived Friction
                  </span>
                  <span className="text-[var(--forge-error)] font-bold">
                    {frictionLabels[difficulty]}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => onSetDifficulty(lvl)}
                      className={`h-2.5 rounded-full transition-all ${
                        lvl <= difficulty
                          ? lvl <= 2
                            ? 'bg-[var(--forge-tertiary)]'
                            : lvl <= 4
                            ? 'bg-[var(--forge-primary)]'
                            : 'bg-[#f43f5e] shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                          : 'bg-[var(--forge-surface-highest)]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Pomodoro Seamless Upgrades */}
              <div className="space-y-1.5 pt-1 border-t border-white/5">
                <span className="text-[10px] font-mono-forge uppercase text-[var(--forge-text-muted)]">
                  Mode Upgrades
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onActivatePomodoroMode('POMO_25_5')}
                    className={`py-2 px-2 rounded-xl text-center font-mono-forge text-xs font-bold transition-all ${
                      timerMode === 'POMO_25_5'
                        ? 'bg-[var(--forge-primary)] text-[#1000a9] shadow-md'
                        : 'bg-[#141418] text-[var(--forge-text-secondary)] hover:text-white'
                    }`}
                  >
                    Pomo 25/5
                  </button>
                  <button
                    onClick={() => onActivatePomodoroMode('POMO_50_10')}
                    className={`py-2 px-2 rounded-xl text-center font-mono-forge text-xs font-bold transition-all ${
                      timerMode === 'POMO_50_10'
                        ? 'bg-[var(--forge-secondary)] text-[#490080] shadow-md'
                        : 'bg-[#141418] text-[var(--forge-text-secondary)] hover:text-white'
                    }`}
                  >
                    Pomo 50/10
                  </button>
                  <button
                    onClick={() => onActivatePomodoroMode('FLOW')}
                    className={`py-2 px-2 rounded-xl text-center font-mono-forge text-xs font-bold transition-all ${
                      timerMode === 'FLOW'
                        ? 'bg-[var(--forge-tertiary)] text-[#003640] shadow-md'
                        : 'bg-[#141418] text-[var(--forge-text-secondary)] hover:text-white'
                    }`}
                  >
                    Open Flow
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col space-y-2 pt-1">
              <button
                onClick={() => onSetShowDebrief(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6f00be] hover:brightness-110 text-white font-mono-forge text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(128,131,255,0.45)] active:scale-[0.98] transition-all"
              >
                <LockOpen className="w-4 h-4" />
                <span>
                  {microCleared
                    ? 'COMPLETE & LOG FOCUS SESSION'
                    : 'CLEAR 2-MIN GATEWAY EARLY'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onTogglePlayPause}
                  className="py-2.5 px-3 rounded-xl bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-[var(--forge-text-primary)] font-mono-forge text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Session</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume Session</span>
                    </>
                  )}
                </button>

                {timerMode !== 'FLOW' ? (
                  <button
                    onClick={onTransitionPomodoro}
                    className="py-2.5 px-3 rounded-xl bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-[var(--forge-tertiary)] font-mono-forge text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Skip to Next</span>
                  </button>
                ) : (
                  <button
                    onClick={onAbort}
                    className="py-2.5 px-3 rounded-xl bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-[var(--forge-error)] font-mono-forge text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Abort Gateway</span>
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ───────────────────────────────────────────────────────────
              MODE B: POST-SESSION DEBRIEF FORM
          ─────────────────────────────────────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Session Reflection & Debrief
                </h4>
                <p className="text-xs text-[var(--forge-text-secondary)]">
                  Crystallize tacit breakthroughs for your insights vault.
                </p>
              </div>
              <span className="font-mono-forge text-xs font-bold text-[var(--forge-primary)]">
                +{scorePreview.toFixed(1)} XP
              </span>
            </div>

            {/* Bottleneck Input */}
            <div className="space-y-1.5">
              <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-tertiary)] font-bold">
                Bottleneck Attacked (Optional)
              </label>
              <input
                type="text"
                value={bottleneckNote}
                onChange={(e) => onSetBottleneckNote(e.target.value)}
                placeholder="e.g., Debugged recursive call stack overflow under high depth"
                className="w-full px-3.5 py-3 rounded-xl bg-[#0e0e12] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[var(--forge-primary)]"
              />
            </div>

            {/* Tacit Insight Input */}
            <div className="space-y-1.5">
              <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-primary)] font-bold">
                Tacit Law or Breakthrough Unlocked (Optional)
              </label>
              <textarea
                rows={3}
                value={insightNote}
                onChange={(e) => onSetInsightNote(e.target.value)}
                placeholder="e.g., Memoizing top-down earlier eliminates redundant cache misses..."
                className="w-full px-3.5 py-3 rounded-xl bg-[#0e0e12] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[var(--forge-primary)] resize-none"
              />
            </div>

            {/* Log Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => onFinishSession(true)}
                className="py-3 px-4 rounded-xl bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-white font-mono-forge text-xs font-bold transition-all"
              >
                Log 2m Gateway Only
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => onFinishSession(false)}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6f00be] text-white font-mono-forge text-xs font-bold shadow-[0_0_20px_rgba(128,131,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Log Full Focus ({sessionMins}m)
              </button>
            </div>

            <button
              onClick={() => onSetShowDebrief(false)}
              className="w-full text-center text-xs text-[var(--forge-text-muted)] hover:text-white pt-1 font-mono-forge"
            >
              ← Back to timer view
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
