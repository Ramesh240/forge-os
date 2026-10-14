// src/app/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth, signIn, signOut } from '@/auth';
import { calculateSessionScore, SkillStage } from '@/lib/forge-engine';
import { revalidatePath } from 'next/cache';

export async function getActiveUserId(): Promise<string> {
  try {
    const session = await auth();
    return session?.user?.email || 'demo-user';
  } catch {
    return 'demo-user';
  }
}

export async function signInWithGoogleAction() {
  await signIn('google', { redirectTo: '/' });
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}

/**
 * Ensures a newly signed-in Google user gets a starter set of Identities & Habits
 * if their workspace is completely empty.
 */
export async function ensureUserWorkspaceSeeded(userId: string) {
  const count = await prisma.identityVector.count({
    where: { userId },
  });

  if (count > 0) return;

  const algo = await prisma.identityVector.create({
    data: {
      userId,
      title: 'Algorithms Specialist',
      lifesTaskStatement: 'Master algorithmic problem-solving and data structures.',
      currentPhase: 'PRACTICE',
    },
  });

  const arch = await prisma.identityVector.create({
    data: {
      userId,
      title: 'Systems Architect',
      lifesTaskStatement: 'Design resilient, high-throughput full-stack systems.',
      currentPhase: 'EXPERIMENTATION',
    },
  });

  const h1 = await prisma.habit.create({
    data: {
      identityId: algo.id,
      title: 'Review 15 Technical Flashcards',
      gatewayVersion: 'Review just 5 cards (2 mins)',
      defaultPhase: 'PASSIVE',
      currentStreak: 1,
    },
  });

  await prisma.habit.create({
    data: {
      identityId: arch.id,
      title: 'Build or Optimize 1 Backend Endpoint / Query',
      gatewayVersion: 'Open IDE and write function signature (2 mins)',
      defaultPhase: 'ACTIVE',
      anchorHabitId: h1.id,
      currentStreak: 1,
    },
  });
}

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
  const habit = await prisma.habit.findUnique({
    where: { id: data.habitId },
  });
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
        downscaledDaysRemaining: habit.downscaledDaysRemaining > 0 ? { decrement: 1 } : 0,
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

  revalidatePath('/');
  return { votesEarned };
}

export async function createIdentityVector(data: {
  title: string;
  lifesTaskStatement: string;
  currentPhase: string;
}) {
  const userId = await getActiveUserId();
  const created = await prisma.identityVector.create({
    data: {
      userId,
      title: data.title.trim(),
      lifesTaskStatement: data.lifesTaskStatement.trim(),
      currentPhase: data.currentPhase,
    },
  });

  revalidatePath('/');
  return created;
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

  revalidatePath('/');
}

export async function deleteIdentityVector(id: string) {
  await prisma.habit.updateMany({
    where: { identityId: id },
    data: { anchorHabitId: null },
  });

  await prisma.identityVector.delete({
    where: { id },
  });

  revalidatePath('/');
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
  const anchorId = data.anchorHabitId && data.anchorHabitId !== 'NONE' ? data.anchorHabitId : null;

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

  revalidatePath('/');
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
    data.anchorHabitId && data.anchorHabitId !== 'NONE' && data.anchorHabitId !== data.id
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
      await tx.habit.update({
        where: { id: data.id },
        data: { anchorHabitId: null },
      });

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

      await tx.habit.update({
        where: { id: data.id },
        data: { anchorHabitId: newAnchorId },
      });

      if (displacedDownstreamId) {
        await tx.habit.update({
          where: { id: displacedDownstreamId },
          data: { anchorHabitId: data.id },
        });
      }
    }

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

  revalidatePath('/');
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

    await tx.habit.delete({
      where: { id },
    });

    if (childHabitId && parentAnchorId) {
      await tx.habit.update({
        where: { id: childHabitId },
        data: { anchorHabitId: parentAnchorId },
      });
    }
  });

  revalidatePath('/');
}

export async function seedSampleChainHistory() {
  const userId = await getActiveUserId();
  const habits = await prisma.habit.findMany({
    where: { identity: { userId } },
  });

  if (habits.length === 0) return;

  const today = new Date();
  const sampleLogs = [];

  for (let i = 21; i >= 0; i--) {
    if (i === 5 || i === 12) continue;

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

  await prisma.sessionLog.createMany({
    data: sampleLogs,
  });

  revalidatePath('/');
}

export async function runMidnightGuardrailAudit() {
  const userId = await getActiveUserId();
  const habits = await prisma.habit.findMany({
    where: { identity: { userId } },
  });

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

  revalidatePath('/');
}
