// src/lib/forge-engine.ts

export type SkillStage = 'PASSIVE' | 'PRACTICE' | 'ACTIVE';

export const STAGE_LABELS: Record<SkillStage, { name: string; badge: string; multiplier: number }> = {
  PASSIVE: { name: 'Absorb (Study)', badge: '0.8x Pts', multiplier: 0.8 },
  PRACTICE: { name: 'Drill (Practice)', badge: '1.2x Pts', multiplier: 1.2 },
  ACTIVE: { name: 'Build (Create)', badge: '1.75x Pts', multiplier: 1.75 },
};

export interface ScoreCalculationInput {
  phase: SkillStage;
  isChallengeMode: boolean;
  isRecoveryBonus: boolean;
  durationMinutes: number;
  completedMicroOnly: boolean;
}

export function calculateSessionScore(input: ScoreCalculationInput): number {
  const basePoint = 1.0;
  const stageMult = STAGE_LABELS[input.phase]?.multiplier ?? 1.0;
  const challengeMult = input.isChallengeMode ? 1.5 : 1.0;
  const recoveryMult = input.isRecoveryBonus ? 1.25 : 1.0;

  const durationBonus = input.completedMicroOnly
    ? 0
    : Math.min(0.5, Math.floor(input.durationMinutes / 10) * 0.1);

  return Number(((basePoint + durationBonus) * stageMult * challengeMult * recoveryMult).toFixed(2));
}

export interface ContinuityDay {
  dateStr: string;
  label: string;
  shortDay: string;
  status: 'NONE' | 'SHIELD_BRIDGED' | 'MICRO_START' | 'FLOW_SESSION' | 'HIGH_CHALLENGE';
  totalMinutes: number;
  totalPoints: number;
  sessionCount: number;
  challengeCount: number;
  stages: SkillStage[];
}

export interface AnalyticsSummary {
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  effectiveHours: number;
  avgSessionMinutes: number;
  avgDifficulty: number;
  challengeRatioPct: number;
  completionRate14d: number;
  strictStreak: number;
  resilientStreak: number;
  microSavesCount: number;
  stageSplit: { absorbPct: number; drillPct: number; buildPct: number; passiveOverload: boolean };
  last7DaysChart: { dateStr: string; shortLabel: string; minutes: number; points: number; isChallenge: boolean }[];
  difficultyDistribution: { level: number; label: string; count: number; pct: number }[];
  daysGrid: ContinuityDay[];
}

export function buildSystemAnalytics(
  sessions: {
    loggedAt: string;
    durationMinutes: number;
    votesEarned: number;
    completedGatewayOnly: boolean;
    isResistancePractice: boolean;
    frictionRating: number;
    phase: string;
  }[],
  baselineHours = 0,
  totalDays = 84
): AnalyticsSummary {
  const map = new Map<string, ContinuityDay>();
  const today = new Date();
  const daysGrid: ContinuityDay[] = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayObj: ContinuityDay = {
      dateStr,
      label,
      shortDay,
      status: 'NONE',
      totalMinutes: 0,
      totalPoints: 0,
      sessionCount: 0,
      challengeCount: 0,
      stages: [],
    };
    daysGrid.push(dayObj);
    map.set(dateStr, dayObj);
  }

  let totalMinutes = 0;
  let effectiveMinutes = 0;
  let challengeSessions = 0;
  let difficultySum = 0;
  let microSavesCount = 0;
  const stageTotals = { PASSIVE: 0, PRACTICE: 0, ACTIVE: 0 };
  const diffCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const s of sessions) {
    const dStr = s.loggedAt.split('T')[0];
    const bucket = map.get(dStr);

    totalMinutes += s.durationMinutes;
    if (s.isResistancePractice) challengeSessions++;
    if (s.completedGatewayOnly) microSavesCount++;

    const rating = Math.min(5, Math.max(1, s.frictionRating || 3));
    difficultySum += rating;
    diffCounts[rating] = (diffCounts[rating] || 0) + 1;

    const stageKey = (s.phase in stageTotals ? s.phase : 'PRACTICE') as SkillStage;
    stageTotals[stageKey] += s.durationMinutes;

    const stageWeight = stageKey === 'ACTIVE' ? 1.35 : stageKey === 'PRACTICE' ? 1.1 : 0.75;
    const challengeWeight = s.isResistancePractice ? 1.4 : 1.0;
    effectiveMinutes += s.durationMinutes * stageWeight * challengeWeight;

    if (bucket) {
      bucket.sessionCount += 1;
      bucket.totalMinutes += s.durationMinutes;
      bucket.totalPoints = Number((bucket.totalPoints + s.votesEarned).toFixed(2));
      if (s.isResistancePractice) bucket.challengeCount += 1;
      if (!bucket.stages.includes(stageKey)) bucket.stages.push(stageKey);
    }
  }

  // Assign daily status
  for (const day of daysGrid) {
    if (day.sessionCount === 0) {
      day.status = 'NONE';
    } else if (day.challengeCount > 0) {
      day.status = 'HIGH_CHALLENGE';
    } else if (day.totalMinutes <= 4) {
      day.status = 'MICRO_START';
    } else {
      day.status = 'FLOW_SESSION';
    }
  }

  // Detect Streak Shield Bridges (single missed day surrounded by active days)
  for (let i = 1; i < daysGrid.length - 1; i++) {
    if (
      daysGrid[i - 1].sessionCount > 0 &&
      daysGrid[i].sessionCount === 0 &&
      daysGrid[i + 1].sessionCount > 0
    ) {
      daysGrid[i].status = 'SHIELD_BRIDGED';
    }
  }

  // Calculate Strict vs. Shielded Streak
  let strictStreak = 0;
  let resilientStreak = 0;
  const startIdx =
    daysGrid[daysGrid.length - 1].sessionCount > 0 ? daysGrid.length - 1 : daysGrid.length - 2;

  for (let i = startIdx; i >= 0; i--) {
    if (daysGrid[i].sessionCount > 0) strictStreak++;
    else break;
  }
  for (let i = startIdx; i >= 0; i--) {
    if (daysGrid[i].sessionCount > 0 || daysGrid[i].status === 'SHIELD_BRIDGED') {
      if (daysGrid[i].sessionCount > 0) resilientStreak++;
    } else break;
  }

  const last14 = daysGrid.slice(-14);
  const activeDays14 = last14.filter((d) => d.sessionCount > 0).length;
  const completionRate14d = Math.round((activeDays14 / 14) * 100);

  const last7DaysChart = daysGrid.slice(-7).map((d) => ({
    dateStr: d.dateStr,
    shortLabel: `${d.shortDay} ${d.label.split(' ')[1]}`,
    minutes: d.totalMinutes,
    points: d.totalPoints,
    isChallenge: d.status === 'HIGH_CHALLENGE',
  }));

  const totalStageMins = stageTotals.PASSIVE + stageTotals.PRACTICE + stageTotals.ACTIVE;
  const absorbPct = totalStageMins ? Math.round((stageTotals.PASSIVE / totalStageMins) * 100) : 0;
  const drillPct = totalStageMins ? Math.round((stageTotals.PRACTICE / totalStageMins) * 100) : 0;
  const buildPct = totalStageMins ? Math.round((stageTotals.ACTIVE / totalStageMins) * 100) : 0;

  const totalSessions = sessions.length;
  const rawHours = Number((baselineHours + totalMinutes / 60).toFixed(1));
  const effectiveHours = Number((baselineHours + effectiveMinutes / 60).toFixed(1));

  const diffLabels: Record<number, string> = {
    1: '1 • Effortless',
    2: '2 • Light Warmup',
    3: '3 • Focused Practice',
    4: '4 • Deep Stretch',
    5: '5 • Peak Challenge',
  };

  const difficultyDistribution = [5, 4, 3, 2, 1].map((lvl) => ({
    level: lvl,
    label: diffLabels[lvl],
    count: diffCounts[lvl] || 0,
    pct: totalSessions > 0 ? Math.round(((diffCounts[lvl] || 0) / totalSessions) * 100) : 0,
  }));

  return {
    totalSessions,
    totalMinutes,
    totalHours: rawHours,
    effectiveHours,
    avgSessionMinutes: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
    avgDifficulty: totalSessions > 0 ? Number((difficultySum / totalSessions).toFixed(1)) : 0,
    challengeRatioPct: totalSessions > 0 ? Math.round((challengeSessions / totalSessions) * 100) : 0,
    completionRate14d,
    strictStreak,
    resilientStreak,
    microSavesCount,
    stageSplit: {
      absorbPct,
      drillPct,
      buildPct,
      passiveOverload: totalStageMins > 60 && absorbPct > 40,
    },
    last7DaysChart,
    difficultyDistribution,
    daysGrid,
  };
}

export const SKILL_MILESTONES = [
  { hours: 10, title: 'Ignition', desc: 'Initial friction overcome; core workflow established.' },
  { hours: 100, title: 'Automaticity', desc: 'Daily execution becomes natural and low-friction.' },
  { hours: 1000, title: 'Competence', desc: 'Strong mental models; capable of independent building.' },
  { hours: 5000, title: 'Proficiency', desc: 'Rapid problem diagnosis and architectural intuition.' },
  { hours: 10000, title: 'Mastery', desc: 'Complete creative command and deep domain instinct.' },
];

// Legacy & compatibility aliases
export type MasteryPhase = SkillStage;
export type LedgerDay = ContinuityDay;
export const MASTERY_MILESTONES = SKILL_MILESTONES;

export function calculateIdentityVotes(input: {
  phase: string;
  isResistancePractice: boolean;
  isReboundRecovery: boolean;
  durationMinutes: number;
  completedGatewayOnly: boolean;
}): number {
  return calculateSessionScore({
    phase: (input.phase as SkillStage) || 'PRACTICE',
    isChallengeMode: input.isResistancePractice,
    isRecoveryBonus: input.isReboundRecovery,
    durationMinutes: input.durationMinutes,
    completedMicroOnly: input.completedGatewayOnly,
  });
}

export function evaluateHabitGuardrailState(params: {
  currentStreak: number;
  missedYesterday: boolean;
  isReboundPriority: boolean;
  downscaledDaysRemaining: number;
  lastCompletedDate: string | null;
  todayStr: string;
  yesterdayStr: string;
}) {
  const { currentStreak, missedYesterday, downscaledDaysRemaining, lastCompletedDate, todayStr, yesterdayStr } = params;
  if (lastCompletedDate === todayStr) {
    return {
      status: 'HEALTHY' as const,
      currentStreak,
      missedYesterday: false,
      isReboundPriority: false,
      downscaledDaysRemaining,
    };
  }
  if (lastCompletedDate === yesterdayStr) {
    return {
      status: 'PENDING_TODAY' as const,
      currentStreak,
      missedYesterday: false,
      isReboundPriority: false,
      downscaledDaysRemaining,
    };
  }
  if (!missedYesterday) {
    return {
      status: 'MISSED_ONCE_PROBATION' as const,
      currentStreak,
      missedYesterday: true,
      isReboundPriority: true,
      downscaledDaysRemaining,
    };
  }
  return {
    status: 'MISSED_TWICE_DOWNSCALED' as const,
    currentStreak: 0,
    missedYesterday: true,
    isReboundPriority: true,
    downscaledDaysRemaining: 3,
  };
}

export function analyzeApprenticeshipDistribution(sessions: any[], totalHours: number) {
  const total = sessions.length;
  if (!total) return { passivePct: 33, practicePct: 34, activePct: 33, observationTrapWarning: false };
  const passive = sessions.filter((s) => s.phase === 'PASSIVE').length;
  const practice = sessions.filter((s) => s.phase === 'PRACTICE').length;
  const active = sessions.filter((s) => s.phase === 'ACTIVE').length;
  const passivePct = Math.round((passive / total) * 100);
  const practicePct = Math.round((practice / total) * 100);
  const activePct = Math.round((active / total) * 100);
  return {
    passivePct,
    practicePct,
    activePct,
    observationTrapWarning: passivePct > 40 && totalHours > 50,
  };
}

export function buildVisualChainLedger(sessions: any[], daysCount = 84) {
  return buildSystemAnalytics(
    sessions.map((s) => ({
      ...s,
      loggedAt: typeof s.loggedAt === 'string' ? s.loggedAt : s.loggedAt?.toISOString() || new Date().toISOString(),
    })),
    0,
    daysCount
  ).daysGrid;
}

export function calculateMasteryHorizonAnalytics(params: any) {
  const effectiveHours = params.totalHoursLogged || 0;
  const currentMilestone = SKILL_MILESTONES[0];
  const nextMilestone = SKILL_MILESTONES[1];
  return {
    effectiveDeliberateHours: effectiveHours,
    rawHoursLogged: params.totalHoursLogged || 0,
    timeCompressionFactor: 1.0,
    currentMilestone,
    nextMilestone,
    progressTowardsNextMilestonePct: 10,
    logarithmicMasteryPct: 15,
    resistancePracticeRatioPct: 30,
    averageCognitiveFriction: 3.0,
    comfortZoneDriftWarning: false,
    apprenticeModeRatio: { passivePct: 20, practicePct: 50, activePct: 30 },
  };
}
