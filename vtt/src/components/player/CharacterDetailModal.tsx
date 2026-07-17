/* ── CharacterDetailModal ──────────────────────────────────────
 * Full detail view of a player character in a modal.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter, Ability } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/character-export";

const ABILITY_ORDER: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABILITY_SHORT: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

interface Props {
  character: PlayerCharacter;
  onClose: () => void;
  onEdit: () => void;
  onOpenInventory: () => void;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
      <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-sm font-semibold text-surface-100">{value}</p>
    </div>
  );
}

export function CharacterDetailModal({ character, onClose, onEdit, onOpenInventory }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-surface-100">{character.name}</h3>
              <p className="text-sm text-surface-400">{character.race} {character.class} · Level {character.level}</p>
            </div>
            <button onClick={onClose} className="text-surface-500 hover:text-surface-200">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DetailItem label="Race" value={character.race} />
            <DetailItem label="Class" value={character.class} />
            <DetailItem label="Level" value={character.level.toString()} />
            <DetailItem label="Player" value={character.playerName || "—"} />
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Ability Scores</h4>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {ABILITY_ORDER.map((ability) => {
                const score = character[ability] ?? 10;
                const mod = Math.floor((score - 10) / 2);
                return (
                  <div key={ability} className="text-center rounded-lg border border-surface-700 bg-surface-800 p-3">
                    <p className="text-[10px] font-medium text-surface-500 uppercase">{ABILITY_SHORT[ability]}</p>
                    <p className="text-xl font-bold text-surface-100">{score}</p>
                    <p className={`text-xs font-medium ${mod >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{mod >= 0 ? "+" : ""}{mod}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DetailItem label="HP" value={`${character.hitPoints.current}/${character.hitPoints.max}`} />
            <DetailItem label="Armor Class" value={character.armorClass.toString()} />
            <DetailItem label="Initiative" value={`+${character.initiative}`} />
            <DetailItem label="Speed" value={`${character.speed || 30} ft`} />
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Equipment ({(character.equipment ?? []).length} items)</h4>
            {(character.equipment ?? []).length === 0 ? (
              <p className="text-xs text-surface-500">No equipment recorded.</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {(character.equipment ?? []).map((item, i) => (
                  <Badge key={`eq-${i}`} size="xs" variant="neutral">{item.item} {item.quantity > 1 ? `×${item.quantity}` : ""}</Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Currency</h4>
            <div className="flex gap-3 text-xs text-surface-300">
              <span>🟤 {formatCurrency(character, "cp")} CP</span>
              <span>⚪ {formatCurrency(character, "sp")} SP</span>
              <span>🔵 {formatCurrency(character, "ep")} EP</span>
              <span>🟡 {formatCurrency(character, "gp")} GP</span>
              <span>💠 {formatCurrency(character, "pp")} PP</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-surface-700 pt-4">
            <Button variant="secondary" size="sm" onClick={onOpenInventory}>🎒 Inventory</Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>✏️ Edit Character</Button>
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
