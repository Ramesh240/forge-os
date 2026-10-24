'use client';

import React, { useMemo } from 'react';
import {
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { SerializedHabit, SerializedSession } from '@/components/ForgeAppShell';
import { calculateBuilderPercentile } from '@/lib/forge-engine';

interface DailyRetentionBannerProps {
  habits: SerializedHabit[];
  sessions: SerializedSession[];
  strictStreak: number;
  resilientStreak: number;
  onStartHabit: (habit: SerializedHabit) => void;
}

export default function DailyRetentionBanner({
  habits,
  sessions,
  strictStreak,
  resilientStreak,
  onStartHabit,
}: DailyRetentionBannerProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute daily habits completion
  const { completedCount, totalCount, remainingHabits, nextHabit, isPerfectDay, progressPct } =
    useMemo(() => {
      const completed = habits.filter((h) => h.lastCompletedDate === todayStr);
      const remaining = habits.filter((h) => h.lastCompletedDate !== todayStr);
      const total = habits.length;
      const pct = total > 0 ? Math.round((completed.length / total) * 100) : 0;
      return {
        completedCount: completed.length,
        totalCount: total,
        remainingHabits: remaining,
        nextHabit: remaining[0] || null,
        isPerfectDay: total > 0 && completed.length === total,
        progressPct: pct,
      };
    }, [habits, todayStr]);

  // Streak & Tier calculation
  const maxStreak = useMemo(() => {
    const habitStreaks = habits.map((h) => h.currentStreak || 0);
    return Math.max(strictStreak, resilientStreak, ...habitStreaks, 0);
  }, [strictStreak, resilientStreak, habits]);

  const streakTier = useMemo(() => {
    if (maxStreak >= 30) {
      return {
        name: 'Mastery Crucible',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
      };
    }
    if (maxStreak >= 14) {
      return {
        name: 'Inferno',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/20',
      };
    }
    if (maxStreak >= 7) {
      return {
        name: 'Blaze',
        color: 'text-amber-300',
        bg: 'bg-amber-400/10 border-amber-400/25',
      };
    }
    if (maxStreak >= 3) {
      return {
        name: 'Flame',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10 border-orange-500/20',
      };
    }
    return {
      name: 'Spark',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
    };
  }, [maxStreak]);

  // Humanized recency of last session
  const lastSessionText = useMemo(() => {
    if (!sessions || sessions.length === 0) return 'No sessions recorded yet';
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
    );
    const latest = sorted[0];
    if (!latest?.loggedAt) return 'Ready for today';

    const diffMs = Date.now() - new Date(latest.loggedAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  }, [sessions]);

  // Social Proof & Percentile calculation (Audit #12)
  const percentileRank = useMemo(() => {
    const msInDay = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = Date.now() - 7 * msInDay;
    let weeklyMins = 0;
    const activeDays = new Set<string>();
    sessions.forEach((s) => {
      const t = new Date(s.loggedAt).getTime();
      if (t >= sevenDaysAgo) {
        weeklyMins += s.durationMinutes || 0;
        activeDays.add(new Date(s.loggedAt).toISOString().split('T')[0]);
      }
    });
    return calculateBuilderPercentile({
      weeklyHours: Number((weeklyMins / 60).toFixed(1)),
      activeDaysThisWeek: activeDays.size,
      currentStreak: maxStreak,
    });
  }, [sessions, maxStreak]);

  if (totalCount === 0) return null;

  return (
    <section className="glass-panel rounded-3xl p-4 sm:p-5 border border-white/10 dark:border-white/5 relative overflow-hidden transition-all duration-300">
      {/* Ambient background glow */}
      <div
        className="absolute -right-16 -top-16 w-44 h-44 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: isPerfectDay ? 'rgb(16, 185, 129)' : 'var(--accent-primary)' }}
      />

      <div className="relative z-10 space-y-3.5">
        {/* Top Metadata Row: Streak Pill + Recency */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${streakTier.bg} ${streakTier.color}`}
            >
              <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>
                {maxStreak > 0 ? `${maxStreak}-Day ${streakTier.name}` : 'Day 1: Spark'}
              </span>
            </span>

            {/* Disciplined Builder Percentile Ranking Pill (Audit #12) */}
            <span
              title={percentileRank.comparisonText}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25 cursor-help"
            >
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>{percentileRank.badge} Builder</span>
            </span>

            {isPerfectDay && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Perfect Day</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] theme-muted font-mono">
            <Clock className="w-3 h-3 opacity-60" />
            <span>Last active: {lastSessionText}</span>
          </div>
        </div>

        {/* Middle Progress Row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold theme-text">
            <span>
              {isPerfectDay ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  All {totalCount} identity habits forged today!
                </span>
              ) : (
                <span>
                  {completedCount} of {totalCount} habits forged today
                </span>
              )}
            </span>
            <span className="font-mono text-[11px] theme-muted">{progressPct}%</span>
          </div>

          {/* Progress Bar Track */}
          <div className="h-2 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 p-[1px]">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.max(5, progressPct)}%`,
                background: isPerfectDay
                  ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                  : 'linear-gradient(90deg, var(--accent-primary) 0%, #f59e0b 100%)',
              }}
            />
          </div>
        </div>

        {/* Dynamic Action Bottom Bar */}
        {isPerfectDay ? (
          <div className="pt-1 flex items-center justify-between text-xs theme-subtext border-t border-white/5">
            <span className="text-[11px] text-emerald-400/90 font-medium">
              ⚡ 1.5x Daily Mastery Multiplier active • Continuity chain locked in.
            </span>
            <span className="text-[11px] font-mono theme-muted">Next reset at midnight</span>
          </div>
        ) : nextHabit ? (
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-white/5">
            <div className="text-xs">
              <span className="theme-muted">Next up: </span>
              <span className="font-bold theme-text">{nextHabit.title}</span>
              <span className="text-[11px] theme-muted hidden sm:inline ml-1.5 font-mono">
                ({nextHabit.identityTitle})
              </span>
            </div>

            <button
              onClick={() => onStartHabit(nextHabit)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shrink-0"
              style={{ background: 'var(--accent-primary)' }}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Start 2m Micro-start</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
