// src/app/page.tsx
import { prisma } from '@/lib/prisma';
import ForgeAppShell, {
  SerializedIdentity,
  SerializedHabit,
  SerializedSession,
} from '@/components/ForgeAppShell';

export const dynamic = 'force-dynamic';

export default async function ForgeOSPage() {
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
}
