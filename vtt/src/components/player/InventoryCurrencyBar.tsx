/**
 * STᚱ VTT — Inventory Currency Bar
 *
 * Interactive currency editor with:
 * - Tap coin to edit amount
 * - Quick-add presets (+5, +10, +25, +50, +100 GP)
 * - Roll-up denominations (100 CP → 1 SP, etc.)
 * - Color-coded coin types with icons
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { PlayerCharacter } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";

interface CoinDef {
  label: string;
  key: keyof PlayerCharacter["currency"];
  color: string;
  icon: string;
  valueToNext: number;  // how many of this = 1 of next higher
  nextKey: keyof PlayerCharacter["currency"] | null;
  sortOrder: number;
}

const COINS: CoinDef[] = [
  { label: "PP", key: "platinum",   color: "text-cyan-300",  icon: "💎", valueToNext: 0,  nextKey: null,            sortOrder: 5 },
  { label: "GP", key: "gold",       color: "text-amber-400", icon: "🪙", valueToNext: 10, nextKey: "platinum",      sortOrder: 4 },
  { label: "EP", key: "electrum",   color: "text-gold-500/60",icon: "💠", valueToNext: 2,  nextKey: "gold",          sortOrder: 3 },
  { label: "SP", key: "silver",     color: "text-surface-300",icon: "🥈", valueToNext: 10, nextKey: "electrum",      sortOrder: 2 },
  { label: "CP", key: "copper",     color: "text-amber-600", icon: "🟤", valueToNext: 10, nextKey: "silver",         sortOrder: 1 },
];

interface InventoryCurrencyBarProps {
  currency: PlayerCharacter["currency"];
  characterId: string;
}

export default function InventoryCurrencyBar({ currency, characterId }: InventoryCurrencyBarProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editKey && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editKey]);

  // ── Currency mutations ──
  const updateCurrency = useCallback(
    (key: keyof PlayerCharacter["currency"], value: number) => {
      updateCharacter(characterId, {
        currency: { ...currency, [key]: Math.max(0, value) },
      });
    },
    [characterId, currency, updateCharacter]
  );

  const addCurrency = useCallback(
    (key: keyof PlayerCharacter["currency"], amount: number) => {
      const current = currency[key] || 0;
      if (amount >= 0) {
        updateCurrency(key, current + amount);
      } else {
        const absAmount = Math.abs(amount);
        if (current >= absAmount) {
          updateCurrency(key, current - absAmount);
        } else {
          // Need to break higher coin
          const coinDef = COINS.find((c) => c.key === key);
          if (coinDef?.nextKey) {
            const higherAmount = currency[coinDef.nextKey] || 0;
            if (higherAmount >= 1) {
              updateCurrency(coinDef.nextKey, higherAmount - 1);
              updateCurrency(key, current + coinDef.valueToNext - absAmount);
            }
          }
        }
      }
    },
    [currency, updateCurrency]
  );

  // ── Submit edit ──
  const submitEdit = useCallback(() => {
    if (!editKey) return;
    const val = parseInt(editValue);
    if (!isNaN(val) && val >= 0) {
      updateCurrency(editKey as keyof PlayerCharacter["currency"], val);
    }
    setEditKey(null);
  }, [editKey, editValue, updateCurrency]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Currency</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {COINS.map((coin) => (
          <div key={coin.key}>
            {editKey === coin.key ? (
              <div className="flex flex-col items-center bg-obsidian-mid/60 rounded-xl border border-gold/20 py-1.5 px-1 transition-all duration-150">
                <span className="text-[8px] text-gold-500/50 mb-0.5">{coin.icon} {coin.label}</span>
                <input
                  ref={inputRef}
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitEdit();
                    if (e.key === "Escape") setEditKey(null);
                  }}
                  onBlur={submitEdit}
                  className="w-full bg-transparent text-center text-xs font-bold text-surface-200 focus:outline-none tabular-nums"
                  min={0}
                />
              </div>
            ) : (
              <button
                onClick={() => { setEditKey(coin.key); setEditValue(String(currency[coin.key])); }}
                className="w-full flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-2.5 hover:border-gold/15 hover:bg-gold-500/[0.02] active:scale-95 transition-all duration-150"
              >
                <span className="text-[9px] uppercase font-black text-gold-500/50">{coin.icon} {coin.label}</span>
                <span className={`text-base font-bold tabular-nums ${coin.color}`}>{currency[coin.key]}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Quick-add presets */}
      <div className="flex gap-1 mt-1.5 flex-wrap items-center">
        <span className="text-[8px] text-surface-600 uppercase tracking-wider">Quick add:</span>
        {[1, 5, 10, 25, 50, 100].map((amt) => (
          <button
            key={amt}
            onClick={() => addCurrency("gold", amt)}
            className="px-2 py-0.5 rounded text-[8px] bg-gold-500/8 border border-gold/10 text-gold-500/70 hover:bg-gold-500/15 active:scale-95 transition-all"
          >
            +{amt} GP
          </button>
        ))}
        {[1, 10, 100].map((amt) => (
          <button
            key={`sp-${amt}`}
            onClick={() => addCurrency("silver", amt)}
            className="px-2 py-0.5 rounded text-[8px] bg-surface-700/30 border border-surface-600/30 text-surface-400 hover:bg-surface-700/50 active:scale-95 transition-all"
          >
            +{amt} SP
          </button>
        ))}
      </div>

      {/* Total value estimate */}
      <div className="flex justify-end mt-1">
        <span className="text-[8px] text-surface-600">
          ~{(currency.platinum * 10 + currency.gold + currency.electrum * 0.5 + currency.silver * 0.1 + currency.copper * 0.01).toFixed(1)} GP total
        </span>
      </div>
    </div>
  );
}
