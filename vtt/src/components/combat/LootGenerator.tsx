/* ── Loot Generator — Post-Combat Treasure Distribution ────────
 * D&D 5e-compliant treasure generator per DMG Chapter 7.
 * Features:
 *  • Individual treasure by CR tier
 *  • Hoard treasure tables (simplified)
 *  • Magic item generation
 *  • Manual custom loot entries
 *  • Distribution to player characters
 *  • Clipboard export for session notes
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

/* ── Interface ──────────────────────────────────────────────── */

export interface LootEntry {
  id: string;
  type: "coin" | "gem" | "art" | "item" | "magic_item" | "consumable";
  name: string;
  quantity: number;
  value: number; // in gp
  description?: string;
  rarity?: "common" | "uncommon" | "rare" | "very_rare" | "legendary";
  assignedTo?: string; // player character ID
}

/* ── DMG Treasure Tables (simplified) ───────────────────────── */

interface CoinRoll {
  copper: string;
  silver: string;
  gold: string;
  platinum: string;
}

const INDIVIDUAL_TREASURE: Record<string, CoinRoll> = {
  "0-4": { copper: "5d6 (×1)", silver: "—", gold: "—", platinum: "—" },
  "5-10": { copper: "—", silver: "4d6 (×1)", gold: "—", platinum: "—" },
  "11-16": { copper: "—", silver: "—", gold: "3d6 (×1)", platinum: "—" },
  "17+": { copper: "—", silver: "—", gold: "—", platinum: "3d6 (×1)" },
};

const GEMS_ART_TABLE: { min: number; max: number; count: number; items: string[]; value: number }[] = [
  { min: 1, max: 25, count: 0, items: [], value: 0 },
  { min: 26, max: 90, count: 2, items: ["Ornamental stone (10 gp)", "Small gem (10 gp)"], value: 10 },
  { min: 91, max: 100, count: 2, items: ["Art object (25 gp)", "Gemstone (50 gp)"], value: 25 },
];

const MAGIC_ITEM_TABLES: { label: string; items: { name: string; rarity: string }[] }[] = [
  {
    label: "Table A (Minor — Common)",
    items: [
      { name: "Potion of Healing", rarity: "common" },
      { name: "Spell Scroll (Cantrip)", rarity: "common" },
      { name: "Bag of Tricks (Gray)", rarity: "uncommon" },
      { name: "Dust of Disappearance", rarity: "uncommon" },
      { name: "Oil of Slipperiness", rarity: "uncommon" },
      { name: "Bag of Holding", rarity: "uncommon" },
      { name: "Alchemy Jug", rarity: "uncommon" },
      { name: "Wand of Magic Detection", rarity: "uncommon" },
    ],
  },
  {
    label: "Table B (Uncommon — Moderate)",
    items: [
      { name: "Potion of Greater Healing", rarity: "uncommon" },
      { name: "Spell Scroll (Level 1)", rarity: "common" },
      { name: "Cloak of Protection", rarity: "uncommon" },
      { name: "Ring of Protection", rarity: "rare" },
      { name: "Gauntlets of Ogre Power", rarity: "uncommon" },
      { name: "Boots of Elvenkind", rarity: "uncommon" },
      { name: "Cloak of Elvenkind", rarity: "uncommon" },
      { name: "Wand of Magic Missiles", rarity: "uncommon" },
    ],
  },
  {
    label: "Table C (Rare — Powerful)",
    items: [
      { name: "Potion of Superior Healing", rarity: "rare" },
      { name: "Spell Scroll (Level 3)", rarity: "uncommon" },
      { name: "Ring of Spell Storing", rarity: "rare" },
      { name: "Bracers of Archery", rarity: "uncommon" },
      { name: "Flame Tongue Longsword", rarity: "rare" },
      { name: "Staff of Healing", rarity: "rare" },
      { name: "Wand of Fireballs", rarity: "rare" },
      { name: "Belt of Giant Strength (Hill)", rarity: "rare" },
    ],
  },
];

/* ── Treasure Generator Functions ───────────────────────────── */

function generateCoins(crTier: string): { cp: number; sp: number; gp: number; pp: number } {
  const template = INDIVIDUAL_TREASURE[crTier];
  if (!template) return { cp: 0, sp: 0, gp: 0, pp: 0 };

  const parseRoll = (val: string): number => {
    const m = val.match(/(\d+)d(\d+)(?:\s*\(×(\d+)\))?/);
    if (!m) return 0;
    const [count, sides, multiplier] = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3] ?? "1")];
    let total = 0;
    for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
    return total * multiplier;
  };

  return {
    cp: parseRoll(template.copper),
    sp: parseRoll(template.silver),
    gp: parseRoll(template.gold),
    pp: parseRoll(template.platinum),
  };
}

/* ── Component ──────────────────────────────────────────────── */

export function LootGenerator() {
  const campaign = useCampaignStore((s) => s.campaign);
  const updatePlayerCharacter = useCampaignStore((s) => s.updatePlayerCharacter);
  const showToast = useUiStore((s) => s.showToast);

  const [isOpen, setIsOpen] = useState(false);
  const [lootEntries, setLootEntries] = useState<LootEntry[]>([]);
  const [selectedDistributionId, setSelectedDistributionId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [customQuantity, setCustomQuantity] = useState("1");
  const [magicTable, setMagicTable] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Use refs for characters to avoid hook instability warnings
  const charactersRef = useRef(campaign?.playerCharacters ?? []);
  charactersRef.current = campaign?.playerCharacters ?? [];
  const characters = charactersRef.current;

  const partyLevel = useMemo(() => {
    if (characters.length === 0) return 1;
    return Math.round(characters.reduce((sum, c) => sum + c.level, 0) / characters.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.playerCharacters.length, campaign?.playerCharacters.map((c) => c.level).join(",")]);

  const crTier = useMemo(() => {
    if (partyLevel <= 4) return "0-4";
    if (partyLevel <= 10) return "5-10";
    if (partyLevel <= 16) return "11-16";
    return "17+";
  }, [partyLevel]);

  const totalValue = useMemo(() => {
    return lootEntries.reduce((sum, e) => sum + e.value * e.quantity, 0);
  }, [lootEntries]);

  /* ── Generate Individual Treasure ── */
  const handleGenerateIndividual = useCallback(() => {
    setIsGenerating(true);
    const coins = generateCoins(crTier);
    const entries: LootEntry[] = [];

    if (coins.cp > 0) {
      entries.push({
        id: `loot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: "coin",
        name: "Copper Pieces",
        quantity: coins.cp,
        value: coins.cp * 0.01,
      });
    }
    if (coins.sp > 0) {
      entries.push({
        id: `loot_${Date.now() + 1}_${Math.random().toString(36).slice(2, 6)}`,
        type: "coin",
        name: "Silver Pieces",
        quantity: coins.sp,
        value: coins.sp * 0.1,
      });
    }
    if (coins.gp > 0) {
      entries.push({
        id: `loot_${Date.now() + 2}_${Math.random().toString(36).slice(2, 6)}`,
        type: "coin",
        name: "Gold Pieces",
        quantity: coins.gp,
        value: coins.gp,
      });
    }
    if (coins.pp > 0) {
      entries.push({
        id: `loot_${Date.now() + 3}_${Math.random().toString(36).slice(2, 6)}`,
        type: "coin",
        name: "Platinum Pieces",
        quantity: coins.pp,
        value: coins.pp * 10,
      });
    }

    // Gems / Art Objects (simplified d100 roll)
    const gemRoll = Math.floor(Math.random() * 100) + 1;
    const gemRow = GEMS_ART_TABLE.find((r) => gemRoll >= r.min && gemRoll <= r.max);
    if (gemRow && gemRow.count > 0) {
      for (let i = 0; i < gemRow.count; i++) {
        entries.push({
          id: `loot_${Date.now() + 4 + i}_${Math.random().toString(36).slice(2, 6)}`,
          type: "gem",
          name: gemRow.items[i % gemRow.items.length],
          quantity: 1,
          value: gemRow.value,
        });
      }
    }

    setLootEntries((prev) => [...entries, ...prev]);
    setIsGenerating(false);
    showToast({ message: `Generated ${entries.length} treasure entries!`, type: "success" });
  }, [crTier, showToast]);

  /* ── Generate Magic Item ── */
  const handleGenerateMagic = useCallback(() => {
    const table = MAGIC_ITEM_TABLES[magicTable];
    if (!table) return;
    const item = table.items[Math.floor(Math.random() * table.items.length)];
    const entry: LootEntry = {
      id: `loot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "magic_item",
      name: item.name,
      quantity: 1,
      value: item.rarity === "legendary" ? 50000 : item.rarity === "very_rare" ? 10000 : item.rarity === "rare" ? 2000 : item.rarity === "uncommon" ? 500 : 100,
      description: `From ${table.label}`,
      rarity: item.rarity as LootEntry["rarity"],
    };
    setLootEntries((prev) => [entry, ...prev]);
    showToast({ message: `Generated: ${item.name}`, type: "success" });
  }, [magicTable, showToast]);

  /* ── Add Custom ── */
  const handleAddCustom = useCallback(() => {
    if (!customName.trim()) return;
    const value = parseFloat(customValue) || 0;
    const quantity = parseInt(customQuantity) || 1;
    const entry: LootEntry = {
      id: `loot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "item",
      name: customName.trim(),
      quantity,
      value,
    };
    setLootEntries((prev) => [entry, ...prev]);
    setCustomName("");
    setCustomValue("");
    setCustomQuantity("1");
    showToast({ message: `Added "${entry.name}" ×${quantity}`, type: "info" });
  }, [customName, customValue, customQuantity, showToast]);

  /* ── Distribute to Character ── */
  const handleDistribute = useCallback((lootId: string, characterId: string) => {
    const entry = lootEntries.find((e) => e.id === lootId);
    if (!entry) return;

    const character = characters.find((c) => c.id === characterId);
    if (!character) return;

    const existingEquipment = [...character.equipment];
    const itemStr = `${entry.name}${entry.quantity > 1 ? ` ×${entry.quantity}` : ""}`;

    // For coins, update currency instead
    if (entry.type === "coin") {
      const updatedCurrency = { ...character.currency };
      if (entry.name.includes("Copper")) updatedCurrency.cp = (updatedCurrency.cp ?? 0) + entry.quantity;
      else if (entry.name.includes("Silver")) updatedCurrency.sp = (updatedCurrency.sp ?? 0) + entry.quantity;
      else if (entry.name.includes("Gold")) updatedCurrency.gp = (updatedCurrency.gp ?? 0) + entry.quantity;
      else if (entry.name.includes("Platinum")) updatedCurrency.pp = (updatedCurrency.pp ?? 0) + entry.quantity;

      updatePlayerCharacter(characterId, { currency: updatedCurrency });
    } else {
      updatePlayerCharacter(characterId, {
        equipment: [...existingEquipment, itemStr],
      });
    }

    // Mark as assigned
    setLootEntries((prev) =>
      prev.map((e) => (e.id === lootId ? { ...e, assignedTo: characterId } : e))
    );

    showToast({ message: `"${itemStr}" → ${character.name}`, type: "success" });
  }, [lootEntries, characters, updatePlayerCharacter, showToast]);

  /* ── Remove Entry ── */
  const handleRemove = useCallback((lootId: string) => {
    setLootEntries((prev) => prev.filter((e) => e.id !== lootId));
  }, []);

  /* ── Copy to Clipboard ── */
  const handleCopy = useCallback(() => {
    const lines = lootEntries.map((e) => {
      const assigned = e.assignedTo
        ? ` → ${characters.find((c) => c.id === e.assignedTo)?.name ?? "Unknown"}`
        : "";
      return `• ${e.name} ×${e.quantity} (${e.value * e.quantity} gp)${assigned}`;
    });
    const text = `── Loot Generated ──\nTotal: ${totalValue} gp\n${lines.join("\n")}`;
    navigator.clipboard.writeText(text).then(() => {
      showToast({ message: "Loot copied to clipboard!", type: "success" });
    }).catch(() => {
      showToast({ message: "Failed to copy.", type: "error" });
    });
  }, [lootEntries, characters, totalValue, showToast]);

  const RARITY_COLORS: Record<string, string> = {
    common: "text-surface-400",
    uncommon: "text-emerald-400",
    rare: "text-mage-400",
    very_rare: "text-rogue-400",
    legendary: "text-warrior-400",
  };

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-surface-200 hover:bg-surface-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>💎</span>
          <span>Loot Generator</span>
          {lootEntries.length > 0 && (
            <Badge size="xs" variant="neutral">{lootEntries.length} items</Badge>
          )}
        </span>
        <span className={`text-xs text-surface-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="border-t border-surface-700 p-4 space-y-4">
          {/* Party Info */}
          <div className="flex items-center gap-3 text-xs text-surface-400 bg-surface-800 rounded-lg px-3 py-2">
            <span>Party Level: {partyLevel}</span>
            <span>·</span>
            <span>CR Tier: {crTier}</span>
            <span>·</span>
            <span>{characters.length} PCs</span>
          </div>

          {/* Generate Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button size="xs" onClick={handleGenerateIndividual} disabled={isGenerating}>
              {isGenerating ? "..." : "🎲 Individual"}
            </Button>
            <Button size="xs" variant="secondary" onClick={handleGenerateMagic}>
              ✨ Magic Item
            </Button>
            <select
              value={magicTable}
              onChange={(e) => setMagicTable(parseInt(e.target.value))}
              className="rounded-lg border border-surface-700 bg-surface-800 px-2 py-1 text-[10px] text-surface-300 focus:border-accent-500 focus:outline-none"
            >
              {MAGIC_ITEM_TABLES.map((t, i) => (
                <option key={i} value={i}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Custom Add */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="mb-0.5 block text-[10px] text-surface-500">Item</label>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Custom item..."
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-2.5 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
              />
            </div>
            <div className="w-16">
              <label className="mb-0.5 block text-[10px] text-surface-500">Qty</label>
              <input
                type="number"
                min={1}
                value={customQuantity}
                onChange={(e) => setCustomQuantity(e.target.value)}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-2 py-1.5 text-xs text-surface-100 text-center focus:border-accent-500 focus:outline-none"
              />
            </div>
            <div className="w-20">
              <label className="mb-0.5 block text-[10px] text-surface-500">Value (gp)</label>
              <input
                type="number"
                min={0}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-2 py-1.5 text-xs text-surface-100 text-center focus:border-accent-500 focus:outline-none"
              />
            </div>
            <Button size="xs" onClick={handleAddCustom} disabled={!customName.trim()}>
              + Add
            </Button>
          </div>

          {/* Total Value */}
          {lootEntries.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-400">Total Value:</span>
              <span className="text-sm font-bold text-surface-200">{totalValue.toLocaleString()} gp</span>
            </div>
          )}

          {/* Loot List */}
          {lootEntries.length > 0 && (
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {lootEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 rounded-lg bg-surface-800 px-3 py-2"
                >
                  {/* Type Icon */}
                  <span className="text-base shrink-0">
                    {entry.type === "coin" ? "🪙" : entry.type === "gem" ? "💎" : entry.type === "art" ? "🎨" : entry.type === "magic_item" ? "✨" : "📦"}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-surface-200 truncate">
                        {entry.name}
                      </span>
                      {entry.rarity && (
                        <span className={`text-[9px] ${RARITY_COLORS[entry.rarity] ?? "text-surface-400"}`}>
                          {entry.rarity.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-surface-500">
                      <span>×{entry.quantity}</span>
                      <span>·</span>
                      <span>{(entry.value * entry.quantity).toLocaleString()} gp</span>
                      {entry.assignedTo && (
                        <>
                          <span>·</span>
                          <span className="text-accent-400">
                            → {characters.find((c) => c.id === entry.assignedTo)?.name ?? "?"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Distribute dropdown */}
                    {!entry.assignedTo && characters.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setSelectedDistributionId(selectedDistributionId === entry.id ? null : entry.id)}
                          className="rounded px-1.5 py-0.5 text-[10px] text-surface-400 hover:bg-surface-700 hover:text-surface-200 transition-colors"
                          title="Assign to character"
                        >
                          🎯
                        </button>
                        {selectedDistributionId === entry.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-surface-700 bg-surface-850 py-1 shadow-xl">
                            {characters.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => { handleDistribute(entry.id, c.id); setSelectedDistributionId(null); }}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-surface-100"
                              >
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-700 text-[9px]">
                                  {c.name.charAt(0)}
                                </span>
                                {c.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="rounded px-1 py-0.5 text-[10px] text-warrior-400 hover:bg-warrior-500/10 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Actions */}
          {lootEntries.length > 0 && (
            <div className="flex justify-end gap-2 pt-2 border-t border-surface-700">
              <Button size="xs" variant="ghost" onClick={handleCopy}>
                📋 Copy
              </Button>
              <Button size="xs" variant="ghost" onClick={() => {
                setLootEntries([]);
                showToast({ message: "Loot cleared.", type: "info" });
              }}>
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
