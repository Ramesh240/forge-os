// src/app/page.tsx
import { prisma } from '@/lib/prisma';
import ForgeAppShell, {
  SerializedIdentity,
  SerializedHabit,
  SerializedSession,
} from '@/components/ForgeAppShell';
import { Database, RefreshCw, Key } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ForgeOSPage() {
  try {
    const rawIdentities = await prisma.identityVector.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const rawHabits = await prisma.habit.findMany({
      include: {
        identity: { select: { title: true } },
        nextStackedHabit: { select: { id: true, title: true } },
      },
      orderBy: [{ isReboundPriority: 'desc' }, { currentStreak: 'desc' }],
    });

    const rawSessions = await prisma.sessionLog.findMany({
      include: {
        habit: { select: { title: true } },
        identity: { select: { title: true } },
      },
      orderBy: { loggedAt: 'asc' },
    });

    const identities: SerializedIdentity[] = rawIdentities.map((i) => ({
      id: i.id,
      title: i.title,
      lifesTaskStatement: i.lifesTaskStatement,
      totalVotes: i.totalVotes,
      weightedScore: Number(i.weightedScore.toFixed(2)),
      totalHoursLogged: Number(i.totalHoursLogged.toFixed(1)),
      currentPhase: i.currentPhase,
    }));

    const habits: SerializedHabit[] = rawHabits.map((h) => ({
      id: h.id,
      identityId: h.identityId,
      title: h.title,
      gatewayVersion: h.gatewayVersion,
      defaultPhase: h.defaultPhase,
      anchorHabitId: h.anchorHabitId ?? null,
      temptationBundleUrl: h.temptationBundleUrl,
      temptationLabel: h.temptationLabel,
      currentStreak: h.currentStreak,
      missedYesterday: h.missedYesterday,
      isReboundPriority: h.isReboundPriority,
      downscaledDaysRemaining: h.downscaledDaysRemaining ?? 0,
      identityTitle: h.identity.title,
      nextStackedHabitTitle: h.nextStackedHabit?.title ?? null,
      nextStackedHabitId: h.nextStackedHabit?.id ?? null,
    }));

    const sessions: SerializedSession[] = rawSessions.map((s) => ({
      id: s.id,
      habitId: s.habitId,
      identityId: s.identityId,
      habitTitle: s.habit.title,
      identityTitle: s.identity.title,
      phase: s.phase,
      durationMinutes: s.durationMinutes,
      completedGatewayOnly: s.completedGatewayOnly,
      isResistancePractice: s.isResistancePractice,
      frictionRating: s.frictionRating,
      bottleneckAttacked: s.bottleneckAttacked ?? null,
      tacitInsight: s.tacitInsight ?? null,
      votesEarned: s.votesEarned,
      loggedAt: s.loggedAt.toISOString(),
    }));

    return (
      <ForgeAppShell
        identities={identities}
        habits={habits}
        sessions={sessions}
      />
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Database Diagnostic Mode
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Unreachable
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                ForgeOS could not establish a connection to your PostgreSQL database.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 font-mono space-y-1 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
              Prisma Error Output:
            </span>
            <p className="whitespace-pre-wrap break-all">{errorMsg}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-400" />
              Vercel Deployment Checklist:
            </h2>
            <ul className="space-y-2 text-xs text-zinc-300 list-disc list-inside">
              <li>
                <strong className="text-white">DATABASE_URL:</strong> Ensure Port <code className="text-indigo-300">6543</code> (Transaction Pooler) is used and ends with <code className="text-indigo-300">?pgbouncer=true</code>.
              </li>
              <li>
                <strong className="text-white">DIRECT_URL:</strong> Ensure Port <code className="text-indigo-300">5432</code> (Session Pooler) is set in Vercel Environment Variables.
              </li>
              <li>
                <strong className="text-white">Password Characters:</strong> If your Supabase password contains special characters (<code className="text-amber-300">@</code>, <code className="text-amber-300">#</code>, <code className="text-amber-300">$</code>), URL-encode them or reset to alphanumeric in Supabase.
              </li>
              <li>
                <strong className="text-white">Supabase Status:</strong> Confirm your project is not paused in the Supabase Dashboard.
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              ForgeOS Health Monitor
            </span>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </a>
          </div>
        </div>
      </main>
    );
  }
}
