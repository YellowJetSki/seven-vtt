/**
 * STᚱ VTT — DM Dashboard v3.0 (Overrrides/Ventriloc-Grade Premium Command Center)
 *
 * The DM's operational command center — their first view on login.
 * Full at-a-glance campaign overview with:
 *
 * - DmCommandBar: Token-systematic floating glass bar with role + sync + combat
 * - CampaignBanner: 7-layer Lusion-grade hero with conic depth ring
 * - CampaignMetaSummary: Compact KPI strip in gold glass design language
 * - QuickNav: Overrrides-style spatial tile grid
 * - Spotify-grade ActiveMapCard with image preview
 * - Ventriloc data-dashboard CombatQuickStatus
 * - Premium chronograph SessionTimer
 * - PlayerStatusCard grid with staggered entrance
 * - Accordion-style DM Quick Reference with 12 sections
 *
 * All entrances sync to the design token timing system (ease.premium).
 */

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import CombatHpHud from "@/components/player/CombatHpHud";
import DmScreenContainer from "@/components/dashboard/DmScreenContainer";
import DmCommandBar from "@/components/dashboard/DmCommandBar";
import CampaignBanner from "@/components/dashboard/CampaignBanner";
import CampaignMetaSummary from "@/components/dashboard/CampaignMetaSummary";
import QuickNav from "@/components/dashboard/QuickNav";
import OverrridesSectionHeader from "@/components/dashboard/OverrridesSectionHeader";
import SessionTimer from "@/components/dashboard/SessionTimer";
import CombatQuickStatus from "@/components/dashboard/CombatQuickStatus";
import ActiveMapCard from "@/components/dashboard/ActiveMapCard";
import PlayerStatusCard from "@/components/dashboard/PlayerStatusCard";
import DmQuickRef from "@/components/dashboard/DmQuickRef";
import { entrance, duration, ease } from "@/lib/design-tokens";

export default function DmDashboard() {
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const enemies = useCampaignStore((s) => s.enemies);
  const encounters = useCampaignStore((s) => s.encounters);
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const journal = useCampaignStore((s) => s.journal);
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
          <EmptyState
            icon="🏰"
            title="Welcome to the Arkla Campaign"
            description="Forge your first campaign or awaken an ancient realm from slumber."
            action={
              <button
                onClick={() => window.location.href = "/campaign/settings"}
                className="mt-4 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-gold-500/12 to-amber-500/8 border border-gold-500/15 text-gold-400 hover:shadow-[0_0_24px_rgba(234,179,8,0.04)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Create Campaign
              </button>
            }
          />
        </DmScreenContainer>
      </AppShell>
    );
  }

  // ── Campaign-level computed metrics ──
  const totalXp = characters.reduce((sum, c) => sum + (c.experiencePoints ?? 0), 0);
  const avgLevel = characters.length > 0
    ? Math.round(characters.reduce((sum, c) => sum + (c.level ?? 1), 0) / characters.length)
    : 0;
  const maxLevel = characters.length > 0 ? Math.max(...characters.map((c) => c.level ?? 1)) : 0;

  const statCards = [
    { label: "Player Characters", value: characters.length, icon: "👥" },
    { label: "Total XP", value: totalXp, icon: "⭐" },
    { label: "Avg Level", value: avgLevel, icon: "📈" },
    { label: "Max Level", value: maxLevel, icon: "🎯" },
    { label: "Active Maps", value: battleMaps.length, icon: "🗺" },
  ];

  const isInCombat = activeEncounter?.phase === "active" || activeEncounter?.phase === "prep";

  return (
    <AppShell>
      <DmScreenContainer>
        {/* ═══════════════════════════════════════════════════════
           Tier 1: DM Command Bar (0ms)
           Token-systematic floating glass bar
           ═══════════════════════════════════════════════════════ */}
        <div style={entrance(0)}>
          <DmCommandBar />
        </div>

        {/* ═══════════════════════════════════════════════════════
           Tier 2: Campaign Banner (60ms)
           7-layer Lusion-grade hero with conic depth ring
           ═══════════════════════════════════════════════════════ */}
        <div style={entrance(60)}>
          <CampaignBanner meta={meta} stats={statCards} />
        </div>

        {/* ═══════════════════════════════════════════════════════
           Tier 3: Campaign Meta Summary (120ms)
           Compact KPI strip — campaign age, sessions, party size,
           monsters, encounters, maps, journal
           ═══════════════════════════════════════════════════════ */}
        <div className="mt-4" style={entrance(120)}>
          <CampaignMetaSummary
            meta={meta}
            characterCount={characters.length}
            enemyCount={enemies?.length ?? 0}
            encounterCount={encounters?.length ?? 0}
            mapCount={battleMaps.length}
            journalCount={journal?.length ?? 0}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
           Tier 4: Two-column DM War Room
           ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mt-5">

          {/* ─── Left Column (2/3) ─── */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">

            {/* Quick Nav (180ms) */}
            <div style={entrance(180)}>
              <QuickNav />
            </div>

            {/* Active Map Card (240ms) */}
            <div style={entrance(240)}>
              <ActiveMapCard />
            </div>

            {/* Player Status Grid (300ms) */}
            {characters.length > 0 && (
              <div style={entrance(300)}>
                <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
                  <OverrridesSectionHeader
                    icon="👥"
                    title="Party Status"
                    count={characters.length}
                    action={
                      isInCombat ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/20 text-red-400">
                          <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                          ACTIVE
                        </span>
                      ) : undefined
                    }
                  />

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

            {/* Session Timer (200ms) */}
            <div style={entrance(200)}>
              <SessionTimer />
            </div>

            {/* Combat Quick Status (260ms) */}
            <div style={entrance(260)}>
              <CombatQuickStatus />
            </div>

            {/* DM Quick Reference (320ms) */}
            <div style={entrance(320)}>
              <DmQuickRef />
            </div>
          </div>
        </div>
      </DmScreenContainer>

      {/* ── Combat HP HUD (floating, real-play tabletop tool) ── */}
      <CombatHpHud page="dashboard" />
    </AppShell>
  );
}
