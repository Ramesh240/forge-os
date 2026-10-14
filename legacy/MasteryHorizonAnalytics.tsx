// src/components/MasteryHorizonAnalytics.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  MASTERY_MILESTONES,
  calculateMasteryHorizonAnalytics,
} from '@/lib/forge-engine';
import {
  Brain,
  Swords,
  Gauge,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';

interface IdentityItem {
  id: string;
  title: string;
  totalHoursLogged: number;
}

interface SessionItem {
  id: string;
  habitId: string;
  identityId: string;
  phase: string;
  durationMinutes: number;
  isResistancePractice: boolean;
  frictionRating: number;
  loggedAt: string | Date;
}

interface HabitItem {
  id: string;
  identityId: string;
  title: string;
  identity: { title: string };
}

export default function MasteryHorizonAnalytics({
  identities,
  sessions,
  habits,
}: {
  identities: IdentityItem[];
  sessions: SessionItem[];
  habits: HabitItem[];
}) {
  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('ALL');

  const filteredData = useMemo(() => {
    if (selectedIdentityId === 'ALL') {
      const totalRaw = identities.reduce((acc, i) => acc + i.totalHoursLogged, 0);
      return {
        rawHours: totalRaw,
        sessions,
        habits,
      };
    }

    const idObj = identities.find((i) => i.id === selectedIdentityId);
    return {
      rawHours: idObj?.totalHoursLogged || 0,
      sessions: sessions.filter((s) => s.identityId === selectedIdentityId),
      habits: habits.filter((h) => h.identityId === selectedIdentityId),
    };
  }, [selectedIdentityId, identities, sessions, habits]);

  const stats = useMemo(
    () =>
      calculateMasteryHorizonAnalytics(
        filteredData.rawHours,
        filteredData.sessions,
        filteredData.habits
      ),
    [filteredData]
  );

  return (
    <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
      {/* Header & Identity Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Module 4: 10,000-Hour Mastery Horizon &amp; Resistance Telemetry
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Logarithmic tacit knowledge progression and Robert Greene’s High-Friction Resistance multiplier.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedIdentityId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedIdentityId === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Combined Mastery
          </button>
          {identities.map((idObj) => (
            <button
              key={idObj.id}
              onClick={() => setSelectedIdentityId(idObj.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedIdentityId === idObj.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {idObj.title}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPI Row: Raw vs. Effective Hours & Resistance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <span className="text-xs text-zinc-400 block">Raw Logged Hours</span>
          <span className="text-2xl font-extrabold text-white mt-0.5 block">
            {stats.rawHours} hrs
          </span>
          <span className="text-[11px] text-zinc-500">
            Unweighted clock duration
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-indigo-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-300 font-semibold">
              Effective Deliberate Hours
            </span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-2xl font-extrabold text-indigo-400 mt-0.5 block">
            {stats.effectiveHours} hrs
          </span>
          <span className="text-[11px] text-emerald-400 font-mono">
            {stats.timeCompressionGain >= 0
              ? `+${stats.timeCompressionGain}h gained via Resistance`
              : `${stats.timeCompressionGain}h (heavy passive ratio)`}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Weak-Spot Resistance Ratio</span>
            <Swords className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl font-extrabold text-rose-400 mt-0.5 block">
            {stats.resistanceRatioPct}%
          </span>
          <span className="text-[11px] text-zinc-500">
            Target: &ge; 30% of all sessions
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Mean Cognitive Friction</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-extrabold text-amber-400 mt-0.5 block">
            {stats.avgFriction} / 5.0
          </span>
          <span className="text-[11px] text-zinc-500">
            {stats.hoursToNextMilestone} effective hrs to {stats.nextMilestone.title}
          </span>
        </div>
      </div>

      {/* Logarithmic 10,000-Hour Horizon Curve */}
      <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Logarithmic 10,000-Hour Mastery Continuum (Log10 Scale)
            </span>
            <p className="text-xs text-zinc-400 mt-0.5">
              Maps early neural automaticity (`10h–100h`) on the same visual continuum as deep mastery (`1,000h–10,000h`).
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
            Log10 Horizon Index: {stats.logProgressPct}%
          </span>
        </div>

        {/* Log Progress Bar */}
        <div className="relative pt-2 pb-1">
          <div className="w-full h-3.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-rose-500 transition-all duration-500"
              style={{ width: `${Math.max(3, stats.logProgressPct)}%` }}
            />
          </div>
        </div>

        {/* 5 Milestone Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {MASTERY_MILESTONES.map((m) => {
            const isUnlocked = stats.effectiveHours >= m.hours;
            const isNext = stats.nextMilestone.hours === m.hours && !isUnlocked;

            return (
              <div
                key={m.hours}
                className={`p-3.5 rounded-xl border transition ${
                  isUnlocked
                    ? 'bg-emerald-950/25 border-emerald-500/50'
                    : isNext
                    ? 'bg-indigo-950/30 border-indigo-500/70 ring-1 ring-indigo-500/30'
                    : 'bg-zinc-900/50 border-zinc-800/80 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-white">
                    {m.hours.toLocaleString()} HRS
                  </span>
                  {isUnlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isNext ? (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300">
                      Active Target
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-zinc-100">{m.title}</h4>
                <span className="text-[10px] text-indigo-400 block mb-1.5">
                  {m.phaseName}
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {m.tacitUnlock}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comfort Zone Drift Warning (If Resistance Ratio < 25%) */}
      {stats.comfortZoneWarning && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 space-y-1">
            <strong className="text-amber-300 block">
              Comfort Zone Drift Detected (Resistance Ratio at {stats.resistanceRatioPct}%)
            </strong>
            <p>
              Robert Greene warns that once a skill becomes automatic, the brain naturally seeks the path of least resistance. Toggle <strong>Resistance Practice (1.5x)</strong> during your next session and deliberately attack a weak point to restart neural adaptation.
            </p>
          </div>
        </div>
      )}

      {/* Per-Habit Weak-Spot & Friction Matrix */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Habit-Level Resistance &amp; Friction Telemetry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.habitStats.map((h) => (
            <div
              key={h.habitId}
              className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {h.identityTitle}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">
                    {h.habitTitle}
                  </h4>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                    h.resistancePct >= 30
                      ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                  }`}
                >
                  ⚔️ {h.resistancePct}% Resistance
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>
                    {h.sessionCount} sessions ({h.totalMinutes} mins)
                  </span>
                  <span>Avg Friction: {h.avgFriction} / 5.0</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500"
                    style={{ width: `${Math.max(4, h.resistancePct)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
