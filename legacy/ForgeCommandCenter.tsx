// src/components/ForgeCommandCenter.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { logForgeSession } from '@/app/actions';
import { MasteryPhase } from '@/lib/forge-engine';
import DeepWorkFocusHUD from '@/components/DeepWorkFocusHUD';
import {
  Flame,
  ShieldAlert,
  Lock,
  Unlock,
  ArrowRight,
  Zap,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';

type HabitWithRelations = {
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

export default function ForgeCommandCenter({ habits }: { habits: HabitWithRelations[] }) {
  const [activeHabit, setActiveHabit] = useState<HabitWithRelations | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocusHUDOpen, setIsFocusHUDOpen] = useState(false);
  const [phase, setPhase] = useState<MasteryPhase>('PRACTICE');
  const [isResistance, setIsResistance] = useState(false);
  const [frictionRating, setFrictionRating] = useState(3);
  const [lastVoteResult, setLastVoteResult] = useState<{
    votes: number;
    nextHabitTitle?: string;
  } | null>(null);

  const GATEWAY_SECONDS = 120;
  const gatewayCompleted = secondsElapsed >= GATEWAY_SECONDS;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => setSecondsElapsed((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const startGateway = (habit: HabitWithRelations, openFullHUD = true) => {
    setActiveHabit(habit);
    setPhase(habit.defaultPhase as MasteryPhase);
    setSecondsElapsed(0);
    setIsResistance(false);
    setFrictionRating(3);
    setIsRunning(true);
    setIsFocusHUDOpen(openFullHUD);
    setLastVoteResult(null);
  };

  const handleCommitSession = async (payload: {
    gatewayOnly: boolean;
    bottleneckAttacked: string;
    tacitInsight: string;
  }) => {
    if (!activeHabit) return;
    setIsRunning(false);
    setIsFocusHUDOpen(false);

    const durationMins = payload.gatewayOnly
      ? 2
      : Math.max(2, Math.round(secondsElapsed / 60));

    const res = await logForgeSession({
      habitId: activeHabit.id,
      identityId: activeHabit.identityId,
      phase,
      durationMinutes: durationMins,
      completedGatewayOnly: payload.gatewayOnly,
      isResistancePractice: isResistance,
      frictionRating,
      bottleneckAttacked: payload.bottleneckAttacked,
      tacitInsight: payload.tacitInsight,
    });

    const nextInStack = activeHabit.nextStackedHabit;
    setLastVoteResult({ votes: res.votesEarned, nextHabitTitle: nextInStack?.title });

    if (nextInStack) {
      const foundNext = habits.find((h) => h.id === nextInStack.id) || null;
      setActiveHabit(foundNext);
      setSecondsElapsed(0);
    } else {
      setActiveHabit(null);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      {isFocusHUDOpen && activeHabit && (
        <DeepWorkFocusHUD
          habit={activeHabit}
          secondsElapsed={secondsElapsed}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          phase={phase}
          setPhase={setPhase}
          isResistance={isResistance}
          setIsResistance={setIsResistance}
          frictionRating={frictionRating}
          setFrictionRating={setFrictionRating}
          onCloseHUD={() => setIsFocusHUDOpen(false)}
          onCommitSession={handleCommitSession}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Habit Stack & Rebound Queue */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Behavioral Habit Matrix (4 Laws)
          </h2>

          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`p-5 rounded-xl border transition-all ${
                habit.isReboundPriority
                  ? 'bg-amber-950/30 border-amber-500/60'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {habit.identity.title}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {habit.defaultPhase}
                    </span>
                    {habit.isReboundPriority && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <ShieldAlert className="w-3.5 h-3.5" /> NEVER MISS TWICE REBOUND
                      </span>
                    )}
                    {habit.downscaledDaysRemaining > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        3RD LAW AUTO-DOWNSCALED ({habit.downscaledDaysRemaining}d left)
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-white">{habit.title}</h3>
                  <p className="text-sm text-emerald-400 mt-1">
                    3rd Law Gateway (2-Min Rule):{' '}
                    <span className="font-medium">{habit.gatewayVersion}</span>
                  </p>

                  {habit.nextStackedHabit && (
                    <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        <strong>1st Law Stack:</strong> After this, trigger{' '}
                        <span className="text-zinc-200 underline">
                          {habit.nextStackedHabit.title}
                        </span>
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-orange-400 font-bold text-sm">
                    <Flame className="w-4 h-4 fill-orange-400" /> {habit.currentStreak}d Chain
                  </div>
                  <button
                    onClick={() => startGateway(habit, true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Launch Focus HUD
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Docked Mini Console */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Docked Mastery Console</h2>
            {activeHabit && (
              <button
                onClick={() => setIsFocusHUDOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-indigo-600/30 border border-indigo-500 text-indigo-300 hover:bg-indigo-600/50 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" /> Full HUD
              </button>
            )}
          </div>

          {lastVoteResult && (
            <div className="mb-4 p-4 rounded-lg bg-emerald-950/60 border border-emerald-600/50 text-emerald-200 text-sm">
              <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" /> +{lastVoteResult.votes} Identity Votes Cast!
              </div>
              {lastVoteResult.nextHabitTitle && (
                <p className="text-xs text-emerald-300">
                  Habit Stack Triggered: Ready for <strong>{lastVoteResult.nextHabitTitle}</strong>
                </p>
              )}
            </div>
          )}

          {!activeHabit ? (
            <p className="text-sm text-zinc-400">
              Click <strong>Launch Focus HUD</strong> on any habit to enter full-screen Deep-Work Mode with keyboard telemetry and post-session tacit journaling.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-xs uppercase text-indigo-400 font-bold">
                  {gatewayCompleted ? 'Phase 2: Deep Flow' : 'Phase 1: 2-Minute Gateway'}
                </span>
                <h3 className="text-md font-bold text-white mt-1">
                  {gatewayCompleted ? activeHabit.title : activeHabit.gatewayVersion}
                </h3>
              </div>

              <div className="py-5 text-center rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-4xl font-mono font-bold text-white">
                  {formatTime(secondsElapsed)}
                </div>
              </div>

              <button
                onClick={() => setIsFocusHUDOpen(true)}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer"
              >
                Open Full-Screen HUD &amp; Tacit Debrief
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
