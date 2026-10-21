// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#060609',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
                  document.documentElement.setAttribute('data-theme', t);
                  document.documentElement.setAttribute('data-accent', a);
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
