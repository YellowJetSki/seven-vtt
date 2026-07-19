/**
 * STᚱ VTT — DM Dashboard (DM War Room)
 *
 * The DM's operational home screen — what they see when they log in.
 * 
 * Layout (Desktop):
 * ┌──────────────────────────────────────────────────┐
 * │                Campaign Banner                    │
 * ├────────────────────────────┬─────────────────────┤
 * │   Left Column (wider)     │  Right Column        │
 * │                           │                      │
 * │  ⚡ Quick Nav (6 tiles)   │  ⏱ Session Timer     │
 * │                           │                      │
 * │  🗺 Active Map Card       │  ⚔ Combat Status     │
 * │                           │                      │
 * │  👥 Player Status Grid    │                      │
 * └────────────────────────────┴─────────────────────┘
 *
 * Mechanical upgrades for live DM gameplay:
 * - SessionTimer: track elapsed time, set phase (explore/combat/rest)
 * - CombatQuickStatus: see active combat at a glance
 * - QuickNav: purpose-built DM navigation tiles with shortcuts
 * - ActiveMapCard: current map with token count
 * - PlayerStatusGrid: at-a-glance party HP monitor
 */

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useCampaignStore } from "@/stores/campaignStore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import CampaignBanner from "@/components/dashboard/CampaignBanner";
import QuickNav from "@/components/dashboard/QuickNav";
import SessionTimer from "@/components/dashboard/SessionTimer";
import CombatQuickStatus from "@/components/dashboard/CombatQuickStatus";
import ActiveMapCard from "@/components/dashboard/ActiveMapCard";
import PlayerStatusCard from "@/components/dashboard/PlayerStatusCard";

export default function DmDashboard() {
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

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
          />
        </div>
      </AppShell>
    );
  }

  const statCards = [
    { label: "Player Characters", value: characters.length, icon: "👥" },
    { label: "Active Maps", value: useCampaignStore.getState().battleMaps.length, icon: "🗺" },
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">
        {/* Campaign Banner — multi-layer hero */}
        <div className="animate-slide-in-up" style={{ animationDelay: '50ms' }}>
          <CampaignBanner meta={meta} stats={statCards} />
        </div>

        {/* Two-column DM War Room layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* ─── Left Column (2/3 width) ─── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Nav — purpose-built DM tiles */}
            <div className="animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <QuickNav />
            </div>

            {/* Active Map Card */}
            <div className="animate-slide-in-up" style={{ animationDelay: '150ms' }}>
              <ActiveMapCard />
            </div>

            {/* Player Status Grid */}
            {characters.length > 0 && (
              <div className="animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">👥</span>
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                        Party Status
                      </span>
                      <span className="text-[9px] text-surface-500 bg-[#0c0d15] border border-white/[0.04] px-1.5 py-0.5 rounded-full ml-1">
                        {characters.length}
                      </span>
                    </div>
                  </div>

                  {/* Player cards grid */}
                  <div className="p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {characters.map((char) => (
                        <PlayerStatusCard key={char.id} character={char} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Right Column (1/3 width) ─── */}
          <div className="space-y-4">
            {/* Session Timer */}
            <div className="animate-slide-in-up" style={{ animationDelay: '125ms' }}>
              <SessionTimer />
            </div>

            {/* Combat Quick Status */}
            <div className="animate-slide-in-up" style={{ animationDelay: '175ms' }}>
              <CombatQuickStatus />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
