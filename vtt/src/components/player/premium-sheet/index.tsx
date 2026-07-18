/* ── premium-sheet/index.tsx ───────────────────────────────────
 * All premium sheet sub-components (each under 150 lines).
 * Re-exported as clean named exports.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter } from "@/types";

const ABILITIES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
const ABIL_LABELS: Record<string, string> = { strength: "STR", dexterity: "DEX", constitution: "CON", intelligence: "INT", wisdom: "WIS", charisma: "CHA" };

function mod(score: number): number { return Math.floor((score - 10) / 2); }
function modStr(score: number): string { const m = mod(score); return m >= 0 ? `+${m}` : `${m}`; }

const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

function raceIcon(race: string): string {
  if (race.includes("Dragon")) return "🐉"; if (race.includes("Elf")) return "🧝"; if (race.includes("Dwarf")) return "⛰️";
  if (race.includes("Halfl")) return "🏠"; if (race.includes("Gnome")) return "🪄"; if (race.includes("Orc")) return "💪";
  if (race.includes("Tief")) return "🔮"; return "🧙";
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
  return (
    <div className="premium-card flex flex-col items-center rounded-xl border border-surface-700/60 bg-surface-850/80 backdrop-blur-sm p-4 w-28 shrink-0">
      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-accent-900/20 to-mage-900/10 ring-1 ring-accent-500/20 mb-2">
        <span className="text-3xl">{raceIcon(character.race)}</span>
      </div>
      <p className="text-[11px] font-bold text-surface-100 text-center leading-tight">{character.name}</p>
      <p className="text-[9px] text-surface-500 text-center mt-0.5">{character.race}</p>
      <p className="text-[9px] text-surface-500 text-center">{character.classes?.[0]?.name || character.class}</p>
      <p className="text-[8px] text-surface-600 mt-1">{character.playerName}</p>
    </div>
  );
}

/* ── 2. Primary Stats Row ──────────────────────────────────── */
export function PrimaryStatsRow({ character }: { character: PlayerCharacter }) {
  const items = [
    { label: "Level", value: String(character.level), color: "var(--color-accent-400)" },
    { label: "AC", value: String(character.armorClass), color: "var(--color-mage-400)" },
    { label: "Init", value: modStr(character.initiative || character.dexterity), color: "var(--color-rogue-400)" },
    { label: "PB", value: `+${character.proficiencyBonus || Math.ceil(1 + character.level / 4)}`, color: "var(--color-divine-400)" },
    { label: "Speed", value: `${character.speed?.walk || 30}ft`, color: "var(--color-warrior-400)" },
  ];
  return (
    <div className="premium-stat-row grid grid-cols-5 gap-2">
      {items.map(item => (
        <div key={item.label} className="premium-stat rounded-xl border border-surface-700/40 bg-surface-800/50 p-2.5 text-center">
          <p className="text-[9px] font-medium uppercase tracking-wider text-surface-500">{item.label}</p>
          <p className="mt-0.5 text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
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
          {character.hitPoints.temporary > 0 && ` (+${character.hitPoints.temporary})`}
        </button>
      </div>
      <div className="relative h-4 overflow-hidden rounded-full bg-surface-800/80 ring-1 ring-surface-700/50 cursor-pointer premium-hp-bar" onClick={onEditHp}>
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{
          width: `${Math.max(0, Math.min(100, hpPercent))}%`,
          background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`,
          boxShadow: `0 0 12px ${barGlow}`,
        }} />
        {character.hitPoints.temporary > 0 && (
          <div className="absolute inset-y-0 right-0 rounded-full bg-amber-400/20" style={{ width: `${Math.min(100, (character.hitPoints.temporary / character.hitPoints.max) * 100)}%` }} />
        )}
      </div>
    </div>
  );
}

/* ── 4. XP Progress ─────────────────────────────────────────── */
export function XpProgressSection({ character, onEditXp }: { character: PlayerCharacter; onEditXp: () => void }) {
  const xp = character.experiencePoints ?? 0;
  const lvl = character.level;
  const currentThreshold = XP_THRESHOLDS[lvl - 1] || 0;
  const nextThreshold = XP_THRESHOLDS[lvl] || currentThreshold + 1000;
  const progress = nextThreshold > currentThreshold ? ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100 : 0;
  const xpToNext = nextThreshold - xp;
  return (
    <Section title="Experience" icon="⭐" action={
      <button onClick={onEditXp} className="text-[10px] text-accent-400 hover:text-accent-300 cursor-pointer">Edit</button>
    }>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-surface-400">Level {lvl}</span>
          <span className="text-surface-300 font-medium">{xp.toLocaleString()} XP</span>
          <span className="text-surface-500">{xpToNext > 0 ? `${xpToNext.toLocaleString()} to next` : "Ready!"}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-800/80 ring-1 ring-surface-700/30">
          <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-mage-400 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      </div>
    </Section>
  );
}

/* ── 5. Passive Stats ───────────────────────────────────────── */
export function PassiveStats({ character }: { character: PlayerCharacter }) {
  const pb = character.proficiencyBonus || Math.ceil(1 + character.level / 4);
  const passives = [
    { label: "Passive Perception", value: 10 + mod(character.wisdom) + (character.skills?.perception === "proficient" ? pb : 0) },
    { label: "Passive Investigation", value: 10 + mod(character.intelligence) + (character.skills?.investigation === "proficient" ? pb : 0) },
    { label: "Passive Insight", value: 10 + mod(character.wisdom) + (character.skills?.insight === "proficient" ? pb : 0) },
  ];
  return (
    <Section title="Passive">
      <div className="space-y-1.5">
        {passives.map(p => (
          <div key={p.label} className="flex justify-between items-center">
            <span className="text-[10px] text-surface-400">{p.label}</span>
            <span className="text-xs font-bold text-surface-200">{p.value}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── 6. Speed Breakdown ─────────────────────────────────────── */
export function SpeedBreakdown({ character }: { character: PlayerCharacter }) {
  const s = character.speed || { walk: 30 };
  const speeds = [
    { label: "Walk", value: s.walk }, { label: "Fly", value: s.fly }, { label: "Swim", value: s.swim },
    { label: "Climb", value: s.climb }, { label: "Burrow", value: s.burrow },
  ].filter(sp => sp.value);
  return (
    <Section title="Speed">
      <div className="space-y-1">
        {speeds.length === 0 ? (
          <p className="text-[10px] text-surface-500">No speeds</p>
        ) : speeds.map(sp => (
          <div key={sp.label} className="flex justify-between items-center">
            <span className="text-[10px] text-surface-400">{sp.label}</span>
            <span className="text-xs font-bold text-surface-200">{sp.value}ft</span>
          </div>
        ))}
        {s.canHover && <p className="text-[9px] text-mage-400 italic">(can hover)</p>}
      </div>
    </Section>
  );
}

/* ── 7. Conditions ─────────────────────────────────────────── */
export function ConditionsSection({ conditions }: { conditions: string[] }) {
  const colors: Record<string, string> = {
    poisoned: "warrior", paralyzed: "warrior", stunned: "warrior", unconscious: "warrior",
    blinded: "warrior", deafened: "warrior", frightened: "mage", charmed: "mage",
    restrained: "rogue", prone: "rogue", grappled: "rogue", incapacitated: "warrior",
    exhaustion: "divine", invisible: "divine", concentrating: "accent", "": "surface",
  };
  return (
    <Section title="Conditions">
      <div className="flex flex-wrap gap-1.5">
        {conditions.length === 0 ? (
          <span className="text-[10px] text-rogue-500">✓ None</span>
        ) : conditions.map(c => {
          const col = colors[c.toLowerCase()] || "surface";
          return (
            <span key={c} className={`rounded-full bg-${col}-500/10 px-2 py-0.5 text-[9px] font-medium text-${col}-400 ring-1 ring-${col}-500/20`}>
              {c}
            </span>
          );
        })}
      </div>
    </Section>
  );
}

/* ── 8. Ability Score Grid ──────────────────────────────────── */
export function AbilityScoreGrid({ character }: { character: PlayerCharacter }) {
  return (
    <Section title="Ability Scores">
      <div className="grid grid-cols-6 gap-2">
        {ABILITIES.map(abil => {
          const score = character[abil];
          const m = mod(score);
          return (
            <div key={abil} className="rounded-xl bg-gradient-to-b from-surface-800 to-surface-800/60 p-2.5 text-center ring-1 ring-surface-700/30">
              <p className="text-[9px] font-bold uppercase tracking-wider text-surface-500">{ABIL_LABELS[abil]}</p>
              <p className="mt-0.5 text-xl font-bold text-surface-100">{score}</p>
              <p className={`text-sm font-bold ${m >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{m >= 0 ? "+" : ""}{m}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── 9. Saving Throws ───────────────────────────────────────── */
export function SavingThrowsSection({ character }: { character: PlayerCharacter }) {
  const pb = character.proficiencyBonus || Math.ceil(1 + character.level / 4);
  const saveList = [
    { key: "strength", label: "STR" },
    { key: "dexterity", label: "DEX" },
    { key: "constitution", label: "CON" },
    { key: "intelligence", label: "INT" },
    { key: "wisdom", label: "WIS" },
    { key: "charisma", label: "CHA" },
  ];
  return (
    <Section title="Saving Throws">
      <div className="space-y-1">
        {saveList.map(sv => {
          const score = character[sv.key as keyof Pick<PlayerCharacter, 'strength'|'dexterity'|'constitution'|'intelligence'|'wisdom'|'charisma'>] as number;
          const st = character.savingThrows?.[sv.key];
          const proficient = st?.proficient || false;
          const total = proficient ? mod(score) + pb : mod(score);
          return (
            <div key={sv.key} className="flex items-center justify-between rounded-lg bg-surface-800/50 px-3 py-2">
              <div className="flex items-center gap-2">
                {proficient && <span className="h-2 w-2 rounded-full bg-rogue-500 shadow-sm shadow-rogue-500/30" />}
                <span className={`text-xs ${proficient ? "font-bold text-surface-100" : "text-surface-400"}`}>{sv.label}</span>
              </div>
              <span className={`text-xs font-mono font-bold ${total >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{total >= 0 ? "+" : ""}{total}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── 10. Skills ──────────────────────────────────────────────── */
export function SkillsSection({ character }: { character: PlayerCharacter }) {
  const pb = character.proficiencyBonus || Math.ceil(1 + character.level / 4);
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
    <Section title="Skills">
      <div className="grid grid-cols-1 gap-0.5">
        {skillEntries.map(sk => {
          const prof = skills[sk.key as keyof typeof skills] || "none";
          const bonus = prof === "expertise" ? mod(character[sk.abil]) + pb * 2 : prof === "proficient" ? mod(character[sk.abil]) + pb : mod(character[sk.abil]);
          return (
            <div key={sk.key} className="flex items-center justify-between rounded-md px-2.5 py-1 hover:bg-surface-800/40 transition-colors">
              <div className="flex items-center gap-1.5">
                {prof !== "none" && (
                  <span className="flex items-center gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rogue-500" />
                    {prof === "expertise" && <span className="h-1.5 w-1.5 rounded-full bg-divine-500" />}
                  </span>
                )}
                <span className={`text-[11px] ${prof !== "none" ? "font-medium text-surface-200" : "text-surface-400"}`}>{sk.label}</span>
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
export function WeaponsSection({ weapons }: { weapons: { name: string; damage: string; type?: string; attackBonus: number; ability: string }[] }) {
  if (weapons.length === 0) return null;
  return (
    <Section title="Weapon Attacks" icon="⚔️">
      <div className="grid grid-cols-1 divide-y divide-surface-700/30">
        {weapons.map((w, i) => (
          <div key={i} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-surface-200">{w.name}</span>
              <span className="text-[10px] text-surface-500">({w.ability})</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-rogue-500/10 px-2 py-0.5 text-[10px] font-bold text-rogue-400">+{w.attackBonus}</span>
              <span className="text-[11px] font-mono text-surface-300">{w.damage}</span>
              {w.type && <span className="text-[10px] text-surface-500">{w.type}</span>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── 12. Spellcasting ───────────────────────────────────────── */
export function SpellcastingSection({ character }: { character: PlayerCharacter }) {
  const spellSlots = character.spellSlots;
  const dc = 8 + (character.proficiencyBonus || 2) + mod(character[character.classes?.[0]?.name?.toLowerCase() === "wizard" ? "intelligence" : "charisma"]);
  const atk = (character.proficiencyBonus || 2) + mod(character[character.classes?.[0]?.name?.toLowerCase() === "wizard" ? "intelligence" : "charisma"]);
  const hasSlots = spellSlots && Object.values(spellSlots).some(v => (v as { max: number }).max > 0);

  if (!hasSlots) return null;

  return (
    <Section title="Spellcasting" icon="✨">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-[11px] text-surface-300 font-medium">DC {dc}</span>
        <span className="text-[11px] text-surface-300 font-medium">ATK +{atk}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(spellSlots || {}).map(([level, slots]) => {
          const s = slots as { current: number; max: number };
          if (s.max <= 0) return null;
          const pct = s.max > 0 ? (s.current / s.max) * 100 : 0;
          return (
            <div key={level} className="rounded-lg bg-surface-800/60 p-2 text-center">
              <p className="text-[9px] text-surface-500 font-medium uppercase">Lv {level}</p>
              <div className="mt-1 h-1.5 rounded-full bg-surface-700 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-mage-400" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-0.5 text-[10px] font-mono text-surface-300">{s.current}/{s.max}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── 13. Resources ──────────────────────────────────────────── */
export function ResourcesSection({ character }: { character: PlayerCharacter }) {
  const resources = character.resources || [];
  if (resources.length === 0) return null;
  return (
    <Section title="Resources" icon="🔋">
      <div className="flex flex-wrap gap-2">
        {resources.map((r: any, i: number) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-surface-800/60 px-3 py-2">
            <div>
              <p className="text-[11px] font-medium text-surface-200">{r.name || r.label || `Resource ${i + 1}`}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1.5 rounded-full bg-surface-700 w-16 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-mage-400" style={{ width: `${r.max > 0 ? (r.current / r.max) * 100 : 0}%` }} />
                </div>
                <span className="text-[10px] font-mono text-surface-300">{r.current}/{r.max}</span>
                {r.recharge && (
                  <span className="rounded bg-surface-700/50 px-1.5 py-0.5 text-[8px] text-surface-400">{r.recharge === "short" ? "SR" : r.recharge === "long" ? "LR" : r.recharge}</span>
                )}
              </div>
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
  return (
    <Section title="Inventory" icon="🎒" action={
      <button onClick={onEdit} className="text-[10px] text-accent-400 hover:text-accent-300 cursor-pointer">Edit</button>
    }>
      {equipment.length === 0 ? (
        <p className="text-[11px] text-surface-500">No items</p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {equipment.map((item: any, i: number) => (
            <div key={i} className="rounded-lg bg-surface-800/50 px-2.5 py-1.5">
              <p className="text-[11px] text-surface-200 truncate">{item.item}</p>
              {item.quantity > 1 && <p className="text-[9px] text-surface-500">×{item.quantity}</p>}
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
    </Section>
  );
}

/* ── 16. Features ──────────────────────────────────────────── */
export function FeaturesSection({ character }: { character: PlayerCharacter }) {
  const features = character.features || [];
  if (features.length === 0) return null;
  return (
    <Section title="Features & Traits" icon="⚜️">
      <div className="flex flex-wrap gap-2">
        {features.map((feat: any, i: number) => (
          <div key={i} className="group relative rounded-lg bg-accent-500/5 px-3 py-2 ring-1 ring-accent-500/10 hover:bg-accent-500/10 transition-colors cursor-default">
            <p className="text-[11px] font-semibold text-accent-300">{typeof feat === 'string' ? feat : feat.name}</p>
            {typeof feat !== 'string' && feat.description && (
              <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10 w-64 rounded-lg bg-surface-800 p-2 shadow-xl border border-surface-700">
                <p className="text-[10px] text-surface-300">{feat.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── 17. Death Saves ────────────────────────────────────────── */
export function DeathSaveTrackerSection({ character }: { character: PlayerCharacter }) {
  const ds = character.deathSaves || { successes: 0, failures: 0 };
  return (
    <Section title="Death Saves" icon="💀">
      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-[10px] text-rogue-400 uppercase tracking-wider font-semibold">Successes</p>
          <div className="flex gap-1.5 mt-1">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-4 w-4 rounded-full border-2 ${i < ds.successes ? "border-rogue-500 bg-rogue-500/30" : "border-surface-600"}`} />
            ))}
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-warrior-400 uppercase tracking-wider font-semibold">Failures</p>
          <div className="flex gap-1.5 mt-1">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-4 w-4 rounded-full border-2 ${i < ds.failures ? "border-warrior-500 bg-warrior-500/30" : "border-surface-600"}`} />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ── 18. Rest & Level Up ────────────────────────────────────── */
export function RestAndLevelSection({ onShortRest, onLongRest, onLevelUp }: { onShortRest: () => void; onLongRest: () => void; onLevelUp: () => void }) {
  return (
    <Section title="Rest & Advancement">
      <div className="flex flex-wrap gap-2">
        <button onClick={onShortRest} className="rounded-lg bg-rogue-500/10 px-4 py-2 text-xs font-semibold text-rogue-400 hover:bg-rogue-500/20 transition-colors ring-1 ring-rogue-500/20">
          ☕ Short Rest
        </button>
        <button onClick={onLongRest} className="rounded-lg bg-mage-500/10 px-4 py-2 text-xs font-semibold text-mage-400 hover:bg-mage-500/20 transition-colors ring-1 ring-mage-500/20">
          🛌 Long Rest
        </button>
        <button onClick={onLevelUp} className="rounded-lg bg-accent-500/10 px-4 py-2 text-xs font-semibold text-accent-400 hover:bg-accent-500/20 transition-colors ring-1 ring-accent-500/20">
          ⬆ Level Up
        </button>
      </div>
    </Section>
  );
}

/* ── 19. Backstory ──────────────────────────────────────────── */
export function BackstorySection({ character }: { character: PlayerCharacter }) {
  return (
    <Section title="Backstory" icon="📜">
      <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-surface-300">{character.backstory}</p>
    </Section>
  );
}
