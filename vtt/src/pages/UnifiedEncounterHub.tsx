/**
 * STᚱ VTT — Unified Encounter Hub (Premium 7-Layer Header)
 *
 * MERGES the old "Encounters" page and "NPC Library" page into a
 * single, efficient two-panel system with premium Lusion-grade design.
 *
 * Features:
 *   - 7-layer cinematic hero header matching Player Cards/Battle Maps
 *   - Tabbed navigation: Bestiary (Monsters) / Encounters
 *   - Encounter count badge on tab
 *   - Premium glass backgrounds on both panels
 *   - Staggered entrance animations via delay classes
 *
 * This replaces both:
 *   - /campaign/enemies  → NPC Library (standalone)
 *   - /campaign/encounters → Encounters (standalone)
 *
 * The sidebar nav item "Encounters / NPC Library" is merged
 * into a single entry: "Bestiary & Encounters".
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import BestiaryPanel from "@/components/encounters/BestiaryPanel";
import EncounterComposer from "@/components/encounters/EncounterComposer";

export default function UnifiedEncounterHub() {
  const [activeTab, setActiveTab] = useState<"bestiary" | "encounters">("bestiary");
  const encounters = useCampaignStore((s) => s.encounters);

  const handleAddToEncounter = useCallback(
    (enemyId: string) => {
      if (encounters.length === 0) {
        setActiveTab("encounters");
        return;
      }
      setActiveTab("encounters");
    },
    [encounters.length]
  );

  return (
    <div className="flex flex-col" style={{ minHeight: "0", flex: 1 }}>
      {/* ── 7-Layer Cinematic Hero Header (matching Battle Maps) ── */}
      <div className="mx-4 mt-4 relative rounded-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#181a2a]/90 via-[#12131e]/90 to-[#0c0d15]/95" />
        <div
          className="absolute inset-0 opacity-[0.04] bg-[conic-gradient(from_0deg,transparent_0%,rgba(234,179,8,0.4)_15%,transparent_30%,rgba(234,179,8,0.2)_50%,transparent_70%,rgba(234,179,8,0.15)_85%,transparent_100%)]"
          style={{ animation: "spin 30s linear infinite" }}
        />
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 group-hover:via-gold-500/40 to-transparent transition-all duration-700" />
        <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/15 to-transparent transition-all duration-700 pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold-500/[0.06] rounded-full blur-[80px] pointer-events-none group-hover:bg-gold-500/[0.08] transition-all duration-700" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/[0.04] rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute inset-0 rounded-2xl border border-white/[0.06] pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-amber-500/5" />
              <div className="absolute inset-0 rounded-xl border border-gold-500/20" />
              <div className="absolute inset-2 bg-gold-500/10 rounded-lg blur-[4px]" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]">
                ⚔
              </span>
            </div>

            <div className="min-w-0 pt-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white/95 tracking-tight leading-tight">
                Bestiary & Encounters
              </h1>
              <p className="text-xs sm:text-sm text-surface-400 mt-1.5 leading-relaxed">
                Unified monster library and encounter builder — browse, create, and deploy in one place
              </p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-gold-400/60 bg-gold-500/10 border border-gold-500/15 px-2.5 py-1 rounded font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse-soft" />
                  Unified System
                </span>
                <span className="text-[9px] text-surface-500">
                  {encounters.length} encounter{encounters.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="shrink-0 mx-4 mb-3 mt-2 flex items-center gap-1 border-b border-white/[0.04]">
        <button
          onClick={() => setActiveTab("bestiary")}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "bestiary"
              ? "text-gold-400 border-gold-500"
              : "text-surface-500 border-transparent hover:text-surface-300 hover:border-surface-600/30"
          }`}
        >
          Bestiary (Monsters)
        </button>
        <button
          onClick={() => setActiveTab("encounters")}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "encounters"
              ? "text-gold-400 border-gold-500"
              : "text-surface-500 border-transparent hover:text-surface-300 hover:border-surface-600/30"
          }`}
        >
          Encounters
          {encounters.length > 0 && (
            <span className="ml-1.5 text-[8px] px-1.5 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/15 text-gold-400">
              {encounters.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 mx-4 mb-4" style={{ minHeight: "0" }}>
        {activeTab === "bestiary" ? (
          <div className="relative h-full bg-gradient-to-b from-[#141520]/90 to-[#0f1019]/95 border border-white/[0.04] rounded-xl overflow-hidden">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
            <div className="h-full p-4">
              <BestiaryPanel
                onAddToEncounter={handleAddToEncounter}
                encounterContextLabel={encounters.length > 0 ? encounters[0].name : undefined}
              />
            </div>
          </div>
        ) : (
          <div className="relative h-full bg-gradient-to-b from-[#141520]/90 to-[#0f1019]/95 border border-white/[0.04] rounded-xl overflow-hidden">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
            <div className="h-full p-4">
              <EncounterComposer />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
