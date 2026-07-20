/**
 * STᚱ VTT — Inventory Currency Bar (Premium)
 *
 * Ventriloc/Spotify-grade interactive currency visualization:
 * - Galaxy/Orbital coin grid with depth and glow
 * - Tap coin to edit with smooth inline transition
 * - Quick-add presets with animated pulse
 * - Coin roll-up denominations
 * - Estimated total with sparkline-like progress
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { PlayerCharacter } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";

interface CoinDef {
  label: string;
  key: keyof PlayerCharacter["currency"];
  color: string;
  glowColor: string;
  icon: string;
  valueToNext: number;
  nextKey: keyof PlayerCharacter["currency"] | null;
  sortOrder: number;
}

const COINS: CoinDef[] = [
  { label: "PP", key: "platinum",   color: "text-cyan-300",  glowColor: "rgba(103,232,249,0.15)", icon: "💎", valueToNext: 0,  nextKey: null,            sortOrder: 5 },
  { label: "GP", key: "gold",       color: "text-amber-400", glowColor: "rgba(251,191,36,0.15)", icon: "🪙", valueToNext: 10, nextKey: "platinum",      sortOrder: 4 },
  { label: "EP", key: "electrum",   color: "text-gold-500/60",glowColor: "rgba(234,179,8,0.08)",  icon: "💠", valueToNext: 2,  nextKey: "gold",          sortOrder: 3 },
  { label: "SP", key: "silver",     color: "text-surface-300",glowColor: "rgba(203,213,225,0.08)",icon: "🥈", valueToNext: 10, nextKey: "electrum",      sortOrder: 2 },
  { label: "CP", key: "copper",     color: "text-amber-600", glowColor: "rgba(217,119,6,0.08)",  icon: "🟤", valueToNext: 10, nextKey: "silver",         sortOrder: 1 },
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

  const submitEdit = useCallback(() => {
    if (!editKey) return;
    const val = parseInt(editValue);
    if (!isNaN(val) && val >= 0) {
      updateCurrency(editKey as keyof PlayerCharacter["currency"], val);
    }
    setEditKey(null);
  }, [editKey, editValue, updateCurrency]);

  const totalGp = currency.platinum * 10 + currency.gold + currency.electrum * 0.5 + currency.silver * 0.1 + currency.copper * 0.01;

  return (
    <div className="relative rounded-xl bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] p-3 overflow-hidden">
      {/* Gold edge light */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
          Currency
        </span>
        <span className="text-[8px] text-surface-600 tabular-nums">
          ~{totalGp.toFixed(1)} GP total
        </span>
      </div>

      {/* Coin grid — premium orbital layout */}
      <div className="grid grid-cols-5 gap-1.5">
        {COINS.map((coin) => (
          <div key={coin.key}>
            {editKey === coin.key ? (
              <div
                className="flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${coin.glowColor}, transparent)`,
                  border: `1px solid rgba(234,179,8,0.25)`,
                  boxShadow: `0 0 12px ${coin.glowColor}`,
                }}
              >
                <span className="text-[7px] uppercase font-bold text-gold-500/50 mb-0.5 tracking-wider">
                  {coin.icon} {coin.label}
                </span>
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
                className="w-full relative flex flex-col items-center py-2.5 rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04] hover:border-white/[0.10] active:scale-[0.97] transition-all duration-150 group overflow-hidden"
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                  style={{
                    background: `radial-gradient(ellipse at center, ${coin.glowColor}, transparent 70%)`,
                  }}
                />
                <span className="text-[7px] uppercase font-bold text-gold-500/50 mb-0.5 tracking-wider relative z-[1]">
                  {coin.icon} {coin.label}
                </span>
                <span className={`text-sm font-bold tabular-nums ${coin.color} relative z-[1]`}>
                  {currency[coin.key]}
                </span>
                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-[10%] right-[10%] h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${coin.glowColor.replace("0.15","0.35")}, transparent)` }}
                />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Quick-add presets */}
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        <span className="text-[7px] uppercase text-surface-600 tracking-wider font-semibold">Quick add:</span>
        {[1, 5, 10, 25, 50, 100].map((amt) => (
          <button
            key={amt}
            onClick={() => addCurrency("gold", amt)}
            className="relative px-2 py-0.5 rounded-lg text-[8px] font-semibold bg-gradient-to-b from-gold-500/8 to-gold-500/4 border border-gold/10 text-gold-500/70 hover:from-gold-500/15 hover:to-gold-500/8 active:scale-95 transition-all duration-150 overflow-hidden"
          >
            <span className="relative z-[1]">+{amt} GP</span>
          </button>
        ))}
        {[1, 10, 100].map((amt) => (
          <button
            key={`sp-${amt}`}
            onClick={() => addCurrency("silver", amt)}
            className="px-2 py-0.5 rounded-lg text-[8px] font-semibold bg-gradient-to-b from-surface-700/30 to-surface-700/15 border border-surface-600/30 text-surface-400 hover:from-surface-700/50 hover:to-surface-700/30 active:scale-95 transition-all duration-150"
          >
            +{amt} SP
          </button>
        ))}
      </div>

      {/* Total wealth visualization */}
      <div className="mt-2 pt-2 border-t border-white/[0.03]">
        <div className="flex items-center justify-between">
          <span className="text-[7px] uppercase tracking-wider text-surface-600">Estimated Wealth</span>
          <span className="text-[10px] font-bold text-gold-400 tabular-nums">
            {totalGp.toFixed(1)} GP
          </span>
        </div>
        {/* Wealth density bar */}
        <div className="mt-1 h-1 rounded-full bg-surface-800/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500/40 via-gold-500/50 to-cyan-400/40 transition-all duration-500"
            style={{ width: `${Math.min(100, (totalGp / 500) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
