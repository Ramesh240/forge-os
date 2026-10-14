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
  signInWithGoogleAction,
  signOutAction,
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
  Palette,
  LogOut,
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

type ThemeMode = 'obsidian' | 'sepia' | 'light';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface UserProfile {
  name: string;
  email: string;
  image: string | null;
}

export default function ForgeAppShell({
  identities,
  habits,
  sessions,
  currentUser,
  googleAuthEnabled,
}: {
  identities: SerializedIdentity[];
  habits: SerializedHabit[];
  sessions: SerializedSession[];
  currentUser?: UserProfile | null;
  googleAuthEnabled?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'WORKSPACE' | 'ANALYTICS' | 'HEATMAP' | 'VAULT'>('WORKSPACE');
  const [selectedIdentityFilter, setSelectedIdentityFilter] = useState<string>('ALL');
  const [theme, setTheme] = useState<ThemeMode>('obsidian');

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

  // Create Modal State (Launched from Centered Home Dock)
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

  const [inspectedDay, setInspectedDay] = useState<ContinuityDay | null>(null);

  const MICRO_THRESHOLD = 120;
  const microCleared = secondsElapsed >= MICRO_THRESHOLD;
  const sessionMins = Math.max(2, Math.round(secondsElapsed / 60));

  // Initialize Theme, Sound, and PWA listener
  useEffect(() => {
    const savedTheme = (localStorage.getItem('forge_theme') as ThemeMode) || 'obsidian';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedSound = localStorage.getItem('forge_sound_enabled');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const cycleTheme = () => {
    const order: ThemeMode[] = ['obsidian', 'sepia', 'light'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    localStorage.setItem('forge_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    soundEngine.playTactileClick(soundEnabled);
  };

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

  const openCenteredCreator = (tab: 'HABIT' | 'IDENTITY') => {
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
        `+${res.votesEarned} pts logged${nextTitle ? ` • Next: ${nextTitle}` : ''}`
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
      setToastMessage(`Identity "${created.title}" created!`);
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
      setToastMessage('Identity removed.');
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
      setToastMessage('Habit added to your queue!');
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
      setToastMessage('Habit updated!');
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
      setToastMessage('Habit removed.');
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

  const themeLabels: Record<ThemeMode, string> = {
    obsidian: 'Obsidian',
    sepia: 'Sepia',
    light: 'Daylight',
  };

  const visibleHabits = habits.filter(
    (h) => selectedIdentityFilter === 'ALL' || h.identityId === selectedIdentityFilter
  );

  return (
    <div className="relative min-h-screen theme-surface pb-28 md:pb-16">
      {/* Subtle Ambient Light Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute -top-40 left-1/4 w-[480px] h-[480px] rounded-full blur-[130px]"
          style={{ background: 'var(--orb-1)' }}
        />
        <div
          className="absolute bottom-10 right-1/4 w-[440px] h-[440px] rounded-full blur-[140px]"
          style={{ background: 'var(--orb-2)' }}
        />
      </div>

      {/* ========================================================= */}
      {/* MINIMAL FLOATING GLASS HEADER                             */}
      {/* ========================================================= */}
      <header className="sticky top-3 z-30 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto glass-nav rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-sm"
              style={{ background: 'var(--accent-primary)' }}
            >
              F
            </div>
            <span className="text-base font-bold tracking-tight theme-text">
              ForgeOS
            </span>
          </div>

          {/* Center Glass Pill Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl border border-[var(--border-subtle)]">
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
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'glass-tab-active'
                      : 'theme-subtext hover:opacity-80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Theme Switcher, Sound, Streak */}
          <div className="flex items-center gap-2">
            {/* Google Login / Profile Pill */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl glass-panel">
                {currentUser.image ? (
                  <img
                    src={currentUser.image}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: 'var(--accent-primary)' }}
                  >
                    {currentUser.name[0]?.toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-semibold theme-text max-w-[90px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    title="Sign Out"
                    className="p-1 rounded-lg theme-muted hover:opacity-80 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            ) : googleAuthEnabled ? (
              <form action={signInWithGoogleAction}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-xs font-semibold theme-text hover:opacity-90 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>Sign in</span>
                </button>
              </form>
            ) : null}

            <button
              onClick={cycleTheme}
              title="Switch Theme (Obsidian / Sepia / Daylight)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-xs font-semibold theme-text cursor-pointer hover:opacity-90"
            >
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">{themeLabels[theme]}</span>
            </button>

            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Sound On' : 'Muted'}
              className="p-2 rounded-xl glass-panel theme-subtext hover:opacity-80 cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {installPromptEvent && (
              <button
                onClick={handleInstallPWA}
                className="p-2 rounded-xl glass-panel text-emerald-500 cursor-pointer"
                title="Install App"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl glass-panel text-xs font-bold text-orange-500">
              <Flame className="w-3.5 h-3.5 fill-orange-500" />
              <span>{analytics.resilientStreak}d</span>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER (MAX-W-5XL FOR CALM MINIMALISTIC FOCUS)    */}
      {/* ========================================================= */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Toast Banner */}
        {toastMessage && (
          <div className="glass-panel rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs sm:text-sm">
            <span className="flex items-center gap-2 font-medium theme-text">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              {toastMessage}
            </span>
            <button
              onClick={() => setToastMessage(null)}
              className="theme-muted hover:opacity-80 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: MINIMALISTIC HOME WORKSPACE                        */}
        {/* ========================================================= */}
        {activeTab === 'WORKSPACE' && (
          <div className="space-y-9">
            {/* CENTERED HERO & PRIMARY ACTION DOCK */}
            <section className="text-center max-w-xl mx-auto space-y-5 pt-2">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-widest theme-muted">
                  {analytics.effectiveHours} Effective Hrs • {analytics.completionRate14d}% Consistency
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight theme-text">
                  What identity are you building today?
                </h1>
              </div>

              {/* Centered Creation Command Pill */}
              <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl glass-nav">
                <button
                  onClick={() => openCenteredCreator('HABIT')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition hover:opacity-95 cursor-pointer"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  <Plus className="w-4 h-4" />
                  New Habit
                </button>

                <button
                  onClick={() => openCenteredCreator('IDENTITY')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold theme-text hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-amber-500" />
                  New Identity
                </button>
              </div>

              {/* Centered Minimal Identity Filter Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                <button
                  onClick={() => setSelectedIdentityFilter('ALL')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                    selectedIdentityFilter === 'ALL'
                      ? 'glass-tab-active'
                      : 'glass-panel theme-subtext hover:opacity-80'
                  }`}
                >
                  All ({habits.length})
                </button>
                {identities.map((idObj) => (
                  <div
                    key={idObj.id}
                    className={`inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-full text-xs font-medium transition ${
                      selectedIdentityFilter === idObj.id
                        ? 'glass-tab-active'
                        : 'glass-panel theme-subtext'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedIdentityFilter(idObj.id)}
                      className="cursor-pointer"
                    >
                      {idObj.title}
                    </button>
                    <button
                      onClick={() => openEditIdentityModal(idObj)}
                      title="Edit Identity"
                      className="opacity-60 hover:opacity-100 p-0.5 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* COMPACT IDENTITY SUMMARY STRIP */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {identities.map((idVec) => (
                <div
                  key={idVec.id}
                  className="glass-panel glass-panel-hover rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase theme-muted">
                        {idVec.currentPhase}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold theme-text truncate mt-0.5">
                      {idVec.title}
                    </h3>
                    <span className="text-xs theme-subtext">
                      {idVec.totalHoursLogged}h • {idVec.weightedScore.toFixed(0)} pts
                    </span>
                  </div>

                  <button
                    onClick={() => openEditIdentityModal(idVec)}
                    className="p-2 rounded-xl glass-panel theme-subtext hover:opacity-80 shrink-0 cursor-pointer"
                    title="Edit Identity"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </section>

            {/* MINIMALISTIC DAILY HABIT QUEUE */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider theme-muted">
                  Today&apos;s Focus Queue ({visibleHabits.length})
                </span>
                {sessions.length < 5 && (
                  <button
                    onClick={() => seedSampleChainHistory()}
                    className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Load Sample History
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {visibleHabits.map((habit) => {
                  const stageMeta =
                    STAGE_LABELS[habit.defaultPhase as SkillStage] ||
                    STAGE_LABELS.PRACTICE;

                  return (
                    <div
                      key={habit.id}
                      className={`glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col justify-between gap-4 ${
                        habit.isReboundPriority ? 'ring-1 ring-amber-500/50' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium theme-subtext">
                              {habit.identityTitle}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md glass-panel theme-muted">
                              {stageMeta.name.split(' ')[0]}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs font-bold text-orange-500">
                              <Flame className="w-3.5 h-3.5 fill-orange-500" />
                              {habit.currentStreak}d
                            </span>
                            <button
                              onClick={() => openEditHabitModal(habit)}
                              className="p-1.5 rounded-lg theme-muted hover:opacity-80 cursor-pointer"
                              title="Edit or Rewire"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-base font-bold theme-text leading-snug">
                          {habit.title}
                        </h3>

                        <p className="text-xs theme-subtext">
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            2m Start:
                          </strong>{' '}
                          {habit.gatewayVersion}
                        </p>

                        {habit.nextStackedHabitTitle && (
                          <p className="text-[11px] theme-muted flex items-center gap-1 pt-0.5">
                            <ArrowRight className="w-3 h-3" />
                            Next: {habit.nextStackedHabitTitle}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => startFocusSession(habit)}
                        className="w-full py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition cursor-pointer"
                        style={{ background: 'var(--accent-primary)' }}
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Start 2-Min Session
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ANALYTICS HUB                                      */}
        {/* ========================================================= */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-xs theme-subtext block">Effective Hours</span>
                <span className="text-2xl font-extrabold theme-text mt-1 block">
                  {analytics.effectiveHours}h
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  {analytics.totalHours}h logged
                </span>
              </div>

              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-xs theme-subtext block">14d Consistency</span>
                <span className="text-2xl font-extrabold theme-text mt-1 block">
                  {analytics.completionRate14d}%
                </span>
                <span className="text-[11px] theme-muted">
                  {analytics.resilientStreak}d active chain
                </span>
              </div>

              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-xs theme-subtext block">Challenge Ratio</span>
                <span className="text-2xl font-extrabold text-rose-500 mt-1 block">
                  {analytics.challengeRatioPct}%
                </span>
                <span className="text-[11px] theme-muted">Target &ge; 30%</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl">
                <span className="text-xs theme-subtext block">Avg Session</span>
                <span className="text-2xl font-extrabold text-amber-500 mt-1 block">
                  {analytics.avgSessionMinutes}m
                </span>
                <span className="text-[11px] theme-muted">
                  Difficulty {analytics.avgDifficulty}/5
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-base font-bold theme-text">7-Day Focus Velocity</h3>
                  <p className="text-xs theme-subtext">
                    Daily minutes completed across selected identities.
                  </p>
                </div>

                <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2 border-b border-[var(--border-subtle)]">
                  {analytics.last7DaysChart.map((bar) => {
                    const heightPct = Math.max(
                      6,
                      Math.round((bar.minutes / maxChartMinutes) * 100)
                    );
                    return (
                      <div
                        key={bar.dateStr}
                        className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                      >
                        <div className="text-[10px] font-mono theme-subtext">
                          {bar.minutes > 0 ? `${bar.minutes}m` : ''}
                        </div>
                        <div className="w-full max-w-[40px] bg-black/10 dark:bg-white/5 rounded-t-xl h-32 flex items-end overflow-hidden">
                          <div
                            style={{
                              height: `${bar.minutes > 0 ? heightPct : 4}%`,
                              background:
                                bar.minutes === 0
                                  ? 'transparent'
                                  : bar.isChallenge
                                  ? '#f43f5e'
                                  : 'var(--accent-primary)',
                            }}
                            className="w-full rounded-t-lg transition-all duration-500"
                          />
                        </div>
                        <span className="text-[10px] font-mono theme-subtext">
                          {bar.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs theme-subtext font-medium">
                    <span>Absorb: {analytics.stageSplit.absorbPct}%</span>
                    <span>Drill: {analytics.stageSplit.drillPct}%</span>
                    <span>Build: {analytics.stageSplit.buildPct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${analytics.stageSplit.absorbPct}%` }}
                      className="bg-sky-500"
                    />
                    <div
                      style={{ width: `${analytics.stageSplit.drillPct}%` }}
                      className="bg-amber-500"
                    />
                    <div
                      style={{ width: `${analytics.stageSplit.buildPct}%` }}
                      className="bg-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-base font-bold theme-text">Difficulty Split</h3>
                  <p className="text-xs theme-subtext">Cognitive intensity distribution.</p>
                </div>

                <div className="space-y-3">
                  {analytics.difficultyDistribution.map((row) => (
                    <div key={row.level} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="theme-text font-medium">{row.label}</span>
                        <span className="theme-muted font-mono">{row.pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${Math.max(4, row.pct)}%`,
                            background: 'var(--accent-primary)',
                          }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold theme-text">
                10,000-Hour Mastery Milestones
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {SKILL_MILESTONES.map((m) => {
                  const unlocked = analytics.effectiveHours >= m.hours;
                  return (
                    <div
                      key={m.hours}
                      className={`p-4 rounded-xl border ${
                        unlocked
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : 'border-[var(--border-subtle)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold theme-text">
                          {m.hours.toLocaleString()}h
                        </span>
                        {unlocked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 theme-muted" />
                        )}
                      </div>
                      <div className="text-sm font-bold theme-text">{m.title}</div>
                      <p className="text-[11px] theme-subtext mt-1">{m.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CONTINUITY HEATMAP                                 */}
        {/* ========================================================= */}
        {activeTab === 'HEATMAP' && (
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold theme-text">28-Day Continuity Matrix</h2>
                <p className="text-xs theme-subtext">
                  Tap any day cell to inspect focus duration and points.
                </p>
              </div>
              <button
                onClick={() => runMidnightGuardrailAudit()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-xs font-medium theme-subtext cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Simulate Next Day
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {analytics.daysGrid.slice(-28).map((day) => {
                const selected = activeDayDetail?.dateStr === day.dateStr;
                const cellStyle =
                  day.status === 'HIGH_CHALLENGE'
                    ? 'bg-rose-500 text-white'
                    : day.status === 'FLOW_SESSION'
                    ? 'bg-emerald-500 text-white'
                    : day.status === 'MICRO_START'
                    ? 'border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : day.status === 'SHIELD_BRIDGED'
                    ? 'border border-dashed border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'glass-panel theme-muted';

                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setInspectedDay(day)}
                    className={`p-2.5 sm:p-3 rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer ${cellStyle} ${
                      selected ? 'ring-2 ring-indigo-500' : ''
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
              <div className="p-4 rounded-xl glass-panel flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono theme-muted">
                    {activeDayDetail.dateStr}
                  </span>
                  <h4 className="text-sm font-bold theme-text">
                    {activeDayDetail.label} — {activeDayDetail.status.replace('_', ' ')}
                  </h4>
                </div>
                <div className="text-right text-xs">
                  <strong className="theme-text block">
                    {activeDayDetail.totalMinutes} mins
                  </strong>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    +{activeDayDetail.totalPoints} pts
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: INSIGHT VAULT                                      */}
        {/* ========================================================= */}
        {activeTab === 'VAULT' && (
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div>
              <h2 className="text-lg font-bold theme-text">Insight &amp; Bottleneck Vault</h2>
              <p className="text-xs theme-subtext">
                Breakthroughs and weak spots recorded after focus sessions.
              </p>
            </div>

            {filteredSessions.filter((s) => s.bottleneckAttacked || s.tacitInsight).length ===
            0 ? (
              <div className="p-8 rounded-xl glass-panel text-center space-y-1">
                <p className="text-sm font-semibold theme-text">No notes recorded yet.</p>
                <p className="text-xs theme-subtext">
                  Finish any session to log a takeaway.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSessions
                  .filter((s) => s.bottleneckAttacked || s.tacitInsight)
                  .slice()
                  .reverse()
                  .map((s) => (
                    <div key={s.id} className="p-4 rounded-xl glass-panel space-y-2">
                      <div className="flex justify-between text-xs theme-muted font-mono">
                        <span>{s.identityTitle}</span>
                        <span>{s.loggedAt.split('T')[0]}</span>
                      </div>
                      <h4 className="text-sm font-bold theme-text">{s.habitTitle}</h4>
                      {s.bottleneckAttacked && (
                        <p className="text-xs theme-subtext">
                          <strong>Challenge:</strong> {s.bottleneckAttacked}
                        </p>
                      )}
                      {s.tacitInsight && (
                        <p className="text-xs theme-subtext">
                          <strong>Insight:</strong> {s.tacitInsight}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
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
                active ? 'glass-tab-active' : 'theme-subtext'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================= */}
      {/* CENTERED CREATOR MODAL (HABIT OR IDENTITY)                */}
      {/* ========================================================= */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <div className="glass-nav rounded-3xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold theme-text">
                {creatorTab === 'HABIT' ? 'New Habit' : 'New Identity'}
              </h3>
              <button
                onClick={() => setIsCreatorOpen(false)}
                className="theme-muted hover:opacity-80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setCreatorTab('HABIT')}
                className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                  creatorTab === 'HABIT' ? 'glass-tab-active' : 'theme-subtext'
                }`}
              >
                Habit
              </button>
              <button
                type="button"
                onClick={() => setCreatorTab('IDENTITY')}
                className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                  creatorTab === 'IDENTITY' ? 'glass-tab-active' : 'theme-subtext'
                }`}
              >
                Identity
              </button>
            </div>

            {creatorTab === 'HABIT' ? (
              <form onSubmit={handleCreateHabitSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs theme-subtext block mb-1">Identity</label>
                  <select
                    value={newHabitIdentityId}
                    onChange={(e) => setNewHabitIdentityId(e.target.value)}
                    className="w-full theme-input rounded-xl p-2.5 text-sm"
                  >
                    {identities.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs theme-subtext block mb-1">Habit Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Solve 1 Algorithm Problem"
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    className="w-full theme-input rounded-xl p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs theme-subtext block mb-1">
                    2-Minute Micro-Start Step
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Open IDE and read problem statement"
                    value={newHabitMicro}
                    onChange={(e) => setNewHabitMicro(e.target.value)}
                    className="w-full theme-input rounded-xl p-2.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs theme-subtext block mb-1">Stage</label>
                    <select
                      value={newHabitStage}
                      onChange={(e) => setNewHabitStage(e.target.value as SkillStage)}
                      className="w-full theme-input rounded-xl p-2.5 text-sm"
                    >
                      <option value="PASSIVE">Absorb (Study)</option>
                      <option value="PRACTICE">Drill (Practice)</option>
                      <option value="ACTIVE">Build (Create)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs theme-subtext block mb-1">Chain After</label>
                    <select
                      value={newHabitAnchorId}
                      onChange={(e) => setNewHabitAnchorId(e.target.value)}
                      className="w-full theme-input rounded-xl p-2.5 text-sm"
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
                  className="w-full py-3 rounded-xl text-white font-bold text-xs cursor-pointer"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  Create Habit
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateIdentitySubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs theme-subtext block mb-1">Identity Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Systems Architect"
                    value={newIdTitle}
                    onChange={(e) => setNewIdTitle(e.target.value)}
                    className="w-full theme-input rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs theme-subtext block mb-1">Core Objective</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g., Build scalable backend systems."
                    value={newIdMission}
                    onChange={(e) => setNewIdMission(e.target.value)}
                    className="w-full theme-input rounded-xl p-2.5 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl text-white font-bold text-xs cursor-pointer"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  Create Identity
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT HABIT MODAL                                          */}
      {/* ========================================================= */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <div className="glass-nav rounded-3xl max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold theme-text">Edit Habit</h3>
              <button
                onClick={() => setEditingHabit(null)}
                className="theme-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateHabitSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs theme-subtext block mb-1">Habit Title</label>
                <input
                  type="text"
                  required
                  value={editHabitTitle}
                  onChange={(e) => setEditHabitTitle(e.target.value)}
                  className="w-full theme-input rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs theme-subtext block mb-1">
                  2-Minute Micro-Start
                </label>
                <input
                  type="text"
                  required
                  value={editHabitMicro}
                  onChange={(e) => setEditHabitMicro(e.target.value)}
                  className="w-full theme-input rounded-xl p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs theme-subtext block mb-1">Identity</label>
                  <select
                    value={editHabitIdentityId}
                    onChange={(e) => setEditHabitIdentityId(e.target.value)}
                    className="w-full theme-input rounded-xl p-2.5 text-sm"
                  >
                    {identities.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs theme-subtext block mb-1">Stage</label>
                  <select
                    value={editHabitStage}
                    onChange={(e) => setEditHabitStage(e.target.value as SkillStage)}
                    className="w-full theme-input rounded-xl p-2.5 text-sm"
                  >
                    <option value="PASSIVE">Absorb</option>
                    <option value="PRACTICE">Drill</option>
                    <option value="ACTIVE">Build</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs theme-subtext block mb-1">
                  Chain Sequence (&ldquo;After Habit&rdquo;)
                </label>
                <select
                  value={editHabitAnchorId}
                  onChange={(e) => setEditHabitAnchorId(e.target.value)}
                  className="w-full theme-input rounded-xl p-2.5 text-sm"
                >
                  <option value="NONE">Standalone</option>
                  {habits
                    .filter((h) => h.id !== editingHabit.id)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        After: {h.title}
                      </option>
                    ))}
                </select>
                {selectedEditAnchor && (
                  <p className="text-[11px] theme-muted mt-1">
                    Flow: {selectedEditAnchor.title} &rarr; {editHabitTitle}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                {!confirmDeleteHabit ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteHabit(true)}
                    className="px-3 py-2 rounded-xl text-rose-500 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDeleteHabit}
                    className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT IDENTITY MODAL                                       */}
      {/* ========================================================= */}
      {editingIdentity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="glass-nav rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold theme-text">Edit Identity</h3>
              <button
                onClick={() => setEditingIdentity(null)}
                className="theme-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateIdentitySubmit} className="space-y-3.5">
              <div>
                <label className="text-xs theme-subtext block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editIdTitle}
                  onChange={(e) => setEditIdTitle(e.target.value)}
                  className="w-full theme-input rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs theme-subtext block mb-1">Objective</label>
                <textarea
                  rows={3}
                  required
                  value={editIdMission}
                  onChange={(e) => setEditIdMission(e.target.value)}
                  className="w-full theme-input rounded-xl p-2.5 text-sm"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                {!confirmDeleteIdentity ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteIdentity(true)}
                    className="px-3 py-2 rounded-xl text-rose-500 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDeleteIdentity}
                    className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FOCUS TIMER MODAL                                         */}
      {/* ========================================================= */}
      {activeHabit && (
        <div className="fixed inset-0 z-50 theme-surface p-4 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="max-w-xl w-full mx-auto flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <span className="text-xs font-mono uppercase theme-muted">
                {activeHabit.identityTitle}
              </span>
              <h3 className="text-base font-bold theme-text">
                {microCleared ? activeHabit.title : activeHabit.gatewayVersion}
              </h3>
            </div>
            <button
              onClick={() => {
                setIsRunning(false);
                setActiveHabit(null);
              }}
              className="p-2 rounded-xl glass-panel theme-subtext cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!showDebrief ? (
            <div className="max-w-xl w-full mx-auto my-auto space-y-6 py-6 text-center">
              <div className="glass-nav p-8 rounded-3xl space-y-5">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full glass-panel theme-text">
                  {microCleared ? '✓ Deep Flow Unlocked' : '2-Minute Micro-Start'}
                </span>

                <div className="text-6xl sm:text-7xl font-mono font-black theme-text">
                  {formatClock(secondsElapsed)}
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setIsRunning((r) => !r)}
                    className="px-5 py-2.5 rounded-xl glass-panel theme-text text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isRunning ? 'Pause' : 'Resume'}
                  </button>

                  {!microCleared && (
                    <button
                      type="button"
                      onClick={() => setSecondsElapsed((s) => s + 30)}
                      className="px-4 py-2.5 rounded-xl glass-panel theme-subtext text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <FastForward className="w-3.5 h-3.5" /> +30s
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsRunning(false);
                      setShowDebrief(true);
                    }}
                    className="px-5 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
                    style={{ background: 'var(--accent-primary)' }}
                  >
                    Finish (+{liveScorePreview} pts)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsChallenge((c) => !c)}
                  className={`p-3.5 rounded-2xl glass-panel text-xs font-bold flex items-center justify-between cursor-pointer ${
                    isChallenge ? 'ring-2 ring-rose-500 text-rose-500' : 'theme-subtext'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Swords className="w-4 h-4" /> Challenge
                  </span>
                  <span>{isChallenge ? '1.5x ON' : 'OFF'}</span>
                </button>

                <div className="p-3.5 rounded-2xl glass-panel flex items-center justify-between text-xs">
                  <span className="theme-subtext font-bold">Difficulty</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-24 accent-amber-500"
                  />
                  <span className="font-mono font-bold theme-text">{difficulty}/5</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md w-full mx-auto my-auto glass-nav rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold theme-text">Session Notes (Optional)</h3>
              <input
                type="text"
                placeholder="Challenge or bottleneck tackled"
                value={bottleneckNote}
                onChange={(e) => setBottleneckNote(e.target.value)}
                className="w-full theme-input rounded-xl p-3 text-sm"
              />
              <textarea
                rows={3}
                placeholder="Key insight or takeaway"
                value={insightNote}
                onChange={(e) => setInsightNote(e.target.value)}
                className="w-full theme-input rounded-xl p-3 text-sm"
              />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleFinishSession(true)}
                  className="py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                >
                  Log 2m Save
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleFinishSession(false)}
                  className="py-3 rounded-xl text-white font-bold text-xs cursor-pointer"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  Log Full ({sessionMins}m)
                </button>
              </div>
            </div>
          )}
          <div />
        </div>
      )}
    </div>
  );
}
