/**
 * STᚱ VTT — DM Dashboard (Premium DM Screen Overhaul — Sprint 2)
 *
 * The DM's operational command center — what they see on login.
 * Transformed into a premium physical DM screen metaphor with:
 * - Staggered entrance animations across ALL elements
 * - Premium glass depth on every panel
 * - DM Quick Reference panel for at-a-glance 5e rules
 * - Shared CharacterHpGauge component for consistency
 * - Zero legacy color tokens
 *
 * Layout:
 * ┌───────────────────────────────────────────────────────────┐
 * │                   Campaign Banner                          │
 * ├─────────────────────────────┬─────────────────────────────┤
 * │  ⚡ Quick Nav (6 tiles)    │  ⏱ Session Timer             │
 * │                             │                              │
 * │  🗺 Active Map Card        │  ⚔ Combat Status             │
 * │                             │                              │
 * │  👥 Player Status Grid     │  📋 DM Quick Reference       │
 * └─────────────────────────────┴─────────────────────────────┘
 */

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import DmScreenContainer from "@/components/dashboard/DmScreenContainer";
import CampaignBanner from "@/components/dashboard/CampaignBanner";
import QuickNav from "@/components/dashboard/QuickNav";
import SessionTimer from "@/components/dashboard/SessionTimer";
import CombatQuickStatus from "@/components/dashboard/CombatQuickStatus";
import ActiveMapCard from "@/components/dashboard/ActiveMapCard";
import PlayerStatusCard from "@/components/dashboard/PlayerStatusCard";
import DmQuickRef from "@/components/dashboard/DmQuickRef";

export default function DmDashboard() {
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
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
        <DmScreenContainer>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EmptyState
              icon="🏰"
              title="Welcome to the Arkla Campaign"
              description="Forge your first campaign or awaken an ancient realm from slumber."
            />
          </div>
        </DmScreenContainer>
      </AppShell>
    );
  }

  const statCards = [
    { label: "Player Characters", value: characters.length, icon: "👥" },
    { label: "Active Maps", value: battleMaps.length, icon: "🗺" },
  ];

  const isInCombat = activeEncounter?.phase === "active" || activeEncounter?.phase === "prep";

  return (
    <AppShell>
      <DmScreenContainer>
        {/* ── Campaign Banner (staggered) ── */}
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
          <CampaignBanner meta={meta} stats={statCards} />
        </div>

        {/* ── Two-column DM War Room ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* ─── Left Column (2/3) ─── */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            {/* Quick Nav */}
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '80ms' }}>
              <QuickNav />
            </div>

            {/* Active Map Card */}
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '130ms' }}>
              <ActiveMapCard />
            </div>

            {/* Player Status Grid — always shown if characters exist */}
            {characters.length > 0 && (
              <div
                className="animate-in fade-in slide-in-from-bottom-3 duration-500"
                style={{ animationDelay: '180ms' }}
              >
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
                    {/* Combat indicator */}
                    {isInCombat && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/20 text-red-400 animate-pulse-soft">
                        ⚔ IN COMBAT
                      </span>
                    )}
                  </div>

                  {/* Player cards */}
                  <div className="p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {characters.map((char, idx) => (
                        <PlayerStatusCard key={char.id} character={char} index={idx} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Right Column (1/3) ─── */}
          <div className="space-y-4 sm:space-y-5">
            {/* Session Timer */}
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '110ms' }}>
              <SessionTimer />
            </div>

            {/* Combat Quick Status */}
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '160ms' }}>
              <CombatQuickStatus />
            </div>

            {/* DM Quick Reference — inline 5e rules */}
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '210ms' }}>
              <DmQuickRef />
            </div>
          </div>
        </div>
      </DmScreenContainer>
    </AppShell>
  );
}
