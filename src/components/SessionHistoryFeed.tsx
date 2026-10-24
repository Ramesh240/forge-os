'use client';

import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Filter,
  Flame,
  Swords,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileJson,
  BookOpen,
} from 'lucide-react';
import { SerializedSession, SerializedHabit } from './ForgeAppShell';
import { exportUserDataAction } from '@/app/actions';

interface SessionHistoryFeedProps {
  sessions: SerializedSession[];
  habits: SerializedHabit[];
  onToast?: (message: string) => void;
  className?: string;
}

export const SessionHistoryFeed: React.FC<SessionHistoryFeedProps> = ({
  sessions,
  habits,
  onToast,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'FLOW' | 'MICRO' | 'CHALLENGE'>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  // Filtered and sorted sessions (newest first)
  const filteredSessions = useMemo(() => {
    return sessions
      .slice()
      .reverse()
      .filter((s) => {
        // Filter by type
        if (filterType === 'MICRO' && !s.completedGatewayOnly) return false;
        if (filterType === 'FLOW' && s.completedGatewayOnly) return false;
        if (filterType === 'CHALLENGE' && !s.isResistancePractice) return false;

        // Filter by query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.habitTitle.toLowerCase().includes(q) ||
          s.identityTitle.toLowerCase().includes(q) ||
          (s.bottleneckAttacked && s.bottleneckAttacked.toLowerCase().includes(q)) ||
          (s.tacitInsight && s.tacitInsight.toLowerCase().includes(q))
        );
      });
  }, [sessions, filterType, searchQuery]);

  // Export as CSV
  const handleExportCSV = () => {
    try {
      if (sessions.length === 0) {
        onToast?.('No sessions available to export.');
        return;
      }

      const headers = [
        'Session ID',
        'Date & Time',
        'Identity',
        'Habit',
        'Stage',
        'Duration (Minutes)',
        'Gateway Only',
        'Challenge Practice',
        'Friction Rating (1-5)',
        'Bottleneck Note',
        'Tacit Insight',
        'Points Banked',
      ];

      const rows = sessions.map((s) => [
        `"${s.id}"`,
        `"${s.loggedAt}"`,
        `"${(s.identityTitle || '').replace(/"/g, '""')}"`,
        `"${(s.habitTitle || '').replace(/"/g, '""')}"`,
        `"${s.phase}"`,
        s.durationMinutes,
        s.completedGatewayOnly ? 'Yes' : 'No',
        s.isResistancePractice ? 'Yes' : 'No',
        s.frictionRating,
        `"${(s.bottleneckAttacked || '').replace(/"/g, '""')}"`,
        `"${(s.tacitInsight || '').replace(/"/g, '""')}"`,
        s.votesEarned,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `forgeos-sessions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onToast?.('Exported sessions CSV successfully.');
    } catch (err) {
      console.error('CSV export error:', err);
      onToast?.('Failed to export CSV.');
    }
  };

  // Export full JSON workspace backup
  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const data = await exportUserDataAction();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `forgeos-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onToast?.('Exported full workspace JSON backup.');
    } catch (err) {
      console.error('JSON export error:', err);
      onToast?.('Failed to export JSON backup.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Top Header with Data Portability Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Activity History &amp; Vault</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {sessions.length} total sessions logged • Search past takeaways and export your data
          </p>
        </div>

        {/* Data Export Action Buttons (Audit #26) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            title="Download complete session logs as CSV"
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            disabled={isExporting}
            title="Download full workspace backup as JSON"
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <FileJson className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isExporting ? 'Exporting...' : 'Export JSON'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by habit, identity, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'FLOW', label: 'Deep Flow' },
            { id: 'MICRO', label: '2m Gateway' },
            { id: 'CHALLENGE', label: '⚔️ Challenge' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id as typeof filterType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List (Audit #25) */}
      {filteredSessions.length === 0 ? (
        <div className="p-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center space-y-2">
          <Clock className="w-8 h-8 text-zinc-600 mx-auto stroke-1" />
          <h4 className="text-sm font-bold text-zinc-300">No matching sessions found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `No sessions matched "${searchQuery}". Try clearing search filters.`
              : 'Complete your first focus session to build your activity history.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const dateObj = new Date(session.loggedAt);
            const dateStr = dateObj.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });
            const timeStr = dateObj.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={session.id}
                className="p-4 rounded-2xl border border-white/[0.06] bg-[#0d0e15] hover:border-white/[0.12] transition-all duration-150 space-y-2.5 shadow-sm"
              >
                {/* Session Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-300 border border-white/[0.06]">
                      {session.identityTitle}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        session.phase === 'ACTIVE'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : session.phase === 'PRACTICE'
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {session.phase === 'ACTIVE'
                        ? 'Build'
                        : session.phase === 'PRACTICE'
                        ? 'Drill'
                        : 'Absorb'}
                    </span>
                    {session.isResistancePractice && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-0.5">
                        <Swords className="w-3 h-3" /> 1.5x
                      </span>
                    )}
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-white">
                      {session.durationMinutes}m
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      +{session.votesEarned} pts
                    </span>
                  </div>
                </div>

                {/* Habit Title */}
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-sm font-bold text-zinc-100">
                    {session.habitTitle}
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                    {dateStr} • {timeStr}
                  </span>
                </div>

                {/* Notes (Bottleneck & Tacit Insights) */}
                {(session.bottleneckAttacked || session.tacitInsight) && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1 text-xs">
                    {session.bottleneckAttacked && (
                      <p className="text-zinc-300">
                        <strong className="text-rose-400 font-semibold">Tackled: </strong>
                        {session.bottleneckAttacked}
                      </p>
                    )}
                    {session.tacitInsight && (
                      <p className="text-zinc-300">
                        <strong className="text-amber-400 font-semibold">Insight: </strong>
                        {session.tacitInsight}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
