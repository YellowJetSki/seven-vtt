/**
 * STᚱ VTT — Homebrew Feat Detail Modal (Cycle 26 — The Homebrew Forge)
 *
 * Premium Lusion-grade glass popover displaying the FULL statblock
 * for a homebrew feat, including prerequisites, ability score increases,
 * skill proficiencies, benefits, flavor text, tags, and source info.
 *
 * Matches the pattern established by HomebrewItemDetailModal.tsx
 */

import { X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type { HomebrewFeat } from "@/types/homebrew";

interface HomebrewFeatDetailModalProps {
  feat: HomebrewFeat;
  isOpen: boolean;
  onClose: () => void;
}

const ABILITY_LABELS: Record<string, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

export default function HomebrewFeatDetailModal({ feat, isOpen, onClose }: HomebrewFeatDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const abilityIncreaseList = feat.abilityScoreIncrease
    ? feat.abilityScoreIncrease.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-[#14151f] to-[#0f101a] border border-gold/10 rounded-2xl shadow-2xl shadow-gold-500/5 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner ornaments */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-gold-500/20 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-gold-500/20 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-gold-500/20 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-gold-500/20 rounded-br-2xl pointer-events-none" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-gold/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500/10 to-amber-500/5 border border-gold/15 flex items-center justify-center text-sm">
              🏅
            </div>
            <div>
              <h2 className="text-base font-bold text-gold drop-shadow-[0_0_6px_rgba(234,179,8,0.1)]">{feat.name}</h2>
              <p className="text-[9px] text-surface-500 mt-0.5">Feat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-gold">
          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {feat.repeatable && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                🔄 Repeatable
              </span>
            )}
            {feat.visibleToPlayers && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                👁️ Visible
              </span>
            )}
          </div>

          {/* Prerequisites */}
          {feat.prerequisites && feat.prerequisites.length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Prerequisites</h3>
              <div className="flex flex-wrap gap-1.5">
                {feat.prerequisites.map((p, i) => (
                  <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-surface-800/60 border border-white/[0.04] text-surface-300">
                    {p.description}
                    {p.ability && p.minimumValue ? (
                      <span className="text-gold-400 ml-1">
                        ({ABILITY_LABELS[p.ability] || p.ability.toUpperCase()} {p.minimumValue}+)
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ability Score Increase */}
          {abilityIncreaseList.length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Ability Score Increase</h3>
              <div className="flex flex-wrap gap-1.5">
                {abilityIncreaseList.map((abil) => (
                  <span key={abil} className="text-[11px] px-2 py-1 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 font-bold">
                    +1 {ABILITY_LABELS[abil] || abil.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skill Proficiencies */}
          {feat.skillProficiencies && feat.skillProficiencies.length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Skill Proficiencies</h3>
              <div className="flex flex-wrap gap-1.5">
                {feat.skillProficiencies.map((skill) => (
                  <span key={skill} className="text-[10px] px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Flavor Text */}
          {feat.flavorText && (
            <p className="text-[10px] text-gold-400/60 italic leading-relaxed">"{feat.flavorText}"</p>
          )}

          {/* Description */}
          {feat.description && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Description</h3>
              <p className="text-[11px] text-surface-300 leading-relaxed">{feat.description}</p>
            </div>
          )}

          {/* Benefits */}
          {feat.benefits && feat.benefits.length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">
                Benefits ({feat.benefits.length})
              </h3>
              <div className="space-y-1">
                {feat.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-surface-300 leading-relaxed">
                    <span className="text-gold-400/60 mt-0.5 shrink-0">◆</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {feat.tags && feat.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {feat.tags.map((tag) => (
                <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-surface-800/60 border border-white/[0.04] text-surface-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Source + Timestamps */}
          <div className="text-[8px] text-surface-600 pt-2 border-t border-white/[0.04]">
            {feat.source && feat.source !== "homebrew" && <span>Source: {feat.source} · </span>}
            {feat.isHomebrew && <span>Homebrew · </span>}
            {feat.visibleToPlayers ? "Visible to players" : "DM only"}
          </div>
        </div>
      </div>
    </div>
  );
}
