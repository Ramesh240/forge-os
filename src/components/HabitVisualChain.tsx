// src/components/HabitVisualChain.tsx
'use client';

import React, { useMemo } from 'react';
import { Flame, Check, Zap, AlertTriangle, Shield, Sparkles, Crown } from 'lucide-react';
import { SerializedSession } from '@/components/ForgeAppShell';

interface HabitVisualChainProps {
  habitId: string;
  sessions: SerializedSession[];
  currentStreak: number;
  missedYesterday: boolean;
  downscaledDaysRemaining: number;
  lastCompletedDate?: string | null;
}

export type DayNodeStatus = 'COMPLETED' | 'GATEWAY' | 'MISSED' | 'TODAY_PENDING' | 'TODAY_DONE';

interface DayNode {
  dateStr: string;
  dayLabel: string;
  dayNum: number;
  isToday: boolean;
  status: DayNodeStatus;
  sessionDuration?: number;
}

export function getStreakMilestoneTier(streak: number): {
  tierName: string;
  badgeLabel: string;
  flameColor: string;
  containerClass: string;
  icon: typeof Flame;
} {
  if (streak >= 30) {
    return {
      tierName: 'Forge Core',
      badgeLabel: '30d+ Forge Master',
      flameColor: '#a855f7',
      containerClass: 'bg-purple-500/15 border-purple-500/30 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
      icon: Crown,
    };
  }
  if (streak >= 7) {
    return {
      tierName: 'Blaze',
      badgeLabel: '7d+ Blaze',
      flameColor: '#f97316',
      containerClass: 'bg-orange-500/15 border-orange-500/30 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.25)]',
      icon: Flame,
    };
  }
  if (streak >= 3) {
    return {
      tierName: 'Ember',
      badgeLabel: '3d+ Ember',
      flameColor: '#f59e0b',
      containerClass: 'bg-amber-500/15 border-amber-500/25 text-amber-400',
      icon: Flame,
    };
  }
  if (streak > 0) {
    return {
      tierName: 'Spark',
      badgeLabel: `${streak}d Spark`,
      flameColor: '#eab308',
      containerClass: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      icon: Flame,
    };
  }
  return {
    tierName: 'Dormant',
    badgeLabel: '0d Streak',
    flameColor: '#71717a',
    containerClass: 'bg-zinc-500/10 border-zinc-500/20 theme-muted',
    icon: Flame,
  };
}

export default function HabitVisualChain({
  habitId,
  sessions,
  currentStreak,
  missedYesterday,
  downscaledDaysRemaining,
  lastCompletedDate,
}: HabitVisualChainProps) {
  const milestone = useMemo(() => getStreakMilestoneTier(currentStreak), [currentStreak]);

  // Compute 7-day rolling window: 6 days ago through today
  const chainNodes: DayNode[] = useMemo(() => {
    const nodes: DayNode[] = [];
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];

    // Filter sessions matching this habit
    const habitSessions = sessions.filter((s) => s.habitId === habitId);

    const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === todayDateStr;

      // Find sessions logged on this date
      const matched = habitSessions.filter((s) => s.loggedAt.startsWith(dateStr));
      const hasCompleted = matched.length > 0 || (isToday && lastCompletedDate === todayDateStr);

      let status: DayNodeStatus = 'MISSED';
      let duration: number | undefined;

      if (hasCompleted) {
        const onlyGateway = matched.length > 0 && matched.every((m) => m.completedGatewayOnly);
        duration = matched.reduce((acc, m) => acc + (m.durationMinutes || 0), 0);

        if (isToday) {
          status = 'TODAY_DONE';
        } else if (onlyGateway) {
          status = 'GATEWAY';
        } else {
          status = 'COMPLETED';
        }
      } else if (isToday) {
        status = 'TODAY_PENDING';
      } else {
        status = 'MISSED';
      }

      nodes.push({
        dateStr,
        dayLabel: DAY_NAMES[d.getDay()],
        dayNum: d.getDate(),
        isToday,
        status,
        sessionDuration: duration,
      });
    }

    return nodes;
  }, [habitId, sessions, lastCompletedDate]);

  const MilestoneIcon = milestone.icon;

  return (
    <div className="space-y-2.5 pt-1">
      {/* Top Banner: Milestone Flame & Rebound Notice */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${milestone.containerClass}`}
          >
            <MilestoneIcon
              className="w-3.5 h-3.5"
              style={{ color: milestone.flameColor, fill: currentStreak > 0 ? milestone.flameColor : 'none' }}
            />
            <span>{currentStreak}d Streak</span>
            <span className="opacity-70 text-[10px]">• {milestone.tierName}</span>
          </div>

          {currentStreak >= 7 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/5 border border-[var(--border-subtle)] text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Momentum Active
            </span>
          )}
        </div>

        {/* Downscaled Mode indicator */}
        {downscaledDaysRemaining > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[10px] font-mono">
            <Shield className="w-3 h-3 text-indigo-400" />
            <span>Downscaler ({downscaledDaysRemaining}d)</span>
          </div>
        )}
      </div>

      {/* "Never Miss Twice" Rebound Priority Warning */}
      {missedYesterday && lastCompletedDate !== new Date().toISOString().split('T')[0] && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold">⚡ Never Miss Twice: Rebound Priority</div>
            <div className="text-[10px] opacity-90">
              Clear your 2-minute gateway today to protect your identity momentum (+1.25x Score).
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Rolling Visual Chain Strip */}
      <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-[var(--border-subtle)] space-y-1.5">
        <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider theme-muted px-1">
          <span>7-Day Chain Timeline</span>
          <span>{currentStreak > 0 ? `${currentStreak} Consecutive Days` : 'Build Your Streak'}</span>
        </div>

        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {chainNodes.map((node, idx) => {
            const isCompleted = node.status === 'COMPLETED' || node.status === 'TODAY_DONE';
            const isGateway = node.status === 'GATEWAY';
            const isPending = node.status === 'TODAY_PENDING';
            const isMissed = node.status === 'MISSED';

            return (
              <div key={node.dateStr} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                {/* Node Pill */}
                <div
                  title={`${node.dateStr} — ${node.status}${node.sessionDuration ? ` (${node.sessionDuration} mins)` : ''}`}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all relative ${
                    isCompleted
                      ? 'text-white shadow-sm'
                      : isGateway
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400'
                      : isPending
                      ? 'border-2 border-dashed border-amber-400/70 text-amber-400 animate-pulse bg-amber-500/5'
                      : 'border border-[var(--border-subtle)] text-zinc-600 dark:text-zinc-500 bg-white/[0.01]'
                  }`}
                  style={isCompleted ? { background: 'var(--accent-primary)', boxShadow: '0 2px 8px var(--accent-glow)' } : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : isGateway ? (
                    <Zap className="w-3 h-3 fill-amber-400" />
                  ) : isPending ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  ) : (
                    <span className="text-[10px] opacity-40 font-mono">—</span>
                  )}

                  {/* Tiny Today Indicator Dot */}
                  {node.isToday && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[var(--bg-primary)]" />
                  )}
                </div>

                {/* Day Label */}
                <span
                  className={`text-[9px] font-mono font-medium truncate ${
                    node.isToday ? 'text-amber-400 font-bold' : 'theme-muted'
                  }`}
                >
                  {node.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
