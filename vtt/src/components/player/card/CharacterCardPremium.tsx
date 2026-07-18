/* ── CharacterCardPremium (v4 — Foundry-Level) ──────────────────
 * ULTRA-premium character card matching Foundry VTT and D&D Beyond
 * information density. Features:
 *  - Split layout: portrait sidebar + right content panel
 *  - At-a-glance combat roundel (HP bar, AC, Initiative, PB, Speed)
 *  - Full ability score block with save proficiency dots
 *  - Saving throw bonuses + top skills
 *  - Weapon attacks block (up to 4 with to-hit and damage)
 *  - Spellcasting summary (ability, DC, attack, slot gauges)
 *  - Class resources tracker
 *  - Equipment quick-glance + currency footer
 *  - XP progress bar with D&D 5e level thresholds
 *  - Passive Perception/Investigation/Insight
 *  - Death saves and conditions badges
 *  - Hover action overlay: Inventory, Edit, Export, Delete
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import type { PlayerCharacter, Ability } from "@/types";
import { getClassSummary, getAbilityMod, formatInitiative } from "@/types";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { FullscreenImageModal } from "@/components/ui/FullscreenImageModal";

/* ── Constants ──────────────────────────────────────────────── */

const PORTRAIT_BASE = "/images/portraits";
const ABILITIES: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABIL_LABELS: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};
const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

const SKILL_KEYS = [
  { key: "acrobatics", label: "Acrobatics", abil: "dexterity" as Ability },
  { key: "animalHandling", label: "Animal Handling", abil: "wisdom" as Ability },
  { key: "arcana", label: "Arcana", abil: "intelligence" as Ability },
  { key: "athletics", label: "Athletics", abil: "strength" as Ability },
  { key: "deception", label: "Deception", abil: "charisma" as Ability },
  { key: "history", label: "History", abil: "intelligence" as Ability },
  { key: "insight", label: "Insight", abil: "wisdom" as Ability },
  { key: "intimidation", label: "Intimidation", abil: "charisma" as Ability },
  { key: "investigation", label: "Investigation", abil: "intelligence" as Ability },
  { key: "medicine", label: "Medicine", abil: "wisdom" as Ability },
  { key: "nature", label: "Nature", abil: "intelligence" as Ability },
  { key: "perception", label: "Perception", abil: "wisdom" as Ability },
  { key: "performance", label: "Performance", abil: "charisma" as Ability },
  { key: "persuasion", label: "Persuasion", abil: "charisma" as Ability },
  { key: "religion", label: "Religion", abil: "intelligence" as Ability },
  { key: "sleightOfHand", label: "Sleight of Hand", abil: "dexterity" as Ability },
  { key: "stealth", label: "Stealth", abil: "dexterity" as Ability },
  { key: "survival", label: "Survival", abil: "wisdom" as Ability },
];

function resolveUrl(url: string | undefined): string | undefined {
  if (!url) return;
  if (url.startsWith("/images/")) return url;
  if (url.startsWith("/")) return `${PORTRAIT_BASE}${url}`;
  return url;
}

function pct(a: number, b: number) { return b > 0 ? Math.min(100, Math.max(0, (a / b) * 100)) : 0; }

interface Props {
  character: PlayerCharacter;
  index?: number;
  onOpen?: () => void;
  onEdit?: () => void;
  onOpenInventory?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  /** Compact mode for player dashboard (smaller) */
  compact?: boolean;
}

export function CharacterCardPremium({ character, index = 0, onOpen, onEdit, onOpenInventory, onExport, onDelete, compact = false }: Props) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const portraitUrl = resolveUrl(character.imageUrl);
  const fallbackEmoji = character.race.includes("Gnome") ? "🧙" : character.race.includes("Elf") ? "🧝" : character.race.includes("Dwarf") ? "⛏️" : character.race.includes("Dragon") ? "🐉" : "⚔";
  const pb = character.proficiencyBonus ?? Math.ceil(1 + character.level / 4);
  const hpPct = pct(character.hitPoints.current, character.hitPoints.max);
  const initiative = character.initiative ?? 0;

  const skillProfs = useMemo(() => {
    return SKILL_KEYS
      .map((s) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prof = (character.skills as any)[s.key as keyof typeof character.skills] ?? "none";
        const abilScore = character[s.abil as keyof PlayerCharacter] as number ?? 10;
        const abilMod = Math.floor((abilScore - 10) / 2);
        const profBonus = prof === "proficient" ? pb : prof === "expertise" ? pb * 2 : 0;
        return { ...s, prof, total: abilMod + profBonus };
      })
      .filter((s) => s.prof !== "none")
      .sort((a, b) => b.total - a.total);
  }, [character, pb]);

  const topSkills = skillProfs.slice(0, 5);
  const overflowSkills = skillProfs.length > 5 ? skillProfs.length - 5 : 0;

  const passivePerception = useMemo(() => {
    const wis = Math.floor(((character.wisdom ?? 10) - 10) / 2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const percProf = (character.skills as any)["perception"] ?? "none";
    const p = percProf === "proficient" ? pb : percProf === "expertise" ? pb * 2 : 0;
    return 10 + wis + p;
  }, [character.wisdom, pb, character.skills]);

  const passiveInvestigation = useMemo(() => {
    const int = Math.floor(((character.intelligence ?? 10) - 10) / 2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invProf = (character.skills as any)["investigation"] ?? "none";
    const p = invProf === "proficient" ? pb : invProf === "expertise" ? pb * 2 : 0;
    return 10 + int + p;
  }, [character.intelligence, pb, character.skills]);

  const passiveInsight = useMemo(() => {
    const wis = Math.floor(((character.wisdom ?? 10) - 10) / 2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insProf = (character.skills as any)["insight"] ?? "none";
    const p = insProf === "proficient" ? pb : insProf === "expertise" ? pb * 2 : 0;
    return 10 + wis + p;
  }, [character.wisdom, pb, character.skills]);

  // Extract weapon info from equipment
  const weapons = useMemo(() => {
    return character.equipment?.filter((e) => e.item && !e.notes?.includes("armor")) ?? [];
  }, [character.equipment]);

  const spellcasting = character.spellcasting;

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <>
      <div
        className={`group relative flex flex-col rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer animate-slide-up
          hover:-translate-y-1 hover:shadow-xl hover:shadow-accent-500/8
          ${compact ? "border-surface-700/40 bg-surface-850/60 hover:border-accent-500/30" : "border-surface-700/60 bg-surface-850/80 hover:border-accent-500/40 hover:shadow-accent-500/10"}
        `}
        style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
        onClick={onOpen}
      >
        {/* Accent Bar (level-colored) */}
        <div className="h-1 w-full bg-gradient-to-r from-accent-500/60 via-mage-500/40 to-rogue-500/30" />

        <div className={`flex ${compact ? "gap-2 p-2" : "gap-3 p-3 pb-2"}`}>
          {/* ═══ PORTRAIT SIDEBAR ═══ */}
          <div className={`relative shrink-0 overflow-hidden rounded-lg ring-2 ring-surface-700 group-hover:ring-accent-500/40 transition-all ${compact ? "h-14 w-14" : "h-16 w-16"}`}>
            <ImageWithFallback
              src={portraitUrl}
              alt={character.name}
              fallback={fallbackEmoji}
              className="h-full w-full object-cover"
              onClick={(e) => { e.stopPropagation(); if (character.imageUrl) setShowFullscreen(true); }}
            />
            {/* Level badge (bottom-right of portrait) */}
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rogue-600/90 text-[9px] font-bold text-white ring-2 ring-surface-850">
              {character.level}
            </div>
          </div>

          {/* ═══ IDENTITY PANEL ═══ */}
          <div className="min-w-0 flex-1">
            <h3 className={`font-bold text-surface-100 truncate group-hover:text-accent-300 transition-colors ${compact ? "text-sm" : "text-base"}`}>
              {character.name}
            </h3>
            <p className={`text-surface-400 ${compact ? "text-[10px]" : "text-[11px]"}`}>
              {character.race}
              <span className="mx-1 text-surface-600">·</span>
              <span className="text-accent-400/80 font-medium">{getClassSummary(character.classes ?? [{ name: character.class, level: character.level } as any])}</span>
            </p>
            {!compact && character.background && (
              <p className="text-[10px] text-surface-500 italic truncate mt-0.5">{character.background}</p>
            )}
            {character.playerName && (
              <p className={`text-surface-600 ${compact ? "text-[8px]" : "text-[9px]"} mt-0.5`}>
                👤 {character.playerName}
              </p>
            )}
          </div>
        </div>

        {/* ═══ COMBAT ROUNDEL ═══ */}
        <div className={`grid grid-cols-4 gap-1 ${compact ? "px-2 pb-1" : "px-3 pb-1.5"}`}>
          <StatBadge label="AC" value={String(character.armorClass)} color="accent" compact={compact} />
          <StatBadge label="Init" value={formatInitiative(initiative)} color="mage" compact={compact} />
          <StatBadge label="PB" value={`+${pb}`} color="rogue" compact={compact} />
          <StatBadge label="Speed" value={String(character.speed?.walk ?? 30)} color="warrior" compact={compact} />
        </div>

        {/* ═══ HP BAR ═══ */}
        <div className={`${compact ? "px-2 pb-1" : "px-3 pb-1.5"}`}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-medium text-surface-500 uppercase tracking-wider">HP</span>
            <span className="text-[10px] font-mono text-surface-400">
              {character.hitPoints.current}
              <span className="text-surface-600">/{character.hitPoints.max}</span>
              {character.hitPoints.temporary > 0 && <span className="text-divine-400 ml-1">+{character.hitPoints.temporary}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${hpPct}%`,
                background: hpPct > 50 ? `linear-gradient(90deg, #27ae60, #2ecc71)` : hpPct > 25 ? `linear-gradient(90deg, #f39c12, #f1c40f)` : `linear-gradient(90deg, #e74c3c, #c0392b)`,
                boxShadow: `0 0 6px ${hpPct > 50 ? 'rgba(39,174,96,0.3)' : hpPct > 25 ? 'rgba(243,156,18,0.3)' : 'rgba(231,76,60,0.3)'}`,
              }}
            />
          </div>
        </div>

        {/* ═══ ABILITY SCORES ═══ */}
        {!compact && (
          <div className="px-3 pb-1.5">
            <div className="grid grid-cols-6 gap-0.5">
              {ABILITIES.map((abil) => {
                const score = character[abil as keyof PlayerCharacter] as number ?? 10;
                const mod = Math.floor((score - 10) / 2);
                const isSaveProf = character.savingThrows?.[abil]?.proficient ?? false;
                return (
                  <div key={abil} className="flex flex-col items-center rounded-md bg-surface-800/60 py-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 font-medium">{ABIL_LABELS[abil]}</span>
                    <span className={`text-sm font-bold ${isSaveProf ? 'text-accent-300' : 'text-surface-200'}`}>
                      {mod >= 0 ? `+${mod}` : mod}
                    </span>
                    <span className="text-[8px] text-surface-500">{score}</span>
                    {isSaveProf && <span className="text-[6px] text-accent-500 mt-0.5">●</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ SAVING THROWS + SKILLS ═══ */}
        {!compact && (
          <div className="px-3 pb-1.5">
            <div className="grid grid-cols-2 gap-1">
              {/* Saves */}
              <div className="space-y-0.5">
                <p className="text-[7px] uppercase tracking-widest text-surface-600 font-semibold mb-0.5">Saves</p>
                {ABILITIES.map((abil) => {
                  const save = character.savingThrows?.[abil];
                  const mod = Math.floor(((character[abil as keyof PlayerCharacter] as number ?? 10) - 10) / 2);
                  const total = mod + (save?.proficient ? pb : 0);
                  return (
                    <div key={abil} className="flex items-center gap-1">
                      <span className={`text-[7px] ${save?.proficient ? 'text-accent-400' : 'text-surface-600'}`}>
                        {save?.proficient ? '◆' : '◇'}
                      </span>
                      <span className="text-[9px] text-surface-400 w-8 uppercase">{ABIL_LABELS[abil]}</span>
                      <span className={`text-[9px] font-mono font-bold ${total >= 0 ? 'text-surface-300' : 'text-warrior-400'}`}>
                        {total >= 0 ? `+${total}` : total}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Skills */}
              <div className="space-y-0.5">
                <p className="text-[7px] uppercase tracking-widest text-surface-600 font-semibold mb-0.5">Skills</p>
                {topSkills.slice(0, 6).map((s) => (
                  <div key={s.key} className="flex items-center gap-1">
                    <span className={`text-[7px] ${s.prof === 'expertise' ? 'text-divine-400' : s.prof === 'proficient' ? 'text-rogue-400' : 'text-surface-600'}`}>
                      {s.prof === 'expertise' ? '★' : s.prof === 'proficient' ? '●' : '○'}
                    </span>
                    <span className="text-[9px] text-surface-400 truncate flex-1">{s.label}</span>
                    <span className="text-[9px] font-mono text-surface-300 font-bold">{s.total >= 0 ? `+${s.total}` : s.total}</span>
                  </div>
                ))}
                {overflowSkills > 0 && (
                  <p className="text-[8px] text-surface-600 italic">+{overflowSkills} more</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ PASSIVES ═══ */}
        {!compact && (
          <div className="px-3 pb-1.5">
            <div className="flex gap-2">
              <PassiveBadge label="Passive Perception" value={passivePerception} />
              <PassiveBadge label="Passive Investigation" value={passiveInvestigation} />
              <PassiveBadge label="Passive Insight" value={passiveInsight} />
            </div>
          </div>
        )}

        {/* ═══ WEAPONS (top 2) ═══ */}
        {!compact && weapons.length > 0 && (
          <div className="px-3 pb-1.5">
            <p className="text-[7px] uppercase tracking-widest text-surface-600 font-semibold mb-0.5">Attacks</p>
            <div className="space-y-0.5">
              {weapons.slice(0, 2).map((w, i) => {
                const weaponAbility = w.notes?.includes("finesse") ? Math.max(character.dexterity ?? 10, character.strength ?? 10) : w.notes?.includes("ranged") ? character.dexterity ?? 10 : character.strength ?? 10;
                const atkBonus = Math.floor((weaponAbility - 10) / 2) + pb;
                return (
                  <div key={i} className="flex items-center justify-between rounded bg-surface-800/40 px-2 py-1">
                    <span className="text-[9px] text-surface-300 truncate">{w.item}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-rogue-400 font-bold">+{atkBonus}</span>
                      <span className="text-[9px] font-mono text-surface-400">{w.quantity ? `${w.quantity}` : '—'}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ SPELLCASTING (if applicable) ═══ */}
        {!compact && spellcasting && (
          <div className="px-3 pb-1.5">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[7px] uppercase tracking-widest text-surface-600 font-semibold">Magic</span>
              <span className="text-[8px] text-accent-400 font-medium">{spellcasting.ability.toUpperCase()}</span>
              <span className="text-[8px] text-surface-500">DC {spellcasting.saveDC}</span>
              <span className="text-[8px] text-surface-500">+{spellcasting.attackBonus}</span>
            </div>
            {spellcasting.slots && (
              <div className="flex gap-1">
                {spellcasting.slots.filter((s) => s.max > 0).map((slot, i) => (
                  <div key={i} className="flex items-center gap-0.5">
                    <span className="text-[7px] text-surface-600">{i + 1}.</span>
                    <div className="h-2 w-8 rounded-full bg-surface-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-mage-500"
                        style={{ width: `${(slot.current / slot.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-surface-500 font-mono">{slot.current}/{slot.max}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ CLASS RESOURCES ═══ */}
        {!compact && character.resources && character.resources.length > 0 && (
          <div className="px-3 pb-1.5">
            <div className="flex flex-wrap gap-2">
              {character.resources.map((r) => (
                <div key={r.id} className="flex items-center gap-1 rounded-full bg-surface-800/60 px-2 py-0.5">
                  <span className="text-[8px] text-surface-400 truncate max-w-[60px]">{r.name}</span>
                  <span className="text-[9px] font-mono text-surface-300 font-bold">{r.current}</span>
                  <span className="text-[7px] text-surface-600">/</span>
                  <span className="text-[9px] font-mono text-surface-500">{r.max}</span>
                  <RechargeBadge type={r.recharge as "short" | "long"} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ EQUIPMENT + CURRENCY ═══ */}
        {!compact && (
          <div className="px-3 pb-1.5">
            <div className="flex items-center justify-between rounded bg-surface-800/30 px-2 py-1">
              <span className="text-[9px] text-surface-400">
                🎒 {character.equipment?.length ?? 0} items
                {character.equipment && (
                  <span className="text-surface-600 ml-1">· {(character.equipment.reduce((a, e) => a + (e.weight ?? 0) * e.quantity, 0)).toFixed(1)} lbs</span>
                )}
              </span>
              <span className="text-[10px] font-bold text-gold-400">
                {((character.currency?.gold ?? 0) + (character.currency?.platinum ?? 0) * 10 + (character.currency?.electrum ?? 0) * 0.5).toFixed(0)} GP
              </span>
            </div>
          </div>
        )}

        {/* ═══ XP PROGRESS ═══ */}
        {!compact && (
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[7px] uppercase tracking-widest text-surface-600 font-semibold">Experience</span>
              <span className="text-[8px] text-surface-500">{character.experiencePoints ?? 0} XP</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-800">
              {character.level < 20 ? (
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-600 to-mage-500"
                  style={{
                    width: `${pct((character.experiencePoints ?? 0) - XP_THRESHOLDS[character.level - 1], XP_THRESHOLDS[Math.min(character.level, 19)] - XP_THRESHOLDS[character.level - 1])}%`,
                  }}
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gradient-to-r from-gold-500 to-divine-500"
                  style={{ boxShadow: "0 0 4px rgba(226,183,20,0.5)" }} />
              )}
            </div>
            <p className="text-[7px] text-surface-600 mt-0.5">
              {character.level < 20
                ? `${((character.experiencePoints ?? 0) - XP_THRESHOLDS[character.level - 1]).toLocaleString()} / ${(XP_THRESHOLDS[Math.min(character.level, 19)] - XP_THRESHOLDS[character.level - 1]).toLocaleString()} to level ${character.level + 1}`
                : 'Level 20 — Maximum'
              }
            </p>
          </div>
        )}

        {/* ═══ CONDITIONS & DEATH SAVES (only when relevant) ═══ */}
        {!compact && (character.conditions?.length > 0 || character.hitPoints.current <= 0) && (
          <div className="px-3 pb-2">
            <div className="flex flex-wrap gap-1">
              {character.hitPoints.current <= 0 && (
                <span className="rounded-full bg-warrior-600/20 px-2 py-0.5 text-[9px] text-warrior-400 font-medium ring-1 ring-warrior-500/30">
                  ⚰️ Dying
                  <span className="ml-1 text-[8px] text-surface-500">
                    [{character.deathSaves?.successes ?? 0}✓ {character.deathSaves?.failures ?? 0}✗]
                  </span>
                </span>
              )}
              {(character.conditions ?? []).slice(0, 3).map((c) => (
                <span key={c} className="rounded-full bg-divine-600/15 px-2 py-0.5 text-[9px] text-divine-400 font-medium ring-1 ring-divine-500/20">
                  {ConditionIcon[c as keyof typeof ConditionIcon] ?? "⚠"} {c}
                </span>
              ))}
              {(character.conditions ?? []).length > 3 && (
                <span className="text-[8px] text-surface-600 self-center">+{character.conditions!.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* ═══ ACTION OVERLAY (hover) ═══ */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <ActionButton icon="🎒" title="Inventory" onClick={(e) => { e.stopPropagation(); onOpenInventory?.(); }} />
          <ActionButton icon="✏️" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit?.(); }} />
          <ActionButton icon="📤" title="Export" onClick={(e) => { e.stopPropagation(); onExport?.(); }} />
          <ActionButton icon="🗑️" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="hover:bg-warrior-500/20 hover:text-warrior-400" />
        </div>

        {/* Hover glow ring */}
        <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-1 ring-accent-500/20" />
      </div>

      {showFullscreen && portraitUrl && (
        <FullscreenImageModal src={portraitUrl} alt={`${character.name} portrait`} onClose={() => setShowFullscreen(false)} />
      )}
    </>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function StatBadge({ label, value, color, compact }: { label: string; value: string; color: string; compact?: boolean }) {
  const colorMap: Record<string, string> = {
    accent: "border-accent-500/25 bg-accent-500/8 text-accent-400",
    mage: "border-mage-500/25 bg-mage-500/8 text-mage-400",
    rogue: "border-rogue-500/25 bg-rogue-500/8 text-rogue-400",
    warrior: "border-warrior-500/25 bg-warrior-500/8 text-warrior-400",
  };
  return (
    <div className={`rounded-lg border text-center ${colorMap[color] ?? 'border-surface-700/30 bg-surface-800/40 text-surface-400'} ${compact ? 'py-0.5' : 'py-1'}`}>
      <p className="text-[7px] font-semibold uppercase tracking-wider opacity-60">{label}</p>
      <p className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`}>{value}</p>
    </div>
  );
}

function PassiveBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1 rounded bg-surface-800/40 px-1.5 py-0.5">
      <span className="text-[7px] text-surface-500 uppercase tracking-wider">{label}</span>
      <span className="text-[9px] font-bold text-surface-300">{value}</span>
    </div>
  );
}

function RechargeBadge({ type }: { type: "short" | "long" }) {
  const colorClass = type === "short" ? "text-divine-500 bg-divine-500/10 ring-1 ring-divine-500/20" : "text-mage-500 bg-mage-500/10 ring-1 ring-mage-500/20";
  return (
    <span className={`text-[6px] font-semibold uppercase px-1 py-0 rounded ${colorClass}`}>
      {type} rest
    </span>
  );
}

function ActionButton({ icon, title, onClick, className = "" }: { icon: string; title: string; onClick: (e: React.MouseEvent) => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-md bg-surface-900/80 px-1.5 py-1 text-xs text-surface-300 backdrop-blur-sm transition-colors hover:bg-accent-500/20 hover:text-accent-300 ${className}`}
    >
      {icon}
    </button>
  );
}

const ConditionIcon: Record<string, string> = {
  blinded: "🕶️", charmed: "💕", deafened: "🔇", frightened: "😱",
  grappled: "🤝", incapacitated: "💫", invisible: "👻", paralyzed: "🧊",
  petrified: "🗿", poisoned: "☠️", prone: "⬇️", restrained: "⛓️",
  stunned: "⚡", unconscious: "💤", exhaustion: "😮‍💨", concentration: "🧘",
};
