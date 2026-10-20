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
  ArrowLeft,
} from 'lucide-react';

interface ProUpgradeCardProps {
  onClose?: () => void;
  onBackToWorkspace?: () => void;
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
  onBackToWorkspace,
  onUnlocked,
  currentUser = null,
}: ProUpgradeCardProps) {
  const router = useRouter();

  // Razorpay Checkout State
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

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

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 15000, currency: 'INR' }),
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
        key: data.key_id || data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'ForgeOS',
        description: 'ForgeOS Pro — ₹150 One-Time Lifetime Pass',
        order_id: data.order_id || data.orderId,
        handler: async function (response: RazorpayVerifyResponse) {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
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
          Razorpay: new (opts: typeof options) => {
            open: () => void;
            on: (event: string, handler: (resp: unknown) => void) => void;
          };
        }
      ).Razorpay;

      const rzpInstance = new RazorpayConstructor(options);

      rzpInstance.on('payment.failed', function (resp: unknown) {
        const failure = resp as { error?: { description?: string; reason?: string } };
        setErrorMessage(
          failure.error?.description || 'Payment was unsuccessful or declined. Please try another method.'
        );
        setIsProcessingCheckout(false);
      });

      rzpInstance.open();
    } catch (err) {
      console.error('Razorpay checkout error:', err);
      setErrorMessage('Unexpected error opening payment checkout. Please try again.');
      setIsProcessingCheckout(false);
    }
  };

  const handleBack = () => {
    if (onBackToWorkspace) {
      onBackToWorkspace();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-nav border border-amber-500/30 shadow-2xl backdrop-blur-2xl space-y-6">
      {/* Ambient decorative glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-amber-500/25 via-indigo-500/20 to-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Row on Mobile/Card */}
      {(onBackToWorkspace || onClose) && (
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-xs font-semibold theme-text hover:opacity-80 cursor-pointer transition active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workspace</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl glass-panel theme-subtext hover:opacity-80 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

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

        <div className="text-right shrink-0">
          <div className="text-2xl sm:text-3xl font-black text-amber-400">₹150</div>
          <div className="text-[10px] theme-muted font-mono">One-time purchase • No subscription</div>
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
          <h4 className="text-sm font-bold theme-text">Studio Themes</h4>
          <p className="text-xs theme-subtext">
            Gentle Sepia Reading Room and Crisp Daylight Studio aesthetics tailored for eye comfort.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1.5 border border-white/5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FastForward className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold theme-text">Sprint Presets</h4>
          <p className="text-xs theme-subtext">
            25/5 and 50/10 Pomodoro work-rest interval timers built directly into every focus session.
          </p>
        </div>
      </div>

      {/* Primary Action: Direct Payment */}
      <div className="p-5 sm:p-6 rounded-2xl glass-panel border border-amber-500/40 bg-amber-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold theme-text flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              Direct Checkout (Razorpay &amp; UPI)
            </h3>
            <p className="text-xs theme-subtext mt-0.5">
              Instant activation via Google Pay, PhonePe, Paytm, UPI, Cards, or NetBanking.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRazorpayPayment}
            disabled={isProcessingCheckout}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shrink-0 cursor-pointer shadow-lg hover:brightness-110 active:scale-98 transition disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000',
            }}
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

      {/* Secondary Quick Action: Back to Workspace */}
      <div className="flex items-center justify-between pt-1 text-xs theme-subtext">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Lifetime Account Access • Zero recurring charges</span>
        </div>
        {onBackToWorkspace && (
          <button
            type="button"
            onClick={onBackToWorkspace}
            className="hover:theme-text underline decoration-dotted cursor-pointer inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Return to Workspace
          </button>
        )}
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
