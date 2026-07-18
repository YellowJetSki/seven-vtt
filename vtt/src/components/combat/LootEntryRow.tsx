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
  coin: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  art: "text-divine-400 bg-divine-500/10 border-divine-500/20",
  magic: "text-mage-400 bg-mage-500/10 border-mage-500/20",
  mundane: "text-surface-400 bg-surface-800 border-surface-700",
};

const TYPE_ICONS: Record<string, string> = {
  coin: "🪙",
  art: "🖼️",
  magic: "🔮",
  mundane: "📦",
};

export function LootEntryRow({ entry, characters, assignedCharacter, onAssign, onRemove }: Props) {
  return (
    <div className="group flex items-center justify-between rounded-xl border border-surface-700/40 bg-surface-850/70 px-3 py-2.5 hover:bg-surface-800/80 hover:border-surface-600/60 transition-all duration-200">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[10px] ${TYPE_COLORS[entry.type] ?? "text-surface-400 bg-surface-800 border-surface-700"}`}>
            {TYPE_ICONS[entry.type] ?? "◇"}
          </span>
          <span className="text-xs font-medium text-surface-200 truncate group-hover:text-surface-100 transition-colors">
            {entry.name}
          </span>
          {entry.quantity > 1 && (
            <span className="text-[10px] text-surface-500 font-mono">×{entry.quantity}</span>
          )}
          {entry.rarity && (
            <Badge size="xs" variant={entry.rarity === "rare" || entry.rarity === "very_rare" ? "accent" : "neutral"}>
              {entry.rarity}
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-surface-500 mt-0.5 truncate ml-8">{entry.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {assignedCharacter ? (
          <span className="text-[10px] font-medium text-accent-400 flex items-center gap-1">
            <span>✓</span>
            <span>{assignedCharacter.name}</span>
          </span>
        ) : (
          <select
            value=""
            onChange={(e) => e.target.value && onAssign(entry.id, e.target.value)}
            className="w-22 rounded-lg border border-surface-700/60 bg-surface-900/80 px-2 py-1 text-[10px] text-surface-300 focus:border-accent-500/50 focus:outline-none focus:ring-1 focus:ring-accent-500/20 transition-all cursor-pointer"
          >
            <option value="">Assign...</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <button
          onClick={() => onRemove(entry.id)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-surface-600 hover:bg-warrior-500/15 hover:text-warrior-400 transition-all text-[10px] opacity-0 group-hover:opacity-100"
          aria-label={`Remove ${entry.name}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
