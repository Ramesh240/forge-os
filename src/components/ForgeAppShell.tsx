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
  seedSampleChainHistory,
  runMidnightGuardrailAudit,
  signInWithGoogleAction,
  signOutAction,
  deleteUserAccountAndData,
  redeemProAccessAction,
} from '@/app/actions';
import { useRouter } from 'next/navigation';
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
  Check,
  ExternalLink,
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
type TabType = 'WORKSPACE' | 'ANALYTICS' | 'HEATMAP' | 'VAULT' | 'ACCOUNT';

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
  identities,
  habits,
  sessions,
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
  const router = useRouter();
  const [userUnlockedPro, setUserUnlockedPro] = useState(false);
  const userIsPro = isPro || userUnlockedPro;

  // Pro Modal & Code Redemption State
  const [showProModal, setShowProModal] = useState(false);
  const [proCodeInput, setProCodeInput] = useState('');
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [proRedeemError, setProRedeemError] = useState<string | null>(null);
  const [proRedeemSuccess, setProRedeemSuccess] = useState<string | null>(null);

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

  // --- Pomodoro Extension State ---
  const [timerMode, setTimerMode] = useState<'FLOW' | 'POMO_25_5' | 'POMO_50_10'>('FLOW');
  const [pomoPhase, setPomoPhase] = useState<'WORK' | 'BREAK'>('WORK');
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState<number>(23 * 60);
  const [pomoCyclesCompleted, setPomoCyclesCompleted] = useState<number>(0);

  const handleRedeemCode = async (codeToRedeem?: string) => {
    const code = (codeToRedeem || proCodeInput).trim();
    if (!code) {
      setProRedeemError('Please enter a valid beta tester code.');
      return;
    }
    setIsRedeemingCode(true);
    setProRedeemError(null);
    setProRedeemSuccess(null);
    try {
      const res = await redeemProAccessAction(code);
      if (res.success) {
        setUserUnlockedPro(true);
        setProRedeemSuccess('🎉 ForgeOS Pro Unlocked! Free lifetime access granted.');
        soundEngine.playSessionCompleteFanfare(soundEnabled);
        setToastMessage('ForgeOS Pro Lifetime Pass Activated!');
        router.refresh();
      } else {
        setProRedeemError(res.error || 'Invalid tester code. Please try again.');
      }
    } catch {
      setProRedeemError('Failed to verify code. Please check your network connection.');
    } finally {
      setIsRedeemingCode(false);
    }
  };

  const renderProCard = (onClose?: () => void) => (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-nav border border-amber-500/30 shadow-2xl backdrop-blur-2xl space-y-6">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-amber-500/25 via-indigo-500/20 to-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ONE-TIME LIFETIME PASS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight theme-text">
            Unlock ForgeOS Pro
          </h2>
          <p className="text-xs sm:text-sm theme-subtext max-w-xl">
            Empower your deliberate practice with neuro-behavioral analytics, warm studio themes, and interval sprint engines.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">₹150</div>
            <div className="text-[10px] theme-muted font-mono">One-time purchase • Lifetime pass</div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl glass-panel theme-subtext hover:opacity-80 cursor-pointer shrink-0 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Feature Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl glass-panel space-y-1.5 border border-white/5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold theme-text">Analytics Hub</h4>
          <p className="text-xs theme-subtext">
            7-day focus velocity bar charts, 10,000-hour mastery milestones, and cognitive friction split.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1.5 border border-white/5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Palette className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold theme-text">Sepia &amp; Daylight Themes</h4>
          <p className="text-xs theme-subtext">
            Warm parchment &amp; espresso ink for late night flow, plus high-contrast daylight minimalism.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1.5 border border-white/5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
            <FastForward className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold theme-text">Pomodoro Extensions</h4>
          <p className="text-xs theme-subtext">
            25m/5m Classic Pomodoro &amp; 50m/10m Deep Sprint countdown engines with automatic audio chime transitions.
          </p>
        </div>
      </div>

      {/* Play Store Beta Tester Free Access & Redemption Box */}
      <div className="p-5 rounded-2xl glass-panel border border-indigo-500/30 bg-indigo-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Play Store Beta Tester Free Access
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            100% Free For Beta Testers
          </span>
        </div>

        <p className="text-xs theme-subtext">
          Have you installed ForgeOS via Google Play Beta testing? Redeem tester key <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono font-bold">FORGEBETA</code> below to unlock Pro access immediately.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRedeemCode();
          }}
          className="flex flex-col sm:flex-row gap-2 pt-1"
        >
          <input
            type="text"
            placeholder="Redeem Play Store Tester Code (FORGEBETA)"
            value={proCodeInput}
            onChange={(e) => setProCodeInput(e.target.value.toUpperCase())}
            className="flex-1 theme-input rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider"
          />
          <button
            type="submit"
            disabled={isRedeemingCode || !proCodeInput.trim()}
            className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shrink-0 cursor-pointer disabled:opacity-50 transition"
            style={{ background: 'var(--accent-primary)' }}
          >
            {isRedeemingCode ? 'Verifying Code...' : 'Unlock ForgeOS Pro'}
          </button>
        </form>

        {proRedeemSuccess && (
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{proRedeemSuccess}</span>
          </div>
        )}
        {proRedeemError && (
          <div className="text-xs text-rose-400 font-semibold flex items-center gap-1.5 pt-1">
            <X className="w-4 h-4" />
            <span>{proRedeemError}</span>
          </div>
        )}
      </div>
    </div>
  );

  // Switch from 2-Min Micro-Start / Open Flow into a Pomodoro preset
  const activatePomodoroMode = (mode: 'FLOW' | 'POMO_25_5' | 'POMO_50_10') => {
    soundEngine.playTactileClick(soundEnabled);
    if ((mode === 'POMO_25_5' || mode === 'POMO_50_10') && !userIsPro) {
      setShowProModal(true);
      return;
    }
    setTimerMode(mode);
    setPomoPhase('WORK');

    if (mode === 'POMO_25_5') {
      // Credit up to 2 minutes already spent in the micro-start!
      const credited = Math.min(120, secondsElapsed);
      setPomoSecondsLeft(25 * 60 - credited);
    } else if (mode === 'POMO_50_10') {
      const credited = Math.min(120, secondsElapsed);
      setPomoSecondsLeft(50 * 60 - credited);
    }
    setIsRunning(true);
  };

  // Skip current Work or Break phase (or transition when countdown hits 0)
  const transitionPomodoroPhase = useCallback(() => {
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
  }, [timerMode, pomoPhase, soundEnabled]);

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
  const [isChainPickerOpen, setIsChainPickerOpen] = useState(false);

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
  const [isEditChainPickerOpen, setIsEditChainPickerOpen] = useState(false);
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState(false);

  // Delete User Account Confirmation
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  const [inspectedDay, setInspectedDay] = useState<ContinuityDay | null>(null);

  const startFocusSession = useCallback((habit: SerializedHabit) => {
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
  }, [soundEnabled]);

  const MICRO_THRESHOLD = 120;
  const microCleared = secondsElapsed >= MICRO_THRESHOLD;
  const sessionMins = Math.max(2, Math.round(secondsElapsed / 60));
  const todayStr = new Date().toISOString().split('T')[0];

  // Initialize Theme, Sound, Notification Permission, and Deep-Link Auto-Start (?startHabit=<id>)
  useEffect(() => {
    const savedTheme = (localStorage.getItem('forge_theme') as ThemeMode) || theme;
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Check if launched from /widget or notification with ?startHabit=<id>
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const startHabitId = params.get('startHabit');
      if (startHabitId) {
        const target = habits.find((h) => h.id === startHabitId);
        if (target) {
          window.history.replaceState({}, '', '/');
          setTimeout(() => {
            startFocusSession(target);
          }, 0);
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
    };

    const interval = setInterval(checkReminders, 20000);
    return () => clearInterval(interval);
  }, [habits, soundEnabled, startFocusSession]);

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
    if ((nextTheme === 'sepia' || nextTheme === 'light') && !userIsPro) {
      soundEngine.playTactileClick(soundEnabled);
      setShowProModal(true);
      return;
    }
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && activeHabit) {
      timer = setInterval(() => {
        if (timerMode === 'FLOW') {
          setSecondsElapsed((s) => s + 1);
        } else {
          // In Pomodoro mode: only add to total focus seconds during WORK phase
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
  }, [isRunning, activeHabit, timerMode, pomoPhase, transitionPomodoroPhase]);

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
    setIsEditChainPickerOpen(false);
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
      setToastMessage('New habit added to the top of your queue!');
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

  const navItems = [
    { id: 'WORKSPACE', label: 'Home', icon: Zap },
    { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3 },
    { id: 'HEATMAP', label: 'Continuity', icon: Calendar },
    { id: 'VAULT', label: 'Insights', icon: BookOpen },
    { id: 'ACCOUNT', label: 'Account', icon: User },
  ] as const;

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
      {/* ULTRA-CLEAN FLOATING GLASS HEADER                         */}
      {/* ========================================================= */}
      <header className="sticky top-3 z-30 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto glass-nav rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Brand */}
          <button
            onClick={() => setActiveTab('WORKSPACE')}
            className="flex items-center gap-2.5 cursor-pointer"
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
                    if (isLocked) {
                      setShowProModal(true);
                    }
                    setActiveTab(item.id);
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

          {/* Right Status: Widget Launcher + Streak + Account Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEngine.playTactileClick(soundEnabled);
                setIsWidgetDrawerOpen(true);
              }}
              title="Open Quick Habit Widget"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-panel text-xs font-semibold theme-text hover:opacity-90 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Widget</span>
            </button>

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
        {/* TAB 1: MINIMALISTIC HOME WORKSPACE (HABITS ON TOP)        */}
        {/* ========================================================= */}
        {activeTab === 'WORKSPACE' && (
          <div className="space-y-8">
            {/* CENTERED HERO & PRIMARY ACTION DOCK */}
            <section className="text-center max-w-xl mx-auto space-y-5 pt-1">
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
                  className={`px-3.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                    selectedIdentityFilter === 'ALL'
                      ? 'glass-tab-active'
                      : 'glass-panel theme-subtext hover:opacity-80'
                  }`}
                >
                  All Habits ({habits.length})
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

            {/* DAILY HABIT QUEUE PLACED DIRECTLY ON TOP FOR IMMEDIATE ACTION */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider theme-muted">
                  Active Habit Queue ({visibleHabits.length}) — Newest First
                </span>
                <button
                  onClick={() => setIsWidgetDrawerOpen(true)}
                  className="text-xs font-semibold theme-subtext hover:opacity-80 flex items-center gap-1 cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                  Compact Widget View
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {visibleHabits.map((habit) => {
                  const stageMeta =
                    STAGE_LABELS[habit.defaultPhase as SkillStage] ||
                    STAGE_LABELS.PRACTICE;
                  const doneToday = habit.lastCompletedDate === todayStr;

                  return (
                    <div
                      key={habit.id}
                      className={`glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col justify-between gap-4 ${
                        habit.isReboundPriority ? 'ring-1 ring-amber-500/50' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg glass-panel theme-text">
                              {habit.identityTitle}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md glass-panel theme-muted">
                              {stageMeta.name.split(' ')[0]}
                            </span>
                            {habit.reminderTime && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md glass-panel text-indigo-400">
                                <Bell className="w-2.5 h-2.5" />
                                {habit.reminderTime}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {doneToday && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                                Done Today
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs font-bold text-orange-500">
                              <Flame className="w-3.5 h-3.5 fill-orange-500" />
                              {habit.currentStreak}d
                            </span>
                            <button
                              onClick={() => openEditHabitModal(habit)}
                              className="p-1.5 rounded-lg theme-muted hover:opacity-80 cursor-pointer"
                              title="Edit Habit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {habit.isReboundPriority && (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-500">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Streak Shield Active (+1.25x Bonus)
                          </div>
                        )}

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
            {renderProCard()}
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
              renderProCard()
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
                    <span className="text-xs font-mono px-3 py-2 rounded-xl glass-panel theme-muted">
                      Add AUTH_GOOGLE_ID in .env to enable
                    </span>
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

                <div className="flex items-center gap-2">
                  {installPromptEvent && (
                    <button
                      type="button"
                      onClick={handleInstallPWA}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Install App
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await seedSampleChainHistory();
                      setToastMessage('21 days of sample analytics loaded!');
                    }}
                    className="px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold theme-text cursor-pointer"
                  >
                    Load 21d Demo Data
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await runMidnightGuardrailAudit();
                      setToastMessage('Simulated next-day rollover!');
                    }}
                    className="px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold theme-text cursor-pointer"
                  >
                    Simulate Rollover
                  </button>
                </div>
              </div>
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
          const isLocked = item.id === 'ANALYTICS' && !userIsPro;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundEngine.playTactileClick(soundEnabled);
                if (isLocked) {
                  setShowProModal(true);
                }
                setActiveTab(item.id);
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                active ? 'glass-tab-active' : 'theme-subtext'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {isLocked && (
                  <Lock className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-2" />
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================= */}
      {/* IN-APP COMPACT QUICK-LAUNCH WIDGET OVERLAY                */}
      {/* ========================================================= */}
      {isWidgetDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="glass-nav rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
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
      {/* CUSTOM GLASS CREATOR MODAL (ZERO NATIVE <select> LISTS!)  */}
      {/* ========================================================= */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <div className="glass-nav rounded-3xl max-w-lg w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-base font-bold theme-text">
                  {creatorTab === 'HABIT'
                    ? 'Create New Habit'
                    : 'Choose or Create an Identity'}
                </h3>
                <p className="text-xs theme-subtext">
                  {creatorTab === 'HABIT'
                    ? 'Tap any identity card below—no ugly dropdowns.'
                    : 'Pick a ready-made template or define your own.'}
                </p>
              </div>
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
                + New Habit
              </button>
              <button
                type="button"
                onClick={() => setCreatorTab('IDENTITY')}
                className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                  creatorTab === 'IDENTITY' ? 'glass-tab-active' : 'theme-subtext'
                }`}
              >
                + Identity Library
              </button>
            </div>

            {creatorTab === 'HABIT' ? (
              <form onSubmit={handleCreateHabitSubmit} className="space-y-4">
                {/* 1. Custom Visual Identity Card Grid (Replaces native <select>) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold theme-subtext block">
                    1. Choose Identity (Tap a Card)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {identities.map((i) => {
                      const selected = newHabitIdentityId === i.id;
                      return (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => setNewHabitIdentityId(i.id)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                            selected
                              ? 'glass-tab-active border-transparent'
                              : 'glass-panel hover:border-[var(--border-strong)]'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono uppercase opacity-75 block">
                              Active Identity
                            </span>
                            <span className="text-xs font-bold block truncate">
                              {i.title}
                            </span>
                          </div>
                          {selected && <Check className="w-4 h-4 shrink-0" />}
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
                          onClick={() => setNewHabitIdentityId(val)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                            selected
                              ? 'glass-tab-active border-transparent'
                              : 'glass-panel hover:border-[var(--border-strong)]'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono text-amber-500 block truncate">
                              ✨ {preset.category}
                            </span>
                            <span className="text-xs font-bold block truncate">
                              {preset.title}
                            </span>
                          </div>
                          {selected && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. 1-Tap Habit Examples */}
                {activeHabitExamples.length > 0 && (
                  <div className="p-3 rounded-2xl glass-panel space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider theme-muted flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      1-Tap Habit Examples (Tap to Auto-Fill):
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {activeHabitExamples.map((ex, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewHabitTitle(ex.title);
                            setNewHabitMicro(ex.gatewayVersion);
                            setNewHabitStage(ex.stage);
                          }}
                          className="text-left p-2 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition text-xs cursor-pointer"
                        >
                          <div className="font-semibold theme-text">{ex.title}</div>
                          <div className="text-[11px] theme-subtext truncate">
                            2m Start: {ex.gatewayVersion}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Habit Title & 2-Min Micro-Start */}
                <div>
                  <label className="text-xs font-semibold theme-subtext block mb-1">
                    2. Full Habit Action
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Complete 25-Min Strength Workout"
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    className="w-full theme-input rounded-xl p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold theme-subtext block mb-1">
                    3. 2-Minute Micro-Start Step
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Put on workout shoes and do 5 pushups"
                    value={newHabitMicro}
                    onChange={(e) => setNewHabitMicro(e.target.value)}
                    className="w-full theme-input rounded-xl p-2.5 text-sm"
                  />
                </div>

                {/* 4. Custom Segmented Stage Pill Selector (Replaces native <select>) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold theme-subtext block">
                    4. Skill Stage
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

                {/* 5. Custom Glass Popover for "Chain After" (Replaces native <select>) */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-semibold theme-subtext block">
                    5. Chain Sequence (Optional)
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

                {/* 6. Daily Reminder Preset Pills + Custom Time */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold theme-subtext flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-indigo-400" />
                      Daily Reminder Notification (Optional)
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl text-white font-bold text-xs cursor-pointer shadow-sm"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  {isSubmitting ? 'Adding Habit...' : 'Save Habit to Top of Queue'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider theme-muted block">
                    Popular Identity Templates (Tap to Fill):
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {IDENTITY_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => {
                          setNewIdTitle(preset.title);
                          setNewIdMission(preset.lifesTaskStatement);
                          setNewIdStage(preset.defaultPhase);
                        }}
                        className="p-2.5 rounded-xl glass-panel text-left hover:border-[var(--border-strong)] transition cursor-pointer"
                      >
                        <span className="text-[10px] font-mono text-amber-500 block">
                          {preset.category}
                        </span>
                        <span className="text-xs font-bold theme-text block truncate">
                          {preset.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={handleCreateIdentitySubmit}
                  className="space-y-3.5 pt-2 border-t border-[var(--border-subtle)]"
                >
                  <div>
                    <label className="text-xs theme-subtext block mb-1">
                      Identity Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Select a template above or type your own..."
                      value={newIdTitle}
                      onChange={(e) => setNewIdTitle(e.target.value)}
                      className="w-full theme-input rounded-xl p-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs theme-subtext block mb-1">
                      Core Objective
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="What does this identity build or master?"
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
                    Create Identity &amp; Add Habits
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT HABIT MODAL (CUSTOM GLASS PICKERS — ZERO <select>!)  */}
      {/* ========================================================= */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <div className="glass-nav rounded-3xl max-w-md w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold theme-text">Edit Habit</h3>
              <button
                onClick={() => setEditingHabit(null)}
                className="theme-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md p-4 flex items-center justify-center">
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
      {/* FOCUS TIMER & POMODORO EXTENSION MODAL                    */}
      {/* ========================================================= */}
      {activeHabit && (
        <div className="fixed inset-0 z-50 theme-surface p-4 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="max-w-xl w-full mx-auto flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase theme-muted">
                  {activeHabit.identityTitle}
                </span>
                {pomoCyclesCompleted > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                    🍅 {pomoCyclesCompleted} {pomoCyclesCompleted === 1 ? 'Cycle' : 'Cycles'} Done
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold theme-text mt-0.5">
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
            <div className="max-w-xl w-full mx-auto my-auto space-y-5 py-6 text-center">
              {/* Pomodoro Extension Bar (Appears once 2-Min Micro-Start clears, or anytime) */}
              {microCleared && (
                <div className="p-1.5 rounded-2xl glass-nav inline-flex flex-wrap items-center justify-center gap-1.5">
                  {[
                    { id: 'FLOW', label: '∞ Open Flow', locked: false },
                    { id: 'POMO_25_5', label: '🍅 Pomodoro 25m / 5m', locked: !userIsPro },
                    { id: 'POMO_50_10', label: '⚡ Deep 50m / 10m', locked: !userIsPro },
                  ].map((m) => {
                    const active = timerMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (m.locked) {
                            setShowProModal(true);
                            return;
                          }
                          activatePomodoroMode(
                            m.id as 'FLOW' | 'POMO_25_5' | 'POMO_50_10'
                          );
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          active ? 'glass-tab-active' : 'theme-subtext hover:opacity-80'
                        }`}
                      >
                        <span>{m.label}</span>
                        {m.locked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Main Clock Card */}
              <div
                className={`glass-nav p-8 rounded-3xl space-y-5 transition-all ${
                  timerMode !== 'FLOW' && pomoPhase === 'BREAK'
                    ? 'ring-2 ring-emerald-500/50'
                    : ''
                }`}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full inline-block ${
                    timerMode !== 'FLOW' && pomoPhase === 'BREAK'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : microCleared
                      ? 'glass-panel theme-text'
                      : 'glass-panel text-indigo-400'
                  }`}
                >
                  {timerMode === 'FLOW'
                    ? microCleared
                      ? '✓ 2m Cleared — Open Flow Active (Pick Pomodoro Above)'
                      : 'Stage 1: 2-Minute Micro-Start'
                    : pomoPhase === 'WORK'
                    ? `🍅 Cycle #${pomoCyclesCompleted + 1} Focus Block`
                    : '☕ Rest & Recharge Break (Focus Paused)'}
                </span>

                {/* Clock Readout: Stopwatch in FLOW, Countdown in POMODORO */}
                <div className="text-6xl sm:text-7xl font-mono font-black theme-text">
                  {timerMode === 'FLOW'
                    ? formatClock(secondsElapsed)
                    : formatClock(pomoSecondsLeft)}
                </div>

                {timerMode !== 'FLOW' && (
                  <p className="text-xs font-mono theme-muted">
                    Total Net Focus Time Logged: {formatClock(secondsElapsed)} ({sessionMins}m)
                  </p>
                )}

                <div className="flex flex-wrap justify-center gap-2.5">
                  <button
                    onClick={() => setIsRunning((r) => !r)}
                    className="px-5 py-2.5 rounded-xl glass-panel theme-text text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isRunning ? 'Pause' : 'Resume'}
                  </button>

                  {/* Fast-Forward / Skip Phase Helpers */}
                  {!microCleared && timerMode === 'FLOW' && (
                    <button
                      type="button"
                      onClick={() => setSecondsElapsed((s) => s + 30)}
                      className="px-4 py-2.5 rounded-xl glass-panel theme-subtext text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <FastForward className="w-3.5 h-3.5" /> +30s
                    </button>
                  )}

                  {timerMode !== 'FLOW' && (
                    <button
                      type="button"
                      onClick={transitionPomodoroPhase}
                      className="px-4 py-2.5 rounded-xl glass-panel theme-subtext text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FastForward className="w-3.5 h-3.5 text-emerald-500" />
                      {pomoPhase === 'WORK' ? 'Start Break Now' : 'Skip Break → Next Cycle'}
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
                    Finish &amp; Bank (+{liveScorePreview} pts)
                  </button>
                </div>
              </div>

              {/* Challenge & Difficulty Controls */}
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
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold theme-text">Session Summary</h3>
                {pomoCyclesCompleted > 0 && (
                  <span className="text-xs font-bold text-emerald-500">
                    🍅 {pomoCyclesCompleted} Pomodoro Cycles
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Challenge or bottleneck tackled (Optional)"
                value={bottleneckNote}
                onChange={(e) => setBottleneckNote(e.target.value)}
                className="w-full theme-input rounded-xl p-3 text-sm"
              />
              <textarea
                rows={3}
                placeholder="Key insight or takeaway (Optional)"
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
                  Log Focus ({sessionMins}m)
                </button>
              </div>
            </div>
          )}
          <div />
        </div>
      )}

      {/* ========================================================= */}
      {/* FORGEOS PRO UNLOCK MODAL OVERLAY                          */}
      {/* ========================================================= */}
      {showProModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <div className="max-w-2xl w-full my-8">
            {renderProCard(() => setShowProModal(false))}
          </div>
        </div>
      )}
    </div>
  );
}
