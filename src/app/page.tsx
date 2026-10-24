// src/app/page.tsx
import { Suspense } from 'react';
import Loading from './loading';
import { prisma } from '@/lib/prisma';
import { auth, isGoogleAuthConfigured } from '@/auth';
import { ensureUserWorkspaceSeeded } from '@/app/actions';
import ForgeAppShell, {
  SerializedIdentity,
  SerializedHabit,
  SerializedSession,
  UserProfile,
} from '@/components/ForgeAppShell';

export const dynamic = 'force-dynamic';

export default function ForgeOSPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ForgeOSDataLayer />
    </Suspense>
  );
}

async function ForgeOSDataLayer() {
  let identities: SerializedIdentity[] = [];
  let habits: SerializedHabit[] = [];
  let sessions: SerializedSession[] = [];
  let dbError: string | null = null;
  let currentUser: UserProfile | null = null;
  let isPro = false;

  try {
    const session = await auth().catch(() => null);
    if (session?.user?.email) {
      currentUser = {
        name: session.user.name || session.user.email.split('@')[0],
        email: session.user.email,
        image: session.user.image || null,
      };
    }

    const activeUserId = currentUser?.email || 'demo-user';

    // Parallel fetch: get identities, habits, and sessions in ONE single concurrent roundtrip
    let [rawIdentities, rawHabits, rawSessions] = await Promise.all([
      prisma.identityVector.findMany({
        where: { userId: activeUserId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.habit.findMany({
        where: { identity: { userId: activeUserId } },
        include: {
          identity: { select: { title: true } },
          nextStackedHabit: { select: { id: true, title: true } },
        },
        // Order by rebound priority and creation date in database; pinned habits sorted in memory
        orderBy: [
          { isReboundPriority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.sessionLog.findMany({
        where: { identity: { userId: activeUserId } },
        include: {
          habit: { select: { title: true } },
          identity: { select: { title: true } },
        },
        orderBy: [{ loggedAt: 'asc' }],
      }),
    ]);

    // If completely empty workspace, seed starter identities/habits and refetch once
    if (rawIdentities.length === 0) {
      await ensureUserWorkspaceSeeded(activeUserId);
      [rawIdentities, rawHabits, rawSessions] = await Promise.all([
        prisma.identityVector.findMany({
          where: { userId: activeUserId },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.habit.findMany({
          where: { identity: { userId: activeUserId } },
          include: {
            identity: { select: { title: true } },
            nextStackedHabit: { select: { id: true, title: true } },
          },
          orderBy: [{ isReboundPriority: 'desc' }, { createdAt: 'desc' }],
        }),
        prisma.sessionLog.findMany({
          where: { identity: { userId: activeUserId } },
          include: {
            habit: { select: { title: true } },
            identity: { select: { title: true } },
          },
          orderBy: [{ loggedAt: 'asc' }],
        }),
      ]);
    }

    // Check Pro status directly from memory + env (Zero extra database roundtrips)
    const betaTestersRaw = process.env.BETA_TESTER_EMAILS || '';
    const isBetaTester = betaTestersRaw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
      .includes(activeUserId.toLowerCase());

    isPro = isBetaTester || rawIdentities.some((i) => i.isPro);

    identities = rawIdentities.map((i) => ({
      id: i.id,
      title: i.title,
      lifesTaskStatement: i.lifesTaskStatement,
      totalVotes: i.totalVotes,
      weightedScore: Number(i.weightedScore.toFixed(2)),
      totalHoursLogged: Number(i.totalHoursLogged.toFixed(1)),
      currentPhase: i.currentPhase,
    }));

    habits = rawHabits.map((h) => ({
      id: h.id,
      identityId: h.identityId,
      title: h.title,
      gatewayVersion: h.gatewayVersion,
      defaultPhase: h.defaultPhase,
      anchorHabitId: h.anchorHabitId ?? null,
      reminderTime: h.reminderTime ?? null,
      lastCompletedDate: h.lastCompletedDate ?? null,
      temptationBundleUrl: h.temptationBundleUrl,
      temptationLabel: h.temptationLabel,
      currentStreak: h.currentStreak,
      missedYesterday: h.missedYesterday,
      isReboundPriority: h.isReboundPriority,
      downscaledDaysRemaining: h.downscaledDaysRemaining ?? 0,
      isArchived: Boolean((h as { isArchived?: boolean }).isArchived),
      isPinned: Boolean((h as { isPinned?: boolean }).isPinned),
      dailyGoalMinutes: Number((h as { dailyGoalMinutes?: number }).dailyGoalMinutes ?? 0),
      weeklyGoalDays: Number((h as { weeklyGoalDays?: number }).weeklyGoalDays ?? 0),
      identityTitle: h.identity.title,
      nextStackedHabitTitle: h.nextStackedHabit?.title ?? null,
      nextStackedHabitId: h.nextStackedHabit?.id ?? null,
    }));

    // Lock pinned habits to the top of the queue
    habits.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    sessions = rawSessions.map((s) => ({
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
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : 'Database connection error';
  }

  return (
    <>
      {dbError && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 px-4 py-3 text-xs text-rose-200">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              <strong>Database Notice:</strong> Ensure Supabase <code>DATABASE_URL</code> is configured in <code>.env.local</code> (locally) or Vercel Environment Variables.
            </span>
            <code className="text-[11px] bg-black/40 px-2 py-1 rounded text-rose-300 truncate max-w-md">
              {dbError}
            </code>
          </div>
        </div>
      )}
      <ForgeAppShell
        identities={identities}
        habits={habits}
        sessions={sessions}
        currentUser={currentUser}
        googleAuthEnabled={isGoogleAuthConfigured}
        isPro={isPro}
      />
    </>
  );
}
