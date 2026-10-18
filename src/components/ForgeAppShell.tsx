// src/components/ForgeAppShell.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  buildSystemAnalytics,
  calculateSessionScore,
  IDENTITY_PRESETS,
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
  deleteUserAccountAndData,
} from '@/app/actions';

import { Header } from './forge/Header';
import { BottomNav, TabType } from './forge/BottomNav';
import { WorkspaceView } from './forge/WorkspaceView';
import { AnalyticsView } from './forge/AnalyticsView';
import { ContinuityView } from './forge/ContinuityView';
import { VaultView } from './forge/VaultView';
import { AccountView } from './forge/AccountView';
import { FocusTimerModal } from './forge/FocusTimerModal';
import { CreatorModal } from './forge/CreatorModal';
import { QuickHudDrawer } from './forge/QuickHudDrawer';
import { EditHabitModal, EditIdentityModal } from './forge/EditModals';

import { Sparkles, X } from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  image: string | null;
}

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
  reminderTime?: string | null;
  lastCompletedDate?: string | null;
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

export type ThemeMode = 'obsidian' | 'sepia' | 'light';
export type { TabType };

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function ForgeAppShell({
  identities,
  habits,
  sessions,
  currentUser = null,
  googleAuthEnabled = false,
}: {
  identities: SerializedIdentity[];
  habits: SerializedHabit[];
  sessions: SerializedSession[];
  currentUser?: UserProfile | null;
  googleAuthEnabled?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabType>('WORKSPACE');
  const [selectedIdentityFilter, setSelectedIdentityFilter] = useState<string>('ALL');
  const [theme, setTheme] = useState<ThemeMode>('obsidian');

  // Quick Widget Drawer State
  const [isWidgetDrawerOpen, setIsWidgetDrawerOpen] = useState(false);

  // Sound, Notifications & PWA Install State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const chimePlayedRef = useRef<boolean>(false);
  const firedRemindersRef = useRef<Set<string>>(new Set());

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

  // --- Pomodoro Extension State ---
  const [timerMode, setTimerMode] = useState<'FLOW' | 'POMO_25_5' | 'POMO_50_10'>('FLOW');
  const [pomoPhase, setPomoPhase] = useState<'WORK' | 'BREAK'>('WORK');
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState<number>(23 * 60);
  const [pomoCyclesCompleted, setPomoCyclesCompleted] = useState<number>(0);

  // Filter States
  const [protocolTypeFilter, setProtocolTypeFilter] = useState<
    'ALL' | 'REBOUND' | 'STACKED' | 'TEMPTATION'
  >('ALL');
  const [inspectedDay, setInspectedDay] = useState<ContinuityDay | null>(null);

  // Switch from 2-Min Micro-Start / Open Flow into a Pomodoro preset
  const activatePomodoroMode = (mode: 'FLOW' | 'POMO_25_5' | 'POMO_50_10') => {
    soundEngine.playTactileClick(soundEnabled);
    setTimerMode(mode);
    setPomoPhase('WORK');

    if (mode === 'POMO_25_5') {
      const credited = Math.min(120, secondsElapsed);
      setPomoSecondsLeft(25 * 60 - credited);
    } else if (mode === 'POMO_50_10') {
      const credited = Math.min(120, secondsElapsed);
      setPomoSecondsLeft(50 * 60 - credited);
    }
    setIsRunning(true);
  };

  // Skip current Work or Break phase
  const transitionPomodoroPhase = () => {
    const breakMins = timerMode === 'POMO_50_10' ? 10 : 5;
    const workMins = timerMode === 'POMO_50_10' ? 50 : 25;

    if (pomoPhase === 'WORK') {
      soundEngine.playBreakStartChime(soundEnabled);
      setPomoCyclesCompleted((c) => c + 1);
      setPomoPhase('BREAK');
      setPomoSecondsLeft(breakMins * 60);
    } else {
      soundEngine.playBreakOverChime(soundEnabled);
      setPomoPhase('WORK');
      setPomoSecondsLeft(workMins * 60);
    }
  };

  // Creator Modal State
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorTab, setCreatorTab] = useState<'HABIT' | 'IDENTITY'>('HABIT');
  const [newIdTitle, setNewIdTitle] = useState('');
  const [newIdMission, setNewIdMission] = useState('');
  const [newIdStage, setNewIdStage] = useState('PRACTICE');

  const [newHabitIdentityId, setNewHabitIdentityId] = useState(
    identities[0]?.id || 'preset:deep-worker'
  );
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitMicro, setNewHabitMicro] = useState('');
  const [newHabitStage, setNewHabitStage] = useState<SkillStage>('PRACTICE');
  const [newHabitAnchorId, setNewHabitAnchorId] = useState('NONE');
  const [newHabitReminder, setNewHabitReminder] = useState('');

  // Edit Identity Modal State
  const [editingIdentity, setEditingIdentity] = useState<SerializedIdentity | null>(null);
  const [editIdTitle, setEditIdTitle] = useState('');
  const [editIdMission, setEditIdMission] = useState('');
  const [editIdStage, setEditIdStage] = useState('PRACTICE');
  const [confirmDeleteIdentity, setConfirmDeleteIdentity] = useState(false);

  // Edit Habit Modal State
  const [editingHabit, setEditingHabit] = useState<SerializedHabit | null>(null);
  const [editHabitIdentityId, setEditHabitIdentityId] = useState('');
  const [editHabitTitle, setEditHabitTitle] = useState('');
  const [editHabitMicro, setEditHabitMicro] = useState('');
  const [editHabitStage, setEditHabitStage] = useState<SkillStage>('PRACTICE');
  const [editHabitAnchorId, setEditHabitAnchorId] = useState('NONE');
  const [editHabitReminder, setEditHabitReminder] = useState('');
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState(false);

  const MICRO_THRESHOLD = 120;
  const microCleared = secondsElapsed >= MICRO_THRESHOLD;
  const sessionMins = Math.max(2, Math.round(secondsElapsed / 60));
  const todayStr = new Date().toISOString().split('T')[0];

  // Initialize Theme, Sound, Notifications, and Deep-Link Auto-Start (?startHabit=<id>)
  useEffect(() => {
    const savedTheme = (localStorage.getItem('forge_theme') as ThemeMode) || 'obsidian';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedSound = localStorage.getItem('forge_sound_enabled');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }

    // Check if launched with ?startHabit=<id>
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const startHabitId = params.get('startHabit');
      if (startHabitId) {
        const target = habits.find((h) => h.id === startHabitId);
        if (target) {
          setActiveHabit(target);
          setStage((target.defaultPhase as SkillStage) || 'PRACTICE');
          setSecondsElapsed(0);
          setIsRunning(true);
          window.history.replaceState({}, '', '/');
        }
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [habits]);

  // Background Habit Reminder Scheduler
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const currentHHMM = `${hh}:${mm}`;
      const dStr = now.toISOString().split('T')[0];

      habits.forEach((h) => {
        if (!h.reminderTime || h.reminderTime !== currentHHMM) return;
        if (h.lastCompletedDate === dStr) return;

        const fireKey = `${h.id}-${dStr}-${currentHHMM}`;
        if (firedRemindersRef.current.has(fireKey)) return;
        firedRemindersRef.current.add(fireKey);

        soundEngine.playMicroClearedChime(soundEnabled);
        setToastMessage(`⏰ Reminder: Time for "${h.title}" (2m: ${h.gatewayVersion})`);

        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          const n = new Notification(`ForgeOS: ${h.title}`, {
            body: `2-Min Micro-Start: ${h.gatewayVersion}`,
            icon: '/icon',
          });
          n.onclick = () => {
            window.focus();
            startFocusSession(h);
          };
        }
      });
    };

    const interval = setInterval(checkReminders, 20000);
    return () => clearInterval(interval);
  }, [habits, soundEnabled]);

  const requestNotificationAccess = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setToastMessage('Notifications are not supported in this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      soundEngine.playMicroClearedChime(soundEnabled);
      new Notification('ForgeOS Reminders Active', {
        body: 'You will receive daily habit micro-start notifications right on time.',
        icon: '/icon',
      });
    }
  };

  const selectTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    localStorage.setItem('forge_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
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

  // Timer Tick Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && activeHabit) {
      timer = setInterval(() => {
        if (timerMode === 'FLOW') {
          setSecondsElapsed((s) => s + 1);
        } else {
          if (pomoPhase === 'WORK') {
            setSecondsElapsed((s) => s + 1);
          }
          setPomoSecondsLeft((rem) => {
            if (rem <= 1) {
              setTimeout(() => transitionPomodoroPhase(), 50);
              return 0;
            }
            return rem - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, activeHabit, timerMode, pomoPhase]);

  // Micro-Start 120s Chime
  useEffect(() => {
    if (
      secondsElapsed >= MICRO_THRESHOLD &&
      !chimePlayedRef.current &&
      activeHabit
    ) {
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
    return (
      identities.find((i) => i.id === selectedIdentityFilter)?.totalHoursLogged || 0
    );
  }, [identities, selectedIdentityFilter]);

  const analytics = useMemo(
    () => buildSystemAnalytics(filteredSessions, baselineHours, 84),
    [filteredSessions, baselineHours]
  );

  const scorePreview = useMemo(() => {
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
    setIsWidgetDrawerOpen(false);
    setActiveHabit(habit);
    setStage((habit.defaultPhase as SkillStage) || 'PRACTICE');
    setSecondsElapsed(0);
    setTimerMode('FLOW');
    setPomoPhase('WORK');
    setPomoCyclesCompleted(0);
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
    setEditHabitReminder(habit.reminderTime || '');
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
        identityId: newHabitIdentityId || identities[0]?.id || 'preset:deep-worker',
        title: newHabitTitle,
        gatewayVersion: newHabitMicro,
        defaultPhase: newHabitStage,
        anchorHabitId: newHabitAnchorId === 'NONE' ? null : newHabitAnchorId,
        reminderTime: newHabitReminder || null,
      });
      setNewHabitTitle('');
      setNewHabitMicro('');
      setNewHabitReminder('');
      setNewHabitAnchorId('NONE');
      setIsCreatorOpen(false);
      setToastMessage('New habit added to your protocol queue!');
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
        reminderTime: editHabitReminder || null,
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

  const visibleHabits = habits.filter((h) => {
    const matchesIdentity =
      selectedIdentityFilter === 'ALL' || h.identityId === selectedIdentityFilter;
    if (!matchesIdentity) return false;
    if (protocolTypeFilter === 'REBOUND') return h.isReboundPriority;
    if (protocolTypeFilter === 'STACKED')
      return Boolean(h.anchorHabitId || h.nextStackedHabitId);
    if (protocolTypeFilter === 'TEMPTATION') return Boolean(h.temptationBundleUrl);
    return true;
  });

  return (
    <div
      className="relative min-h-screen forge-surface pb-28 md:pb-20"
      style={{
        backgroundColor: 'var(--forge-surface)',
        color: 'var(--forge-text-primary)',
      }}
    >
      {/* ── Ambient Radial Orbs ── */}
      <div className="forge-orb-container">
        <div className="forge-orb-1" />
        <div className="forge-orb-2" />
      </div>

      {/* ── Fixed Frosted Header with Filter Chips & HUD Trigger ── */}
      <Header
        identities={identities}
        selectedIdentityFilter={selectedIdentityFilter}
        onSelectIdentityFilter={setSelectedIdentityFilter}
        notifPermission={notifPermission}
        onRequestNotifications={requestNotificationAccess}
        onToggleWidgetDrawer={() => setIsWidgetDrawerOpen(true)}
        onOpenAccount={() => setActiveTab('ACCOUNT')}
        currentUser={currentUser}
      />

      {/* ── Main Application Canvas ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-safe">
        {activeTab === 'WORKSPACE' && (
          <WorkspaceView
            identities={identities}
            habits={habits}
            visibleHabits={visibleHabits}
            protocolTypeFilter={protocolTypeFilter}
            onSetProtocolTypeFilter={setProtocolTypeFilter}
            onOpenCreateHabit={() => {
              setCreatorTab('HABIT');
              setIsCreatorOpen(true);
            }}
            onOpenCreateIdentity={() => {
              setCreatorTab('IDENTITY');
              setIsCreatorOpen(true);
            }}
            onOpenEditHabit={openEditHabitModal}
            onOpenEditIdentity={openEditIdentityModal}
            onStartFocusSession={startFocusSession}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            todayStr={todayStr}
          />
        )}

        {activeTab === 'ANALYTICS' && (
          <AnalyticsView analytics={analytics} />
        )}

        {activeTab === 'HEATMAP' && (
          <ContinuityView
            analytics={analytics}
            sessions={sessions}
            inspectedDay={inspectedDay}
            onSelectDay={setInspectedDay}
          />
        )}

        {activeTab === 'VAULT' && (
          <VaultView sessions={sessions} />
        )}

        {activeTab === 'ACCOUNT' && (
          <AccountView
            currentUser={currentUser}
            googleAuthEnabled={googleAuthEnabled}
            theme={theme}
            onSelectTheme={selectTheme}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            notifPermission={notifPermission}
            onRequestNotifications={requestNotificationAccess}
            installPromptEvent={installPromptEvent}
            onInstallPWA={handleInstallPWA}
            onSeedSampleHistory={seedSampleChainHistory}
            onRunAudit={runMidnightGuardrailAudit}
            onSignInWithGoogle={signInWithGoogleAction}
            onSignOut={signOutAction}
            onDeleteAccount={deleteUserAccountAndData}
            identities={identities}
            totalHours={analytics.totalHours}
            streak={analytics.resilientStreak || analytics.strictStreak}
          />
        )}
      </main>

      {/* ── Glassmorphic Dock Bottom Nav ── */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── 2-Minute Micro-Start & Pomodoro Focus Timer Modal ── */}
      <FocusTimerModal
        activeHabit={activeHabit}
        secondsElapsed={secondsElapsed}
        isRunning={isRunning}
        onTogglePlayPause={() => {
          soundEngine.playTactileClick(soundEnabled);
          setIsRunning((prev) => !prev);
        }}
        onAbort={() => {
          setActiveHabit(null);
          setIsRunning(false);
          setShowDebrief(false);
        }}
        stage={stage}
        onSetStage={setStage}
        isChallenge={isChallenge}
        onToggleChallenge={() => setIsChallenge((prev) => !prev)}
        difficulty={difficulty}
        onSetDifficulty={setDifficulty}
        timerMode={timerMode}
        onActivatePomodoroMode={activatePomodoroMode}
        pomoPhase={pomoPhase}
        pomoSecondsLeft={pomoSecondsLeft}
        pomoCyclesCompleted={pomoCyclesCompleted}
        onTransitionPomodoro={transitionPomodoroPhase}
        showDebrief={showDebrief}
        onSetShowDebrief={setShowDebrief}
        bottleneckNote={bottleneckNote}
        onSetBottleneckNote={setBottleneckNote}
        insightNote={insightNote}
        onSetInsightNote={setInsightNote}
        onFinishSession={handleFinishSession}
        isSubmitting={isSubmitting}
        scorePreview={scorePreview}
      />

      {/* ── Protocol & Identity Creator Modal ── */}
      <CreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        creatorTab={creatorTab}
        onSetCreatorTab={setCreatorTab}
        identities={identities}
        habits={habits}
        newHabitIdentityId={newHabitIdentityId}
        onSetNewHabitIdentityId={setNewHabitIdentityId}
        newHabitTitle={newHabitTitle}
        onSetNewHabitTitle={setNewHabitTitle}
        newHabitMicro={newHabitMicro}
        onSetNewHabitMicro={setNewHabitMicro}
        newHabitStage={newHabitStage}
        onSetNewHabitStage={setNewHabitStage}
        newHabitAnchorId={newHabitAnchorId}
        onSetNewHabitAnchorId={setNewHabitAnchorId}
        newHabitReminder={newHabitReminder}
        onSetNewHabitReminder={setNewHabitReminder}
        onCreateHabitSubmit={handleCreateHabitSubmit}
        newIdTitle={newIdTitle}
        onSetNewIdTitle={setNewIdTitle}
        newIdMission={newIdMission}
        onSetNewIdMission={setNewIdMission}
        newIdStage={newIdStage}
        onSetNewIdStage={setNewIdStage}
        onCreateIdentitySubmit={handleCreateIdentitySubmit}
        isSubmitting={isSubmitting}
      />

      {/* ── Quick HUD 1-Tap Drawer ── */}
      <QuickHudDrawer
        isOpen={isWidgetDrawerOpen}
        onClose={() => setIsWidgetDrawerOpen(false)}
        habits={habits}
        onStartFocusSession={startFocusSession}
      />

      {/* ── Edit Habit Modal ── */}
      <EditHabitModal
        habit={editingHabit}
        onClose={() => setEditingHabit(null)}
        identities={identities}
        allHabits={habits}
        editHabitIdentityId={editHabitIdentityId}
        onSetEditHabitIdentityId={setEditHabitIdentityId}
        editHabitTitle={editHabitTitle}
        onSetEditHabitTitle={setEditHabitTitle}
        editHabitMicro={editHabitMicro}
        onSetEditHabitMicro={setEditHabitMicro}
        editHabitStage={editHabitStage}
        onSetEditHabitStage={setEditHabitStage}
        editHabitAnchorId={editHabitAnchorId}
        onSetEditHabitAnchorId={setEditHabitAnchorId}
        editHabitReminder={editHabitReminder}
        onSetEditHabitReminder={setEditHabitReminder}
        onUpdateHabitSubmit={handleUpdateHabitSubmit}
        onDeleteHabit={handleDeleteHabit}
        confirmDelete={confirmDeleteHabit}
        onSetConfirmDelete={setConfirmDeleteHabit}
        isSubmitting={isSubmitting}
      />

      {/* ── Edit Master Identity Modal ── */}
      <EditIdentityModal
        identity={editingIdentity}
        onClose={() => setEditingIdentity(null)}
        editIdTitle={editIdTitle}
        onSetEditIdTitle={setEditIdTitle}
        editIdMission={editIdMission}
        onSetEditIdMission={setEditIdMission}
        editIdStage={editIdStage}
        onSetEditIdStage={setEditIdStage}
        onUpdateIdentitySubmit={handleUpdateIdentitySubmit}
        onDeleteIdentity={handleDeleteIdentity}
        confirmDelete={confirmDeleteIdentity}
        onSetConfirmDelete={setConfirmDeleteIdentity}
        isSubmitting={isSubmitting}
      />

      {/* ── Floating Toast HUD ── */}
      {toastMessage && (
        <div className="forge-toast bg-[#1b1b24]/95 border border-[rgba(192,193,255,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.6)] px-4 py-3 rounded-2xl flex items-center gap-2.5 font-mono-forge text-xs text-white">
          <Sparkles className="w-4 h-4 text-[var(--forge-primary)] shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-[var(--forge-text-muted)] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
