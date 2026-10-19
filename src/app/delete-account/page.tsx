// src/app/delete-account/page.tsx
import Link from 'next/link';
import { ArrowLeft, Trash2, Mail, ShieldAlert, CheckCircle2, Clock, FileText } from 'lucide-react';

export const metadata = {
  title: 'Delete Account & Data | ForgeOS',
  description: 'Official account deletion and data removal request portal for ForgeOS, compliant with Google Play Store User Data Policies.',
};

export default function DeleteAccountPage() {
  const lastUpdated = 'October 19, 2026';

  return (
    <div className="min-h-screen theme-surface relative px-4 sm:px-6 py-10 text-zinc-100 antialiased">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute -top-40 left-1/4 w-[480px] h-[480px] rounded-full blur-[140px]"
          style={{ background: 'var(--orb-1, rgba(239, 68, 68, 0.12))' }}
        />
        <div
          className="absolute bottom-10 right-1/4 w-[440px] h-[440px] rounded-full blur-[140px]"
          style={{ background: 'var(--orb-2, rgba(99, 102, 241, 0.10))' }}
        />
      </div>

      <main className="relative z-10 max-w-3xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-panel text-xs font-semibold theme-text hover:opacity-80 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to ForgeOS
          </Link>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 text-xs font-mono theme-muted hover:text-white transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Privacy Policy</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-[11px] font-mono text-rose-400 border border-rose-500/20">
            <Trash2 className="w-3.5 h-3.5" /> Google Play Account Deletion Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight theme-text">
            ForgeOS — Account &amp; Data Deletion Request
          </h1>
          <p className="text-xs sm:text-sm theme-subtext">
            App: <strong>ForgeOS</strong> • Developer: <strong>ForgeOS</strong> • Effective: {lastUpdated}
          </p>
        </div>

        {/* Intro Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-3 border border-rose-500/30 bg-rose-950/10">
          <div className="flex items-center gap-3 text-rose-400 font-bold text-base">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Your Data, Your Control</span>
          </div>
          <p className="text-sm theme-subtext leading-relaxed">
            In accordance with Google Play&apos;s User Data policy and global privacy standards (GDPR, CCPA), you have the right to permanently delete your ForgeOS account and all associated personal and habit data at any time. You do <strong>not</strong> need to have the app installed on your phone to exercise this right.
          </p>
        </div>

        {/* How to Delete Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold theme-text flex items-center gap-2">
            <span>How to Request Account &amp; Data Deletion</span>
          </h2>

          {/* Option 1: In-App */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold theme-text">Option A: Instant In-App Deletion (Fastest)</h3>
            </div>
            <p className="text-xs sm:text-sm theme-subtext leading-relaxed pl-11">
              If you have the ForgeOS app open on Android or web:
            </p>
            <ol className="text-xs sm:text-sm theme-subtext space-y-2 pl-16 list-decimal leading-relaxed">
              <li>Open <strong>ForgeOS</strong>.</li>
              <li>Tap the <strong>Account</strong> tab in the navigation bar.</li>
              <li>Scroll to the <strong>Profile &amp; Cloud Sync</strong> section.</li>
              <li>Click the red <strong>&ldquo;Delete Account &amp; Data&rdquo;</strong> button.</li>
              <li>Confirm the irreversible deletion prompt.</li>
            </ol>
            <div className="pl-11 pt-2 flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Result: Instant and permanent purge from our database in &lt; 5 seconds.</span>
            </div>
          </div>

          {/* Option 2: Web / Email Request without app */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-bold theme-text">Option B: Web / Email Deletion (No App Required)</h3>
            </div>
            <p className="text-xs sm:text-sm theme-subtext leading-relaxed pl-11">
              If you uninstalled ForgeOS or cannot access your device, submit a direct web deletion request:
            </p>
            <div className="pl-11 space-y-3">
              <div className="p-4 rounded-2xl glass-panel space-y-2 text-xs sm:text-sm">
                <p className="theme-text font-medium">Send an email with the subject line:</p>
                <code className="block p-2.5 rounded-xl bg-black/40 text-rose-300 font-mono text-xs border border-white/5">
                  Subject: ForgeOS Account &amp; Data Deletion Request
                </code>
                <p className="theme-subtext pt-1">
                  <strong>To:</strong> <a href="mailto:privacy@forgeos.app" className="text-indigo-400 underline">privacy@forgeos.app</a>
                </p>
                <p className="theme-subtext">
                  <strong>Content:</strong> Please state your registered Google account email address associated with ForgeOS.
                </p>
              </div>

              <a
                href="mailto:privacy@forgeos.app?subject=ForgeOS%20Account%20%26%20Data%20Deletion%20Request&body=Please%20permanently%20delete%20my%20ForgeOS%20account%20and%20all%20associated%20data.%0A%0ARegistered%20Google%20Email%20Address%3A%20"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition shadow-sm cursor-pointer"
              >
                <Mail className="w-4 h-4" /> Send Deletion Email Now
              </a>
            </div>
          </div>
        </div>

        {/* What Data is Deleted vs Retained Table */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold theme-text">Data Types Deleted vs. Retained</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Data Category</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Retention Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                <tr>
                  <td className="py-3 px-3 font-medium theme-text">Google Profile &amp; Email Association</td>
                  <td className="py-3 px-3 text-rose-400 font-semibold">Permanently Deleted</td>
                  <td className="py-3 px-3 theme-subtext">Immediate (0 days)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium theme-text">Identity Vectors &amp; Lifelong Mastery Goals</td>
                  <td className="py-3 px-3 text-rose-400 font-semibold">Permanently Deleted</td>
                  <td className="py-3 px-3 theme-subtext">Immediate (0 days)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium theme-text">Habits, Stacks &amp; 2-Minute Gateways</td>
                  <td className="py-3 px-3 text-rose-400 font-semibold">Permanently Deleted</td>
                  <td className="py-3 px-3 theme-subtext">Immediate (0 days)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium theme-text">Focus Telemetry &amp; 10,000-Hour Sessions</td>
                  <td className="py-3 px-3 text-rose-400 font-semibold">Permanently Deleted</td>
                  <td className="py-3 px-3 theme-subtext">Immediate (0 days)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium theme-text">Local Theme &amp; Audio Preferences</td>
                  <td className="py-3 px-3 text-rose-400 font-semibold">Permanently Deleted</td>
                  <td className="py-3 px-3 theme-subtext">Immediate on app data clear</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium theme-text">Payment Order IDs (Only for Pro users)</td>
                  <td className="py-3 px-3 text-amber-400 font-semibold">Retained by Payment Gateway</td>
                  <td className="py-3 px-3 theme-subtext">Up to 180 days solely for statutory tax and financial accounting compliance via Razorpay. No card numbers or payment credentials are ever stored.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Retention Timeline Guarantee */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-base font-bold theme-text">Retention Period &amp; Deletion SLA</h2>
          <p className="text-xs sm:text-sm theme-subtext leading-relaxed">
            • <strong>In-App Deletion:</strong> Executed in real-time. All database records (Identity Vectors, Habit records, and Session Logs) cascadingly delete immediately.<br />
            • <strong>Email / Web Requests:</strong> Processed and permanently confirmed within <strong>48 hours</strong> of receipt.<br />
            • <strong>Backups:</strong> System backups purge soft-deleted records within 30 days automatically.
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-12 border-t border-white/10 text-xs theme-subtext">
          <p>© {new Date().getFullYear()} ForgeOS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white underline transition">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-white underline transition">
              ForgeOS App
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
