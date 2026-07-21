/**
 * STᚱ VTT — DM Party Rest Overlay (Sprint 22)
 *
 * A premium floating glass overlay that lets the DM apply a
 * Short Rest or Long Rest to ALL player characters at once.
 *
 * Features:
 *   - Lists all party members with HP, HD, empty slot status
 *   - "Short Rest" button: applies to ALL characters simultaneously
 *   - "Long Rest" button: full recovery for all characters
 *   - Per-character status indicator (Healthy/Bloodied/Critical/Down)
 *   - Live preview of what each character will recover
 *   - Gold glass styling matching the premium design system
 *   - All mutations write to BOTH Zustand + Firestore
 *   - Staggered entrance animations on party cards
 *
 * Data Flow:
 *   DM clicks "😴 Rest" button in DM toolbar
 *   └─► DmPartyRestOverlay opens
 *       ├─► Lists all player characters
 *       │   ├─► Name, HP bar, HD count, slot count, status
 *       │   └─► Preview: Heal X, Recover Y HD, Restore Z slots
 *       └─► Short Rest / Long Rest buttons
 *           └─► For each character:
 *               ├─► applyShortRest() / applyLongRest()
 *               └─► updateCharacter() → Zustand + Firestore
 */

import { useState, useMemo, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import PremiumIcon from "@/components/ui/PremiumIcon";
import { useRestMutations } from "@/hooks/useCharacterMutations";
import type { PlayerCharacter } from "@/types";
import {
  computeHitDiceTotal,
  computeAvailableHitDice,
  computeAvgHpPerDie,
  getAbilityMod,
} from "@/lib/mechanics/rest-engine";
import { computeSpellcasting } from "@/lib/mechanics/character-derivations";

// ── Props ──
interface DmPartyRestOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Status helpers ──
type CharStatus = "healthy" | "scratched" | "bloodied" | "critical" | "down";

function getCharStatus(hp: { current: number; max: number }): CharStatus {
  const ratio = hp.max > 0 ? hp.current / hp.max : 0;
  if (hp.current <= 0) return "down";
  if (ratio <= 0.25) return "critical";
  if (ratio <= 0.5) return "bloodied";
  if (ratio <= 0.75) return "scratched";
  return "healthy";
}

const STATUS_META: Record<CharStatus, { label: string; color: string; bg: string; border: string }> = {
  healthy:    { label: "Healthy",    color: "text-emerald-400", bg: "bg-emerald-500/8",  border: "border-emerald-500/10" },
  scratched:  { label: "Scratched",  color: "text-emerald-300", bg: "bg-emerald-500/5",  border: "border-emerald-400/10" },
  bloodied:   { label: "Bloodied",   color: "text-amber-400",   bg: "bg-amber-500/8",    border: "border-amber-500/10" },
  critical:   { label: "Critical",   color: "text-red-400",     bg: "bg-red-500/8",      border: "border-red-500/10" },
  down:       { label: "Down",       color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/15" },
};

// ── Compute empty spell slot count ──
function countEmptySlots(character: PlayerCharacter): number {
  const casting = computeSpellcasting(character);
  if (!casting || !casting.spellSlots) return 0;
  let empty = 0;
  const slots = casting.spellSlots as unknown as Record<string, { current?: number; max: number }>;
  for (let i = 1; i <= 9; i++) {
    const key = `level${i}`;
    const slot = slots[key];
    if (slot && slot.max > 0) {
      empty += slot.max - (slot.current ?? 0);
    }
  }
  return empty;
}

// ── Preview helpers ──
function computeShortPreview(character: PlayerCharacter): {
  hpHealed: number;
  hdAvailable: number;
  hdTotal: number;
  resourcesRecharged: number;
} {
  const totalHD = computeHitDiceTotal(character);
  const availHD = computeAvailableHitDice(character);
  const conScore = typeof character.constitution === "number" ? character.constitution : 10;
  const conMod = getAbilityMod(conScore);
  const hitDieType = computeLocalHitDieType(character);
  const avgHeal = computeAvgHpPerDie(hitDieType, conMod);
  return {
    hpHealed: Math.min(availHD, totalHD) * avgHeal,
    hdAvailable: availHD,
    hdTotal: totalHD,
    resourcesRecharged: character.resources?.filter((r) => r.recharge === "short_rest")?.length ?? 0,
  };
}

function computeLocalHitDieType(character: PlayerCharacter): number {
  const hitDieMap: Record<string, number> = {
    Barbarian: 12, Fighter: 10, Paladin: 10, Ranger: 10, BloodHunter: 10,
    Bard: 8, Cleric: 8, Druid: 8, Monk: 8, Rogue: 8, Warlock: 8,
    Artificer: 8, Sorcerer: 6, Wizard: 6,
  };
  return hitDieMap[character.class] ?? 8;
}

function computeLongPreview(character: PlayerCharacter): {
  hpHealed: number;
  hdRecovered: number;
  slotsRestored: number;
  resourcesRecharged: number;
} {
  const maxHp = character.hitPoints?.max ?? 10;
  const currentHp = character.hitPoints?.current ?? 0;
  return {
    hpHealed: maxHp - currentHp,
    hdRecovered: Math.max(1, Math.floor(character.level / 2)),
    slotsRestored: countEmptySlots(character),
    resourcesRecharged: character.resources?.length ?? 0,
  };
}

// ── Main Component ──
export default function DmPartyRestOverlay({ isOpen, onClose }: DmPartyRestOverlayProps) {
  const characters = useCampaignStore((s) => s.characters);
  const { handleApplyShortRest, handleApplyLongRest } = useRestMutations();
  const [applyingShort, setApplyingShort] = useState(false);
  const [applyingLong, setApplyingLong] = useState(false);
  const [appliedShort, setAppliedShort] = useState(false);
  const [appliedLong, setAppliedLong] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Player characters only ──
  const party = useMemo(
    () => characters.filter((c) => c.playerName && c.playerName !== ""),
    [characters]
  );

  // ── Apply Short Rest to ALL characters ──
  const handleShortRest = useCallback(async () => {
    setApplyingShort(true);
    setError(null);
    try {
      handleApplyShortRest(party);
      setAppliedShort(true);
      setTimeout(() => { setAppliedShort(false); onClose(); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply Short Rest");
    } finally {
      setApplyingShort(false);
    }
  }, [party, handleApplyShortRest, onClose]);

  // ── Apply Long Rest to ALL characters ──
  const handleLongRest = useCallback(async () => {
    setApplyingLong(true);
    setError(null);
    try {
      handleApplyLongRest(party);
      setAppliedLong(true);
      setTimeout(() => { setAppliedLong(false); onClose(); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply Long Rest");
    } finally {
      setApplyingLong(false);
    }
  }, [party, handleApplyLongRest, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* ── Main Overlay ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        onClick={onClose}
      >
        <div
          className="pointer-events-auto w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          style={{ animation: "modal-card-enter 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          {/* ── Glass Card ── */}
          <div
            className="relative bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/95 border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edge light */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none z-10" />

            {/* ── Header ── */}
            <div className="relative z-[1] p-4 pb-3 border-b border-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <PremiumIcon name="restRecovery" className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gold-400/90">
                      Party Rest & Recovery
                    </h2>
                    <p className="text-[9px] text-surface-600">
                      Apply a 5e Short or Long Rest to all player characters
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 active:scale-90 transition-all duration-200 flex items-center justify-center"
                  aria-label="Close"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Scrollable party list ── */}
            <div className="overflow-y-auto scrollbar-gold p-3 space-y-2" style={{ maxHeight: "55vh" }}>
              {party.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-10 h-10 rounded-xl bg-surface-800/40 border border-white/[0.04] flex items-center justify-center text-lg mb-2">
                    👥
                  </div>
                  <p className="text-[11px] text-surface-600">No player characters found.</p>
                  <p className="text-[9px] text-surface-700 mt-0.5">Add characters to the campaign first.</p>
                </div>
              ) : (
                party.map((char, idx) => {
                  const hp = char.hitPoints || { current: 0, max: 10, temporary: 0 };
                  const status = getCharStatus(hp);
                  const meta = STATUS_META[status];
                  const shortPreview = computeShortPreview(char);
                  const longPreview = computeLongPreview(char);

                  return (
                    <div
                      key={char.id}
                      className="p-3 rounded-xl bg-[#0c0d15]/60 border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
                      style={{
                        animation: `slide-in-up 0.3s ease-out ${idx * 0.06}s both`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Left: Avatar + Name */}
                        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/15 flex items-center justify-center text-[10px] font-bold text-gold-400 shrink-0">
                            {char.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium text-white/80 truncate max-w-[100px]">
                                {char.name}
                              </span>
                              <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${meta.color} ${meta.bg} ${meta.border}`}>
                                {meta.label}
                              </span>
                            </div>
                            <span className="text-[8px] text-surface-600">
                              {char.race} · Lv.{char.level} {char.class}
                            </span>
                          </div>
                        </div>

                        {/* Right: HP bar */}
                        <div className="flex flex-col items-end gap-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-mono tabular-nums ${meta.color}`}>
                              {hp.current}/{hp.max}
                            </span>
                          </div>
                          <div className="w-20 h-1.5 bg-surface-700/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                status === "healthy" || status === "scratched" ? "bg-emerald-500" :
                                status === "bloodied" ? "bg-amber-500" :
                                status === "critical" ? "bg-red-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.max(0, (hp.current / hp.max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* ── Stats Row ── */}
                      <div className="flex items-center gap-3 mt-2 text-[8px] text-surface-600">
                        <span>HD: {shortPreview.hdAvailable}/{shortPreview.hdTotal}</span>
                        <span>Empty slots: {countEmptySlots(char)}</span>
                        <span>Resources: {char.resources?.filter(r => r.current < r.max).length ?? 0} depleted</span>
                      </div>

                      {/* ── Preview Row ── */}
                      <div className="flex items-center gap-3 mt-1.5">
                        {/* Short Rest preview */}
                        <div className="flex items-center gap-1 text-[8px] text-surface-500 bg-gold-500/5 rounded-lg px-2 py-1 border border-gold-500/10">
                          <span>😴</span>
                          <span>+{Math.max(0, shortPreview.hpHealed)} HP</span>
                          {shortPreview.resourcesRecharged > 0 && <span>· ⚡{shortPreview.resourcesRecharged}</span>}
                        </div>

                        {/* Long Rest preview */}
                        <div className="flex items-center gap-1 text-[8px] text-surface-500 bg-amber-500/5 rounded-lg px-2 py-1 border border-amber-500/10">
                          <span>🛌</span>
                          <span>+{Math.max(0, longPreview.hpHealed)} HP</span>
                          {longPreview.slotsRestored > 0 && <span>· 📖{longPreview.slotsRestored}</span>}
                          <span>· 🎲+{longPreview.hdRecovered} HD</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Footer Actions ── */}
            {party.length > 0 && (
              <div className="relative z-[1] p-3 pt-2 border-t border-white/[0.04]">
                {error && (
                  <div className="mb-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[9px] text-rose-400">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Short Rest button */}
                  <button
                    onClick={handleShortRest}
                    disabled={applyingShort || applyingLong || appliedShort}
                    className="flex-1 py-2.5 rounded-xl text-[10px] font-semibold tracking-wide uppercase transition-all duration-200 border backdrop-blur-xl bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15 hover:shadow-[0_0_16px_rgba(16,185,129,0.06)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {applyingShort ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Applying...
                      </span>
                    ) : appliedShort ? (
                      <span className="flex items-center justify-center gap-1.5">
                        ✅ Short Rest Applied!
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        😴 Short Rest
                      </span>
                    )}
                  </button>

                  {/* Long Rest button */}
                  <button
                    onClick={handleLongRest}
                    disabled={applyingLong || applyingShort || appliedLong}
                    className="flex-1 py-2.5 rounded-xl text-[10px] font-semibold tracking-wide uppercase transition-all duration-200 border backdrop-blur-xl bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/15 hover:shadow-[0_0_16px_rgba(245,158,11,0.06)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {applyingLong ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Applying...
                      </span>
                    ) : appliedLong ? (
                      <span className="flex items-center justify-center gap-1.5">
                        ✅ Long Rest Applied!
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        🛌 Long Rest
                      </span>
                    )}
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={onClose}
                    disabled={applyingShort || applyingLong}
                    className="px-3 py-2.5 rounded-xl text-[9px] font-medium text-surface-500 bg-[#0c0d15]/60 border border-white/[0.04] hover:text-surface-400 hover:border-white/[0.08] active:scale-[0.98] transition-all duration-200 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
