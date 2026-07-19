/**
 * STᚱ VTT — DM Dashboard (Premium Gold)
 *
 * Campaign overview dashboard with gold-accented stat cards,
 * quick actions, recent activity, and status bar.
 * Uses the premium gold/amber design system.
 */

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useCampaignStore } from "@/stores/campaignStore";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import StatusBar from "@/components/dashboard/StatusBar";

export default function DmDashboard() {
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const enemies = useCampaignStore((s) => s.enemies);
  const encounters = useCampaignStore((s) => s.encounters);
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const journal = useCampaignStore((s) => s.journal);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    { label: "Player Characters", value: characters.length, icon: "👥" },
    { label: "Enemies", value: enemies.length, icon: "👹" },
    { label: "Encounters", value: encounters.length, icon: "⚔" },
    { label: "Battle Maps", value: battleMaps.length, icon: "🗺" },
    { label: "Journal Entries", value: journal.length, icon: "📖" },
  ];

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" label="Awakening the campaign..." />
        </div>
      </AppShell>
    );
  }

  if (!meta) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            icon="🏰"
            title="Welcome to the Arkla Campaign"
            description="Forge your first campaign or awaken an ancient realm from slumber."
          >
            <div className="flex gap-3 mt-6">
              <Button variant="gold" size="lg">
                ✦ New Campaign
              </Button>
              <Button variant="secondary" size="lg">
                📜 Import Campaign
              </Button>
            </div>
          </EmptyState>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Campaign header — Gold fantasy banner */}
        <div className="glass-gold rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-br corner-gold corner-gold-glow" />
          <div className="depth-ring absolute inset-0 opacity-20" />
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
              {meta.name}
            </h1>
            <p className="text-surface-400 mt-1.5 text-sm sm:text-base leading-relaxed max-w-2xl">
              {meta.description}
            </p>
            <div className="rune-gold mt-4 w-full max-w-md">✦ ᚱ ✦</div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <QuickActions />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {statCards.map((stat, idx) => (
            <div
              key={stat.label}
              className="animate-slide-in-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <StatCard label={stat.label} value={stat.value} icon={stat.icon} />
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="animate-slide-in-up" style={{ animationDelay: "300ms" }}>
          <RecentActivity entries={journal} />
        </div>

        {/* Status Bar */}
        <div className="animate-slide-in-up" style={{ animationDelay: "400ms" }}>
          <StatusBar />
        </div>
      </div>
    </AppShell>
  );
}
