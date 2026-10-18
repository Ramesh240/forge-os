// src/app/checkout/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (resp: unknown) => void) => void;
    };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(15000); // 15000 paise = ₹150
  const [customerName, setCustomerName] = useState('ForgeOS User');
  const [customerEmail, setCustomerEmail] = useState('user@example.com');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const handlePayNow = async () => {
    setIsLoading(true);
    setPaymentSuccess(false);
    setPaymentError(null);
    addLog(`Initiating order creation for ₹${(selectedAmount / 100).toFixed(2)} (${selectedAmount} paise)...`);

    try {
      // 1. Ensure Razorpay SDK is loaded
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        throw new Error('Failed to load Razorpay checkout SDK script.');
      }
      addLog('✓ Razorpay checkout.js SDK loaded successfully.');

      // 2. Call backend /api/create-order
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedAmount,
          currency: 'INR',
          receipt: `rcpt_test_${Date.now().toString().slice(-6)}`,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to create Razorpay order.');
      }

      addLog(`✓ Order created: ID=${orderData.order_id || orderData.orderId}, Amount=${orderData.amount} ${orderData.currency}`);

      // 3. Configure Razorpay modal options
      const keyId =
        orderData.key_id ||
        orderData.keyId ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        'rzp_test_TpNUwvKA4Hg5rK';

      const options: RazorpayOptions = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ForgeOS',
        description: `ForgeOS Checkout — ₹${(orderData.amount / 100).toFixed(2)}`,
        order_id: orderData.order_id || orderData.orderId,
        handler: async function (response) {
          addLog(`✓ Payment captured: payment_id=${response.razorpay_payment_id}`);
          addLog('Verifying payment signature with HMAC-SHA256 at /api/verify-payment...');

          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              addLog('🎉 Signature verified! Transaction authentic and recorded in database.');
              setPaymentSuccess(true);
            } else {
              const errMsg = verifyData.error || 'Signature verification failed.';
              addLog(`❌ Verification error: ${errMsg}`);
              setPaymentError(errMsg);
            }
          } catch (vErr) {
            const msg = vErr instanceof Error ? vErr.message : 'Network error verifying signature';
            addLog(`❌ Verification network exception: ${msg}`);
            setPaymentError(msg);
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: () => {
            addLog('ℹ Checkout modal closed by customer.');
            setIsLoading(false);
          },
        },
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay window constructor not found.');
      }

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (resp: unknown) {
        const failure = resp as { error?: { description?: string; code?: string } };
        const desc = failure.error?.description || 'Payment was declined or failed.';
        addLog(`❌ Payment Failed: ${desc}`);
        setPaymentError(desc);
        setIsLoading(false);
      });

      addLog('Opening Razorpay Standard Checkout modal...');
      rzp.open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected payment error';
      addLog(`❌ Error: ${msg}`);
      setPaymentError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-surface relative px-4 sm:px-6 py-10 text-zinc-100 antialiased">
      {/* Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute -top-40 left-1/4 w-[480px] h-[480px] rounded-full blur-[140px]"
          style={{ background: 'var(--orb-1, rgba(99, 102, 241, 0.15))' }}
        />
        <div
          className="absolute bottom-10 right-1/4 w-[440px] h-[440px] rounded-full blur-[140px]"
          style={{ background: 'var(--orb-2, rgba(168, 85, 247, 0.12))' }}
        />
      </div>

      <main className="relative z-10 max-w-2xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-panel text-xs font-semibold theme-text hover:opacity-80 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to ForgeOS
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Razorpay Standard Checkout (Test Mode)</span>
          </div>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-indigo-500/30">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Standard Web Checkout
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold theme-text tracking-tight">
              Razorpay Checkout Portal
            </h1>
            <p className="text-xs sm:text-sm theme-subtext">
              Test end-to-end UPI, Card, NetBanking, and Wallet payments powered by Razorpay.
            </p>
          </div>

          {/* Amount Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider theme-muted">
              Select Amount
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '₹150.00', desc: 'ForgeOS Pro', paise: 15000 },
                { label: '₹1.00', desc: 'Min Test (100p)', paise: 100 },
                { label: '₹500.00', desc: 'Supporter Tier', paise: 50000 },
              ].map((tier) => {
                const active = selectedAmount === tier.paise;
                return (
                  <button
                    key={tier.paise}
                    type="button"
                    onClick={() => setSelectedAmount(tier.paise)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'border-indigo-500 bg-indigo-500/20 shadow-md shadow-indigo-500/20'
                        : 'border-[var(--border-subtle)] glass-panel hover:opacity-80'
                    }`}
                  >
                    <span className="text-base font-extrabold theme-text block">
                      {tier.label}
                    </span>
                    <span className="text-[11px] theme-subtext block">
                      {tier.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs theme-subtext">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-panel text-xs theme-text focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs theme-subtext">Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-panel text-xs theme-text focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Checkout Button */}
          <button
            type="button"
            onClick={handlePayNow}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay ₹{(selectedAmount / 100).toFixed(2)} with Razorpay
              </>
            )}
          </button>

          {/* Status Banners */}
          {paymentSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold">Payment Verified Successfully!</p>
                <p className="text-[11px] text-emerald-400/90">
                  HMAC-SHA256 signature verified against secret key. ForgeOS Pro unlocked.
                </p>
              </div>
            </div>
          )}

          {paymentError && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-bold">Payment Error</p>
                <p className="text-[11px] text-rose-400/90">{paymentError}</p>
              </div>
            </div>
          )}

          {/* Terminal / Live Flow Logs */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono theme-muted flex items-center gap-1.5">
              <span>Terminal &amp; Integration Log</span>
            </span>
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-400/90 max-h-48 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <span className="text-zinc-600">
                  Ready. Click &quot;Pay with Razorpay&quot; to test order creation and HMAC verification.
                </span>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
