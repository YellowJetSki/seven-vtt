/* ── Loot Generator ────────────────────────────────────────────
 * Generates loot for encounters based on D&D 5e treasure tables.
 * Supports coins, art objects, magic items, and mundane loot.
 * Items can be assigned to specific player characters.
 *
 * Orchestrates: LootGeneratorControls, LootEntryRow
 * Data: loot-generator-data
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import type { EquipmentSlot } from "@/types";
import { LootGeneratorControls } from "./LootGeneratorControls";
import { LootEntryRow } from "./LootEntryRow";
import type { LootEntry } from "./loot-generator-data";
import { lootUid, MUNDANE_LOOT, ART_OBJECTS, MAGIC_ITEMS } from "./loot-generator-data";

export function LootGenerator() {
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const updatePlayerCharacter = useCampaignStore((s) => s.updatePlayerCharacter);
  const showToast = useUiStore((s) => s.showToast);

  const [lootEntries, setLootEntries] = useState<LootEntry[]>([]);
  const [coinAmount, setCoinAmount] = useState(100);

  const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const generateCoin = useCallback(() => {
    const entries: LootEntry[] = [
      { id: lootUid("loot"), name: "Copper (CP)", type: "coin", quantity: Math.floor(coinAmount * 0.5), value: 0 },
      { id: lootUid("loot"), name: "Silver (SP)", type: "coin", quantity: Math.floor(coinAmount * 0.3), value: 0 },
      { id: lootUid("loot"), name: "Gold (GP)", type: "coin", quantity: Math.floor(coinAmount * 0.15), value: 0 },
      { id: lootUid("loot"), name: "Platinum (PP)", type: "coin", quantity: Math.floor(coinAmount * 0.05), value: 0 },
    ].filter((e) => e.quantity > 0);
    setLootEntries((prev) => [...prev, ...entries]);
    showToast({ message: `Generated ${coinAmount} gp worth of coins.`, type: "success" });
  }, [coinAmount, showToast]);

  const generateArt = useCallback(() => {
    const art = pickRandom(ART_OBJECTS);
    const entry: LootEntry = { id: lootUid("loot"), ...art, type: "art", quantity: 1 };
    setLootEntries((prev) => [...prev, entry]);
    showToast({ message: `Art: ${art.name} (${art.value} gp)`, type: "success" });
  }, [showToast]);

  const generateMagic = useCallback(() => {
    const item = pickRandom(MAGIC_ITEMS);
    const entry: LootEntry = { id: lootUid("loot"), ...item, type: "magic", quantity: 1 };
    setLootEntries((prev) => [...prev, entry]);
    showToast({ message: `Magic: ${item.name} (${item.rarity})`, type: "success" });
  }, [showToast]);

  const generateMundane = useCallback(() => {
    const item = pickRandom(MUNDANE_LOOT);
    const entry: LootEntry = { id: lootUid("loot"), ...item, type: "mundane", quantity: 1 };
    setLootEntries((prev) => [...prev, entry]);
    showToast({ message: `Found: ${item.name}`, type: "success" });
  }, [showToast]);

  const handleAssign = useCallback((lootId: string, characterId: string) => {
    const entry = lootEntries.find((e) => e.id === lootId);
    const character = characters.find((c) => c.id === characterId);
    if (!entry || !character) return;

    const existingEquipment: EquipmentSlot[] = [...(character.equipment ?? [])];

    if (entry.type === "coin") {
      const currency = { ...(character.currency ?? { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 }) };
      if (entry.name.includes("Copper")) currency.copper += entry.quantity;
      else if (entry.name.includes("Silver")) currency.silver += entry.quantity;
      else if (entry.name.includes("Gold")) currency.gold += entry.quantity;
      else if (entry.name.includes("Platinum")) currency.platinum += entry.quantity;
      updatePlayerCharacter(characterId, { currency });
    } else {
      updatePlayerCharacter(characterId, {
        equipment: [...existingEquipment, { slot: "carried", item: entry.name, quantity: entry.quantity, weight: 0, notes: "" }],
      });
    }

    setLootEntries((prev) => prev.map((e) => (e.id === lootId ? { ...e, assignedTo: characterId } : e)));
    const itemStr = `${entry.name}${entry.quantity > 1 ? ` x${entry.quantity}` : ""}`;
    showToast({ message: `"${itemStr}" -> ${character.name}`, type: "success" });
  }, [lootEntries, characters, updatePlayerCharacter, showToast]);

  const handleRemove = useCallback((lootId: string) => {
    setLootEntries((prev) => prev.filter((e) => e.id !== lootId));
  }, []);

  const handleClearAll = useCallback(() => {
    setLootEntries([]);
    showToast({ message: "Cleared all loot entries.", type: "info" });
  }, [showToast]);

  if (!meta) {
    return (
      <div className="rounded-xl border border-surface-700 bg-surface-850 p-5 text-center">
        <p className="text-sm text-surface-500">Load a campaign to use the loot generator.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850">
      <div className="border-b border-surface-700 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">Loot Generator</h3>
      </div>
      <div className="p-4 space-y-4">
        <LootGeneratorControls
          coinAmount={coinAmount}
          onCoinAmountChange={setCoinAmount}
          onGenerateCoin={generateCoin}
          onGenerateArt={generateArt}
          onGenerateMagic={generateMagic}
          onGenerateMundane={generateMundane}
          onClearAll={handleClearAll}
          hasEntries={lootEntries.length > 0}
        />

        {lootEntries.length === 0 ? (
          <div className="py-8 text-center">
            <span className="text-3xl text-surface-600">◇</span>
            <p className="mt-2 text-xs text-surface-500">Generate loot to assign to party members.</p>
          </div>
        ) : (
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {lootEntries.map((entry) => (
              <LootEntryRow
                key={entry.id}
                entry={entry}
                characters={characters}
                assignedCharacter={entry.assignedTo ? characters.find((c) => c.id === entry.assignedTo) : undefined}
                onAssign={handleAssign}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
