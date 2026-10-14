// src/components/forge/WorkspaceView.tsx
'use client';

import React from 'react';
import {
  Flame,
  Plus,
  Play,
  Pencil,
  Volume2,
  Lock,
  Link2,
  CheckCircle2,
  AlertTriangle,
  DoorOpen,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SerializedIdentity, SerializedHabit } from '../ForgeAppShell';

interface WorkspaceViewProps {
  identities: SerializedIdentity[];
  habits: SerializedHabit[];
  visibleHabits: SerializedHabit[];
  protocolTypeFilter: 'ALL' | 'REBOUND' | 'STACKED' | 'TEMPTATION';
  onSetProtocolTypeFilter: (filter: 'ALL' | 'REBOUND' | 'STACKED' | 'TEMPTATION') => void;
  onOpenCreateHabit: () => void;
  onOpenCreateIdentity: () => void;
  onOpenEditHabit: (habit: SerializedHabit) => void;
  onOpenEditIdentity: (idVec: SerializedIdentity) => void;
  onStartFocusSession: (habit: SerializedHabit) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  todayStr: string;
}

export function WorkspaceView({
  identities,
  habits,
  visibleHabits,
  protocolTypeFilter,
  onSetProtocolTypeFilter,
  onOpenCreateHabit,
  onOpenCreateIdentity,
  onOpenEditHabit,
  onOpenEditIdentity,
  onStartFocusSession,
  soundEnabled,
  onToggleSound,
  todayStr,
}: WorkspaceViewProps) {
  const completedTodayCount = habits.filter(
    (h) => h.lastCompletedDate === todayStr
  ).length;
  const totalHabitsCount = habits.length;
  const progressPct =
    totalHabitsCount > 0
      ? Math.round((completedTodayCount / totalHabitsCount) * 100)
      : 0;
  const highestStreak = habits.reduce(
    (max, h) => Math.max(max, h.currentStreak),
    0
  );

  return (
    <div className="flex flex-col space-y-6 pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. ACTIVE ARCHETYPES HORIZONTAL CAROUSEL
      ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--forge-primary)] animate-ping" />
            <span className="font-mono-forge text-[11px] font-bold text-[var(--forge-primary)] tracking-wider uppercase">
              Archetypes
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono-forge text-[11px] text-[var(--forge-text-muted)]">
            <span>
              {identities.length.toString().padStart(2, '0')} Vectors
            </span>
            <button
              onClick={onOpenCreateIdentity}
              className="text-xs text-[var(--forge-secondary)] hover:text-[var(--forge-text-primary)] underline underline-offset-2 transition-colors ml-1 font-semibold"
            >
              + New
            </button>
          </div>
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 pt-1 pb-3 snap-x snap-mandatory">
          {identities.map((idVec) => {
            const hours = Number(idVec.totalHoursLogged || 0);
            const masteryPct = Math.min(
              100,
              Math.max(4, Math.round((hours / 10000) * 100))
            );
            const strokeDash = `${masteryPct}, 100`;

            return (
              <div
                key={idVec.id}
                className="snap-center shrink-0 w-[84vw] max-w-[340px] bg-[var(--forge-surface-low)]/90 backdrop-blur-2xl border border-[var(--forge-border)] rounded-2xl p-4 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-[var(--forge-border-mid)] transition-all"
              >
                {/* Subtle chromatic backdrop glow */}
                <div className="absolute -right-12 -top-12 w-36 h-36 bg-[var(--forge-primary)]/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-start justify-between relative z-10 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--forge-primary-tint)] border border-[var(--forge-border-mid)] text-[var(--forge-primary)] font-mono-forge text-[10px] font-bold uppercase tracking-wider">
                        {idVec.currentPhase || 'PRACTICE'}
                      </span>
                      <span className="font-mono-forge text-[11px] text-[var(--forge-text-muted)] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[var(--forge-tertiary)]" />
                        {idVec.totalVotes} pts
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenEditIdentity(idVec)}
                      className="text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] p-1 rounded-lg hover:bg-[var(--forge-surface-high)] transition-colors"
                      title="Edit Archetype"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-[var(--forge-text-primary)] tracking-tight truncate">
                        {idVec.title}
                      </h2>
                      <p className="text-xs text-[var(--forge-text-secondary)] italic mt-1 line-clamp-2 leading-relaxed">
                        "{idVec.lifesTaskStatement}"
                      </p>
                    </div>

                    {/* Circular Phase Ring Progress */}
                    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-[var(--forge-surface-highest)] stroke-current"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          strokeWidth="3.2"
                        />
                        <path
                          className="text-[var(--forge-primary)] stroke-current transition-all duration-700"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          strokeDasharray={strokeDash}
                          strokeLinecap="round"
                          strokeWidth="3.2"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="font-mono-forge text-[12px] font-bold text-[var(--forge-text-primary)]">
                          {masteryPct}
                          <span className="text-[9px] text-[var(--forge-primary)]">%</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Hours Horizon Bar */}
                <div className="mt-4 pt-3 border-t border-[var(--forge-border)] flex items-center justify-between text-[var(--forge-text-secondary)] font-mono-forge text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--forge-primary)]" />
                    <span>
                      {hours.toFixed(1)}h{' '}
                      <span className="text-[var(--forge-text-muted)] text-[10px]">
                        / 10,000h
                      </span>
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--forge-tertiary)] font-bold tracking-wider uppercase">
                    10k Goal
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. QUICK DAILY TELEMETRY MODULE
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[var(--forge-surface-low)]/90 backdrop-blur-xl border border-[var(--forge-border)] rounded-2xl p-4 shadow-lg flex flex-col space-y-2.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--forge-text-primary)] tracking-tight">
              {completedTodayCount}/{totalHabitsCount} Completed
            </span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--forge-flame-tint)] border border-[rgba(249,115,22,0.35)] text-[var(--forge-flame)] font-mono-forge text-[11px] font-bold">
            <Flame className="w-3.5 h-3.5 fill-current text-[var(--forge-flame)]" />
            <span>{highestStreak}d Streak</span>
          </div>
        </div>

        {/* Glowing Progress Line */}
        <div className="w-full bg-[var(--forge-surface-highest)] h-2 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8083ff] via-[#c0c1ff] to-[#4cd7f6] shadow-[0_0_12px_rgba(192,193,255,0.7)] transition-all duration-700 ease-out"
            style={{ width: `${Math.max(4, progressPct)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[var(--forge-text-muted)] font-mono-forge text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--forge-tertiary)] shadow-[0_0_6px_#4cd7f6]" />
            {totalHabitsCount - completedTodayCount} Remaining
          </span>
          <span className="text-[var(--forge-primary)] font-semibold">
            Progress: {progressPct}%
          </span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. HABIT PROTOCOL QUEUE HEADER & FILTER PILLS
      ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[var(--forge-text-primary)] tracking-tight">
              Habits
            </h3>
            <p className="text-xs text-[var(--forge-text-secondary)]">
              2-minute initiation gateways
            </p>
          </div>

          <button
            onClick={onOpenCreateHabit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6f00be] hover:brightness-110 text-white font-mono-forge text-xs font-bold tracking-wider shadow-[0_0_16px_rgba(128,131,255,0.4)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ NEW</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => onSetProtocolTypeFilter('ALL')}
            className={`px-3 py-1 rounded-full font-mono-forge text-[11px] font-semibold whitespace-nowrap transition-all ${
              protocolTypeFilter === 'ALL'
                ? 'bg-[var(--forge-surface-highest)] text-[var(--forge-primary)] border border-[var(--forge-border-mid)] shadow-sm'
                : 'bg-[var(--forge-surface-low)] hover:bg-[var(--forge-surface-high)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] border border-[var(--forge-border)]'
            }`}
          >
            All ({habits.length})
          </button>
          <button
            onClick={() => onSetProtocolTypeFilter('REBOUND')}
            className={`px-3 py-1 rounded-full font-mono-forge text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              protocolTypeFilter === 'REBOUND'
                ? 'bg-[var(--forge-error-container)] text-[var(--forge-error)] border border-[rgba(255,180,171,0.4)] shadow-sm'
                : 'bg-[var(--forge-surface-low)] hover:bg-[var(--forge-surface-high)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] border border-[var(--forge-border)]'
            }`}
          >
            <span>🔥 Rebound</span>
          </button>
          <button
            onClick={() => onSetProtocolTypeFilter('STACKED')}
            className={`px-3 py-1 rounded-full font-mono-forge text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              protocolTypeFilter === 'STACKED'
                ? 'bg-[var(--forge-surface-highest)] text-[var(--forge-secondary)] border border-[rgba(221,183,255,0.4)] shadow-sm'
                : 'bg-[var(--forge-surface-low)] hover:bg-[var(--forge-surface-high)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] border border-[var(--forge-border)]'
            }`}
          >
            <span>🔗 Stacked</span>
          </button>
          <button
            onClick={() => onSetProtocolTypeFilter('TEMPTATION')}
            className={`px-3 py-1 rounded-full font-mono-forge text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              protocolTypeFilter === 'TEMPTATION'
                ? 'bg-[var(--forge-surface-highest)] text-[var(--forge-tertiary)] border border-[rgba(76,215,246,0.4)] shadow-sm'
                : 'bg-[var(--forge-surface-low)] hover:bg-[var(--forge-surface-high)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] border border-[var(--forge-border)]'
            }`}
          >
            <span>🔒 Bundles</span>
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. HABIT PROTOCOL CARDS LIST
      ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col space-y-4">
        {visibleHabits.length === 0 ? (
          <div className="bg-[var(--forge-surface-low)]/80 border border-[var(--forge-border)] rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--forge-surface-high)] flex items-center justify-center text-[var(--forge-primary)]">
              <Plus className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[var(--forge-text-primary)]">
              No Habits Found
            </h4>
            <p className="text-xs text-[var(--forge-text-secondary)] max-w-sm">
              Create an atomic habit to initiate your daily 2-minute momentum loop.
            </p>
            <button
              onClick={onOpenCreateHabit}
              className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6f00be] text-white font-mono-forge text-xs font-bold shadow-lg"
            >
              + Create Habit
            </button>
          </div>
        ) : (
          visibleHabits.map((habit) => {
            const isCompletedToday = habit.lastCompletedDate === todayStr;
            const isRebound = habit.isReboundPriority;
            const isStacked = Boolean(habit.nextStackedHabitTitle || habit.anchorHabitId);
            const isTemptation = Boolean(habit.temptationBundleUrl);

            return (
              <div
                key={habit.id}
                className={`rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col space-y-3 transition-all ${
                  isCompletedToday
                    ? 'bg-[var(--forge-surface-lowest)]/80 border border-[var(--forge-border)] opacity-75'
                    : isRebound
                    ? 'bg-[var(--forge-surface-low)] border border-[rgba(255,180,171,0.35)] shadow-[0_4px_24px_-2px_rgba(255,180,171,0.18)]'
                    : 'bg-[var(--forge-surface-low)] border border-[var(--forge-border)] hover:border-[var(--forge-border-mid)]'
                }`}
              >
                {/* Rebound Priority Top Red Bar */}
                {isRebound && !isCompletedToday && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ffb4ab] via-[#93000a] to-[#ffb4ab] animate-pulse" />
                )}

                {/* Top Badges & Controls Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Rebound badge */}
                    {isRebound && !isCompletedToday && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--forge-error-container)] border border-[rgba(255,180,171,0.3)] text-[var(--forge-error)] font-mono-forge text-[10px] font-extrabold flex items-center gap-1 tracking-wider shadow-[0_0_10px_rgba(255,180,171,0.25)]">
                        <AlertTriangle className="w-3 h-3 text-[var(--forge-error)]" />
                        REBOUND 🔥
                      </span>
                    )}

                    {/* Stacked Chain badge */}
                    {isStacked && !isRebound && !isCompletedToday && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--forge-secondary-tint)] border border-[rgba(221,183,255,0.3)] text-[var(--forge-secondary)] font-mono-forge text-[10px] font-bold flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-[var(--forge-secondary)]" />
                        CHAINED 🔗
                      </span>
                    )}

                    {/* Temptation Bundle badge */}
                    {isTemptation && !isCompletedToday && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--forge-tertiary-tint)] border border-[rgba(76,215,246,0.3)] text-[var(--forge-tertiary)] font-mono-forge text-[10px] font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[var(--forge-tertiary)]" />
                        BUNDLE 🔒
                      </span>
                    )}

                    {/* Completed Today Badge */}
                    {isCompletedToday && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--forge-emerald-tint)] border border-[rgba(16,185,129,0.3)] text-[var(--forge-emerald)] font-mono-forge text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[var(--forge-emerald)]" />
                        COMPLETED ✓
                      </span>
                    )}

                    {/* Phase badge */}
                    <span className="px-2 py-0.5 rounded-full bg-[var(--forge-surface-high)] text-[var(--forge-text-secondary)] font-mono-forge text-[10px] font-bold uppercase">
                      {habit.defaultPhase || 'PRACTICE'}
                    </span>
                  </div>

                  {/* Micro Actions */}
                  <div className="flex items-center gap-1 text-[var(--forge-text-muted)]">
                    <button
                      onClick={onToggleSound}
                      title={soundEnabled ? 'Audio cues enabled' : 'Audio cues muted'}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--forge-surface-highest)] hover:text-[var(--forge-text-primary)] transition-colors"
                    >
                      <Volume2
                        className={`w-3.5 h-3.5 ${
                          soundEnabled ? 'text-[var(--forge-tertiary)]' : 'opacity-40'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => onOpenEditHabit(habit)}
                      title="Edit protocol"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--forge-surface-highest)] hover:text-[var(--forge-text-primary)] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Identity Breadcrumb & Habit Title */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono-forge text-[11px] text-[var(--forge-primary)] uppercase font-bold tracking-wider">
                      {habit.identityTitle || 'Archetype'}
                    </span>
                    {habit.reminderTime && (
                      <>
                        <span className="text-[var(--forge-text-faint)] text-xs">•</span>
                        <span className="font-mono-forge text-[11px] text-[var(--forge-text-secondary)] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--forge-secondary)]" />
                          {habit.reminderTime}
                        </span>
                      </>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[var(--forge-text-primary)] tracking-tight">
                    {habit.title}
                  </h4>
                </div>

                {/* Stacked next chain pill */}
                {habit.nextStackedHabitTitle && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--forge-surface-high)]/60 border border-[var(--forge-border)] text-[var(--forge-secondary)] font-mono-forge text-[11px]">
                    <span className="text-xs">↳</span>
                    <span>
                      Next:{' '}
                      <strong className="text-[var(--forge-text-primary)] font-semibold">
                        {habit.nextStackedHabitTitle}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Temptation Bundle Preview */}
                {habit.temptationBundleUrl && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--forge-surface-high)]/60 border border-[var(--forge-border)] text-[var(--forge-tertiary)] font-mono-forge text-[11px]">
                    <Lock className="w-3 h-3 text-[var(--forge-tertiary)]" />
                    <span className="truncate">
                      Unlock:{' '}
                      <span className="text-[var(--forge-text-primary)] underline">
                        {habit.temptationLabel || habit.temptationBundleUrl}
                      </span>
                    </span>
                  </div>
                )}

                {/* 2-Minute Gateway Box */}
                <div className="bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--forge-primary-tint)] flex items-center justify-center text-[var(--forge-primary)] shrink-0 mt-0.5">
                      <DoorOpen className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono-forge text-[10px] text-[var(--forge-text-muted)] uppercase font-bold tracking-wider">
                        2-Min Gateway
                      </span>
                      <span className="text-xs sm:text-sm text-[var(--forge-text-primary)] font-medium truncate">
                        {habit.gatewayVersion}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded-lg bg-[var(--forge-flame-tint)] border border-[rgba(249,115,22,0.3)] text-[var(--forge-flame)] font-mono-forge text-[11px] font-bold shrink-0">
                    🔥 {habit.currentStreak}d
                  </span>
                </div>

                {/* Start Focus Timer CTA Button */}
                <button
                  onClick={() => onStartFocusSession(habit)}
                  className={`w-full py-3 px-4 rounded-xl font-mono-forge text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    isCompletedToday
                      ? 'bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] border border-[var(--forge-border)]'
                      : isRebound
                      ? 'bg-gradient-to-r from-[#8083ff] via-[#6f00be] to-[#b45309] hover:brightness-110 text-white shadow-[0_0_20px_rgba(128,131,255,0.45)]'
                      : 'bg-gradient-to-r from-[#8083ff] to-[#6f00be] hover:brightness-110 text-white shadow-[0_0_20px_rgba(128,131,255,0.35)]'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {isCompletedToday ? 'REVISIT FOCUS' : 'START 2-MIN TIMER'}
                  </span>
                </button>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
