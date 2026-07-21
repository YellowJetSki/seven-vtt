/**
 * STᚱ VTT — Short Rest Dialog
 *
 * Interactive short rest dialog (5e RAW, 1 hour duration):
 *   - Select hit dice to spend (0 to available)
 *   - Preview healing amount (avg per die + CON mod)
 *   - See recharging resources
 *   - One-click apply with full preview before commit
 */

import { useState, useMemo, useCallback } from "react";
import type { PlayerCharacter } from "@/types/character";
import {
  computeShortRestSummary,
  applyShortRest,
  computeHitDieType,
  computeHitDiceTotal,
  computeAvailableHitDice,
  computeAvgHpPerDie,
  type RestSummary,
} from "@/lib/mechanics/rest-engine";
import { useCampaignStore } from "@/stores/campaignStore";

interface ShortRestDialogProps {
  character: PlayerCharacter;
  onClose: () => void;
}

// ── Hit Die Face ──────────────────────────────────────────────

function HitDieFace({
  hdType,
  selected,
  onClick,
  disabled,
}: {
  hdType: number;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const sizeMap: Record<number, { bg: string; border: string; text: string }> = {
    6: { bg: "bg-sky-500/10", border: "border-sky-500/20", text: "text-sky-400" },
    8: { bg: "bg-gold-500/10", border: "border-gold/20", text: "text-gold-400" },
    10: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
    12: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400" },
  };
  const style = sizeMap[hdType] ?? sizeMap[8];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-10 h-12 rounded-lg border-2 flex items-center justify-center transition-all duration-150 active:scale-90 ${
        disabled
          ? "border-surface-700/10 bg-surface-800/20 opacity-30 cursor-not-allowed"
          : selected
          ? `${style.bg} ${style.border} shadow-[0_0_6px_rgba(234,179,8,0.15)]`
          : "border-surface-700/20 bg-obsidian/40 hover:border-surface-600/40 cursor-pointer"
      }`}
    >
      <div className="flex flex-col items-center">
        <span className={`text-[9px] font-bold ${selected ? style.text : "text-surface-500"}`}>
          d{hdType}
        </span>
        <span className={`text-[7px] ${selected ? style.text : "text-surface-600"}`}>
          {hdType === 12 ? "💪" : hdType === 10 ? "🛡" : hdType === 8 ? "📖" : "✨"}
        </span>
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function ShortRestDialog({
  character,
  onClose,
}: ShortRestDialogProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [hdToSpend, setHdToSpend] = useState(0);
  const [applied, setApplied] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const hdType = useMemo(() => computeHitDieType(character), [character]);
  const totalHd = useMemo(() => computeHitDiceTotal(character), [character]);
  const availHd = useMemo(() => computeAvailableHitDice(character), [character]);
  const conMod = useMemo(() => Math.floor((character.constitution - 10) / 2), [character.constitution]);
  const avgHealPerDie = useMemo(
    () => computeAvgHpPerDie(hdType, conMod),
    [hdType, conMod]
  );

  // ── Live preview (uses engine for consistency) ──
  const summary = useMemo<RestSummary>(
    () =>
      computeShortRestSummary(character, {
        hitDiceToSpend: hdToSpend,
        availableHitDice: availHd,
      }),
    [character, hdToSpend, availHd]
  );

  // ── HP preview (derived from engine summary, not recalculated) ──
  const newHp = character.hitPoints.current + summary.hpHealed;
  const hpHealed = summary.hpHealed;

  // ── Handle spend ──
  const handleSpend = useCallback(() => {
    if (hdToSpend > availHd) return;
    const updates = applyShortRest(character, { hitDiceToSpend: hdToSpend });
    updateCharacter(character.id, updates as Partial<PlayerCharacter>);
    setApplied(true);
    setFlash(
      `✨ Short rest complete! Recovered ${hpHealed} HP`
    );
    setTimeout(() => onClose(), 2000);
  }, [character, hdToSpend, availHd, hpHealed, updateCharacter, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-sm mx-4 bg-gradient-to-b from-[#14151f] to-[#0f1019] rounded-2xl border border-white/[0.06] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Gold edge light */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">😴</span>
              <div>
                <h2 className="text-sm font-bold text-gold-400">Short Rest</h2>
                <p className="text-[9px] text-surface-500">1 hour · PHB 186</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/[0.03] border border-surface-700/20 text-surface-500 hover:text-surface-300 text-xs flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </div>

          {/* Status */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-obsidian-mid/40 border border-surface-700/10">
              <span className="text-[9px] text-surface-500 block">HP</span>
              <span className="text-xs font-bold text-gold-400">
                {character.hitPoints.current}
                <span className="text-surface-500 font-normal">/{character.hitPoints.max}</span>
              </span>
            </div>
            <div className="p-2 rounded-xl bg-obsidian-mid/40 border border-surface-700/10">
              <span className="text-[9px] text-surface-500 block">Hit Dice</span>
              <span className="text-xs font-bold text-gold-400">
                {availHd}
                <span className="text-surface-500 font-normal">/{totalHd}</span>
              </span>
            </div>
            <div className="p-2 rounded-xl bg-obsidian-mid/40 border border-surface-700/10">
              <span className="text-[9px] text-surface-500 block">Heal/Die</span>
              <span className="text-xs font-bold text-emerald-400">
                +{avgHealPerDie} <span className="text-[8px] text-surface-500">avg</span>
              </span>
            </div>
          </div>

          {/* Hit Dice Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-surface-500">
                Spend Hit Dice
              </label>
              <span className="text-[9px] text-surface-600">
                d{hdType} · CON {conMod >= 0 ? "+" : ""}{conMod}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Minus */}
              <button
                onClick={() => setHdToSpend(Math.max(0, hdToSpend - 1))}
                disabled={hdToSpend <= 0}
                className="w-8 h-8 rounded-lg bg-obsidian-mid/60 border border-surface-700/20 text-surface-400 hover:text-surface-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              >
                −
              </button>

              {/* Hit Die Faces */}
              <div className="flex-1 flex justify-center gap-1.5">
                {Array.from({ length: Math.min(availHd, 6) }, (_, i) => (
                  <HitDieFace
                    key={i}
                    hdType={hdType}
                    selected={i < hdToSpend}
                    onClick={() => setHdToSpend(i < hdToSpend ? i : i + 1)}
                    disabled={applied}
                  />
                ))}
                {availHd > 6 && (
                  <div className="flex items-center px-1">
                    <span className="text-[9px] text-surface-500">+{availHd - 6}</span>
                  </div>
                )}
              </div>

              {/* Plus */}
              <button
                onClick={() => setHdToSpend(Math.min(availHd, hdToSpend + 1))}
                disabled={hdToSpend >= availHd || applied}
                className="w-8 h-8 rounded-lg bg-obsidian-mid/60 border border-surface-700/20 text-surface-400 hover:text-surface-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              >
                +
              </button>
            </div>

            {/* HD counter pills */}
            <div className="flex items-center gap-2 text-[8px]">
              <span className="text-surface-500">Spending</span>
              <span className="px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400 font-bold">
                {hdToSpend}
              </span>
              <span className="text-surface-600">of</span>
              <span className="text-surface-500">{availHd} available</span>
            </div>
          </div>

          {/* Preview */}
          {hdToSpend > 0 && (
            <div className="p-3 rounded-xl bg-obsidian-mid/30 border border-surface-700/10 space-y-1.5">
              <h4 className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">
                Rest Preview
              </h4>
              <div className="space-y-1 text-[9px]">
                <div className="flex justify-between">
                  <span className="text-surface-500">HP Recovery</span>
                  <span className="text-emerald-400 font-bold">
                    {character.hitPoints.current} → {newHp}
                    <span className="text-emerald-500/70"> (+{hpHealed})</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Resources</span>
                  <span className="text-gold-400 font-bold">
                    {summary.resourcesRecharged.length} recharging
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Updated HD</span>
                  <span className="text-surface-400">
                    {availHd - hdToSpend}/{totalHd}
                  </span>
                </div>
                {summary.resourcesRecharged.length > 0 && (
                  <div className="pt-1 border-t border-surface-700/10">
                    <p className="text-surface-500 mb-0.5">Recharging:</p>
                    <div className="flex flex-wrap gap-1">
                      {summary.resourcesRecharged.map((r) => (
                        <span
                          key={r}
                          className="px-1.5 py-0.5 rounded bg-emerald-500/8 border border-emerald-500/15 text-emerald-400/80 text-[7px]"
                        >
                          ↺ {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-white/[0.03] border border-surface-700/20 text-surface-400 text-[10px] font-bold uppercase tracking-wider hover:text-surface-300 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSpend}
              disabled={hdToSpend === 0 || applied}
              className="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/15 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {applied ? "✓ Rest Complete" : `Spend ${hdToSpend} HD`}
            </button>
          </div>
        </div>

        {/* Flash */}
        {flash && (
          <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-lg bg-obsidian/90 backdrop-blur-sm border border-emerald-500/20 text-[10px] text-emerald-400 text-center animate-fade-in">
            {flash}
          </div>
        )}
      </div>
    </div>
  );
}
