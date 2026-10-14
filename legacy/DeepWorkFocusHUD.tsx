// src/components/DeepWorkFocusHUD.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { calculateIdentityVotes, MasteryPhase } from '@/lib/forge-engine';
import {
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Swords,
  Lock,
  Unlock,
  Brain,
  Keyboard,
  Award,
  Flame,
  ArrowRight,
  Gauge,
} from 'lucide-react';

export interface ActiveHabitHUDProps {
  habit: {
    id: string;
    identityId: string;
    title: string;
    gatewayVersion: string;
    defaultPhase: string;
    temptationBundleUrl: string | null;
    temptationLabel: string | null;
    currentStreak: number;
    isReboundPriority: boolean;
    downscaledDaysRemaining: number;
    nextStackedHabit?: { id: string; title: string } | null;
    identity: { title: string };
  };
  secondsElapsed: number;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  phase: MasteryPhase;
  setPhase: React.Dispatch<React.SetStateAction<MasteryPhase>>;
  isResistance: boolean;
  setIsResistance: React.Dispatch<React.SetStateAction<boolean>>;
  frictionRating: number;
  setFrictionRating: React.Dispatch<React.SetStateAction<number>>;
  onCloseHUD: () => void;
  onCommitSession: (payload: {
    gatewayOnly: boolean;
    bottleneckAttacked: string;
    tacitInsight: string;
  }) => Promise<void>;
}

const FRICTION_LABELS: Record<number, { label: string; desc: string }> = {
  1: { label: '1 — Effortless Automaticity', desc: 'Zero cognitive load; pure routine execution.' },
  2: { label: '2 — Light Warmup', desc: 'Familiar territory; low mental resistance.' },
  3: { label: '3 — Deliberate Engagement', desc: 'Focused practice at the edge of current competence.' },
  4: { label: '4 — High Cognitive Strain', desc: 'Tackling unfamiliar abstractions or complex debugging.' },
  5: { label: '5 — Maximum Crucible Friction', desc: 'Direct attack on your hardest bottleneck; intense neural adaptation.' },
};

export default function DeepWorkFocusHUD({
  habit,
  secondsElapsed,
  isRunning,
  setIsRunning,
  phase,
  setPhase,
  isResistance,
  setIsResistance,
  frictionRating,
  setFrictionRating,
  onCloseHUD,
  onCommitSession,
}: ActiveHabitHUDProps) {
  const [showDebrief, setShowDebrief] = useState(false);
  const [gatewayOnlyCommit, setGatewayOnlyCommit] = useState(false);
  const [bottleneckAttacked, setBottleneckAttacked] = useState('');
  const [tacitInsight, setTacitInsight] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const GATEWAY_SECONDS = 120;
  const gatewayCompleted = secondsElapsed >= GATEWAY_SECONDS;
  const gatewayProgressPct = Math.min(100, Math.round((secondsElapsed / GATEWAY_SECONDS) * 100));

  const durationMinutes = gatewayOnlyCommit
    ? 2
    : Math.max(2, Math.round(secondsElapsed / 60));

  // Real-time preview of Identity Votes based on current HUD toggles
  const liveVotesPreview = useMemo(() => {
    return calculateIdentityVotes({
      phase,
      isResistancePractice: isResistance,
      isReboundRecovery: habit.isReboundPriority,
      durationMinutes,
      completedGatewayOnly: !gatewayCompleted,
    });
  }, [phase, isResistance, habit.isReboundPriority, durationMinutes, gatewayCompleted]);

  // Global Keyboard Shortcuts inside Focus HUD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'Escape') {
        if (showDebrief) {
          setShowDebrief(false);
        } else {
          onCloseHUD();
        }
        return;
      }

      if (isTyping) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsResistance((prev) => {
          const next = !prev;
          if (next && frictionRating < 4) setFrictionRating(4);
          return next;
        });
      } else if (e.key === '1') {
        setPhase('PASSIVE');
      } else if (e.key === '2') {
        setPhase('PRACTICE');
      } else if (e.key === '3') {
        setPhase('ACTIVE');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFrictionRating((f) => Math.min(5, f + 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFrictionRating((f) => Math.max(1, f - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsRunning(false);
        setGatewayOnlyCommit(!gatewayCompleted || habit.downscaledDaysRemaining > 0);
        setShowDebrief(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showDebrief,
    gatewayCompleted,
    habit.downscaledDaysRemaining,
    frictionRating,
    onCloseHUD,
    setIsRunning,
    setIsResistance,
    setPhase,
    setFrictionRating,
  ]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const rem = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${rem}`;
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onCommitSession({
        gatewayOnly: gatewayOnlyCommit,
        bottleneckAttacked,
        tacitInsight,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/98 backdrop-blur-xl text-zinc-100 flex flex-col justify-between p-6 md:p-10 overflow-y-auto">
      {/* Top Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            {habit.identity.title}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-orange-400">
            <Flame className="w-4 h-4 fill-orange-400" /> {habit.currentStreak}d Chain
          </span>
          {habit.isReboundPriority && (
            <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              +1.25x Rebound Bonus Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-300">Live Vote Value:</span>
            <span className="text-sm font-extrabold text-emerald-400">
              +{liveVotesPreview} Votes
            </span>
          </div>

          <button
            onClick={onCloseHUD}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" /> Dock HUD (Esc)
          </button>
        </div>
      </div>

      {/* Center Stage: Either Live Cockpit OR Post-Session Tacit Debrief */}
      {!showDebrief ? (
        <div className="my-auto max-w-4xl w-full mx-auto space-y-8 py-6">
          {/* Phase Indicator & Habit Prompt */}
          <div className="text-center space-y-2">
            <span
              className={`inline-block text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                gatewayCompleted
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
              }`}
            >
              {gatewayCompleted
                ? 'Stage 2: Deep Mastery Flow Unlocked'
                : `Stage 1: 2-Minute Gateway (${gatewayProgressPct}%)`}
            </span>

            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {gatewayCompleted ? habit.title : habit.gatewayVersion}
            </h1>

            {!gatewayCompleted && (
              <p className="text-xs text-zinc-400">
                Full habit unlocked after 120s: <span className="text-zinc-300">{habit.title}</span>
              </p>
            )}
          </div>

          {/* Giant Clock & Play/Pause Controls */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="text-7xl md:text-8xl font-mono font-black tracking-tighter text-white">
              {formatTime(secondsElapsed)}
            </div>

            {/* 120-Second Gateway Progress Bar */}
            <div className="max-w-md mx-auto space-y-1.5">
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    gatewayCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${gatewayProgressPct}%` }}
                />
              </div>
              <p className="text-xs text-zinc-400">
                {gatewayCompleted
                  ? '2-Minute Gateway threshold cleared! Every additional 10m adds +0.1 base vote.'
                  : `${GATEWAY_SECONDS - secondsElapsed} seconds left to cast minimum viable Identity Vote`}
              </p>
            </div>

            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => setIsRunning((r) => !r)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause (Space)
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Resume (Space)
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  setGatewayOnlyCommit(!gatewayCompleted || habit.downscaledDaysRemaining > 0);
                  setShowDebrief(true);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                Proceed to Tacit Debrief (Enter) <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Telemetry Controls: Phase, Resistance, Live Friction Slider */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Card: Greene's Phase & Resistance Toggle */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Apprenticeship Mode (Keys 1 / 2 / 3)
                </span>
                <span className="text-xs font-mono text-indigo-400">{phase}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['PASSIVE', 'PRACTICE', 'ACTIVE'] as MasteryPhase[]).map((p, idx) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPhase(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      phase === p
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    [{idx + 1}] {p}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = !isResistance;
                  setIsResistance(next);
                  if (next && frictionRating < 4) setFrictionRating(4);
                }}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                  isResistance
                    ? 'bg-rose-950/50 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="flex items-center gap-2 text-xs font-bold">
                  <Swords className="w-4 h-4 text-rose-400" />
                  Resistance Practice — Attacking Weak Spot (Key R)
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                  {isResistance ? '1.5x ACTIVE' : '1.0x OFF'}
                </span>
              </button>
            </div>

            {/* Right Card: Live Cognitive Friction Slider (1-5) */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  Live Cognitive Friction (Up / Down Arrows)
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  Level {frictionRating} / 5
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={frictionRating}
                onChange={(e) => setFrictionRating(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="text-xs font-bold text-amber-300">
                  {FRICTION_LABELS[frictionRating].label}
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {FRICTION_LABELS[frictionRating].desc}
                </p>
              </div>
            </div>
          </div>

          {/* Temptation Bundle Status Bar */}
          {habit.temptationBundleUrl && (
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-zinc-400">2nd Law Temptation Bundle: </span>
                <strong className="text-white">{habit.temptationLabel}</strong>
              </div>
              {gatewayCompleted ? (
                <a
                  href={habit.temptationBundleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  <Unlock className="w-3.5 h-3.5" /> Launch Unlocked Reward
                </a>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                  <Lock className="w-3.5 h-3.5" /> Unlocks in {GATEWAY_SECONDS - secondsElapsed}s
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        /* STAGE 3: POST-SESSION TACIT KNOWLEDGE DEBRIEF */
        <form
          onSubmit={handleFinalSubmit}
          className="my-auto max-w-2xl w-full mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl"
        >
          <div className="border-b border-zinc-800 pb-4">
            <span className="text-xs font-mono uppercase text-emerald-400 font-bold">
              Stage 3: Tacit Knowledge Consolidation
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
              <Brain className="w-6 h-6 text-indigo-400" />
              Post-Session Mastery Debrief
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Lock in what you learned before banking your <strong>+{liveVotesPreview} Identity Votes</strong>.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                1. Specific Bottleneck or Weak Spot Attacked (Optional)
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g., Struggled with recursive memoization state transitions / complex SQL PARTITION BY"
                value={bottleneckAttacked}
                onChange={(e) => setBottleneckAttacked(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                2. Tacit Insight / Mental Model Shift (Saved to Your Knowledge Vault)
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Always write the base-case invariant and state dimensions before coding the transition loop."
                value={tacitInsight}
                onChange={(e) => setTacitInsight(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder-zinc-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <span className="text-zinc-400">Session Type to Log:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGatewayOnlyCommit(true)}
                  className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                    gatewayOnlyCommit
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  2-Min Gateway Save
                </button>
                {habit.downscaledDaysRemaining === 0 && (
                  <button
                    type="button"
                    onClick={() => setGatewayOnlyCommit(false)}
                    className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                      !gatewayOnlyCommit
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    Full Flow ({durationMinutes} mins)
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setShowDebrief(false)}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 cursor-pointer"
            >
              ← Back to Timer
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              {isSaving
                ? 'Logging to Mastery Ledger...'
                : `Commit Session & Cast +${liveVotesPreview} Votes`}
            </button>
          </div>
        </form>
      )}

      {/* Bottom Keyboard Shortcuts Legend */}
      <div className="border-t border-zinc-800/80 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5 font-semibold text-zinc-400">
          <Keyboard className="w-4 h-4 text-indigo-400" /> Keyboard HUD Hotkeys:
        </span>
        <div className="flex flex-wrap gap-3 font-mono text-[11px]">
          <span>[Space] Play/Pause</span>
          <span>[R] Toggle 1.5x Resistance</span>
          <span>[1/2/3] Switch Phase</span>
          <span>[↑/↓] Friction 1-5</span>
          <span>[Enter] Tacit Debrief</span>
          <span>[Esc] Dock HUD</span>
        </div>
      </div>
    </div>
  );
}
