// src/components/FeatureWalkthrough.tsx
'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Target,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Flame,
  Timer,
} from 'lucide-react';

interface FeatureWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCreating?: () => void;
}

const STEPS = [
  {
    badge: 'Step 1 of 3 • Core Philosophy',
    title: 'Forge Your Identity',
    subtitle: 'Every habit is a vote for who you want to become.',
    icon: Target,
    accentColor: 'from-indigo-500 to-purple-600',
    description:
      'Instead of tracking random chores, ForgeOS anchors habits to your core identities (like "Systems Craftsman", "Vitality Athlete", or "Deep Worker"). You earn skill points and cast votes for your desired self every time you execute.',
    tip: '💡 Tip: Start with 2 to 3 identities that truly matter to you this season.',
    cardMock: (
      <div className="p-3.5 rounded-2xl glass-panel border border-[var(--border-subtle)] space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider font-bold">
            Identity Vector
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300">
            Level 2 • Practice
          </span>
        </div>
        <div className="font-bold text-sm theme-text">Systems & Software Craftsman</div>
        <p className="text-[11px] theme-subtext line-clamp-2">
          Master problem-solving, clean architecture, and modern engineering.
        </p>
        <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-zinc-400">
          <span className="text-emerald-400 font-bold">✓ 24 Votes Earned</span>
          <span>•</span>
          <span>12h Logged</span>
        </div>
      </div>
    ),
  },
  {
    badge: 'Step 2 of 3 • Overcoming Inertia',
    title: 'The 2-Minute Micro-Start',
    subtitle: 'Defeat procrastination by shrinking the starting barrier.',
    icon: Zap,
    accentColor: 'from-amber-500 to-orange-600',
    description:
      'The hardest part of any habit is the first 120 seconds. ForgeOS gives every habit a "Gateway Version" — just put on your shoes, or open your editor. Once the 2-minute timer finishes, your resistance drops and flow takes over.',
    tip: '⚡ Success rule: If you only do the 2-minute gateway version, you STILL win the day.',
    cardMock: (
      <div className="p-3.5 rounded-2xl glass-panel border border-amber-500/20 bg-amber-500/5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Timer className="w-4 h-4 animate-pulse" />
            <span>2-Minute Micro-Start</span>
          </div>
          <span className="font-mono font-bold text-xs text-amber-300">01:45</span>
        </div>
        <div className="font-bold text-sm theme-text">
          Gateway: Bench 5 warmup reps with empty bar
        </div>
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full w-[65%] rounded-full animate-pulse" />
        </div>
        <p className="text-[10px] text-amber-300/80">
          Once the bell rings, choose to keep going into Pomodoro flow or bank the win!
        </p>
      </div>
    ),
  },
  {
    badge: 'Step 3 of 3 • Momentum & Chains',
    title: 'Chain Sequences & Flow',
    subtitle: 'Stack habits together to put your entire day on autopilot.',
    icon: Layers,
    accentColor: 'from-emerald-500 to-teal-600',
    description:
      'Link habits so that completing one automatically triggers the next. As your streaks compound, ForgeOS maps your consistency on the Continuity Grid and lets you run deep Pomodoro focus sessions.',
    tip: '🔗 Pro-tip: Anchor new habits to an existing routine you already do without thinking.',
    cardMock: (
      <div className="p-3.5 rounded-2xl glass-panel border border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold theme-text">
          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            1
          </span>
          <span className="truncate">Morning Mobility Stretch (5 mins)</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
        </div>
        <div className="pl-3 py-0.5 border-l-2 border-emerald-500/40 ml-3 text-[10px] text-emerald-400 font-mono">
          ↳ Auto-triggers next
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold theme-text">
          <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
            2
          </span>
          <span className="truncate">Deep Work: Solve 1 Coding Challenge</span>
          <Flame className="w-4 h-4 text-amber-400 ml-auto" />
        </div>
      </div>
    ),
  },
];

export default function FeatureWalkthrough({
  isOpen,
  onClose,
  onStartCreating,
}: FeatureWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      if (onStartCreating) onStartCreating();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-0 sm:p-4 flex items-end sm:items-center justify-center">
      <div className="glass-nav rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg md:max-w-xl flex flex-col h-[94vh] sm:h-[86vh] sm:max-h-[740px] shadow-2xl border border-[var(--border-strong)] overflow-hidden">
        {/* Mobile drag bar */}
        <div className="pt-2 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1 rounded-full bg-white/20" />
        </div>

        {/* Top Header (Fixed) */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-5 pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-400 block">
                {step.badge}
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight theme-text">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg theme-muted hover:opacity-80 transition cursor-pointer"
            aria-label="Close Walkthrough"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Visual Mock Card */}
          <div className="w-full">{step.cardMock}</div>

          {/* Step Explanation */}
          <div className="space-y-2.5">
            <h4 className="text-base font-bold theme-text">{step.subtitle}</h4>
            <p className="text-sm theme-subtext leading-relaxed">
              {step.description}
            </p>
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium leading-relaxed">
              {step.tip}
            </div>
          </div>
        </div>

        {/* Fixed Footer (Dots + Navigation) */}
        <div className="p-5 pt-3.5 border-t border-[var(--border-subtle)] shrink-0 space-y-3.5">
          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStep
                    ? 'w-7 bg-indigo-500'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-3 rounded-xl border border-[var(--border-subtle)] glass-panel text-xs sm:text-sm font-bold theme-text hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              style={{ background: 'var(--accent-primary)' }}
            >
              <span>{isLastStep ? 'Get Started — Create Habit' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
