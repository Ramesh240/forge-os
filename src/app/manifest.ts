// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ForgeOS — Identity & Skill Progression',
    short_name: 'ForgeOS',
    description: 'Identity-driven habit chains, 2-minute micro-timers, and skill telemetry.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
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
