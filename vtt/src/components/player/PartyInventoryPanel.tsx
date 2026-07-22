/**
 * STᚱ VTT — Party Inventory Panel v2 (Batch Operations)
 *
 * A globally accessible DM-facing popover showing ALL player characters'
 * inventories in one unified view. The DM can see, search, transfer,
 * equip/unequip, use consumables, and batch-delete items across the party.
 *
 * Features:
 *   - All characters listed with collapsible inventory sections
 *   - Total party wealth (all currencies combined)
 *   - Item counts (total + equipped + consumables)
 *   - Real-time search across ALL inventories
 *   - Item detail expand on click
 *   - Drag-and-drop transfer between characters
 *   - **Batch operations** — multi-select items, bulk actions
 *   - **Quick-use consumables** — one-click use from the panel
 *   - **Item removal** — drop to ground / delete single items
 *   - **Mass equip/unequip** — toggle all selected
 *   - Premium Overrrides/Lusion-grade glassmorphism
 */

import { useState, useCallback, useMemo, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUIStore } from "@/stores/uiStore";
import type { InventoryItem, PlayerCharacter } from "@/types";
import PremiumIcon from "@/components/ui/PremiumIcon";

// ── 5.5e Coin Conversion ──
const COIN_VALUES = { assarions: 200, quadrants: 50, leptons: 1 };

function totalGoldValue(char: PlayerCharacter): number {
  const c = char.currency;
  return (
    c.assarions * COIN_VALUES.assarions +
    c.quadrants * COIN_VALUES.quadrants +
    c.leptons * COIN_VALUES.leptons
  );
}

function formatGold(gp: number): string {
  return gp.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " gp";
}

function countItems(inv: InventoryItem[]): { total: number; equipped: number; consumables: number } {
  let total = 0, equipped = 0, consumables = 0;
  for (const item of inv) {
    total += item.quantity;
    if (item.isEquipped) equipped += item.quantity;
    const name = item.name.toLowerCase();
    if (name.includes("potion") || name.includes("scroll") || name.includes("ration") || name.includes("torch")) {
      consumables += item.quantity;
    }
  }
  return { total, equipped, consumables };
}

function detectCategory(item: InventoryItem): string {
  const n = item.name.toLowerCase();
  if (item.attackBonus || item.damageDice) return "⚔";
  if (item.acBonus) return "🛡";
  if (n.includes("potion")) return "🧪";
  if (n.includes("scroll")) return "📜";
  if (n.includes("ring")) return "💍";
  if (n.includes("wand") || n.includes("staff")) return "🪄";
  if (n.includes("food") || n.includes("ration")) return "🍖";
  if (n.includes("torch") || n.includes("rope") || n.includes("sack") || n.includes("tool")) return "🛠";
  return "📦";
}

function isConsumable(item: InventoryItem): boolean {
  const n = item.name.toLowerCase();
  return n.includes("potion") || n.includes("scroll") || n.includes("food") || n.includes("ration");
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function PartyInventoryPanel() {
  const characters = useCampaignStore((s) => s.characters);
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const showPartyInventory = useUIStore((s) => s.showPartyInventory);
  const setPartyInventory = useUIStore((s) => s.setPartyInventory);

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedChar, setExpandedChar] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<{ charId: string; itemIndex: number } | null>(null);

  // ── Batch select state ──
  const [batchMode, setBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [batchTargetChar, setBatchTargetChar] = useState<string | null>(null);

  // ── Flash toast ──
  const [flash, setFlash] = useState<{ text: string; type: "success" | "info" | "warning" } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>();

  const showFlash = useCallback((text: string, type: "success" | "info" | "warning" = "info") => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ text, type });
    flashTimer.current = setTimeout(() => setFlash(null), 2500);
  }, []);

  // ── Helper: generate unique item key ──
  const itemKey = (charId: string, idx: number) => `${charId}_${idx}`;
  const parseItemKey = (key: string): { charId: string; idx: number } => {
    const sep = key.lastIndexOf("_");
    return { charId: key.slice(0, sep), idx: Number(key.slice(sep + 1)) };
  };

  // ── Filter characters ──
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return characters;
    const q = searchQuery.toLowerCase();
    return characters.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.inventory?.some((item) => item.name.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [characters, searchQuery]);

  // ── Drag & drop ──
  const handleDragStart = useCallback((charId: string, itemIndex: number) => {
    setDragSource({ charId, itemIndex });
  }, []);

  const handleDrop = useCallback((targetCharId: string) => {
    if (!dragSource || dragSource.charId === targetCharId) { setDragSource(null); return; }
    const src = characters.find((c) => c.id === dragSource.charId);
    const tgt = characters.find((c) => c.id === targetCharId);
    if (!src || !tgt) { setDragSource(null); return; }
    const srcInv = src.inventory || [];
    const item = srcInv[dragSource.itemIndex];
    if (!item) { setDragSource(null); return; }
    const newSrc = [...srcInv]; newSrc.splice(dragSource.itemIndex, 1);
    const newTgt = [...(tgt.inventory || []), { ...item }];
    updateCharacter(dragSource.charId, { inventory: newSrc });
    updateCharacter(targetCharId, { inventory: newTgt });
    showFlash(`Moved ${item.name} → ${tgt.name}`, "success");
    setDragSource(null);
  }, [dragSource, characters, updateCharacter, showFlash]);

  const toggleChar = useCallback((id: string) => {
    setExpandedChar((p) => (p === id ? null : id));
    setExpandedItem(null);
  }, []);

  const toggleItem = useCallback((id: string) => {
    setExpandedItem((p) => (p === id ? null : id));
  }, []);

  // ── Single-item actions ──
  const handleUseConsumable = useCallback((charId: string, idx: number) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return;
    const inv = [...(char.inventory || [])];
    const item = inv[idx];
    if (!item || !isConsumable(item)) return;
    const qty = item.quantity - 1;
    if (qty <= 0) inv.splice(idx, 1);
    else inv[idx] = { ...item, quantity: qty };
    updateCharacter(charId, { inventory: inv });
    showFlash(`🧪 Used ${item.name}`, "info");
  }, [characters, updateCharacter, showFlash]);

  const handleRemoveItem = useCallback((charId: string, idx: number) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return;
    const inv = [...(char.inventory || [])];
    const item = inv[idx];
    if (!item) return;
    inv.splice(idx, 1);
    updateCharacter(charId, { inventory: inv });
    showFlash(`🗑 Removed ${item.name}`, "warning");
  }, [characters, updateCharacter, showFlash]);

  const handleToggleEquip = useCallback((charId: string, idx: number) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return;
    const inv = [...(char.inventory || [])];
    const item = inv[idx];
    if (!item) return;
    inv[idx] = { ...item, isEquipped: !item.isEquipped };
    updateCharacter(charId, { inventory: inv });
    showFlash(inv[idx].isEquipped ? `⚔ Equipped ${item.name}` : `📦 Unequipped ${item.name}`, "success");
  }, [characters, updateCharacter, showFlash]);

  // ── Batch logic ──
  const toggleBatchSelect = useCallback((key: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const batchSelectAll = useCallback(() => {
    const all = new Set<string>();
    for (const c of filtered) {
      if (!expandedChar || expandedChar === c.id) {
        for (let i = 0; i < (c.inventory || []).length; i++) {
          all.add(itemKey(c.id, i));
        }
      }
    }
    setSelectedItems(all);
  }, [filtered, expandedChar]);

  const batchClearSelection = useCallback(() => setSelectedItems(new Set()), []);

  const batchTransfer = useCallback(() => {
    if (!batchTargetChar || selectedItems.size === 0) return;
    const target = characters.find((c) => c.id === batchTargetChar);
    if (!target) return;

    const updates: Record<string, InventoryItem[]> = {};
    for (const key of selectedItems) {
      const { charId, idx } = parseItemKey(key);
      if (!updates[charId]) updates[charId] = [...(characters.find((c) => c.id === charId)?.inventory || [])];
      const srcInv = updates[charId];
      const item = srcInv[idx];
      if (!item) continue;
      srcInv.splice(idx, 1);
      // Add to target
      if (!updates[batchTargetChar]) updates[batchTargetChar] = [...(target.inventory || [])];
      updates[batchTargetChar] = [...(updates[batchTargetChar] || []), { ...item }];
    }

    for (const [cid, inv] of Object.entries(updates)) {
      updateCharacter(cid, { inventory: inv });
    }

    showFlash(`Transferred ${selectedItems.size} item(s) to ${target.name}`, "success");
    setSelectedItems(new Set());
  }, [batchTargetChar, selectedItems, characters, updateCharacter, showFlash]);

  const batchToggleEquip = useCallback(() => {
    if (selectedItems.size === 0) return;
    const grouped: Record<string, [number, boolean][]> = {};
    for (const key of selectedItems) {
      const { charId, idx } = parseItemKey(key);
      const char = characters.find((c) => c.id === charId);
      const item = char?.inventory?.[idx];
      if (!item) continue;
      if (!grouped[charId]) grouped[charId] = [];
      grouped[charId].push([idx, !item.isEquipped]);
    }
    for (const [charId, changes] of Object.entries(grouped)) {
      const inv = [...(characters.find((c) => c.id === charId)?.inventory || [])];
      for (const [idx, equip] of changes) {
        if (inv[idx]) inv[idx] = { ...inv[idx], isEquipped: equip };
      }
      updateCharacter(charId, { inventory: inv });
    }
    const action = grouped[Object.keys(grouped)[0]]?.[0]?.[1] ? "Equipped" : "Unequipped";
    showFlash(`${action} ${selectedItems.size} item(s)`, "success");
    setSelectedItems(new Set());
  }, [selectedItems, characters, updateCharacter, showFlash]);

  const batchDelete = useCallback(() => {
    if (selectedItems.size === 0) return;
    const grouped: Record<string, Set<number>> = {};
    for (const key of selectedItems) {
      const { charId, idx } = parseItemKey(key);
      if (!grouped[charId]) grouped[charId] = new Set();
      grouped[charId].add(idx);
    }
    let removedCount = 0;
    for (const [charId, indices] of Object.entries(grouped)) {
      const inv = [...(characters.find((c) => c.id === charId)?.inventory || [])];
      const sorted = [...indices].sort((a, b) => b - a);
      for (const idx of sorted) { if (idx >= 0 && idx < inv.length) { inv.splice(idx, 1); removedCount++; } }
      updateCharacter(charId, { inventory: inv });
    }
    showFlash(`🗑 Removed ${removedCount} item(s)`, "warning");
    setSelectedItems(new Set());
  }, [selectedItems, characters, updateCharacter, showFlash]);

  // ── Party stats ──
  const partyStats = useMemo(() => {
    let totalGP = 0, totalItems = 0, totalWeight = 0, equippedCount = 0;
    for (const c of characters) {
      totalGP += totalGoldValue(c);
      for (const item of c.inventory || []) {
        totalItems += item.quantity;
        totalWeight += (item.weight || 0) * item.quantity;
        if (item.isEquipped) equippedCount += item.quantity;
      }
    }
    return { totalGP, totalItems, totalWeight, equippedCount };
  }, [characters]);

  // ── Characters available for batch transfer (exclude source) ──
  const transferableChars = useMemo(() => {
    return characters.filter((c) => c.id !== batchTargetChar);
  }, [characters, batchTargetChar]);

  if (!showPartyInventory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) { setBatchMode(false); setDragSource(null); } }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden
        bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
        border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]
        animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out"
        style={{ animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-500/15 to-amber-500/10 flex items-center justify-center border border-gold/10">
              <PremiumIcon name="loot" className="w-4 h-4 text-gold-400" />
            </div>
            <h2 className="font-display text-base text-white/90">Party Inventory</h2>
            {batchMode && (
              <span className="text-[10px] text-gold-400/70 tabular-nums ml-1">{selectedItems.size} selected</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setBatchMode((b) => !b)}
              className={`text-[10px] px-2 py-1 rounded-lg transition-all duration-150
                ${batchMode
                  ? "bg-gold-500/10 border border-gold/10 text-gold-400"
                  : "bg-surface-800/30 border border-white/[0.04] text-surface-400 hover:border-white/[0.08]"}`}
            >
              {batchMode ? "✅ Batch On" : "☑ Batch"}
            </button>
            <span className="text-[11px] text-surface-400 tabular-nums">
              {characters.length} {characters.length === 1 ? "character" : "characters"}
            </span>
          </div>
        </div>

        {/* ── Party Wealth Strip ── */}
        <div className="mx-4 mb-2 p-2.5 rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04]">
          <div className="flex items-center justify-between text-[11px] text-surface-400 mb-1">
            <span>💰 Party Wealth</span>
            <span className="text-gold-300 tabular-nums">{formatGold(partyStats.totalGP)}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-surface-500">
            <span>📦 {partyStats.totalItems} items</span>
            <span>⚔ {partyStats.equippedCount} equipped</span>
            <span>⚖ {partyStats.totalWeight.toFixed(0)} lb</span>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="mx-4 mb-2">
          <div className="relative">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items or characters..."
              className="w-full h-9 text-[12px] bg-[#07080d]/70 border border-white/[0.06] rounded-lg pl-8 pr-3
                text-white/80 placeholder:text-surface-500
                focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-150"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500 pointer-events-none"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </div>

        {/* ── Flash Toast ── */}
        {flash && (
          <div className={`mx-4 mb-2 p-2 rounded-lg text-[11px] animate-in slide-in-from-top-1 fade-in duration-150
            ${flash.type === "success" ? "bg-emerald-500/10 border border-emerald-500/15 text-emerald-300" :
              flash.type === "warning" ? "bg-amber-500/10 border border-amber-500/15 text-amber-300" :
              "bg-gold-500/10 border border-gold-500/15 text-gold-300"}`}
          >{flash.text}</div>
        )}

        {/* ── Batch Action Toolbar ── */}
        {batchMode && selectedItems.size > 0 && (
          <div className="mx-4 mb-2 p-2 rounded-xl bg-gold-500/5 border border-gold-500/10 animate-in slide-in-from-top-1 fade-in duration-150">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={batchSelectAll}
                className="text-[9px] px-1.5 py-1 rounded bg-white/[0.03] text-surface-400 hover:text-white/70 transition-colors">
                Select All
              </button>
              <button onClick={batchClearSelection}
                className="text-[9px] px-1.5 py-1 rounded bg-white/[0.03] text-surface-400 hover:text-white/70 transition-colors">
                Clear
              </button>
              <span className="text-[8px] text-surface-500 mx-0.5">|</span>
              <button onClick={batchToggleEquip}
                className="text-[9px] px-1.5 py-1 rounded bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-colors">
                ⚔ Toggle Equip
              </button>
              <button onClick={batchDelete}
                className="text-[9px] px-1.5 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
                🗑 Delete
              </button>
              <span className="text-[8px] text-surface-500 mx-0.5">|</span>
              {/* Transfer target selector */}
              <select value={batchTargetChar || ""} onChange={(e) => setBatchTargetChar(e.target.value || null)}
                className="text-[9px] px-1.5 py-1 rounded bg-surface-800/50 border border-white/[0.06] text-surface-300
                  focus:outline-none focus:border-gold-500/25 max-w-[100px]"
              >
                <option value="">→ Transfer to...</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button onClick={batchTransfer} disabled={!batchTargetChar}
                className={`text-[9px] px-1.5 py-1 rounded transition-colors
                  ${batchTargetChar
                    ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-surface-800/30 text-surface-600 cursor-not-allowed"}`}
              >
                📤 Transfer
              </button>
            </div>
          </div>
        )}

        {/* ── Character List ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 max-h-[50vh] space-y-1.5 scrollbar-gold">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <p className="text-[12px] text-surface-400">No characters or items match your search.</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="mt-1.5 text-[11px] text-gold-400/70 hover:text-gold-400 transition-colors">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filtered.map((char) => {
              const inv = char.inventory || [];
              const stats = countItems(inv);
              const isExpanded = expandedChar === char.id;
              const gp = totalGoldValue(char);

              return (
                <div key={char.id}
                  className={`rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent border
                    ${dragSource && dragSource.charId !== char.id ? "border-gold-500/15" : "border-white/[0.04]"}
                    transition-all duration-150 overflow-hidden`}
                  onDragOver={(e) => dragSource && dragSource.charId !== char.id && e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleDrop(char.id); }}
                >
                  {/* Character header */}
                  <button onClick={() => toggleChar(char.id)}
                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-white/[0.02] transition-colors duration-150 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-500/10 to-amber-500/5
                        flex items-center justify-center text-[10px] font-bold flex-shrink-0
                        border border-gold/10 text-gold-400 tabular-nums">{char.level}</div>
                      <div className="min-w-0">
                        <div className="text-[12px] text-white/80 truncate">{char.name}</div>
                        <div className="text-[9px] text-surface-500 truncate">{char.race} · {char.class}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-gold-400/60 tabular-nums">{formatGold(gp)}</span>
                      <span className="text-[10px] text-surface-500 tabular-nums">{inv.length} items</span>
                      <svg className={`w-3 h-3 text-surface-500 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </button>

                  {/* Item stats row */}
                  <div className="px-2.5 pb-1.5 flex gap-2 text-[9px] text-surface-500">
                    <span>📦 {stats.total} total</span>
                    {stats.equipped > 0 && <span>⚔ {stats.equipped} eq.</span>}
                    {stats.consumables > 0 && <span>🧪 {stats.consumables} con.</span>}
                  </div>

                  {/* Expanded inventory */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.04]">
                      {inv.length === 0 ? (
                        <div className="px-3 py-4 text-center text-[11px] text-surface-500 italic">
                          No items in inventory
                        </div>
                      ) : (
                        <div className="divide-y divide-white/[0.03]">
                          {inv.map((item, idx) => {
                            const key = itemKey(char.id, idx);
                            const isDragActive = dragSource?.charId === char.id && dragSource?.itemIndex === idx;
                            const isItemExpanded = expandedItem === key;
                            const icon = detectCategory(item);
                            const isSelected = selectedItems.has(key);
                            const isConsumableItem = isConsumable(item);

                            return (
                              <div key={key}
                                className={`group ${isDragActive ? "opacity-40" : ""} transition-all duration-150`}
                                draggable={!batchMode}
                                onDragStart={() => handleDragStart(char.id, idx)}
                              >
                                <div className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-white/[0.03] transition-colors duration-150">
                                  {/* Batch checkbox */}
                                  {batchMode && (
                                    <input type="checkbox" checked={isSelected}
                                      onChange={() => toggleBatchSelect(key)}
                                      className="w-3 h-3 rounded border-white/20 bg-surface-800/50
                                        checked:bg-gold-500/60 checked:border-gold-500/60
                                        focus:ring-0 focus:outline-none cursor-pointer"
                                    />
                                  )}

                                  {/* Item name — click to expand */}
                                  <button onClick={() => toggleItem(key)}
                                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                                  >
                                    <span className="text-[12px] flex-shrink-0">{icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-white/70 truncate">{item.name}</span>
                                        {item.isEquipped && (
                                          <span className="text-[8px] px-1 py-px rounded bg-gold-500/10 border border-gold/10 text-gold-400 flex-shrink-0">
                                            equipped
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-[9px] text-surface-500 mt-0.5">
                                        {item.quantity > 1 && <span>x{item.quantity}</span>}
                                        {item.weight > 0 && <span>{item.weight} lb</span>}
                                        {item.attackBonus && <span>ATK +{item.attackBonus}</span>}
                                        {item.damageDice && <span>{item.damageDice}</span>}
                                      </div>
                                    </div>
                                  </button>

                                  {/* Single-item action buttons (non-batch mode) */}
                                  {!batchMode && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
                                      {isConsumableItem && (
                                        <button onClick={(e) => { e.stopPropagation(); handleUseConsumable(char.id, idx); }}
                                          className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                          title="Use item"
                                        >▶ Use</button>
                                      )}
                                      <button onClick={(e) => { e.stopPropagation(); handleToggleEquip(char.id, idx); }}
                                        className={`text-[9px] px-1 py-0.5 rounded transition-colors
                                          ${item.isEquipped
                                            ? "bg-surface-800/50 text-surface-400 hover:bg-surface-700/50"
                                            : "bg-gold-500/10 text-gold-400 hover:bg-gold-500/20"}`}
                                        title={item.isEquipped ? "Unequip" : "Equip"}
                                      >{item.isEquipped ? "📦" : "⚔"}</button>
                                      <button onClick={(e) => { e.stopPropagation(); handleRemoveItem(char.id, idx); }}
                                        className="text-[9px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                                        title="Remove item"
                                      >✕</button>
                                    </div>
                                  )}
                                </div>

                                {/* Expanded detail */}
                                {isItemExpanded && (
                                  <div className="px-2.5 pb-2 pt-0.5 animate-in slide-in-from-top-1 fade-in duration-150">
                                    <div className="rounded-lg bg-surface-800/20 border border-white/[0.04] p-2 ml-5">
                                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                                        {item.attackBonus !== undefined && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-surface-500">ATK:</span>
                                            <span className="text-rose-400 tabular-nums">{item.attackBonus >= 0 ? "+" : ""}{item.attackBonus}</span>
                                          </div>
                                        )}
                                        {item.damageDice && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-surface-500">DMG:</span>
                                            <span className="text-rose-400">{item.damageDice}</span>
                                          </div>
                                        )}
                                        {item.damageType && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-surface-500">Type:</span>
                                            <span className="text-surface-300">{item.damageType}</span>
                                          </div>
                                        )}
                                        {item.acBonus !== undefined && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-surface-500">AC:</span>
                                            <span className="text-cyan-400 tabular-nums">+{item.acBonus}</span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                          <span className="text-surface-500">Qty:</span>
                                          <span className="text-gold-400 tabular-nums">{item.quantity}</span>
                                        </div>
                                        {item.weight > 0 && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-surface-500">Wt:</span>
                                            <span className="text-surface-300 tabular-nums">{item.weight} lb</span>
                                          </div>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="mt-1.5 text-[10px] text-surface-400 leading-relaxed">{item.description}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[9px] text-surface-500">
            {batchMode ? "Check items above · use toolbar for batch actions" : "Drag items between characters · ☑ Batch for multi-select"}
          </span>
          <button onClick={() => setPartyInventory(false)}
            className="text-[10px] text-gold-400/60 hover:text-gold-400 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}
