// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ForgeOS: Identity & Habit Flow',
    short_name: 'ForgeOS',
    id: 'com.forgeos.mastery',
    description: 'Identity-driven habit chains, 2-minute micro-timers, and skill telemetry.',
    start_url: '/?source=twa',
    scope: '/',
    // display_override: Android TWA reads this list in order.
    // 'fullscreen' = true native-app experience (no status bar chrome).
    // 'standalone'  = PWA fallback if fullscreen is not supported.
    display: 'standalone',
    display_override: ['fullscreen', 'standalone', 'minimal-ui'],
    background_color: '#060609',
    theme_color: '#060609',
    orientation: 'portrait',
    // prefer_related_applications: hints to Chrome/Play that a signed TWA
    // relationship exists, which accelerates assetlinks.json trust caching
    // and suppresses the Add-to-Homescreen banner in browser mode.
    prefer_related_applications: true,
    related_applications: [
      {
        platform: 'play',
        url: 'https://play.google.com/store/apps/details?id=com.forgeos.mastery',
        id: 'com.forgeos.mastery',
      },
    ],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Quick Habit Widget',
        short_name: 'Habit Widget',
        description: 'View all habits in a compact list and start a 2-minute session immediately',
        url: '/widget',
      },
    ],
  };
}
