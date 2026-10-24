'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Flame, Sparkles, TrendingUp, Trophy, X } from 'lucide-react';
import { calculateBuilderPercentile } from '@/lib/forge-engine';

export interface WeeklySessionLog {
  id: string;
  durationMinutes: number;
  loggedAt: string | Date;
  habitId?: string;
  stage?: string;
  scoreEarned?: number;
}

export interface WeeklyHabitSummary {
  id: string;
  title: string;
  identityTitle?: string;
  currentStreak: number;
  lastCompletedDate?: string | null;
}

interface WeeklyReviewCardProps {
  sessions: WeeklySessionLog[];
  habits: WeeklyHabitSummary[];
  onStartGateway?: (habit: WeeklyHabitSummary) => void;
  className?: string;
}

export const WeeklyReviewCard: React.FC<WeeklyReviewCardProps> = ({
  sessions,
  habits,
  onStartGateway,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Compute this week's metrics vs prior week
  const stats = useMemo(() => {
    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const sevenDaysAgo = todayMidnight - 7 * msInDay;
    const fourteenDaysAgo = todayMidnight - 14 * msInDay;

    let thisWeekMinutes = 0;
    let priorWeekMinutes = 0;
    let thisWeekSessionsCount = 0;
    let thisWeekScore = 0;

    const habitFrequency: Record<string, number> = {};
    const daysWithActivity = new Set<string>();

    sessions.forEach((s) => {
      const logTime = new Date(s.loggedAt).getTime();
      const dateStr = new Date(s.loggedAt).toISOString().split('T')[0];

      if (logTime >= sevenDaysAgo) {
        thisWeekMinutes += s.durationMinutes || 0;
        thisWeekSessionsCount += 1;
        thisWeekScore += s.scoreEarned || 0;
        daysWithActivity.add(dateStr);

        if (s.habitId) {
          habitFrequency[s.habitId] = (habitFrequency[s.habitId] || 0) + 1;
        }
      } else if (logTime >= fourteenDaysAgo && logTime < sevenDaysAgo) {
        priorWeekMinutes += s.durationMinutes || 0;
      }
    });

    // Top habit
    let topHabitId = '';
    let maxCount = 0;
    Object.entries(habitFrequency).forEach(([hId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topHabitId = hId;
      }
    });
    const topHabit = habits.find((h) => h.id === topHabitId);

    // Percentage delta vs prior week
    let deltaPct = 0;
    if (priorWeekMinutes > 0) {
      deltaPct = Math.round(((thisWeekMinutes - priorWeekMinutes) / priorWeekMinutes) * 100);
    } else if (thisWeekMinutes > 0) {
      deltaPct = 100;
    }

    // Format hours & mins
    const thisWeekHours = Math.floor(thisWeekMinutes / 60);
    const thisWeekRemMins = thisWeekMinutes % 60;
    const hoursStr = thisWeekHours > 0 ? `${thisWeekHours}h ${thisWeekRemMins}m` : `${thisWeekRemMins}m`;

    // Active streak highlights
    const topStreakHabit = habits.reduce(
      (acc, h) => (h.currentStreak > (acc?.currentStreak || 0) ? h : acc),
      habits[0] || null
    );

    const percentileRank = calculateBuilderPercentile({
      weeklyHours: Number((thisWeekMinutes / 60).toFixed(1)),
      activeDaysThisWeek: daysWithActivity.size,
      currentStreak: topStreakHabit?.currentStreak || 0,
    });

    return {
      thisWeekMinutes,
      priorWeekMinutes,
      thisWeekHours,
      thisWeekRemMins,
      hoursStr,
      deltaPct,
      sessionsCount: thisWeekSessionsCount,
      activeDaysCount: daysWithActivity.size,
      thisWeekScore,
      topHabit,
      topStreakHabit,
      percentileRank,
    };
  }, [sessions, habits]);

  if (isDismissed) return null;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xl ${className}`}
      style={{
        backgroundColor: '#0c0d14',
        borderColor: 'rgba(99, 102, 241, 0.24)',
        boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.5), 0 0 24px -6px rgba(99, 102, 241, 0.12)',
      }}
    >
      {/* Top Header */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-white/[0.07] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                7-Day Consistency Review
              </h4>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Weekly Digest
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              {stats.activeDaysCount} active days • {stats.sessionsCount} sessions completed this week
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition cursor-pointer"
            aria-label={isExpanded ? 'Collapse weekly review' : 'Expand weekly review'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition cursor-pointer"
            aria-label="Dismiss weekly review"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Social Proof & Disciplined Builder Percentile Banner (Audit #12) */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300">
                    {stats.percentileRank.tierName}
                  </span>
                  <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35">
                    {stats.percentileRank.badge}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-0.5">
                  {stats.percentileRank.comparisonText} • {stats.percentileRank.description}
                </p>
              </div>
            </div>
          </div>

          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Tile 1: Focus Time */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
                Focus Time
              </span>
              <div className="text-base sm:text-lg font-black font-mono text-white">
                {stats.hoursStr}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px]">
                {stats.deltaPct >= 0 ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +{stats.deltaPct}%
                  </span>
                ) : (
                  <span className="text-rose-400 font-semibold flex items-center gap-0.5">
                    {stats.deltaPct}%
                  </span>
                )}
                <span className="text-zinc-400 text-[10px]">vs prior wk</span>
              </div>
            </div>

            {/* Tile 2: Sessions */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
                Micro-Starts
              </span>
              <div className="text-base sm:text-lg font-black font-mono text-white">
                {stats.sessionsCount}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                across {stats.activeDaysCount} / 7 days
              </p>
            </div>

            {/* Tile 3: Top Streak */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
                Best Streak
              </span>
              <div className="text-base sm:text-lg font-black font-mono text-amber-400 flex items-center gap-1">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                {stats.topStreakHabit?.currentStreak || 0}d
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-1">
                {stats.topStreakHabit?.title || 'None active'}
              </p>
            </div>

            {/* Tile 4: Score Banked */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
                Identity Points
              </span>
              <div className="text-base sm:text-lg font-black font-mono text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                +{stats.thisWeekScore}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Banked this week
              </p>
            </div>
          </div>

          {/* Stoic Identity Reflection Footer */}
          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <p className="text-xs text-zinc-300">
                {stats.activeDaysCount >= 5 ? (
                  <span>
                    <strong>Exceptional discipline.</strong> You forged habits on {stats.activeDaysCount} of the last 7 days.
                  </span>
                ) : stats.activeDaysCount >= 2 ? (
                  <span>
                    <strong>Steady compounding.</strong> You logged {stats.sessionsCount} sessions across {stats.activeDaysCount} days.
                  </span>
                ) : (
                  <span>
                    <strong>New week, fresh momentum.</strong> Clear a 2-minute gateway to establish your chain.
                  </span>
                )}
              </p>
            </div>

            {stats.topStreakHabit && onStartGateway && (
              <button
                type="button"
                onClick={() => onStartGateway(stats.topStreakHabit)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:opacity-90 self-start sm:self-auto"
                style={{ background: 'var(--accent-primary)' }}
              >
                <span>Continue: {stats.topStreakHabit.title} →</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
