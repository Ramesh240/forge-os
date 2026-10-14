// src/components/ForgeAppShell.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  buildSystemAnalytics,
  calculateSessionScore,
  SKILL_MILESTONES,
  STAGE_LABELS,
  SkillStage,
  ContinuityDay,
} from '@/lib/forge-engine';
import { soundEngine } from '@/lib/sound-engine';
import {
  logForgeSession,
  createIdentityVector,
  updateIdentityVector,
  deleteIdentityVector,
  createStackedHabit,
  updateStackedHabit,
  deleteStackedHabit,
  seedSampleChainHistory,
  runMidnightGuardrailAudit,
} from '@/app/actions';
import {
  Zap,
  BarChart3,
  Calendar,
  BookOpen,
  Plus,
  Flame,
  Play,
  Pause,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Award,
  Swords,
  Lock,
  Unlock,
  ArrowRight,
  X,
  Gauge,
  TrendingUp,
  Layers,
  RefreshCw,
  Pencil,
  Trash2,
  Volume2,
  VolumeX,
  Download,
  FastForward,
  Compass,
} from 'lucide-react';

export interface SerializedIdentity {
  id: string;
  title: string;
  lifesTaskStatement: string;
  totalVotes: number;
  weightedScore: number;
  totalHoursLogged: number;
  currentPhase: string;
}

export interface SerializedHabit {
  id: string;
  identityId: string;
  title: string;
  gatewayVersion: string;
  defaultPhase: string;
  anchorHabitId: string | null;
  temptationBundleUrl: string | null;
  temptationLabel: string | null;
  currentStreak: number;
  missedYesterday: boolean;
  isReboundPriority: boolean;
  downscaledDaysRemaining: number;
  identityTitle: string;
  nextStackedHabitTitle: string | null;
  nextStackedHabitId: string | null;
}

export interface SerializedSession {
  id: string;
  habitId: string;
  identityId: string;
  habitTitle: string;
  identityTitle: string;
  phase: string;
  durationMinutes: number;
  completedGatewayOnly: boolean;
  isResistancePractice: boolean;
  frictionRating: number;
  bottleneckAttacked: string | null;
  tacitInsight: string | null;
  votesEarned: number;
  loggedAt: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function ForgeAppShell({
  identities,
  habits,
  sessions,
}: {
  identities: SerializedIdentity[];
  habits: SerializedHabit[];
  sessions: SerializedSession[];
}) {
  const [activeTab, setActiveTab] = useState<'WORKSPACE' | 'ANALYTICS' | 'HEATMAP' | 'VAULT'>('WORKSPACE');
  const [selectedIdentityFilter, setSelectedIdentityFilter] = useState<string>('ALL');

  // Sound & PWA Install State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const chimePlayedRef = useRef<boolean>(false);

  // Focus Timer Modal State
  const [activeHabit, setActiveHabit] = useState<SerializedHabit | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [stage, setStage] = useState<SkillStage>('PRACTICE');
  const [isChallenge, setIsChallenge] = useState(false);
  const [difficulty, setDifficulty] = useState(3);
  const [showDebrief, setShowDebrief] = useState(false);
  const [bottleneckNote, setBottleneckNote] = useState('');
  const [insightNote, setInsightNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Modal State (Launched from Home Page sections)
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorTab, setCreatorTab] = useState<'HABIT' | 'IDENTITY'>('HABIT');
  const [newIdTitle, setNewIdTitle] = useState('');
  const [newIdMission, setNewIdMission] = useState('');
  const [newIdStage, setNewIdStage] = useState('OBSERVATION');

  const [newHabitIdentityId, setNewHabitIdentityId] = useState(identities[0]?.id || '');
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitMicro, setNewHabitMicro] = useState('');
  const [newHabitStage, setNewHabitStage] = useState<SkillStage>('PRACTICE');
  const [newHabitAnchorId, setNewHabitAnchorId] = useState('NONE');
  const [newRewardLabel, setNewRewardLabel] = useState('');
  const [newRewardUrl, setNewRewardUrl] = useState('');

  // Edit Identity Modal State
  const [editingIdentity, setEditingIdentity] = useState<SerializedIdentity | null>(null);
  const [editIdTitle, setEditIdTitle] = useState('');
  const [editIdMission, setEditIdMission] = useState('');
  const [editIdStage, setEditIdStage] = useState('OBSERVATION');
  const [confirmDeleteIdentity, setConfirmDeleteIdentity] = useState(false);

  // Edit & Rewire Habit Modal State
  const [editingHabit, setEditingHabit] = useState<SerializedHabit | null>(null);
  const [editHabitIdentityId, setEditHabitIdentityId] = useState('');
  const [editHabitTitle, setEditHabitTitle] = useState('');
  const [editHabitMicro, setEditHabitMicro] = useState('');
  const [editHabitStage, setEditHabitStage] = useState<SkillStage>('PRACTICE');
  const [editHabitAnchorId, setEditHabitAnchorId] = useState('NONE');
  const [editRewardLabel, setEditRewardLabel] = useState('');
  const [editRewardUrl, setEditRewardUrl] = useState('');
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState(false);

  // Selected Day in Heatmap
  const [inspectedDay, setInspectedDay] = useState<ContinuityDay | null>(null);

  const MICRO_THRESHOLD = 120;
  const microCleared = secondsElapsed >= MICRO_THRESHOLD;
  const sessionMins = Math.max(2, Math.round(secondsElapsed / 60));

  useEffect(() => {
    const savedSound = localStorage.getItem('forge_sound_enabled');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('forge_sound_enabled', String(next));
      if (next) soundEngine.playTactileClick(true);
      return next;
    });
  };

  const handleInstallPWA = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    if (choice.outcome === 'accepted') setInstallPromptEvent(null);
  };

  const openCreatorOnHome = (tab: 'HABIT' | 'IDENTITY') => {
    soundEngine.playTactileClick(soundEnabled);
    setCreatorTab(tab);
    if (selectedIdentityFilter !== 'ALL') {
      setNewHabitIdentityId(selectedIdentityFilter);
    } else if (identities[0]?.id) {
      setNewHabitIdentityId(identities[0].id);
    }
    setIsCreatorOpen(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      timer = setInterval(() => setSecondsElapsed((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (secondsElapsed >= MICRO_THRESHOLD && !chimePlayedRef.current && activeHabit) {
      chimePlayedRef.current = true;
      soundEngine.playMicroClearedChime(soundEnabled);
    }
  }, [secondsElapsed, activeHabit, soundEnabled]);

  const filteredSessions = useMemo(() => {
    if (selectedIdentityFilter === 'ALL') return sessions;
    return sessions.filter((s) => s.identityId === selectedIdentityFilter);
  }, [sessions, selectedIdentityFilter]);

  const baselineHours = useMemo(() => {
    if (selectedIdentityFilter === 'ALL') {
      return identities.reduce((acc, i) => acc + i.totalHoursLogged, 0);
    }
    return identities.find((i) => i.id === selectedIdentityFilter)?.totalHoursLogged || 0;
  }, [identities, selectedIdentityFilter]);

  const analytics = useMemo(
    () => buildSystemAnalytics(filteredSessions, baselineHours, 84),
    [filteredSessions, baselineHours]
  );

  const liveScorePreview = useMemo(() => {
    if (!activeHabit) return 1.0;
    return calculateSessionScore({
      phase: stage,
      isChallengeMode: isChallenge,
      isRecoveryBonus: activeHabit.isReboundPriority,
      durationMinutes: sessionMins,
      completedMicroOnly: !microCleared,
    });
  }, [activeHabit, stage, isChallenge, sessionMins, microCleared]);

  const startFocusSession = (habit: SerializedHabit) => {
    soundEngine.playTactileClick(soundEnabled);
    chimePlayedRef.current = false;
    setActiveHabit(habit);
    setStage((habit.defaultPhase as SkillStage) || 'PRACTICE');
    setSecondsElapsed(0);
    setIsChallenge(false);
    setDifficulty(3);
    setShowDebrief(false);
    setBottleneckNote('');
    setInsightNote('');
    setIsRunning(true);
  };

  const openEditIdentityModal = (idVec: SerializedIdentity) => {
    setEditingIdentity(idVec);
    setEditIdTitle(idVec.title);
    setEditIdMission(idVec.lifesTaskStatement);
    setEditIdStage(idVec.currentPhase);
    setConfirmDeleteIdentity(false);
  };

  const openEditHabitModal = (habit: SerializedHabit) => {
    setEditingHabit(habit);
    setEditHabitIdentityId(habit.identityId);
    setEditHabitTitle(habit.title);
    setEditHabitMicro(habit.gatewayVersion);
    setEditHabitStage((habit.defaultPhase as SkillStage) || 'PRACTICE');
    setEditHabitAnchorId(habit.anchorHabitId || 'NONE');
    setEditRewardLabel(habit.temptationLabel || '');
    setEditRewardUrl(habit.temptationBundleUrl || '');
    setConfirmDeleteHabit(false);
  };

  const handleFinishSession = async (microOnly: boolean) => {
    if (!activeHabit) return;
    setIsSubmitting(true);
    try {
      const res = await logForgeSession({
        habitId: activeHabit.id,
        identityId: activeHabit.identityId,
        phase: stage,
        durationMinutes: microOnly ? 2 : sessionMins,
        completedGatewayOnly: microOnly,
        isResistancePractice: isChallenge,
        frictionRating: difficulty,
        bottleneckAttacked: bottleneckNote,
        tacitInsight: insightNote,
      });

      soundEngine.playSessionCompleteFanfare(soundEnabled);

      const nextTitle = activeHabit.nextStackedHabitTitle;
      const nextId = activeHabit.nextStackedHabitId;

      setToastMessage(
        `+${res.votesEarned} Identity Points earned!${
          nextTitle ? ` Up next in chain: ${nextTitle}` : ''
        }`
      );

      if (nextId) {
        const nextHabit = habits.find((h) => h.id === nextId) || null;
        if (nextHabit) {
          startFocusSession(nextHabit);
          return;
        }
      }
      setActiveHabit(null);
      setIsRunning(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await createIdentityVector({
        title: newIdTitle,
        lifesTaskStatement: newIdMission,
        currentPhase: newIdStage,
      });
      setNewIdTitle('');
      setNewIdMission('');
      setNewHabitIdentityId(created.id);
      setCreatorTab('HABIT');
      setToastMessage(`Identity "${created.title}" forged!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdentity) return;
    setIsSubmitting(true);
    try {
      await updateIdentityVector({
        id: editingIdentity.id,
        title: editIdTitle,
        lifesTaskStatement: editIdMission,
        currentPhase: editIdStage,
      });
      setEditingIdentity(null);
      setToastMessage('Identity updated!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIdentity = async () => {
    if (!editingIdentity) return;
    setIsSubmitting(true);
    try {
      await deleteIdentityVector(editingIdentity.id);
      if (selectedIdentityFilter === editingIdentity.id) {
        setSelectedIdentityFilter('ALL');
      }
      setEditingIdentity(null);
      setToastMessage('Identity and its associated habits removed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createStackedHabit({
        identityId: newHabitIdentityId || identities[0]?.id,
        title: newHabitTitle,
        gatewayVersion: newHabitMicro,
        defaultPhase: newHabitStage,
        anchorHabitId: newHabitAnchorId === 'NONE' ? null : newHabitAnchorId,
        temptationLabel: newRewardLabel || null,
        temptationBundleUrl: newRewardUrl || null,
      });
      setNewHabitTitle('');
      setNewHabitMicro('');
      setNewRewardLabel('');
      setNewRewardUrl('');
      setIsCreatorOpen(false);
      setToastMessage('New habit wired into your workflow!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit) return;
    setIsSubmitting(true);
    try {
      await updateStackedHabit({
        id: editingHabit.id,
        identityId: editHabitIdentityId,
        title: editHabitTitle,
        gatewayVersion: editHabitMicro,
        defaultPhase: editHabitStage,
        anchorHabitId: editHabitAnchorId === 'NONE' ? null : editHabitAnchorId,
        temptationLabel: editRewardLabel || null,
        temptationBundleUrl: editRewardUrl || null,
      });
      setEditingHabit(null);
      setToastMessage('Habit updated & chain rewired!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHabit = async () => {
    if (!editingHabit) return;
    setIsSubmitting(true);
    try {
      await deleteStackedHabit(editingHabit.id);
      setEditingHabit(null);
      setToastMessage('Habit deleted & chain automatically healed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const maxChartMinutes = Math.max(
    30,
    ...analytics.last7DaysChart.map((d) => d.minutes)
  );

  const activeDayDetail =
    inspectedDay || analytics.daysGrid[analytics.daysGrid.length - 1];

  const selectedEditAnchor = habits.find((h) => h.id === editHabitAnchorId);

  const navItems = [
    { id: 'WORKSPACE', label: 'Home', icon: Zap },
    { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3 },
    { id: 'HEATMAP', label: 'Continuity', icon: Calendar },
    { id: 'VAULT', label: 'Insights', icon: BookOpen },
  ] as const;

  return (
    <div className="relative min-h-screen bg-[#050508] text-zinc-100 pb-28 md:pb-16 selection:bg-indigo-500 selection:text-white">
      {/* Ambient Aurora Light Orbs (Gives Frosted Glass Depth & Refraction) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-indigo-600/15 blur-[130px]" />
        <div className="absolute top-1/4 -right-40 w-[460px] h-[460px] rounded-full bg-purple-600/12 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[150px]" />
      </div>

      {/* ========================================================= */}
      {/* FLOATING FROSTED-GLASS TOP HEADER                         */}
      {/* ========================================================= */}
      <header className="sticky top-3 z-30 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto glass-nav rounded-2xl px-4 sm:px-5 py-2.5 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white shadow-[0_0_25px_rgba(99,102,241,0.45)] border border-white/20">
              F
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                  ForgeOS
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-indigo-300">
                  Mastery Engine
                </span>
              </div>
            </div>
          </div>

          {/* Center Floating Liquid-Glass Tab Switcher (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.07]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundEngine.playTactileClick(soundEnabled);
                    setActiveTab(item.id);
                  }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    active
                      ? 'glass-tab-active text-white'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      active ? 'text-indigo-300 scale-110' : ''
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Status Telemetry (Clean — No Clunky Add Button Here) */}
          <div className="flex items-center gap-2">
            {installPromptEvent && (
              <button
                onClick={handleInstallPWA}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Audio Chimes On' : 'Audio Chimes Muted'}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                soundEnabled
                  ? 'bg-white/[0.05] border-white/[0.1] text-indigo-300 hover:bg-white/[0.1]'
                  : 'bg-white/[0.02] border-white/[0.05] text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <div
              title="Active Shielded Streak"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/15 to-amber-500/10 border border-orange-500/30 text-xs font-bold text-orange-300"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
              <span>{analytics.resilientStreak}d</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-7 space-y-7">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="glass-panel rounded-2xl p-4 border-emerald-500/40 bg-emerald-950/40 text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {toastMessage}
            </span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-300 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Frosted Identity Filter Pill Bar */}
        <div className="glass-panel rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedIdentityFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                selectedIdentityFilter === 'ALL'
                  ? 'glass-tab-active text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              All Identities
            </button>
            {identities.map((idObj) => (
              <button
                key={idObj.id}
                onClick={() => setSelectedIdentityFilter(idObj.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                  selectedIdentityFilter === idObj.id
                    ? 'glass-tab-active text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                {idObj.title}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {sessions.length < 5 && (
              <button
                onClick={() => seedSampleChainHistory()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 border border-amber-400/30 text-amber-300 hover:bg-amber-500/25 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load 21d Demo Telemetry
              </button>
            )}
            <button
              onClick={() => runMidnightGuardrailAudit()}
              title="Simulate midnight rollover to test Streak Shield"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.08] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Simulate Next Day</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: HOME WORKSPACE (WITH INLINE CREATION CARDS)        */}
        {/* ========================================================= */}
        {activeTab === 'WORKSPACE' && (
          <div className="space-y-9">
            {/* Section 1: Identity Vectors + Inline "New Identity" Card */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-400" />
                    Active Identity Vectors
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Every completed session casts a weighted vote toward one of your core identities.
                  </p>
                </div>

                <button
                  onClick={() => openCreatorOnHome('IDENTITY')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.14] text-xs font-semibold text-white transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  New Identity
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {identities.map((idVec) => {
                  const idSessions = sessions.filter((s) => s.identityId === idVec.id);
                  const idAnalytics = buildSystemAnalytics(
                    idSessions,
                    idVec.totalHoursLogged,
                    14
                  );
                  const logPct = Math.min(
                    100,
                    Math.max(
                      4,
                      Math.round(
                        (Math.log10(Math.max(1, idAnalytics.effectiveHours)) / 4) * 100
                      )
                    )
                  );

                  return (
                    <div
                      key={idVec.id}
                      className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
                            {idVec.currentPhase}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              {idVec.weightedScore.toFixed(1)} pts
                            </span>
                            <button
                              onClick={() => openEditIdentityModal(idVec)}
                              title="Edit or Delete Identity"
                              className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-white">{idVec.title}</h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {idVec.lifesTaskStatement}
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-white/[0.07]">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-200 font-medium">
                            {idAnalytics.effectiveHours} Effective Hrs
                          </span>
                          <span className="text-zinc-400">{idVec.totalVotes} votes</span>
                        </div>

                        <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/[0.06]">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"
                            style={{ width: `${logPct}%` }}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span>Absorb {idAnalytics.stageSplit.absorbPct}%</span>
                            <span>Drill {idAnalytics.stageSplit.drillPct}%</span>
                            <span>Build {idAnalytics.stageSplit.buildPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${idAnalytics.stageSplit.absorbPct}%` }}
                              className="bg-sky-400"
                            />
                            <div
                              style={{ width: `${idAnalytics.stageSplit.drillPct}%` }}
                              className="bg-amber-400"
                            />
                            <div
                              style={{ width: `${idAnalytics.stageSplit.buildPct}%` }}
                              className="bg-rose-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Interactive Home Card: Create New Identity */}
                <button
                  onClick={() => openCreatorOnHome('IDENTITY')}
                  className="rounded-2xl p-5 border border-dashed border-white/[0.15] hover:border-indigo-400/60 bg-white/[0.015] hover:bg-indigo-500/[0.06] transition-all flex flex-col items-center justify-center text-center gap-2.5 min-h-[190px] group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-300 group-hover:scale-110 group-hover:bg-indigo-500/25 transition">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Forge New Identity Vector
                    </span>
                    <span className="text-xs text-zinc-400 mt-0.5 block max-w-[220px]">
                      Define a new long-term skill identity to track hours and habits
                    </span>
                  </div>
                </button>
              </div>
            </section>

            {/* Section 2: Daily Action Queue + Inline "Wire New Habit" Card */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Daily Action Queue &amp; Micro-Start Triggers
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Show up for 120 seconds to clear the micro-gateway, or continue into deep flow.
                  </p>
                </div>

                <button
                  onClick={() => openCreatorOnHome('HABIT')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-[0_0_25px_rgba(99,102,241,0.35)] border border-white/20 transition cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Wire New Habit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {habits
                  .filter(
                    (h) =>
                      selectedIdentityFilter === 'ALL' ||
                      h.identityId === selectedIdentityFilter
                  )
                  .map((habit) => {
                    const stageMeta =
                      STAGE_LABELS[habit.defaultPhase as SkillStage] ||
                      STAGE_LABELS.PRACTICE;
                    const parentHabit = habits.find(
                      (p) => p.id === habit.anchorHabitId
                    );

                    return (
                      <div
                        key={habit.id}
                        className={`glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col justify-between gap-4 ${
                          habit.isReboundPriority
                            ? 'border-amber-400/50 bg-amber-950/15'
                            : ''
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-white/[0.07] border border-white/[0.08] text-zinc-200">
                                {habit.identityTitle}
                              </span>
                              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
                                {stageMeta.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-bold text-orange-400">
                                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                                {habit.currentStreak}d
                              </span>
                              <button
                                onClick={() => openEditHabitModal(habit)}
                                title="Edit Habit or Rewire Chain"
                                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {habit.isReboundPriority && (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Streak Shield Active (+1.25x Recovery Bonus Today)
                            </div>
                          )}

                          {habit.downscaledDaysRemaining > 0 && (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/30 ml-1">
                              Auto-Downscaled ({habit.downscaledDaysRemaining} micro-sessions left)
                            </div>
                          )}

                          <h3 className="text-base font-bold text-white leading-snug">
                            {habit.title}
                          </h3>

                          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.07] text-xs space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                              2-Minute Micro-Start Gateway:
                            </span>
                            <p className="text-zinc-200">{habit.gatewayVersion}</p>
                          </div>

                          <div className="space-y-1 pt-0.5 text-xs text-zinc-400">
                            {parentHabit && (
                              <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                                <span>Triggered after:</span>
                                <span className="text-zinc-200 font-medium">
                                  {parentHabit.title}
                                </span>
                              </p>
                            )}
                            {habit.nextStackedHabitTitle && (
                              <p className="flex items-center gap-1.5">
                                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>
                                  Next in chain:{' '}
                                  <strong className="text-zinc-100">
                                    {habit.nextStackedHabitTitle}
                                  </strong>
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => startFocusSession(habit)}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_6px_25px_rgba(99,102,241,0.3)] border border-white/15 transition cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          Start 2-Minute Micro-Timer
                        </button>
                      </div>
                    );
                  })}

                {/* Interactive Home Card: Wire New Habit Stack */}
                <button
                  onClick={() => openCreatorOnHome('HABIT')}
                  className="rounded-2xl p-6 border border-dashed border-white/[0.15] hover:border-emerald-400/60 bg-white/[0.015] hover:bg-emerald-500/[0.05] transition-all flex flex-col items-center justify-center text-center gap-2.5 min-h-[210px] group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 group-hover:bg-emerald-500/25 transition">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      + Wire New Habit into Queue
                    </span>
                    <span className="text-xs text-zinc-400 mt-1 block max-w-[260px]">
                      Configure a 2-minute micro-start action and chain it to an existing habit
                    </span>
                  </div>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: VISUAL ANALYTICS HUB                               */}
        {/* ========================================================= */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-xs text-zinc-400 block">Effective Skill Hours</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">
                  {analytics.effectiveHours}h
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  {analytics.totalHours}h raw clock time
                </span>
              </div>

              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-xs text-zinc-400 block">14-Day Consistency</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-1 block">
                  {analytics.completionRate14d}%
                </span>
                <span className="text-[11px] text-zinc-400">
                  {analytics.resilientStreak}d shielded streak
                </span>
              </div>

              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-xs text-zinc-400 block">High-Challenge Ratio</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1 block">
                  {analytics.challengeRatioPct}%
                </span>
                <span className="text-[11px] text-zinc-400">
                  Target: &ge; 30% of sessions
                </span>
              </div>

              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-xs text-zinc-400 block">Avg Session / Difficulty</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1 block">
                  {analytics.avgSessionMinutes}m
                </span>
                <span className="text-[11px] text-zinc-400">
                  Difficulty {analytics.avgDifficulty} / 5.0
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    7-Day Focus Velocity (Minutes &amp; Points)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Daily deep work output; crimson bars indicate high-challenge sessions.
                  </p>
                </div>

                <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 border-b border-white/[0.08]">
                  {analytics.last7DaysChart.map((bar) => {
                    const heightPct = Math.max(
                      6,
                      Math.round((bar.minutes / maxChartMinutes) * 100)
                    );
                    return (
                      <div
                        key={bar.dateStr}
                        className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                      >
                        <div className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition">
                          {bar.minutes > 0 ? `${bar.minutes}m` : ''}
                        </div>
                        <div className="w-full max-w-[44px] bg-black/50 rounded-t-xl h-36 flex items-end overflow-hidden border border-white/[0.07]">
                          <div
                            style={{ height: `${bar.minutes > 0 ? heightPct : 4}%` }}
                            className={`w-full rounded-t-lg transition-all duration-500 ${
                              bar.minutes === 0
                                ? 'bg-white/[0.06]'
                                : bar.isChallenge
                                ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                                : 'bg-gradient-to-t from-indigo-600 to-emerald-400'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] sm:text-xs font-mono text-zinc-400">
                          {bar.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-300 font-medium">
                    <span>Absorb (Study): {analytics.stageSplit.absorbPct}%</span>
                    <span>Drill (Practice): {analytics.stageSplit.drillPct}%</span>
                    <span>Build (Create): {analytics.stageSplit.buildPct}%</span>
                  </div>
                  <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden flex border border-white/[0.07]">
                    <div
                      style={{ width: `${analytics.stageSplit.absorbPct}%` }}
                      className="bg-sky-400"
                    />
                    <div
                      style={{ width: `${analytics.stageSplit.drillPct}%` }}
                      className="bg-amber-400"
                    />
                    <div
                      style={{ width: `${analytics.stageSplit.buildPct}%` }}
                      className="bg-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-amber-400" />
                    Session Difficulty Distribution
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Breakdown of cognitive load across logged sessions.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {analytics.difficultyDistribution.map((row) => (
                    <div key={row.level} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-200 font-medium">{row.label}</span>
                        <span className="text-zinc-400 font-mono">
                          {row.count} ({row.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/[0.06]">
                        <div
                          style={{ width: `${Math.max(3, row.pct)}%` }}
                          className={`h-full rounded-full ${
                            row.level >= 4
                              ? 'bg-rose-500'
                              : row.level === 3
                              ? 'bg-indigo-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Long-Term Skill Horizon (10h &rarr; 10,000h)
                </h3>
                <p className="text-xs text-zinc-400">
                  Logarithmic progression tracking automaticity, competence, and mastery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {SKILL_MILESTONES.map((m) => {
                  const unlocked = analytics.effectiveHours >= m.hours;
                  return (
                    <div
                      key={m.hours}
                      className={`p-4 rounded-xl border ${
                        unlocked
                          ? 'bg-emerald-500/10 border-emerald-400/40'
                          : 'bg-black/40 border-white/[0.07]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-white">
                          {m.hours.toLocaleString()} HRS
                        </span>
                        {unlocked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </div>
                      <div className="text-sm font-bold text-zinc-100">{m.title}</div>
                      <p className="text-[11px] text-zinc-400 mt-1">{m.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CONSISTENCY GRID                                   */}
        {/* ========================================================= */}
        {activeTab === 'HEATMAP' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    Continuity &amp; Streak Shield Matrix
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Tap any day cell to inspect session minutes, points, and recovery bridges.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-950 border-2 border-emerald-400 inline-block" />
                    2m Micro-Save
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                    Flow Session
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                    High-Challenge
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm border border-dashed border-amber-400 inline-block" />
                    Shield Bridge
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {analytics.daysGrid.slice(-28).map((day) => {
                  const selected = activeDayDetail?.dateStr === day.dateStr;
                  const cellColor =
                    day.status === 'HIGH_CHALLENGE'
                      ? 'bg-rose-500/90 text-white border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                      : day.status === 'FLOW_SESSION'
                      ? 'bg-emerald-500/90 text-zinc-950 border-emerald-300'
                      : day.status === 'MICRO_START'
                      ? 'bg-emerald-950/60 border-2 border-emerald-400 text-emerald-300'
                      : day.status === 'SHIELD_BRIDGED'
                      ? 'bg-amber-950/30 border border-dashed border-amber-400 text-amber-300'
                      : 'bg-black/40 border-white/[0.07] text-zinc-500 hover:border-white/[0.18]';

                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => setInspectedDay(day)}
                      className={`p-2 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${cellColor} ${
                        selected ? 'ring-2 ring-white' : ''
                      }`}
                    >
                      <span className="text-[10px] font-mono opacity-80">{day.label}</span>
                      <span className="text-xs font-bold">
                        {day.status === 'HIGH_CHALLENGE' && '⚔️'}
                        {day.status === 'FLOW_SESSION' && '✓'}
                        {day.status === 'MICRO_START' && '2m'}
                        {day.status === 'SHIELD_BRIDGED' && '⇄'}
                        {day.status === 'NONE' && '·'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeDayDetail && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-zinc-400">
                      {activeDayDetail.dateStr} ({activeDayDetail.shortDay})
                    </span>
                    <h4 className="text-base font-bold text-white">
                      {activeDayDetail.label} — {activeDayDetail.status.replace('_', ' ')}
                    </h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                      <span className="text-zinc-400 block">Focus Time</span>
                      <strong className="text-white text-sm">
                        {activeDayDetail.totalMinutes} mins
                      </strong>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                      <span className="text-zinc-400 block">Points Earned</span>
                      <strong className="text-emerald-400 text-sm">
                        +{activeDayDetail.totalPoints} pts
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: INSIGHT VAULT                                      */}
        {/* ========================================================= */}
        {activeTab === 'VAULT' && (
          <div className="space-y-4">
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Skill Insight &amp; Bottleneck Vault
                </h2>
                <p className="text-xs text-zinc-400">
                  Key mental models and bottlenecks captured after your focus sessions.
                </p>
              </div>

              {filteredSessions.filter((s) => s.bottleneckAttacked || s.tacitInsight).length ===
              0 ? (
                <div className="p-8 rounded-xl bg-black/40 border border-white/[0.07] text-center space-y-2">
                  <p className="text-sm font-semibold text-zinc-200">
                    No session insights recorded yet.
                  </p>
                  <p className="text-xs text-zinc-400">
                    Complete any session or click &ldquo;Load 21d Demo Telemetry&rdquo; above to populate sample field notes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSessions
                    .filter((s) => s.bottleneckAttacked || s.tacitInsight)
                    .slice()
                    .reverse()
                    .map((s) => (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-indigo-300">
                            {s.identityTitle}
                          </span>
                          <span className="font-mono text-zinc-400">
                            {s.loggedAt.split('T')[0]} • {s.durationMinutes}m
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{s.habitTitle}</h4>
                        {s.bottleneckAttacked && (
                          <p className="text-xs text-rose-200 bg-rose-500/10 border border-rose-400/25 p-2.5 rounded-lg">
                            <strong>Challenge Tackled:</strong> {s.bottleneckAttacked}
                          </p>
                        )}
                        {s.tacitInsight && (
                          <p className="text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-400/25 p-2.5 rounded-lg">
                            <strong>Key Takeaway:</strong> {s.tacitInsight}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* FLOATING FROSTED-GLASS MOBILE DOCK                        */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-4 inset-x-4 z-40 glass-nav rounded-2xl p-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundEngine.playTactileClick(soundEnabled);
                setActiveTab(item.id);
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                active
                  ? 'glass-tab-active text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-indigo-300' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================= */}
      {/* EDIT & REWIRE HABIT MODAL                                 */}
      {/* ========================================================= */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <div className="glass-nav rounded-3xl max-w-lg w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-indigo-400" />
                  Edit Habit &amp; Rewire Chain
                </h3>
                <p className="text-xs text-zinc-400">
                  Modify micro-steps, skill stage, or splice into a different habit stack.
                </p>
              </div>
              <button
                onClick={() => setEditingHabit(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateHabitSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Target Identity</label>
                  <select
                    value={editHabitIdentityId}
                    onChange={(e) => setEditHabitIdentityId(e.target.value)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                  >
                    {identities.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Skill Stage</label>
                  <select
                    value={editHabitStage}
                    onChange={(e) => setEditHabitStage(e.target.value as SkillStage)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                  >
                    <option value="PASSIVE">Absorb (Study — 0.8x)</option>
                    <option value="PRACTICE">Drill (Practice — 1.2x)</option>
                    <option value="ACTIVE">Build (Create — 1.75x)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Full Habit Title</label>
                <input
                  type="text"
                  required
                  value={editHabitTitle}
                  onChange={(e) => setEditHabitTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-emerald-400 block mb-1">
                  2-Minute Micro-Start Version
                </label>
                <input
                  type="text"
                  required
                  value={editHabitMicro}
                  onChange={(e) => setEditHabitMicro(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-black/50 border border-indigo-500/30 space-y-2.5">
                <label className="text-xs font-bold text-indigo-300 block">
                  Chain Sequence Rewiring (&ldquo;After [Habit A], trigger [This Habit]&rdquo;)
                </label>
                <select
                  value={editHabitAnchorId}
                  onChange={(e) => setEditHabitAnchorId(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/[0.12] rounded-lg p-2 text-xs text-white"
                >
                  <option value="NONE">⚡ Standalone / Start of Chain (No preceding habit)</option>
                  {habits
                    .filter((h) => h.id !== editingHabit.id)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        After: {h.title} ({h.identityTitle})
                      </option>
                    ))}
                </select>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                  <span className="text-zinc-400 font-mono">New Flow:</span>
                  {selectedEditAnchor ? (
                    <>
                      <span className="px-2 py-0.5 rounded bg-white/[0.08] text-zinc-200">
                        {selectedEditAnchor.title}
                      </span>
                      <ArrowRight className="w-3 h-3 text-indigo-400" />
                      <span className="px-2 py-0.5 rounded bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 font-semibold">
                        {editHabitTitle || 'This Habit'}
                      </span>
                    </>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 font-semibold">
                      Standalone Root Habit
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">
                    Reward Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Synthwave Mix"
                    value={editRewardLabel}
                    onChange={(e) => setEditRewardLabel(e.target.value)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">
                    Reward URL (Unlocked at 2m)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editRewardUrl}
                    onChange={(e) => setEditRewardUrl(e.target.value)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
                {!confirmDeleteHabit ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteHabit(true)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleDeleteHabit}
                      className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteHabit(false)}
                      className="text-xs text-zinc-400 hover:text-white px-2 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingHabit(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-zinc-300 text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT & DELETE IDENTITY MODAL                              */}
      {/* ========================================================= */}
      {editingIdentity && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <div className="glass-nav rounded-3xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-400" />
                Edit Identity Vector
              </h3>
              <button
                onClick={() => setEditingIdentity(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateIdentitySubmit} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Identity Title</label>
                <input
                  type="text"
                  required
                  value={editIdTitle}
                  onChange={(e) => setEditIdTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">
                  Core Objective / Mission Statement
                </label>
                <textarea
                  rows={3}
                  required
                  value={editIdMission}
                  onChange={(e) => setEditIdMission(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Current Stage</label>
                <select
                  value={editIdStage}
                  onChange={(e) => setEditIdStage(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                >
                  <option value="OBSERVATION">Stage 1: Observation &amp; Foundation</option>
                  <option value="PRACTICE">Stage 2: Deliberate Practice</option>
                  <option value="EXPERIMENTATION">Stage 3: Active Experimentation</option>
                </select>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                {!confirmDeleteIdentity ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteIdentity(true)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleDeleteIdentity}
                      className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Confirm Delete All
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteIdentity(false)}
                      className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingIdentity(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-zinc-300 text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Save Identity
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FULL-SCREEN FOCUS TIMER & DEBRIEF MODAL                   */}
      {/* ========================================================= */}
      {activeHabit && (
        <div className="fixed inset-0 z-50 bg-[#050508]/95 backdrop-blur-2xl p-4 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="max-w-2xl w-full mx-auto flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-xs font-mono uppercase text-indigo-400">
                {activeHabit.identityTitle}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {microCleared ? activeHabit.title : activeHabit.gatewayVersion}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => soundEngine.playMicroClearedChime(true)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" /> Test Chime
              </button>
              <button
                onClick={() => {
                  setIsRunning(false);
                  setActiveHabit(null);
                }}
                className="p-2 rounded-xl bg-white/[0.06] text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!showDebrief ? (
            <div className="max-w-2xl w-full mx-auto my-auto space-y-6 py-6">
              <div className="glass-nav p-8 rounded-3xl text-center space-y-5">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full ${
                    microCleared
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                  }`}
                >
                  {microCleared
                    ? '✓ 2-Minute Micro-Start Cleared — Deep Flow Active'
                    : '2-Minute Micro-Start Mode'}
                </span>

                <div className="text-6xl sm:text-7xl font-mono font-black text-white">
                  {formatClock(secondsElapsed)}
                </div>

                <div className="max-w-xs mx-auto w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/[0.08]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      microCleared ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((secondsElapsed / MICRO_THRESHOLD) * 100))}%`,
                    }}
                  />
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setIsRunning((r) => !r)}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isRunning ? 'Pause' : 'Resume'}
                  </button>

                  {!microCleared && (
                    <button
                      type="button"
                      onClick={() => setSecondsElapsed((s) => s + 30)}
                      title="Skip ahead 30 seconds to test the 2-minute completion chime"
                      className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.1] text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FastForward className="w-3.5 h-3.5 text-indigo-400" />
                      +30s
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsRunning(false);
                      setShowDebrief(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Finish &amp; Log (+{liveScorePreview} pts)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-zinc-300 block">Skill Stage</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['PASSIVE', 'PRACTICE', 'ACTIVE'] as SkillStage[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          soundEngine.playTactileClick(soundEnabled);
                          setStage(st);
                        }}
                        className={`py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          stage === st
                            ? 'glass-tab-active text-white'
                            : 'bg-black/40 border-white/[0.07] text-zinc-400'
                        }`}
                      >
                        {st === 'PASSIVE' ? 'Absorb' : st === 'PRACTICE' ? 'Drill' : 'Build'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playTactileClick(soundEnabled);
                      setIsChallenge((c) => !c);
                    }}
                    className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
                      isChallenge
                        ? 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                        : 'bg-black/40 border-white/[0.07] text-zinc-400'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-rose-400" />
                      High-Challenge Mode
                    </span>
                    <span>{isChallenge ? '1.5x ON' : 'OFF'}</span>
                  </button>
                </div>

                <div className="glass-panel p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-zinc-300">Difficulty Rating</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {difficulty} / 5
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  {activeHabit.temptationBundleUrl && (
                    <div className="pt-2 flex items-center justify-between text-xs border-t border-white/[0.08]">
                      <span className="text-zinc-300 truncate">
                        Reward: {activeHabit.temptationLabel || 'Media Link'}
                      </span>
                      {microCleared ? (
                        <a
                          href={activeHabit.temptationBundleUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 font-bold flex items-center gap-1"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Open
                        </a>
                      ) : (
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> {MICRO_THRESHOLD - secondsElapsed}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-xl w-full mx-auto my-auto glass-nav rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Session Summary &amp; Notes</h3>
              <input
                type="text"
                placeholder="What specific challenge or weak spot did you tackle? (Optional)"
                value={bottleneckNote}
                onChange={(e) => setBottleneckNote(e.target.value)}
                className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-3 text-sm text-white"
              />
              <textarea
                rows={3}
                placeholder="Key insight or takeaway from this session (Optional)"
                value={insightNote}
                onChange={(e) => setInsightNote(e.target.value)}
                className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-3 text-sm text-white"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleFinishSession(true)}
                  className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                >
                  Log 2-Min Micro-Start Save
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleFinishSession(false)}
                  className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                >
                  Log Full Session ({sessionMins} mins)
                </button>
              </div>
            </div>
          )}
          <div />
        </div>
      )}

      {/* ========================================================= */}
      {/* CREATOR MODAL (LAUNCHED FROM HOME PAGE CARDS/BUTTONS)     */}
      {/* ========================================================= */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <div className="glass-nav rounded-3xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                {creatorTab === 'HABIT' ? 'Wire New Habit Stack' : 'Forge New Identity Vector'}
              </h3>
              <button
                onClick={() => setIsCreatorOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-black/50 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setCreatorTab('HABIT')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  creatorTab === 'HABIT' ? 'glass-tab-active text-white' : 'text-zinc-400'
                }`}
              >
                New Habit
              </button>
              <button
                type="button"
                onClick={() => setCreatorTab('IDENTITY')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  creatorTab === 'IDENTITY' ? 'glass-tab-active text-white' : 'text-zinc-400'
                }`}
              >
                New Identity
              </button>
            </div>

            {creatorTab === 'HABIT' ? (
              <form onSubmit={handleCreateHabitSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Target Identity</label>
                  <select
                    value={newHabitIdentityId}
                    onChange={(e) => setNewHabitIdentityId(e.target.value)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                  >
                    {identities.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Full Habit Action</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Solve 1 Medium Algorithm Problem"
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-emerald-400 block mb-1">
                    2-Minute Micro-Start Version
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Open editor and read problem description"
                    value={newHabitMicro}
                    onChange={(e) => setNewHabitMicro(e.target.value)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Skill Stage</label>
                    <select
                      value={newHabitStage}
                      onChange={(e) => setNewHabitStage(e.target.value as SkillStage)}
                      className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                    >
                      <option value="PASSIVE">Absorb (Study)</option>
                      <option value="PRACTICE">Drill (Practice)</option>
                      <option value="ACTIVE">Build (Create)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">
                      Chain After Habit
                    </label>
                    <select
                      value={newHabitAnchorId}
                      onChange={(e) => setNewHabitAnchorId(e.target.value)}
                      className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                    >
                      <option value="NONE">Standalone</option>
                      {habits.map((h) => (
                        <option key={h.id} value={h.id}>
                          After: {h.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs cursor-pointer"
                >
                  Save &amp; Wire Habit
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateIdentitySubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Identity Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Cloud Systems Architect"
                    value={newIdTitle}
                    onChange={(e) => setNewIdTitle(e.target.value)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">
                    Core Objective / North Star
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g., Design scalable distributed backend services."
                    value={newIdMission}
                    onChange={(e) => setNewIdMission(e.target.value)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-2.5 text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                >
                  Create Identity
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
