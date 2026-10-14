// src/components/forge/EditModals.tsx
'use client';

import React from 'react';
import { X, Trash2, Pencil, Shield, DoorOpen, Clock, Link2 } from 'lucide-react';
import { SkillStage } from '@/lib/forge-engine';
import { SerializedIdentity, SerializedHabit } from '../ForgeAppShell';

interface EditHabitModalProps {
  habit: SerializedHabit | null;
  onClose: () => void;
  identities: SerializedIdentity[];
  allHabits: SerializedHabit[];
  editHabitIdentityId: string;
  onSetEditHabitIdentityId: (id: string) => void;
  editHabitTitle: string;
  onSetEditHabitTitle: (title: string) => void;
  editHabitMicro: string;
  onSetEditHabitMicro: (micro: string) => void;
  editHabitStage: SkillStage;
  onSetEditHabitStage: (stage: SkillStage) => void;
  editHabitAnchorId: string;
  onSetEditHabitAnchorId: (id: string) => void;
  editHabitReminder: string;
  onSetEditHabitReminder: (rem: string) => void;
  onUpdateHabitSubmit: (e: React.FormEvent) => Promise<void>;
  onDeleteHabit: () => Promise<void>;
  confirmDelete: boolean;
  onSetConfirmDelete: (confirm: boolean) => void;
  isSubmitting: boolean;
}

export function EditHabitModal({
  habit,
  onClose,
  identities,
  allHabits,
  editHabitIdentityId,
  onSetEditHabitIdentityId,
  editHabitTitle,
  onSetEditHabitTitle,
  editHabitMicro,
  onSetEditHabitMicro,
  editHabitStage,
  onSetEditHabitStage,
  editHabitAnchorId,
  onSetEditHabitAnchorId,
  editHabitReminder,
  onSetEditHabitReminder,
  onUpdateHabitSubmit,
  onDeleteHabit,
  confirmDelete,
  onSetConfirmDelete,
  isSubmitting,
}: EditHabitModalProps) {
  if (!habit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative z-10 w-full max-w-lg bg-[var(--forge-surface-low)] border border-[var(--forge-border)] rounded-3xl p-5 sm:p-6 shadow-[0_16px_64px_rgba(0,0,0,0.5)] my-auto flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--forge-border)]">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[var(--forge-primary)]" />
            <h3 className="text-base font-bold text-[var(--forge-text-primary)] tracking-tight">
              Edit Habit
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onUpdateHabitSubmit} className="space-y-3.5">
          {/* Target Identity */}
          <div className="space-y-1.5">
            <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-text-secondary)] font-bold">
              Archetype
            </label>
            <select
              value={editHabitIdentityId}
              onChange={(e) => onSetEditHabitIdentityId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] text-[var(--forge-text-primary)] text-xs font-mono-forge focus:outline-none"
            >
              {identities.map((idVec) => (
                <option key={idVec.id} value={idVec.id}>
                  {idVec.title}
                </option>
              ))}
            </select>
          </div>

          {/* Habit Title */}
          <div className="space-y-1.5">
            <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-text-secondary)] font-bold">
              Habit Title
            </label>
            <input
              required
              maxLength={80}
              type="text"
              value={editHabitTitle}
              onChange={(e) => onSetEditHabitTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-faint)] text-xs sm:text-sm focus:outline-none focus:border-[var(--forge-primary)]"
            />
          </div>

          {/* 2-Minute Gateway */}
          <div className="space-y-1.5">
            <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-secondary)] font-bold flex items-center gap-1">
              <DoorOpen className="w-3.5 h-3.5" />
              <span>2-Minute Gateway</span>
            </label>
            <input
              required
              type="text"
              value={editHabitMicro}
              onChange={(e) => onSetEditHabitMicro(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-faint)] text-xs sm:text-sm focus:outline-none focus:border-[var(--forge-secondary)]"
            />
          </div>

          {/* Phase & Reminder */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-text-secondary)] font-bold">
                Phase
              </label>
              <select
                value={editHabitStage}
                onChange={(e) => onSetEditHabitStage(e.target.value as SkillStage)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] text-[var(--forge-text-primary)] text-xs font-mono-forge focus:outline-none"
              >
                <option value="PASSIVE">Passive (x0.8)</option>
                <option value="PRACTICE">Practice (x1.2)</option>
                <option value="ACTIVE">Active (x1.75)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-text-secondary)] font-bold">
                Daily Reminder
              </label>
              <input
                type="text"
                placeholder="e.g. 20:30"
                value={editHabitReminder}
                onChange={(e) => onSetEditHabitReminder(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-faint)] text-xs font-mono-forge focus:outline-none"
              />
            </div>
          </div>

          {/* Stacked next */}
          <div className="space-y-1.5">
            <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-secondary)] font-bold flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" />
              <span>Chained Next</span>
            </label>
            <select
              value={editHabitAnchorId}
              onChange={(e) => onSetEditHabitAnchorId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] text-[var(--forge-text-primary)] text-xs font-mono-forge focus:outline-none"
            >
              <option value="NONE">None</option>
              {allHabits
                .filter((h) => h.id !== habit.id)
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    Link: {h.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onDeleteHabit}
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-xl bg-red-600 text-white font-mono-forge text-xs font-bold hover:bg-red-700"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => onSetConfirmDelete(false)}
                  className="px-2.5 py-2 rounded-xl bg-[var(--forge-surface-high)] text-[var(--forge-text-primary)] font-mono-forge text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSetConfirmDelete(true)}
                className="text-xs font-mono-forge text-[var(--forge-error)] hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            <button
              disabled={isSubmitting}
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6f00be] text-white font-mono-forge text-xs font-bold shadow-md hover:brightness-110 active:scale-95"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditIdentityModalProps {
  identity: SerializedIdentity | null;
  onClose: () => void;
  editIdTitle: string;
  onSetEditIdTitle: (title: string) => void;
  editIdMission: string;
  onSetEditIdMission: (mission: string) => void;
  editIdStage: string;
  onSetEditIdStage: (stage: string) => void;
  onUpdateIdentitySubmit: (e: React.FormEvent) => Promise<void>;
  onDeleteIdentity: () => Promise<void>;
  confirmDelete: boolean;
  onSetConfirmDelete: (confirm: boolean) => void;
  isSubmitting: boolean;
}

export function EditIdentityModal({
  identity,
  onClose,
  editIdTitle,
  onSetEditIdTitle,
  editIdMission,
  onSetEditIdMission,
  editIdStage,
  onSetEditIdStage,
  onUpdateIdentitySubmit,
  onDeleteIdentity,
  confirmDelete,
  onSetConfirmDelete,
  isSubmitting,
}: EditIdentityModalProps) {
  if (!identity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative z-10 w-full max-w-lg bg-[var(--forge-surface-low)] border border-[var(--forge-border)] rounded-3xl p-5 sm:p-6 shadow-[0_16px_64px_rgba(0,0,0,0.5)] my-auto flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--forge-border)]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--forge-secondary)]" />
            <h3 className="text-base font-bold text-[var(--forge-text-primary)] tracking-tight">
              Edit Archetype
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--forge-surface-high)] hover:bg-[var(--forge-surface-highest)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onUpdateIdentitySubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-secondary)] font-bold">
              Archetype Title
            </label>
            <input
              required
              maxLength={64}
              type="text"
              value={editIdTitle}
              onChange={(e) => onSetEditIdTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-faint)] text-xs sm:text-sm focus:outline-none focus:border-[var(--forge-secondary)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-primary)] font-bold">
              Life's Task / Mission
            </label>
            <textarea
              required
              rows={3}
              maxLength={200}
              value={editIdMission}
              onChange={(e) => onSetEditIdMission(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] text-[var(--forge-text-primary)] placeholder-[var(--forge-text-faint)] text-xs sm:text-sm focus:outline-none focus:border-[var(--forge-primary)] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono-forge text-[11px] uppercase tracking-wider text-[var(--forge-text-secondary)] font-bold">
              Phase Progression
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['OBSERVATION', 'PRACTICE', 'EXPERIMENTATION'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onSetEditIdStage(p)}
                  className={`p-2 rounded-xl text-center font-mono-forge text-xs font-bold border transition-all ${
                    editIdStage === p
                      ? 'bg-[var(--forge-surface-high)] border-[var(--forge-secondary)] text-[var(--forge-text-primary)] shadow-sm'
                      : 'bg-[var(--forge-surface-lowest)] border border-[var(--forge-border)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onDeleteIdentity}
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-xl bg-red-600 text-white font-mono-forge text-xs font-bold hover:bg-red-700"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => onSetConfirmDelete(false)}
                  className="px-2.5 py-2 rounded-xl bg-[var(--forge-surface-high)] text-[var(--forge-text-primary)] font-mono-forge text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSetConfirmDelete(true)}
                className="text-xs font-mono-forge text-[var(--forge-error)] hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            <button
              disabled={isSubmitting}
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6f00be] to-[#ddb7ff] text-white font-mono-forge text-xs font-bold shadow-md hover:brightness-110 active:scale-95"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
