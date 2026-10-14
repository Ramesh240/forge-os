// src/components/TacitKnowledgeVault.tsx
'use client';

import React from 'react';
import { BookOpen, Swords, Sparkles, Gauge } from 'lucide-react';

interface JournalSession {
  id: string;
  phase: string;
  durationMinutes: number;
  isResistancePractice: boolean;
  frictionRating: number;
  bottleneckAttacked: string | null;
  tacitInsight: string | null;
  votesEarned: number;
  loggedAt: string | Date;
  habit: { title: string };
  identity: { title: string };
}

export default function TacitKnowledgeVault({
  sessions,
}: {
  sessions: JournalSession[];
}) {
  const journaledSessions = sessions
    .filter((s) => s.bottleneckAttacked || s.tacitInsight)
    .slice()
    .reverse();

  return (
    <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Tacit Knowledge Vault &amp; Resistance Field Notes
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Compendium of bottlenecks attacked and mental model breakthroughs logged after Deep-Work HUD sessions.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
          {journaledSessions.length} Field Notes Logged
        </span>
      </div>

      {journaledSessions.length === 0 ? (
        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-1">
          <p className="text-sm text-zinc-300 font-semibold">
            Your Tacit Knowledge Vault is empty.
          </p>
          <p className="text-xs text-zinc-500">
            Launch the <strong>Focus HUD</strong> on any habit, press <code className="text-indigo-400">Enter</code> to open the Post-Session Debrief, and record a bottleneck or insight.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journaledSessions.map((entry) => {
            const dateLabel = new Date(entry.loggedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={entry.id}
                className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {entry.identity.title}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">{dateLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="flex items-center gap-1 text-amber-400">
                        <Gauge className="w-3.5 h-3.5" /> Friction {entry.frictionRating}/5
                      </span>
                      {entry.isResistancePractice && (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                          ⚔️ 1.5x Resistance
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white">{entry.habit.title}</h3>

                  {entry.bottleneckAttacked && (
                    <div className="p-3 rounded-lg bg-rose-950/25 border border-rose-500/30 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                        <Swords className="w-3 h-3" /> Bottleneck Attacked
                      </span>
                      <p className="text-zinc-200">{entry.bottleneckAttacked}</p>
                    </div>
                  )}

                  {entry.tacitInsight && (
                    <div className="p-3 rounded-lg bg-emerald-950/25 border border-emerald-500/30 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Tacit Insight Unlocked
                      </span>
                      <p className="text-zinc-200">{entry.tacitInsight}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-900 flex justify-between text-[11px] text-zinc-500 font-mono">
                  <span>
                    {entry.phase} • {entry.durationMinutes} mins
                  </span>
                  <span className="text-emerald-400 font-bold">
                    +{entry.votesEarned} Identity Votes
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
