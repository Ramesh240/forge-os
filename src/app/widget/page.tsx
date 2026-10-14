// src/app/widget/page.tsx
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import Link from 'next/link';
import { Play, Flame, CheckCircle2, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ForgeWidgetPage() {
  const session = await auth();
  const activeUserId = session?.user?.email || 'demo-user';
  const todayStr = new Date().toISOString().split('T')[0];

  const habits = await prisma.habit.findMany({
    where: { identity: { userId: activeUserId } },
    include: { identity: { select: { title: true } } },
    orderBy: [{ isReboundPriority: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="min-h-screen theme-surface p-3 sm:p-5 flex items-start justify-center">
      <div className="w-full max-w-md glass-nav rounded-3xl p-4 space-y-3.5 shadow-2xl">
        {/* Compact Widget Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs"
              style={{ background: 'var(--accent-primary)' }}
            >
              F
            </div>
            <div>
              <h1 className="text-sm font-bold theme-text leading-none">
                ForgeOS Quick Widget
              </h1>
              <span className="text-[10px] theme-muted">
                {habits.length} Active Habits • Tap to Start 2m Timer
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="px-2.5 py-1 rounded-lg glass-panel text-[11px] font-semibold theme-text hover:opacity-80"
          >
            Full App &rarr;
          </Link>
        </div>

        {/* Compact Habit List */}
        <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-0.5">
          {habits.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs theme-subtext">No habits in your queue yet.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                style={{ background: 'var(--accent-primary)' }}
              >
                <Plus className="w-3.5 h-3.5" /> Add First Habit
              </Link>
            </div>
          ) : (
            habits.map((h) => {
              const doneToday = h.lastCompletedDate === todayStr;
              return (
                <div
                  key={h.id}
                  className="p-3 rounded-2xl glass-panel flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium theme-muted truncate">
                        {h.identity.title}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500">
                        <Flame className="w-3 h-3 fill-orange-500" />
                        {h.currentStreak}d
                      </span>
                      {doneToday && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <h2 className="text-xs font-bold theme-text truncate mt-0.5">
                      {h.title}
                    </h2>
                    <p className="text-[11px] theme-subtext truncate">
                      2m: {h.gatewayVersion}
                    </p>
                  </div>

                  <Link
                    href={`/?startHabit=${h.id}`}
                    className="px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-sm hover:opacity-95"
                    style={{ background: 'var(--accent-primary)' }}
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Start
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
