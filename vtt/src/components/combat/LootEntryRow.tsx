/* ── Loot Entry Row ─────────────────────────────────────────────
 * Individual loot entry displayed in the loot generator list.
 * Shows type badge, name, quantity, rarity, description, and an
 * assignment dropdown to give loot to a player character.
 * Extracted from LootGenerator.tsx to keep files under 150 lines.
 * ─────────────────────────────────────────────────────────────── */

import type { LootEntry } from "./loot-generator-data";
import type { PlayerCharacter } from "@/types";
import { Badge } from "@/components/ui/Badge";

interface Props {
  entry: LootEntry;
  characters: PlayerCharacter[];
  assignedCharacter: PlayerCharacter | undefined;
  onAssign: (lootId: string, characterId: string) => void;
  onRemove: (lootId: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  coin: "text-amber-400 bg-amber-500/10",
  art: "text-divine-400 bg-divine-500/10",
  magic: "text-mage-400 bg-mage-500/10",
  mundane: "text-surface-400 bg-surface-800",
};

export function LootEntryRow({ entry, characters, assignedCharacter, onAssign, onRemove }: Props) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${TYPE_COLORS[entry.type] ?? ""}`}>
            {entry.type.toUpperCase()}
          </span>
          <span className="text-xs text-surface-200 truncate">{entry.name}</span>
          {entry.quantity > 1 && (
            <span className="text-[10px] text-surface-500">x{entry.quantity}</span>
          )}
          {entry.rarity && (
            <Badge size="xs" variant={entry.rarity === "rare" ? "accent" : "neutral"}>
              {entry.rarity}
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-surface-500 mt-0.5 truncate">{entry.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {assignedCharacter ? (
          <span className="text-[10px] text-accent-400">{assignedCharacter.name}</span>
        ) : (
          <select
            value=""
            onChange={(e) => e.target.value && onAssign(entry.id, e.target.value)}
            className="w-20 rounded border border-surface-700 bg-surface-900 px-1 py-0.5 text-[10px] text-surface-300"
          >
            <option value="">Assign...</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <button
          onClick={() => onRemove(entry.id)}
          className="text-surface-600 hover:text-warrior-400 transition-colors text-[10px]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
