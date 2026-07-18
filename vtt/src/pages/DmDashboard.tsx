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
              <Button variant="arcane" size="lg">
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Campaign header */}
        <div className="glass-crystal rounded-2xl p-6 relative overflow-hidden">
          <div className="corner-ornament corner-tl" />
          <div className="corner-ornament corner-tr" />
          <div className="corner-ornament corner-bl" />
          <div className="corner-ornament corner-br" />
          <h1 className="text-2xl font-black text-gradient-arcane">{meta.name}</h1>
          <p className="text-surface-400 mt-1 text-sm">{meta.description}</p>
          <div className="rune-divider mt-3">✦</div>
        </div>

        {/* Quick Action Bar */}
        <QuickActions />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
