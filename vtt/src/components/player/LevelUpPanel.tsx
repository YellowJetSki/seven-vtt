/**
 * STᚱ VTT — Level-Up Panel
 *
 * Premium interactive level-up dialog showing a complete breakdown
 * of what the character gains at the next level.
 *
 * Features:
 *   - Hit point gain (average or manual roll)
 *   - Proficiency bonus increase notification
 *   - New spell slots visualization (caster classes)
 *   - ASI availability at thresholds (4, 8, 12, 16, 19)
 *   - New class features and abilities
 *   - Cantrip increase for casters
 *   - One-click "Level Up" apply button
 */

import { useMemo, useState, useCallback } from "react";
import type { PlayerCharacter } from "@/types/character";
import {
  computeLevelUpPreview,
  applyLevelUp,
  getHitDieType,
  getProficiencyBonus,
  getSlotsForLevel,
  detectCasterType,
  type LevelUpPreview,
} from "@/lib/mechanics/level-up-engine";
import { useCampaignStore } from "@/stores/campaignStore";

interface LevelUpPanelProps {
  character: PlayerCharacter;
  onClose: () => void;
}

// ── Slot Badge ────────────────────────────────────────────────

function SlotBadge({ level, count }: { level: number; count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex flex-col items-center p-1.5 rounded-lg bg-sky-500/5 border border-sky-500/10 min-w-[2.5rem]">
      <span className="text-[7px] uppercase text-surface-500">Lv{level}</span>
      <span className="text-xs font-bold text-sky-400">{count}</span>
    </div>
  );
}

// ── Feature Row ───────────────────────────────────────────────

function FeatureRow({
  icon,
  label,
  description,
  highlight = false,
}: {
  icon: string;
  label: string;
  description?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-2 p-2 rounded-lg transition-all ${
        highlight
          ? "bg-gold-500/8 border border-gold/15"
          : "bg-white/[0.02] border border-transparent hover:bg-white/[0.03]"
      }`}
    >
      <span className="text-sm mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-bold ${highlight ? "text-gold-400" : "text-surface-300"}`}>
          {label}
        </p>
        {description && (
          <p className="text-[8px] text-surface-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}

// ── Section Divider ───────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />
  );
}

// ── Main Component ────────────────────────────────────────────

export default function LevelUpPanel({ character, onClose }: LevelUpPanelProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [applied, setApplied] = useState(false);
  const [showManualHp, setShowManualHp] = useState(false);
  const [manualRoll, setManualRoll] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const preview = useMemo<LevelUpPreview | null>(
    () => computeLevelUpPreview(character),
    [character]
  );

  const className = character.class ?? "Fighter";
  const hitDieType = getHitDieType(className);
  const casterType = detectCasterType(className);
  const conMod = Math.floor((character.constitution - 10) / 2);
  const totalHp = (character.hitPoints?.max ?? 10);
  const currentLevel = character.level ?? 1;

  // ── HP gain (average or manual) ──
  const effectiveHpGain = useMemo(() => {
    if (manualRoll != null) {
      return Math.max(1, manualRoll + conMod);
    }
    return preview?.hpGained ?? Math.max(1, Math.ceil(hitDieType / 2) + 1 + conMod);
  }, [manualRoll, preview, hitDieType, conMod]);

  // ── Can level up? ──
  const canLevelUp = currentLevel < 20 && preview !== null;

  // ── Apply ──
  const handleApply = useCallback(() => {
    if (!canLevelUp) return;
    const updates = applyLevelUp(character, manualRoll ?? undefined);
    updateCharacter(character.id, updates as Partial<PlayerCharacter>);
    setApplied(true);
    setFlash(`✨ ${character.name} is now level ${currentLevel + 1}!`);
    setTimeout(() => onClose(), 2500);
  }, [canLevelUp, character, manualRoll, updateCharacter, currentLevel, onClose]);

  // ── Render ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-b from-[#14151f] to-[#0f1019] rounded-2xl border border-white/[0.06] shadow-2xl shadow-black/50 overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-gold">
        {/* Gold edge light */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

        <div className="p-5 space-y-4">
          {/* ── HEADER ── */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⬆️</span>
              <div>
                <h2 className="text-sm font-bold text-gold-400">Level Up</h2>
                <p className="text-[9px] text-surface-500">
                  {character.name} · {currentLevel} → {currentLevel + 1}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/[0.03] border border-surface-700/20 text-surface-500 hover:text-surface-300 text-xs flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </div>

          {!preview ? (
            /* ── MAX LEVEL ── */
            <div className="flex flex-col items-center gap-3 py-8">
              <span className="text-3xl">🏆</span>
              <p className="text-sm font-bold text-gold-400">Max Level!</p>
              <p className="text-[10px] text-surface-500 text-center">
                {character.name} has reached the maximum level of 20.
              </p>
            </div>
          ) : (
            <>
              {/* ── LEVEL PROGRESSION ── */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-obsidian-mid/30 border border-surface-700/10">
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-surface-800/80 border border-surface-700/20 flex items-center justify-center">
                    <span className="text-sm font-black text-surface-400">{currentLevel}</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-surface-500">→</span>
                    <span className="w-4 h-0.5 rounded bg-gold-500/40" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold/25 flex items-center justify-center ring-2 ring-gold/20">
                    <span className="text-sm font-black text-gold-400">{preview.newLevel}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-surface-500 block">Class</span>
                  <span className="text-[10px] font-bold text-surface-300">{character.class}</span>
                </div>
              </div>

              {/* ── HIT POINTS ── */}
              <div className="space-y-2">
                <h3 className="text-[8px] font-bold uppercase tracking-wider text-surface-500">
                  ❤️ Hit Points
                </h3>
                <div className="p-3 rounded-xl bg-obsidian-mid/30 border border-surface-700/10">
                  {/* HP Gain Display */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-surface-500">HP Gain</span>
                      {!showManualHp ? (
                        <span className="text-sm font-bold text-emerald-400">+{effectiveHpGain}</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-surface-500">d{hitDieType}</span>
                          <span className="text-[9px] text-surface-600">+{conMod}</span>
                          <span className="text-[9px] text-surface-500">=</span>
                          <span className="text-sm font-bold text-emerald-400">+{effectiveHpGain}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setShowManualHp(!showManualHp);
                        setManualRoll(null);
                      }}
                      className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all ${
                        showManualHp
                          ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                          : "bg-white/[0.03] text-surface-500 border border-surface-700/20 hover:text-surface-300"
                      }`}
                    >
                      {showManualHp ? "Use Avg" : "Manual Roll"}
                    </button>
                  </div>

                  {/* Manual HP Roller */}
                  {showManualHp && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <button
                        onClick={() => setManualRoll(Math.max(1, (manualRoll ?? 1) - 1))}
                        disabled={manualRoll !== null && manualRoll <= 1}
                        className="w-7 h-7 rounded-lg bg-obsidian-mid/60 border border-surface-700/20 text-surface-400 hover:text-surface-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        −
                      </button>
                      {Array.from({ length: hitDieType }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setManualRoll(i + 1)}
                          className={`w-7 h-7 rounded-lg text-[9px] font-bold transition-all ${
                            manualRoll === i + 1
                              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.15)]"
                              : "bg-surface-800/40 border border-surface-700/10 text-surface-500 hover:border-surface-600/30"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setManualRoll(Math.min(hitDieType, (manualRoll ?? 1) + 1))}
                        disabled={manualRoll !== null && manualRoll >= hitDieType}
                        className="w-7 h-7 rounded-lg bg-obsidian-mid/60 border border-surface-700/20 text-surface-400 hover:text-surface-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        +
                      </button>
                    </div>
                  )}

                  {/* HP Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px]">
                      <span className="text-surface-500">Total HP</span>
                      <span className="text-surface-300">
                        {totalHp}
                        <span className="text-emerald-400 font-bold"> + {effectiveHpGain}</span>
                        <span className="text-surface-500"> = </span>
                        <span className="text-gold-400 font-bold">{totalHp + effectiveHpGain}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-obsidian/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, ((totalHp + effectiveHpGain) / 300) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── PROFICIENCY ── */}
              {preview.proficiencyIncreased && (
                <div className="p-2 rounded-xl bg-gold-500/8 border border-gold/15 flex items-center gap-2">
                  <span>⭐</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gold-400">Proficiency Bonus Increased!</p>
                    <p className="text-[8px] text-surface-500">
                      +{getProficiencyBonus(currentLevel)} → <strong className="text-gold-400">+{preview.proficiencyBonus}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* ── SPELL SLOTS ── */}
              {preview.spellSlots && preview.spellSlotsIncreased && (
                <div className="space-y-2">
                  <h3 className="text-[8px] font-bold uppercase tracking-wider text-surface-500">
                    🔮 Spell Slots
                  </h3>
                  <div className="p-3 rounded-xl bg-obsidian-mid/30 border border-surface-700/10">
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(preview.spellSlots).map(([key, count]) => {
                        const level = parseInt(key.replace("level", ""), 10);
                        const oldCount = getSlotsForLevel(currentLevel, casterType);
                        const isNew = oldCount && (oldCount[key as keyof typeof oldCount] ?? 0) < count;
                        return (
                          <div
                            key={key}
                            className={`flex flex-col items-center p-1.5 rounded-lg min-w-[2.2rem] ${
                              isNew
                                ? "bg-sky-500/10 border border-sky-500/25 ring-1 ring-sky-500/20"
                                : "bg-white/[0.02] border border-transparent"
                            }`}
                          >
                            <span className="text-[7px] uppercase text-surface-500">{level}</span>
                            <span
                              className={`text-[10px] font-bold ${
                                isNew ? "text-sky-400" : count > 0 ? "text-surface-300" : "text-surface-600"
                              }`}
                            >
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[8px] text-surface-600 mt-1.5">
                      {
                        Object.entries(preview.spellSlots).filter(
                          ([key, count]) => {
                            const oldCount = getSlotsForLevel(currentLevel, casterType);
                            return oldCount && (oldCount[key as keyof typeof oldCount] ?? 0) < count;
                          }
                        ).length
                      } slot level{(Object.entries(preview.spellSlots).filter(([key, count]) => {
                        const oldCount = getSlotsForLevel(currentLevel, casterType);
                        return oldCount && (oldCount[key as keyof typeof oldCount] ?? 0) < count;
                      }).length) !== 1 ? "s" : ""} increased
                    </p>
                  </div>
                </div>
              )}

              {/* ── NEW FEATURES ── */}
              {preview.newFeatures.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[8px] font-bold uppercase tracking-wider text-surface-500">
                    ⚔️ New Features
                  </h3>
                  <div className="space-y-1">
                    {preview.newFeatures.map((feat, i) => (
                      <FeatureRow
                        key={i}
                        icon={
                          feat.includes("Spell") ? "🔮" :
                          feat.includes("Attack") ? "⚔️" :
                          feat.includes("Fighting") ? "🛡" :
                          feat.includes("Expertise") || feat.includes("Sneak") ? "🎯" :
                          feat.includes("Action") ? "⚡" :
                          feat.includes("Cantrip") ? "✨" :
                          "🏅"
                        }
                        label={feat}
                        highlight
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── ASI ── */}
              {preview.asiAvailable && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span>💪</span>
                    <p className="text-[10px] font-bold text-amber-400">
                      Ability Score Improvement Available
                    </p>
                  </div>
                  <p className="text-[8px] text-surface-500 leading-relaxed">
                    You can increase one ability score by 2, or two ability scores by 1 each.
                    Alternatively, you may take a Feat (if your DM permits).
                  </p>
                </div>
              )}

              {/* ── EXTRA ATTACK ── */}
              {preview.extraAttack && (
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span>⚔️</span>
                    <p className="text-[10px] font-bold text-rose-400">
                      Extra Attack!
                    </p>
                  </div>
                  <p className="text-[8px] text-surface-500 leading-relaxed">
                    You can attack twice instead of once whenever you take the Attack action on your turn.
                  </p>
                </div>
              )}

              {/* ── SECTION DIVIDER ── */}
              <SectionDivider />

              {/* ── NEW VALUE BREAKDOWN ── */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-xl bg-obsidian-mid/30 border border-surface-700/10 text-center">
                  <span className="text-[7px] uppercase tracking-wider text-surface-500 block">New HP</span>
                  <span className="text-xs font-bold text-gold-400">{totalHp + effectiveHpGain}</span>
                </div>
                <div className="p-2 rounded-xl bg-obsidian-mid/30 border border-surface-700/10 text-center">
                  <span className="text-[7px] uppercase tracking-wider text-surface-500 block">Prof.</span>
                  <span className="text-xs font-bold text-gold-400">
                    +{preview.proficiencyBonus}
                    {preview.proficiencyIncreased && (
                      <span className="text-emerald-400 text-[8px] ml-0.5">↑</span>
                    )}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-obsidian-mid/30 border border-surface-700/10 text-center">
                  <span className="text-[7px] uppercase tracking-wider text-surface-500 block">Features</span>
                  <span className="text-xs font-bold text-gold-400">{preview.newFeatures.length}</span>
                </div>
              </div>

              {/* ── ACTIONS ── */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 rounded-xl bg-white/[0.03] border border-surface-700/20 text-surface-400 text-[10px] font-bold uppercase tracking-wider hover:text-surface-300 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={applied}
                  className="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/15 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {applied ? "✓ Level Up Applied!" : `Level Up to ${preview.newLevel}`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── FLASH ── */}
        {flash && (
          <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-lg bg-obsidian/90 backdrop-blur-sm border border-gold-500/20 text-[10px] text-gold-400 text-center animate-fade-in">
            {flash}
          </div>
        )}
      </div>
    </div>
  );
}
