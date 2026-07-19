/**
 * STᚱ VTT — Campaign Settings (Sprint 10)
 *
 * Complete campaign configuration dashboard:
 * - Campaign Info: name, description, DM name
 * - Game Rules: XP/Milestone system, currency presets
 * - Character Creation: Race & class restrictions (multi-select chips)
 * - DM Private Notes: encrypted-style notes section
 * - Campaign Statistics: live counts, session tracking
 *
 * All changes write to Zustand campaignStore (metaSlice) instantly.
 * Future: Firestore sync layer for cross-DM restoration.
 */

import { useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import AppShell from "@/components/layout/AppShell";
import CampaignInfoForm from "@/components/campaign/CampaignInfoForm";
import XpSystemPicker from "@/components/campaign/XpSystemPicker";
import RaceClassRestrictions from "@/components/campaign/RaceClassRestrictions";
import DmNotesSection from "@/components/campaign/DmNotesSection";
import CampaignStatsDashboard from "@/components/campaign/CampaignStatsDashboard";
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
        {/* ── Header ── */}
        <div className="shrink-0 glass-gold rounded-2xl m-4 p-4 relative overflow-hidden">
          <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-br corner-gold corner-gold-glow" />
          <div className="depth-ring absolute inset-0 opacity-20" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
                Campaign Settings
              </h1>
              <p className="text-[11px] text-surface-500 mt-1">
                Configure your campaign rules, restrictions, and metadata
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-gold-500/10 border border-gold/15 text-gold-400">
              {meta ? "Active Campaign" : "No Campaign"}
            </span>
          </div>
        </div>

        {/* ── Settings Panels ── */}
        <div className="flex-1 mx-4 mb-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4 pb-8">
            {/* Campaign Info */}
            <CampaignInfoForm meta={meta} onSave={handleSaveMeta} />

            {/* Game Rules */}
            <XpSystemPicker settings={settings} onSave={handleSaveSettings} />

            {/* Character Creation */}
            <RaceClassRestrictions settings={settings} onSave={handleSaveSettings} />

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
