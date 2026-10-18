// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ForgeOS: Identity & Habit Flow',
    short_name: 'ForgeOS',
    id: 'com.forgeos.mastery',
    description: 'Identity-driven habit chains, 2-minute micro-timers, and skill telemetry.',
    start_url: '/',
    display: 'standalone',
    background_color: '#060609',
    theme_color: '#060609',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
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
