/* ── CharacterCombatBlock ───────────────────────────────────────
 * Premium combat stat block: AC, Initiative, HP bar, hit dice,
 * speed types, death saves, and conditions at a glance.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter } from "@/types";

interface Props {
  character: PlayerCharacter;
}

function getHpBarColor(pct: number): string {
  if (pct <= 0) return "bg-surface-600";
  if (pct <= 25) return "bg-warrior-500";
  if (pct <= 50) return "bg-divine-500";
  return "bg-rogue-500";
}

function hpTextColor(pct: number): string {
  if (pct <= 0) return "text-surface-500";
  if (pct <= 25) return "text-warrior-400";
  if (pct <= 50) return "text-divine-400";
  return "text-rogue-400";
}

function fmtInit(init: number | string | undefined | null): string {
  if (init === undefined || init === null || init === "--" || init === "" || isNaN(Number(init))) return "—";
  const n = Number(init);
  return n >= 0 ? `+${n}` : `${n}`;
}

function getPassiveScore(score: number | undefined, skillProf: string | undefined, profBonus: number): number {
  const base = Math.floor(((score ?? 10) - 10) / 2);
  const bonus = skillProf === "proficient" ? profBonus : skillProf === "expertise" ? profBonus * 2 : 0;
  return 10 + base + bonus;
}

export function CharacterCombatBlock({ character }: Props) {
  const hpPct = character.hitPoints.max > 0
    ? Math.max(0, (character.hitPoints.current / character.hitPoints.max) * 100)
    : 0;

  const spd: string[] = [];
  if (character.speed?.walk) spd.push(`${character.speed.walk}ft`);
  if (character.speed?.fly) spd.push(`🪽${character.speed.fly}ft`);
  if (character.speed?.swim) spd.push(`🌊${character.speed.swim}ft`);
  if (character.speed?.climb) spd.push(`🧗${character.speed.climb}ft`);

  const passivePerception = getPassiveScore(character.wisdom, character.skills?.perception, character.proficiencyBonus);
  const passiveInvestigation = getPassiveScore(character.intelligence, character.skills?.investigation, character.proficiencyBonus);
  const passiveInsight = getPassiveScore(character.wisdom, character.skills?.insight, character.proficiencyBonus);

  return (
    <div className="space-y-1.5">
      {/* ── Core Combat Grid ── */}
      <div className="grid grid-cols-4 gap-px rounded-lg overflow-hidden border border-surface-700/50 bg-surface-800">
        <CombatStatCell label="AC" value={String(character.armorClass)} accent="mage" />
        <CombatStatCell label="Init" value={fmtInit(character.initiative)} accent="rogue" />
        <CombatStatCell label="PB" value={`+${character.proficiencyBonus}`} accent="accent" />
        <CombatStatCell label="Speed" value={spd[0] ?? "—"} accent="surface" />
      </div>

      {/* ── HP Bar ── */}
      <div className="rounded-lg bg-surface-800/80 px-2.5 py-1.5 border border-surface-700/50">
        <div className="flex items-center justify-between text-[10px] mb-0.5">
          <span className="font-semibold text-surface-400 uppercase tracking-wider">HP</span>
          <span className={`font-bold ${hpTextColor(hpPct)}`}>
            {character.hitPoints.current}/{character.hitPoints.max}
            {character.hitPoints.temporary > 0 && (
              <span className="text-mage-400 ml-1 text-[9px]">(+{character.hitPoints.temporary}tmp)</span>
            )}
          </span>
        </div>
        <div className="h-2 rounded-full bg-surface-700/80 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${getHpBarColor(hpPct)}`}
            style={{ width: `${hpPct}%` }} />
        </div>
        {/* Hit Dice */}
        <div className="flex items-center gap-3 mt-1 text-[9px] text-surface-500">
          <span>HD: <span className="text-surface-300 font-mono">{character.hitDice || "—"}</span></span>
          {character.deathSaves && (character.deathSaves.successes > 0 || character.deathSaves.failures > 0) && (
            <span className={`${character.deathSaves.failures >= 3 ? "text-warrior-400 font-bold" : ""}`}>
              Death: {Array(character.deathSaves.successes).fill("●").join("")}{Array(3 - character.deathSaves.successes).fill("○").join("")}
              <span className="text-surface-600 mx-1">|</span>
              ✕{Array(character.deathSaves.failures).fill("●").join("")}{Array(3 - character.deathSaves.failures).fill("○").join("")}
            </span>
          )}
        </div>
      </div>

      {/* ── Speed Details + Passive Scores ── */}
      <div className="grid grid-cols-2 gap-1">
        {spd.length > 0 && (
          <div className="rounded-lg bg-surface-800/60 px-2 py-1.5 border border-surface-700/40">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-surface-500">Movement</p>
            <p className="text-[10px] text-surface-300 truncate">{spd.join(", ")}</p>
          </div>
        )}
        <div className="rounded-lg bg-surface-800/60 px-2 py-1.5 border border-surface-700/40">
          <p className="text-[8px] font-semibold uppercase tracking-wider text-surface-500">Passive</p>
          <div className="flex gap-2 text-[10px] text-surface-300">
            <span title="Passive Perception">👁{passivePerception}</span>
            <span title="Passive Investigation">🔍{passiveInvestigation}</span>
            <span title="Passive Insight">🧠{passiveInsight}</span>
          </div>
        </div>
      </div>

      {/* ── Conditions ── */}
      {(character.conditions ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(character.conditions ?? []).map((c, i) => (
            <span key={i} className="rounded bg-warrior-500/15 px-1.5 py-0.5 text-[9px] font-medium text-warrior-400">{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function CombatStatCell({ label, value, accent }: { label: string; value: string; accent: string }) {
  const accentColors: Record<string, string> = {
    mage: "text-mage-400",
    rogue: "text-rogue-400",
    accent: "text-accent-400",
    surface: "text-surface-300",
  };
  return (
    <div className="bg-surface-850 px-1.5 py-1.5 text-center">
      <p className="text-[8px] font-semibold uppercase tracking-wider text-surface-500">{label}</p>
      <p className={`text-sm font-bold ${accentColors[accent] ?? "text-surface-100"}`}>{value}</p>
    </div>
  );
}
