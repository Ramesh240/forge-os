// src/components/GuardrailControlBar.tsx
'use client';

import React, { useState } from 'react';
import { runMidnightGuardrailAudit } from '@/app/actions';
import { ShieldAlert, ArrowDownCircle, Moon, CheckCircle2 } from 'lucide-react';

interface HabitSummary {
  id: string;
  title: string;
  missedYesterday: boolean;
  isReboundPriority: boolean;
  downscaledDaysRemaining: number;
  currentStreak: number;
}

export default function GuardrailControlBar({ habits }: { habits: HabitSummary[] }) {
  const [isRunning, setIsRunning] = useState(false);
  const [auditToast, setAuditToast] = useState<string | null>(null);

  const reboundHabits = habits.filter(
    (h) => h.isReboundPriority && h.downscaledDaysRemaining === 0
  );
  const downscaledHabits = habits.filter((h) => h.downscaledDaysRemaining > 0);

  const handleSimulateRollover = async () => {
    setIsRunning(true);
    setAuditToast(null);
    try {
      const res = await runMidnightGuardrailAudit(true);
      setAuditToast(
        `Midnight Rollover Simulated: ${res.probationCount} on Rebound Probation (Missed 1x), ${res.downscaledCount} Auto-Downscaled to 2-Min Gateways (Missed 2x).`
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            Midnight Behavioral Guardrail Engine (4th Law Safety Net)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Missing once triggers a <strong>1.25x Rebound Priority</strong> while protecting your streak. Missing twice triggers a <strong>3-Day 2-Minute Gateway Auto-Downscale</strong>.
          </p>
        </div>

        <button
          onClick={handleSimulateRollover}
          disabled={isRunning}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-2 transition cursor-pointer shrink-0"
        >
          <Moon className="w-3.5 h-3.5 text-amber-400" />
          {isRunning ? 'Advancing Clock...' : 'Simulate Midnight Rollover (+24h)'}
        </button>
      </div>

      {auditToast && (
        <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          {auditToast}
        </div>
      )}

      {/* Active Guardrail Alerts */}
      {(reboundHabits.length > 0 || downscaledHabits.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Missed Once: Probation & Rebound Priority */}
          <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Missed Once — Streak on Probation ({reboundHabits.length})
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                +1.25x Vote Recovery Bonus
              </span>
            </div>
            {reboundHabits.length === 0 ? (
              <p className="text-xs text-zinc-500">No habits currently on first-miss probation.</p>
            ) : (
              <ul className="space-y-1 text-xs text-amber-100/90">
                {reboundHabits.map((h) => (
                  <li key={h.id} className="flex justify-between">
                    <span>• {h.title}</span>
                    <span className="font-mono text-amber-400">{h.currentStreak}d chain at risk</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Missed Twice: 3-Day Emergency Auto-Downscale */}
          <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <ArrowDownCircle className="w-4 h-4 text-rose-400" />
                Missed Twice — 3rd Law Auto-Downscaled ({downscaledHabits.length})
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                2-Min Gateway Locked
              </span>
            </div>
            {downscaledHabits.length === 0 ? (
              <p className="text-xs text-zinc-500">No habits in emergency 2-minute downscale mode.</p>
            ) : (
              <ul className="space-y-1 text-xs text-rose-100/90">
                {downscaledHabits.map((h) => (
                  <li key={h.id} className="flex justify-between">
                    <span>• {h.title}</span>
                    <span className="font-mono text-rose-400">
                      {h.downscaledDaysRemaining} recovery sessions left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
