// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.sessionLog.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.identityVector.deleteMany();

  // 1. Create Identity Vectors
  const algoIdentity = await prisma.identityVector.create({
    data: {
      lifesTaskStatement: 'Master algorithmic problem-solving and computational thinking.',
      title: 'Algorithms Specialist',
      totalVotes: 14,
      weightedScore: 21.5,
      totalHoursLogged: 18.5,
      currentPhase: 'PRACTICE',
    },
  });

  const archIdentity = await prisma.identityVector.create({
    data: {
      lifesTaskStatement: 'Architect resilient, high-throughput full-stack distributed systems.',
      title: 'Full-Stack Systems Architect',
      totalVotes: 9,
      weightedScore: 14.2,
      totalHoursLogged: 12.0,
      currentPhase: 'EXPERIMENTATION',
    },
  });

  const guitarIdentity = await prisma.identityVector.create({
    data: {
      lifesTaskStatement: 'Develop fluid fretboard command and expressive musicality.',
      title: 'Virtuoso Guitarist',
      totalVotes: 6,
      weightedScore: 7.8,
      totalHoursLogged: 5.5,
      currentPhase: 'OBSERVATION',
    },
  });

  // 2. Create Chained Habits (1st Law: Habit Stacking)
  const ankiHabit = await prisma.habit.create({
    data: {
      identityId: algoIdentity.id,
      title: 'Review 15 DSA Anki Flashcards',
      gatewayVersion: 'Review just 5 Anki cards (2 mins)',
      defaultPhase: 'PASSIVE',
      temptationLabel: 'Lo-Fi Synthwave Radio',
      temptationBundleUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      currentStreak: 4,
    },
  });

  const sqlHabit = await prisma.habit.create({
    data: {
      identityId: archIdentity.id,
      title: 'Solve 1 Complex SQL JOIN / Window Query',
      gatewayVersion: 'Open SQL schema & write SELECT stub (2 mins)',
      defaultPhase: 'PRACTICE',
      anchorHabitId: ankiHabit.id, // Triggered right after Anki!
      temptationLabel: 'System Design Podcast Clip',
      temptationBundleUrl: 'https://www.youtube.com',
      currentStreak: 2,
      missedYesterday: true,
      isReboundPriority: true, // Demonstrates "Never Miss Twice" Alert
    },
  });

  await prisma.habit.create({
    data: {
      identityId: archIdentity.id,
      title: 'Build & Test 1 Production REST API Endpoint',
      gatewayVersion: 'Define route handler signature in IDE (2 mins)',
      defaultPhase: 'ACTIVE',
      anchorHabitId: sqlHabit.id, // Triggered right after SQL!
      currentStreak: 1,
    },
  });

  await prisma.habit.create({
    data: {
      identityId: guitarIdentity.id,
      title: '20-Min Metronome Scale & Arpeggio Drill',
      gatewayVersion: 'Pick up guitar & play 1 slow scale at 60 BPM (2 mins)',
      defaultPhase: 'PRACTICE',
      currentStreak: 5,
    },
  });

  console.log('ForgeOS Seed Complete!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
