/* ── CharacterHeader ───────────────────────────────────────────
 * Card header showing character name, race, class, player name.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter } from "@/types";
import { getClassSummary } from "@/types";

function raceIcon(race: string): string {
  if (race.includes("Dragon")) return "🐉";
  if (race.includes("Elf")) return "🧝";
  if (race.includes("Dwarf")) return "⛰️";
  if (race.includes("Halfl")) return "🏠";
  if (race.includes("Gnome")) return "🪄";
  if (race.includes("Orc")) return "💪";
  if (race.includes("Tief")) return "🔮";
  return "🧙";
}

interface Props {
  character: PlayerCharacter;
}

export function CharacterHeader({ character }: Props) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-rogue-500/60 via-accent-500/60 to-warrior-500/60" />
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-800 ring-1 ring-surface-700 md:h-24 md:w-24">
            <span className="text-3xl md:text-4xl">{raceIcon(character.race)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-surface-100 md:text-3xl">{character.name}</h1>
            <p className="mt-0.5 text-sm text-surface-400">{character.race} - {getClassSummary(character.classes)}</p>
            <p className="mt-0.5 text-xs text-surface-500">{character.alignment ?? "Unaligned"} - {character.background ?? "No Background"}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-surface-500">Played by <span className="text-surface-400">{character.playerName}</span></p>
      </div>
    </div>
  );
}
