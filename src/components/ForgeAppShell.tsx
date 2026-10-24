// src/components/ForgeAppShell.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  signInWithGoogleAction,
  signOutAction,
  deleteUserAccountAndData,
  toggleArchiveHabitAction,
  togglePinHabitAction,
  verifyUserProStatusAction,
} from '@/app/actions';
import ProUpgradeCard from '@/components/ProUpgradeCard';
import FeatureWalkthrough from '@/components/FeatureWalkthrough';
import HabitVisualChain from '@/components/HabitVisualChain';
import ThemePaletteModal, {
  ThemeMode,
  AccentColor,
  applyThemeAndAccentToDocument,
} from '@/components/ThemePaletteModal';
import QuickCreateFab from '@/components/QuickCreateFab';
import DailyRetentionBanner from '@/components/DailyRetentionBanner';
import HabitChainTransitionModal from '@/components/HabitChainTransitionModal';
import { WeeklyReviewCard } from '@/components/WeeklyReviewCard';
import { SessionHistoryFeed } from '@/components/SessionHistoryFeed';
import { FocusTimerModal } from '@/components/modals/FocusTimerModal';
import {
  HelpCircle,
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
  Swords,
  Lock,
  ArrowRight,
  X,
  Pencil,
  Trash2,
  Volume2,
  VolumeX,
  Download,
  FastForward,
  Compass,
  Palette,
  User,
  LogOut,
  ShieldCheck,
  Sliders,
  Bell,
  BellRing,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink,
  SunMedium,
  MoreHorizontal,
  Pin,
  Archive,
  ArchiveRestore,
  Target,
} from 'lucide-react';

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
  isArchived?: boolean;
  isPinned?: boolean;
  dailyGoalMinutes?: number;
  weeklyGoalDays?: number;
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

type TabType = 'WORKSPACE' | 'ANALYTICS' | 'HEATMAP' | 'VAULT' | 'ACCOUNT';

interface ForgeAndroidBridgeInterface {
  isNativeApp?: () => boolean;
  isGooglePlayBillingSupported?: () => boolean;
  restoreGooglePlayPurchases?: () => void;
  requestNotificationPermission?: () => void;
  scheduleHabitReminder?: (habitId: string, title: string, hour: number, minute: number) => void;
  cancelHabitReminder?: (habitId: string) => void;
  scheduleStreakDangerAlert?: (habitId: string, title: string, streakCount: number) => void;
  cancelStreakDangerAlert?: (habitId: string) => void;
  setSystemBarTheme?: (theme: string, isDark: boolean) => void;
  startFocusTimerService?: (title: string, subtitle: string, baseTimeMillis: number, isCountdown: boolean) => void;
  stopFocusTimerService?: () => void;
  showToast?: (message: string) => void;
}

const getAndroidBridge = (): ForgeAndroidBridgeInterface | undefined => {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { ForgeAndroidBridge?: ForgeAndroidBridgeInterface }).ForgeAndroidBridge;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const REMINDER_PRESETS = [
  { label: 'Off', value: '' },
  { label: 'Morning 08:00', value: '08:00' },
  { label: 'Noon 12:30', value: '12:30' },
  { label: 'Afternoon 17:00', value: '17:00' },
  { label: 'Evening 20:30', value: '20:30' },
];

export default function ForgeAppShell({
  identities: initialIdentities,
  habits: initialHabits,
  sessions: initialSessions,
  currentUser = null,
  googleAuthEnabled = false,
  isPro = false,
}: {
  identities: SerializedIdentity[];
  habits: SerializedHabit[];
  sessions: SerializedSession[];
  currentUser?: UserProfile | null;
  googleAuthEnabled?: boolean;
  isPro?: boolean;
}) {
  // ── Reactive Local State (Enables Instant 0ms Optimistic UI Updates) ─────────
  const [identities, setIdentities] = useState<SerializedIdentity[]>(initialIdentities);
  const [habits, setHabits] = useState<SerializedHabit[]>(initialHabits);
  const [sessions, setSessions] = useState<SerializedSession[]>(initialSessions);

  // Synchronize state when server props update without discarding render passes (Audit #20)
  useEffect(() => {
    setIdentities(initialIdentities);
  }, [initialIdentities]);

  useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  const [userUnlockedPro, setUserUnlockedPro] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('forge_pro_unlocked') === 'true';
    }
    return false;
  });
  const userIsPro = isPro || userUnlockedPro;

  // Server-side verified Pro status (Audit #21)
  // Validates with database/session so localStorage cannot be spoofed via DevTools
  useEffect(() => {
    if (userUnlockedPro && !isPro) {
      verifyUserProStatusAction()
        .then((res) => {
          if (!res.isPro) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('forge_pro_unlocked');
            }
            setUserUnlockedPro(false);
          }
        })
        .catch(() => {
          // Network failure fallback
        });
    }
  }, [userUnlockedPro, isPro]);

  // Pro Modal Trigger State
  const [showProModal, setShowProModal] = useState(false);
  // Feature Walkthrough Onboarding State
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  // ── Global Google Play Billing Listener & Auto-Restore ──────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as unknown as {
      onGooglePlayPurchaseSuccess?: (orderId: string) => void;
      ForgeAndroidBridge?: {
        restoreGooglePlayPurchases?: () => void;
      };
    };

    win.onGooglePlayPurchaseSuccess = async (orderId: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('forge_pro_unlocked', 'true');
      }
      setUserUnlockedPro(true);
      setShowProModal(false);

      try {
        await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: `gplay_${orderId}`,
            razorpay_payment_id: orderId,
            razorpay_signature: 'gplay_verified',
            source: 'google_play',
          }),
        });
      } catch (err) {
        console.error('Failed to verify Google Play purchase:', err);
      }
    };

    // Auto-restore any existing Google Play purchase on launch
    if (win.ForgeAndroidBridge?.restoreGooglePlayPurchases) {
      win.ForgeAndroidBridge.restoreGooglePlayPurchases();
    }
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>('WORKSPACE');
  const [selectedIdentityFilter, setSelectedIdentityFilter] = useState<string>('ALL');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('forge_theme') as ThemeMode;
      if (saved) {
        if (!isPro && (saved === 'sepia' || saved === 'light')) {
          return 'obsidian';
        }
        return saved;
      }
    }
    return 'obsidian';
  });

  const [accent, setAccent] = useState<AccentColor>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('forge_accent') as AccentColor;
      if (saved) {
        if (!isPro && saved !== 'indigo') {
          return 'indigo';
        }
        return saved;
      }
    }
    return 'indigo';
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Quick Widget Drawer State
  const [isWidgetDrawerOpen, setIsWidgetDrawerOpen] = useState(false);

  // Sound, Notifications & PWA Install State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('forge_sound_enabled');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
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
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const [chainTransitionData, setChainTransitionData] = useState<{
    habit: SerializedHabit;
    votesEarned: number;
    durationMinutes: number;
    isPerfectDayNow: boolean;
    nextHabit: SerializedHabit | null;
  } | null>(null);
  const [isQuickToolsMenuOpen, setIsQuickToolsMenuOpen] = useState(false);
  const [expandedHabitIds, setExpandedHabitIds] = useState<Set<string>>(new Set());

  const toggleHabitExpand = useCallback((habitId: string) => {
    setExpandedHabitIds((prev) => {
      const next = new Set(prev);
      if (next.has(habitId)) {
        next.delete(habitId);
      } else {
        next.add(habitId);
      }
      return next;
    });
  }, []);

  // Evening streak risk calculation (7:00 PM onwards / hours >= 19)
  const isEvening = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new Date().getHours() >= 19;
  }, []);

  const atRiskStreakHabits = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return habits.filter(
      (h) => h.currentStreak > 0 && h.lastCompletedDate !== todayStr
    );
  }, [habits]);

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // --- Pomodoro Extension State ---
  const [timerMode, setTimerMode] = useState<'FLOW' | 'POMO_25_5' | 'POMO_50_10'>('FLOW');
  const [pomoPhase, setPomoPhase] = useState<'WORK' | 'BREAK'>('WORK');
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState<number>(23 * 60);
  const [pomoCyclesCompleted, setPomoCyclesCompleted] = useState<number>(0);

  // Wall-Clock Time Synchronization Refs (Zero-drift, background & lock-screen resilient)
  const sessionStartTimeRef = useRef<number | null>(null);
  const accumulatedSecondsRef = useRef<number>(0);
  const phaseStartTimeRef = useRef<number | null>(null);
  const basePomoSecondsLeftRef = useRef<number>(23 * 60);

  const saveActiveSessionSnapshot = useCallback((overrides?: {
    habit?: SerializedHabit;
    stage?: SkillStage;
    timerMode?: 'FLOW' | 'POMO_25_5' | 'POMO_50_10';
    pomoPhase?: 'WORK' | 'BREAK';
    pomoCyclesCompleted?: number;
    isChallenge?: boolean;
    difficulty?: number;
    sessionStartTime?: number | null;
    accumulatedSeconds?: number;
    phaseStartTime?: number | null;
    basePomoSecondsLeft?: number;
    isRunning?: boolean;
  }) => {
    if (typeof window === 'undefined') return;
    const targetHabit = overrides?.habit || activeHabit;
    if (!targetHabit) {
      localStorage.removeItem('forge_active_focus_session');
      return;
    }
    try {
      const data = {
        habit: targetHabit,
        stage: overrides?.stage ?? stage,
        timerMode: overrides?.timerMode ?? timerMode,
        pomoPhase: overrides?.pomoPhase ?? pomoPhase,
        pomoCyclesCompleted: overrides?.pomoCyclesCompleted ?? pomoCyclesCompleted,
        isChallenge: overrides?.isChallenge ?? isChallenge,
        difficulty: overrides?.difficulty ?? difficulty,
        sessionStartTime: overrides?.sessionStartTime !== undefined ? overrides.sessionStartTime : sessionStartTimeRef.current,
        accumulatedSeconds: overrides?.accumulatedSeconds !== undefined ? overrides.accumulatedSeconds : accumulatedSecondsRef.current,
        phaseStartTime: overrides?.phaseStartTime !== undefined ? overrides.phaseStartTime : phaseStartTimeRef.current,
        basePomoSecondsLeft: overrides?.basePomoSecondsLeft !== undefined ? overrides.basePomoSecondsLeft : basePomoSecondsLeftRef.current,
        isRunning: overrides?.isRunning !== undefined ? overrides.isRunning : isRunning,
      };
      localStorage.setItem('forge_active_focus_session', JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [activeHabit, stage, timerMode, pomoPhase, pomoCyclesCompleted, isChallenge, difficulty, isRunning]);

  const clearActiveSessionSnapshot = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('forge_active_focus_session');
    }
    sessionStartTimeRef.current = null;
    accumulatedSecondsRef.current = 0;
    phaseStartTimeRef.current = null;
    basePomoSecondsLeftRef.current = 23 * 60;
    getAndroidBridge()?.stopFocusTimerService?.();
  }, []);

  // Switch from 2-Min Micro-Start / Open Flow into a Pomodoro preset
  const activatePomodoroMode = useCallback((mode: 'FLOW' | 'POMO_25_5' | 'POMO_50_10') => {
    soundEngine.playTactileClick(soundEnabled);
    if ((mode === 'POMO_25_5' || mode === 'POMO_50_10') && !userIsPro) {
      setShowProModal(true);
      return;
    }
    const now = Date.now();
    setTimerMode(mode);
    setPomoPhase('WORK');

    let initialSecondsLeft = 25 * 60;
    if (mode === 'POMO_25_5') {
      // Credit up to 2 minutes already spent in the micro-start!
      const credited = Math.min(120, secondsElapsed);
      initialSecondsLeft = 25 * 60 - credited;
    } else if (mode === 'POMO_50_10') {
      const credited = Math.min(120, secondsElapsed);
      initialSecondsLeft = 50 * 60 - credited;
    }

    phaseStartTimeRef.current = now;
    basePomoSecondsLeftRef.current = initialSecondsLeft;
    setPomoSecondsLeft(initialSecondsLeft);
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = now;
    }
    setIsRunning(true);

    if (activeHabit) {
      saveActiveSessionSnapshot({
        timerMode: mode,
        pomoPhase: 'WORK',
        phaseStartTime: now,
        basePomoSecondsLeft: initialSecondsLeft,
        isRunning: true,
      });

      if (mode === 'FLOW') {
        const virtualStart = now - (accumulatedSecondsRef.current * 1000);
        getAndroidBridge()?.startFocusTimerService?.(
          activeHabit.title,
          '∞ Open Flow Active',
          virtualStart,
          false
        );
      } else {
        const targetEnd = now + initialSecondsLeft * 1000;
        getAndroidBridge()?.startFocusTimerService?.(
          activeHabit.title,
          `🍅 Pomodoro Work (${mode === 'POMO_25_5' ? '25m' : '50m'})`,
          targetEnd,
          true
        );
      }
    }
  }, [soundEnabled, userIsPro, secondsElapsed, activeHabit, saveActiveSessionSnapshot]);

  // Skip current Work or Break phase (or transition when countdown hits 0)
  const transitionPomodoroPhase = useCallback(() => {
    const breakMins = timerMode === 'POMO_50_10' ? 10 : 5;
    const workMins = timerMode === 'POMO_50_10' ? 50 : 25;
    const now = Date.now();

    if (pomoPhase === 'WORK') {
      soundEngine.playBreakStartChime(soundEnabled);
      const newCycles = pomoCyclesCompleted + 1;
      setPomoCyclesCompleted(newCycles);
      setPomoPhase('BREAK');
      const breakSecs = breakMins * 60;
      phaseStartTimeRef.current = now;
      basePomoSecondsLeftRef.current = breakSecs;
      setPomoSecondsLeft(breakSecs);

      // Bank elapsed focus time up to this transition
      if (sessionStartTimeRef.current) {
        accumulatedSecondsRef.current += Math.max(0, Math.floor((now - sessionStartTimeRef.current) / 1000));
        sessionStartTimeRef.current = null;
      }

      saveActiveSessionSnapshot({
        pomoPhase: 'BREAK',
        pomoCyclesCompleted: newCycles,
        phaseStartTime: now,
        basePomoSecondsLeft: breakSecs,
        accumulatedSeconds: accumulatedSecondsRef.current,
        sessionStartTime: null,
      });

      if (activeHabit) {
        const targetEnd = now + breakSecs * 1000;
        getAndroidBridge()?.startFocusTimerService?.(
          activeHabit.title,
          '☕ Rest & Recharge Break',
          targetEnd,
          true
        );
      }
    } else {
      soundEngine.playBreakOverChime(soundEnabled);
      setPomoPhase('WORK');
      const workSecs = workMins * 60;
      phaseStartTimeRef.current = now;
      basePomoSecondsLeftRef.current = workSecs;
      setPomoSecondsLeft(workSecs);
      sessionStartTimeRef.current = now;

      saveActiveSessionSnapshot({
        pomoPhase: 'WORK',
        phaseStartTime: now,
        basePomoSecondsLeft: workSecs,
        sessionStartTime: now,
      });

      if (activeHabit) {
        const targetEnd = now + workSecs * 1000;
        getAndroidBridge()?.startFocusTimerService?.(
          activeHabit.title,
          `🍅 Cycle #${pomoCyclesCompleted + 1} Work Block`,
          targetEnd,
          true
        );
      }
    }
  }, [timerMode, pomoPhase, pomoCyclesCompleted, soundEnabled, activeHabit, saveActiveSessionSnapshot]);

  // Create Modal State + Custom Popover States
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
  const [newHabitGoalMins, setNewHabitGoalMins] = useState<number>(0);
  const [newHabitGoalDays, setNewHabitGoalDays] = useState<number>(0);
  const [isChainPickerOpen, setIsChainPickerOpen] = useState(false);
  const [showAdvancedHabitOptions, setShowAdvancedHabitOptions] = useState(false);
  const [isIdentityPickerOpen, setIsIdentityPickerOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [showHabitSuggestions, setShowHabitSuggestions] = useState(false);

  // Edit Identity Modal State
  const [editingIdentity, setEditingIdentity] = useState<SerializedIdentity | null>(null);
  const [editIdTitle, setEditIdTitle] = useState('');
  const [editIdMission, setEditIdMission] = useState('');
  const [editIdStage, setEditIdStage] = useState('PRACTICE');
  const [confirmDeleteIdentity, setConfirmDeleteIdentity] = useState(false);

  // Edit & Rewire Habit Modal State
  const [editingHabit, setEditingHabit] = useState<SerializedHabit | null>(null);
  const [editHabitIdentityId, setEditHabitIdentityId] = useState('');
  const [editHabitTitle, setEditHabitTitle] = useState('');
  const [editHabitMicro, setEditHabitMicro] = useState('');
  const [editHabitStage, setEditHabitStage] = useState<SkillStage>('PRACTICE');
  const [editHabitAnchorId, setEditHabitAnchorId] = useState('NONE');
  const [editHabitReminder, setEditHabitReminder] = useState('');
  const [editHabitGoalMins, setEditHabitGoalMins] = useState<number>(0);
  const [editHabitGoalDays, setEditHabitGoalDays] = useState<number>(0);
  const [isEditChainPickerOpen, setIsEditChainPickerOpen] = useState(false);
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState(false);

  // Delete User Account Confirmation
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  const [inspectedDay, setInspectedDay] = useState<ContinuityDay | null>(null);

  // --- History & Android Back Gesture Navigation Management ---
  const isHandlingPopStateRef = useRef(false);

  const navigateToTab = useCallback((nextTab: TabType) => {
    setActiveTab((prev) => {
      if (prev !== nextTab) {
        if (typeof window !== 'undefined' && !isHandlingPopStateRef.current) {
          window.history.pushState({ forgeTab: nextTab }, '', '');
        }
      }
      return nextTab;
    });
  }, []);

  const openProModal = useCallback(() => {
    setShowProModal(true);
    if (typeof window !== 'undefined' && !isHandlingPopStateRef.current) {
      window.history.pushState({ forgeModal: 'pro' }, '', '');
    }
  }, []);

  const openCreator = useCallback(() => {
    setIsCreatorOpen(true);
    if (typeof window !== 'undefined' && !isHandlingPopStateRef.current) {
      window.history.pushState({ forgeModal: 'creator' }, '', '');
    }
  }, []);

  const openWalkthrough = useCallback(() => {
    setShowWalkthrough(true);
    if (typeof window !== 'undefined' && !isHandlingPopStateRef.current) {
      window.history.pushState({ forgeModal: 'walkthrough' }, '', '');
    }
  }, []);

  // Intercept Android Back Gesture & PopState
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onPopState = () => {
      isHandlingPopStateRef.current = true;
      try {
        if (showProModal) {
          setShowProModal(false);
          return;
        }
        if (isCreatorOpen) {
          setIsCreatorOpen(false);
          return;
        }
        if (showWalkthrough) {
          setShowWalkthrough(false);
          return;
        }
        if (editingHabit) {
          setEditingHabit(null);
          return;
        }
        if (editingIdentity) {
          setEditingIdentity(null);
          return;
        }
        if (activeHabit) {
          clearActiveSessionSnapshot();
          setActiveHabit(null);
          setIsRunning(false);
          return;
        }
        if (activeTab !== 'WORKSPACE') {
          setActiveTab('WORKSPACE');
          return;
        }
      } finally {
        setTimeout(() => {
          isHandlingPopStateRef.current = false;
        }, 60);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [
    showProModal,
    isCreatorOpen,
    showWalkthrough,
    editingHabit,
    editingIdentity,
    activeHabit,
    activeTab,
    clearActiveSessionSnapshot,
  ]);

  const startFocusSession = useCallback((habit: SerializedHabit) => {
    soundEngine.playTactileClick(soundEnabled);
    chimePlayedRef.current = false;
    setIsWidgetDrawerOpen(false);
    setActiveHabit(habit);
    const initialStage = (habit.defaultPhase as SkillStage) || 'PRACTICE';
    setStage(initialStage);
    setSecondsElapsed(0);
    setTimerMode('FLOW');
    setPomoPhase('WORK');
    setPomoCyclesCompleted(0);
    setIsChallenge(false);
    setDifficulty(3);
    setShowDebrief(false);
    setBottleneckNote('');
    setInsightNote('');

    const now = Date.now();
    sessionStartTimeRef.current = now;
    accumulatedSecondsRef.current = 0;
    phaseStartTimeRef.current = now;
    basePomoSecondsLeftRef.current = 23 * 60;
    setIsRunning(true);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'forge_active_focus_session',
          JSON.stringify({
            habit,
            stage: initialStage,
            timerMode: 'FLOW',
            pomoPhase: 'WORK',
            pomoCyclesCompleted: 0,
            isChallenge: false,
            difficulty: 3,
            sessionStartTime: now,
            accumulatedSeconds: 0,
            phaseStartTime: now,
            basePomoSecondsLeft: 23 * 60,
            isRunning: true,
          })
        );
      } catch {
        // ignore
      }
    }

    getAndroidBridge()?.startFocusTimerService?.(
      habit.title,
      '∞ Open Flow Active',
      now,
      false
    );
  }, [soundEnabled]);

  const toggleTimerRunning = useCallback(() => {
    const now = Date.now();
    soundEngine.playTactileClick(soundEnabled);
    if (isRunning) {
      // PAUSING
      if (sessionStartTimeRef.current) {
        accumulatedSecondsRef.current += Math.max(0, Math.floor((now - sessionStartTimeRef.current) / 1000));
        sessionStartTimeRef.current = null;
      }
      if (timerMode !== 'FLOW' && phaseStartTimeRef.current) {
        const spentInPhase = Math.floor((now - phaseStartTimeRef.current) / 1000);
        basePomoSecondsLeftRef.current = Math.max(0, basePomoSecondsLeftRef.current - spentInPhase);
        phaseStartTimeRef.current = null;
      }
      setIsRunning(false);
      getAndroidBridge()?.stopFocusTimerService?.();
      saveActiveSessionSnapshot({ isRunning: false });
    } else {
      // RESUMING
      sessionStartTimeRef.current = now;
      if (timerMode !== 'FLOW') {
        phaseStartTimeRef.current = now;
      }
      setIsRunning(true);
      if (activeHabit) {
        saveActiveSessionSnapshot({
          sessionStartTime: now,
          phaseStartTime: now,
          isRunning: true,
        });

        if (timerMode === 'FLOW') {
          const virtualStart = now - (accumulatedSecondsRef.current * 1000);
          getAndroidBridge()?.startFocusTimerService?.(
            activeHabit.title,
            '∞ Open Flow Active',
            virtualStart,
            false
          );
        } else {
          const targetEnd = now + basePomoSecondsLeftRef.current * 1000;
          getAndroidBridge()?.startFocusTimerService?.(
            activeHabit.title,
            `🍅 Pomodoro ${pomoPhase === 'WORK' ? 'Work' : 'Break'}`,
            targetEnd,
            true
          );
        }
      }
    }
  }, [isRunning, activeHabit, timerMode, pomoPhase, soundEnabled, saveActiveSessionSnapshot]);

  const fastForwardMicroStart = useCallback(() => {
    soundEngine.playTactileClick(soundEnabled);
    accumulatedSecondsRef.current += 30;
    setSecondsElapsed((s) => s + 30);
    saveActiveSessionSnapshot({ accumulatedSeconds: accumulatedSecondsRef.current });
    if (activeHabit && isRunning && timerMode === 'FLOW') {
      const now = Date.now();
      const currentRun = sessionStartTimeRef.current ? Math.floor((now - sessionStartTimeRef.current) / 1000) : 0;
      const virtualStart = now - (accumulatedSecondsRef.current + currentRun) * 1000;
      getAndroidBridge()?.startFocusTimerService?.(
        activeHabit.title,
        '∞ Open Flow Active',
        virtualStart,
        false
      );
    }
  }, [activeHabit, isRunning, timerMode, soundEnabled, saveActiveSessionSnapshot]);

  const MICRO_THRESHOLD = 120;
  const microCleared = secondsElapsed >= MICRO_THRESHOLD;
  const sessionMins = Math.max(2, Math.round(secondsElapsed / 60));
  const todayStr = new Date().toISOString().split('T')[0];

  // Initialize Theme, Sound, Notification Permission, and Deep-Link Auto-Start (?startHabit=<id>)
  useEffect(() => {
    const savedTheme = (localStorage.getItem('forge_theme') as ThemeMode) || theme;
    const savedAccent = (localStorage.getItem('forge_accent') as AccentColor) || accent;
    applyThemeAndAccentToDocument(savedTheme, savedAccent);

    // Check if launched from /widget or notification with ?startHabit=<id>
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('forge_walkthrough_seen');
      if (!seen) {
        const timer = setTimeout(() => {
          setShowWalkthrough(true);
        }, 600);
      }

      const params = new URLSearchParams(window.location.search);
      const startHabitId = params.get('startHabit');
      const action = params.get('action');

      if (startHabitId) {
        const target = habits.find((h) => h.id === startHabitId);
        if (target) {
          window.history.replaceState({}, '', '/');
          setTimeout(() => {
            startFocusSession(target);
          }, 0);
        }
      } else if (action === 'stop_and_log') {
        window.history.replaceState({}, '', '/');
        setTimeout(() => {
          const now = Date.now();
          if (sessionStartTimeRef.current) {
            accumulatedSecondsRef.current += Math.max(0, Math.floor((now - sessionStartTimeRef.current) / 1000));
            sessionStartTimeRef.current = null;
          }
          setIsRunning(false);
          getAndroidBridge()?.stopFocusTimerService?.();
          saveActiveSessionSnapshot({ isRunning: false });
          setShowDebrief(true);
        }, 50);
      } else if (action === 'extend_5m') {
        window.history.replaceState({}, '', '/');
        setTimeout(() => {
          basePomoSecondsLeftRef.current += 300;
          setPomoSecondsLeft((prev) => prev + 300);
          setToastMessage('+5 minutes added to focus session.');
        }, 50);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [habits, theme, startFocusSession]);

  // Background Habit Reminder Scheduler (Checks every 20 seconds against HH:MM)
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const currentHHMM = `${hh}:${mm}`;
      const dStr = now.toISOString().split('T')[0];

      habits.forEach((h) => {
        if (!h.reminderTime || h.reminderTime !== currentHHMM) return;
        if (h.lastCompletedDate === dStr) return; // Already completed today

        const fireKey = `${h.id}-${dStr}-${currentHHMM}`;
        if (firedRemindersRef.current.has(fireKey)) return;
        firedRemindersRef.current.add(fireKey);

        // Play audio chime & show toast + OS notification
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

      // 2. Evening Streak Danger Alert (8:00 PM / 20:00 onwards)
      if (now.getHours() >= 20) {
        habits.forEach((h) => {
          if (h.currentStreak > 0 && h.lastCompletedDate !== dStr) {
            const dangerKey = `danger-${h.id}-${dStr}`;
            if (firedRemindersRef.current.has(dangerKey)) return;
            firedRemindersRef.current.add(dangerKey);

            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              const n = new Notification(`⚡ Streak at Risk: ${h.title}`, {
                body: `Your ${h.currentStreak}-day streak is on the line. 2-min micro-start before midnight saves it!`,
                icon: '/icon',
              });
              n.onclick = () => {
                window.focus();
                startFocusSession(h);
              };
            }
          }
        });
      }
    };

    const interval = setInterval(checkReminders, 20000);
    return () => clearInterval(interval);
  }, [habits, soundEnabled, startFocusSession]);

  // Sync habit reminders with native Android AlarmManager if available
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bridge = getAndroidBridge();
    if (!bridge) return;

    const todayStr = new Date().toISOString().split('T')[0];

    habits.forEach((h) => {
      if (h.reminderTime) {
        const parts = h.reminderTime.split(':');
        const hh = parseInt(parts[0], 10);
        const mm = parseInt(parts[1], 10);
        if (!isNaN(hh) && !isNaN(mm)) {
          bridge.scheduleHabitReminder?.(h.id, h.title, hh, mm);
        }
      } else {
        bridge.cancelHabitReminder?.(h.id);
      }

      // Sync 8:00 PM evening streak danger reminder
      if (h.currentStreak > 0 && h.lastCompletedDate !== todayStr) {
        bridge.scheduleStreakDangerAlert?.(h.id, h.title, h.currentStreak);
      } else {
        bridge.cancelStreakDangerAlert?.(h.id);
      }
    });
  }, [habits]);

  const requestNotificationAccess = async () => {
    // 1. Check Native Android Bridge first
    if (
      typeof window !== 'undefined' &&
      (window as unknown as {
        ForgeAndroidBridge?: { requestNotificationPermission: () => void };
      }).ForgeAndroidBridge
    ) {
      try {
        (
          window as unknown as {
            ForgeAndroidBridge: { requestNotificationPermission: () => void };
          }
        ).ForgeAndroidBridge.requestNotificationPermission();
        soundEngine.playMicroClearedChime(soundEnabled);
        setToastMessage('Requested Android notification permission.');
        setNotifPermission('granted');
        return;
      } catch (err) {
        console.warn('Native Android notification request error:', err);
      }
    }

    // 2. Fall back to standard Web Notification API
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setToastMessage('Notifications are not supported on this browser.');
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
    if ((nextTheme === 'sepia' || nextTheme === 'light') && !userIsPro) {
      soundEngine.playTactileClick(soundEnabled);
      setShowProModal(true);
      return;
    }
    setTheme(nextTheme);
    applyThemeAndAccentToDocument(nextTheme, accent);
    soundEngine.playTactileClick(soundEnabled);
  };

  const selectAccent = (nextAccent: AccentColor) => {
    if (nextAccent !== 'indigo' && !userIsPro) {
      soundEngine.playTactileClick(soundEnabled);
      setShowProModal(true);
      return;
    }
    setAccent(nextAccent);
    applyThemeAndAccentToDocument(theme, nextAccent);
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
    setIsChainPickerOpen(false);
    if (selectedIdentityFilter !== 'ALL') {
      setNewHabitIdentityId(selectedIdentityFilter);
    } else if (identities[0]?.id) {
      setNewHabitIdentityId(identities[0].id);
    } else {
      setNewHabitIdentityId('preset:deep-worker');
    }
    setIsCreatorOpen(true);
  };

  const syncTimerFromWallClock = useCallback(() => {
    if (!isRunning || !activeHabit) return;
    const now = Date.now();

    // 1. Calculate focus elapsed seconds (in FLOW or POMO WORK)
    if (timerMode === 'FLOW' || pomoPhase === 'WORK') {
      if (sessionStartTimeRef.current) {
        const deltaSecs = Math.max(0, Math.floor((now - sessionStartTimeRef.current) / 1000));
        const total = accumulatedSecondsRef.current + deltaSecs;
        setSecondsElapsed(total);
      }
    }

    // 2. Calculate Pomodoro countdown if in POMO mode
    if (timerMode !== 'FLOW' && phaseStartTimeRef.current) {
      const phaseDeltaSecs = Math.max(0, Math.floor((now - phaseStartTimeRef.current) / 1000));
      const remaining = basePomoSecondsLeftRef.current - phaseDeltaSecs;

      if (remaining <= 0) {
        setPomoSecondsLeft(0);
        transitionPomodoroPhase();
      } else {
        setPomoSecondsLeft(remaining);
      }
    }
  }, [isRunning, activeHabit, timerMode, pomoPhase, transitionPomodoroPhase]);

  // Synchronize timer with wall-clock: runs on interval and instant browser events (visibility/focus/pageshow)
  // Maintains active Screen Wake Lock so mobile & desktop displays don't sleep mid-focus session
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let wakeLockSentinel: any = null;

    const acquireWakeLock = async () => {
      try {
        if (
          typeof navigator !== 'undefined' &&
          'wakeLock' in navigator &&
          document.visibilityState === 'visible'
        ) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          setIsWakeLockActive(true);
          wakeLockSentinel.addEventListener('release', () => {
            setIsWakeLockActive(false);
          });
        }
      } catch {
        // WakeLock may fail if system is on ultra battery saver or permissions denied
        setIsWakeLockActive(false);
      }
    };

    if (isRunning && activeHabit) {
      // Sync immediately on run state change
      syncTimerFromWallClock();
      acquireWakeLock();

      interval = setInterval(() => {
        syncTimerFromWallClock();
      }, 1000);

      // Event listeners for instant zero-drift recovery when returning from background / lock screen
      const handleSync = () => {
        syncTimerFromWallClock();
      };
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          syncTimerFromWallClock();
          // Web wake locks automatically release when page loses visibility; reacquire on resume
          acquireWakeLock();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleSync);
      window.addEventListener('pageshow', handleSync);

      return () => {
        if (interval) clearInterval(interval);
        if (wakeLockSentinel) {
          try {
            wakeLockSentinel.release();
          } catch {
            // ignore
          }
          wakeLockSentinel = null;
        }
        setIsWakeLockActive(false);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleSync);
        window.removeEventListener('pageshow', handleSync);
      };
    } else {
      setIsWakeLockActive(false);
    }
  }, [isRunning, activeHabit, syncTimerFromWallClock]);

  // ── Restore Active Focus Session across App Reclaim / Cold Boot ─────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const restoreTimer = setTimeout(() => {
      try {
        const savedSessionRaw = localStorage.getItem('forge_active_focus_session');
        if (!savedSessionRaw) return;
        const saved = JSON.parse(savedSessionRaw);
        if (!saved || !saved.habit || !saved.sessionStartTime) return;

        const now = Date.now();
        const maxAgeMs = 12 * 60 * 60 * 1000; // 12 hours max session age
        if (now - saved.sessionStartTime > maxAgeMs) {
          localStorage.removeItem('forge_active_focus_session');
          return;
        }

        setActiveHabit(saved.habit);
        setStage(saved.stage || 'PRACTICE');
        setTimerMode(saved.timerMode || 'FLOW');
        setPomoPhase(saved.pomoPhase || 'WORK');
        setPomoCyclesCompleted(saved.pomoCyclesCompleted || 0);
        setIsChallenge(Boolean(saved.isChallenge));
        setDifficulty(saved.difficulty || 3);

        const accSecs = saved.accumulatedSeconds || 0;
        accumulatedSecondsRef.current = accSecs;

        if (saved.isRunning) {
          sessionStartTimeRef.current = saved.sessionStartTime;
          phaseStartTimeRef.current = saved.phaseStartTime || saved.sessionStartTime;
          basePomoSecondsLeftRef.current = saved.basePomoSecondsLeft ?? (23 * 60);

          const runSecs = Math.max(0, Math.floor((now - saved.sessionStartTime) / 1000));
          const total = accSecs + runSecs;
          setSecondsElapsed(total);

          if (saved.timerMode !== 'FLOW') {
            const phaseDelta = Math.floor((now - (saved.phaseStartTime || saved.sessionStartTime)) / 1000);
            const rem = Math.max(0, (saved.basePomoSecondsLeft ?? (23 * 60)) - phaseDelta);
            setPomoSecondsLeft(rem);
          }

          setIsRunning(true);

          // Resume native Android Foreground Service
          if (saved.timerMode === 'FLOW') {
            getAndroidBridge()?.startFocusTimerService?.(
              saved.habit.title,
              '∞ Open Flow Active',
              now - (total * 1000),
              false
            );
          } else {
            getAndroidBridge()?.startFocusTimerService?.(
              saved.habit.title,
              `🍅 Pomodoro ${saved.pomoPhase === 'WORK' ? 'Work' : 'Break'}`,
              now + (Math.max(0, (saved.basePomoSecondsLeft ?? 1500) - Math.floor((now - (saved.phaseStartTime || now)) / 1000)) * 1000),
              true
            );
          }
        } else {
          setSecondsElapsed(accSecs);
          setPomoSecondsLeft(saved.basePomoSecondsLeft ?? (23 * 60));
          setIsRunning(false);
        }
      } catch (e) {
        console.warn('Failed to restore active focus session:', e);
        localStorage.removeItem('forge_active_focus_session');
      }
    }, 0);

    return () => clearTimeout(restoreTimer);
  }, []);

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

  // Pre-index sessions by habitId: O(M) once instead of O(N x M) per-card scan
  const sessionsByHabitId = useMemo(() => {
    const map: Record<string, SerializedSession[]> = {};
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (!map[s.habitId]) {
        map[s.habitId] = [];
      }
      map[s.habitId].push(s);
    }
    return map;
  }, [sessions]);

  // Global 84-day system analytics: computed once on session/identity change (Audit #5)
  const totalSystemHours = useMemo(
    () => identities.reduce((acc, i) => acc + i.totalHoursLogged, 0),
    [identities]
  );

  const globalAnalytics = useMemo(
    () => buildSystemAnalytics(sessions, totalSystemHours, 84),
    [sessions, totalSystemHours]
  );

  const filteredSessions = useMemo(() => {
    if (selectedIdentityFilter === 'ALL') return sessions;
    return sessions.filter((s) => s.identityId === selectedIdentityFilter);
  }, [sessions, selectedIdentityFilter]);

  const baselineHours = useMemo(() => {
    if (selectedIdentityFilter === 'ALL') {
      return totalSystemHours;
    }
    return (
      identities.find((i) => i.id === selectedIdentityFilter)?.totalHoursLogged || 0
    );
  }, [identities, selectedIdentityFilter, totalSystemHours]);

  // If filter is ALL, return precomputed global analytics (0ms latency, zero re-calculation of 84-day grid!)
  const analytics = useMemo(() => {
    if (selectedIdentityFilter === 'ALL') return globalAnalytics;
    return buildSystemAnalytics(filteredSessions, baselineHours, 84);
  }, [selectedIdentityFilter, globalAnalytics, filteredSessions, baselineHours]);

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

  const activeHabitExamples = useMemo(() => {
    if (newHabitIdentityId.startsWith('preset:')) {
      const key = newHabitIdentityId.replace('preset:', '');
      return IDENTITY_PRESETS.find((p) => p.key === key)?.examples || [];
    }
    const existingObj = identities.find((i) => i.id === newHabitIdentityId);
    if (existingObj) {
      const matchedPreset = IDENTITY_PRESETS.find(
        (p) => p.title.toLowerCase() === existingObj.title.toLowerCase()
      );
      if (matchedPreset) return matchedPreset.examples;
    }
    return IDENTITY_PRESETS.slice(0, 3).flatMap((p) => p.examples.slice(0, 1));
  }, [newHabitIdentityId, identities]);

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
    setEditHabitGoalMins(habit.dailyGoalMinutes || 0);
    setEditHabitGoalDays(habit.weeklyGoalDays || 0);
    setIsEditChainPickerOpen(false);
    setConfirmDeleteHabit(false);
  };

  const handleFinishSession = async (microOnly: boolean) => {
    if (!activeHabit) return;

    // 1. Calculate votes & scores instantly in memory
    const durMins = microOnly ? 2 : sessionMins;
    const votesEarned = calculateSessionScore({
      phase: stage,
      isChallengeMode: isChallenge,
      isRecoveryBonus: activeHabit.isReboundPriority,
      durationMinutes: durMins,
      completedMicroOnly: microOnly,
    });
    const hoursAdded = Number((durMins / 60).toFixed(2));
    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Play sound fanfare & give instant audio/haptic feedback
    soundEngine.playSessionCompleteFanfare(soundEnabled);

    // 3. Optimistically update habits list
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== activeHabit.id) return h;
        const isNewDay = h.lastCompletedDate !== todayStr;
        return {
          ...h,
          currentStreak: isNewDay ? h.currentStreak + 1 : h.currentStreak,
          missedYesterday: false,
          isReboundPriority: false,
          downscaledDaysRemaining: h.downscaledDaysRemaining > 0 ? h.downscaledDaysRemaining - 1 : 0,
          lastCompletedDate: todayStr,
        };
      })
    );

    // 4. Optimistically update identity scores
    setIdentities((prev) =>
      prev.map((i) => {
        if (i.id !== activeHabit.identityId) return i;
        return {
          ...i,
          totalVotes: i.totalVotes + 1,
          weightedScore: Number((i.weightedScore + votesEarned).toFixed(2)),
          totalHoursLogged: Number((i.totalHoursLogged + hoursAdded).toFixed(1)),
        };
      })
    );

    // 5. Optimistically record the session log
    const optimisticSession: SerializedSession = {
      id: `temp-sess-${Date.now()}`,
      habitId: activeHabit.id,
      identityId: activeHabit.identityId,
      habitTitle: activeHabit.title,
      identityTitle: activeHabit.identityTitle,
      phase: stage,
      durationMinutes: durMins,
      completedGatewayOnly: microOnly,
      isResistancePractice: isChallenge,
      frictionRating: difficulty,
      bottleneckAttacked: bottleneckNote.trim() || null,
      tacitInsight: insightNote.trim() || null,
      votesEarned,
      loggedAt: new Date().toISOString(),
    };
    setSessions((prev) => [...prev, optimisticSession]);

    // 6. Transition to next habit or close modal INSTANTLY (0ms response)
    const nextTitle = activeHabit.nextStackedHabitTitle;
    const nextId = activeHabit.nextStackedHabitId;

    setToastMessage(
      `+${votesEarned} pts logged${nextTitle ? ` • Next: ${nextTitle}` : ''}`
    );

    const targetHabit = activeHabit;
    const targetStage = stage;
    const targetChallenge = isChallenge;
    const targetDifficulty = difficulty;
    const targetBottleneck = bottleneckNote;
    const targetInsight = insightNote;

    clearActiveSessionSnapshot();
    setActiveHabit(null);
    setIsRunning(false);

    // Calculate if all daily habits have now been forged (Perfect Day)
    const remainingUnfinished = habits.filter(
      (h) => h.id !== targetHabit.id && h.lastCompletedDate !== todayStr
    );
    const isPerfectDayNow = habits.length > 0 && remainingUnfinished.length === 0;

    let nextHabitToPrompt: SerializedHabit | null = null;
    if (nextId) {
      nextHabitToPrompt = habits.find((h) => h.id === nextId) || null;
    }
    if (!nextHabitToPrompt && remainingUnfinished.length > 0) {
      nextHabitToPrompt = remainingUnfinished[0];
    }

    if (isPerfectDayNow) {
      soundEngine.playPerfectDayFanfare(soundEnabled);
    }

    setChainTransitionData({
      habit: targetHabit,
      votesEarned,
      durationMinutes: durMins,
      isPerfectDayNow,
      nextHabit: nextHabitToPrompt,
    });

    // 7. Background sync to server without freezing the UI
    try {
      await logForgeSession({
        habitId: targetHabit.id,
        identityId: targetHabit.identityId,
        phase: targetStage,
        durationMinutes: durMins,
        completedGatewayOnly: microOnly,
        isResistancePractice: targetChallenge,
        frictionRating: targetDifficulty,
        bottleneckAttacked: targetBottleneck,
        tacitInsight: targetInsight,
      });
    } catch (err) {
      console.error('Failed to sync session to server:', err);
      setToastMessage('Session saved locally, will sync when online.');
    }
  };

  const handleCreateIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newIdTitle.trim();
    const mission = newIdMission.trim();
    const stage = newIdStage;
    if (!title) return;

    // Reset inputs & close modal immediately (0ms instant response)
    setNewIdTitle('');
    setNewIdMission('');
    setCreatorTab('HABIT');
    setToastMessage(`Identity "${title}" created!`);

    const tempId = `temp-id-${Date.now()}`;
    const optimisticIdentity: SerializedIdentity = {
      id: tempId,
      title,
      lifesTaskStatement: mission,
      currentPhase: stage,
      totalVotes: 0,
      weightedScore: 0,
      totalHoursLogged: 0,
    };

    setIdentities((prev) => [...prev, optimisticIdentity]);
    setNewHabitIdentityId(tempId);

    try {
      const created = await createIdentityVector({
        title,
        lifesTaskStatement: mission,
        currentPhase: stage,
      });
      // Replace temporary id with DB id
      setIdentities((prev) =>
        prev.map((i) => (i.id === tempId ? { ...i, id: created.id } : i))
      );
      setNewHabitIdentityId(created.id);
    } catch (err) {
      console.error('Failed to create identity on server:', err);
    }
  };

  const handleUpdateIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdentity) return;

    const id = editingIdentity.id;
    const title = editIdTitle.trim();
    const mission = editIdMission.trim();
    const stage = editIdStage;

    // Close modal & toast immediately (0ms)
    setEditingIdentity(null);
    setToastMessage('Identity updated!');

    setIdentities((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, title, lifesTaskStatement: mission, currentPhase: stage }
          : i
      )
    );

    try {
      await updateIdentityVector({
        id,
        title,
        lifesTaskStatement: mission,
        currentPhase: stage,
      });
    } catch (err) {
      console.error('Failed to update identity on server:', err);
    }
  };

  const handleDeleteIdentity = async () => {
    if (!editingIdentity) return;
    const id = editingIdentity.id;

    if (selectedIdentityFilter === id) {
      setSelectedIdentityFilter('ALL');
    }
    setEditingIdentity(null);
    setToastMessage('Identity removed.');

    setIdentities((prev) => prev.filter((i) => i.id !== id));
    setHabits((prev) => prev.filter((h) => h.identityId !== id));

    try {
      await deleteIdentityVector(id);
    } catch (err) {
      console.error('Failed to delete identity on server:', err);
    }
  };

  const handleCreateHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newHabitTitle.trim();
    const micro = newHabitMicro.trim();
    const targetIdId = newHabitIdentityId || identities[0]?.id || 'preset:deep-worker';
    const targetIdentity = identities.find((i) => i.id === targetIdId);
    const reminder = newHabitReminder || null;
    const anchorId = newHabitAnchorId === 'NONE' ? null : newHabitAnchorId;

    if (!title) return;

    // 0ms Instant Response: Clear inputs & close modal immediately
    setNewHabitTitle('');
    setNewHabitMicro('');
    setNewHabitReminder('');
    setNewHabitAnchorId('NONE');
    setIsCreatorOpen(false);
    setToastMessage('New habit added to the top of your queue!');

    const tempId = `temp-h-${Date.now()}`;
    const optimisticHabit: SerializedHabit = {
      id: tempId,
      identityId: targetIdId,
      title,
      gatewayVersion: micro,
      defaultPhase: newHabitStage,
      anchorHabitId: anchorId,
      reminderTime: reminder,
      dailyGoalMinutes: newHabitGoalMins || undefined,
      weeklyGoalDays: newHabitGoalDays || undefined,
      lastCompletedDate: null,
      temptationBundleUrl: null,
      temptationLabel: null,
      currentStreak: 0,
      missedYesterday: false,
      isReboundPriority: false,
      downscaledDaysRemaining: 0,
      identityTitle: targetIdentity?.title || 'Personal Master',
      nextStackedHabitTitle: null,
      nextStackedHabitId: null,
    };

    setHabits((prev) => [optimisticHabit, ...prev]);

    try {
      await createStackedHabit({
        identityId: targetIdId,
        title,
        gatewayVersion: micro,
        defaultPhase: newHabitStage,
        anchorHabitId: anchorId,
        reminderTime: reminder,
        dailyGoalMinutes: newHabitGoalMins || null,
        weeklyGoalDays: newHabitGoalDays || null,
      });
    } catch (err) {
      console.error('Failed to create habit on server:', err);
      setToastMessage('Failed to save habit. Please check your connection.');
    }
  };

  const handleUpdateHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit) return;

    const targetHabitId = editingHabit.id;
    const updatedTitle = editHabitTitle.trim();
    const updatedMicro = editHabitMicro.trim();
    const updatedStage = editHabitStage;
    const updatedAnchorId = editHabitAnchorId === 'NONE' ? null : editHabitAnchorId;
    const updatedReminder = editHabitReminder || null;
    const updatedGoalMins = editHabitGoalMins || 0;
    const updatedGoalDays = editHabitGoalDays || 0;
    const targetIdId = editHabitIdentityId;
    const targetIdentity = identities.find((i) => i.id === targetIdId);

    // 0ms Instant Response: Close modal immediately
    setEditingHabit(null);
    setToastMessage('Habit updated!');

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== targetHabitId) return h;
        return {
          ...h,
          title: updatedTitle,
          gatewayVersion: updatedMicro,
          defaultPhase: updatedStage,
          anchorHabitId: updatedAnchorId,
          reminderTime: updatedReminder,
          dailyGoalMinutes: updatedGoalMins || undefined,
          weeklyGoalDays: updatedGoalDays || undefined,
          identityId: targetIdId,
          identityTitle: targetIdentity?.title || h.identityTitle,
        };
      })
    );

    try {
      await updateStackedHabit({
        id: targetHabitId,
        identityId: targetIdId,
        title: updatedTitle,
        gatewayVersion: updatedMicro,
        defaultPhase: updatedStage,
        anchorHabitId: updatedAnchorId,
        reminderTime: updatedReminder,
        dailyGoalMinutes: updatedGoalMins || null,
        weeklyGoalDays: updatedGoalDays || null,
      });
    } catch (err) {
      console.error('Failed to update habit on server:', err);
      setToastMessage('Failed to update habit on server.');
    }
  };

  const handleDeleteHabit = async () => {
    if (!editingHabit) return;
    const targetId = editingHabit.id;

    // 0ms Instant Response: Close modal immediately
    setEditingHabit(null);
    setToastMessage('Habit removed.');

    setHabits((prev) => prev.filter((h) => h.id !== targetId));

    try {
      await deleteStackedHabit(targetId);
    } catch (err) {
      console.error('Failed to delete habit on server:', err);
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

  const selectedNewAnchorObj = habits.find((h) => h.id === newHabitAnchorId);
  const selectedEditAnchorObj = habits.find((h) => h.id === editHabitAnchorId);

  const selectedCreatorIdentityObj = useMemo(() => {
    if (newHabitIdentityId.startsWith('preset:')) {
      const key = newHabitIdentityId.replace('preset:', '');
      const preset = IDENTITY_PRESETS.find((p) => p.key === key);
      return {
        id: newHabitIdentityId,
        title: preset?.title || 'Focused Deep Worker',
        category: preset?.category || 'Identity Template',
      };
    }
    const existing = identities.find((i) => i.id === newHabitIdentityId);
    return {
      id: newHabitIdentityId,
      title: existing?.title || 'Active Identity',
      category: 'Your Custom Identity',
    };
  }, [newHabitIdentityId, identities]);

  const navItems = [
    { id: 'WORKSPACE', label: 'Home', icon: Zap },
    { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3 },
    { id: 'HEATMAP', label: 'Continuity', icon: Calendar },
    { id: 'VAULT', label: 'Insights', icon: BookOpen },
    { id: 'ACCOUNT', label: 'Account', icon: User },
  ] as const;

  const [showArchivedHabits, setShowArchivedHabits] = useState(false);

  const handleTogglePin = async (habit: SerializedHabit) => {
    soundEngine.playTactileClick(soundEnabled);
    const nextPinned = !habit.isPinned;
    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, isPinned: nextPinned } : h))
    );
    setToastMessage(nextPinned ? `Pinned "${habit.title}" to top.` : `Unpinned "${habit.title}".`);
    try {
      await togglePinHabitAction(habit.id, nextPinned);
    } catch (err) {
      console.error('Failed to pin habit:', err);
    }
  };

  const handleToggleArchive = async (habit: SerializedHabit) => {
    soundEngine.playTactileClick(soundEnabled);
    const nextArchived = !habit.isArchived;
    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, isArchived: nextArchived } : h))
    );
    setToastMessage(
      nextArchived
        ? `Archived "${habit.title}". Past session history preserved.`
        : `Restored "${habit.title}" to active queue.`
    );
    try {
      await toggleArchiveHabitAction(habit.id, nextArchived);
    } catch (err) {
      console.error('Failed to toggle archive habit:', err);
    }
  };

  const visibleHabits = useMemo(() => {
    return habits
      .filter((h) => {
        if (selectedIdentityFilter !== 'ALL' && h.identityId !== selectedIdentityFilter) return false;
        if (showArchivedHabits) return Boolean(h.isArchived);
        return !h.isArchived;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isReboundPriority && !b.isReboundPriority) return -1;
        if (!a.isReboundPriority && b.isReboundPriority) return 1;
        return 0;
      });
  }, [habits, selectedIdentityFilter, showArchivedHabits]);

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
      {/* ULTRA-CLEAN FLOATING GLASS HEADER                         */}
      {/* ========================================================= */}
      <header className="sticky top-[max(0.75rem,env(safe-area-inset-top))] z-30 px-3 sm:px-6">
        <div className="max-w-5xl mx-auto glass-nav rounded-2xl px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Brand */}
          <button
            onClick={() => setActiveTab('WORKSPACE')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-sm"
              style={{ background: 'var(--accent-primary)' }}
            >
              F
            </div>
            <span className="text-base font-bold tracking-tight theme-text">
              ForgeOS
            </span>
          </button>

          {/* Center Glass Pill Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl border border-[var(--border-subtle)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              const isLocked = item.id === 'ANALYTICS' && !userIsPro;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundEngine.playTactileClick(soundEnabled);
                    navigateToTab(item.id);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active ? 'glass-tab-active' : 'theme-subtext hover:opacity-80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {isLocked && <Lock className="w-3 h-3 text-amber-400" />}
                </button>
              );
            })}
          </nav>

          {/* Right Status: Clean Mobile Overflow Menu + Streak + Account Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Tools Overflow Menu (Mobile) */}
            <div className="relative md:hidden">
              <button
                onClick={() => setIsQuickToolsMenuOpen((prev) => !prev)}
                title="Quick Tools (Guide, Widget, Theme)"
                className="flex items-center justify-center p-2 rounded-xl glass-panel text-xs font-semibold theme-text hover:opacity-90 cursor-pointer"
                aria-label="More quick tools"
              >
                <MoreHorizontal className="w-4 h-4 text-indigo-400" />
              </button>

              {isQuickToolsMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsQuickToolsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 glass-panel rounded-2xl p-1.5 z-50 border border-white/10 shadow-2xl space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        setIsQuickToolsMenuOpen(false);
                        setShowWalkthrough(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold theme-text hover:bg-white/10 transition cursor-pointer text-left"
                    >
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      <span>How ForgeOS Works</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsQuickToolsMenuOpen(false);
                        setIsWidgetDrawerOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold theme-text hover:bg-white/10 transition cursor-pointer text-left"
                    >
                      <LayoutGrid className="w-4 h-4 text-indigo-400" />
                      <span>Quick Habit Widget</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsQuickToolsMenuOpen(false);
                        setIsThemeModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold theme-text hover:bg-white/10 transition cursor-pointer text-left"
                    >
                      <Palette className="w-4 h-4 text-amber-400" />
                      <span>Theme & Accent</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsQuickToolsMenuOpen(false);
                        setSoundEnabled((prev) => !prev);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold theme-text hover:bg-white/10 transition cursor-pointer text-left"
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      )}
                      <span>Sound FX: {soundEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Desktop Direct Tool Buttons */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => {
                  soundEngine.playTactileClick(soundEnabled);
                  setShowWalkthrough(true);
                }}
                title="How ForgeOS Works (Walkthrough)"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl glass-panel text-xs font-semibold text-indigo-400 hover:opacity-90 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Guide</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playTactileClick(soundEnabled);
                  setIsWidgetDrawerOpen(true);
                }}
                title="Open Quick Habit Widget"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-panel text-xs font-semibold theme-text hover:opacity-90 cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                <span>Widget</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playTactileClick(soundEnabled);
                  setIsThemeModalOpen(true);
                }}
                title="Theme & Accent Palette"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-panel text-xs font-semibold theme-text hover:opacity-90 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Theme</span>
              </button>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl glass-panel text-xs font-bold text-orange-500">
              <Flame className="w-3.5 h-3.5 fill-orange-500" />
              <span>{analytics.resilientStreak}d</span>
            </div>

            <button
              onClick={() => {
                soundEngine.playTactileClick(soundEnabled);
                setActiveTab('ACCOUNT');
              }}
              title="Account & Preferences"
              className={`flex items-center gap-2 p-1 pr-2.5 rounded-xl border transition cursor-pointer ${
                activeTab === 'ACCOUNT'
                  ? 'glass-tab-active border-transparent'
                  : 'glass-panel theme-text hover:opacity-90'
              }`}
            >
              {currentUser?.image ? (
                <img
                  src={currentUser.image}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  {currentUser?.name ? (
                    currentUser.name[0]?.toUpperCase()
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
              )}
              <span className="text-xs font-semibold hidden sm:inline max-w-[80px] truncate">
                {currentUser ? currentUser.name.split(' ')[0] : 'Account'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER                                            */}
      {/* ========================================================= */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-6">
        {/* Toast Banner */}
        {toastMessage && (
          <div className="glass-panel rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs sm:text-sm border border-emerald-500/25 shadow-lg shadow-emerald-500/5 transition-all duration-300">
            <span className="flex items-center gap-2.5 font-medium theme-text">
              <span className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span>{toastMessage}</span>
            </span>
            <button
              onClick={() => setToastMessage(null)}
              className="theme-muted hover:opacity-80 p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer ml-3 shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: MINIMALISTIC HOME WORKSPACE (HABITS ON TOP)        */}
        {/* ========================================================= */}
        {activeTab === 'WORKSPACE' && (
          <div className="space-y-6">
            {/* Daily Streak Retention & Quick-Action Banner */}
            <DailyRetentionBanner
              habits={habits}
              sessions={sessions}
              strictStreak={analytics.strictStreak}
              resilientStreak={analytics.resilientStreak}
              onStartHabit={startFocusSession}
            />

            {/* Evening Streak Danger Warning Banner (7:00 PM onwards if streak habits remain uncompleted) */}
            {isEvening && atRiskStreakHabits.length > 0 && (
              <div
                className="p-3.5 sm:p-4 rounded-2xl border border-rose-500/35 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg"
                style={{
                  backgroundColor: 'rgba(244, 63, 94, 0.08)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-rose-300">
                        Streak Alert: {atRiskStreakHabits.length} {atRiskStreakHabits.length === 1 ? 'Habit' : 'Habits'} at Risk
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold">
                        Before Midnight
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-0.5">
                      {atRiskStreakHabits.map((h) => `${h.title} (${h.currentStreak}d)`).join(' • ')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startFocusSession(atRiskStreakHabits[0])}
                  className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Save Streak: 2m Micro-Start →</span>
                </button>
              </div>
            )}
            {/* CENTERED HERO & CREATION COMMAND DOCK */}
            <section className="text-center max-w-xl mx-auto space-y-3 pt-1">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-widest theme-muted">
                  {analytics.effectiveHours} Effective Hrs • {analytics.completionRate14d}% Consistency
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight theme-text">
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

              {/* Horizontal Scrollable Single-Row Filter Strip (No multi-line stacking!) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-2 px-2">
                <button
                  onClick={() => setSelectedIdentityFilter('ALL')}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                    selectedIdentityFilter === 'ALL'
                      ? 'glass-tab-active shadow-xs'
                      : 'glass-panel theme-subtext hover:opacity-80'
                  }`}
                >
                  All Habits ({habits.length})
                </button>
                {identities.map((idObj) => {
                  const isSelected = selectedIdentityFilter === idObj.id;
                  return (
                    <button
                      key={idObj.id}
                      onClick={() => setSelectedIdentityFilter(idObj.id)}
                      onDoubleClick={() => openEditIdentityModal(idObj)}
                      className={`px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition cursor-pointer ${
                        isSelected
                          ? 'glass-tab-active shadow-xs font-semibold'
                          : 'glass-panel theme-subtext hover:opacity-80'
                      }`}
                    >
                      {idObj.title}
                    </button>
                  );
                })}

                {/* Contextual Identity Edit Action (Audit #17) */}
                {selectedIdentityFilter !== 'ALL' && (
                  <button
                    onClick={() => {
                      const cur = identities.find((i) => i.id === selectedIdentityFilter);
                      if (cur) openEditIdentityModal(cur);
                    }}
                    title="Edit selected identity"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium glass-panel theme-subtext hover:theme-text shrink-0 cursor-pointer transition border border-white/10 hover:border-white/20"
                  >
                    <Pencil className="w-2.5 h-2.5 text-amber-400" />
                    <span>Edit Identity</span>
                  </button>
                )}
              </div>
            </section>

            {/* ACTIVE HABIT QUEUE */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider theme-muted">
                    {showArchivedHabits ? 'Archived Habits' : 'Active Habit Queue'} ({visibleHabits.length})
                  </span>
                  <button
                    onClick={() => setShowArchivedHabits((prev) => !prev)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer ${
                      showArchivedHabits
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'glass-panel theme-subtext hover:theme-text'
                    }`}
                  >
                    {showArchivedHabits ? (
                      <ArchiveRestore className="w-3 h-3" />
                    ) : (
                      <Archive className="w-3 h-3" />
                    )}
                    <span>
                      {showArchivedHabits
                        ? 'Show Active'
                        : `Archived (${habits.filter((h) => h.isArchived).length})`}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (expandedHabitIds.size > 0) {
                        setExpandedHabitIds(new Set());
                      } else {
                        setExpandedHabitIds(new Set(visibleHabits.map((h) => h.id)));
                      }
                    }}
                    className="text-xs font-semibold theme-subtext hover:opacity-80 flex items-center gap-1 cursor-pointer transition"
                  >
                    <span>{expandedHabitIds.size > 0 ? 'Collapse All' : 'Expand All'}</span>
                  </button>
                  <button
                    onClick={() => setIsWidgetDrawerOpen(true)}
                    className="hidden sm:flex text-xs font-semibold theme-subtext hover:opacity-80 items-center gap-1 cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                    Widget View
                  </button>
                </div>
              </div>

              {/* Compact & Expandable Habit Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleHabits.map((habit) => {
                  const stageMeta =
                    STAGE_LABELS[habit.defaultPhase as SkillStage] ||
                    STAGE_LABELS.PRACTICE;
                  const doneToday = habit.lastCompletedDate === todayStr;
                  const isExpanded = expandedHabitIds.has(habit.id);

                  // Daily Goal Target Metrics (Audit #24)
                  const habitDailyGoal = habit.dailyGoalMinutes || 0;
                  const habitSessions = sessionsByHabitId[habit.id] || [];
                  const todayMins = habitSessions
                    .filter((s) => s.loggedAt.startsWith(todayStr))
                    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
                  const goalMet = habitDailyGoal > 0 && todayMins >= habitDailyGoal;
                  const goalPct =
                    habitDailyGoal > 0
                      ? Math.min(100, Math.round((todayMins / habitDailyGoal) * 100))
                      : 0;

                  return (
                    <div
                      key={habit.id}
                      className={`glass-panel glass-panel-hover p-4 sm:p-4.5 rounded-2xl flex flex-col justify-between gap-3 transition-all duration-200 ${
                        habit.isPinned
                          ? 'border-amber-500/40 shadow-sm'
                          : habit.isReboundPriority
                          ? 'ring-1 ring-amber-500/50'
                          : ''
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Top Metadata Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg glass-panel theme-text">
                              {habit.identityTitle}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md glass-panel theme-muted">
                              {stageMeta.name.split(' ')[0]}
                            </span>
                            {habit.reminderTime && isExpanded && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md glass-panel text-indigo-400">
                                <Bell className="w-2.5 h-2.5" />
                                {habit.reminderTime}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {doneToday && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Done
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs font-bold text-orange-500">
                              <Flame className="w-3.5 h-3.5 fill-orange-500" />
                              {habit.currentStreak}d
                            </span>
                            <button
                              onClick={() => handleTogglePin(habit)}
                              className={`p-1 rounded-lg transition cursor-pointer ${
                                habit.isPinned
                                  ? 'text-amber-400 bg-amber-500/15'
                                  : 'theme-muted hover:text-amber-400'
                              }`}
                              title={habit.isPinned ? 'Unpin habit' : 'Pin habit to top'}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                            {showArchivedHabits ? (
                              <button
                                onClick={() => handleToggleArchive(habit)}
                                className="p-1 rounded-lg text-amber-400 hover:text-amber-300 transition cursor-pointer"
                                title="Restore habit to active queue"
                              >
                                <ArchiveRestore className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                onClick={() => openEditHabitModal(habit)}
                                className="p-1 rounded-lg theme-muted hover:opacity-80 cursor-pointer"
                                title="Edit Habit"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title and 2-min Gateway preview */}
                        <div>
                          <h3 className="text-sm sm:text-base font-bold theme-text leading-snug">
                            {habit.title}
                          </h3>
                          <p className="text-xs theme-subtext mt-0.5">
                            <strong className="text-emerald-500 dark:text-emerald-400">
                              2m:
                            </strong>{' '}
                            {habit.gatewayVersion}
                          </p>

                          {/* Daily Goal Target Indicator (Audit #24) */}
                          {habitDailyGoal > 0 && (
                            <div className="pt-2 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span
                                  className={
                                    goalMet
                                      ? 'text-emerald-400 font-bold flex items-center gap-1'
                                      : 'theme-subtext flex items-center gap-1'
                                  }
                                >
                                  <Target className="w-3 h-3 text-indigo-400" />
                                  {goalMet ? 'Daily Goal Met! ✓' : 'Daily Goal Target'}
                                </span>
                                <span className={goalMet ? 'text-emerald-400 font-bold' : 'theme-text'}>
                                  {todayMins} / {habitDailyGoal}m ({goalPct}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    goalMet
                                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                      : 'bg-indigo-500'
                                  }`}
                                  style={{ width: `${goalPct}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Expandable Accordion Body (7-Day Chain & Stack details) */}
                        {isExpanded && (
                          <div className="space-y-2.5 pt-2 border-t border-white/5 animate-in fade-in duration-200">
                            {habit.isReboundPriority && (
                              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-500">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Streak Shield Active (+1.25x Bonus)
                              </div>
                            )}

                            {habit.nextStackedHabitTitle && (
                              <p className="text-[11px] theme-muted flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 text-amber-400" />
                                Next in chain: {habit.nextStackedHabitTitle}
                              </p>
                            )}

                            {/* 7-Day Visual Node Chain Timeline & Milestone Flame */}
                            <HabitVisualChain
                              habitId={habit.id}
                              sessions={sessionsByHabitId[habit.id] || []}
                              currentStreak={habit.currentStreak}
                              missedYesterday={habit.missedYesterday}
                              downscaledDaysRemaining={habit.downscaledDaysRemaining}
                              lastCompletedDate={habit.lastCompletedDate}
                            />
                          </div>
                        )}
                      </div>

                      {/* Card Action Footer */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => toggleHabitExpand(habit.id)}
                          className="flex items-center gap-1 text-[11px] font-medium theme-subtext hover:theme-text py-1.5 px-2 rounded-lg hover:bg-white/5 transition cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Chain' : '7-Day Chain'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => startFocusSession(habit)}
                          className="px-3.5 py-1.5 rounded-xl text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
                          style={{
                            background: doneToday ? 'rgba(16, 185, 129, 0.85)' : 'var(--accent-primary)',
                          }}
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>{doneToday ? 'Forge Again' : 'Start (2m)'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* COMPACT IDENTITY SUMMARY STRIP BELOW HABITS */}
            <section className="space-y-2.5 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider theme-muted px-1 block">
                Your Identity Vectors ({identities.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {identities.map((idVec) => (
                  <div
                    key={idVec.id}
                    className="glass-panel glass-panel-hover rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase theme-muted block">
                        {idVec.currentPhase}
                      </span>
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
              </div>
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ANALYTICS HUB                                      */}
        {activeTab === 'ANALYTICS' && (
          userIsPro ? (
            <div className="space-y-6">
            {/* Weekly Consistency & Progress Review Card */}
            <WeeklyReviewCard
              sessions={sessions}
              habits={habits}
              onStartGateway={(habitSummary) => {
                const target = habits.find((h) => h.id === habitSummary.id);
                if (target) startFocusSession(target);
              }}
            />

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
        ) : (
          <div className="space-y-6">
            <ProUpgradeCard
              onUnlocked={() => setUserUnlockedPro(true)}
              onBackToWorkspace={() => navigateToTab('WORKSPACE')}
              currentUser={currentUser}
            />
          </div>
        )
      )}

        {/* ========================================================= */}
        {/* TAB 3: CONTINUITY HEATMAP                                 */}
        {/* ========================================================= */}
        {activeTab === 'HEATMAP' && (
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <div>
              <h2 className="text-lg font-bold theme-text">28-Day Continuity Matrix</h2>
              <p className="text-xs theme-subtext">
                Tap any day cell to inspect focus duration and points.
              </p>
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
        {/* TAB 4: INSIGHT VAULT & SESSION ACTIVITY FEED              */}
        {/* ========================================================= */}
        {activeTab === 'VAULT' && (
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
            <SessionHistoryFeed
              sessions={filteredSessions}
              habits={habits}
              onToast={(msg) => setToastMessage(msg)}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: ACCOUNT, THEMES, NOTIFICATIONS & WIDGETS           */}
        {/* ========================================================= */}
        {activeTab === 'ACCOUNT' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold theme-text">Account &amp; Preferences</h2>
              <p className="text-xs theme-subtext">
                Manage cloud sync, visual themes, reminder notifications, and widget tools.
              </p>
            </div>

            {/* ForgeOS Pro & Beta Tester Access Section */}
            {userIsPro ? (
              <div className="glass-panel p-6 rounded-2xl space-y-4 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-transparent to-indigo-500/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold theme-text flex items-center gap-2">
                        ForgeOS Pro Activated
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                          LIFETIME PASS
                        </span>
                      </h3>
                      <p className="text-xs theme-subtext">
                        Play Store Beta Tester / Full Pro tier unlocked for this account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[var(--border-subtle)] text-xs theme-subtext">
                  <span className="flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Analytics Hub Unlocked
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sepia &amp; Daylight Themes Active
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pomodoro Extensions Enabled
                  </span>
                </div>
              </div>
            ) : (
              <ProUpgradeCard
                onUnlocked={() => setUserUnlockedPro(true)}
                onBackToWorkspace={() => navigateToTab('WORKSPACE')}
                currentUser={currentUser}
              />
            )}

            {/* 1. Profile & Google Cloud Sync */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider theme-muted flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Profile &amp; Cloud Sync
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full glass-panel theme-subtext">
                  {currentUser ? 'Synced with Google' : 'Local Guest Workspace'}
                </span>
              </div>

              {currentUser ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-3.5">
                    {currentUser.image ? (
                      <img
                        src={currentUser.image}
                        alt={currentUser.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-[var(--border-strong)]"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
                        style={{ background: 'var(--accent-primary)' }}
                      >
                        {currentUser.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold theme-text">{currentUser.name}</h3>
                      <p className="text-xs theme-subtext">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-panel text-xs font-bold theme-text hover:opacity-90 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </form>

                    {!confirmDeleteAccount ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAccount(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Account &amp; Data
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-rose-950/40 border border-rose-500/50">
                        <span className="text-[11px] text-rose-300 font-semibold px-1">
                          Delete all habits &amp; cloud data?
                        </span>
                        <form action={deleteUserAccountAndData}>
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition"
                          >
                            Yes, Delete Forever
                          </button>
                        </form>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAccount(false)}
                          className="px-2 py-1.5 rounded-lg glass-panel theme-subtext text-xs hover:opacity-80 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold theme-text">
                      Sync Your Habits Across Mobile &amp; Desktop
                    </h3>
                    <p className="text-xs theme-subtext max-w-md">
                      Sign in with Google to back up your identities, streaks, and session logs to your private cloud workspace.
                    </p>
                  </div>

                  {googleAuthEnabled ? (
                    <form action={signInWithGoogleAction}>
                      <button
                        type="submit"
                        className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm hover:opacity-95 shrink-0 cursor-pointer"
                        style={{ background: 'var(--accent-primary)' }}
                      >
                        <span>Continue with Google</span>
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <form action={deleteUserAccountAndData}>
                        <button
                          type="submit"
                          onClick={(e) => {
                            if (!confirm('Permanently wipe all guest habit records and reset workspace?')) {
                              e.preventDefault();
                            }
                          }}
                          className="text-[11px] px-3 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer transition font-medium"
                        >
                          Wipe Workspace Data
                        </button>
                      </form>
                      <span className="text-[11px] font-mono px-2.5 py-1.5 rounded-xl glass-panel theme-muted hidden sm:inline">
                        Guest Workspace
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs theme-subtext">
                <span>Google Play &amp; Privacy Policy Compliant. Only session logs and profile are stored.</span>
                <a
                  href="/privacy"
                  className="text-xs font-semibold theme-text underline hover:opacity-80 transition inline-flex items-center gap-1"
                >
                  Privacy Policy &amp; Data Deletion Instructions &rarr;
                </a>
              </div>
            </div>

            {/* 2. Habit Reminder Notifications & Standalone Widget */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider theme-muted flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-indigo-400" />
                Habit Reminders &amp; Quick Widget
              </span>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold theme-text">
                    Daily Habit Push Notifications
                  </h4>
                  <p className="text-xs theme-subtext">
                    Triggers a native alert &amp; chime at any habit&apos;s scheduled reminder time.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={requestNotificationAccess}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shrink-0 cursor-pointer ${
                    notifPermission === 'granted' ? 'bg-emerald-600' : 'bg-indigo-600'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  {notifPermission === 'granted'
                    ? 'Notifications Active (Test)'
                    : 'Enable Notifications'}
                </button>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold theme-text">
                    Standalone Habit Launcher Widget
                  </h4>
                  <p className="text-xs theme-subtext">
                    Open a compact widget window listing all habits for 1-tap timer launch.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsWidgetDrawerOpen(true)}
                    className="px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold theme-text cursor-pointer"
                  >
                    Open In-App Widget
                  </button>
                  <a
                    href="/widget"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold text-indigo-400"
                  >
                    <span>/widget URL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* 3. Appearance & Theme Selector */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider theme-muted flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-500" />
                Appearance &amp; Theme
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[
                  {
                    id: 'obsidian' as ThemeMode,
                    name: 'Obsidian Glass',
                    desc: 'Deep dark mode with indigo glow',
                    swatchBg: '#060609',
                    swatchAccent: '#6366f1',
                    locked: false,
                  },
                  {
                    id: 'sepia' as ThemeMode,
                    name: 'Sepia Studio',
                    desc: 'Warm parchment & espresso ink (Pro)',
                    swatchBg: '#f4ecd8',
                    swatchAccent: '#b45309',
                    locked: !userIsPro,
                  },
                  {
                    id: 'light' as ThemeMode,
                    name: 'Daylight Minimal',
                    desc: 'Crisp alabaster & high contrast (Pro)',
                    swatchBg: '#f8fafc',
                    swatchAccent: '#4f46e5',
                    locked: !userIsPro,
                  },
                ].map((t) => {
                  const active = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTheme(t.id)}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                        active
                          ? 'ring-2 ring-indigo-500 border-transparent glass-panel'
                          : 'glass-panel hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="w-9 h-9 rounded-xl border border-black/15 flex items-center justify-center shadow-inner"
                          style={{ backgroundColor: t.swatchBg }}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: t.swatchAccent }}
                          />
                        </div>
                        {active ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : t.locked ? (
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        ) : null}
                      </div>
                      <div>
                        <div className="text-sm font-bold theme-text flex items-center gap-1.5">
                          <span>{t.name}</span>
                          {t.locked && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold">
                              PRO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] theme-subtext">{t.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Sound & App Installation */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider theme-muted flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Audio &amp; App Controls
              </span>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => soundEngine.playMicroClearedChime(true)}
                    className="px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold theme-text cursor-pointer"
                  >
                    Test 2m Chime
                  </button>
                  <button
                    type="button"
                    onClick={toggleSound}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer ${
                      soundEnabled ? 'bg-emerald-600' : 'bg-zinc-600'
                    }`}
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5" /> Sound On
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" /> Muted
                      </>
                    )}
                  </button>
                </div>

                {installPromptEvent && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleInstallPWA}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-500 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Install Web App
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MATERIAL 3 FLUID DOCKED MOBILE NAVIGATION BAR             */}
      {/* ========================================================= */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border-subtle)] pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] transition-all duration-300"
        style={{
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const isLocked = item.id === 'ANALYTICS' && !userIsPro;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundEngine.playTactileClick(soundEnabled);
                  navigateToTab(item.id);
                }}
                className="group flex-1 flex flex-col items-center justify-center py-1 transition-transform active:scale-95 cursor-pointer select-none relative"
              >
                {/* Native 5-Icon Navigation Item (Audit #18) */}
                <div
                  className={`w-12 h-7 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
                    active ? 'scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: active ? 'var(--accent-glow)' : 'transparent',
                    color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-300 ${
                      active ? 'scale-110 stroke-[2.25]' : 'scale-100 stroke-[1.75]'
                    }`}
                    style={{
                      color: active ? 'var(--accent-primary)' : 'inherit',
                    }}
                  />
                  {isLocked && (
                    <Lock className="w-2.5 h-2.5 text-amber-400 absolute top-1 right-2.5" />
                  )}
                </div>

                {/* Active Indicator Glow Dot (Audit #18) */}
                <div
                  className={`w-1 h-1 rounded-full mt-0.5 transition-all duration-300 ${
                    active ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    boxShadow: '0 0 6px var(--accent-primary)',
                  }}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* ========================================================= */}
      {/* IN-APP COMPACT QUICK-LAUNCH WIDGET OVERLAY                */}
      {/* ========================================================= */}
      {isWidgetDrawerOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: '16px',
          }}
          onClick={() => setIsWidgetDrawerOpen(false)}
        >
          <div
            className="modal-surface rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl"
            style={{ backgroundColor: '#0d0e15', border: '1px solid rgba(255,255,255,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold theme-text">
                    Quick Habit Widget ({habits.length})
                  </h3>
                  <p className="text-[11px] theme-subtext">
                    Tap any habit to immediately launch its 2-minute micro-timer.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWidgetDrawerOpen(false)}
                className="theme-muted hover:opacity-80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {habits.map((h) => {
                const doneToday = h.lastCompletedDate === todayStr;
                return (
                  <div
                    key={h.id}
                    className="p-3 rounded-2xl glass-panel flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium theme-muted truncate">
                          {h.identityTitle}
                        </span>
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500">
                          <Flame className="w-3 h-3 fill-orange-500" />
                          {h.currentStreak}d
                        </span>
                        {doneToday && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold theme-text truncate mt-0.5">
                        {h.title}
                      </h4>
                      <p className="text-[11px] theme-subtext truncate">
                        2m: {h.gatewayVersion}
                      </p>
                    </div>

                    <button
                      onClick={() => startFocusSession(h)}
                      className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      style={{ background: 'var(--accent-primary)' }}
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Start
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
              <a
                href="/widget"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                Open Standalone /widget Window <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => {
                  setIsWidgetDrawerOpen(false);
                  openCenteredCreator('HABIT');
                }}
                className="font-bold theme-text hover:opacity-80 cursor-pointer"
              >
                + New Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CUSTOM CREATOR MODAL (SPACIOUS CENTERED MODAL)            */}
      {/* ========================================================= */}
      {isCreatorOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: '12px',
          }}
          onClick={() => setIsCreatorOpen(false)}
        >
          <div
            className="modal-card modal-surface"
            style={{
              backgroundColor: '#0d0e15',
              width: '100%',
              maxWidth: '580px',
              height: '94vh',
              maxHeight: '840px',
              minHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '28px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-5 sm:p-6 pb-3.5 sm:pb-4 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight theme-text">
                  {creatorTab === 'HABIT'
                    ? 'Create New Habit'
                    : 'Choose or Create an Identity'}
                </h3>
                <p className="text-xs sm:text-sm theme-subtext mt-0.5">
                  {creatorTab === 'HABIT'
                    ? 'Attach a simple habit and micro-start to an identity.'
                    : 'Pick a ready-made template or define your own.'}
                </p>
              </div>
              <button
                onClick={() => setIsCreatorOpen(false)}
                className="theme-muted hover:opacity-80 p-1.5 rounded-lg cursor-pointer"
                aria-label="Close Creator"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div
              className="modal-body-scroll p-4 sm:p-6 space-y-4"
              style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}
            >
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border border-[var(--border-subtle)] bg-black/20">
                <button
                  type="button"
                  onClick={() => setCreatorTab('HABIT')}
                  className={`py-3 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition ${
                    creatorTab === 'HABIT' ? 'glass-tab-active' : 'theme-subtext hover:text-white'
                  }`}
                >
                  + New Habit
                </button>
                <button
                  type="button"
                  onClick={() => setCreatorTab('IDENTITY')}
                  className={`py-3 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition ${
                    creatorTab === 'IDENTITY' ? 'glass-tab-active' : 'theme-subtext hover:text-white'
                  }`}
                >
                  + Identity Library
                </button>
              </div>

              {creatorTab === 'HABIT' ? (
                <form onSubmit={handleCreateHabitSubmit} className="space-y-4">
                  {/* 1. Selected Identity Card with Expandable Switcher */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold theme-subtext block">
                      Target Identity
                    </label>
                    <div className="p-3.5 rounded-2xl glass-panel border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 block">
                          {selectedCreatorIdentityObj.category}
                        </span>
                        <span className="text-sm font-bold theme-text truncate block">
                          {selectedCreatorIdentityObj.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsIdentityPickerOpen((o) => !o)}
                        className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold theme-text hover:bg-white/5 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <span>{isIdentityPickerOpen ? 'Done' : 'Change'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isIdentityPickerOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Expandable Identity Selector */}
                    {isIdentityPickerOpen && (
                      <div className="p-2.5 rounded-2xl glass-nav border border-[var(--border-strong)] space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider theme-muted block px-1">
                          Select from Active Identities or Templates:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                          {identities.map((i) => {
                            const selected = newHabitIdentityId === i.id;
                            return (
                              <button
                                key={i.id}
                                type="button"
                                onClick={() => {
                                  setNewHabitIdentityId(i.id);
                                  setIsIdentityPickerOpen(false);
                                }}
                                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                                  selected
                                    ? 'glass-tab-active border-transparent'
                                    : 'glass-panel hover:border-[var(--border-strong)]'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="text-[9px] font-mono uppercase text-indigo-400 font-bold block">
                                    Active Identity
                                  </span>
                                  <span className="text-xs font-bold block theme-text truncate">
                                    {i.title}
                                  </span>
                                </div>
                                {selected && <Check className="w-4 h-4 shrink-0 text-emerald-400" />}
                              </button>
                            );
                          })}

                          {IDENTITY_PRESETS.filter(
                            (preset) =>
                              !identities.some(
                                (existing) =>
                                  existing.title.toLowerCase() ===
                                  preset.title.toLowerCase()
                              )
                          ).map((preset) => {
                            const val = `preset:${preset.key}`;
                            const selected = newHabitIdentityId === val;
                            return (
                              <button
                                key={preset.key}
                                type="button"
                                onClick={() => {
                                  setNewHabitIdentityId(val);
                                  setIsIdentityPickerOpen(false);
                                }}
                                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                                  selected
                                    ? 'glass-tab-active border-transparent'
                                    : 'glass-panel hover:border-[var(--border-strong)]'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="text-[9px] font-mono text-amber-400 font-bold block truncate">
                                    ✨ {preset.category}
                                  </span>
                                  <span className="text-xs font-bold block theme-text truncate">
                                    {preset.title}
                                  </span>
                                </div>
                                {selected && <Check className="w-4 h-4 shrink-0 text-amber-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 1-Tap Habit Inspiration Accordion */}
                  {activeHabitExamples.length > 0 && (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setShowHabitSuggestions((o) => !o)}
                        className="text-xs font-medium text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer py-0.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{showHabitSuggestions ? 'Hide 1-tap habit examples' : '💡 Need inspiration? View 1-tap examples'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showHabitSuggestions ? 'rotate-180' : ''}`} />
                      </button>
                      {showHabitSuggestions && (
                        <div className="p-3 rounded-2xl glass-panel flex flex-col gap-1.5 border border-[var(--border-subtle)]">
                          {activeHabitExamples.map((ex, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setNewHabitTitle(ex.title);
                                setNewHabitMicro(ex.gatewayVersion);
                                setNewHabitStage(ex.stage);
                                setShowHabitSuggestions(false);
                              }}
                              className="text-left p-2.5 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition text-xs cursor-pointer"
                            >
                              <div className="font-semibold theme-text">{ex.title}</div>
                              <div className="text-[11px] theme-subtext truncate">
                                2m Start: {ex.gatewayVersion}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Core Habit Inputs (Action + 2-Min Micro-Start) */}
                  <div>
                    <label className="text-xs font-semibold theme-subtext block mb-1">
                      Habit Action
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Complete 25-Min Strength Workout"
                      value={newHabitTitle}
                      onChange={(e) => setNewHabitTitle(e.target.value)}
                      className="w-full theme-input rounded-xl p-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold theme-subtext block mb-1">
                      2-Minute Micro-Start Step
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Put on workout shoes and do 5 pushups"
                      value={newHabitMicro}
                      onChange={(e) => setNewHabitMicro(e.target.value)}
                      className="w-full theme-input rounded-xl p-3 text-sm"
                    />
                  </div>

                  {/* 3. Collapsible Dropdown for All Additional Options */}
                  <div className="border border-[var(--border-subtle)] rounded-2xl overflow-hidden glass-panel">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedHabitOptions((prev) => !prev)}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold theme-text hover:bg-white/5 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-400" />
                        <span>Additional Options (Skill Stage, Habit Chain & Reminders)</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          showAdvancedHabitOptions ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showAdvancedHabitOptions && (
                      <div className="p-4 pt-2 space-y-4 border-t border-[var(--border-subtle)]">
                        {/* Custom Segmented Stage Pill Selector */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold theme-subtext block">
                            Skill Stage
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'PASSIVE' as SkillStage, title: 'Absorb', sub: 'Study • 0.8x' },
                              { id: 'PRACTICE' as SkillStage, title: 'Drill', sub: 'Practice • 1.2x' },
                              { id: 'ACTIVE' as SkillStage, title: 'Build', sub: 'Create • 1.75x' },
                            ].map((st) => {
                              const active = newHabitStage === st.id;
                              return (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => setNewHabitStage(st.id)}
                                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                                    active
                                      ? 'glass-tab-active border-transparent'
                                      : 'glass-panel theme-subtext'
                                  }`}
                                >
                                  <div className="text-xs font-bold">{st.title}</div>
                                  <div className="text-[10px] opacity-80">{st.sub}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Glass Popover for "Chain After" */}
                        <div className="space-y-1.5 relative">
                          <label className="text-xs font-semibold theme-subtext block">
                            Chain Sequence (Habit Stacking)
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsChainPickerOpen((o) => !o)}
                            className="w-full p-2.5 rounded-xl glass-panel flex items-center justify-between text-xs font-semibold theme-text cursor-pointer"
                          >
                            <span className="truncate">
                              {selectedNewAnchorObj
                                ? `After: ${selectedNewAnchorObj.title}`
                                : '⚡ Standalone (Start of Chain)'}
                            </span>
                            <ChevronDown className="w-4 h-4 shrink-0" />
                          </button>

                          {isChainPickerOpen && (
                            <div className="p-2 rounded-2xl glass-nav space-y-1 max-h-40 overflow-y-auto border border-[var(--border-strong)]">
                              <button
                                type="button"
                                onClick={() => {
                                  setNewHabitAnchorId('NONE');
                                  setIsChainPickerOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
                                  newHabitAnchorId === 'NONE'
                                    ? 'glass-tab-active'
                                    : 'hover:bg-white/5 theme-text'
                                }`}
                              >
                                <span>⚡ Standalone (No preceding habit)</span>
                                {newHabitAnchorId === 'NONE' && <Check className="w-3.5 h-3.5" />}
                              </button>
                              {habits.map((h) => (
                                <button
                                  key={h.id}
                                  type="button"
                                  onClick={() => {
                                    setNewHabitAnchorId(h.id);
                                    setIsChainPickerOpen(false);
                                  }}
                                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                                    newHabitAnchorId === h.id
                                      ? 'glass-tab-active'
                                      : 'hover:bg-white/5 theme-text'
                                  }`}
                                >
                                  <span className="truncate">After: {h.title}</span>
                                  {newHabitAnchorId === h.id && <Check className="w-3.5 h-3.5" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Daily Reminder Preset Pills + Custom Time */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold theme-subtext flex items-center gap-1">
                              <Bell className="w-3.5 h-3.5 text-indigo-400" />
                              Daily Reminder Notification
                            </label>
                            <input
                              type="time"
                              value={newHabitReminder}
                              onChange={(e) => setNewHabitReminder(e.target.value)}
                              className="theme-input rounded-lg px-2 py-1 text-xs font-mono"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {REMINDER_PRESETS.map((p) => (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() => setNewHabitReminder(p.value)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                                  newHabitReminder === p.value
                                    ? 'glass-tab-active'
                                    : 'glass-panel theme-subtext'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Daily Target Focus Goal Selector (Audit #24) */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold theme-subtext flex items-center gap-1">
                              <Target className="w-3.5 h-3.5 text-indigo-400" />
                              Daily Target Goal (Minutes)
                            </label>
                            <span className="text-[11px] font-mono theme-muted">
                              {newHabitGoalMins > 0 ? `${newHabitGoalMins}m / day` : 'Flexible (Open-ended)'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: 'Flexible', val: 0 },
                              { label: '15m', val: 15 },
                              { label: '25m', val: 25 },
                              { label: '45m', val: 45 },
                              { label: '60m', val: 60 },
                            ].map((g) => (
                              <button
                                key={g.label}
                                type="button"
                                onClick={() => setNewHabitGoalMins(g.val)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                                  newHabitGoalMins === g.val
                                    ? 'glass-tab-active font-semibold'
                                    : 'glass-panel theme-subtext hover:opacity-80'
                                }`}
                              >
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl text-white font-bold text-sm sm:text-base cursor-pointer shadow-lg hover:opacity-95 transition"
                    style={{ background: 'var(--accent-primary)' }}
                  >
                    {isSubmitting ? 'Adding Habit...' : 'Save Habit to Top of Queue'}
                  </button>
                </form>
              ) : (
                <div className="space-y-5">
                  {/* 1. Popular Template Dropdown Selector (Matches Target Identity dropdown pattern) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-semibold theme-subtext">
                        Popular Identity Templates
                      </label>
                      <span className="text-[11px] font-mono text-amber-400 font-bold">
                        ⚡ Tap to auto-fill
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] sm:text-xs font-mono uppercase font-bold text-amber-400 block">
                          {selectedTemplateKey
                            ? IDENTITY_PRESETS.find((p) => p.key === selectedTemplateKey)?.category || '✨ Selected Template'
                            : '✨ Ready-Made Archetypes'}
                        </span>
                        <span className="text-sm sm:text-base font-bold theme-text truncate block mt-0.5">
                          {selectedTemplateKey
                            ? IDENTITY_PRESETS.find((p) => p.key === selectedTemplateKey)?.title
                            : 'Choose from 8+ popular templates or create custom'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTemplatePickerOpen((o) => !o)}
                        className="px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] text-xs sm:text-sm font-semibold theme-text hover:bg-white/5 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <span>{isTemplatePickerOpen ? 'Done' : 'Browse Templates'}</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isTemplatePickerOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Expandable Template Selector Dropdown */}
                    {isTemplatePickerOpen && (
                      <div className="p-3 rounded-2xl bg-[#12131c] border border-[var(--border-strong)] space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider theme-muted block">
                            Tap any template to auto-populate fields:
                          </span>
                          <span className="text-[10px] font-mono text-indigo-400 font-bold">
                            {IDENTITY_PRESETS.length} Templates
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                          {IDENTITY_PRESETS.map((preset) => {
                            const isSelected =
                              newIdTitle.toLowerCase() === preset.title.toLowerCase() ||
                              selectedTemplateKey === preset.key;
                            return (
                              <button
                                key={preset.key}
                                type="button"
                                onClick={() => {
                                  setNewIdTitle(preset.title);
                                  setNewIdMission(preset.lifesTaskStatement);
                                  setNewIdStage(preset.defaultPhase);
                                  setSelectedTemplateKey(preset.key);
                                  setIsTemplatePickerOpen(false);
                                }}
                                className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                                  isSelected
                                    ? 'glass-tab-active border-transparent'
                                    : 'bg-white/[0.04] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="text-[9px] font-mono text-amber-400 font-bold block truncate">
                                    ✨ {preset.category}
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold block theme-text truncate mt-0.5">
                                    {preset.title}
                                  </span>
                                  <p className="text-[11px] theme-subtext line-clamp-1 mt-0.5">
                                    {preset.lifesTaskStatement}
                                  </p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 shrink-0 text-amber-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Identity Input Form */}
                  <form
                    onSubmit={handleCreateIdentitySubmit}
                    className="space-y-4 pt-1 border-t border-[var(--border-subtle)]"
                  >
                    <div>
                      <label className="text-xs sm:text-sm font-semibold theme-subtext block mb-1.5">
                        Identity Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Lifelong Scholar & Systems Thinker"
                        value={newIdTitle}
                        onChange={(e) => {
                          setNewIdTitle(e.target.value);
                          if (selectedTemplateKey) setSelectedTemplateKey(null);
                        }}
                        className="w-full theme-input rounded-xl p-3.5 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-semibold theme-subtext block mb-1.5">
                        Core Objective / Life&apos;s Task
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="What specific capability or character are you forging?"
                        value={newIdMission}
                        onChange={(e) => setNewIdMission(e.target.value)}
                        className="w-full theme-input rounded-xl p-3.5 text-sm sm:text-base"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl text-white font-bold text-sm sm:text-base cursor-pointer shadow-lg hover:opacity-95 transition"
                      style={{ background: 'var(--accent-primary)' }}
                    >
                      {isSubmitting ? 'Creating Identity...' : 'Create Identity & Add Habits'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT HABIT MODAL (SPACIOUS CENTERED MODAL)                 */}
      {/* ========================================================= */}
      {editingHabit && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: '12px',
          }}
          onClick={() => setEditingHabit(null)}
        >
          <div
            className="modal-card modal-surface"
            style={{
              backgroundColor: '#0d0e15',
              width: '100%',
              maxWidth: '580px',
              height: '94vh',
              maxHeight: '840px',
              minHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '28px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-5 sm:p-6 pb-3.5 sm:pb-4 shrink-0">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight theme-text">Edit Habit</h3>
              <button
                onClick={() => setEditingHabit(null)}
                className="theme-muted hover:opacity-80 p-1.5 rounded-lg cursor-pointer"
                aria-label="Close Edit Habit"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div
              className="modal-body-scroll p-4 sm:p-6 space-y-4"
              style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}
            >

            <form onSubmit={handleUpdateHabitSubmit} className="space-y-4">
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

              {/* Custom Identity Pill Selector */}
              <div className="space-y-1.5">
                <label className="text-xs theme-subtext block">Identity</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                  {identities.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setEditHabitIdentityId(i.id)}
                      className={`p-2 rounded-xl text-xs font-semibold text-left truncate cursor-pointer ${
                        editHabitIdentityId === i.id
                          ? 'glass-tab-active'
                          : 'glass-panel theme-text'
                      }`}
                    >
                      {i.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Segmented Stage Selector */}
              <div className="space-y-1.5">
                <label className="text-xs theme-subtext block">Skill Stage</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PASSIVE', 'PRACTICE', 'ACTIVE'] as SkillStage[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditHabitStage(st)}
                      className={`py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        editHabitStage === st
                          ? 'glass-tab-active'
                          : 'glass-panel theme-subtext'
                      }`}
                    >
                      {st === 'PASSIVE' ? 'Absorb' : st === 'PRACTICE' ? 'Drill' : 'Build'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Chain Picker Popover */}
              <div className="space-y-1.5">
                <label className="text-xs theme-subtext block">Chain Sequence</label>
                <button
                  type="button"
                  onClick={() => setIsEditChainPickerOpen((o) => !o)}
                  className="w-full p-2.5 rounded-xl glass-panel flex items-center justify-between text-xs font-semibold theme-text cursor-pointer"
                >
                  <span className="truncate">
                    {selectedEditAnchorObj
                      ? `After: ${selectedEditAnchorObj.title}`
                      : '⚡ Standalone'}
                  </span>
                  <ChevronDown className="w-4 h-4 shrink-0" />
                </button>

                {isEditChainPickerOpen && (
                  <div className="p-2 rounded-2xl glass-nav space-y-1 max-h-36 overflow-y-auto border border-[var(--border-strong)]">
                    <button
                      type="button"
                      onClick={() => {
                        setEditHabitAnchorId('NONE');
                        setIsEditChainPickerOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs font-semibold cursor-pointer ${
                        editHabitAnchorId === 'NONE' ? 'glass-tab-active' : 'theme-text'
                      }`}
                    >
                      ⚡ Standalone
                    </button>
                    {habits
                      .filter((h) => h.id !== editingHabit.id)
                      .map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            setEditHabitAnchorId(h.id);
                            setIsEditChainPickerOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl text-xs truncate cursor-pointer ${
                            editHabitAnchorId === h.id ? 'glass-tab-active' : 'theme-text'
                          }`}
                        >
                          After: {h.title}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Daily Reminder Time */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-xs theme-subtext flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-indigo-400" />
                  Daily Reminder Time
                </label>
                <input
                  type="time"
                  value={editHabitReminder}
                  onChange={(e) => setEditHabitReminder(e.target.value)}
                  className="theme-input rounded-lg px-2.5 py-1 text-xs font-mono"
                />
              </div>

              {/* Daily Target Focus Goal Selector (Audit #24) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs theme-subtext flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    Daily Target Goal (Minutes)
                  </label>
                  <span className="text-[11px] font-mono theme-muted">
                    {editHabitGoalMins > 0 ? `${editHabitGoalMins}m / day` : 'Flexible (Open-ended)'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Flexible', val: 0 },
                    { label: '15m', val: 15 },
                    { label: '25m', val: 25 },
                    { label: '45m', val: 45 },
                    { label: '60m', val: 60 },
                  ].map((g) => (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => setEditHabitGoalMins(g.val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                        editHabitGoalMins === g.val
                          ? 'glass-tab-active font-semibold'
                          : 'glass-panel theme-subtext hover:opacity-80'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
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
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT IDENTITY MODAL                                       */}
      {/* ========================================================= */}
      {editingIdentity && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: '16px',
          }}
          onClick={() => setEditingIdentity(null)}
        >
          <div
            className="modal-surface rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            style={{ backgroundColor: '#0d0e15', border: '1px solid rgba(255,255,255,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
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
      {/* FOCUS TIMER & POMODORO EXTENSION MODAL                    */}
      {/* ========================================================= */}
      {activeHabit && (
        <FocusTimerModal
          activeHabit={activeHabit}
          microCleared={microCleared}
          pomoCyclesCompleted={pomoCyclesCompleted}
          isWakeLockActive={isWakeLockActive}
          timerMode={timerMode}
          pomoPhase={pomoPhase}
          userIsPro={userIsPro}
          secondsElapsed={secondsElapsed}
          pomoSecondsLeft={pomoSecondsLeft}
          sessionMins={sessionMins}
          isRunning={isRunning}
          showDebrief={showDebrief}
          isChallenge={isChallenge}
          difficulty={difficulty}
          liveScorePreview={liveScorePreview}
          bottleneckNote={bottleneckNote}
          insightNote={insightNote}
          isSubmitting={isSubmitting}
          formatClock={formatClock}
          onClose={() => {
            clearActiveSessionSnapshot();
            setIsRunning(false);
            setActiveHabit(null);
          }}
          onActivatePomodoroMode={(mode) => activatePomodoroMode(mode)}
          onOpenProModal={() => setShowProModal(true)}
          onToggleRunning={toggleTimerRunning}
          onFastForwardMicroStart={fastForwardMicroStart}
          onTransitionPomodoroPhase={transitionPomodoroPhase}
          onOpenDebrief={() => {
            const now = Date.now();
            if (sessionStartTimeRef.current) {
              accumulatedSecondsRef.current += Math.max(
                0,
                Math.floor((now - sessionStartTimeRef.current) / 1000)
              );
              sessionStartTimeRef.current = null;
            }
            setIsRunning(false);
            getAndroidBridge()?.stopFocusTimerService?.();
            saveActiveSessionSnapshot({ isRunning: false });
            setShowDebrief(true);
          }}
          onToggleChallenge={() => setIsChallenge((c) => !c)}
          onChangeDifficulty={(d) => setDifficulty(d)}
          onChangeBottleneck={(b) => setBottleneckNote(b)}
          onChangeInsight={(i) => setInsightNote(i)}
          onFinishSession={handleFinishSession}
        />
      )}

      {/* ========================================================= */}
      {/* FORGEOS PRO UNLOCK MODAL OVERLAY                          */}
      {/* ========================================================= */}
      {showProModal && (
        <div
          className="modal-overlay overflow-y-auto"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: '12px',
          }}
          onClick={() => setShowProModal(false)}
        >
          <div
            className="max-w-2xl w-full my-auto py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <ProUpgradeCard
              onClose={() => setShowProModal(false)}
              onBackToWorkspace={() => {
                setShowProModal(false);
                navigateToTab('WORKSPACE');
              }}
              onUnlocked={() => {
                setUserUnlockedPro(true);
                setShowProModal(false);
              }}
              currentUser={currentUser}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FEATURE WALKTHROUGH & ONBOARDING GUIDE OVERLAY            */}
      {/* ========================================================= */}
      <FeatureWalkthrough
        isOpen={showWalkthrough}
        onClose={() => {
          setShowWalkthrough(false);
          if (typeof window !== 'undefined') {
            localStorage.setItem('forge_walkthrough_seen', 'true');
          }
        }}
        onStartCreating={() => {
          setIsCreatorOpen(true);
        }}
      />

      {/* ========================================================= */}
      {/* THEME & ACCENT PALETTE SWITCHER MODAL                     */}
      {/* ========================================================= */}
      <ThemePaletteModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={theme}
        currentAccent={accent}
        isPro={userIsPro}
        onSelectTheme={(t) => selectTheme(t)}
        onSelectAccent={(a) => selectAccent(a)}
        onOpenProModal={() => {
          setIsThemeModalOpen(false);
          setShowProModal(true);
        }}
      />

      {/* ========================================================= */}
      {/* ERGONOMIC BOTTOM-RIGHT QUICK CREATE SPEED-DIAL (FAB)      */}
      {/* ========================================================= */}
      <QuickCreateFab
        onCreateHabit={() => openCenteredCreator('HABIT')}
        onCreateIdentity={() => openCenteredCreator('IDENTITY')}
        soundEnabled={soundEnabled}
        hidden={
          isRunning ||
          isCreatorOpen ||
          showProModal ||
          showWalkthrough ||
          isWidgetDrawerOpen ||
          isThemeModalOpen ||
          Boolean(chainTransitionData)
        }
      />

      {/* ========================================================= */}
      {/* POST-SESSION CHAIN CONTINUATION & PERFECT DAY CELEBRATION */}
      {/* ========================================================= */}
      {chainTransitionData && (
        <HabitChainTransitionModal
          isOpen={true}
          habit={chainTransitionData.habit}
          votesEarned={chainTransitionData.votesEarned}
          durationMinutes={chainTransitionData.durationMinutes}
          isPerfectDayNow={chainTransitionData.isPerfectDayNow}
          nextHabit={chainTransitionData.nextHabit}
          onContinueChain={(nextH) => {
            setChainTransitionData(null);
            startFocusSession(nextH);
          }}
          onClose={() => setChainTransitionData(null)}
        />
      )}
    </div>
  );
}
