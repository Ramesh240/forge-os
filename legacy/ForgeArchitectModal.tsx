// src/components/ForgeArchitectModal.tsx
'use client';

import React, { useState } from 'react';
import { createIdentityVector, createStackedHabit } from '@/app/actions';
import { MasteryPhase } from '@/lib/forge-engine';
import {
  Plus,
  X,
  Compass,
  Layers,
  ArrowRight,
  Timer,
  Lock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface IdentityOption {
  id: string;
  title: string;
  currentPhase: string;
}

interface HabitOption {
  id: string;
  title: string;
  identity: { title: string };
  nextStackedHabit?: { id: string; title: string } | null;
}

export default function ForgeArchitectModal({
  identities,
  habits,
}: {
  identities: IdentityOption[];
  habits: HabitOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'HABIT' | 'IDENTITY'>('HABIT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // --- Tab 1 State: Identity Vector ---
  const [idTitle, setIdTitle] = useState('');
  const [lifesTask, setLifesTask] = useState('');
  const [initialPhase, setInitialPhase] = useState<'OBSERVATION' | 'PRACTICE' | 'EXPERIMENTATION'>('OBSERVATION');

  // --- Tab 2 State: 4-Laws Habit Stack ---
  const [selectedIdentityId, setSelectedIdentityId] = useState(identities[0]?.id || '');
  const [anchorHabitId, setAnchorHabitId] = useState<string>('NONE');
  const [habitTitle, setHabitTitle] = useState('');
  const [gatewayVersion, setGatewayVersion] = useState('');
  const [defaultPhase, setDefaultPhase] = useState<MasteryPhase>('PRACTICE');
  const [temptationLabel, setTemptationLabel] = useState('');
  const [temptationUrl, setTemptationUrl] = useState('');

  const selectedAnchor = habits.find((h) => h.id === anchorHabitId);

  const handleCreateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBannerMsg(null);
    try {
      const created = await createIdentityVector({
        title: idTitle,
        lifesTaskStatement: lifesTask,
        currentPhase: initialPhase,
      });
      setIdTitle('');
      setLifesTask('');
      setSelectedIdentityId(created.id);
      setBannerMsg(`Identity "${created.title}" forged! Now wire its first Habit Stack.`);
      setActiveTab('HABIT');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBannerMsg(null);
    try {
      await createStackedHabit({
        identityId: selectedIdentityId || identities[0]?.id,
        title: habitTitle,
        gatewayVersion,
        defaultPhase,
        anchorHabitId: anchorHabitId === 'NONE' ? null : anchorHabitId,
        temptationLabel: temptationLabel || null,
        temptationBundleUrl: temptationUrl || null,
      });

      setHabitTitle('');
      setGatewayVersion('');
      setTemptationLabel('');
      setTemptationUrl('');
      setAnchorHabitId('NONE');
      setBannerMsg('Habit wired into your 4-Laws Behavioral Matrix!');
      setTimeout(() => {
        setIsOpen(false);
        setBannerMsg(null);
      }, 900);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger Button in Header */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Architect Identity / Habit Stack
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  ForgeOS System Architect
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure overarching Identity Vectors or chain new habits using the 4 Laws.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('HABIT');
                  setBannerMsg(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'HABIT'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Wire 4-Laws Habit Stack
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('IDENTITY');
                  setBannerMsg(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'IDENTITY'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Compass className="w-4 h-4" />
                New Identity Vector
              </button>
            </div>

            {bannerMsg && (
              <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                {bannerMsg}
              </div>
            )}

            {/* TAB 1: WIRE 4-LAWS HABIT STACK */}
            {activeTab === 'HABIT' ? (
              <form onSubmit={handleCreateHabit} className="space-y-5">
                {/* Identity & Greene Phase Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Target Identity Vector (Vote Recipient)
                    </label>
                    <select
                      value={selectedIdentityId}
                      onChange={(e) => setSelectedIdentityId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white"
                      required
                    >
                      {identities.map((idVec) => (
                        <option key={idVec.id} value={idVec.id}>
                          {idVec.title} ({idVec.currentPhase})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      3-Phase Apprenticeship Mode (Greene)
                    </label>
                    <select
                      value={defaultPhase}
                      onChange={(e) => setDefaultPhase(e.target.value as MasteryPhase)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white"
                    >
                      <option value="PASSIVE">1. Deep Observation — Passive (0.8x Vote)</option>
                      <option value="PRACTICE">2. Skills Acquisition — Practice (1.2x Vote)</option>
                      <option value="ACTIVE">3. Experimentation — Active Build (1.75x Vote)</option>
                    </select>
                  </div>
                </div>

                {/* 1st Law: Habit Stacking Formula Box */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      1st Law: Make It Obvious (Habit Stacking Formula)
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      &ldquo;After [CURRENT_HABIT], I will [NEW_HABIT]&rdquo;
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      After I complete this Anchor Habit:
                    </label>
                    <select
                      value={anchorHabitId}
                      onChange={(e) => setAnchorHabitId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-white"
                    >
                      <option value="NONE">⚡ Standalone / Start of Stack (No preceding habit)</option>
                      {habits.map((h) => (
                        <option key={h.id} value={h.id}>
                          After: &ldquo;{h.title}&rdquo; [{h.identity.title}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      I will immediately perform (Full Habit Session):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Write 1 Rust concurrency benchmark test"
                      value={habitTitle}
                      onChange={(e) => setHabitTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-white placeholder-zinc-500"
                    />
                  </div>

                  {/* Live Visual Chain Preview */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-zinc-500 font-mono">Chain Preview:</span>
                    {selectedAnchor ? (
                      <>
                        <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 font-medium">
                          {selectedAnchor.title}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="px-2.5 py-1 rounded bg-indigo-600/30 border border-indigo-500 text-indigo-200 font-semibold">
                          {habitTitle || 'Your New Habit'}
                        </span>
                        {selectedAnchor.nextStackedHabit && (
                          <>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                            <span
                              title="Automatically spliced after your new habit"
                              className="px-2.5 py-1 rounded bg-amber-950/50 border border-amber-500/40 text-amber-300"
                            >
                              {selectedAnchor.nextStackedHabit.title} (Auto-Spliced)
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-indigo-600/30 border border-indigo-500 text-indigo-200 font-semibold">
                        ⚡ Root Trigger: {habitTitle || 'Your New Habit'}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3rd Law: 2-Minute Gateway Rule */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5" />
                      3rd Law: Make It Easy (The 2-Minute Gateway Rule)
                    </span>
                    <span className="text-[11px] text-zinc-500">Must take &lt; 120 seconds</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Scale the habit down into a frictionless 2-minute entry action so you can still cast an Identity Vote on low-energy days.
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Open IDE, create test file, and write fn main() stub"
                    value={gatewayVersion}
                    onChange={(e) => setGatewayVersion(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-white placeholder-zinc-500"
                  />
                </div>

                {/* 2nd Law: Temptation Bundling Vault */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      2nd Law: Make It Attractive (Temptation Bundle — Optional)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Reward Label (e.g., Dark Synthwave Mix)"
                      value={temptationLabel}
                      onChange={(e) => setTemptationLabel(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white placeholder-zinc-500"
                    />
                    <input
                      type="url"
                      placeholder="Locked URL (https://youtube.com/...)"
                      value={temptationUrl}
                      onChange={(e) => setTemptationUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white placeholder-zinc-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {isSubmitting ? 'Wiring Stack...' : 'Save & Wire Habit Stack'}
                  </button>
                </div>
              </form>
            ) : (
              /* TAB 2: CREATE NEW IDENTITY VECTOR */
              <form onSubmit={handleCreateIdentity} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Identity Vector Title (Who are you becoming?)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Systems Programming Rustacean / ML Research Engineer"
                    value={idTitle}
                    onChange={(e) => setIdTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white placeholder-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Greene’s Life’s Task Statement (Overarching North Star)
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g., Master memory-safe systems architecture and low-latency network engineering."
                    value={lifesTask}
                    onChange={(e) => setLifesTask(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white placeholder-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Starting Apprenticeship Stage
                  </label>
                  <select
                    value={initialPhase}
                    onChange={(e) =>
                      setInitialPhase(
                        e.target.value as 'OBSERVATION' | 'PRACTICE' | 'EXPERIMENTATION'
                      )
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white"
                  >
                    <option value="OBSERVATION">Stage 1: Deep Observation (0 – 150 hrs)</option>
                    <option value="PRACTICE">Stage 2: Skills Acquisition (150 – 2,000 hrs)</option>
                    <option value="EXPERIMENTATION">Stage 3: Active Experimentation (2,000+ hrs)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {isSubmitting ? 'Forging...' : 'Forge Identity Vector'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
