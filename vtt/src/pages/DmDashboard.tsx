/**
 * STᚱ VTT — DM Dashboard (Duolingo-Grade Premium Redesign)
 *
 * Campaign overview dashboard with:
 * - Multi-layer CampaignBanner with animated rune + stat clusters
 * - Spotify-style pill navigation chips
 * - Vertical timeline activity feed
 * - Compact system health bar
 * - Staggered entrance animations throughout
 */

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useCampaignStore } from "@/stores/campaignStore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import CampaignBanner from "@/components/dashboard/CampaignBanner";
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
              {/* Buttons handled by EmptyState */}
            </div>
          </EmptyState>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">
        {/* Campaign Banner — multi-layer hero */}
        <div className="animate-slide-in-up" style={{ animationDelay: '50ms' }}>
          <CampaignBanner meta={meta} stats={statCards} />
        </div>

        {/* Quick Actions — Spotify chips */}
        <div className="animate-slide-in-up" style={{ animationDelay: '150ms' }}>
          <QuickActions />
        </div>

        {/* Stats Grid — staggered data cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {statCards.map((stat, idx) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              index={idx}
            />
          ))}
        </div>

        {/* Two-column layout for content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Recent Activity — vertical timeline */}
          <div className="animate-slide-in-up" style={{ animationDelay: '300ms' }}>
            <RecentActivity entries={journal} />
          </div>

          {/* Status Bar */}
          <div className="animate-slide-in-up" style={{ animationDelay: '400ms' }}>
            <StatusBar />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
