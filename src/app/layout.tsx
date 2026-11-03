// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#060609',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'ForgeOS — Identity & Skill Progression System',
  description: 'Identity-driven habit architecture, micro-start timers, and skill analytics.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ForgeOS',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="obsidian" data-accent="indigo" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('forge_theme') || 'obsidian';
                  var a = localStorage.getItem('forge_accent') || 'indigo';
                  var pal = {
                    indigo: ['#6366f1', 'rgba(99, 102, 241, 0.28)', '#818cf8', 'rgba(99, 102, 241, 0.14)'],
                    amber: ['#f59e0b', 'rgba(245, 158, 11, 0.28)', '#fbbf24', 'rgba(245, 158, 11, 0.14)'],
                    emerald: ['#10b981', 'rgba(16, 185, 129, 0.28)', '#34d399', 'rgba(16, 185, 129, 0.14)'],
                    rose: ['#f43f5e', 'rgba(244, 63, 94, 0.28)', '#fb7185', 'rgba(244, 63, 94, 0.14)']
                  }[a] || ['#6366f1', 'rgba(99, 102, 241, 0.28)', '#818cf8', 'rgba(99, 102, 241, 0.14)'];
                  document.documentElement.setAttribute('data-theme', t);
                  document.documentElement.setAttribute('data-accent', a);
                  document.documentElement.style.setProperty('--accent-primary', pal[0]);
                  document.documentElement.style.setProperty('--accent-glow', pal[1]);
                  document.documentElement.style.setProperty('--accent-text', pal[2]);
                  document.documentElement.style.setProperty('--orb-1', pal[3]);
                  if (t === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        style={{ margin: 0 }}
        className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased selection:bg-[var(--accent-primary)] selection:text-white overscroll-none"
      >
        {children}
        <script
            dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                // Register immediately (not on load) so the SW activates and
                // claims this page on the very first TWA cold-launch.
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  .then(reg => {
                    // Force the waiting SW to activate right away so
                    // the NEXT navigation is already served from cache.
                    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    reg.addEventListener('updatefound', () => {
                      const newSW = reg.installing;
                      if (newSW) newSW.addEventListener('statechange', () => {
                        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                          newSW.postMessage({ type: 'SKIP_WAITING' });
                        }
                      });
                    });
                  })
                  .catch(() => {});
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
