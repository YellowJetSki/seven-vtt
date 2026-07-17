/* ── CharacterCard ─────────────────────────────────────────────
 * Grid card for a player character with quick stats, HP bar,
 * ability scores, and action overlay.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter, Ability } from "@/types";
import { getClassSummary } from "@/types";
import { formatCurrency } from "@/lib/character-export";

const ABILITY_ORDER: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABILITY_SHORT: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

interface Props {
  character: PlayerCharacter;
  index: number;
  onOpen: () => void;
  onEdit: () => void;
  onOpenInventory: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function CharacterCard({ character, index, onOpen, onEdit, onOpenInventory, onExport, onDelete }: Props) {
  return (
    <div className="group relative rounded-xl border border-surface-700/60 bg-surface-850/80 overflow-hidden transition-all hover:border-accent-500/30 hover:-translate-y-1 active:translate-y-0 cursor-pointer animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 60, 420)}ms` }} onClick={onOpen}>
      <div className="h-2 bg-gradient-to-r from-rogue-500/40 to-warrior-500/40" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-surface-100 truncate group-hover:text-accent-300">{character.name}</h3>
            <p className="text-xs text-surface-400 mt-0.5">{character.race} · {getClassSummary(character.classes)}</p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rogue-500/15 text-xs font-bold text-rogue-400">{character.level}</div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-surface-400">HP</span>
            <span className={`font-medium ${character.hitPoints.current <= 0 ? "text-warrior-400" : character.hitPoints.current <= character.hitPoints.max * 0.25 ? "text-warrior-500" : "text-surface-200"}`}>
              {character.hitPoints.current}/{character.hitPoints.max}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-700 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${character.hitPoints.current <= 0 ? "bg-warrior-500" : character.hitPoints.current <= character.hitPoints.max * 0.25 ? "bg-warrior-400" : "bg-rogue-500"}`}
              style={{ width: `${Math.max(0, (character.hitPoints.current / character.hitPoints.max) * 100)}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-surface-500">
          <span>🎒 {(character.equipment ?? []).length} items</span>
          <span>·</span>
          <span>🪙 {formatCurrency(character, "gp")} gp</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {ABILITY_ORDER.map((ability) => (
            <div key={ability} className="text-center rounded bg-surface-800 py-1">
              <p className="text-[9px] font-medium text-surface-500 uppercase">{ABILITY_SHORT[ability]}</p>
              <p className="text-[11px] font-bold text-surface-200">{character[ability] ?? 10}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-surface-500">Player: {character.playerName || "Unassigned"}</p>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); onOpenInventory(); }} className="rounded bg-surface-900/70 px-2 py-1 text-[10px] text-surface-300 hover:text-surface-100 backdrop-blur-sm" title="Inventory">🎒</button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded bg-surface-900/70 px-2 py-1 text-[10px] text-surface-300 hover:text-surface-100 backdrop-blur-sm">✏️</button>
        <button onClick={(e) => { e.stopPropagation(); onExport(); }} className="rounded bg-surface-900/70 px-2 py-1 text-[10px] text-surface-300 hover:text-surface-100 backdrop-blur-sm">📤</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded bg-surface-900/70 px-2 py-1 text-[10px] text-warrior-400 hover:text-warrior-300 backdrop-blur-sm" title="Remove">🗑️</button>
      </div>
    </div>
  );
}
