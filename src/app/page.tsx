// src/app/page.tsx
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

export default async function ForgeOSPage() {
  let identities: SerializedIdentity[] = [];
  let habits: SerializedHabit[] = [];
  let sessions: SerializedSession[] = [];
  let dbError: string | null = null;
  let currentUser: UserProfile | null = null;

  try {
    const session = await auth();
    if (session?.user?.email) {
      currentUser = {
        name: session.user.name || session.user.email.split('@')[0],
        email: session.user.email,
        image: session.user.image || null,
      };
    }

    const activeUserId = currentUser?.email || 'demo-user';

    // Ensure starter identities/habits exist for this user
    await ensureUserWorkspaceSeeded(activeUserId);

    const rawIdentities = await prisma.identityVector.findMany({
      where: { userId: activeUserId },
      orderBy: { createdAt: 'asc' },
    });

    const rawHabits = await prisma.habit.findMany({
      where: { identity: { userId: activeUserId } },
      include: {
        identity: { select: { title: true } },
        nextStackedHabit: { select: { id: true, title: true } },
      },
      // Rebound habits & newest created habits always show at the very top!
      orderBy: [{ isReboundPriority: 'desc' }, { createdAt: 'desc' }],
    });

    const rawSessions = await prisma.sessionLog.findMany({
      where: { identity: { userId: activeUserId } },
      include: {
        habit: { select: { title: true } },
        identity: { select: { title: true } },
      },
      orderBy: { loggedAt: 'asc' },
    });

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
      identityTitle: h.identity.title,
      nextStackedHabitTitle: h.nextStackedHabit?.title ?? null,
      nextStackedHabitId: h.nextStackedHabit?.id ?? null,
    }));

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
      />
    </>
  );
}
