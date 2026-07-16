/* ── Loot Generator ────────────────────────────────────────────
 * Generates loot for encounters based on D&D 5e treasure tables.
 * Supports coins, art objects, magic items, and mundane loot.
 * Items can be assigned to specific player characters.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { PlayerCharacter, EquipmentSlot } from "@/types";

/* ── Types ──────────────────────────────────────────────────── */

type LootType = "coin" | "art" | "magic" | "mundane";

interface LootEntry {
  id: string;
  name: string;
  type: LootType;
  quantity: number;
  value: number;
  description?: string;
  rarity?: string;
  assignedTo?: string;
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const MUNDANE_LOOT = [
  { name: "Healer's Kit", value: 5, description: "10 uses, stabilizes dying" },
  { name: "Crowbar", value: 2, description: "Advantage on STR checks to pry open" },
  { name: "Hooded Lantern", value: 5, description: "30/60 ft light, can be shuttered" },
  { name: "Silk Rope (50ft)", value: 10, description: "16 STR check to break" },
  { name: "Magnifying Glass", value: 100, description: "Advantage on investigation" },
  { name: "Caltrops (bag)", value: 1, description: "5 ft square, 1 dmg, half speed" },
  { name: "Manacles", value: 2, description: "DC 20 STR check to break" },
  { name: "Signal Whistle", value: 0.5, description: "Audible up to 1 mile" },
  { name: "Sealing Wax", value: 0.5, description: "Red wax for letters" },
  { name: "Writing Ink (vial)", value: 10, description: "8 hours of writing" },
  { name: "Fine Clothes", value: 15, description: "Silk doublet with embroidery" },
];

const ART_OBJECTS = [
  { name: "Silver Chalice", value: 25, description: "Engraved with elven vines" },
  { name: "Gold Ring", value: 50, description: "Set with a small garnet" },
  { name: "Jade Figurine", value: 75, description: "A frog in meditation pose" },
  { name: "Silk Tapestry", value: 100, description: "Depicts a forgotten battle" },
  { name: "Platinum Necklace", value: 200, description: "With sapphire pendant" },
  { name: "Ivory Chess Set", value: 250, description: "Intricately carved" },
  { name: "Crystal Decanter", value: 500, description: "Filled with ancient elven wine" },
  { name: "Enchanted Painting", value: 750, description: "The painting's subject winks" },
  { name: "Gilded Statue", value: 1000, description: "12-inch statue of a forgotten deity" },
];

const MAGIC_ITEMS = [
  { name: "Potion of Healing", value: 50, rarity: "common", description: "2d4+2" },
  { name: "Spell Scroll (1st)", value: 75, rarity: "common", description: "One first-level spell" },
  { name: "Bag of Holding", value: 500, rarity: "uncommon", description: "500 lb, 64 cubic ft" },
  { name: "Cloak of Protection", value: 750, rarity: "uncommon", description: "+1 AC and saves" },
  { name: "Boots of Elvenkind", value: 500, rarity: "uncommon", description: "Silent movement" },
  { name: "Goggles of Night", value: 500, rarity: "uncommon", description: "Darkvision 60ft" },
  { name: "Wand of Magic Missiles", value: 1000, rarity: "uncommon", description: "7 charges" },
  { name: "Bracers of Archery", value: 1500, rarity: "uncommon", description: "+2 damage bows" },
  { name: "Sword of Vengeance", value: 2000, rarity: "rare", description: "Cursed curseling sword" },
  { name: "Ring of Protection", value: 3000, rarity: "rare", description: "+1 AC and saves" },
  { name: "Staff of Healing", value: 5000, rarity: "rare", description: "10 charges, various heals" },
  { name: "Flame Tongue (Longsword)", value: 8000, rarity: "rare", description: "2d6 fire on hit" },
  { name: "Portable Hole", value: 5000, rarity: "rare", description: "6 ft diameter, 10 ft deep" },
  { name: "Winged Boots", value: 4000, rarity: "rare", description: "4 hours flight per day" },
  { name: "Amulet of Health", value: 6000, rarity: "rare", description: "CON = 19" },
];

/* ── Component ──────────────────────────────────────────────── */

export function LootGenerator() {
  const campaign = useCampaignStore((s) => s.campaign);
  const characters = useCampaignStore((s) => s.campaign?.playerCharacters ?? []);
  const updatePlayerCharacter = useCampaignStore((s) => s.updatePlayerCharacter);
  const showToast = useUiStore((s) => s.showToast);

  const [lootEntries, setLootEntries] = useState<LootEntry[]>([]);
  const [coinAmount, setCoinAmount] = useState(100);

  /* ── Generate Coin Drop ── */
  const generateCoin = useCallback(() => {
    const entries: LootEntry[] = ([
      { id: uid("loot"), name: "Copper (CP)", type: "coin" as LootType, quantity: Math.floor(coinAmount * 0.5), value: 0 },
      { id: uid("loot"), name: "Silver (SP)", type: "coin" as LootType, quantity: Math.floor(coinAmount * 0.3), value: 0 },
      { id: uid("loot"), name: "Gold (GP)", type: "coin" as LootType, quantity: Math.floor(coinAmount * 0.15), value: 0 },
      { id: uid("loot"), name: "Platinum (PP)", type: "coin" as LootType, quantity: Math.floor(coinAmount * 0.05), value: 0 },
    ] as LootEntry[]).filter((e) => e.quantity > 0);
    setLootEntries((prev) => [...prev, ...entries]);
    showToast({ message: `Generated ${coinAmount} gp worth of coins.`, type: "success" });
  }, [coinAmount, showToast]);

  /* ── Generate Art Object ── */
  const generateArt = useCallback(() => {
    const art = ART_OBJECTS[Math.floor(Math.random() * ART_OBJECTS.length)];
    const entry: LootEntry = { id: uid("loot"), ...art, type: "art" as LootType, quantity: 1 };
    setLootEntries((prev) => [...prev, entry]);
    showToast({ message: `Art: ${art.name} (${art.value} gp)`, type: "success" });
  }, [showToast]);

  /* ── Generate Magic Item ── */
  const generateMagic = useCallback(() => {
    const item = MAGIC_ITEMS[Math.floor(Math.random() * MAGIC_ITEMS.length)];
    const entry: LootEntry = { id: uid("loot"), ...item, type: "magic" as LootType, quantity: 1 };
    setLootEntries((prev) => [...prev, entry]);
    showToast({ message: `Magic: ${item.name} (${item.rarity})`, type: "success" });
  }, [showToast]);

  /* ── Generate Mundane Item ── */
  const generateMundane = useCallback(() => {
    const item = MUNDANE_LOOT[Math.floor(Math.random() * MUNDANE_LOOT.length)];
    const entry: LootEntry = { id: uid("loot"), ...item, type: "mundane" as LootType, quantity: 1 };
    setLootEntries((prev) => [...prev, entry]);
    showToast({ message: `Found: ${item.name}`, type: "success" });
  }, [showToast]);

  /* ── Assign Loot to Character ── */
  const handleAssign = useCallback((lootId: string, characterId: string) => {
    const entry = lootEntries.find((e) => e.id === lootId);
    if (!entry) return;

    const character = characters.find((c) => c.id === characterId);
    if (!character) return;

    const existingEquipment: EquipmentSlot[] = [...(character.equipment ?? [])];
    const newItem: EquipmentSlot = { slot: "carried", item: entry.name, quantity: entry.quantity, weight: 0, notes: "" };

    if (entry.type === "coin") {
      const currency = { ...(character.currency ?? { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 }) };

      if (entry.name.includes("Copper")) currency.copper += entry.quantity;
      else if (entry.name.includes("Silver")) currency.silver += entry.quantity;
      else if (entry.name.includes("Gold")) currency.gold += entry.quantity;
      else if (entry.name.includes("Platinum")) currency.platinum += entry.quantity;

      updatePlayerCharacter(characterId, { currency });
    } else {
      updatePlayerCharacter(characterId, {
        equipment: [...existingEquipment, newItem],
      });
    }

    setLootEntries((prev) =>
      prev.map((e) => (e.id === lootId ? { ...e, assignedTo: characterId } : e))
    );

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

  if (!campaign) {
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
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-surface-800 px-2 py-1.5">
            <input
              type="number"
              value={coinAmount}
              onChange={(e) => setCoinAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 rounded border border-surface-700 bg-surface-900 px-1.5 py-0.5 text-center text-xs text-surface-100"
            />
            <Button size="xs" variant="ghost" onClick={generateCoin}>Coins</Button>
          </div>
          <Button size="xs" variant="ghost" onClick={generateArt}>Art</Button>
          <Button size="xs" variant="ghost" onClick={generateMagic}>Magic</Button>
          <Button size="xs" variant="ghost" onClick={generateMundane}>Mundane</Button>
          {lootEntries.length > 0 && (
            <Button size="xs" variant="ghost" onClick={handleClearAll}>Clear</Button>
          )}
        </div>

        {lootEntries.length === 0 ? (
          <div className="py-8 text-center">
            <span className="text-3xl text-surface-600">Diamond</span>
            <p className="mt-2 text-xs text-surface-500">Generate loot to assign to party members.</p>
          </div>
        ) : (
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {lootEntries.map((entry) => {
              const assigned = entry.assignedTo ? characters.find((c) => c.id === entry.assignedTo) : null;
              const typeColor: Record<string, string> = {
                coin: "text-amber-400 bg-amber-500/10",
                art: "text-divine-400 bg-divine-500/10",
                magic: "text-mage-400 bg-mage-500/10",
                mundane: "text-surface-400 bg-surface-800",
              };
              return (
                <div key={entry.id} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${typeColor[entry.type] ?? ""}`}>
                        {entry.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-surface-200 truncate">{entry.name}</span>
                      {entry.quantity > 1 && (
                        <span className="text-[10px] text-surface-500">x{entry.quantity}</span>
                      )}
                      {entry.rarity && (
                        <Badge size="xs" variant={entry.rarity === "rare" ? "accent" : "neutral"}>{entry.rarity}</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-surface-500 mt-0.5 truncate">{entry.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {assigned ? (
                      <span className="text-[10px] text-accent-400">{assigned.name}</span>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => e.target.value && handleAssign(entry.id, e.target.value)}
                        className="w-20 rounded border border-surface-700 bg-surface-900 px-1 py-0.5 text-[10px] text-surface-300"
                      >
                        <option value="">Assign...</option>
                        {characters.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                    <button onClick={() => handleRemove(entry.id)} className="text-surface-600 hover:text-warrior-400">x</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
