/**
 * STᚱ VTT — Unified Encounter Hub
 *
 * MERGES the old "Encounters" page and "NPC Library" page into a
 * single, efficient two-panel system:
 *
 *   ┌──────────────────────────┬────────────────────────────┐
 *   │      BESTIARY            │      ENCOUNTER COMPOSER    │
 *   │  (Browse/Search/Create   │  (Create/Manage/Launch     │
 *   │   Monsters + NPCs)       │   Encounters)              │
 *   │                          │                            │
 *   │  [Search monsters...]    │  Encounters  [+ New]       │
 *   │  [Monster cards grid]    │  [Encounter list]          │
 *   │  [Click to view stat]    │  [Selected: enemy groups   │
 *   │  [+ Add to Encounter]    │   + difficulty + launch]   │
 *   └──────────────────────────┴────────────────────────────┘
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

  // ── When bestiary adds a monster to an encounter, sync ──
  const handleAddToEncounter = useCallback(
    (enemyId: string) => {
      // If no encounters exist, switch to encounters tab to prompt creation
      if (encounters.length === 0) {
        setActiveTab("encounters");
        return;
      }
      // Otherwise, the EncounterComposer handles the add via its selected encounter
      // We'll just switch to the encounters tab to show the result
      setActiveTab("encounters");
    },
    [encounters.length]
  );

  return (
    <div className="flex h-full">
      {/* ── Two-Panel Container ── */}
      <div className="flex-1 flex flex-col">
        {/* ── Header ── */}
        <div className="shrink-0 glass-gold rounded-2xl m-4 mb-2 p-4 relative overflow-hidden">
          <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-br corner-gold corner-gold-glow" />
          <div className="depth-ring absolute inset-0 opacity-20" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
                Bestiary & Encounters
              </h1>
              <p className="text-[11px] text-surface-500 mt-1">
                Unified monster library and encounter builder — browse, create, and deploy in one place
              </p>
            </div>

            {/* Stats summary */}
            <div className="hidden sm:flex items-center gap-2 text-[9px] text-surface-500">
              <span className="text-gold-400/60">✦ Unified System</span>
              <span>·</span>
              <span>{encounters.length} encounters</span>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="shrink-0 mx-4 mb-3 flex items-center gap-1 border-b border-white/[0.04]">
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
            Encounters {encounters.length > 0 && <span className="text-[8px] text-surface-500 ml-1">({encounters.length})</span>}
          </button>
        </div>

        {/* ── Main Content Area ── */}
        <div className="flex-1 mx-4 mb-4 min-h-0">
          {activeTab === "bestiary" ? (
            <div className="h-full bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl p-4 overflow-hidden">
              <BestiaryPanel
                onAddToEncounter={handleAddToEncounter}
                encounterContextLabel={encounters.length > 0 ? encounters[0].name : undefined}
              />
            </div>
          ) : (
            <div className="h-full bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl p-4 overflow-hidden">
              <EncounterComposer />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
