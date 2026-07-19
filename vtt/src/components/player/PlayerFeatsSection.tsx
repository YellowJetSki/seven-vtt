/**
 * STᚱ VTT — Player Feats Section
 *
 * Dedicated tab section showing all feats available to the character.
 * Each feat has a toggle to mark it active/inactive for the Combat Tab.
 *
 * Features:
 * - Lists all feats from the compendium catalog
 * - Search and filter across feat names and descriptions
 * - Toggle active/inactive state per feat
 * - Shows feat effect description on expand
 * - Persists to character state → Zustand + Firestore
 */

import { useState, useMemo, useCallback } from "react";
import type { PlayerCharacter } from "@/types";
import type { ActiveFeatRef } from "@/types/character";
import type { HomebrewFeat } from "@/types/homebrew";
import { useCompendiumStore } from "@/stores/compendium/compendiumStore";
import { useCampaignStore } from "@/stores/campaignStore";

interface PlayerFeatsSectionProps {
  character: PlayerCharacter;
}

export default function PlayerFeatsSection({ character }: PlayerFeatsSectionProps) {
  const allFeats = useCompendiumStore((s) => s.feats);
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFeat, setExpandedFeat] = useState<string | null>(null);

  // ── Active feats from character state ──
  const activeFeats = character.activeFeats || [];

  // ── Build known feat set ──
  // For now, show all SRD/homebrew feats the character can take
  const knownFeats: Array<{ feat: HomebrewFeat; ref: ActiveFeatRef | undefined }> = useMemo(() => {
    return allFeats.map((feat) => {
      const ref = activeFeats.find((a) => a.featId === feat.id || a.featName === feat.name);
      return {
        feat,
        ref: ref || { featId: feat.id, featName: feat.name, isActive: false },
      };
    });
  }, [allFeats, activeFeats]);

  // ── Filter by search ──
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return knownFeats;
    return knownFeats.filter(
      (kf) =>
        kf.feat.name.toLowerCase().includes(q) ||
        kf.feat.description.toLowerCase().includes(q) ||
        kf.feat.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [knownFeats, searchQuery]);

  // ── Toggle a feat ──
  const handleToggle = useCallback(
    (featId: string, featName: string, newActive: boolean) => {
      const current = character.activeFeats || [];
      const existing = current.findIndex((a) => a.featId === featId);
      let next: ActiveFeatRef[];
      if (existing >= 0) {
        next = [...current];
        next[existing] = { ...next[existing], isActive: newActive };
      } else {
        next = [...current, { featId, featName, isActive: newActive }];
      }
      updateCharacter(character.id, { activeFeats: next });
    },
    [character.id, character.activeFeats, updateCharacter]
  );

  // ── Stats ──
  const activeCount = activeFeats.filter((a) => a.isActive).length;
  const totalCount = activeFeats.length;

  return (
    <div className="space-y-3 px-3 py-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏅</span>
          <div>
            <span className="text-xs font-bold text-surface-200">Feats &amp; Abilities</span>
            <span className="text-[9px] text-surface-500 ml-2">
              {activeCount}/{totalCount} active
            </span>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search feats..."
          className="input-arcane w-full text-xs pl-8 pr-3 py-2"
        />
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500 text-xs">
          🔍
        </span>
      </div>

      {/* ── Feat list ── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-6 text-center">
          <span className="text-2xl block mb-2">🏅</span>
          <p className="text-xs text-surface-500">
            {searchQuery ? "No feats match your search" : "No feats available"}
          </p>
          <p className="text-[10px] text-surface-600 mt-1">
            Feats appear here when added to the compendium
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(({ feat, ref }) => {
            const isActive = ref?.isActive ?? false;
            const isExpanded = expandedFeat === feat.id;

            return (
              <div
                key={feat.id}
                className={`rounded-xl border transition-all duration-200 ${
                  isActive
                    ? "bg-gold-500/[0.02] border-gold/10"
                    : "bg-obsidian-mid/40 border-surface-700/20"
                }`}
              >
                <div className="flex items-center gap-2.5 p-2.5">
                  {/* Toggle button */}
                  <button
                    onClick={() => handleToggle(feat.id, feat.name, !isActive)}
                    className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? "bg-gold-500/15 text-gold-400 border border-gold-500/25 shadow-[0_0_4px_rgba(234,179,8,0.15)]"
                        : "bg-surface-700/30 text-surface-500 border border-transparent hover:bg-surface-700/50"
                    }`}
                    title={isActive ? "Deactivate feat" : "Activate feat"}
                    aria-label={isActive ? "Deactivate" : "Activate"}
                  >
                    {isActive ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                    ) : (
                      <span className="text-xs">+</span>
                    )}
                  </button>

                  {/* Feat info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setExpandedFeat(isExpanded ? null : feat.id)}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-semibold ${isActive ? "text-surface-200" : "text-surface-400"}`}>
                        {feat.name}
                      </span>
                      {isActive && (
                        <span className="px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/20">
                          Active
                        </span>
                      )}
                      {feat.repeatable && (
                        <span className="px-1 py-0.5 rounded text-[7px] font-medium uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          Repeatable
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-surface-500 mt-0.5 line-clamp-1">
                      {feat.benefits?.join(" · ") || feat.description}
                    </p>
                  </div>

                  {/* Expand indicator */}
                  <span className={`text-surface-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </div>

                {/* ── Expanded details ── */}
                {isExpanded && (
                  <div className="px-2.5 pb-2.5 pt-0 border-t border-surface-700/10 mt-0">
                    <p className="text-[10px] text-surface-400 leading-relaxed mt-1.5">
                      {feat.description}
                    </p>
                    {feat.benefits && feat.benefits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {feat.benefits.map((b, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[8px] bg-gold-500/5 text-gold-500/70 border border-gold-500/10"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                    {feat.prerequisites && feat.prerequisites.length > 0 && (
                      <div className="mt-1.5">
                        <span className="text-[8px] uppercase tracking-wider text-surface-500">Prerequisites: </span>
                        {feat.prerequisites.map((pr, i) => (
                          <span
                            key={i}
                            className="text-[9px] text-amber-400/70 ml-1"
                          >
                            {pr.description}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
