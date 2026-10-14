// src/components/forge/Header.tsx
'use client';

import React from 'react';
import { Zap, Bell, BellRing, Layers, User as UserIcon } from 'lucide-react';
import { SerializedIdentity, UserProfile } from '../ForgeAppShell';

interface HeaderProps {
  identities: SerializedIdentity[];
  selectedIdentityFilter: string;
  onSelectIdentityFilter: (id: string) => void;
  notifPermission: string;
  onRequestNotifications: () => void;
  onToggleWidgetDrawer: () => void;
  onOpenAccount: () => void;
  currentUser?: UserProfile | null;
}

export function Header({
  identities,
  selectedIdentityFilter,
  onSelectIdentityFilter,
  notifPermission,
  onRequestNotifications,
  onToggleWidgetDrawer,
  onOpenAccount,
  currentUser,
}: HeaderProps) {
  const isNotifGranted = notifPermission === 'granted';

  return (
    <header className="fixed top-0 inset-x-0 z-40 pt-safe bg-[var(--forge-glass-nav)] backdrop-blur-2xl border-b border-[var(--forge-border)] shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top brand and quick controls row */}
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8083ff] to-[#6f00be] flex items-center justify-center text-white shadow-[0_0_16px_rgba(192,193,255,0.35)]">
              <Zap className="w-5 h-5 fill-current text-white animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-[var(--forge-text-primary)]">
                Forge<span className="text-[var(--forge-primary)]">OS</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[var(--forge-primary-tint)] border border-[rgba(192,193,255,0.25)] text-[10px] font-mono-forge font-bold text-[var(--forge-primary)] uppercase tracking-wider">
                v4.2
              </span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick HUD Drawer Toggle */}
            <button
              onClick={onToggleWidgetDrawer}
              title="Open 1-Tap Quick HUD"
              className="relative p-2 rounded-xl bg-[var(--forge-surface-high)]/70 hover:bg-[var(--forge-surface-highest)] text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] transition-all active:scale-95 border border-[var(--forge-border)]"
            >
              <Layers className="w-4 h-4 text-[var(--forge-tertiary)]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--forge-tertiary)] shadow-[0_0_8px_#4cd7f6]" />
            </button>

            {/* Notifications Button */}
            <button
              onClick={onRequestNotifications}
              title={isNotifGranted ? 'Notifications Active' : 'Enable Daily Habit Reminders'}
              className="relative p-2 rounded-xl bg-[var(--forge-surface-high)]/70 hover:bg-[var(--forge-surface-highest)] text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] transition-all active:scale-95 border border-[var(--forge-border)]"
            >
              {isNotifGranted ? (
                <BellRing className="w-4 h-4 text-[var(--forge-primary)]" />
              ) : (
                <Bell className="w-4 h-4 text-[var(--forge-text-muted)]" />
              )}
              {isNotifGranted && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--forge-primary)] shadow-[0_0_8px_#c0c1ff]" />
              )}
            </button>

            {/* User Avatar / Profile Button */}
            <button
              onClick={onOpenAccount}
              title="Account Settings & Themes"
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-[var(--forge-surface-high)]/70 hover:bg-[var(--forge-surface-highest)] border border-[var(--forge-border)] text-left transition-all active:scale-95"
            >
              {currentUser?.image ? (
                <img
                  src={currentUser.image}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-[var(--forge-primary)]/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[var(--forge-surface-highest)] flex items-center justify-center text-[var(--forge-primary)] ring-1 ring-[var(--forge-primary)]/30">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <span className="hidden md:inline-block text-xs font-semibold text-[var(--forge-text-secondary)] max-w-[90px] truncate">
                {currentUser?.name || 'Architect'}
              </span>
            </button>
          </div>
        </div>

        {/* Identity Filter Chips Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 pt-0.5">
          <button
            onClick={() => onSelectIdentityFilter('ALL')}
            className={`whitespace-nowrap px-3.5 py-1 rounded-full font-mono-forge text-[11px] font-semibold tracking-wider uppercase transition-all ${
              selectedIdentityFilter === 'ALL'
                ? 'bg-gradient-to-r from-[#8083ff] to-[#6f00be] text-white shadow-[0_0_14px_rgba(128,131,255,0.4)]'
                : 'bg-[var(--forge-surface-high)]/60 hover:bg-[var(--forge-surface-highest)] text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] border border-[var(--forge-border)]'
            }`}
          >
            ALL
          </button>
          {identities.map((idVec) => {
            const isActive = selectedIdentityFilter === idVec.id;
            return (
              <button
                key={idVec.id}
                onClick={() => onSelectIdentityFilter(idVec.id)}
                className={`whitespace-nowrap px-3.5 py-1 rounded-full font-mono-forge text-[11px] font-semibold tracking-wider transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#8083ff] to-[#6f00be] text-white shadow-[0_0_14px_rgba(128,131,255,0.4)]'
                    : 'bg-[var(--forge-surface-high)]/60 hover:bg-[var(--forge-surface-highest)] text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] border border-[var(--forge-border)]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-white' : 'bg-[var(--forge-primary)]'
                  }`}
                />
                <span>{idVec.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
