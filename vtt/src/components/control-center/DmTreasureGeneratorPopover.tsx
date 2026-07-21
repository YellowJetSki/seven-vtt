/**
 * ST VTT — DM Treasure & Loot Generator Popover
 *
 * DMG-based treasure generation for D&D 5.5e.
 * Generates individual treasure parcels (CR 0-4, 5-10, 11-16, 17+),
 * treasure hoards with magic items, and filtering by campaign state.
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useCampaignStore } from "@/stores/campaignStore";
import PremiumIcon from "@/components/ui/PremiumIcon";

type TreasureTier = "0-4" | "5-10" | "11-16" | "17+";
type LootType = "individual" | "hoard";

interface CoinPurse {
  cp: number; sp: number; ep: number; gp: number; pp: number;
}

interface MagicItem {
  name: string;
  type: string;
  rarity: string;
  table: string;
}

const TIERS: { label: string; value: TreasureTier; color: string }[] = [
  { label: "CR 0–4", value: "0-4", color: "text-emerald-400" },
  { label: "CR 5–10", value: "5-10", color: "text-amber-400" },
  { label: "CR 11–16", value: "11-16", color: "text-rose-400" },
  { label: "CR 17+", value: "17+", color: "text-violet-400" },
];

const TIER_TREASURE: Record<TreasureTier, { individual: CoinPurse; hoard: { coins: CoinPurse; art: string; gems: string; magic: string; magicItems: MagicItem[] } }> = {
  "0-4": {
    individual: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    hoard: {
      coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      art: "", gems: "", magic: "Roll 1d6 times on Magic Item Table A, 1d6 times on Table B",
      magicItems: [
        { name: "Potion of Healing", type: "Potion", rarity: "Common", table: "A" },
        { name: "Spell Scroll (Cantrip)", type: "Scroll", rarity: "Common", table: "A" },
        { name: "Potion of Climbing", type: "Potion", rarity: "Common", table: "A" },
        { name: "Spell Scroll (1st Level)", type: "Scroll", rarity: "Common", table: "B" },
        { name: "Potion of Animal Friendship", type: "Potion", rarity: "Uncommon", table: "B" },
        { name: "Bag of Holding", type: "Wondrous Item", rarity: "Uncommon", table: "B" },
      ],
    },
  },
  "5-10": {
    individual: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    hoard: {
      coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      art: "Roll 1d4 times: 25 gp art objects (silver ewer, carved bone statue)",
      gems: "Roll 2d6 times: 10 gp gems (agate, carnelian, jade)",
      magic: "Roll 1d4 times on Table B, 1d4 times on Table C, 1d4 times on Table D",
      magicItems: [
        { name: "Weapon of Warning", type: "Weapon", rarity: "Uncommon", table: "B" },
        { name: "Goggles of Night", type: "Wondrous Item", rarity: "Uncommon", table: "B" },
        { name: "Necklace of Adaptation", type: "Wondrous Item", rarity: "Uncommon", table: "B" },
        { name: "Cloak of Protection", type: "Wondrous Item", rarity: "Uncommon", table: "C" },
        { name: "Ring of Mind Shielding", type: "Ring", rarity: "Uncommon", table: "C" },
        { name: "Wand of Magic Missiles", type: "Wand", rarity: "Uncommon", table: "C" },
        { name: "Staff of the Python", type: "Staff", rarity: "Uncommon", table: "D" },
        { name: "Bracers of Archery", type: "Wondrous Item", rarity: "Uncommon", table: "D" },
      ],
    },
  },
  "11-16": {
    individual: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    hoard: {
      coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      art: "Roll 1d4 times: 250 gp art objects (gold figurine, silver goblet)",
      gems: "Roll 2d4 times: 50 gp gems (bloodstone, pearl, tourmaline)",
      magic: "Roll 1d4 times on Table C, 1d4 times on Table D, 1d4 times on Table E, 1d4 times on Table F",
      magicItems: [
        { name: "Ring of Spell Storing", type: "Ring", rarity: "Rare", table: "C" },
        { name: "Cloak of Displacement", type: "Wondrous Item", rarity: "Rare", table: "D" },
        { name: "Belt of Hill Giant Strength", type: "Wondrous Item", rarity: "Rare", table: "E" },
        { name: "Staff of Healing", type: "Staff", rarity: "Rare", table: "E" },
        { name: "Plate Armor of Resistance", type: "Armor", rarity: "Very Rare", table: "F" },
        { name: "Ring of Telekinesis", type: "Ring", rarity: "Very Rare", table: "F" },
      ],
    },
  },
  "17+": {
    individual: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    hoard: {
      coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      art: "Roll 1d8 times: 750 gp art objects (jeweled crown, tapestry)",
      gems: "Roll 3d6 times: 100 gp gems (opal, topaz, diamond)",
      magic: "Roll 1d4 times on Table D, 1d4 times on Table E, 1d4 times on Table F, 1d4 times on Table G, 1d4 times on Table H",
      magicItems: [
        { name: "Manual of Bodily Health", type: "Wondrous Item", rarity: "Very Rare", table: "D" },
        { name: "Rod of Alertness", type: "Rod", rarity: "Very Rare", table: "E" },
        { name: "Carpet of Flying", type: "Wondrous Item", rarity: "Very Rare", table: "F" },
        { name: "Holy Avenger", type: "Weapon", rarity: "Legendary", table: "G" },
        { name: "Ring of Three Wishes", type: "Ring", rarity: "Legendary", table: "H" },
        { name: "Staff of the Magi", type: "Staff", rarity: "Legendary", table: "H" },
      ],
    },
  },
};

function generateIndividualTreasure(tier: TreasureTier): CoinPurse {
  const r = () => Math.floor(Math.random() * 100) + 1;
  switch (tier) {
    case "0-4": return { cp: r() * 5, sp: r() * 5, ep: 0, gp: r() * 1, pp: 0 };
    case "5-10": return { cp: 0, sp: r() * 10, ep: 0, gp: r() * 10 + Math.floor(r() / 20) * 10, pp: 0 };
    case "11-16": return { cp: 0, sp: 0, ep: r() * 5, gp: r() * 20 + Math.floor(r() / 10) * 10, pp: Math.floor(r() / 10) * 5 };
    case "17+": return { cp: 0, sp: 0, ep: 0, gp: r() * 100, pp: r() * 20 + Math.floor(r() / 10) * 10 };
  }
}

function generateHoardCoins(tier: TreasureTier): CoinPurse {
  const r = () => Math.floor(Math.random() * 100) + 1;
  const r6 = () => Math.floor(Math.random() * 6) + 1;
  switch (tier) {
    case "0-4": return { cp: r6() * 100, sp: r6() * 100, ep: 0, gp: r6() * 50 + r6() * 10, pp: 0 };
    case "5-10": return { cp: 0, sp: r() * 100, ep: r6() * 10, gp: r() * 50 + r6() * 100, pp: r6() * 10 };
    case "11-16": return { cp: 0, sp: 0, ep: r6() * 10, gp: r() * 200 + r6() * 500, pp: r6() * 50 };
    case "17+": return { cp: 0, sp: 0, ep: 0, gp: r6() * 1000 + r6() * 1000, pp: r6() * 200 };
  }
}

function generateMagicItems(tier: TreasureTier): MagicItem[] {
  const countTable = { "0-4": { A: 1, B: 1 }, "5-10": { B: 1, C: 1, D: 1 }, "11-16": { C: 1, D: 1, E: 1, F: 1 }, "17+": { D: 1, E: 1, F: 1, G: 1, H: 1 } };
  const data = TIER_TREASURE[tier].hoard;
  const items: MagicItem[] = [];
  const selected: MagicItem[] = [];
  const pool = data.magicItems;
  const count = Math.min(4, pool.length);
  while (selected.length < count) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!selected.find((s) => s.name === pick.name)) selected.push({ ...pick });
  }
  return selected;
}

export default function DmTreasureGeneratorPopover() {
  const showTreasure = useUIStore((s) => s.showTreasureGenerator);
  const setTreasure = useUIStore((s) => s.setTreasureGenerator);
  const characters = useCampaignStore((s) => s.characters);

  const [activeTab, setActiveTab] = useState<LootType>("individual");
  const [tier, setTier] = useState<TreasureTier>("5-10");
  const [generated, setGenerated] = useState<{ coins: CoinPurse; items?: MagicItem[] } | null>(null);
  const [animPhase, setAnimPhase] = useState<"entering" | "visible" | "exiting">("entering");
  const overlayRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (showTreasure) { setAnimPhase("entering"); requestAnimationFrame(() => setAnimPhase("visible")); }
    else setAnimPhase("exiting");
  }, [showTreasure]);

  useEffect(() => {
    if (!showTreasure) return;
    const hk = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", hk);
    return () => window.removeEventListener("keydown", hk);
  }, [showTreasure]);

  const handleClose = useCallback(() => {
    setAnimPhase("exiting");
    setTimeout(() => { setTreasure(false); setGenerated(null); }, 150);
  }, [setTreasure]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  }, [handleClose]);

  const handleGenerate = useCallback(() => {
    if (activeTab === "individual") {
      const coins = generateIndividualTreasure(tier);
      setGenerated({ coins });
    } else {
      const coins = generateHoardCoins(tier);
      const items = generateMagicItems(tier);
      setGenerated({ coins, items });
    }
  }, [activeTab, tier]);

  const totalGP = useMemo(() => {
    if (!generated) return 0;
    const c = generated.coins;
    return c.cp / 100 + c.sp / 10 + c.ep / 2 + c.gp + c.pp * 5;
  }, [generated]);

  const handleCopyItem = useCallback((name: string, i: number) => {
    navigator.clipboard.writeText(name).then(() => {
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  }, []);

  if (!showTreasure && animPhase !== "entering") return null;

  return (
    <div ref={overlayRef} className={`fixed inset-0 z-50 flex items-center justify-center ${animPhase === "visible" ? "pointer-events-auto" : "pointer-events-none"}`} onClick={handleBackdrop}>
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${animPhase === "visible" ? "opacity-100" : "opacity-0"}`} />
      <div className={`relative w-[620px] max-w-[95vw] max-h-[85vh] overflow-y-auto bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)] ${animPhase === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <PremiumIcon name="loot" className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-50">Treasure & Loot Generator</h2>
              <p className="text-[10px] text-surface-500">DMG treasure tables · Individual parcels & hoards</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all duration-150" aria-label="Close">
            <PremiumIcon name="close" className="w-3.5 h-3.5 text-surface-500" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3 pb-2 border-b border-white/[0.04]">
          <button onClick={() => { setActiveTab("individual"); setGenerated(null); }} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all duration-150 active:scale-90 ${activeTab === "individual" ? "bg-gold-500/12 text-gold-300 border border-gold/20" : "text-surface-400 border border-white/[0.04] hover:border-white/[0.08]"}`}>💰 Individual Treasure</button>
          <button onClick={() => { setActiveTab("hoard"); setGenerated(null); }} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all duration-150 active:scale-90 ${activeTab === "hoard" ? "bg-gold-500/12 text-gold-300 border border-gold/20" : "text-surface-400 border border-white/[0.04] hover:border-white/[0.08]"}`}>🏆 Treasure Hoard</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-surface-500 font-bold mb-1.5 block">Challenge Rating Tier</label>
            <div className="flex gap-1.5">
              {TIERS.map((t) => (
                <button key={t.value} onClick={() => { setTier(t.value); setGenerated(null); }} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-150 active:scale-90 ${tier === t.value ? "bg-gold-500/12 text-gold-300 border border-gold/20" : "bg-white/[0.02] text-surface-400 border border-white/[0.04] hover:bg-white/[0.04]"}`}>
                  <span className={t.color}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} className="w-full py-2 rounded-lg text-[11px] font-bold bg-gold-500/12 text-gold-400 border border-gold/20 hover:bg-gold-500/18 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2">
            <PremiumIcon name="loot" className="w-3.5 h-3.5" />
            Generate {activeTab === "hoard" ? "Treasure Hoard" : "Individual Treasure"}
          </button>

          {generated && (
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-amber-50">
                  {activeTab === "hoard" ? "🏆 Treasure Hoard" : "💰 Individual Treasure"} — {TIERS.find((t) => t.value === tier)?.label}
                </h3>
                <span className="text-[9px] font-mono tabular-nums text-amber-400">
                  ≈ {totalGP.toFixed(1)} GP
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {(["cp", "sp", "ep", "gp", "pp"] as const).map((coin) => (
                  <div key={coin} className="bg-surface-800/30 rounded-lg px-1.5 py-1.5 text-center">
                    <div className="text-[14px]">{coin === "cp" ? "🟤" : coin === "sp" ? "⚪" : coin === "ep" ? "🔵" : coin === "gp" ? "🟡" : "🟣"}</div>
                    <div className="text-[9px] font-mono tabular-nums text-white/80">{generated.coins[coin]}</div>
                    <div className="text-[7px] uppercase tracking-wider text-surface-500">{coin}</div>
                  </div>
                ))}
              </div>

              {activeTab === "hoard" && generated.items && generated.items.length > 0 && (
                <>
                  <div className="border-t border-white/[0.04] pt-2">
                    <h4 className="text-[10px] font-bold text-amber-50 mb-2">✨ Magic Items</h4>
                    <div className="space-y-1">
                      {generated.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/[0.03] transition-colors">
                          <div>
                            <span className="text-[10px] text-white/80">{item.name}</span>
                            <span className="text-[8px] text-surface-500 ml-1">
                              · {item.type} · {item.rarity}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[7px] uppercase tracking-wider text-gold-500/50 font-bold">Table {item.table}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopyItem(item.name, i); }}
                              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all"
                              title="Copy item name"
                            >
                              {copiedIndex === i ? (
                                <span className="text-[8px] text-emerald-400">✓</span>
                              ) : (
                                <PremiumIcon name="copy" className="w-3 h-3 text-surface-500" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.04] pt-2">
                    <p className="text-[9px] text-surface-500 italic">{TIER_TREASURE[tier].hoard.magic}</p>
                    <p className="text-[8px] text-surface-600 mt-1">Art: {TIER_TREASURE[tier].hoard.art}</p>
                    <p className="text-[8px] text-surface-600">Gems: {TIER_TREASURE[tier].hoard.gems}</p>
                  </div>
                </>
              )}

              <div className="border-t border-white/[0.04] pt-2 flex items-center justify-between">
                <span className="text-[8px] text-surface-600">Part of {characters.length} characters</span>
                <button
                  onClick={handleGenerate}
                  className="text-[9px] text-gold-400 hover:text-gold-300 active:scale-95 transition-all"
                >
                  🔄 Reroll
                </button>
              </div>
            </div>
          )}

          {!generated && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-amber-500/8 border border-amber-500/10 flex items-center justify-center mx-auto mb-3">
                <PremiumIcon name="loot" className="w-6 h-6 text-amber-400/60" />
              </div>
              <p className="text-xs text-surface-500">Select a CR tier and click Generate</p>
              <p className="text-[9px] text-surface-600 mt-1">DMG treasure tables will produce appropriate loot</p>
            </div>
          )}
        </div>

        <div className="px-5 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[8px] text-surface-600">DMG Chapter 7: Treasure · Individual & Hoard tables</span>
          <span className="text-[7px] text-surface-700">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
