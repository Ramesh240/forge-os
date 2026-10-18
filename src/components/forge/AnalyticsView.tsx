// src/components/forge/AnalyticsView.tsx
'use client';

import React, { useState } from 'react';
import {
  Clock,
  Flame,
  Timer,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Award,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AnalyticsSummary } from '@/lib/forge-engine';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary;
}

export function AnalyticsView({ analytics }: AnalyticsViewProps) {
  // Default to the highest or latest day in last7DaysChart
  const peakIndex = analytics.last7DaysChart.reduce(
    (maxIdx, curr, idx, arr) => (curr.minutes > arr[maxIdx].minutes ? idx : maxIdx),
    0
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(peakIndex);

  const activeChartItem =
    analytics.last7DaysChart[selectedDayIndex] ||
    analytics.last7DaysChart[analytics.last7DaysChart.length - 1];

  const totalWeekMinutes = analytics.last7DaysChart.reduce(
    (sum, d) => sum + d.minutes,
    0
  );
  const maxDayMinutes = Math.max(30, ...analytics.last7DaysChart.map((d) => d.minutes));

  return (
    <div className="flex flex-col space-y-6 pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[var(--forge-tertiary)] shadow-[0_0_8px_#4cd7f6]" />
          <span className="font-mono-forge text-[11px] font-bold text-[var(--forge-tertiary)] uppercase tracking-wider">
            Operational Telemetry
          </span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--forge-text-primary)] tracking-tight">
          Mastery Analytics Matrix
        </h2>
        <p className="text-xs text-[var(--forge-text-secondary)]">
          Empirical deliberate practice tracking, phase splits, and velocity vectors.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 4 TELEMETRY CARDS (2x2 on mobile, 4-col on desktop)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Total Hours */}
        <div className="bg-[#1b1b22]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-[var(--forge-text-muted)] mb-2">
            <span className="font-mono-forge text-[10px] uppercase font-bold tracking-wider">
              Total Hours
            </span>
            <Clock className="w-4 h-4 text-[var(--forge-primary)]" />
          </div>
          <div>
            <div className="font-mono-forge text-2xl sm:text-3xl font-bold text-[var(--forge-text-primary)]">
              {analytics.totalHours}
              <span className="text-[var(--forge-primary)] text-lg">h</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-mono-forge text-[var(--forge-text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--forge-primary)]" />
              <span>{analytics.effectiveHours}h effective</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-[var(--forge-primary)]/10 blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Total Sessions */}
        <div className="bg-[#1b1b22]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-[var(--forge-text-muted)] mb-2">
            <span className="font-mono-forge text-[10px] uppercase font-bold tracking-wider">
              Sessions
            </span>
            <RefreshCw className="w-4 h-4 text-[var(--forge-secondary)]" />
          </div>
          <div>
            <div className="font-mono-forge text-2xl sm:text-3xl font-bold text-[var(--forge-text-primary)]">
              {analytics.totalSessions}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-mono-forge text-[var(--forge-text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--forge-secondary)]" />
              <span>{analytics.completionRate14d}% completion</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-[var(--forge-secondary)]/10 blur-xl pointer-events-none" />
        </div>

        {/* Card 3: Avg Session */}
        <div className="bg-[#1b1b22]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-[var(--forge-text-muted)] mb-2">
            <span className="font-mono-forge text-[10px] uppercase font-bold tracking-wider">
              Avg Session
            </span>
            <Timer className="w-4 h-4 text-[var(--forge-tertiary)]" />
          </div>
          <div>
            <div className="font-mono-forge text-2xl sm:text-3xl font-bold text-[var(--forge-text-primary)]">
              {analytics.avgSessionMinutes}
              <span className="text-[var(--forge-tertiary)] text-lg">m</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-mono-forge text-[var(--forge-tertiary)]">
              <ShieldCheck className="w-3 h-3" />
              <span>Optimal flow</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-[var(--forge-tertiary)]/10 blur-xl pointer-events-none" />
        </div>

        {/* Card 4: Velocity Peak */}
        <div className="bg-[#1b1b22]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-[var(--forge-text-muted)] mb-2">
            <span className="font-mono-forge text-[10px] uppercase font-bold tracking-wider">
              Velocity Peak
            </span>
            <Flame className="w-4 h-4 text-[var(--forge-flame)]" />
          </div>
          <div>
            <div className="font-mono-forge text-2xl sm:text-3xl font-bold text-[var(--forge-text-primary)]">
              {analytics.resilientStreak || analytics.strictStreak}
              <span className="text-[var(--forge-flame)] text-lg">d</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-mono-forge text-[var(--forge-flame)]">
              <span>Consecutive strike</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-[var(--forge-flame)]/10 blur-xl pointer-events-none" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. 7-DAY VELOCITY INTERACTIVE BAR CHART
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#1b1b22]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col space-y-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--forge-primary)]" />
            <h3 className="text-base font-bold text-[var(--forge-text-primary)] tracking-tight">
              7-Day Velocity Matrix
            </h3>
          </div>
          <span className="font-mono-forge text-[11px] font-bold text-[var(--forge-tertiary)] px-2.5 py-0.5 rounded-full bg-[var(--forge-surface-high)]">
            {totalWeekMinutes} MINS TTL
          </span>
        </div>

        {/* Active Tooltip HUD Display */}
        {activeChartItem && (
          <div className="bg-[#242430] border border-[rgba(255,255,255,0.08)] px-3.5 py-2 rounded-xl flex items-center justify-between text-[var(--forge-text-primary)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--forge-primary)] shadow-[0_0_8px_#c0c1ff]" />
              <span className="font-mono-forge text-xs font-bold text-[var(--forge-primary)] uppercase">
                {activeChartItem.shortLabel} ({activeChartItem.dateStr})
              </span>
              <span className="text-xs text-[var(--forge-text-secondary)] font-mono-forge">
                {activeChartItem.minutes} mins · +{activeChartItem.points} pts
              </span>
            </div>
            <span className="font-mono-forge text-xs text-[var(--forge-tertiary)] font-bold">
              {activeChartItem.isChallenge ? '⚔ RESISTANCE' : 'STANDARD FLOW'}
            </span>
          </div>
        )}

        {/* SVG/HTML Velocity Bar Chart */}
        <div className="relative w-full h-48 flex items-end justify-between px-2 pt-6">
          {/* Subtle Grid Guides */}
          <div className="absolute inset-x-0 top-6 h-[1px] bg-white/[0.04]" />
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/[0.03]" />
          <div className="absolute inset-x-0 bottom-7 h-[1px] bg-white/[0.06]" />

          {analytics.last7DaysChart.map((d, idx) => {
            const isSelected = selectedDayIndex === idx;
            const barHeightPct = Math.max(8, Math.round((d.minutes / maxDayMinutes) * 100));
            const isPeak = idx === peakIndex && d.minutes > 0;

            return (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDayIndex(idx)}
                onMouseEnter={() => setSelectedDayIndex(idx)}
                className="flex flex-col items-center gap-2 group focus:outline-none z-10 flex-1 max-w-[48px]"
              >
                <div className="w-full flex items-end justify-center h-32 relative">
                  {/* Pulse glow dot for peak day */}
                  {isPeak && (
                    <div className="absolute -top-3 w-2 h-2 rounded-full bg-[var(--forge-tertiary)] animate-pulse shadow-[0_0_8px_#4cd7f6]" />
                  )}

                  <div
                    className={`w-6 sm:w-8 rounded-t-lg transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-t from-[#8083ff] to-[#4cd7f6] shadow-[0_0_16px_rgba(192,193,255,0.6)] brightness-125'
                        : d.isChallenge
                        ? 'bg-gradient-to-t from-[var(--forge-surface-high)] to-[#f43f5e]'
                        : 'bg-gradient-to-t from-[var(--forge-surface-high)] to-[var(--forge-primary)] group-hover:brightness-125'
                    }`}
                    style={{ height: `${barHeightPct}%` }}
                  />
                </div>

                <span
                  className={`font-mono-forge text-[10px] uppercase font-bold transition-colors ${
                    isSelected
                      ? 'text-[var(--forge-primary)]'
                      : 'text-[var(--forge-text-muted)] group-hover:text-white'
                  }`}
                >
                  {d.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. MASTERY PHASE SPLIT (Robert Greene Apprenticeship)
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#1b1b22]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--forge-text-primary)] tracking-tight">
              Apprenticeship Phase Allocation
            </h3>
            <p className="text-xs text-[var(--forge-text-secondary)]">
              Robert Greene's three-stage mastery distribution model
            </p>
          </div>
          <span className="font-mono-forge text-[11px] text-[var(--forge-primary)] font-bold">
            Mastery Ratio
          </span>
        </div>

        {/* Warning Alert if Passive Overload */}
        {analytics.stageSplit.passiveOverload && (
          <div className="bg-[var(--forge-error-container)] border border-[rgba(255,180,171,0.3)] rounded-xl p-3 flex items-start gap-2.5 text-xs text-[var(--forge-error)]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Comfort Zone Drift Detected:</strong> Passive
              absorption accounts for over 50% of time logged. Shift cognitive friction to
              directed practice and real synthesis drills!
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Phase 1: Passive Observation */}
          <div className="bg-[#141418] border border-[rgba(255,255,255,0.06)] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono-forge text-[10px] font-bold text-[#60a5fa] uppercase tracking-wider">
                STAGE I: OBSERVE
              </span>
              <span className="font-mono-forge text-sm font-bold text-white">
                {analytics.stageSplit.absorbPct}%
              </span>
            </div>
            <div className="w-full bg-[var(--forge-surface-highest)] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3b82f6] rounded-full transition-all duration-500"
                style={{ width: `${analytics.stageSplit.absorbPct}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--forge-text-secondary)]">
              Reading, theory intake, master observation
            </p>
          </div>

          {/* Phase 2: Directed Practice */}
          <div className="bg-[#141418] border border-[rgba(192,193,255,0.15)] rounded-xl p-3.5 space-y-2 shadow-[0_0_12px_rgba(192,193,255,0.08)]">
            <div className="flex items-center justify-between">
              <span className="font-mono-forge text-[10px] font-bold text-[var(--forge-primary)] uppercase tracking-wider">
                STAGE II: DRILL
              </span>
              <span className="font-mono-forge text-sm font-bold text-white">
                {analytics.stageSplit.drillPct}%
              </span>
            </div>
            <div className="w-full bg-[var(--forge-surface-highest)] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--forge-primary-btn)] rounded-full transition-all duration-500"
                style={{ width: `${analytics.stageSplit.drillPct}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--forge-text-secondary)]">
              Deliberate katas, constraints, instant feedback
            </p>
          </div>

          {/* Phase 3: Active Synthesis */}
          <div className="bg-[#141418] border border-[rgba(255,255,255,0.06)] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono-forge text-[10px] font-bold text-[var(--forge-emerald)] uppercase tracking-wider">
                STAGE III: SYNTHESIS
              </span>
              <span className="font-mono-forge text-sm font-bold text-white">
                {analytics.stageSplit.buildPct}%
              </span>
            </div>
            <div className="w-full bg-[var(--forge-surface-highest)] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--forge-emerald)] rounded-full transition-all duration-500"
                style={{ width: `${analytics.stageSplit.buildPct}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--forge-text-secondary)]">
              Novel execution, domain frontier, autonomous build
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. FRICTION RATING DISTRIBUTION
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#1b1b22]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--forge-secondary)]" />
            <h3 className="text-base font-bold text-[var(--forge-text-primary)] tracking-tight">
              Cognitive Friction Distribution
            </h3>
          </div>
          <span className="font-mono-forge text-[11px] text-[var(--forge-text-muted)]">
            Avg Strain: {analytics.avgDifficulty.toFixed(1)} / 5.0
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {analytics.difficultyDistribution.map((d) => (
            <div key={d.level} className="flex items-center gap-3 text-xs font-mono-forge">
              <span className="w-28 text-[var(--forge-text-secondary)] font-medium">
                Tier {d.level}: {d.label}
              </span>
              <div className="flex-1 bg-[var(--forge-surface-highest)] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8083ff] to-[#ddb7ff] rounded-full transition-all duration-500"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <span className="w-12 text-right text-[var(--forge-text-muted)]">
                {d.count} ({d.pct}%)
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
