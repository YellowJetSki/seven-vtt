import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUIStore } from "@/stores/uiStore";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
}

export default function DmDashboard() {
  const navigate = useNavigate();
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const enemies = useCampaignStore((s) => s.enemies);
  const encounters = useCampaignStore((s) => s.encounters);
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const journal = useCampaignStore((s) => s.journal);
  const showToast = useUIStore((s) => s.showToast);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const statCards: StatCard[] = [
    { label: "Player Characters", value: characters.length, icon: "👥", color: "accent" },
    { label: "Enemies", value: enemies.length, icon: "👹", color: "warrior" },
    { label: "Encounters", value: encounters.length, icon: "⚔", color: "mage" },
    { label: "Battle Maps", value: battleMaps.length, icon: "🗺", color: "rogue" },
    { label: "Journal Entries", value: journal.length, icon: "📖", color: "divine" },
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
          action={
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => showToast("Campaign wizard coming soon!", "info")}>
                New Campaign
              </Button>
              <Button variant="secondary" onClick={() => showToast("Import coming soon!", "info")}>
                Import Campaign
              </Button>
            </div>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Campaign Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">{meta.name}</h1>
          <p className="text-surface-400 mt-1">{meta.description}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/campaign/player-cards")}
          >
            👥 Player Cards
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/campaign/encounters")}
          >
            ⚔ Encounters
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/campaign/maps")}
          >
            🗺 Battle Maps
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/campaign/journal")}
          >
            📖 Journal
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="premium-card rounded-xl p-4"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-surface-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="premium-card rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          {journal.length === 0 ? (
            <p className="text-surface-500 text-sm">No journal entries yet. Start documenting your campaign!</p>
          ) : (
            <div className="space-y-3">
              {journal.slice(-5).reverse().map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/30">
                  <span className="text-lg">
                    {entry.type === "session" ? "📝" : entry.type === "lore" ? "📜" : entry.type === "quest" ? "⚡" : "📌"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{entry.title}</p>
                    <p className="text-xs text-surface-400">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/30 border border-surface-700/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rogue-500 animate-pulse-soft" />
            <span className="text-xs text-surface-400">System Online</span>
          </div>
          <div className="h-4 w-px bg-surface-700/50" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-soft" />
            <span className="text-xs text-surface-400">Local Storage Active</span>
          </div>
          <div className="h-4 w-px bg-surface-700/50" />
          <span className="text-xs text-surface-500">Physical Dice Only — No Digital RNG</span>
        </div>
      </div>
    </AppShell>
  );
}
