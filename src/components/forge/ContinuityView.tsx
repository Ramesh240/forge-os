// src/components/forge/ContinuityView.tsx
'use client';

import React from 'react';
import {
  Calendar as CalendarIcon,
  Flame,
  ShieldAlert,
  Sparkles,
  Swords,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { ContinuityDay, AnalyticsSummary } from '@/lib/forge-engine';
import { SerializedSession } from '../ForgeAppShell';

interface ContinuityViewProps {
  analytics: AnalyticsSummary;
  sessions: SerializedSession[];
  inspectedDay: ContinuityDay | null;
  onSelectDay: (day: ContinuityDay) => void;
}

export function ContinuityView({
  analytics,
  sessions,
  inspectedDay,
  onSelectDay,
}: ContinuityViewProps) {
  const activeDay =
    inspectedDay || analytics.daysGrid[analytics.daysGrid.length - 1];

  // Group 84 days into 12 weeks of 7 days (Monday - Sunday)
  const weeks: ContinuityDay[][] = [];
  const days = analytics.daysGrid;
  for (let i = 0; i < 12; i++) {
    weeks.push(days.slice(i * 7, (i + 1) * 7));
  }

  // Get sessions that happened on the activeDay
  const daySessions = sessions.filter(
    (s) => s.loggedAt.split('T')[0] === activeDay?.dateStr
  );

  const getCellColorClass = (day: ContinuityDay) => {
    if (!day || day.totalMinutes === 0) return 'bg-[#24242e] hover:bg-[#353438]';
    if (day.challengeCount > 0)
      return 'bg-[#f43f5e] shadow-[0_0_8px_rgba(244,63,94,0.6)] text-white';
    if (day.totalMinutes >= 60)
      return 'bg-[#c0c1ff] shadow-[0_0_10px_rgba(192,193,255,0.7)] text-[#1000a9]';
    if (day.totalMinutes >= 35) return 'bg-[#8083ff]/80 text-white';
    if (day.totalMinutes >= 15) return 'bg-[#8083ff]/50 text-white';
    return 'bg-[#8083ff]/25 text-white';
  };

  const activeDaysCount = analytics.daysGrid.filter((d) => d.totalMinutes > 0).length;

  return (
    <div className="flex flex-col space-y-6 pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & CONTINUITY STATS
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[var(--forge-primary)] shadow-[0_0_8px_#c0c1ff]" />
          <span className="font-mono-forge text-[11px] font-bold text-[var(--forge-primary)] uppercase tracking-wider">
            Temporal Heat Signature
          </span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--forge-text-primary)] tracking-tight">
          12-Week Continuity Matrix
        </h2>
        <p className="text-xs text-[var(--forge-text-secondary)]">
          84-day deliberate practice persistence ledger and recovery audit.
        </p>
      </div>

      {/* Continuity Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#1b1b22]/90 border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="font-mono-forge text-[10px] text-[var(--forge-text-muted)] uppercase font-bold tracking-wider">
            Strict Streak
          </span>
          <div className="font-mono-forge text-2xl font-bold text-[var(--forge-text-primary)] mt-1 flex items-center gap-1">
            <Flame className="w-4 h-4 text-[var(--forge-flame)] fill-current" />
            <span>{analytics.strictStreak}d</span>
          </div>
        </div>

        <div className="bg-[#1b1b22]/90 border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="font-mono-forge text-[10px] text-[var(--forge-text-muted)] uppercase font-bold tracking-wider">
            Resilient Streak
          </span>
          <div className="font-mono-forge text-2xl font-bold text-[var(--forge-primary)] mt-1">
            {analytics.resilientStreak}d
          </div>
        </div>

        <div className="bg-[#1b1b22]/90 border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="font-mono-forge text-[10px] text-[var(--forge-text-muted)] uppercase font-bold tracking-wider">
            Active Days
          </span>
          <div className="font-mono-forge text-2xl font-bold text-[var(--forge-tertiary)] mt-1">
            {activeDaysCount}
            <span className="text-[var(--forge-text-muted)] text-sm">/ 84</span>
          </div>
        </div>

        <div className="bg-[#1b1b22]/90 border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="font-mono-forge text-[10px] text-[var(--forge-text-muted)] uppercase font-bold tracking-wider">
            Micro Saves
          </span>
          <div className="font-mono-forge text-2xl font-bold text-[var(--forge-emerald)] mt-1">
            {analytics.microSavesCount}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 12-WEEK HEATMAP MATRIX
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#1b1b22]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[var(--forge-primary)]" />
            <h3 className="text-base font-bold text-[var(--forge-text-primary)] tracking-tight">
              Continuity Grid
            </h3>
          </div>
          <div className="flex items-center gap-2 font-mono-forge text-[10px] text-[var(--forge-text-muted)]">
            <span>Tap cell to inspect</span>
            <span className="text-white font-bold">W01 — W12</span>
          </div>
        </div>

        {/* Scrollable Matrix */}
        <div className="overflow-x-auto no-scrollbar pb-2">
          <div className="min-w-[420px] flex flex-col gap-2">
            {/* Week Labels Header */}
            <div className="grid grid-cols-12 gap-1.5 pl-6 text-center font-mono-forge text-[9px] text-[var(--forge-text-muted)]">
              {weeks.map((_, i) => (
                <span
                  key={i}
                  className={i === 11 ? 'text-[var(--forge-primary)] font-bold' : ''}
                >
                  W{i + 1}
                </span>
              ))}
            </div>

            {/* 7 Rows for days of week */}
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLetter, dayIdx) => (
              <div key={dayIdx} className="flex items-center gap-2">
                <span className="w-4 font-mono-forge text-[10px] text-[var(--forge-text-muted)] text-left font-bold">
                  {dayLetter}
                </span>

                <div className="grid grid-cols-12 gap-1.5 flex-1">
                  {weeks.map((week, weekIdx) => {
                    const day = week[dayIdx];
                    if (!day) return <div key={weekIdx} className="h-7 rounded" />;

                    const isSelected = activeDay?.dateStr === day.dateStr;

                    return (
                      <button
                        key={day.dateStr}
                        onClick={() => onSelectDay(day)}
                        title={`${day.label}: ${day.totalMinutes}m (${day.sessionCount} sessions)`}
                        className={`h-7 rounded-md transition-all active:scale-90 flex items-center justify-center font-mono-forge text-[9px] ${getCellColorClass(
                          day
                        )} ${
                          isSelected
                            ? 'ring-2 ring-white scale-105 z-10'
                            : ''
                        }`}
                      >
                        {day.challengeCount > 0 && '⚔'}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] font-mono-forge text-[var(--forge-text-muted)] pt-2 border-t border-[rgba(255,255,255,0.06)] flex-wrap gap-2">
          <span>Less Practice</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#24242e] border border-white/5" />
            <span className="w-3.5 h-3.5 rounded bg-[#8083ff]/25" />
            <span className="w-3.5 h-3.5 rounded bg-[#8083ff]/50" />
            <span className="w-3.5 h-3.5 rounded bg-[#8083ff]/80" />
            <span className="w-3.5 h-3.5 rounded bg-[#c0c1ff]" />
            <span className="w-3.5 h-3.5 rounded bg-[#f43f5e]" title="Resistance mode" />
          </div>
          <span>More Practice / ⚔ Resistance</span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. ACTIVE DAY INSPECTOR HUD PANEL
      ───────────────────────────────────────────────────────────── */}
      {activeDay && (
        <section className="bg-[#1b1b24]/95 border border-[rgba(192,193,255,0.2)] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--forge-primary)] shadow-[0_0_8px_#c0c1ff]" />
              <h3 className="text-base font-bold text-[var(--forge-text-primary)]">
                Day Inspector: {activeDay.label} ({activeDay.shortDay})
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--forge-surface-highest)] text-[var(--forge-primary)] font-mono-forge text-[11px] font-bold">
              {activeDay.totalMinutes} MINS LOGGED
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1">
            <div className="bg-[#0e0e12]/80 border border-white/5 rounded-xl p-3 text-center">
              <span className="font-mono-forge text-[10px] text-[var(--forge-text-muted)] uppercase">
                Sessions
              </span>
              <p className="font-mono-forge text-lg font-bold text-white mt-0.5">
                {activeDay.sessionCount}
              </p>
            </div>
            <div className="bg-[#0e0e12]/80 border border-white/5 rounded-xl p-3 text-center">
              <span className="font-mono-forge text-[10px] text-[var(--forge-text-muted)] uppercase">
                Points Earned
              </span>
              <p className="font-mono-forge text-lg font-bold text-[var(--forge-primary)] mt-0.5">
                +{activeDay.totalPoints.toFixed(1)}
              </p>
            </div>
            <div className="bg-[#0e0e12]/80 border border-white/5 rounded-xl p-3 text-center">
              <span className="font-mono-forge text-[10px] text-[var(--forge-text-muted)] uppercase">
                Resistance
              </span>
              <p className="font-mono-forge text-lg font-bold text-[var(--forge-tertiary)] mt-0.5">
                {activeDay.challengeCount} ⚔
              </p>
            </div>
          </div>

          {/* Sessions logged on this day */}
          <div className="space-y-2 pt-1">
            <span className="font-mono-forge text-[11px] font-bold text-[var(--forge-text-secondary)] uppercase tracking-wider">
              Recorded Debriefs ({daySessions.length})
            </span>

            {daySessions.length === 0 ? (
              <p className="text-xs text-[var(--forge-text-muted)] italic">
                {activeDay.totalMinutes > 0
                  ? 'Time was logged in micro-start intervals.'
                  : 'Zero practice sessions recorded on this date.'}
              </p>
            ) : (
              daySessions.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#141418] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--forge-text-primary)]">
                      {s.habitTitle}
                    </span>
                    <span className="font-mono-forge text-[11px] text-[var(--forge-primary)] font-bold">
                      {s.durationMinutes}m · +{s.votesEarned} pts
                    </span>
                  </div>

                  {s.bottleneckAttacked && (
                    <div className="text-xs text-[var(--forge-text-secondary)]">
                      <strong className="text-[var(--forge-tertiary)]">Bottleneck:</strong>{' '}
                      {s.bottleneckAttacked}
                    </div>
                  )}

                  {s.tacitInsight && (
                    <div className="text-xs text-[var(--forge-text-secondary)] italic bg-[var(--forge-surface-high)]/40 p-2 rounded-lg">
                      <strong className="text-[var(--forge-secondary)]">Insight:</strong> "
                      {s.tacitInsight}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
