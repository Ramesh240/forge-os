// src/components/VisualChainLedger.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { buildVisualChainLedger, LedgerDay } from '@/lib/forge-engine';
import { seedSampleChainHistory } from '@/app/actions';
import {
  Calendar,
  Flame,
  ShieldCheck,
  Zap,
  Swords,
  Sparkles,
  Link2,
  Clock,
  Award,
} from 'lucide-react';

interface SessionItem {
  id: string;
  identityId: string;
  habitId: string;
  phase: string;
  durationMinutes: number;
  completedGatewayOnly: boolean;
  isResistancePractice: boolean;
  votesEarned: number;
  loggedAt: string | Date;
}

interface IdentityOption {
  id: string;
  title: string;
}

export default function VisualChainLedger({
  sessions,
  identities,
}: {
  sessions: SessionItem[];
  identities: IdentityOption[];
}) {
  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<LedgerDay | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const filteredSessions = useMemo(() => {
    if (selectedIdentityId === 'ALL') return sessions;
    return sessions.filter((s) => s.identityId === selectedIdentityId);
  }, [sessions, selectedIdentityId]);

  const ledger = useMemo(
    () => buildVisualChainLedger(filteredSessions, 84),
    [filteredSessions]
  );

  const last14Days = ledger.days.slice(-14);
  const activeInspectorDay = selectedDay || ledger.days[ledger.days.length - 1];

  // Group the 84 days into 12 columns of 7 days for the matrix grid
  const weeks: LedgerDay[][] = [];
  for (let i = 0; i < ledger.days.length; i += 7) {
    weeks.push(ledger.days.slice(i, i + 7));
  }

  const handleSeedHistory = async () => {
    setIsSeeding(true);
    await seedSampleChainHistory();
    setIsSeeding(false);
  };

  const getCellStyles = (status: LedgerDay['status'], isSelected: boolean) => {
    const ring = isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : '';
    switch (status) {
      case 'HIGH_RESISTANCE':
        // High-Friction Weak-Spot Attack (Supercharged Rose/Crimson)
        return `bg-rose-500 border border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.45)] text-white ${ring}`;
      case 'STANDARD_FLOW':
        // Standard Deep Practice (Solid Emerald)
        return `bg-emerald-500 border border-emerald-400 text-zinc-950 ${ring}`;
      case 'GATEWAY_SAVE':
        // 2-Minute Gateway Save (Hollow Emerald Outline)
        return `bg-emerald-950/40 border-2 border-emerald-400 text-emerald-300 ${ring}`;
      case 'BRIDGED_MISS':
        // "Never Miss Twice" Bridged Gap (Amber Dashed Bridge)
        return `bg-amber-950/30 border border-dashed border-amber-500/70 text-amber-400 ${ring}`;
      default:
        return `bg-zinc-900 border border-zinc-800 text-zinc-600 hover:border-zinc-700 ${ring}`;
    }
  };

  return (
    <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
      {/* Top Header & Identity Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            4th Law: Seinfeld Visual Chain &amp; Resilience Ledger
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Tracks 2-Minute Gateway saves, High-Resistance weak-spot attacks, and &ldquo;Never Miss Twice&rdquo; bridges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedIdentityId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedIdentityId === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Identities
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

          {sessions.length < 5 && (
            <button
              onClick={handleSeedHistory}
              disabled={isSeeding}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSeeding ? 'Generating...' : 'Simulate 28d Chain'}
            </button>
          )}
        </div>
      </div>

      {/* Chain Telemetry KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">Strict Daily Chain</span>
            <span className="text-2xl font-extrabold text-white">{ledger.strictStreak} Days</span>
          </div>
          <Flame className="w-7 h-7 text-orange-400" />
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-300/90 block">
              Resilient Chain (Never Miss 2x)
            </span>
            <span className="text-2xl font-extrabold text-amber-400">
              {ledger.resilientStreak} Active Days
            </span>
          </div>
          <Link2 className="w-7 h-7 text-amber-400" />
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">2-Min Gateway Saves</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {ledger.totalGatewaySaves} Saves
            </span>
          </div>
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">High-Resistance Days</span>
            <span className="text-2xl font-extrabold text-rose-400">
              {ledger.totalResistanceDays} Days
            </span>
          </div>
          <Swords className="w-7 h-7 text-rose-400" />
        </div>
      </div>

      {/* 14-Day Tactical Seinfeld Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Last 14 Days — Tactical Chain Continuity
          </h3>
          <span className="text-xs text-zinc-500">Click any cell to inspect telemetry</span>
        </div>

        <div className="grid grid-cols-7 md:grid-cols-14 gap-2">
          {last14Days.map((day) => {
            const isSelected = activeInspectorDay?.dateStr === day.dateStr;
            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDay(day)}
                className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer ${getCellStyles(
                  day.status,
                  isSelected
                )}`}
              >
                <span className="text-[10px] font-mono opacity-80">
                  {day.label.split(' ')[1]}
                </span>
                <div className="h-5 flex items-center justify-center font-bold text-xs">
                  {day.status === 'HIGH_RESISTANCE' && '⚔️'}
                  {day.status === 'STANDARD_FLOW' && '✓'}
                  {day.status === 'GATEWAY_SAVE' && '2m'}
                  {day.status === 'BRIDGED_MISS' && '⇄'}
                  {day.status === 'NONE' && '·'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Split: 84-Day Matrix + Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* 12-Week Seinfeld Matrix */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              84-Day Mastery Continuum (12 Weeks)
            </span>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-950 border-2 border-emerald-400 inline-block" />
                2m Gateway Save
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                Flow Session
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                Resistance Practice
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-dashed border-amber-500 inline-block" />
                Bridged Miss
              </span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 pt-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-2">
                {week.map((day) => {
                  const isSelected = activeInspectorDay?.dateStr === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => setSelectedDay(day)}
                      title={`${day.label}: ${day.status} (${day.totalVotes} votes)`}
                      className={`h-6 w-full rounded-md transition cursor-pointer ${getCellStyles(
                        day.status,
                        isSelected
                      )}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Telemetry Inspector */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          {activeInspectorDay && (
            <>
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-xs text-zinc-400 font-mono">
                      {activeInspectorDay.dateStr}
                    </span>
                    <h4 className="text-lg font-bold text-white">
                      {activeInspectorDay.label} Telemetry
                    </h4>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-zinc-800 text-zinc-200">
                    {activeInspectorDay.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-400" /> Identity Votes
                    </span>
                    <span className="text-lg font-bold text-white">
                      +{activeInspectorDay.totalVotes}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> Deep Time
                    </span>
                    <span className="text-lg font-bold text-white">
                      {activeInspectorDay.totalMinutes} mins
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-zinc-300">
                  {activeInspectorDay.status === 'HIGH_RESISTANCE' && (
                    <p className="p-2.5 rounded bg-rose-950/40 border border-rose-500/40 text-rose-200">
                      <strong>⚔️ Resistance Multiplier Active:</strong> You deliberately attacked a high-friction weak point on this day (1.5x Identity Votes).
                    </p>
                  )}
                  {activeInspectorDay.status === 'GATEWAY_SAVE' && (
                    <p className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
                      <strong>🛡️ 3rd Law Gateway Save:</strong> You used the 2-Minute Rule to show up and keep the identity alive on a tough day.
                    </p>
                  )}
                  {activeInspectorDay.status === 'BRIDGED_MISS' && (
                    <p className="p-2.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-200">
                      <strong>⇄ Never Miss Twice Fulfilled:</strong> You missed this day, but immediately rebounded the very next day to protect your Resilient Chain!
                    </p>
                  )}
                  {activeInspectorDay.status === 'NONE' && (
                    <p className="text-zinc-500 italic">
                      No sessions logged on this date. Cast a 2-minute gateway vote today to extend your chain.
                    </p>
                  )}
                </div>
              </div>

              {activeInspectorDay.phases.length > 0 && (
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Phases touched:
                  </span>
                  <div className="flex gap-1.5">
                    {activeInspectorDay.phases.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-[10px]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
