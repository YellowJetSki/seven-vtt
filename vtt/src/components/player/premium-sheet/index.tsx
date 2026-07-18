/* ══════════════════════════════════════════════════════════════
   STᚱ VTT — D&D 5e Premium Character Sheet
   Complete combat-at-a-glance player dashboard with:
   • Weapon attacks with computed to-hit, damage dice, ability
   • Spellcasting with computed DC/ATK from class/spell stat
   • Full ability scores with saving throw bonuses
   • All 18 skill proficiencies with bonuses
   • Class resources, hit dice, death saves, speed, conditions
   ══════════════════════════════════════════════════════════════ */

import type { PlayerCharacter, Ability } from "@/types";

const ABILITIES: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABIL_LABELS: Record<Ability, string> = { strength: "STR", dexterity: "DEX", constitution: "CON", intelligence: "INT", wisdom: "WIS", charisma: "CHA" };
const ABIL_FULL: Record<Ability, string> = { strength: "Str", dexterity: "Dex", constitution: "Con", intelligence: "Int", wisdom: "Wis", charisma: "Cha" };
const ABIL_NAMES: Record<Ability, string> = { strength: "Strength", dexterity: "Dexterity", constitution: "Constitution", intelligence: "Intelligence", wisdom: "Wisdom", charisma: "Charisma" };

export function mod(score: number): number { return Math.floor((score - 10) / 2); }
export function modStr(score: number): string { const m = mod(score); return m >= 0 ? `+${m}` : `${m}`; }
export function pb(level: number): number { return Math.ceil(1 + level / 4); }

const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

/* ── D&D 5e Combat Math Engine ─────────────────────────────── */

const WEAPON_DB: Record<string, { dice: string; type: "slashing" | "piercing" | "bludgeoning"; versatile?: string; props: string[] }> = {
  quarterstaff: { dice: "1d6", type: "bludgeoning", versatile: "1d8", props: ["versatile"] },
  longsword: { dice: "1d8", type: "slashing", versatile: "1d10", props: ["versatile"] },
  shortsword: { dice: "1d6", type: "piercing", props: ["finesse", "light"] },
  scimitar: { dice: "1d6", type: "slashing", props: ["finesse", "light"] },
  rapier: { dice: "1d8", type: "piercing", props: ["finesse"] },
  dagger: { dice: "1d4", type: "piercing", props: ["finesse", "light", "thrown"] },
  handaxe: { dice: "1d6", type: "slashing", props: ["light", "thrown"] },
  battleaxe: { dice: "1d8", type: "slashing", versatile: "1d10", props: ["versatile"] },
  greataxe: { dice: "1d12", type: "slashing", props: ["heavy", "two-handed"] },
  greatsword: { dice: "2d6", type: "slashing", props: ["heavy", "two-handed"] },
  mace: { dice: "1d6", type: "bludgeoning", props: [] },
  warhammer: { dice: "1d8", type: "bludgeoning", versatile: "1d10", props: ["versatile"] },
  club: { dice: "1d4", type: "bludgeoning", props: ["light"] },
  spear: { dice: "1d6", type: "piercing", versatile: "1d8", props: ["versatile", "thrown"] },
  longbow: { dice: "1d8", type: "piercing", props: ["heavy", "two-handed", "ranged"] },
  shortbow: { dice: "1d6", type: "piercing", props: ["two-handed", "ranged"] },
  crossbow: { dice: "1d8", type: "piercing", props: ["two-handed", "ranged", "loading"] },
  whip: { dice: "1d4", type: "slashing", props: ["finesse", "reach"] },
  sickle: { dice: "1d4", type: "slashing", props: ["light"] },
  dart: { dice: "1d4", type: "piercing", props: ["finesse", "thrown"] },
  javelin: { dice: "1d6", type: "piercing", props: ["thrown"] },
  sling: { dice: "1d4", type: "bludgeoning", props: ["ranged"] },
};

export function computeAttacks(equipment: { item: string; notes?: string }[], str: number, dex: number, profBonus: number): WeaponAttack[] {
  const seen = new Set<string>();
  const result: WeaponAttack[] = [];
  for (const eq of equipment) {
    const lower = eq.item.toLowerCase().trim();
    for (const [key, data] of Object.entries(WEAPON_DB)) {
      if (lower.includes(key) && !seen.has(key)) {
        seen.add(key);
        const ranged = data.props.includes("ranged") || data.props.includes("thrown");
        const finesse = data.props.includes("finesse");
        const atkStat: Ability = ranged && dex > str ? "dexterity" : finesse && dex > str ? "dexterity" : ranged ? "dexterity" : "strength";
        const abilMod = mod(atkStat === "dexterity" ? dex : str);
        result.push({
          name: eq.item.split("(")[0].trim().replace(/\s*\d+$/, "").trim(),
          dice: data.dice,
          type: data.type,
          atkBonus: abilMod + profBonus,
          dmgBonus: abilMod,
          ability: ABIL_FULL[atkStat],
          range: ranged ? "Ranged" : "Melee",
          properties: data.props,
          versatile: data.versatile ? `${data.versatile} ${data.dice}` : null,
          finesse,
        });
      }
    }
    // Try parsing damage from notes
    if (!lower.includes("potion") && !lower.includes("book") && !lower.includes("pack") && !lower.includes("kit")) {
      const diceMatch = lower.match(/(\d+)d(\d+)/) || eq.notes?.match(/(\d+)d(\d+)/);
      if (diceMatch && !seen.has(lower.split(" ")[0])) {
        seen.add(lower.split(" ")[0]);
        const atkStat: Ability = lower.includes("shuriken") || lower.includes("bow") || lower.includes("dart") ? "dexterity" : "strength";
        const abilMod = mod(atkStat === "dexterity" ? dex : str);
        result.push({
          name: eq.item.split("(")[0].trim(),
          dice: diceMatch[0],
          type: lower.includes("shuriken") ? "piercing" : "bludgeoning",
          atkBonus: abilMod + profBonus,
          dmgBonus: abilMod,
          ability: ABIL_FULL[atkStat],
          range: lower.includes("shuriken") || lower.includes("bow") || lower.includes("thrown") ? "Ranged" : "Melee",
          properties: lower.includes("shuriken") ? ["finesse", "thrown"] : [],
          versatile: null,
          finesse: lower.includes("shuriken"),
        });
      }
    }
  }
  // Add unarmed strike
  result.push({
    name: "Unarmed Strike",
    dice: "1d1",
    type: "bludgeoning",
    atkBonus: mod(dex > str ? dex : str) + profBonus,
    dmgBonus: mod(dex > str ? dex : str),
    ability: dex > str ? "Dex" : "Str",
    range: "Melee",
    properties: [],
    versatile: null,
    finesse: false,
  });
  return result;
}

function getSpellAbility(character: PlayerCharacter): Ability {
  const c = (character.classes?.[0]?.name || character.class).toLowerCase();
  if (c === "wizard" || c === "artificer") return "intelligence";
  if (c === "cleric" || c === "druid" || c === "ranger" || c === "paladin") return "wisdom";
  if (c === "sorcerer" || c === "bard" || c === "warlock") return "charisma";
  if (c === "monk") return "wisdom";
  return "intelligence";
}

/* ── Shared Types ──────────────────────────────────────────── */

interface WeaponAttack { name: string; dice: string; type: string; atkBonus: number; dmgBonus: number; ability: string; range: string; properties: string[]; versatile: string | null; finesse: boolean; }

const DMG_ICONS: Record<string, string> = { slashing: "⚔️", piercing: "🏹", bludgeoning: "🔨", fire: "🔥", cold: "❄️", lightning: "⚡", acid: "🧪", poison: "☠️", necrotic: "💀", radiant: "✨", force: "💥", psychic: "🧠" };

function raceIcon(race: string): string {
  if (race.includes("Dragon")) return "🐉"; if (race.includes("Elf")) return "🧝"; if (race.includes("Dwarf")) return "⛰️";
  if (race.includes("Halfl")) return "🏠"; if (race.includes("Gnome")) return "🪄"; if (race.includes("Orc")) return "💪";
  if (race.includes("Tief")) return "🔮"; if (race.includes("Aasimar")) return "👼"; if (race.includes("Half-Elf")) return "🧝‍♂️";
  if (race.includes("Half-Orc")) return "💪"; if (race.includes("Human")) return "🧑";
  return "🧙";
}

/* ── Section Wrapper ─────────────────────────────────────── */
function Section({ title, icon, children, className = "", action }: { title: string; icon?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`premium-card rounded-xl border border-surface-700/60 bg-surface-850/80 backdrop-blur-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/40">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-surface-400">{icon && `${icon} `}{title}</h3>
        {action}
      </div>
      <div className="p-4">
        {children}
      </div>
    </section>
  );
}

/* ── 1. Portrait Section ───────────────────────────────────── */
export function PortraitSection({ character }: { character: PlayerCharacter }) {
  const hpPct = character.hitPoints.max > 0 ? (character.hitPoints.current / character.hitPoints.max) * 100 : 0;
  const ringColor = hpPct > 50 ? "stroke-rogue-500" : hpPct > 25 ? "stroke-warrior-500" : "stroke-warrior-600";
  return (
    <div className="premium-card flex flex-col items-center rounded-xl border border-surface-700/60 bg-surface-850/80 backdrop-blur-sm p-4 w-32 shrink-0">
      {/* HP Ring */}
      <div className="relative mb-2">
        <svg className="absolute inset-0 h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle cx="40" cy="40" r="36" fill="none" className={ringColor} strokeWidth="3" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - hpPct / 100)}`} strokeLinecap="round" />
        </svg>
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-surface-800 to-surface-850 ring-2 ring-surface-700/30">
          <span className="text-3xl">{raceIcon(character.race)}</span>
        </div>
      </div>
      <p className="text-xs font-bold text-surface-100 text-center leading-tight">{character.name}</p>
      <p className="text-[9px] text-surface-500 text-center mt-0.5">{character.race}</p>
      <p className="text-[9px] text-accent-400 text-center font-medium">{character.classes?.[0]?.name || character.class} {character.level}</p>
      <p className="text-[8px] text-surface-600 mt-0.5">{character.playerName}</p>
      <p className="text-[10px] text-surface-400 font-mono mt-1">{character.hitPoints.current}/{character.hitPoints.max} HP</p>
    </div>
  );
}

/* ── 2. Primary Stats Row ──────────────────────────────────── */
export function PrimaryStatsRow({ character }: { character: PlayerCharacter }) {
  const p = pb(character.level);
  const items = [
    { label: "Level", value: String(character.level), color: "text-accent-400" },
    { label: "Armor Class", value: String(character.armorClass), color: "text-mage-400" },
    { label: "Initiative", value: modStr(character.initiative || character.dexterity), color: "text-rogue-400" },
    { label: "Prof Bonus", value: `+${p}`, color: "text-divine-400" },
    { label: "Speed", value: `${character.speed?.walk || 30}ft`, color: "text-warrior-400" },
    { label: "Hit Dice", value: character.hitDice || "d8", color: "text-surface-300" },
    { label: "Passive Perc", value: String(10 + mod(character.wisdom) + (character.skills?.perception === "proficient" ? p : 0)), color: "text-rogue-400" },
    { label: "Passive Inv", value: String(10 + mod(character.intelligence) + (character.skills?.investigation === "proficient" ? p : 0)), color: "text-mage-400" },
  ];
  return (
    <div className="premium-stat-row grid grid-cols-4 gap-2">
      {items.map(item => (
        <div key={item.label} className="premium-stat rounded-xl border border-surface-700/40 bg-surface-800/50 p-2.5 text-center">
          <p className="text-[8px] font-medium uppercase tracking-widest text-surface-500">{item.label}</p>
          <p className={`mt-0.5 text-lg font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── 3. HP Bar ───────────────────────────────────────────────── */
export function HpBarSection({ character, hpPercent, onEditHp }: { character: PlayerCharacter; hpPercent: number; onEditHp: () => void }) {
  const barColor = hpPercent > 50 ? "var(--color-rogue-500)" : hpPercent > 25 ? "var(--color-divine-500)" : "var(--color-warrior-500)";
  const barGlow = hpPercent > 50 ? "rgba(39,174,96,0.3)" : hpPercent > 25 ? "rgba(243,156,18,0.3)" : "rgba(231,76,60,0.3)";
  return (
    <div className="premium-hp-section space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-surface-300">Hit Points</span>
        <button onClick={onEditHp} className="text-[11px] text-accent-400 hover:text-accent-300 transition-colors cursor-pointer">
          {character.hitPoints.current} / {character.hitPoints.max}
          {character.hitPoints.temporary > 0 && ` (+${character.hitPoints.temporary} temp)`}
        </button>
      </div>
      <div className="relative h-4 overflow-hidden rounded-full bg-surface-800/80 ring-1 ring-surface-700/50 cursor-pointer" onClick={onEditHp}>
        <div className="h-full rounded-full transition-all duration-500 ease-out premium-hp-bar" style={{
          width: `${Math.max(0, Math.min(100, hpPercent))}%`,
          background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`,
          boxShadow: `0 0 12px ${barGlow}`,
        }} />
        {character.hitPoints.temporary > 0 && (
          <div className="absolute inset-y-0 right-0 rounded-full bg-amber-400/20 ring-1 ring-amber-400/30" style={{ width: `${Math.min(100, (character.hitPoints.temporary / character.hitPoints.max) * 100)}%` }} />
        )}
      </div>
    </div>
  );
}

/* ── 4. XP Progress ─────────────────────────────────────────── */
export function XpProgressSection({ character, onEditXp }: { character: PlayerCharacter; onEditXp: () => void }) {
  const xp = character.experiencePoints ?? 0;
  const lvl = character.level;
  const ct = XP_THRESHOLDS[lvl - 1] || 0;
  const nt = XP_THRESHOLDS[lvl] || ct + 1000;
  const prog = nt > ct ? ((xp - ct) / (nt - ct)) * 100 : 0;
  const toNext = nt - xp;
  return (
    <Section title="Experience" icon="⭐" action={
      <button onClick={onEditXp} className="text-[10px] text-accent-400 hover:text-accent-300 cursor-pointer">Edit</button>
    }>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-surface-400">Level {lvl}</span>
          <span className="text-surface-300 font-medium">{xp.toLocaleString()} XP</span>
          <span className="text-surface-500">{toNext > 0 ? `${toNext.toLocaleString()} to next` : "Ready!"}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-800/80 ring-1 ring-surface-700/30">
          <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-mage-400 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, prog))}%` }} />
        </div>
      </div>
    </Section>
  );
}

/* ── 5. Speed & Movement ────────────────────────────────────── */
export function SpeedBreakdown({ character }: { character: PlayerCharacter }) {
  const s = character.speed || { walk: 30 };
  const speeds = [
    { label: "Walk", value: s.walk }, { label: "Fly", value: s.fly }, { label: "Swim", value: s.swim },
    { label: "Climb", value: s.climb }, { label: "Burrow", value: s.burrow },
  ].filter(sp => sp.value);
  const sprintCells = Math.floor((s.walk * 2) / 5);
  return (
    <Section title="Movement" icon="🏃">
      <div className="space-y-1">
        {speeds.map(sp => (
          <div key={sp.label} className="flex justify-between items-center">
            <span className="text-[10px] text-surface-400">{sp.label}</span>
            <span className="text-xs font-bold text-surface-200">{sp.value}ft</span>
          </div>
        ))}
        {speeds.length === 0 && <p className="text-[10px] text-surface-500">—</p>}
        {s.canHover && <p className="text-[9px] text-mage-400 italic">(hover)</p>}
        <div className="mt-1.5 pt-1.5 border-t border-surface-700/40">
          <p className="text-[10px] text-surface-500">
            <span className="text-rogue-400">{s.walk}ft</span> per turn · Dash: <span className="text-warrior-400">{s.walk * 2}ft</span> · Grid: <span className="text-mage-400">{Math.floor(s.walk / 5)}</span> cells
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ── 6. Conditions ─────────────────────────────────────────── */
export function ConditionsSection({ conditions }: { conditions: string[] }) {
  const condMeta: Record<string, { icon: string; color: string; desc: string }> = {
    blinded: { icon: "👁️‍🗨️", color: "bg-warrior-500/15 text-warrior-400 ring-warrior-500/20", desc: "Auto-fail Perception, attacks at disadvantage" },
    charmed: { icon: "💕", color: "bg-mage-500/15 text-mage-400 ring-mage-500/20", desc: "Can't attack the charmer" },
    deafened: { icon: "🔇", color: "bg-surface-700/30 text-surface-400 ring-surface-700/30", desc: "Auto-fail hearing Perception" },
    exhaustion: { icon: "😫", color: "bg-divine-500/15 text-divine-400 ring-divine-500/20", desc: "Cumulative debuffs" },
    frightened: { icon: "😨", color: "bg-mage-500/15 text-mage-400 ring-mage-500/20", desc: "Disadvantage on ability checks & attacks" },
    grappled: { icon: "🤝", color: "bg-rogue-500/15 text-rogue-400 ring-rogue-500/20", desc: "Speed becomes 0" },
    incapacitated: { icon: "🌀", color: "bg-warrior-500/15 text-warrior-400 ring-warrior-500/20", desc: "No actions or reactions" },
    invisible: { icon: "👻", color: "bg-divine-500/15 text-divine-400 ring-divine-500/20", desc: "Attacks at advantage" },
    paralyzed: { icon: "🧊", color: "bg-warrior-500/15 text-warrior-400 ring-warrior-500/20", desc: "Auto-fail STR/DEX saves" },
    petrified: { icon: "🗿", color: "bg-warrior-600/20 text-warrior-500 ring-warrior-600/20", desc: "Turned to stone" },
    poisoned: { icon: "☠️", color: "bg-warrior-500/15 text-warrior-400 ring-warrior-500/20", desc: "Disadvantage on attacks & ability checks" },
    prone: { icon: "🙃", color: "bg-rogue-500/15 text-rogue-400 ring-rogue-500/20", desc: "Disadvantage on attacks, melee at advantage" },
    restrained: { icon: "⛓️", color: "bg-rogue-500/15 text-rogue-400 ring-rogue-500/20", desc: "Attacks at disadvantage, DEX saves at disadvantage" },
    stunned: { icon: "💫", color: "bg-warrior-500/15 text-warrior-400 ring-warrior-500/20", desc: "No actions, auto-fail STR/DEX saves" },
    unconscious: { icon: "💤", color: "bg-warrior-600/20 text-warrior-500 ring-warrior-600/20", desc: "Incapacitated, auto-fail DEX saves" },
    concentrating: { icon: "🧘", color: "bg-accent-500/15 text-accent-400 ring-accent-500/20", desc: "Concentrating on a spell" },
  };
  return (
    <Section title="Conditions & Status" icon="🔮">
      <div className="flex flex-wrap gap-1.5">
        {conditions.length === 0 ? (
          <span className="text-[10px] text-rogue-500 flex items-center gap-1">✓ Clear</span>
        ) : conditions.map(c => {
          const m = condMeta[c.toLowerCase()] || { icon: "❓", color: "bg-surface-700/30 text-surface-400 ring-surface-700/30", desc: "" };
          return (
            <div key={c} className="group relative">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ring-1 ${m.color}`}>
                {m.icon} {c}
              </span>
              {m.desc && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 w-48 rounded-lg bg-surface-800 p-2 shadow-xl border border-surface-700">
                  <p className="text-[9px] text-surface-300">{m.desc}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── 8. Ability Score Grid ──────────────────────────────────── */
export function AbilityScoreGrid({ character }: { character: PlayerCharacter }) {
  const p = pb(character.level);
  return (
    <Section title="Ability Scores">
      <div className="grid grid-cols-6 gap-2">
        {ABILITIES.map(abil => {
          const score = character[abil];
          const m = mod(score);
          const save = character.savingThrows?.[abil];
          const proficient = save?.proficient || false;
          const saveTotal = proficient ? m + p : m;
          return (
            <div key={abil} className="rounded-xl bg-gradient-to-b from-surface-800 to-surface-800/60 p-2.5 text-center ring-1 ring-surface-700/30">
              <p className="text-[9px] font-bold uppercase tracking-wider text-surface-500">{ABIL_LABELS[abil]}</p>
              <p className="mt-0.5 text-xl font-bold text-surface-100">{score}</p>
              <p className={`text-sm font-bold ${m >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{modStr(m)}</p>
              <div className={`mt-1 flex items-center justify-center gap-1 rounded ${proficient ? "bg-rogue-500/10" : "bg-surface-700/30"} px-1.5 py-0.5`}>
                {proficient && <span className="h-1 w-1 rounded-full bg-rogue-500" />}
                <span className={`text-[9px] font-mono ${proficient ? "text-rogue-400 font-bold" : "text-surface-500"}`}>
                  Save {saveTotal >= 0 ? "+" : ""}{saveTotal}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── 9. Saving Throws ───────────────────────────────────────── */
export function SavingThrowsSection({ character }: { character: PlayerCharacter }) {
  const p = pb(character.level);
  return (
    <Section title="Saving Throws">
      <div className="space-y-1">
        {ABILITIES.map(abil => {
          const score = character[abil];
          const st = character.savingThrows?.[abil];
          const proficient = st?.proficient || false;
          const total = proficient ? mod(score) + p : mod(score);
          return (
            <div key={abil} className="flex items-center justify-between rounded-lg bg-surface-800/50 px-3 py-2 hover:bg-surface-800/80 transition-colors">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${proficient ? "bg-rogue-500/20 ring-1 ring-rogue-500/30" : "bg-surface-700/30"}`}>
                  <span className={`text-[9px] font-bold ${proficient ? "text-rogue-400" : "text-surface-500"}`}>{ABIL_LABELS[abil]}</span>
                </div>
                <span className="text-[10px] text-surface-500">{ABIL_NAMES[abil]}</span>
              </div>
              <div className="flex items-center gap-2">
                {proficient && <span className="text-[8px] text-rogue-500/60 font-medium">PROF</span>}
                <span className={`text-sm font-mono font-bold ${total >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{total >= 0 ? "+" : ""}{total}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── 10. Skills ──────────────────────────────────────────────── */
export function SkillsSection({ character }: { character: PlayerCharacter }) {
  const p = pb(character.level);
  const skillEntries = [
    { key: "acrobatics", label: "Acrobatics", abil: "dexterity" as const },
    { key: "animalHandling", label: "Animal Handling", abil: "wisdom" as const },
    { key: "arcana", label: "Arcana", abil: "intelligence" as const },
    { key: "athletics", label: "Athletics", abil: "strength" as const },
    { key: "deception", label: "Deception", abil: "charisma" as const },
    { key: "history", label: "History", abil: "intelligence" as const },
    { key: "insight", label: "Insight", abil: "wisdom" as const },
    { key: "intimidation", label: "Intimidation", abil: "charisma" as const },
    { key: "investigation", label: "Investigation", abil: "intelligence" as const },
    { key: "medicine", label: "Medicine", abil: "wisdom" as const },
    { key: "nature", label: "Nature", abil: "intelligence" as const },
    { key: "perception", label: "Perception", abil: "wisdom" as const },
    { key: "performance", label: "Performance", abil: "charisma" as const },
    { key: "persuasion", label: "Persuasion", abil: "charisma" as const },
    { key: "religion", label: "Religion", abil: "intelligence" as const },
    { key: "sleightOfHand", label: "Sleight of Hand", abil: "dexterity" as const },
    { key: "stealth", label: "Stealth", abil: "dexterity" as const },
    { key: "survival", label: "Survival", abil: "wisdom" as const },
  ];
  const skills = character.skills || {};
  return (
    <Section title="Skills" icon="🎯">
      <div className="grid grid-cols-1 gap-0.5">
        {skillEntries.map(sk => {
          const prof = skills[sk.key as keyof typeof skills] || "none";
          const bonus = prof === "expertise" ? mod(character[sk.abil]) + p * 2 : prof === "proficient" ? mod(character[sk.abil]) + p : mod(character[sk.abil]);
          const profLabel = prof === "expertise" ? "EXP" : prof === "proficient" ? "PROF" : "";
          return (
            <div key={sk.key} className="flex items-center justify-between rounded-md px-2.5 py-1 hover:bg-surface-800/40 transition-colors">
              <div className="flex items-center gap-1.5">
                {prof !== "none" && (
                  <span className="flex items-center gap-0.5">
                    {prof === "proficient" && <span className="h-1.5 w-1.5 rounded-full bg-rogue-500" />}
                    {prof === "expertise" && <span className="h-1.5 w-1.5 rounded-full bg-divine-500" />}
                  </span>
                )}
                <span className={`text-[11px] ${prof !== "none" ? "font-medium text-surface-200" : "text-surface-400"}`}>{sk.label}</span>
                {profLabel && <span className="text-[7px] text-surface-500 ml-0.5">({profLabel})</span>}
              </div>
              <span className={`text-[11px] font-mono font-bold ${bonus >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{bonus >= 0 ? "+" : ""}{bonus}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── 11. Weapons ────────────────────────────────────────────── */
export function WeaponsSection({ weapons }: { weapons: WeaponAttack[] }) {
  if (!weapons || weapons.length === 0) return null;
  return (
    <Section title="Weapon Attacks" icon="⚔️">
      <div className="space-y-2">
        {weapons.map((w, i) => (
          <div key={i} className="rounded-xl bg-gradient-to-r from-surface-800/80 to-surface-800/40 p-3 ring-1 ring-surface-700/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-surface-100">{w.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-700/50 text-surface-400">{w.range}</span>
                {w.finesse && <span className="text-[9px] text-rogue-400">(Finesse)</span>}
              </div>
              <span className={`text-xl ${DMG_ICONS[w.type] ? "" : ""}`}>{DMG_ICONS[w.type] || "⚔️"}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="rounded-lg bg-rogue-500/15 px-2.5 py-1 font-bold text-rogue-400">ATK +{w.atkBonus}</span>
              <span className="text-surface-200 font-medium">{w.dice}</span>
              <span className="text-surface-500">+ {w.dmgBonus} ({w.ability})</span>
              {w.versatile && <span className="text-surface-500 text-[10px]">Versatile: {w.versatile}</span>}
            </div>
            {w.properties.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {w.properties.map(prop => (
                  <span key={prop} className="rounded bg-surface-700/40 px-1.5 py-0.5 text-[8px] text-surface-500">{prop}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── 12. Spellcasting ───────────────────────────────────────── */
export function SpellcastingSection({ character }: { character: PlayerCharacter }) {
  const spellStat = getSpellAbility(character);
  const spellScore = character[spellStat];
  const p = pb(character.level);
  const dc = 8 + p + mod(spellScore);
  const atk = p + mod(spellScore);
  const slots = character.spellSlots || character.spellcasting?.spellSlots;
  const hasSlots = slots && Object.entries(slots).some(([, v]) => (v as any).max > 0);
  const spells = character.spellcasting?.spells || [];
  const prepared = character.spellcasting?.preparedSpells || [];

  if (!hasSlots && spells.length === 0) return null;

  const classList = character.classes?.map(c => c.name).join(", ") || character.class;
  const abilityName = ABIL_NAMES[spellStat];

  return (
    <Section title="Spellcasting" icon="✨">
      {/* Spellcasting Header */}
      <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-surface-700/30">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-surface-400">Ability:</span>
          <span className="rounded-lg bg-accent-500/10 px-2 py-0.5 text-xs font-bold text-accent-400">{abilityName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-surface-400">DC:</span>
          <span className="text-sm font-bold text-mage-400">{dc}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-surface-400">ATK:</span>
          <span className="text-sm font-bold text-rogue-400">+{atk}</span>
        </div>
        <span className="text-[9px] text-surface-500">({classList})</span>
      </div>

      {/* Spell Slots */}
      {slots && (
        <div className="mb-3">
          <p className="text-[9px] text-surface-500 uppercase tracking-wider mb-1.5 font-semibold">Spell Slots</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Object.entries(slots).map(([level, s]) => {
              const slot = s as any;
              if (slot.max <= 0) return null;
              const pct = slot.max > 0 ? ((slot.max - (slot.used || 0)) / slot.max) * 100 : 0;
              return (
                <div key={level} className="rounded-lg bg-surface-800/60 p-2 text-center ring-1 ring-surface-700/20">
                  <p className="text-[8px] text-surface-500 font-medium uppercase">Lv {level.replace("level", "")}</p>
                  <div className="mt-1.5 h-2 rounded-full bg-surface-700 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-mage-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-0.5 text-[10px] font-mono text-surface-300">{slot.max - (slot.used || 0)}/{slot.max}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Known / Prepared Spells */}
      {spells.length > 0 && (
        <div>
          <p className="text-[9px] text-surface-500 uppercase tracking-wider mb-1.5 font-semibold">
            {character.spellcasting?.preparedSpells ? "Prepared Spells" : "Known Spells"} ({spells.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {spells.map((spell: any) => {
              const isPrepared = prepared.length === 0 || prepared.includes(spell.name);
              return (
                <div key={spell.id || spell.name} className="group relative">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1 transition-colors ${
                    isPrepared ? "bg-accent-500/10 text-accent-400 ring-accent-500/20" : "bg-surface-700/30 text-surface-500 ring-surface-700/30 line-through opacity-60"
                  }`}>
                    {spell.name}{spell.level > 0 ? ` (Lv${spell.level})` : " (Cantrip)"}
                  </span>
                  {spell.uses && (
                    <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warrior-500 text-[7px] font-bold text-white shadow-sm">
                      {spell.uses.max - spell.uses.current}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Section>
  );
}

/* ── 13. Resources ──────────────────────────────────────────── */
export function ResourcesSection({ character }: { character: PlayerCharacter }) {
  const resources = character.resources || [];
  const features = character.features || [];
  const featuresWithUses = features.filter((f: any) => f.uses);
  if (resources.length === 0 && featuresWithUses.length === 0) return null;
  return (
    <Section title="Class Resources & Features" icon="🔋">
      <div className="space-y-2">
        {resources.map((r: any, i: number) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-surface-800/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-surface-200">{r.name || r.label || `Resource ${i + 1}`}</span>
              {r.recharge && (
                <span className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${
                  r.recharge === "short" ? "bg-rogue-500/15 text-rogue-400" : 
                  r.recharge === "long" ? "bg-mage-500/15 text-mage-400" : "bg-surface-700/50 text-surface-400"
                }`}>{r.recharge === "short" ? "SR" : r.recharge === "long" ? "LR" : r.recharge}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 rounded-full bg-surface-700 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-mage-400" style={{ width: `${r.max > 0 ? (r.current / r.max) * 100 : 0}%` }} />
              </div>
              <span className="text-[10px] font-mono font-bold text-surface-300">{r.current}/{r.max}</span>
            </div>
          </div>
        ))}
        {/* Features with uses */}
        {featuresWithUses.map((feat: any, i: number) => (
          <div key={`feat-${i}`} className="flex items-center justify-between rounded-lg bg-accent-500/5 px-3 py-2 ring-1 ring-accent-500/10">
            <span className="text-[11px] font-medium text-accent-300">{feat.name}</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-12 rounded-full bg-surface-700 overflow-hidden">
                <div className="h-full rounded-full bg-accent-500" style={{ width: `${feat.uses.max > 0 ? (feat.uses.current / feat.uses.max) * 100 : 0}%` }} />
              </div>
              <span className="text-[10px] font-mono font-bold text-accent-400">{feat.uses.current}/{feat.uses.max}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── 14. Inventory ──────────────────────────────────────────── */
export function InventorySection({ character, onEdit }: { character: PlayerCharacter; onEdit: () => void }) {
  const equipment = character.equipment || [];
  const inventory = character.inventory || [];
  return (
    <Section title="Equipment & Inventory" icon="🎒" action={
      <button onClick={onEdit} className="text-[10px] text-accent-400 hover:text-accent-300 cursor-pointer">Edit</button>
    }>
      {equipment.length === 0 && inventory.length === 0 ? (
        <p className="text-[11px] text-surface-500">Empty</p>
      ) : (
        <div className="space-y-1.5">
          {equipment.map((item: any, i: number) => (
            <div key={`eq-${i}`} className="flex items-center justify-between rounded-lg bg-surface-800/50 px-2.5 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[9px] text-surface-500 shrink-0">•</span>
                <p className="text-[11px] text-surface-200 truncate">{item.item}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.quantity > 1 && <span className="text-[9px] text-surface-500">×{item.quantity}</span>}
                {item.weight > 0 && <span className="text-[8px] text-surface-600">{item.weight}lb</span>}
              </div>
            </div>
          ))}
          {inventory.map((item: any, i: number) => (
            <div key={`inv-${i}`} className="flex items-center justify-between rounded-lg bg-surface-800/30 px-2.5 py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-surface-500 shrink-0">{item.isEquipped ? "⚔️" : "📦"}</span>
                <p className="text-[10px] text-surface-300 truncate">{item.name}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {item.quantity > 1 && <span className="text-[9px] text-surface-500">×{item.quantity}</span>}
                {item.weight > 0 && <span className="text-[8px] text-surface-600">{item.weight}lb</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ── 15. Currency ──────────────────────────────────────────── */
export function CurrencySection({ character, onEdit }: { character: PlayerCharacter; onEdit: () => void }) {
  const c = character.currency || { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 };
  const totalGP = c.gold + c.silver / 10 + c.copper / 100 + c.electrum / 2 + c.platinum * 10;
  return (
    <Section title="Currency" icon="🪙" action={
      <button onClick={onEdit} className="text-[10px] text-accent-400 hover:text-accent-300 cursor-pointer">Edit</button>
    }>
      <div className="grid grid-cols-5 gap-1.5 text-center">
        {[["PP", c.platinum, "text-amber-200"], ["GP", c.gold, "text-amber-300"], ["EP", c.electrum, "text-surface-300"], ["SP", c.silver, "text-surface-300"], ["CP", c.copper, "text-amber-400"]]
          .map(([label, value, color]) => (
            <div key={label as string} className="rounded-lg bg-surface-800/50 py-2">
              <p className={`text-xs font-bold ${color as string}`}>{value as number}</p>
              <p className="text-[9px] text-surface-500">{label as string}</p>
            </div>
          ))}
      </div>
      <p className="mt-1.5 text-center text-[8px] text-surface-500">≈ {totalGP.toFixed(1)} GP total value</p>
    </Section>
  );
}

/* ── 16. Features & Traits ──────────────────────────────────── */
export function FeaturesSection({ character }: { character: PlayerCharacter }) {
  const features = character.features || [];
  const traits = character.traits || [];
  if (features.length === 0 && traits.length === 0) return null;
  return (
    <Section title="Features & Traits" icon="⚜️">
      <div className="space-y-2">
        {features.length > 0 && (
          <div>
            <p className="text-[9px] text-accent-500 uppercase tracking-wider font-semibold mb-1.5">Class & Race Features ({features.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {features.map((feat: any, i: number) => (
                <div key={i} className="group relative">
                  <span className="inline-flex items-center rounded-lg bg-accent-500/8 px-2.5 py-1 text-[10px] font-medium text-accent-300 ring-1 ring-accent-500/12 hover:bg-accent-500/12 transition-colors cursor-default">
                    {typeof feat === 'string' ? feat : feat.name}
                  </span>
                  {typeof feat !== 'string' && feat.description && feat.description !== (typeof feat === 'string' ? feat : feat.name) && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 w-64 rounded-lg bg-surface-800 p-2.5 shadow-xl border border-surface-700">
                      <p className="text-[10px] text-surface-300 leading-relaxed">{feat.description}</p>
                      {feat.source && <p className="mt-1 text-[8px] text-surface-500">{feat.source}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {traits.length > 0 && (
          <div>
            <p className="text-[9px] text-rogue-500 uppercase tracking-wider font-semibold mb-1.5">Personality Traits</p>
            <div className="flex flex-wrap gap-1.5">
              {traits.map((t: any, i: number) => (
                <span key={i} className="rounded-lg bg-rogue-500/8 px-2.5 py-1 text-[10px] text-rogue-300 ring-1 ring-rogue-500/12">
                  {typeof t === 'string' ? t : t.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ── 17. Death Saves ────────────────────────────────────────── */
export function DeathSaveTrackerSection({ character }: { character: PlayerCharacter }) {
  const ds = character.deathSaves || { successes: 0, failures: 0 };
  const stabilized = ds.successes >= 3;
  const dead = ds.failures >= 3;
  return (
    <Section title="Death Saves" icon="💀">
      <p className="text-[10px] text-surface-400 mb-3 text-center italic">Roll a d20. 10+ = Success, 9- = Failure. 3 of either = Stabilized/Dead.</p>
      <div className="flex items-center justify-center gap-8">
        <div className="text-center">
          <p className="text-[10px] text-rogue-400 uppercase tracking-wider font-semibold">Successes</p>
          <div className="flex gap-2 mt-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold transition-all ${
                i < ds.successes ? "border-rogue-500 bg-rogue-500/30 text-rogue-400" : 
                i === ds.successes && stabilized ? "border-divine-500 bg-divine-500/30 text-divine-400" :
                "border-surface-600 text-surface-600"
              }`}>
                {i < ds.successes ? "✓" : i === ds.successes && stabilized ? "★" : "○"}
              </div>
            ))}
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-warrior-400 uppercase tracking-wider font-semibold">Failures</p>
          <div className="flex gap-2 mt-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold transition-all ${
                i < ds.failures ? "border-warrior-500 bg-warrior-500/30 text-warrior-400" : "border-surface-600 text-surface-600"
              }`}>
                {i < ds.failures ? "✗" : "○"}
              </div>
            ))}
          </div>
        </div>
      </div>
      {stabilized && <p className="mt-2 text-center text-[10px] text-divine-400 font-semibold">✦ Stabilized</p>}
      {dead && <p className="mt-2 text-center text-[10px] text-warrior-400 font-semibold">☠ Dead</p>}
    </Section>
  );
}

/* ── 18. Rest & Level Up ────────────────────────────────────── */
export function RestAndLevelSection({ onShortRest, onLongRest, onLevelUp }: { onShortRest: () => void; onLongRest: () => void; onLevelUp: () => void }) {
  return (
    <Section title="Rest & Advancement">
      <p className="text-[9px] text-surface-500 mb-3 italic">Click a button to recover HP and resources based on rest type.</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={onShortRest} className="flex-1 min-w-[100px] rounded-xl bg-rogue-500/10 px-4 py-3 text-xs font-semibold text-rogue-400 hover:bg-rogue-500/20 transition-all ring-1 ring-rogue-500/20 hover:ring-rogue-500/40">
          <span className="block text-sm mb-0.5">☕ Short Rest</span>
          <span className="text-[9px] font-normal text-rogue-400/70">1hr · Spend HD · SR resources</span>
        </button>
        <button onClick={onLongRest} className="flex-1 min-w-[100px] rounded-xl bg-mage-500/10 px-4 py-3 text-xs font-semibold text-mage-400 hover:bg-mage-500/20 transition-all ring-1 ring-mage-500/20 hover:ring-mage-500/40">
          <span className="block text-sm mb-0.5">🛌 Long Rest</span>
          <span className="text-[9px] font-normal text-mage-400/70">8hr · Full heal · LR resources</span>
        </button>
        <button onClick={onLevelUp} className="flex-1 min-w-[100px] rounded-xl bg-accent-500/10 px-4 py-3 text-xs font-semibold text-accent-400 hover:bg-accent-500/20 transition-all ring-1 ring-accent-500/20 hover:ring-accent-500/40">
          <span className="block text-sm mb-0.5">⬆ Level Up</span>
          <span className="text-[9px] font-normal text-accent-400/70">Gain a new level</span>
        </button>
      </div>
    </Section>
  );
}

/* ── 19. Backstory ──────────────────────────────────────────── */
export function BackstorySection({ character }: { character: PlayerCharacter }) {
  return (
    <Section title="Biography" icon="📜">
      <div className="space-y-3">
        {character.appearance && (
          <div>
            <p className="text-[9px] text-accent-500 uppercase tracking-wider font-semibold mb-1">Appearance</p>
            <p className="text-[12px] text-surface-300 leading-relaxed">{character.appearance}</p>
          </div>
        )}
        {character.backstory && (
          <div>
            <p className="text-[9px] text-rogue-500 uppercase tracking-wider font-semibold mb-1">Backstory</p>
            <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-surface-300">{character.backstory}</p>
          </div>
        )}
        {character.allies && (
          <div>
            <p className="text-[9px] text-mage-500 uppercase tracking-wider font-semibold mb-1">Allies & Organizations</p>
            <p className="text-[12px] text-surface-300 leading-relaxed">{character.allies}</p>
          </div>
        )}
        {character.characterNotes && (
          <div>
            <p className="text-[9px] text-divine-500 uppercase tracking-wider font-semibold mb-1">Session Notes</p>
            <p className="whitespace-pre-wrap text-[12px] text-surface-400 leading-relaxed">{character.characterNotes}</p>
          </div>
        )}
      </div>
    </Section>
  );
}
