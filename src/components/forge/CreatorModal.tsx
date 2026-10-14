// src/components/forge/CreatorModal.tsx
'use client';

import React from 'react';
import {
  X,
  Zap,
  Shield,
  Plus,
  DoorOpen,
  Clock,
  Link2,
  Sparkles,
} from 'lucide-react';
import { SkillStage } from '@/lib/forge-engine';
import { SerializedIdentity, SerializedHabit } from '../ForgeAppShell';

interface CreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorTab: 'HABIT' | 'IDENTITY';
  onSetCreatorTab: (tab: 'HABIT' | 'IDENTITY') => void;
  identities: SerializedIdentity[];
  habits: SerializedHabit[];

  // Habit Form
  newHabitIdentityId: string;
  onSetNewHabitIdentityId: (id: string) => void;
  newHabitTitle: string;
  onSetNewHabitTitle: (title: string) => void;
  newHabitMicro: string;
  onSetNewHabitMicro: (micro: string) => void;
  newHabitStage: SkillStage;
  onSetNewHabitStage: (stage: SkillStage) => void;
  newHabitAnchorId: string;
  onSetNewHabitAnchorId: (id: string) => void;
  newHabitReminder: string;
  onSetNewHabitReminder: (rem: string) => void;
  onCreateHabitSubmit: (e: React.FormEvent) => Promise<void>;

  // Identity Form
  newIdTitle: string;
  onSetNewIdTitle: (title: string) => void;
  newIdMission: string;
  onSetNewIdMission: (mission: string) => void;
  newIdStage: string;
  onSetNewIdStage: (stage: string) => void;
  onCreateIdentitySubmit: (e: React.FormEvent) => Promise<void>;

  isSubmitting: boolean;
}

const GATEWAY_PRESETS = [
  'Sit down, launch editor and read problem statement',
  'Write 1-line failing test or draft interface',
  'Open terminal, create scratch branch and review diff',
  'Read 1 architectural section and take 3 bullets',
  'Clear desk, set water bottle, start 2-min timer',
];

const REMINDER_PRESETS = [
  { label: 'Off', value: '' },
  { label: 'Morning 08:00', value: '08:00' },
  { label: 'Noon 12:30', value: '12:30' },
  { label: 'Afternoon 17:00', value: '17:00' },
  { label: 'Evening 20:30', value: '20:30' },
];

export function CreatorModal({
  isOpen,
  onClose,
  creatorTab,
  onSetCreatorTab,
  identities,
  habits,
  newHabitIdentityId,
  onSetNewHabitIdentityId,
  newHabitTitle,
  onSetNewHabitTitle,
  newHabitMicro,
  onSetNewHabitMicro,
  newHabitStage,
  onSetNewHabitStage,
  newHabitAnchorId,
  onSetNewHabitAnchorId,
  newHabitReminder,
  onSetNewHabitReminder,
  onCreateHabitSubmit,
  newIdTitle,
  onSetNewIdTitle,
  newIdMission,
  onSetNewIdMission,
  newIdStage,
  onSetNewIdStage,
  onCreateIdentitySubmit,
  isSubmitting,
}: CreatorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative z-10 w-full max-w-lg bg-[#131317]/95 border border-[rgba(255,255,255,0.12)] rounded-3xl p-5 sm:p-6 shadow-[0_16px_64px_rgba(0,0,0,0.8)] my-auto flex flex-col space-y-4">
        {/* Header & Close */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Forge System Creator
            </h3>
            <p className="text-xs text-[var(--forge-text-secondary)]">
              Codify master archetypes and 2-minute atomic initiation gateways.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-[var(--forge-text-muted)] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dual Tab Segmented Pill Bar */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#0e0e12] border border-white/5 gap-1 font-mono-forge text-xs">
          <button
            onClick={() => onSetCreatorTab('HABIT')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              creatorTab === 'HABIT'
                ? 'bg-[var(--forge-surface-high)] text-[var(--forge-primary)] font-bold shadow-md'
                : 'text-[var(--forge-text-muted)] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Atomic Habit</span>
          </button>

          <button
            onClick={() => onSetCreatorTab('IDENTITY')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              creatorTab === 'IDENTITY'
                ? 'bg-[var(--forge-secondary-tint)] border border-[rgba(221,183,255,0.4)] text-[var(--forge-secondary)] font-bold shadow-md'
                : 'text-[var(--forge-text-muted)] hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Core Identity</span>
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────
            TAB 1: ATOMIC HABIT PROTOCOL FORM
        ─────────────────────────────────────────────────────────── */}
        {creatorTab === 'HABIT' ? (
          <form onSubmit={onCreateHabitSubmit} className="space-y-4">
            {/* Target Identity Chips */}
            <div className="space-y-1.5">
              <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-text-secondary)] font-bold">
                Target Identity Archetype
              </label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {identities.map((idVec) => {
                  const isSelected = newHabitIdentityId === idVec.id;
                  return (
                    <button
                      key={idVec.id}
                      type="button"
                      onClick={() => onSetNewHabitIdentityId(idVec.id)}
                      className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-[var(--forge-primary-tint)] border-[var(--forge-primary)] text-white shadow-sm'
                          : 'bg-[#1b1b24] border-white/5 text-[var(--forge-text-muted)] hover:text-white'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-[var(--forge-primary)]' : 'bg-white/20'
                        }`}
                      />
                      <span className="text-xs font-semibold">{idVec.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Habit Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-forge">
                <label className="uppercase tracking-wider text-[var(--forge-text-secondary)] font-bold">
                  Habit Protocol Title
                </label>
                <span className="text-[var(--forge-text-muted)]">
                  {newHabitTitle.length} / 80
                </span>
              </div>
              <input
                required
                maxLength={80}
                type="text"
                value={newHabitTitle}
                onChange={(e) => onSetNewHabitTitle(e.target.value)}
                placeholder="e.g., Solve 1 LeetCode Hard (DP & Graphs)"
                className="w-full px-3.5 py-3 rounded-xl bg-[#0e0e12] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[var(--forge-primary)]"
              />
            </div>

            {/* 2-Minute Gateway & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-forge">
                <label className="uppercase tracking-wider text-[var(--forge-secondary)] font-bold flex items-center gap-1">
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>The 2-Minute Atomic Gateway</span>
                </label>
                <span className="text-[10px] text-[var(--forge-tertiary)] uppercase font-bold">
                  Friction Shredder
                </span>
              </div>
              <input
                required
                type="text"
                value={newHabitMicro}
                onChange={(e) => onSetNewHabitMicro(e.target.value)}
                placeholder="e.g., Open IDE, create test file and read problem prompt"
                className="w-full px-3.5 py-3 rounded-xl bg-[#0e0e12] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[var(--forge-secondary)]"
              />

              {/* Preset suggestion chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {GATEWAY_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSetNewHabitMicro(preset)}
                    className="text-[10px] font-mono-forge px-2.5 py-1 rounded-lg bg-[#181822] text-[var(--forge-text-secondary)] hover:text-white hover:bg-[var(--forge-surface-high)] transition-colors border border-white/5"
                  >
                    "{preset.slice(0, 36)}..."
                  </button>
                ))}
              </div>
            </div>

            {/* Stage Selector & Reminder row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-text-secondary)] font-bold">
                  Phase Classification
                </label>
                <select
                  value={newHabitStage}
                  onChange={(e) => onSetNewHabitStage(e.target.value as SkillStage)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0e0e12] border border-white/10 text-white text-xs font-mono-forge focus:outline-none"
                >
                  <option value="PASSIVE">Passive (Observation x0.8)</option>
                  <option value="PRACTICE">Practice (Drills x1.2)</option>
                  <option value="ACTIVE">Active (Synthesis x1.75)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-text-secondary)] font-bold">
                  Daily Reminder
                </label>
                <select
                  value={newHabitReminder}
                  onChange={(e) => onSetNewHabitReminder(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0e0e12] border border-white/10 text-white text-xs font-mono-forge focus:outline-none"
                >
                  {REMINDER_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chained Habit Dependency (Optional) */}
            <div className="space-y-1.5">
              <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-secondary)] font-bold flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" />
                <span>Chain / Stack Next (Optional)</span>
              </label>
              <select
                value={newHabitAnchorId}
                onChange={(e) => onSetNewHabitAnchorId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0e0e12] border border-white/10 text-white text-xs font-mono-forge focus:outline-none"
              >
                <option value="NONE">None (Independent Protocol)</option>
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>
                    Link to: {h.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6f00be] text-white font-mono-forge text-xs sm:text-sm font-bold tracking-wider uppercase shadow-[0_0_24px_rgba(128,131,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {isSubmitting ? 'Forging Protocol...' : 'FORGE HABIT PROTOCOL'}
            </button>
          </form>
        ) : (
          /* ───────────────────────────────────────────────────────────
              TAB 2: CORE IDENTITY ARCHETYPE FORM
          ─────────────────────────────────────────────────────────── */
          <form onSubmit={onCreateIdentitySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-secondary)] font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Identity Archetype Title</span>
              </label>
              <input
                required
                maxLength={64}
                type="text"
                value={newIdTitle}
                onChange={(e) => onSetNewIdTitle(e.target.value)}
                placeholder="e.g., Distributed Systems Architect"
                className="w-full px-3.5 py-3 rounded-xl bg-[#0e0e12] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[var(--forge-secondary)]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-forge">
                <label className="uppercase tracking-wider text-[var(--forge-primary)] font-bold">
                  Life's Task Statement (Greene's Mastery)
                </label>
                <span className="text-[var(--forge-text-muted)]">
                  {newIdMission.length} / 200
                </span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={200}
                value={newIdMission}
                onChange={(e) => onSetNewIdMission(e.target.value)}
                placeholder="I am becoming a principal architect who designs fault-tolerant systems that never fail under catastrophic load."
                className="w-full px-3.5 py-3 rounded-xl bg-[#0e0e12] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[var(--forge-primary)] resize-none"
              />
              <p className="text-[11px] text-[var(--forge-text-secondary)] italic">
                Craft an undeniable, first-person present continuous commitment.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-text-secondary)] font-bold">
                Starting Phase
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { phase: 'OBSERVATION', label: 'Observe', sub: 'Pattern intake' },
                  { phase: 'PRACTICE', label: 'Practice', sub: 'Active katas' },
                  { phase: 'EXPERIMENTATION', label: 'Synthesis', sub: 'Domain frontier' },
                ].map((p) => (
                  <button
                    key={p.phase}
                    type="button"
                    onClick={() => onSetNewIdStage(p.phase)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      newIdStage === p.phase
                        ? 'bg-[var(--forge-surface-high)] border-[var(--forge-secondary)] text-white shadow-sm'
                        : 'bg-[#0e0e12] border-white/5 text-[var(--forge-text-muted)] hover:text-white'
                    }`}
                  >
                    <p className="font-mono-forge text-xs font-bold">{p.label}</p>
                    <p className="text-[10px] text-[var(--forge-text-faint)] mt-0.5">{p.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 10,000h Rule Horizon Preview */}
            <div className="bg-[#1b1b24] border border-white/5 rounded-2xl p-3.5 space-y-2 font-mono-forge text-xs">
              <div className="flex items-center justify-between text-[var(--forge-text-secondary)]">
                <span className="uppercase font-bold text-[var(--forge-tertiary)]">
                  10,000-Hour Mastery Vector
                </span>
                <span>0 / 10,000h</span>
              </div>
              <div className="w-full bg-[#0e0e12] h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--forge-tertiary)] w-1 rounded-full" />
              </div>
              <p className="text-[11px] text-[var(--forge-text-muted)]">
                Weekly deliberate practice automatically logs progress toward the 10,000h horizon.
              </p>
            </div>

            {/* Submit Button */}
            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6f00be] to-[#ddb7ff] text-white font-mono-forge text-xs sm:text-sm font-bold tracking-wider uppercase shadow-[0_0_24px_rgba(221,183,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {isSubmitting ? 'Forging Identity...' : 'FORGE CORE IDENTITY'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
