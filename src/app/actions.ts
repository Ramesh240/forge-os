// src/app/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { calculateSessionScore, SkillStage } from '@/lib/forge-engine';
import { revalidatePath } from 'next/cache';

export async function logForgeSession(data: {
  habitId: string;
  identityId: string;
  phase: SkillStage;
  durationMinutes: number;
  completedGatewayOnly: boolean;
  isResistancePractice: boolean;
  frictionRating: number;
  bottleneckAttacked?: string;
  tacitInsight?: string;
}) {
  const habit = await prisma.habit.findUnique({ where: { id: data.habitId } });
  if (!habit) throw new Error('Habit not found');

  const votesEarned = calculateSessionScore({
    phase: data.phase,
    isChallengeMode: data.isResistancePractice,
    isRecoveryBonus: habit.isReboundPriority,
    durationMinutes: data.durationMinutes,
    completedMicroOnly: data.completedGatewayOnly,
  });

  const hoursAdded = Number((data.durationMinutes / 60).toFixed(2));
  const todayStr = new Date().toISOString().split('T')[0];
  const isNewDayCompletion = habit.lastCompletedDate !== todayStr;

  await prisma.$transaction([
    prisma.sessionLog.create({
      data: {
        habitId: data.habitId,
        identityId: data.identityId,
        phase: data.phase,
        durationMinutes: data.durationMinutes,
        completedGatewayOnly: data.completedGatewayOnly,
        isResistancePractice: data.isResistancePractice,
        frictionRating: data.frictionRating,
        bottleneckAttacked: data.bottleneckAttacked?.trim() || null,
        tacitInsight: data.tacitInsight?.trim() || null,
        votesEarned,
      },
    }),
    prisma.habit.update({
      where: { id: data.habitId },
      data: {
        currentStreak: isNewDayCompletion ? { increment: 1 } : undefined,
        missedYesterday: false,
        isReboundPriority: false,
        downscaledDaysRemaining:
          habit.downscaledDaysRemaining > 0 ? { decrement: 1 } : 0,
        lastCompletedDate: todayStr,
      },
    }),
    prisma.identityVector.update({
      where: { id: data.identityId },
      data: {
        totalVotes: { increment: 1 },
        weightedScore: { increment: votesEarned },
        totalHoursLogged: { increment: hoursAdded },
      },
    }),
  ]);

  try {
    revalidatePath('/');
  } catch {}
  return { votesEarned };
}

export async function createIdentityVector(data: {
  title: string;
  lifesTaskStatement: string;
  currentPhase: string;
}) {
  const created = await prisma.identityVector.create({
    data: {
      title: data.title.trim(),
      lifesTaskStatement: data.lifesTaskStatement.trim(),
      currentPhase: data.currentPhase,
    },
  });
  try {
    revalidatePath('/');
  } catch {}
  return created;
}

export async function createStackedHabit(data: {
  identityId: string;
  title: string;
  gatewayVersion: string;
  defaultPhase: SkillStage;
  anchorHabitId?: string | null;
  temptationLabel?: string | null;
  temptationBundleUrl?: string | null;
}) {
  const anchorId =
    data.anchorHabitId && data.anchorHabitId !== 'NONE' ? data.anchorHabitId : null;

  await prisma.$transaction(async (tx) => {
    let displacedHabitId: string | null = null;
    if (anchorId) {
      const existingNext = await tx.habit.findUnique({
        where: { anchorHabitId: anchorId },
      });
      if (existingNext) {
        displacedHabitId = existingNext.id;
        await tx.habit.update({
          where: { id: existingNext.id },
          data: { anchorHabitId: null },
        });
      }
    }

    const created = await tx.habit.create({
      data: {
        identityId: data.identityId,
        title: data.title.trim(),
        gatewayVersion: data.gatewayVersion.trim(),
        defaultPhase: data.defaultPhase,
        anchorHabitId: anchorId,
        temptationLabel: data.temptationLabel?.trim() || null,
        temptationBundleUrl: data.temptationBundleUrl?.trim() || null,
      },
    });

    if (displacedHabitId) {
      await tx.habit.update({
        where: { id: displacedHabitId },
        data: { anchorHabitId: created.id },
      });
    }
  });

  try {
    revalidatePath('/');
  } catch {}
}

export async function seedSampleChainHistory() {
  const habits = await prisma.habit.findMany();
  if (habits.length === 0) return;

  const today = new Date();
  const sampleLogs = [];

  for (let i = 21; i >= 0; i--) {
    if (i === 5 || i === 12) continue; // 2 single-day misses to demonstrate Streak Shield

    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);

    const habit = habits[i % habits.length];
    const isMicro = i === 3 || i === 10;
    const isChallenge = i === 1 || i === 4 || i === 7 || i === 11 || i === 15;
    const isRecovery = i === 4 || i === 11;
    const phase = (habit.defaultPhase as SkillStage) || 'PRACTICE';
    const durationMinutes = isMicro ? 2 : isChallenge ? 45 : 25 + (i % 3) * 10;
    const frictionRating = isChallenge ? 5 : isMicro ? 2 : 3 + (i % 2);

    const votesEarned = calculateSessionScore({
      phase,
      isChallengeMode: isChallenge,
      isRecoveryBonus: isRecovery,
      durationMinutes,
      completedMicroOnly: isMicro,
    });

    sampleLogs.push({
      habitId: habit.id,
      identityId: habit.identityId,
      phase,
      durationMinutes,
      completedGatewayOnly: isMicro,
      isResistancePractice: isChallenge,
      frictionRating,
      bottleneckAttacked: isChallenge
        ? 'Resolved high-complexity performance bottleneck under time pressure'
        : null,
      tacitInsight: isChallenge
        ? 'Decompose state transitions before writing implementation code.'
        : null,
      votesEarned,
      loggedAt: logDate,
    });
  }

  await prisma.sessionLog.createMany({ data: sampleLogs });
  try {
    revalidatePath('/');
  } catch {}
}

export async function runMidnightGuardrailAudit(_simulateDayRollover?: boolean) {
  const habits = await prisma.habit.findMany();
  await prisma.$transaction(
    habits.map((h) => {
      const missedTwice = h.missedYesterday;
      return prisma.habit.update({
        where: { id: h.id },
        data: {
          currentStreak: missedTwice ? 0 : h.currentStreak,
          missedYesterday: true,
          isReboundPriority: true,
          downscaledDaysRemaining: missedTwice ? 3 : h.downscaledDaysRemaining,
          lastCompletedDate: null,
        },
      });
    })
  );
  try {
    revalidatePath('/');
  } catch {}
}

export async function updateIdentityVector(data: {
  id: string;
  title: string;
  lifesTaskStatement: string;
  currentPhase: string;
}) {
  await prisma.identityVector.update({
    where: { id: data.id },
    data: {
      title: data.title.trim(),
      lifesTaskStatement: data.lifesTaskStatement.trim(),
      currentPhase: data.currentPhase,
    },
  });
  try {
    revalidatePath('/');
  } catch {}
}

export async function deleteIdentityVector(id: string) {
  // First clear anchorHabitId links on habits belonging to this identity to avoid unique/FK conflicts in SQLite
  await prisma.habit.updateMany({
    where: { identityId: id },
    data: { anchorHabitId: null },
  });

  await prisma.identityVector.delete({
    where: { id },
  });
  try {
    revalidatePath('/');
  } catch {}
}

export async function updateStackedHabit(data: {
  id: string;
  identityId: string;
  title: string;
  gatewayVersion: string;
  defaultPhase: SkillStage;
  anchorHabitId?: string | null;
  temptationLabel?: string | null;
  temptationBundleUrl?: string | null;
}) {
  const newAnchorId =
    data.anchorHabitId &&
    data.anchorHabitId !== 'NONE' &&
    data.anchorHabitId !== data.id
      ? data.anchorHabitId
      : null;

  await prisma.$transaction(async (tx) => {
    const current = await tx.habit.findUnique({
      where: { id: data.id },
      include: { nextStackedHabit: true },
    });
    if (!current) throw new Error('Habit not found');

    const anchorChanged = (current.anchorHabitId ?? null) !== newAnchorId;

    if (anchorChanged) {
      // 1. Detach current habit from its old anchor first
      await tx.habit.update({
        where: { id: data.id },
        data: { anchorHabitId: null },
      });

      // 2. If another habit was chained AFTER this habit, detach it and heal the old gap
      if (current.nextStackedHabit) {
        await tx.habit.update({
          where: { id: current.nextStackedHabit.id },
          data: { anchorHabitId: null },
        });

        if (current.anchorHabitId) {
          await tx.habit.update({
            where: { id: current.nextStackedHabit.id },
            data: { anchorHabitId: current.anchorHabitId },
          });
        }
      }

      // 3. If the new anchor already has a downstream habit, temporarily detach it so we can splice in
      let displacedDownstreamId: string | null = null;
      if (newAnchorId) {
        const existingDownstream = await tx.habit.findUnique({
          where: { anchorHabitId: newAnchorId },
        });
        if (existingDownstream && existingDownstream.id !== data.id) {
          displacedDownstreamId = existingDownstream.id;
          await tx.habit.update({
            where: { id: existingDownstream.id },
            data: { anchorHabitId: null },
          });
        }
      }

      // 4. Attach current habit to newAnchorId
      await tx.habit.update({
        where: { id: data.id },
        data: { anchorHabitId: newAnchorId },
      });

      // 5. Re-attach displaced downstream habit right after current habit
      if (displacedDownstreamId) {
        await tx.habit.update({
          where: { id: displacedDownstreamId },
          data: { anchorHabitId: data.id },
        });
      }
    }

    // Update core habit fields
    await tx.habit.update({
      where: { id: data.id },
      data: {
        identityId: data.identityId,
        title: data.title.trim(),
        gatewayVersion: data.gatewayVersion.trim(),
        defaultPhase: data.defaultPhase,
        temptationLabel: data.temptationLabel?.trim() || null,
        temptationBundleUrl: data.temptationBundleUrl?.trim() || null,
      },
    });
  });

  try {
    revalidatePath('/');
  } catch {}
}

export async function deleteStackedHabit(id: string) {
  await prisma.$transaction(async (tx) => {
    const habit = await tx.habit.findUnique({
      where: { id },
      include: { nextStackedHabit: true },
    });
    if (!habit) return;

    const parentAnchorId = habit.anchorHabitId;
    const childHabitId = habit.nextStackedHabit?.id ?? null;

    // Detach links before deleting
    if (childHabitId) {
      await tx.habit.update({
        where: { id: childHabitId },
        data: { anchorHabitId: null },
      });
    }

    await tx.habit.update({
      where: { id },
      data: { anchorHabitId: null },
    });

    await tx.habit.delete({ where: { id } });

    // Heal the chain: [Parent] -> [Child]
    if (childHabitId && parentAnchorId) {
      await tx.habit.update({
        where: { id: childHabitId },
        data: { anchorHabitId: parentAnchorId },
      });
    }
  });

  try {
    revalidatePath('/');
  } catch {}
}

