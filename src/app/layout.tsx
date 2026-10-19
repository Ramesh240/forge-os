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
    <html lang="en" className="dark" style={{ backgroundColor: '#060609', colorScheme: 'dark' }}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: 'html,body{background-color:#060609!important;color:#f4f4f5;color-scheme:dark;}',
          }}
        />
      </head>
      <body
        style={{ backgroundColor: '#060609', margin: 0 }}
        className="min-h-screen bg-[#060609] text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white overscroll-none"
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
