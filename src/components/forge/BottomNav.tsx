// src/components/forge/BottomNav.tsx
'use client';

import React from 'react';
import { Zap, BarChart3, Calendar, BookOpen, User } from 'lucide-react';

export type TabType = 'WORKSPACE' | 'ANALYTICS' | 'HEATMAP' | 'VAULT' | 'ACCOUNT';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const navItems = [
    { id: 'WORKSPACE' as const, label: 'Home', icon: Zap },
    { id: 'ANALYTICS' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'HEATMAP' as const, label: 'Continuity', icon: Calendar },
    { id: 'VAULT' as const, label: 'Insights', icon: BookOpen },
    { id: 'ACCOUNT' as const, label: 'Account', icon: User },
  ];

  return (
    <nav className="fixed bottom-3 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto bg-[var(--forge-glass-nav)] backdrop-blur-2xl border border-[var(--forge-border-mid)] rounded-2xl p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] flex items-center justify-between gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-[#8083ff] to-[#6f00be] text-white shadow-[0_0_16px_rgba(128,131,255,0.45)]'
                  : 'text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-surface-high)]/50'
              }`}
            >
              <Icon
                className={`w-4 h-4 mb-0.5 transition-transform ${
                  isActive ? 'scale-110 fill-current' : ''
                }`}
              />
              <span className="font-mono-forge text-[10px] font-semibold tracking-wider">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
