/* ── CharacterDetailModal ──────────────────────────────────────
 * Full character sheet modal with tabbed navigation (Combat, Abilities,
 * Features, Bio), fullscreen portrait viewer, and ALL player-accessible
 * stats: ability scores, saves, skills, speed, proficiencies, features,
 * traits, equipment, currency, spellcasting, death saves, etc.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import type { PlayerCharacter, Ability } from "@/types";
import { getClassSummary } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { FullscreenImageModal } from "@/components/ui/FullscreenImageModal";
import { formatCurrency } from "@/lib/character-export";

const ABILITY_ORDER: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABILITY_SHORT: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};
const ABILITY_LONG: Record<Ability, string> = {
  strength: "Strength", dexterity: "Dexterity", constitution: "Constitution",
  intelligence: "Intelligence", wisdom: "Wisdom", charisma: "Charisma",
};
const SKILL_ABILITIES: Record<string, Ability> = {
  acrobatics: "dexterity", animalHandling: "wisdom", arcana: "intelligence",
  athletics: "strength", deception: "charisma", history: "intelligence",
  insight: "wisdom", intimidation: "charisma", investigation: "intelligence",
  medicine: "wisdom", nature: "intelligence", perception: "wisdom",
  performance: "charisma", persuasion: "charisma", religion: "intelligence",
  sleightOfHand: "dexterity", stealth: "dexterity", survival: "wisdom",
};

type DetailTab = "combat" | "abilities" | "features" | "bio";

interface Props {
  character: PlayerCharacter;
  onClose: () => void;
  onEdit: () => void;
  onOpenInventory: () => void;
}

function getAbilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function fmtMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function fmtSkillName(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function TabBtn({ active, label, icon, onClick }: { active: boolean; label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-accent-600/20 text-accent-300 shadow-sm ring-1 ring-accent-500/30"
          : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
      }`}
    >
      <span className="text-sm">{icon}</span>
      {label}
    </button>
  );
}

/* ── Info Card wrapper ──────────────────────────────────────── */

function InfoCard({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800/80 p-3">
      <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">{label}</p>
      {value && <p className="mt-1 text-sm font-semibold text-surface-100">{value}</p>}
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

/* ── Header stat pill ───────────────────────────────────────── */

function HeaderStat({ label, value, accent, small }: { label: string; value: string; accent: string; small?: boolean }) {
  const colors: Record<string, string> = {
    rogue: "bg-rogue-500/10 text-rogue-400 border-rogue-500/20",
    mage: "bg-mage-500/10 text-mage-400 border-mage-500/20",
    divine: "bg-divine-500/10 text-divine-400 border-divine-500/20",
    warrior: "bg-warrior-500/10 text-warrior-400 border-warrior-500/20",
    accent: "bg-accent-500/10 text-accent-400 border-accent-500/20",
    surface: "bg-surface-800 text-surface-400 border-surface-700/50",
  };
  return (
    <div className={`rounded-lg border px-2.5 py-2 text-center ${colors[accent] || colors.surface}`}>
      <p className="text-[9px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className={`font-bold truncate ${small ? "text-[10px]" : "text-sm"}`} title={value}>{value}</p>
    </div>
  );
}

function getHpBarColor(pct: number): string {
  if (pct <= 0) return "bg-surface-600";
  if (pct <= 25) return "bg-warrior-500";
  if (pct <= 50) return "bg-divine-500";
  return "bg-rogue-500";
}

/* ──────────────────────────────────────────────────────────────
 * MAIN COMPONENT
 * ────────────────────────────────────────────────────────────── */

export function CharacterDetailModal({ character, onClose, onEdit, onOpenInventory }: Props) {
  const [activeTab, setActiveTab] = useState<DetailTab>("combat");
  const [showFullscreen, setShowFullscreen] = useState(false);

  /* ── Derived data ── */

  const speedParts: string[] = [];
  if (character.speed?.walk) speedParts.push(`${character.speed.walk}ft walk`);
  if (character.speed?.fly) speedParts.push(`${character.speed.fly}ft fly`);
  if (character.speed?.swim) speedParts.push(`${character.speed.swim}ft swim`);
  if (character.speed?.climb) speedParts.push(`${character.speed.climb}ft climb`);
  if (character.speed?.burrow) speedParts.push(`${character.speed.burrow}ft burrow`);
  if (character.speed?.canHover) speedParts.push("(hover)");
  const speedDisplay = speedParts.join(", ");

  const hpPercent = character.hitPoints.max > 0
    ? Math.max(0, (character.hitPoints.current / character.hitPoints.max) * 100)
    : 0;

  const totalItems = (character.equipment ?? []).length + (character.inventory ?? []).length;

  /* ── Render ── */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl max-h-[85vh] rounded-xl border border-surface-700 bg-surface-850 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ════════ HEADER ════════ */}
        <div className="shrink-0 border-b border-surface-700/80 bg-surface-900/50 p-4">
          <div className="flex items-start gap-4">
            {/* Portrait (click to fullscreen) */}
            <div
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 ring-surface-600 cursor-pointer hover:ring-accent-500/50 transition-all group"
              onClick={() => character.imageUrl && setShowFullscreen(true)}
            >
              <ImageWithFallback
                src={character.imageUrl}
                alt={`${character.name} portrait`}
                fallback={character.race.includes("Gnome") ? "🧙" : character.race.includes("Elf") ? "🧝" : "⚔"}
                className="h-full w-full"
                fit="cover"
              />
              {character.imageUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                  <span className="text-white/0 group-hover:text-white/80 text-lg transition-all">🔍</span>
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-surface-100">{character.name}</h2>
                  <p className="text-sm text-surface-400 mt-0.5">
                    {character.race} · {getClassSummary(character.classes ?? [{ name: character.class, level: character.level } as any])}
                  </p>
                  {character.background && (
                    <p className="text-xs text-surface-500 italic mt-0.5">{character.background} · {character.alignment || "Unaligned"}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rogue-500/15 text-base font-bold text-rogue-400 ring-2 ring-rogue-500/20">
                    {character.level}
                  </div>
                  <button onClick={onClose} className="text-surface-500 hover:text-surface-200 transition-colors p-1" aria-label="Close">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4l10 10M14 4L4 14" />
                    </svg>
                  </button>
                </div>
              </div>
              {character.playerName && (
                <p className="text-xs text-surface-500 mt-1">Player: <span className="text-surface-400 font-medium">{character.playerName}</span></p>
              )}
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="mt-3 grid grid-cols-5 gap-2">
            <HeaderStat label="HP" value={`${character.hitPoints.current}/${character.hitPoints.max}`} accent={hpPercent > 50 ? "rogue" : hpPercent > 25 ? "divine" : "warrior"} />
            <HeaderStat label="AC" value={String(character.armorClass)} accent="mage" />
            <HeaderStat label="Init" value={`+${character.initiative}`} accent="rogue" />
            <HeaderStat label="PB" value={`+${character.proficiencyBonus}`} accent="accent" />
            <HeaderStat label="Speed" value={speedDisplay} accent="surface" small />
          </div>

          {/* HP Bar */}
          <div className="mt-2 h-2 rounded-full bg-surface-700/80 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${getHpBarColor(hpPercent)}`}
              style={{ width: `${hpPercent}%` }} />
          </div>
          {character.hitPoints.temporary > 0 && (
            <p className="mt-1 text-[10px] text-mage-400">+{character.hitPoints.temporary} temporary HP</p>
          )}
        </div>

        {/* ════════ TABS ════════ */}
        <div className="shrink-0 flex gap-1.5 border-b border-surface-700/60 bg-surface-900/30 px-4 py-2.5">
          <TabBtn active={activeTab === "combat"} label="Combat" icon="⚔" onClick={() => setActiveTab("combat")} />
          <TabBtn active={activeTab === "abilities"} label="Abilities" icon="💪" onClick={() => setActiveTab("abilities")} />
          <TabBtn active={activeTab === "features"} label="Features" icon="✨" onClick={() => setActiveTab("features")} />
          <TabBtn active={activeTab === "bio"} label="Bio" icon="📜" onClick={() => setActiveTab("bio")} />
        </div>

        {/* ════════ CONTENT ════════ */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ─── TAB: COMBAT ─── */}
          {activeTab === "combat" && (
            <>
              {/* HP, AC, Initiative, Speed, Hit Dice */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoCard label="Hit Points" value={`${character.hitPoints.current} / ${character.hitPoints.max}`} />
                <InfoCard label="Armor Class" value={String(character.armorClass)} />
                <InfoCard label="Initiative" value={`+${character.initiative}`} />
                <InfoCard label="Hit Dice" value={character.hitDice || "—"} />
              </div>

              {/* Death Saves */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-surface-700 bg-surface-800/80 p-3">
                  <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">Death Save Successes</p>
                  <div className="mt-1.5 flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`h-5 w-5 rounded-full border-2 ${i < (character.deathSaves?.successes ?? 0) ? "bg-rogue-500 border-rogue-500" : "border-surface-600"}`} />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-surface-700 bg-surface-800/80 p-3">
                  <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">Death Save Failures</p>
                  <div className="mt-1.5 flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`h-5 w-5 rounded-full border-2 ${i < (character.deathSaves?.failures ?? 0) ? "bg-warrior-500 border-warrior-500" : "border-surface-600"}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Speed Detail */}
              <InfoCard label="Speed">
                <div className="flex flex-wrap gap-2 mt-1">
                  {character.speed?.walk !== undefined && <SpeedTag label="Walk" value={`${character.speed.walk}ft`} />}
                  {character.speed?.fly !== undefined && <SpeedTag label="Fly" value={`${character.speed.fly}ft`} />}
                  {character.speed?.swim !== undefined && <SpeedTag label="Swim" value={`${character.speed.swim}ft`} />}
                  {character.speed?.climb !== undefined && <SpeedTag label="Climb" value={`${character.speed.climb}ft`} />}
                  {character.speed?.burrow !== undefined && <SpeedTag label="Burrow" value={`${character.speed.burrow}ft`} />}
                  {character.speed?.canHover && <SpeedTag label="Hover" value="Yes" />}
                </div>
              </InfoCard>

              {/* Saving Throws */}
              <InfoCard label="Saving Throws">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1">
                  {ABILITY_ORDER.map((ability) => {
                    const save = character.savingThrows?.[ability];
                    const score = character[ability] ?? 10;
                    const baseMod = getAbilityMod(score);
                    const totalMod = baseMod + (save?.bonus ?? 0);
                    return (
                      <div key={ability} className={`flex items-center justify-between rounded px-2 py-1 text-xs ${save?.proficient ? "bg-mage-500/10 text-mage-300" : "bg-surface-800 text-surface-400"}`}>
                        <span className="font-medium">{ABILITY_SHORT[ability]}</span>
                        <span className={`font-bold ${save?.proficient ? "text-mage-300" : "text-surface-400"}`}>
                          {fmtMod(totalMod)}{save?.proficient ? "★" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </InfoCard>

              {/* Conditions */}
              {(character.conditions ?? []).length > 0 && (
                <InfoCard label="Active Conditions">
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(character.conditions ?? []).map((c, i) => (
                      <Badge key={i} variant="warning" size="xs">{c}</Badge>
                    ))}
                  </div>
                </InfoCard>
              )}

              {/* Equipment Summary */}
              <InfoCard label={`Equipment (${totalItems} items)`}>
                {totalItems === 0 ? (
                  <p className="text-xs text-surface-500 mt-1">No equipment recorded.</p>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(character.equipment ?? []).slice(0, 12).map((item, i) => (
                      <Badge key={`eq-${i}`} size="xs" variant="neutral">
                        {item.item}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
                      </Badge>
                    ))}
                    {(character.equipment ?? []).length > 12 && (
                      <Badge size="xs" variant="neutral">+{(character.equipment ?? []).length - 12} more</Badge>
                    )}
                  </div>
                )}
              </InfoCard>

              {/* Currency */}
              <InfoCard label="Currency">
                <div className="flex flex-wrap gap-3 mt-1 text-xs">
                  <CurrencyBadge label="PP" value={character.currency?.platinum ?? 0} color="text-cyan-300" />
                  <CurrencyBadge label="GP" value={character.currency?.gold ?? 0} color="text-yellow-400" />
                  <CurrencyBadge label="EP" value={character.currency?.electrum ?? 0} color="text-surface-300" />
                  <CurrencyBadge label="SP" value={character.currency?.silver ?? 0} color="text-surface-400" />
                  <CurrencyBadge label="CP" value={character.currency?.copper ?? 0} color="text-orange-400" />
                </div>
              </InfoCard>
            </>
          )}

          {/* ─── TAB: ABILITIES ─── */}
          {activeTab === "abilities" && (
            <>
              {/* Ability Scores */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {ABILITY_ORDER.map((ability) => {
                  const score = character[ability] ?? 10;
                  const mod = getAbilityMod(score);
                  return (
                    <div key={ability} className="rounded-xl border border-surface-700 bg-surface-800/80 p-3 text-center">
                      <p className="text-[9px] font-semibold text-surface-500 uppercase tracking-wider">{ABILITY_SHORT[ability]}</p>
                      <p className="text-2xl font-bold text-surface-100 mt-1">{score}</p>
                      <p className={`text-sm font-medium ${mod >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{fmtMod(mod)}</p>
                      <p className="text-[9px] text-surface-500 mt-1">{ABILITY_LONG[ability]}</p>
                    </div>
                  );
                })}
              </div>

              {/* Skills */}
              <InfoCard label="Skills">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                  {(Object.entries(SKILL_ABILITIES) as [string, Ability][]).map(([skill, ability]) => {
                    const proficiency = (character.skills as any)?.[skill] ?? "none";
                    const score = character[ability] ?? 10;
                    const baseMod = getAbilityMod(score);
                    const isProf = proficiency === "proficient";
                    const isExpert = proficiency === "expertise";
                    const totalMod = baseMod + (isProf ? character.proficiencyBonus : 0) + (isExpert ? character.proficiencyBonus * 2 : 0);
                    const dotColor = isExpert ? "bg-accent-400" : isProf ? "bg-rogue-400" : "bg-surface-600";
                    return (
                      <div key={skill} className={`flex items-center justify-between rounded px-2.5 py-1.5 text-xs ${
                        isProf || isExpert ? "bg-surface-800/80" : "bg-surface-800/40"
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                          <span className={`truncate ${isProf || isExpert ? "text-surface-200" : "text-surface-500"}`}>
                            {fmtSkillName(skill)}
                          </span>
                        </div>
                        <span className={`font-bold shrink-0 ml-2 ${isProf || isExpert ? "text-surface-200" : "text-surface-500"}`}>
                          {fmtMod(totalMod)}
                          {isExpert && <span className="text-accent-400 text-[9px] ml-0.5">★</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </InfoCard>

              {/* Proficiencies */}
              {(character.proficiencies ?? []).length > 0 && (
                <InfoCard label="Proficiencies">
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(character.proficiencies ?? []).map((p, i) => (
                      <Badge key={i} size="xs" variant={p.type === "armor" ? "warrior" : p.type === "weapon" ? "rogue" : p.type === "tool" ? "mage" : "neutral"}>
                        {p.name}{p.notes ? ` (${p.notes})` : ""}
                      </Badge>
                    ))}
                  </div>
                </InfoCard>
              )}

              {/* Languages */}
              {(character.languages ?? []).length > 0 && (
                <InfoCard label="Languages">
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(character.languages ?? []).map((lang, i) => (
                      <Badge key={i} size="xs" variant="accent">{lang}</Badge>
                    ))}
                  </div>
                </InfoCard>
              )}
            </>
          )}

          {/* ─── TAB: FEATURES ─── */}
          {activeTab === "features" && (
            <>
              {/* Features & Traits */}
              {(character.features ?? []).length > 0 && (
                <InfoCard label={`Features & Traits (${character.features.length})`}>
                  <div className="space-y-2 mt-1">
                    {(character.features ?? []).map((feat, i) => {
                      const name = typeof feat === "string" ? feat : feat.name;
                      const desc = typeof feat === "string" ? "" : feat.description;
                      const source = typeof feat === "string" ? "" : feat.source;
                      return (
                        <div key={i} className="rounded-lg border border-surface-700/50 bg-surface-800/60 p-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-surface-200">{name}</p>
                            {source && <span className="shrink-0 text-[9px] text-surface-500">{source}</span>}
                          </div>
                          {desc && <p className="mt-1 text-[11px] text-surface-400 leading-relaxed">{desc}</p>}
                        </div>
                      );
                    })}
                  </div>
                </InfoCard>
              )}

              {/* Traits (personality) */}
              {(character.traits ?? []).length > 0 && (
                <InfoCard label="Traits">
                  <div className="space-y-1.5 mt-1">
                    {(character.traits ?? []).map((trait, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-surface-300">
                        <span className="mt-0.5 text-surface-500">•</span>
                        <span>{typeof trait === "string" ? trait : trait.name}</span>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              )}

              {/* Spellcasting */}
              {character.spellcasting && (
                <InfoCard label="Spellcasting">
                  <div className="space-y-2 mt-1">
                    <div className="flex gap-3 text-xs">
                      <span className="text-surface-400">Ability: <span className="text-surface-200 font-medium">{ABILITY_LONG[character.spellcasting.spellcastingAbility]}</span></span>
                      <span className="text-surface-400">Save DC: <span className="text-surface-200 font-medium">{character.spellcasting.spellSaveDC}</span></span>
                      <span className="text-surface-400">Attack Bonus: <span className="text-surface-200 font-medium">+{character.spellcasting.spellAttackBonus}</span></span>
                    </div>
                    {character.spellcasting.spellSlots && (
                      <div className="flex flex-wrap gap-1.5">
                        {([1,2,3,4,5,6,7,8,9] as const).map((lvl) => {
                          const slots = (character.spellcasting!.spellSlots as any)?.[`level${lvl}`];
                          if (!slots || slots.max === 0) return null;
                          const used = slots.used || 0;
                          return (
                            <div key={lvl} className="rounded bg-mage-500/10 px-2 py-1 text-[10px]">
                              <span className="text-mage-400 font-medium">Lvl{lvl}</span>
                              <span className="text-surface-400 ml-1">{used}/{slots.max}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </InfoCard>
              )}

              {/* Resources (Ki, Bardic Inspiration, etc.) */}
              {(character.resources ?? []).length > 0 && (
                <InfoCard label="Resources">
                  <div className="space-y-1.5 mt-1">
                    {(character.resources ?? []).map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-surface-300">{r.name}</span>
                        <span className="text-surface-200 font-medium">{r.current}/{r.max} <span className="text-surface-500 text-[9px]">({r.recharge})</span></span>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              )}
            </>
          )}

          {/* ─── TAB: BIO ─── */}
          {activeTab === "bio" && (
            <>
              {/* Personality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {character.personalityTraits && <InfoCard label="Personality Traits" value={character.personalityTraits} />}
                {character.ideals && <InfoCard label="Ideals" value={character.ideals} />}
                {character.bonds && <InfoCard label="Bonds" value={character.bonds} />}
                {character.flaws && <InfoCard label="Flaws" value={character.flaws} />}
              </div>

              {/* Appearance */}
              {character.appearance && (
                <InfoCard label="Appearance" value={character.appearance} />
              )}

              {/* Backstory */}
              {character.backstory && (
                <InfoCard label="Backstory">
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-surface-300">{character.backstory}</p>
                </InfoCard>
              )}

              {/* Allies & Organizations */}
              {character.allies && (
                <InfoCard label="Allies & Organizations" value={character.allies} />
              )}

              {/* DM Notes */}
              {character.characterNotes && (
                <InfoCard label="DM Notes">
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-surface-400 italic">{character.characterNotes}</p>
                </InfoCard>
              )}

              {/* XP & Inspiration */}
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Experience Points" value={`${character.experiencePoints ?? 0} XP`} />
                <InfoCard label="Inspiration" value={character.inspiration ? "✨ Yes" : "—"} />
              </div>
            </>
          )}
        </div>

        {/* ════════ FOOTER ════════ */}
        <div className="shrink-0 flex items-center justify-end gap-2 border-t border-surface-700/60 bg-surface-900/30 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onOpenInventory}>🎒 Inventory</Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>✏️ Edit</Button>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>

      {/* ── Fullscreen Portrait ── */}
      {showFullscreen && character.imageUrl && (
        <FullscreenImageModal
          src={character.imageUrl}
          alt={`${character.name} portrait`}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </div>
  );
}

/* ── Helper components ──────────────────────────────────────── */

function SpeedTag({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-surface-800 px-2.5 py-0.5 text-[10px] font-medium text-surface-300 ring-1 ring-surface-700">
      {label} {value}
    </span>
  );
}

function CurrencyBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={color}>●</span>
      <span className="text-surface-300">{value}</span>
      <span className="text-surface-500">{label}</span>
    </span>
  );
}
