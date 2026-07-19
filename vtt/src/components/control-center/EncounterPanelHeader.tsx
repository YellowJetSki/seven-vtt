/**
 * STᚱ VTT — Encounter Panel Header (DM Combat Command)
 *
 * Gold-accented title bar with:
 * - Encounter count
 * - Create New Encounter button
 * - Party config popover (size + avg level for difficulty calc)
 */

import { useState, useCallback } from "react";
import type { PartyConfig } from "@/lib/mechanics/encounter-cr";
import { DEFAULT_PARTY_CONFIG } from "@/lib/mechanics/encounter-cr";

interface EncounterPanelHeaderProps {
  encounterCount: number;
  partyConfig: PartyConfig;
  onPartyConfigChange: (config: PartyConfig) => void;
  onCreateEncounter: () => void;
}

export default function EncounterPanelHeader({
  encounterCount,
  partyConfig,
  onPartyConfigChange,
  onCreateEncounter,
}: EncounterPanelHeaderProps) {
  const [showPartyConfig, setShowPartyConfig] = useState(false);

  return (
    <div className="shrink-0">
      {/* ── Header ── */}
      <div className="panel-header flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="panel-header-title">Encounters</span>
          <span className="text-[10px] text-gold-400 bg-gold-500/10 border border-gold/15 px-1.5 py-0.5 rounded-full">
            {encounterCount}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Party config toggle */}
          <button
            onClick={() => setShowPartyConfig(!showPartyConfig)}
            className={`text-[10px] px-1.5 py-0.5 rounded border transition-all duration-150 active:scale-95 ${
              showPartyConfig
                ? "bg-gold-500/10 border-gold/25 text-gold-400"
                : "border-white/[0.06] text-surface-500 hover:text-surface-300 hover:border-white/[0.1]"
            }`}
          >
            ⚔ {partyConfig.size}×Lv{partyConfig.level}
          </button>

          {/* Create button */}
          <button
            onClick={onCreateEncounter}
            className="text-[10px] px-1.5 py-0.5 rounded border border-gold/15 text-gold-400 bg-gold-500/10 hover:bg-gold-500/15 active:scale-95 transition-all duration-150"
          >
            + New
          </button>
        </div>
      </div>

      {/* ── Party Config Popover ── */}
      {showPartyConfig && (
        <div className="mx-2 mb-1.5 p-2 rounded-lg bg-obsidian-mid/90 border border-gold/15 shadow-xl backdrop-blur-sm">
          <p className="text-[9px] text-gold-400/60 mb-1.5 uppercase tracking-wider">
            Party Configuration
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[9px] text-surface-500 block mb-0.5">Size</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPartyConfigChange({ ...partyConfig, size: Math.max(1, partyConfig.size - 1) })}
                  className="w-6 h-6 flex items-center justify-center rounded text-[10px] bg-white/[0.04] border border-white/[0.06] text-surface-400 hover:text-white/80 active:scale-95 transition-all"
                >
                  −
                </button>
                <span className="w-8 text-center text-xs font-bold text-gold-300 font-mono">{partyConfig.size}</span>
                <button
                  onClick={() => onPartyConfigChange({ ...partyConfig, size: Math.min(10, partyConfig.size + 1) })}
                  className="w-6 h-6 flex items-center justify-center rounded text-[10px] bg-white/[0.04] border border-white/[0.06] text-surface-400 hover:text-white/80 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-surface-500 block mb-0.5">Avg Level</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPartyConfigChange({ ...partyConfig, level: Math.max(1, partyConfig.level - 1) })}
                  className="w-6 h-6 flex items-center justify-center rounded text-[10px] bg-white/[0.04] border border-white/[0.06] text-surface-400 hover:text-white/80 active:scale-95 transition-all"
                >
                  −
                </button>
                <span className="w-8 text-center text-xs font-bold text-gold-300 font-mono">{partyConfig.level}</span>
                <button
                  onClick={() => onPartyConfigChange({ ...partyConfig, level: Math.min(20, partyConfig.level + 1) })}
                  className="w-6 h-6 flex items-center justify-center rounded text-[10px] bg-white/[0.04] border border-white/[0.06] text-surface-400 hover:text-white/80 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <p className="text-[8px] text-surface-600 mt-1">
            Difficulty calculations scale with party size and level
          </p>
        </div>
      )}
    </div>
  );
}
