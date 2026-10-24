'use client';

import React from 'react';
import {
  X,
  Play,
  Pause,
  FastForward,
  Lock,
  ExternalLink,
  SunMedium,
  Swords,
} from 'lucide-react';
import { SerializedHabit } from '@/components/ForgeAppShell';

export interface FocusTimerModalProps {
  activeHabit: SerializedHabit;
  microCleared: boolean;
  pomoCyclesCompleted: number;
  isWakeLockActive: boolean;
  timerMode: 'FLOW' | 'POMO_25_5' | 'POMO_50_10';
  pomoPhase: 'WORK' | 'BREAK';
  userIsPro: boolean;
  secondsElapsed: number;
  pomoSecondsLeft: number;
  sessionMins: number;
  isRunning: boolean;
  showDebrief: boolean;
  isChallenge: boolean;
  difficulty: number;
  liveScorePreview: number;
  bottleneckNote: string;
  insightNote: string;
  isSubmitting: boolean;
  formatClock: (seconds: number) => string;
  onClose: () => void;
  onActivatePomodoroMode: (mode: 'FLOW' | 'POMO_25_5' | 'POMO_50_10') => void;
  onOpenProModal: () => void;
  onToggleRunning: () => void;
  onFastForwardMicroStart: () => void;
  onTransitionPomodoroPhase: () => void;
  onOpenDebrief: () => void;
  onToggleChallenge: () => void;
  onChangeDifficulty: (diff: number) => void;
  onChangeBottleneck: (val: string) => void;
  onChangeInsight: (val: string) => void;
  onFinishSession: (microOnly: boolean) => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  activeHabit,
  microCleared,
  pomoCyclesCompleted,
  isWakeLockActive,
  timerMode,
  pomoPhase,
  userIsPro,
  secondsElapsed,
  pomoSecondsLeft,
  sessionMins,
  isRunning,
  showDebrief,
  isChallenge,
  difficulty,
  liveScorePreview,
  bottleneckNote,
  insightNote,
  isSubmitting,
  formatClock,
  onClose,
  onActivatePomodoroMode,
  onOpenProModal,
  onToggleRunning,
  onFastForwardMicroStart,
  onTransitionPomodoroPhase,
  onOpenDebrief,
  onToggleChallenge,
  onChangeDifficulty,
  onChangeBottleneck,
  onChangeInsight,
  onFinishSession,
}) => {
  return (
    <div className="fixed inset-0 z-50 theme-surface p-4 sm:p-8 flex flex-col justify-between overflow-y-auto">
      {/* Top Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase theme-muted">
              {activeHabit.identityTitle}
            </span>
            {pomoCyclesCompleted > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                🍅 {pomoCyclesCompleted} {pomoCyclesCompleted === 1 ? 'Cycle' : 'Cycles'} Done
              </span>
            )}
            {isWakeLockActive && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm"
                title="Screen wake lock is active — display will remain on during your focus session"
              >
                <SunMedium className="w-3 h-3 animate-pulse text-amber-400" />
                <span>Screen Awake</span>
              </span>
            )}
          </div>
          <h3 className="text-base font-bold theme-text mt-0.5">
            {microCleared ? activeHabit.title : activeHabit.gatewayVersion}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl glass-panel theme-subtext cursor-pointer hover:opacity-80"
          aria-label="Close session"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!showDebrief ? (
        <div className="max-w-xl w-full mx-auto my-auto space-y-5 py-6 text-center">
          {/* Pomodoro Extension Bar (Appears once 2-Min Micro-Start clears, or anytime) */}
          {microCleared && (
            <div className="p-1.5 rounded-2xl glass-nav inline-flex flex-wrap items-center justify-center gap-1.5">
              {[
                { id: 'FLOW' as const, label: '∞ Open Flow', locked: false },
                { id: 'POMO_25_5' as const, label: '🍅 Pomodoro 25m / 5m', locked: !userIsPro },
                { id: 'POMO_50_10' as const, label: '⚡ Deep 50m / 10m', locked: !userIsPro },
              ].map((m) => {
                const active = timerMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (m.locked) {
                        onOpenProModal();
                        return;
                      }
                      onActivatePomodoroMode(m.id);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      active ? 'glass-tab-active' : 'theme-subtext hover:opacity-80'
                    }`}
                  >
                    <span>{m.label}</span>
                    {m.locked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Temptation Bundle Reward Unlock (Surfaces once 2m gateway clears) */}
          {microCleared && (activeHabit.temptationBundleUrl || activeHabit.temptationLabel) && (
            <div
              className="p-3.5 sm:p-4 rounded-2xl border border-amber-500/35 flex flex-col sm:flex-row items-center justify-between gap-3 text-left animate-in fade-in zoom-in-95 duration-200 shadow-lg"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.09)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0 text-base">
                  🎁
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                    Temptation Bundle Reward Unlocked!
                  </h4>
                  <p className="text-[11px] text-zinc-300 mt-0.5">
                    {activeHabit.temptationLabel
                      ? `Enjoy "${activeHabit.temptationLabel}" guilt-free during Open Flow.`
                      : 'Guilt-free entertainment unlocked for this session.'}
                  </p>
                </div>
              </div>

              {activeHabit.temptationBundleUrl && (
                <a
                  href={activeHabit.temptationBundleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <span>Open {activeHabit.temptationLabel || 'Reward'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Main Clock Card */}
          <div
            className={`glass-nav p-8 rounded-3xl space-y-5 transition-all ${
              timerMode !== 'FLOW' && pomoPhase === 'BREAK'
                ? 'ring-2 ring-emerald-500/50'
                : ''
            }`}
          >
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full inline-block ${
                timerMode !== 'FLOW' && pomoPhase === 'BREAK'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : microCleared
                  ? 'glass-panel theme-text'
                  : 'glass-panel text-indigo-400'
              }`}
            >
              {timerMode === 'FLOW'
                ? microCleared
                ? '✓ 2m Cleared — Open Flow Active (Pick Pomodoro Above)'
                : 'Stage 1: 2-Minute Micro-Start'
                : pomoPhase === 'WORK'
                ? `🍅 Cycle #${pomoCyclesCompleted + 1} Focus Block`
                : '☕ Rest & Recharge Break (Focus Paused)'}
            </span>

            {/* Clock Readout */}
            <div className="text-6xl sm:text-7xl font-mono font-black theme-text">
              {timerMode === 'FLOW'
                ? formatClock(secondsElapsed)
                : formatClock(pomoSecondsLeft)}
            </div>

            {timerMode !== 'FLOW' && (
              <p className="text-xs font-mono theme-muted">
                Total Net Focus Time Logged: {formatClock(secondsElapsed)} ({sessionMins}m)
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={onToggleRunning}
                className="px-5 py-2.5 rounded-xl glass-panel theme-text text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? 'Pause' : 'Resume'}
              </button>

              {/* Fast-Forward / Skip Phase Helpers */}
              {!microCleared && timerMode === 'FLOW' && (
                <button
                  type="button"
                  onClick={onFastForwardMicroStart}
                  className="px-4 py-2.5 rounded-xl glass-panel theme-subtext text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <FastForward className="w-3.5 h-3.5" /> +30s
                </button>
              )}

              {timerMode !== 'FLOW' && (
                <button
                  type="button"
                  onClick={onTransitionPomodoroPhase}
                  className="px-4 py-2.5 rounded-xl glass-panel theme-subtext text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <FastForward className="w-3.5 h-3.5 text-emerald-500" />
                  {pomoPhase === 'WORK' ? 'Start Break Now' : 'Skip Break → Next Cycle'}
                </button>
              )}

              <button
                type="button"
                onClick={onOpenDebrief}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
                style={{ background: 'var(--accent-primary)' }}
              >
                Finish &amp; Bank (+{liveScorePreview} pts)
              </button>
            </div>
          </div>

          {/* Challenge & Difficulty Controls */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onToggleChallenge}
              className={`p-3.5 rounded-2xl glass-panel text-xs font-bold flex items-center justify-between cursor-pointer ${
                isChallenge ? 'ring-2 ring-rose-500 text-rose-500' : 'theme-subtext'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Swords className="w-4 h-4" /> Challenge
              </span>
              <span>{isChallenge ? '1.5x ON' : 'OFF'}</span>
            </button>

            <div className="p-3.5 rounded-2xl glass-panel flex items-center justify-between text-xs">
              <span className="theme-subtext font-bold">Difficulty</span>
              <input
                type="range"
                min={1}
                max={5}
                value={difficulty}
                onChange={(e) => onChangeDifficulty(Number(e.target.value))}
                className="w-24 accent-amber-500"
              />
              <span className="font-mono font-bold theme-text">{difficulty}/5</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md w-full mx-auto my-auto glass-nav rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold theme-text">Session Summary</h3>
            {pomoCyclesCompleted > 0 && (
              <span className="text-xs font-bold text-emerald-500">
                🍅 {pomoCyclesCompleted} Pomodoro Cycles
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="Challenge or bottleneck tackled (Optional)"
            value={bottleneckNote}
            onChange={(e) => onChangeBottleneck(e.target.value)}
            className="w-full theme-input rounded-xl p-3 text-sm"
          />
          <textarea
            rows={3}
            placeholder="Key insight or takeaway (Optional)"
            value={insightNote}
            onChange={(e) => onChangeInsight(e.target.value)}
            className="w-full theme-input rounded-xl p-3 text-sm"
          />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onFinishSession(true)}
              className="py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
            >
              Log 2m Save
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onFinishSession(false)}
              className="py-3 rounded-xl text-white font-bold text-xs cursor-pointer"
              style={{ background: 'var(--accent-primary)' }}
            >
              Log Focus ({sessionMins}m)
            </button>
          </div>
        </div>
      )}
      <div />
    </div>
  );
};
