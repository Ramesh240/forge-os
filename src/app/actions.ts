// src/app/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth, signIn, signOut } from '@/auth';
import {
  calculateSessionScore,
  IDENTITY_PRESETS,
  SkillStage,
  FORGE_APP_VERSION,
} from '@/lib/forge-engine';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export async function getActiveUserId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.email) return session.user.email.toLowerCase();
  } catch {
    // Continue with the per-install guest identity when OAuth is unavailable.
  }

  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get('forge_guest_id')?.value;
    const isValidGuestId =
      guestId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(guestId);
    if (isValidGuestId) return `guest:${guestId.toLowerCase()}`;
  } catch {
    // Fallback if cookies() is inaccessible outside request context
  }

  // Safe fallback to default guest workspace — prevents crashes on first load or in WebViews
  return 'demo-user';
}

/**
 * Checks whether a user has ForgeOS Pro unlocked:
 * - Free lifetime access if their email/userId is in process.env.BETA_TESTER_EMAILS
 * - Pro unlocked if any IdentityVector for that user has isPro: true
 */
export async function checkUserProStatus(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;

    // Local development has Pro enabled so developers never need to purchase it.
    if (process.env.NODE_ENV === 'development') return true;

    // Check environment variable beta tester list
    const betaTestersRaw = process.env.BETA_TESTER_EMAILS || '';
    const betaTesterEmails = betaTestersRaw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (betaTesterEmails.includes(userId.toLowerCase())) {
      return true;
    }

    // Check if any IdentityVector for this user has isPro: true
    const proVector = await prisma.identityVector.findFirst({
      where: {
        userId,
        isPro: true,
      },
      select: { id: true },
    });

    return !!proVector;
  } catch (error) {
    console.error('Error checking user pro status:', error);
    return false;
  }
}

/**
 * Redeems ForgeOS Pro lifetime access using a Play Store Beta Tester code
 * using the configured process.env.BETA_ACCESS_CODE.
 */
export async function redeemProAccessAction(
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getActiveUserId();
    const cleanCode = (code || '').trim().toUpperCase();
    const configuredCode = process.env.BETA_ACCESS_CODE?.trim();
    if (!configuredCode) {
      return { success: false, error: 'Tester access codes are not enabled.' };
    }
    const validCode = configuredCode.toUpperCase();

    if (cleanCode !== validCode) {
      return {
        success: false,
        error: 'Invalid tester code. Please contact support.',
      };
    }

    // Ensure user has at least one IdentityVector seeded
    await ensureUserWorkspaceSeeded(userId);

    const updateResult = await prisma.identityVector.updateMany({
      where: { userId },
      data: { isPro: true },
    });

    if (updateResult.count === 0) {
      await prisma.identityVector.create({
        data: {
          userId,
          title: 'Algorithms Specialist',
          lifesTaskStatement: 'Master algorithmic problem solving and system architecture.',
          currentPhase: 'OBSERVATION',
          isPro: true,
        },
      });
    }

    try {
      revalidatePath('/');
    } catch {
      // safe fallback outside request context
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to redeem pro access:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while redeeming your code. Please try again.',
    };
  }
}

/**
 * Resets the Pro status back to false for the active user (convenient for testing paywalls).
 */
export async function resetProStatusAction(): Promise<{ success: boolean; error?: string }> {
  if (process.env.NODE_ENV !== 'development') {
    return {
      success: false,
      error: 'Pro status reset is disabled in production.',
    };
  }

  try {
    const userId = await getActiveUserId();
    await prisma.identityVector.updateMany({
      where: { userId },
      data: { isPro: false },
    });
    try {
      revalidatePath('/');
    } catch {
      // safe fallback outside request context
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to reset pro access:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while resetting status.',
    };
  }
}

export async function signInWithGoogleAction() {
  await signIn('google', { redirectTo: '/' });
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}

/**
 * Permanently deletes all user identities, habit chains, and focus sessions,
 * complying with Google Play Store & privacy policies, then signs out the user.
 */
export async function deleteUserAccountAndData() {
  const userId = await getActiveUserId();

  const userIdentities = await prisma.identityVector.findMany({
    where: { userId },
    select: { id: true },
  });
  const identityIds = userIdentities.map((i) => i.id);

  if (identityIds.length > 0) {
    // 1. Break self-referential anchorHabitId links to prevent foreign key constraint violations
    await prisma.habit.updateMany({
      where: { identityId: { in: identityIds } },
      data: { anchorHabitId: null },
    });

    // 2. Delete all SessionLogs explicitly
    await prisma.sessionLog.deleteMany({
      where: { identityId: { in: identityIds } },
    });

    // 3. Delete all Habits
    await prisma.habit.deleteMany({
      where: { identityId: { in: identityIds } },
    });

    // 4. Delete all IdentityVectors
    await prisma.identityVector.deleteMany({
      where: { userId },
    });
  }

  await prisma.playPurchase.deleteMany({ where: { userId } });
  await prisma.razorpayPayment.deleteMany({ where: { userId } });

  const cookieStore = await cookies();
  cookieStore.set('forge_guest_id', randomUUID(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath('/');
  await signOut({ redirectTo: '/' });
}

/**
 * Ensures a newly signed-in Google user gets a starter set of Identities & Habits
 * if their workspace is completely empty.
 */
export async function ensureUserWorkspaceSeeded(userId: string) {
  const count = await prisma.identityVector.count({ where: { userId } });
  if (count > 0) return;

  // Seed 4 universal, relatable identities so any user can start immediately
  const starterKeys = [
    'deep-worker',
    'vitality-athlete',
    'software-craftsman',
    'lifelong-scholar',
  ];

  const createdMap = new Map<string, string>();
  const isPro = await checkUserProStatus(userId);

  for (const key of starterKeys) {
    const preset = IDENTITY_PRESETS.find((p) => p.key === key);
    if (!preset) continue;

    const created = await prisma.identityVector.create({
      data: {
        userId,
        title: preset.title,
        lifesTaskStatement: preset.lifesTaskStatement,
        currentPhase: preset.defaultPhase,
        isPro,
      },
    });
    createdMap.set(key, created.id);
  }

  // Seed 3 starter habits across these generalized identities
  const deepWorkId = createdMap.get('deep-worker');
  const vitalityId = createdMap.get('vitality-athlete');
  const scholarId = createdMap.get('lifelong-scholar');

  if (scholarId && deepWorkId && vitalityId) {
    const h1 = await prisma.habit.create({
      data: {
        identityId: scholarId,
        title: 'Read 10 Pages or Review 15 Flashcards',
        gatewayVersion: 'Open book/app and complete just 1 page or 5 cards (2 mins)',
        defaultPhase: 'PASSIVE',
        currentStreak: 1,
      },
    });

    await prisma.habit.create({
      data: {
        identityId: deepWorkId,
        title: 'Complete 1 Uninterrupted 45-Min Deep Work Block',
        gatewayVersion: 'Silence phone and write down your single target outcome (2 mins)',
        defaultPhase: 'ACTIVE',
        anchorHabitId: h1.id,
        currentStreak: 1,
      },
    });

    await prisma.habit.create({
      data: {
        identityId: vitalityId,
        title: '25-Min Strength & Mobility Workout',
        gatewayVersion: 'Put on workout shoes and do 5 warmup reps (2 mins)',
        defaultPhase: 'PRACTICE',
        currentStreak: 1,
      },
    });
  }
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
  const userId = await getActiveUserId();
  const habit = await prisma.habit.findFirst({
    where: { id: data.habitId, identity: { userId } },
  });
  if (!habit) throw new Error('Habit not found or unauthorized');

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
  const userId = await getActiveUserId();
  const existing = await prisma.identityVector.findFirst({
    where: { id: data.id, userId },
  });
  if (!existing) throw new Error('Identity not found or unauthorized');

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
  const userId = await getActiveUserId();
  const existing = await prisma.identityVector.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error('Identity not found or unauthorized');

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
  identityId: string; // Can be a DB id OR "preset:<key>"
  title: string;
  gatewayVersion: string;
  defaultPhase: SkillStage;
  anchorHabitId?: string | null;
  reminderTime?: string | null;
  temptationLabel?: string | null;
  temptationBundleUrl?: string | null;
  dailyGoalMinutes?: number | null;
  weeklyGoalDays?: number | null;
}) {
  const userId = await getActiveUserId();
  let targetIdentityId = data.identityId;

  // If the user selected a built-in template from the dropdown ("preset:vitality-athlete"),
  // find or create that Identity Vector automatically!
  if (targetIdentityId.startsWith('preset:')) {
    const presetKey = targetIdentityId.replace('preset:', '');
    const preset = IDENTITY_PRESETS.find((p) => p.key === presetKey);
    if (!preset) throw new Error('Identity template not found');

    const existing = await prisma.identityVector.findFirst({
      where: { userId, title: preset.title },
    });

    if (existing) {
      targetIdentityId = existing.id;
    } else {
      const createdIdentity = await prisma.identityVector.create({
        data: {
          userId,
          title: preset.title,
          lifesTaskStatement: preset.lifesTaskStatement,
          currentPhase: preset.defaultPhase,
        },
      });
      targetIdentityId = createdIdentity.id;
    }
  }

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
        identityId: targetIdentityId,
        title: data.title.trim(),
        gatewayVersion: data.gatewayVersion.trim(),
        defaultPhase: data.defaultPhase,
        anchorHabitId: anchorId,
        reminderTime: data.reminderTime?.trim() || null,
        temptationLabel: data.temptationLabel?.trim() || null,
        temptationBundleUrl: data.temptationBundleUrl?.trim() || null,
        dailyGoalMinutes: Math.max(0, Math.floor(data.dailyGoalMinutes || 0)),
        weeklyGoalDays: Math.max(0, Math.floor(data.weeklyGoalDays || 0)),
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
  reminderTime?: string | null;
  temptationLabel?: string | null;
  temptationBundleUrl?: string | null;
  dailyGoalMinutes?: number | null;
  weeklyGoalDays?: number | null;
}) {
  const userId = await getActiveUserId();
  const newAnchorId =
    data.anchorHabitId && data.anchorHabitId !== 'NONE' && data.anchorHabitId !== data.id
      ? data.anchorHabitId
      : null;

  await prisma.$transaction(async (tx) => {
    const current = await tx.habit.findFirst({
      where: { id: data.id, identity: { userId } },
      include: { nextStackedHabit: true },
    });

    if (!current) throw new Error('Habit not found or unauthorized');

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
        reminderTime: data.reminderTime?.trim() || null,
        temptationLabel: data.temptationLabel?.trim() || null,
        temptationBundleUrl: data.temptationBundleUrl?.trim() || null,
        dailyGoalMinutes:
          data.dailyGoalMinutes !== undefined
            ? Math.max(0, Math.floor(data.dailyGoalMinutes || 0))
            : undefined,
        weeklyGoalDays:
          data.weeklyGoalDays !== undefined
            ? Math.max(0, Math.floor(data.weeklyGoalDays || 0))
            : undefined,
      },
    });
  });

  revalidatePath('/');
}

/**
 * Server-side verified Pro status checker (Audit #21).
 * Validates authentic Google session and database IdentityVector.isPro
 * to eliminate client-side localStorage DevTools tampering.
 */
export async function verifyUserProStatusAction(): Promise<{ isPro: boolean }> {
  try {
    const userId = await getActiveUserId();
    const isPro = await checkUserProStatus(userId);
    return { isPro };
  } catch (err) {
    console.error('Error verifying Pro status server-side:', err);
    return { isPro: false };
  }
}

export async function deleteStackedHabit(id: string) {
  const userId = await getActiveUserId();
  await prisma.$transaction(async (tx) => {
    const habit = await tx.habit.findFirst({
      where: { id, identity: { userId } },
      include: { nextStackedHabit: true },
    });

    if (!habit) throw new Error('Habit not found or unauthorized');

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
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

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
  const todayStr = new Date().toISOString().split('T')[0];

  // High-performance set-based batch queries: scales to 100k+ habits without timeout
  const [missedTwiceHabits, firstMissHabits, safeHabits] = await prisma.$transaction([
    // 1. Habits NOT completed today that were already missed yesterday (missed twice -> streak broken)
    prisma.habit.updateMany({
      where: {
        OR: [
          { lastCompletedDate: { not: todayStr } },
          { lastCompletedDate: null },
        ],
        missedYesterday: true,
      },
      data: {
        currentStreak: 0,
        isReboundPriority: true,
        downscaledDaysRemaining: 3,
      },
    }),

    // 2. Habits NOT completed today that were NOT missed yesterday (first miss -> preserve streak, mark rebound)
    prisma.habit.updateMany({
      where: {
        OR: [
          { lastCompletedDate: { not: todayStr } },
          { lastCompletedDate: null },
        ],
        missedYesterday: false,
      },
      data: {
        missedYesterday: true,
        isReboundPriority: true,
      },
    }),

    // 3. Habits completed today: streak is safe, clear rebound & missed flags
    prisma.habit.updateMany({
      where: {
        lastCompletedDate: todayStr,
      },
      data: {
        missedYesterday: false,
        isReboundPriority: false,
      },
    }),
  ]);

  try {
    revalidatePath('/');
  } catch {
    // safe outside request context
  }

  return {
    success: true,
    safeCount: safeHabits.count,
    missedTwiceCount: missedTwiceHabits.count,
    firstMissCount: firstMissHabits.count,
  };
}

export async function toggleArchiveHabitAction(id: string, isArchived: boolean) {
  const userId = await getActiveUserId();
  const habit = await prisma.habit.findFirst({
    where: { id, identity: { userId } },
  });

  if (!habit) {
    throw new Error('Habit not found or unauthorized');
  }

  await prisma.habit.update({
    where: { id },
    data: { isArchived },
  });

  revalidatePath('/');
}

export async function togglePinHabitAction(id: string, isPinned: boolean) {
  const userId = await getActiveUserId();
  const habit = await prisma.habit.findFirst({
    where: { id, identity: { userId } },
  });

  if (!habit) {
    throw new Error('Habit not found or unauthorized');
  }

  await prisma.habit.update({
    where: { id },
    data: { isPinned },
  });

  revalidatePath('/');
}

export async function exportUserDataAction() {
  const userId = await getActiveUserId();

  const [identities, habits, sessions] = await Promise.all([
    prisma.identityVector.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.habit.findMany({
      where: { identity: { userId } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.sessionLog.findMany({
      where: { identity: { userId } },
      orderBy: { loggedAt: 'asc' },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: FORGE_APP_VERSION,
    userId,
    identities,
    habits,
    sessions,
  };
}
