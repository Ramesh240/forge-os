// src/components/forge/VaultView.tsx
'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Lightbulb,
  Swords,
  ShieldCheck,
  Clock,
  Layers,
  Award,
} from 'lucide-react';
import { SerializedSession } from '../ForgeAppShell';

interface VaultViewProps {
  sessions: SerializedSession[];
}

export function VaultView({ sessions }: VaultViewProps) {
  const [vaultFilter, setVaultFilter] = useState<
    'ALL' | 'SYNTHESIS' | 'RESISTANCE' | 'BREAKTHROUGHS'
  >('ALL');

  const tacitInsightsCount = sessions.filter((s) => Boolean(s.tacitInsight)).length;
  const resistanceCount = sessions.filter((s) => s.isResistancePractice).length;
  const avgStrain =
    sessions.length > 0
      ? (
          sessions.reduce((sum, s) => sum + (s.frictionRating || 3), 0) /
          sessions.length
        ).toFixed(1)
      : '3.0';

  const filteredSessions = sessions.filter((s) => {
    if (vaultFilter === 'SYNTHESIS') return s.phase === 'ACTIVE';
    if (vaultFilter === 'RESISTANCE') return s.isResistancePractice;
    if (vaultFilter === 'BREAKTHROUGHS') return Boolean(s.tacitInsight);
    return true;
  });

  // Find a pinned or high-impact session insight
  const pinnedSession =
    sessions.find((s) => s.tacitInsight && s.isResistancePractice) ||
    sessions.find((s) => Boolean(s.tacitInsight)) ||
    null;

  return (
    <div className="flex flex-col space-y-6 pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & VAULT TELEMETRY
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[var(--forge-tertiary)] shadow-[0_0_8px_#4cd7f6]" />
          <span className="font-mono-forge text-[11px] font-bold text-[var(--forge-tertiary)] uppercase tracking-wider">
            Tacit Knowledge Stream
          </span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--forge-text-primary)] tracking-tight">
          Insights Vault & Session Logs
        </h2>
        <p className="text-xs text-[var(--forge-text-secondary)]">
          Crystallized mental models, bottleneck autopsies, and tacit breakthroughs.
        </p>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1b1b22]/90 border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="font-mono-forge text-[10px] text-[var(--forge-tertiary)] uppercase font-bold tracking-wider">
            Tacit Insights
          </span>
          <div className="font-mono-forge text-2xl font-bold text-[var(--forge-tertiary)] mt-1">
            {tacitInsightsCount}
            <span className="text-xs text-[var(--forge-text-muted)] font-normal ml-1">
              unlocked
            </span>
          </div>
        </div>

        <div className="bg-[#1b1b22]/90 border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="font-mono-forge text-[10px] text-[var(--forge-primary)] uppercase font-bold tracking-wider">
            Total Sessions
          </span>
          <div className="font-mono-forge text-2xl font-bold text-[var(--forge-primary)] mt-1">
            {sessions.length}
          </div>
        </div>

        <div className="bg-[#1b1b22]/90 border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="font-mono-forge text-[10px] text-[var(--forge-secondary)] uppercase font-bold tracking-wider">
            Avg Strain
          </span>
          <div className="font-mono-forge text-2xl font-bold text-[var(--forge-secondary)] mt-1">
            {avgStrain}
            <span className="text-xs text-[var(--forge-text-muted)] font-normal ml-0.5">
              / 5
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FILTER CHIPS MATRIX
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setVaultFilter('ALL')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-mono-forge text-[11px] font-bold tracking-wider transition-all flex items-center gap-1.5 ${
            vaultFilter === 'ALL'
              ? 'bg-[var(--forge-primary-btn)] text-white shadow-[0_0_12px_rgba(128,131,255,0.4)]'
              : 'bg-[#1b1b22] text-[var(--forge-text-muted)] hover:text-white border border-[var(--forge-border)]'
          }`}
        >
          <span>ALL ENTRIES</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px]">
            {sessions.length}
          </span>
        </button>

        <button
          onClick={() => setVaultFilter('BREAKTHROUGHS')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-mono-forge text-[11px] font-bold tracking-wider transition-all flex items-center gap-1.5 ${
            vaultFilter === 'BREAKTHROUGHS'
              ? 'bg-[var(--forge-tertiary-tint)] border border-[rgba(76,215,246,0.5)] text-[var(--forge-tertiary)] shadow-sm'
              : 'bg-[#1b1b22] text-[var(--forge-text-muted)] hover:text-white border border-[var(--forge-border)]'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>BREAKTHROUGHS</span>
        </button>

        <button
          onClick={() => setVaultFilter('RESISTANCE')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-mono-forge text-[11px] font-bold tracking-wider transition-all flex items-center gap-1.5 ${
            vaultFilter === 'RESISTANCE'
              ? 'bg-[var(--forge-secondary-tint)] border border-[rgba(221,183,255,0.5)] text-[var(--forge-secondary)] shadow-sm'
              : 'bg-[#1b1b22] text-[var(--forge-text-muted)] hover:text-white border border-[var(--forge-border)]'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>RESISTANCE (⚔)</span>
        </button>

        <button
          onClick={() => setVaultFilter('SYNTHESIS')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-mono-forge text-[11px] font-bold tracking-wider transition-all flex items-center gap-1.5 ${
            vaultFilter === 'SYNTHESIS'
              ? 'bg-[var(--forge-emerald-tint)] border border-[rgba(16,185,129,0.5)] text-[var(--forge-emerald)] shadow-sm'
              : 'bg-[#1b1b22] text-[var(--forge-text-muted)] hover:text-white border border-[var(--forge-border)]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>SYNTHESIS</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. PINNED INSIGHT OF THE WEEK / TACIT LAW
      ───────────────────────────────────────────────────────────── */}
      {pinnedSession && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#242430] via-[#1b1b24] to-[#14141a] p-4 sm:p-5 border border-[rgba(192,193,255,0.2)] shadow-xl">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--forge-primary)]" />
              <span className="font-mono-forge text-[11px] uppercase text-[var(--forge-primary)] tracking-widest font-bold">
                Tacit Law of Practice
              </span>
            </div>
            <span className="font-mono-forge text-[10px] text-[var(--forge-text-muted)] bg-[var(--forge-surface-highest)] px-2.5 py-0.5 rounded-full">
              PINNED INSIGHT
            </span>
          </div>

          <p className="text-sm sm:text-base text-[var(--forge-text-primary)] italic leading-relaxed mt-2 font-medium">
            "{pinnedSession.tacitInsight}"
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-white/5 font-mono-forge text-xs text-[var(--forge-text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--forge-tertiary)]" />
              <span className="text-white font-semibold">
                {pinnedSession.identityTitle}
              </span>
              <span className="text-[var(--forge-text-muted)]">•</span>
              <span>{pinnedSession.loggedAt.split('T')[0]}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[var(--forge-surface-highest)] text-[var(--forge-primary)] font-bold text-[10px]">
                +{pinnedSession.votesEarned} XP
              </span>
              <span className="px-2 py-0.5 rounded bg-[var(--forge-surface-highest)] text-[var(--forge-secondary)] font-bold text-[10px]">
                Tier {pinnedSession.frictionRating}/5 Friction
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. SESSION TELEMETRY STREAM FEED
      ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="font-mono-forge text-xs text-[var(--forge-text-secondary)] uppercase tracking-wider font-bold">
              Session Telemetry Stream
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--forge-tertiary)] animate-pulse" />
          </div>
          <span className="font-mono-forge text-[11px] text-[var(--forge-text-muted)]">
            {filteredSessions.length} sessions logged
          </span>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="bg-[#1b1b22]/70 border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-2">
            <BookOpen className="w-8 h-8 text-[var(--forge-text-muted)]" />
            <h4 className="text-sm font-bold text-[var(--forge-text-primary)]">
              No recorded sessions in this filter
            </h4>
            <p className="text-xs text-[var(--forge-text-muted)]">
              Complete focus timer sessions and log reflection debriefs to populate your vault.
            </p>
          </div>
        ) : (
          filteredSessions.map((s) => (
            <article
              key={s.id}
              className="flex flex-col rounded-2xl bg-[#1b1b24]/90 border border-[rgba(255,255,255,0.07)] shadow-lg overflow-hidden relative group hover:border-[rgba(192,193,255,0.2)] transition-all"
            >
              {/* Top Accent Gradient Bar */}
              <div
                className={`h-1 w-full ${
                  s.isResistancePractice
                    ? 'bg-gradient-to-r from-[#f43f5e] via-[#ddb7ff] to-[#8083ff]'
                    : 'bg-gradient-to-r from-[#8083ff] via-[#c0c1ff] to-[#4cd7f6]'
                }`}
              />

              <div className="p-4 sm:p-5 flex flex-col space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[var(--forge-text-primary)] truncate">
                      {s.habitTitle}
                    </h3>
                    <div className="flex items-center gap-2 font-mono-forge text-xs text-[var(--forge-text-secondary)] mt-0.5">
                      <span className="text-[var(--forge-primary)] font-semibold">
                        {s.identityTitle}
                      </span>
                      <span className="text-[var(--forge-text-muted)]">•</span>
                      <span className="text-[var(--forge-tertiary)] font-bold">
                        {s.durationMinutes} mins
                      </span>
                      <span className="text-[var(--forge-text-muted)]">•</span>
                      <span>{s.loggedAt.split('T')[0]}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {s.isResistancePractice && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--forge-secondary-tint)] border border-[rgba(221,183,255,0.3)] text-[var(--forge-secondary)] font-mono-forge text-[10px] font-bold flex items-center gap-1">
                        <Swords className="w-3 h-3" />
                        +{s.votesEarned}
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-full bg-[var(--forge-surface-high)] text-[var(--forge-text-primary)] font-mono-forge text-[10px] font-bold uppercase">
                      {s.phase}
                    </span>
                  </div>
                </div>

                {/* Bottleneck Attacked note */}
                {s.bottleneckAttacked && (
                  <div className="bg-[#141418] border border-white/5 rounded-xl p-3 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[var(--forge-tertiary-tint)] flex items-center justify-center text-[var(--forge-tertiary)] shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono-forge text-[10px] text-[var(--forge-tertiary)] uppercase font-bold tracking-wider">
                        Bottleneck Attacked
                      </span>
                      <p className="text-xs text-[var(--forge-text-primary)] mt-0.5 leading-relaxed">
                        {s.bottleneckAttacked}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tacit Insight note */}
                {s.tacitInsight && (
                  <div className="bg-[#181822] border border-[rgba(192,193,255,0.15)] rounded-xl p-3 flex items-start gap-2.5 shadow-[0_0_12px_rgba(192,193,255,0.05)]">
                    <div className="w-6 h-6 rounded-lg bg-[var(--forge-primary-tint)] flex items-center justify-center text-[var(--forge-primary)] shrink-0 mt-0.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono-forge text-[10px] text-[var(--forge-primary)] uppercase font-bold tracking-wider">
                        Tacit Insight Crystallized
                      </span>
                      <p className="text-xs text-[var(--forge-text-primary)] italic mt-0.5 leading-relaxed">
                        "{s.tacitInsight}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
