/**
 * STᚱ VTT — Campaign Settings (Premium 7-Layer Cinema Header)
 *
 * Complete campaign configuration dashboard:
 * - Campaign Info: name, description, DM name
 * - Game Rules: XP/Milestone system, currency presets
 * - Character Creation: Race & class restrictions (multi-select chips)
 * - DM Private Notes: encrypted-style notes section
 * - Campaign Statistics: live counts, session tracking
 *
 * All changes write to Zustand campaignStore (metaSlice) instantly.
 * Replaced glass-gold + corner-ornament + depth-ring with 7-layer cinema header.
 */

import { useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import AppShell from "@/components/layout/AppShell";
import CampaignInfoForm from "@/components/campaign/CampaignInfoForm";
import XpSystemPicker from "@/components/campaign/XpSystemPicker";
import RaceClassRestrictions from "@/components/campaign/RaceClassRestrictions";
import DmNotesSection from "@/components/campaign/DmNotesSection";
import CampaignStatsDashboard from "@/components/campaign/CampaignStatsDashboard";
import JoinCodePanel from "@/components/campaign/JoinCodePanel";
import type { CampaignMeta, CampaignSettings } from "@/types";

export default function CampaignSettings() {
  const meta = useCampaignStore((s) => s.meta);
  const updateMeta = useCampaignStore((s) => s.updateMeta);
  const updateMetaSettings = useCampaignStore((s) => s.updateMetaSettings);
  const incrementSessionCount = useCampaignStore((s) => s.incrementSessionCount);
  const characters = useCampaignStore((s) => s.characters);
  const enemies = useCampaignStore((s) => s.enemies);
  const encounters = useCampaignStore((s) => s.encounters);
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const journal = useCampaignStore((s) => s.journal);

  // Live stats derived from actual store data
  const liveStats = useMemo(() => ({
    characterCount: characters.length,
    enemyCount: enemies.length,
    encounterCount: encounters.length,
    mapCount: battleMaps.length,
    journalCount: journal.length,
  }), [characters.length, enemies.length, encounters.length, battleMaps.length, journal.length]);

  const settings: CampaignSettings = meta?.settings || {
    experienceSystem: "xp",
    currencyName: "Gold Pieces",
    privateDmNotes: "",
    allowedRaces: [],
    allowedClasses: [],
    currencyPreset: "standard",
    joinCode: "",
    joinCodeExpiresAt: undefined,
  };

  const handleSaveMeta = useCallback((updates: Partial<CampaignMeta>) => {
    updateMeta(updates);
  }, [updateMeta]);

  const handleSaveSettings = useCallback((settingsUpdates: Partial<CampaignSettings>) => {
    updateMetaSettings(settingsUpdates);
  }, [updateMetaSettings]);

  const handleIncrementSession = useCallback(() => {
    incrementSessionCount();
  }, [incrementSessionCount]);

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* ── 7-Layer Cinematic Hero Header ── */}
        <div className="relative rounded-2xl overflow-hidden group mx-4 mt-4">
          {/* Layer 1: Gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#181a2a]/90 via-[#12131e]/90 to-[#0c0d15]/95" />
          {/* Layer 2: Conic depth ring */}
          <div
            className="absolute inset-0 opacity-[0.04] bg-[conic-gradient(from_0deg,transparent_0%,rgba(234,179,8,0.4)_15%,transparent_30%,rgba(234,179,8,0.2)_50%,transparent_70%,rgba(234,179,8,0.15)_85%,transparent_100%)]"
            style={{ animation: "spin 30s linear infinite" }}
          />
          {/* Layer 3: Top edge light */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 group-hover:via-gold-500/40 to-transparent transition-all duration-700" />
          {/* Layer 4: Bottom edge light */}
          <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/15 to-transparent transition-all duration-700 pointer-events-none" />
          {/* Layer 5: Ambient glow pockets */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold-500/[0.06] rounded-full blur-[80px] pointer-events-none group-hover:bg-gold-500/[0.08] transition-all duration-700" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/[0.04] rounded-full blur-[60px] pointer-events-none" />
          {/* Layer 6: Border */}
          <div className="absolute inset-0 rounded-2xl border border-white/[0.06] pointer-events-none" />

          {/* Layer 7: Content */}
          <div className="relative z-10 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Icon container */}
              <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-amber-500/5" />
                <div className="absolute inset-0 rounded-xl border border-gold-500/20" />
                <div className="absolute inset-2 bg-gold-500/10 rounded-lg blur-[4px]" />
                <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]">
                  ⚙
                </span>
              </div>

              <div className="min-w-0 pt-1 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white/95 tracking-tight leading-tight">
                      Campaign Settings
                    </h1>
                    <p className="text-xs sm:text-sm text-surface-400 mt-1.5 leading-relaxed">
                      Configure your campaign rules, restrictions, and metadata
                    </p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-gold-400/60 bg-gold-500/10 border border-gold-500/15 px-2.5 py-1 rounded font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse-soft" />
                        {meta ? "Active Campaign" : "No Campaign"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Settings Panels ── */}
        <div className="flex-1 mx-4 mt-3 mb-4 overflow-y-auto scrollbar-gold">
          <div className="max-w-4xl mx-auto space-y-4 pb-8">
            {/* Campaign Info */}
            <CampaignInfoForm meta={meta} onSave={handleSaveMeta} />

            {/* Game Rules */}
            <XpSystemPicker settings={settings} onSave={handleSaveSettings} />

            {/* Character Creation */}
            <RaceClassRestrictions settings={settings} onSave={handleSaveSettings} />

            {/* Join Code */}
            <JoinCodePanel settings={settings} onSave={handleSaveSettings} />

            {/* DM Private Notes */}
            <DmNotesSection settings={settings} onSave={handleSaveSettings} />

            {/* Campaign Statistics */}
            <CampaignStatsDashboard
              meta={meta}
              liveStats={liveStats}
              onIncrementSession={handleIncrementSession}
            />

            {/* Footer */}
            <div className="text-center text-[9px] text-surface-700 pt-4 pb-8 space-y-1">
              <p>All settings are saved locally to your campaign data.</p>
              <p>Future: Firestore sync will enable cross-DM restoration.</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
