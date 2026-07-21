/**
 * STᚱ VTT — Homebrew Enemy Detail Modal (Premium v3.0)
 *
 * Full 5.5e-style monster statblock display matching the
 * HomebrewItemDetailModal pattern with gold corner ornaments,
 * staggered entrance, and glass gradient premium styling.
 */

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import type { EnemyDoc } from "@/types";

interface HomebrewEnemyDetailModalProps {
  enemy: EnemyDoc | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatCr(cr: number): string {
  if (cr === 0) return "0";
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

const ABILITY_LABELS: Record<string, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

function abilityMod(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
}

const TYPE_COLORS: Record<string, string> = {
  Aberration: "text-violet-400", Beast: "text-amber-400",
  Celestial: "text-gold-400", Construct: "text-cyan-400",
  Dragon: "text-rose-400", Elemental: "text-blue-400",
  Fey: "text-emerald-400", Fiend: "text-red-400",
  Giant: "text-orange-400", Humanoid: "text-sky-400",
  Monstrosity: "text-rose-400", Ooze: "text-lime-400",
  Plant: "text-green-400", Undead: "text-indigo-400",
  Custom: "text-surface-400",
};

export default function HomebrewEnemyDetailModal({ enemy, isOpen, onClose }: HomebrewEnemyDetailModalProps) {
  // Escape key handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !enemy) return null;

  const xpFromCr = (cr: number): number => {
    const table: Record<number, number> = {
      0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700,
      4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
      11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000, 16: 15000,
      17: 18000, 18: 20000, 19: 22000, 20: 25000, 21: 33000, 22: 41000,
      23: 50000, 24: 62000, 25: 75000, 26: 90000, 27: 105000, 28: 120000,
      29: 135000, 30: 155000,
    };
    return table[cr] || 0;
  };

  const pbFromCr = (cr: number): number => {
    if (cr <= 4) return 2;
    if (cr <= 8) return 3;
    if (cr <= 12) return 4;
    if (cr <= 16) return 5;
    if (cr <= 20) return 6;
    return 7;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      style={{ animation: "fade-in 0.15s ease-out both" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-gradient-to-b from-[#14151f]/[0.98] to-[#0f1019]/[0.98] border border-white/[0.04] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 max-h-[85vh] overflow-y-auto scrollbar-gold"
        style={{ animation: "modal-card-enter 0.35s cubic-bezier(0.16,1,0.3,1) 0.05s both" }}
      >
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none z-10" />

        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-[#14151f]/95 to-[#14151f]/80 backdrop-blur-sm border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-gold-500 rounded-full" />
            <div>
              <span className="text-base font-bold text-white/90 font-display">{enemy.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-semibold ${TYPE_COLORS[enemy.type] || "text-surface-400"}`}>
                  {enemy.size} {enemy.type}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 active:scale-90 transition-all duration-150 group">
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image */}
          {enemy.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-white/[0.04] bg-[#0c0d15]">
              <img
                src={enemy.imageUrl}
                alt={enemy.name}
                className="w-full h-48 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* CR, XP, PB, AC, HP, Speed */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "CR", value: formatCr(enemy.challengeRating), color: "text-gold-400" },
              { label: "XP", value: xpFromCr(enemy.challengeRating).toLocaleString(), color: "text-amber-400" },
              { label: "PB", value: `+${pbFromCr(enemy.challengeRating)}`, color: "text-indigo-400" },
              { label: "AC", value: String(enemy.armorClass), color: "text-cyan-400" },
              { label: "HP", value: String(enemy.hitPoints.max), color: "text-emerald-400" },
              { label: "Speed", value: `${enemy.speed}ft`, color: "text-gold-400" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center py-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                <span className="text-[8px] uppercase tracking-widest text-surface-500">{stat.label}</span>
                <span className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Ability Scores */}
          <div>
            <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-2">Ability Scores</h3>
            <div className="grid grid-cols-6 gap-1.5">
              {(["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const).map((ab) => {
                const val = enemy.abilities[ab];
                return (
                  <div key={ab} className="flex flex-col items-center py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                    <span className="text-[8px] uppercase tracking-widest text-surface-500">{ABILITY_LABELS[ab]}</span>
                    <span className="text-sm font-bold text-white/90 tabular-nums">{val}</span>
                    <span className={`text-[9px] font-mono tabular-nums ${val >= 10 ? "text-gold-400/70" : "text-rose-400/70"}`}>
                      {abilityMod(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Saving Throws */}
          {Object.keys(enemy.savingThrows || {}).length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Saving Throws</h3>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(enemy.savingThrows || {}).map(([ab, val]) => (
                  <span key={ab} className="text-[9px] px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/20 text-gold-400 font-mono tabular-nums">
                    {ABILITY_LABELS[ab] || ab.slice(0, 3).toUpperCase()} {val !== undefined && val >= 0 ? "+" : ""}{val ?? 0}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {Object.keys(enemy.skills || {}).length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(enemy.skills || {}).map(([sk, val]) => (
                  <span key={sk} className="text-[9px] px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/20 text-gold-400 font-mono tabular-nums">
                    {sk.replace(/_/g, " ")} {val !== undefined && val >= 0 ? "+" : ""}{val ?? 0}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Damage table */}
          {([["Vulnerabilities", enemy.damageVulnerabilities], ["Resistances", enemy.damageResistances], ["Immunities", enemy.damageImmunities], ["Condition Imm.", enemy.conditionImmunities]] as const).map(([label, list]) => {
            const arr = list as string[];
            if (!arr || arr.length === 0) return null;
            return (
              <div key={label}>
                <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1">
                  {label === "Vulnerabilities" ? "🔥" : label === "Resistances" ? "🛡" : label === "Immunities" ? "✖" : "🛡"} {label}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {arr.map((d) => (
                    <span key={d} className="text-[9px] px-2 py-0.5 rounded bg-surface-800/50 border border-surface-700/20 text-surface-400">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Senses + Languages */}
          <div className="grid grid-cols-2 gap-3">
            {enemy.senses && (
              <div>
                <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1">Senses</h3>
                <p className="text-[10px] text-surface-400">{enemy.senses}</p>
              </div>
            )}
            {enemy.languages && (
              <div>
                <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1">Languages</h3>
                <p className="text-[10px] text-surface-400">{enemy.languages}</p>
              </div>
            )}
          </div>

          {/* Traits */}
          {enemy.traits && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Traits</h3>
              <p className="text-[10px] text-surface-400 leading-relaxed whitespace-pre-wrap">{enemy.traits}</p>
            </div>
          )}

          {/* Actions */}
          {enemy.actions && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Actions</h3>
              <p className="text-[10px] text-surface-400 leading-relaxed whitespace-pre-wrap">{enemy.actions}</p>
            </div>
          )}

          {/* Reactions */}
          {enemy.reactions && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Reactions</h3>
              <p className="text-[10px] text-surface-400 leading-relaxed whitespace-pre-wrap">{enemy.reactions}</p>
            </div>
          )}

          {/* Legendary Actions */}
          {enemy.legendaryActions && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-rose-500/50 mb-1.5">Legendary Actions</h3>
              <p className="text-[10px] text-surface-400 leading-relaxed whitespace-pre-wrap">{enemy.legendaryActions}</p>
            </div>
          )}

          {/* Spellcasting */}
          {enemy.spellcasting && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-violet-500/50 mb-1.5">Spellcasting</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/15 text-violet-400">DC {enemy.spellcasting.spellSaveDC}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400">ATK +{enemy.spellcasting.spellAttackBonus}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold-500/20 text-gold-400">{enemy.spellcasting.spellcastingAbility.slice(0, 3).toUpperCase()}</span>
                <span className="text-[9px] text-surface-500">{enemy.spellcasting.casterType.replace("_", " ")}</span>
              </div>
              {enemy.spellcasting.spells && enemy.spellcasting.spells.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {enemy.spellcasting.spells.map((s) => (
                    <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-surface-800/30 border border-surface-700/20 text-surface-400">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
