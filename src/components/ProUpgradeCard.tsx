// src/components/ProUpgradeCard.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  BarChart3,
  Palette,
  FastForward,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  X,
  Lock,
} from 'lucide-react';
import { redeemProAccessAction } from '@/app/actions';

interface ProUpgradeCardProps {
  onClose?: () => void;
  onUnlocked?: () => void;
  currentUser?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as unknown as { Razorpay: unknown }).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function ProUpgradeCard({
  onClose,
  onUnlocked,
  currentUser = null,
}: ProUpgradeCardProps) {
  const router = useRouter();

  // Razorpay Checkout State
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Beta Tester Redemption State
  const [testerCode, setTesterCode] = useState('');
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);

  // Notification States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRazorpayPayment = async () => {
    setIsProcessingCheckout(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage(
          'Failed to load Razorpay checkout SDK. Please verify your internet connection.'
        );
        setIsProcessingCheckout(false);
        return;
      }

      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(
          data.error || 'Unable to create Razorpay checkout order. Please try again.'
        );
        setIsProcessingCheckout(false);
        return;
      }

      interface RazorpayVerifyResponse {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'ForgeOS',
        description: 'ForgeOS Pro — ₹150 One-Time Lifetime Pass',
        order_id: data.orderId,
        handler: async function (response: RazorpayVerifyResponse) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setSuccessMessage(
                '🎉 Payment verified! ForgeOS Pro lifetime pass unlocked.'
              );
              onUnlocked?.();
              router.refresh();
            } else {
              setErrorMessage(
                verifyData.error || 'Payment verification failed. Please contact support.'
              );
            }
          } catch {
            setErrorMessage(
              'Network error while verifying payment. If funds were debited, your pass will sync shortly.'
            );
          } finally {
            setIsProcessingCheckout(false);
          }
        },
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: () => {
            setIsProcessingCheckout(false);
          },
        },
      };

      const RazorpayConstructor = (
        window as unknown as {
          Razorpay: new (opts: typeof options) => { open: () => void };
        }
      ).Razorpay;

      const rzpInstance = new RazorpayConstructor(options);
      rzpInstance.open();
    } catch (err) {
      console.error('Razorpay checkout error:', err);
      setErrorMessage('Unexpected error opening payment checkout. Please try again.');
      setIsProcessingCheckout(false);
    }
  };

  const handleRedeemTesterCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = testerCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Please enter a valid beta tester key.');
      return;
    }

    setIsRedeemingCode(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await redeemProAccessAction(cleanCode);
      if (res.success) {
        setSuccessMessage('🎉 Tester key verified! ForgeOS Pro lifetime pass unlocked.');
        onUnlocked?.();
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Invalid tester code. Please try again.');
      }
    } catch {
      setErrorMessage('Failed to verify tester key. Please check your connection.');
    } finally {
      setIsRedeemingCode(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-nav border border-amber-500/30 shadow-2xl backdrop-blur-2xl space-y-6">
      {/* Ambient decorative glow */}
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
            Empower your deliberate practice with deep focus velocity analytics, warm studio themes, and interval sprint engines.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">₹150</div>
            <div className="text-[10px] theme-muted font-mono">One-time purchase • No subscription</div>
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

      {/* Feature Breakdown Grid */}
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
            Warm parchment &amp; espresso ink for night flow, plus crisp high-contrast daylight minimalism.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1.5 border border-white/5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
            <FastForward className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold theme-text">Pomodoro Extensions</h4>
          <p className="text-xs theme-subtext">
            25m/5m Classic Pomodoro &amp; 50m/10m Deep Sprint countdown engines with automatic audio chime cycles.
          </p>
        </div>
      </div>

      {/* Primary Action 1: Instant Razorpay UPI / Card Checkout */}
      <div className="p-5 rounded-2xl glass-panel border border-amber-500/30 bg-amber-950/15 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              Instant UPI / Card Checkout (₹150)
            </span>
            <p className="text-xs theme-subtext mt-0.5">
              Pay via Google Pay, PhonePe, Paytm, UPI, Cards, or NetBanking with Razorpay secure gateway.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRazorpayPayment}
            disabled={isProcessingCheckout}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-xs shrink-0 cursor-pointer shadow-lg hover:opacity-95 transition disabled:opacity-50"
            style={{ background: 'var(--accent-primary)' }}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>
              {isProcessingCheckout
                ? 'Connecting Gateway...'
                : 'Pay ₹150 & Unlock Pro'}
            </span>
          </button>
        </div>
      </div>

      {/* Primary Action 2: Play Store Beta Tester Free Access */}
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
          Registered Google Play testers get free lifetime access. Enter access code <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono font-bold">FORGEBETA</code> below to unlock.
        </p>

        <form onSubmit={handleRedeemTesterCode} className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            placeholder="Redeem Play Store Tester Code (FORGEBETA)"
            value={testerCode}
            onChange={(e) => setTesterCode(e.target.value.toUpperCase())}
            className="flex-1 theme-input rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider"
          />
          <button
            type="submit"
            disabled={isRedeemingCode || !testerCode.trim()}
            className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shrink-0 cursor-pointer disabled:opacity-50 transition"
            style={{ background: 'var(--accent-primary)' }}
          >
            {isRedeemingCode ? 'Verifying Code...' : 'Redeem Free Access'}
          </button>
        </form>
      </div>

      {/* Status Feedback Banners */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 font-semibold flex items-center gap-2">
          <X className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
