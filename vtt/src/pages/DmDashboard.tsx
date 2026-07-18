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
          <LoadingSpinner size="lg" label="Loading dashboard..." />
        </div>
      </AppShell>
    );
  }

  if (!meta) {
    return (
      <AppShell>
        <EmptyState
          icon="🏰"
          title="Welcome to the Arkla Campaign!"
          description="Start by creating your campaign or importing an existing one."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{meta.name}</h1>
          <p className="text-surface-400 mt-1">{meta.description}</p>
        </div>

        <QuickActions />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
          ))}
        </div>

        <RecentActivity entries={journal} />
        <StatusBar />
      </div>
    </AppShell>
  );
}
