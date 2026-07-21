/**
 * STᚱ VTT — Long Rest Dialog
 *
 * Interactive long rest dialog (5e RAW, 8 hours):
 *   - Full HP recovery
 *   - All spell slots restored
 *   - Hit dice recovery (half total, min 1)
 *   - All resources restored
 *   - Preview summary before committing
 */

import { useState, useMemo, useCallback } from "react";
import type { PlayerCharacter } from "@/types/character";
import type { ClassResource } from "@/types";
import {
  computeLongRestSummary,
  applyLongRest,
  computeHitDiceTotal,
  computeAvailableHitDice,
  type LongRestSummary,
} from "@/lib/mechanics/rest-engine";
import { useCampaignStore } from "@/stores/campaignStore";

interface LongRestDialogProps {
  character: PlayerCharacter;
  onClose: () => void;
}

// ── Recovery Stat Card ────────────────────────────────────────

function RecoveryCard({
  label,
  value,
  sublabel,
  color = "gold",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: "gold" | "emerald" | "amber" | "rose" | "sky";
}) {
  const colorMap = {
    gold: "bg-gold-500/5 border-gold/10 text-gold-400",
    emerald: "bg-emerald-500/5 border-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/5 border-amber-500/10 text-amber-400",
    rose: "bg-rose-500/5 border-rose-500/10 text-rose-400",
    sky: "bg-sky-500/5 border-sky-500/10 text-sky-400",
  };

  return (
    <div className={`p-2 rounded-xl border ${colorMap[color]} transition-all hover:-translate-y-0.5`}>
      <span className="text-[7px] uppercase tracking-wider text-surface-500 block mb-0.5">
        {label}
      </span>
      <span className="text-sm font-bold block">{value}</span>
      {sublabel && (
        <span className="text-[8px] text-surface-600 block mt-0.5">{sublabel}</span>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function LongRestDialog({
  character,
  onClose,
}: LongRestDialogProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [applied, setApplied] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const totalHd = useMemo(() => computeHitDiceTotal(character), [character]);
  const availHd = useMemo(() => computeAvailableHitDice(character), [character]);
  const missingHp = character.hitPoints.max - character.hitPoints.current;

  const summary = useMemo<LongRestSummary>(
    () => computeLongRestSummary(character),
    [character]
  );

  const resourcesTotal = (character.resources || []).length;
  const resourcesDepleted = (character.resources || []).filter(
    (r: { current: number; max: number }) => r.current < r.max
  ).length;

  const handleApply = useCallback(() => {
    const updates = applyLongRest(character);
    updateCharacter(character.id, updates as Partial<PlayerCharacter>);
    setApplied(true);
    setFlash("✨ Long rest complete! Fully recovered.");
    setTimeout(() => onClose(), 2000);
  }, [character, updateCharacter, onClose]);

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
              <span className="text-lg">🛌</span>
              <div>
                <h2 className="text-sm font-bold text-gold-400">Long Rest</h2>
                <p className="text-[9px] text-surface-500">
                  8 hours · {character.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/[0.03] border border-surface-700/20 text-surface-500 hover:text-surface-300 text-xs flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </div>

          {/* Current Status */}
          <div className="p-3 rounded-xl bg-obsidian-mid/30 border border-surface-700/10">
            <h4 className="text-[8px] font-bold text-surface-500 uppercase tracking-wider mb-2">
              Current Status
            </h4>
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between">
                <span className="text-surface-500">HP</span>
                <span className="text-surface-300">
                  {character.hitPoints.current}/{character.hitPoints.max}
                  {missingHp > 0 && (
                    <span className="text-rose-400 ml-1">(-{missingHp})</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Hit Dice</span>
                <span className="text-surface-300">
                  {availHd}/{totalHd}
                  <span className="text-surface-600 ml-1">
                    ({totalHd - availHd} spent)
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Resources</span>
                <span className="text-surface-300">
                  {resourcesTotal - resourcesDepleted}/{resourcesTotal}
                  {resourcesDepleted > 0 && (
                    <span className="text-amber-400 ml-1">({resourcesDepleted} depleted)</span>
                  )}
                </span>
              </div>
              {character.spellSlots && (
                <div className="flex justify-between">
                  <span className="text-surface-500">Spell Slots</span>
                  <span className="text-surface-300">
                    {summary.slotsRestored ? Object.keys(summary.slotsRestored).length : 0} levels to restore
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recovery Preview */}
          <div className="space-y-2">
            <h4 className="text-[8px] font-bold text-surface-500 uppercase tracking-wider">
              Recovery Preview
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <RecoveryCard
                label="HP Healed"
                value={summary.hpHealed}
                sublabel={missingHp > 0 ? `${character.hitPoints.current} → ${character.hitPoints.max}` : "Already full"}
                color="emerald"
              />
              <RecoveryCard
                label="Hit Dice"
                value={`+${summary.hitDiceRecovered}`}
                sublabel={`${Math.min(totalHd, availHd + summary.hitDiceRecovered)}/${totalHd} after`}
                color="amber"
              />
              <RecoveryCard
                label="Resources"
                value={`${summary.resourcesRecharged.length}`}
                sublabel="all recharged"
                color="sky"
              />
              <RecoveryCard
                label="Spell Slots"
                value={`${Object.keys(summary.slotsRestored).length}`}
                sublabel={
                  Object.keys(summary.slotsRestored).length > 0
                    ? `${Object.entries(summary.slotsRestored)
                        .map(([lvl, count]) => `Lv${lvl}: +${count}`)
                        .join(", ")}`
                    : "None missing"
                }
                color="gold"
              />
            </div>
          </div>

          {/* Warning for interrupted rest */}
          <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
            <span className="text-amber-400 text-[10px] mt-px">⚠️</span>
            <p className="text-[8px] text-surface-500 leading-relaxed">
              Long rest requires 8 hours of light activity (reading, eating, standing watch).
              Interrupted rest (&gt;1 hour of combat or strenuous activity) requires restarting.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-white/[0.03] border border-surface-700/20 text-surface-400 text-[10px] font-bold uppercase tracking-wider hover:text-surface-300 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={applied}
              className="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/15 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {applied ? "✓ Fully Rested" : "Begin Long Rest"}
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
