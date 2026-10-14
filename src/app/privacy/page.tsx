// src/app/privacy/page.tsx
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Trash2, Mail, Lock, Database, UserCheck, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy & Data Deletion | ForgeOS',
  description: 'ForgeOS Privacy Policy, Google Play Store User Data Compliance, and Data Deletion Instructions.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 14, 2026';

  return (
    <div className="min-h-screen theme-surface relative px-4 sm:px-6 py-10 text-zinc-100 antialiased">
      {/* Background Ambient Glow */}
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
          <div className="flex items-center gap-2 text-xs font-mono theme-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Policy Version 2.0</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Google Play Store & OAuth 2.0 Compliant
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight theme-text">
            Privacy Policy &amp; Data Deletion Instructions
          </h1>
          <p className="text-xs sm:text-sm theme-subtext">
            Last Updated: {lastUpdated} • Effective Immediately
          </p>
        </div>

        {/* Section 1: Overview & Philosophy */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold theme-text">1. Overview &amp; Privacy Commitment</h2>
          </div>
          <p className="text-sm theme-subtext leading-relaxed">
            ForgeOS (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the app&rdquo;) is an open personal development and habit execution companion designed to help you build deliberate practice habits. We respect your privacy and believe your cognitive focus, habit data, and reflections are strictly your own property.
          </p>
          <p className="text-sm theme-subtext leading-relaxed">
            We do not sell, rent, monetize, or share your personal data with third-party data brokers, advertising platforms, or telemetry trackers.
          </p>
        </div>

        {/* Section 2: Data Collected & Why */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold theme-text">2. Data We Collect and How It Is Used</h2>
          </div>
          <div className="space-y-3 text-sm theme-subtext leading-relaxed">
            <p>
              When you use ForgeOS, we only collect data that is strictly necessary for providing the app&apos;s core habit tracking and cross-device sync features:
            </p>
            <ul className="space-y-2.5 list-disc list-inside pl-2">
              <li>
                <strong className="theme-text">Google Account Profile (Optional):</strong> When you sign in with Google OAuth, we receive your email address, display name, and avatar URL. This information is used solely to authenticate your session and scope your habit workspace so your data syncs securely between your phone and computer.
              </li>
              <li>
                <strong className="theme-text">Habit &amp; Focus Telemetry:</strong> Titles of the identities and habits you create, 2-minute micro-start descriptions, completed session durations (minutes), difficulty ratings, cognitive friction notes, and timestamps. This data is stored solely to calculate your consistency streaks, 10,000-hour mastery milestones, and visual chains.
              </li>
              <li>
                <strong className="theme-text">Device &amp; Local Preferences:</strong> Your selected visual theme (Obsidian, Sepia, or Daylight) and audio preferences (sound chime toggle) are stored locally on your device via <code>localStorage</code>.
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3: Data Deletion Policy (Google Play Store Mandate) */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-rose-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold theme-text">3. Data Deletion Instructions (Account Deletion)</h2>
              <span className="text-xs text-rose-400 font-mono">Google Play Store &amp; GDPR / CCPA Compliant</span>
            </div>
          </div>

          <p className="text-sm theme-subtext leading-relaxed">
            In compliance with Google Play Store policies and global privacy regulations, all users have the absolute right to request the permanent and irreversible deletion of their account and all associated data at any time.
          </p>

          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl glass-panel space-y-2">
              <h3 className="text-sm font-bold theme-text flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                Option A: Instant In-App Deletion (Recommended)
              </h3>
              <p className="text-xs theme-subtext leading-relaxed pl-8">
                You can delete your entire account and all associated data directly within ForgeOS in under 5 seconds:
              </p>
              <ol className="text-xs theme-subtext space-y-1 pl-12 list-decimal">
                <li>Open <strong>ForgeOS</strong> on your phone or browser.</li>
                <li>Tap the <strong>Account</strong> tab in the navigation bar.</li>
                <li>Under <strong>Profile &amp; Cloud Sync</strong>, click the <strong>&ldquo;Delete Account &amp; Data&rdquo;</strong> button.</li>
                <li>Confirm the 2-step prompt (&ldquo;Yes, Delete Forever&rdquo;).</li>
              </ol>
              <p className="text-xs text-emerald-400 pl-8 pt-1">
                ✓ This immediately and permanently purges all your Identity Vectors, Habit Chains, Focus Sessions, and Google profile links from our production database and signs you out.
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-panel space-y-2">
              <h3 className="text-sm font-bold theme-text flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">2</span>
                Option B: Data Deletion via Email Request
              </h3>
              <p className="text-xs theme-subtext leading-relaxed pl-8">
                If you cannot access the application, you can submit a manual deletion request by contacting us:
              </p>
              <div className="pl-8 pt-1 space-y-1 text-xs">
                <p className="theme-text font-mono">
                  Email: <a href="mailto:privacy@forgeos.app" className="underline text-indigo-400">privacy@forgeos.app</a> (or repository administrator)
                </p>
                <p className="theme-subtext">Subject: <code>ForgeOS Account &amp; Data Deletion Request</code></p>
                <p className="theme-subtext">Required details: Include the Google Account email associated with your ForgeOS workspace.</p>
                <p className="text-emerald-400 pt-1">
                  ✓ Manual requests are permanently processed within 48 hours of verification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Data Security & Storage */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold theme-text">4. Security &amp; Storage Architecture</h2>
          </div>
          <div className="space-y-2.5 text-sm theme-subtext leading-relaxed">
            <p>
              Your data is stored securely using industry-standard infrastructure:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Encryption in Transit:</strong> All communication between your device and our servers is strictly encrypted via HTTPS / TLS 1.3.</li>
              <li><strong>Database Protection:</strong> Data is hosted on Supabase PostgreSQL with encrypted storage volumes and connection pooling.</li>
              <li><strong>Authentication:</strong> Session management utilizes Auth.js with cryptographic JWT verification and HTTP-only cookies.</li>
            </ul>
          </div>
        </div>

        {/* Section 5: Contact Information */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-500/20 text-sky-400">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold theme-text">5. Contact &amp; Privacy Officer</h2>
          </div>
          <p className="text-sm theme-subtext leading-relaxed">
            If you have any questions, security vulnerability reports, or requests regarding this Privacy Policy or your personal data, please contact:
          </p>
          <div className="p-4 rounded-2xl glass-panel text-xs space-y-1 font-mono">
            <p className="theme-text font-bold">ForgeOS Security &amp; Privacy Operations</p>
            <p className="theme-subtext">Email: privacy@forgeos.app</p>
            <p className="theme-subtext">GitHub: https://github.com/Ramesh240/forge-os</p>
          </div>
        </div>

        {/* Back Link Footer */}
        <div className="text-center pt-4 pb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition cursor-pointer"
            style={{ background: 'var(--accent-primary, #6366f1)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Return to ForgeOS Workspace
          </Link>
        </div>
      </main>
    </div>
  );
}
