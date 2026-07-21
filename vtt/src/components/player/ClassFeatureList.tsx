/**
 * STᚱ VTT — ClassFeatureList
 *
 * Renders the character's class features as compact cards with
 * name and optional description.
 *
 * Extracted from PlayerSheetCombatTab.tsx monolith (Sprint 9 refactor).
 */

import type { PlayerCharacter } from "@/types";

interface ClassFeatureListProps {
  features: PlayerCharacter["features"];
}

export default function ClassFeatureList({ features }: ClassFeatureListProps) {
  if (!features || features.length === 0) return null;

  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-2 flex items-center gap-2">
        <span className="w-1 h-3 rounded-full bg-gold-500/40" />
        Features &amp; Actions
        <span className="text-[9px] font-normal text-surface-500">({features.length})</span>
      </h3>
      <div className="space-y-1">
        {features.map((feat, idx) => {
          const featName = typeof feat === "string" ? feat : feat.name;
          const featDesc = typeof feat !== "string" && (feat as { name: string; description?: string }).description
            ? (feat as { name: string; description?: string }).description
            : "";
          return (
            <div
              key={`feat-${featName}-${idx}`}
              className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-surface-200">{featName}</span>
              </div>
              {featDesc && (
                <p className="text-[10px] text-surface-500 mt-1 leading-relaxed">{featDesc}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
