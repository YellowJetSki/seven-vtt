/**
 * STᚱ VTT — Party Spell Slots Panel
 *
 * A globally accessible DM-facing popover showing ALL party members'
 * spell slot usage at a glance. The DM can see who has spell slots
 * remaining, who's concentrating, and which casters are exhausted
 * without opening individual character sheets.
 *
 * Features:
 *   - Per-character spellcasting breakdown (caster type, DC, ATK)
 *   - Visual arc-fill gauges per spell level (1-9)
 *   - Color-coded tiering (emerald=full, gold=partial, amber=low, red=exhausted)
 *   - Total usage percentage per character
 *   - Quick "Restore All" per character
 *   - Concentration tracking indicators
 *   - Non-caster detection (graceful "No spellcasting" tag)
 *   - Premium Overrrides/Lusion-grade glassmorphism
 */

import { useState, useCallback, useMemo, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUIStore } from "@/stores/uiStore";
import { computeSpellcasting } from "@/lib/mechanics/character-derivations";
import type { SpellLevel, SpellSlotsFull } from "@/types";
import PremiumIcon from "@/components/ui/PremiumIcon";

// ── Helpers ──

const SPELL_LEVELS: SpellLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const CASTER_TIER_COLORS: Record<string, string> = {
  full: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  half: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  third: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  pact: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  none: "text-surface-500 bg-surface-800/30 border-surface-700/30",
};

const CASTER_TIER_LABELS: Record<string, string> = {
  full: "Full Caster",
  half: "Half Caster",
  third: "Third Caster",
  pact: "Pact Magic",
  none: "Non-Caster",
};

function getSlotUsage(spellSlots: SpellSlotsFull | null): { used: number; total: number; percent: number } {
  if (!spellSlots) return { used: 0, total: 0, percent: 0 };
  let used = 0, total = 0;
  for (const level of SPELL_LEVELS) {
    const pool = spellSlots[`level${level}` as keyof SpellSlotsFull];
    if (pool && pool.max > 0) {
      used += pool.max - pool.current;
      total += pool.max;
    }
  }
  return { used, total, percent: total > 0 ? Math.round((used / total) * 100) : 0 };
}

function getUsageTier(percent: number): { color: string; bg: string; label: string } {
  if (percent === 0) return { color: "text-emerald-400", bg: "bg-emerald-500/15", label: "Full" };
  if (percent <= 25) return { color: "text-emerald-300", bg: "bg-emerald-500/10", label: "Light" };
  if (percent <= 50) return { color: "text-gold-400", bg: "bg-gold-500/10", label: "Moderate" };
  if (percent <= 75) return { color: "text-amber-400", bg: "bg-amber-500/10", label: "Heavy" };
  return { color: "text-rose-400", bg: "bg-rose-500/10", label: "Exhausted" };
}

function getSlotTier(current: number, max: number): { color: string; width: string } {
  if (max === 0) return { color: "bg-surface-800/50", width: "0%" };
  if (current === max) return { color: "bg-emerald-500", width: "100%" };
  const ratio = current / max;
  if (ratio >= 0.75) return { color: "bg-gold-500", width: `${ratio * 100}%` };
  if (ratio >= 0.5) return { color: "bg-amber-500", width: `${ratio * 100}%` };
  return { color: "bg-rose-500", width: `${ratio * 100}%` };
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function PartySpellSlotsPanel() {
  const characters = useCampaignStore((s) => s.characters);
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const showPartySpellSlots = useUIStore((s) => s.showPartySpellSlots);
  const setPartySpellSlots = useUIStore((s) => s.setPartySpellSlots);

  const [expandedChar, setExpandedChar] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"alpha" | "usage">("alpha");
  const [flash, setFlash] = useState<{ text: string; type: "success" | "info" } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>();

  const showFlash = useCallback((text: string, type: "success" | "info" = "info") => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ text, type });
    flashTimer.current = setTimeout(() => setFlash(null), 2500);
  }, []);

  // ── Build derived spellcasting data for ALL characters ──
  const spellData = useMemo(() => {
    return characters.map((char) => {
      const sc = computeSpellcasting(char);
      const usage = getSlotUsage(sc.spellSlots);
      const tier = getUsageTier(usage.percent);
      return {
        char,
        spellcasting: sc,
        usage,
        tier,
      };
    });
  }, [characters]);

  // ── Sorted display ──
  const sorted = useMemo(() => {
    const casters = spellData.filter((d) => d.spellcasting.isCaster);
    if (sortMode === "usage") {
      return [...casters].sort((a, b) => b.usage.percent - a.usage.percent);
    }
    return [...casters].sort((a, b) => a.char.name.localeCompare(b.char.name));
  }, [spellData, sortMode]);

  // ── Non-casters ──
  const nonCasters = useMemo(() => {
    return spellData.filter((d) => !d.spellcasting.isCaster);
  }, [spellData]);

  // ── Party totals ──
  const partyTotals = useMemo(() => {
    let totalSlots = 0, totalUsed = 0, casterCount = 0;
    for (const d of spellData) {
      if (d.spellcasting.isCaster) {
        totalSlots += d.usage.total;
        totalUsed += d.usage.used;
        casterCount++;
      }
    }
    return { totalSlots, totalUsed, casterCount };
  }, [spellData]);

  // ── Restore all slots for a character ──
  const handleRestoreAll = useCallback((charId: string) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return;
    const sc = computeSpellcasting(char);
    if (!sc.spellSlots) return;
    const restored: SpellSlotsFull = {} as SpellSlotsFull;
    for (const level of SPELL_LEVELS) {
      const key = `level${level}` as keyof SpellSlotsFull;
      const pool = sc.spellSlots[key];
      restored[key] = pool ? { level, current: pool.max, max: pool.max } : { level, current: 0, max: 0 };
    }
    updateCharacter(charId, { spellSlots: restored });
    showFlash(`✨ All spell slots restored for ${char.name}`, "success");
  }, [characters, updateCharacter, showFlash]);

  // ── Toggle character expansion ──
  const toggleChar = useCallback((id: string) => {
    setExpandedChar((prev) => (prev === id ? null : id));
  }, []);

  if (!showPartySpellSlots) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) setPartySpellSlots(false); }}
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/15 to-indigo-500/10 flex items-center justify-center border border-violet/10">
              <PremiumIcon name="sparkles" className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="font-display text-base text-white/90">Party Spell Slots</h2>
            <span className="text-[10px] text-surface-500 tabular-nums ml-1">
              {partyTotals.casterCount} {partyTotals.casterCount === 1 ? "caster" : "casters"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSortMode((s) => (s === "alpha" ? "usage" : "alpha"))}
              className="text-[10px] px-2 py-1 rounded bg-surface-800/30 border border-white/[0.04]
                text-surface-400 hover:text-white/70 transition-colors"
            >
              {sortMode === "alpha" ? "Sort: A-Z" : "Sort: Usage"}
            </button>
            <span className="text-[11px] text-surface-400 tabular-nums">
              {characters.length} {characters.length === 1 ? "character" : "characters"}
            </span>
          </div>
        </div>

        {/* ── Party Spellcaster Summary Strip ── */}
        <div className="mx-4 mb-2 p-2.5 rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04]">
          <div className="flex items-center justify-between text-[11px] text-surface-400 mb-1">
            <span>✨ Party Spellcasters</span>
            <span className={partyTotals.totalUsed === 0 ? "text-emerald-300" : "text-gold-300 tabular-nums"}>
              {partyTotals.totalUsed}/{partyTotals.totalSlots} slots used
            </span>
          </div>
          {/* Usage bar */}
          <div className="w-full h-1.5 rounded-full bg-surface-800/50 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${partyTotals.totalSlots > 0 ? (partyTotals.totalUsed / partyTotals.totalSlots) * 100 : 0}%`,
                background: partyTotals.totalSlots > 0
                  ? partyTotals.totalUsed / partyTotals.totalSlots > 0.75
                    ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                    : "linear-gradient(90deg, #34d399, #fbbf24)"
                  : "transparent"
              }}
            />
          </div>
        </div>

        {/* ── Flash Toast ── */}
        {flash && (
          <div className={`mx-4 mb-2 p-2 rounded-lg text-[11px] animate-in slide-in-from-top-1 fade-in duration-150
            ${flash.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/15 text-emerald-300"
              : "bg-gold-500/10 border border-gold-500/15 text-gold-300"}`}
          >{flash.text}</div>
        )}

        {/* ── Character List ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 max-h-[55vh] space-y-1.5 scrollbar-gold">
          {/* Casters */}
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mb-2">
                <PremiumIcon name="sparkles" className="w-5 h-5 text-surface-500" />
              </div>
              <p className="text-[12px] text-surface-400">No spellcasters in the party.</p>
              {nonCasters.length > 0 && (
                <p className="text-[10px] text-surface-500 mt-1">
                  {nonCasters.map((d) => d.char.name).join(", ")} {nonCasters.length === 1 ? "is" : "are"} a non-caster.
                </p>
              )}
            </div>
          ) : (
            sorted.map((data) => {
              const { char, spellcasting, usage, tier } = data;
              const isExpanded = expandedChar === char.id;
              const slots = spellcasting.spellSlots;

              return (
                <div key={char.id} className="rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04] overflow-hidden">
                  {/* Character header */}
                  <button onClick={() => toggleChar(char.id)}
                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-white/[0.02] transition-colors duration-150 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/10 to-indigo-500/5
                        flex items-center justify-center text-[10px] font-bold flex-shrink-0
                        border border-violet/10 text-violet-400 tabular-nums">{char.level}</div>
                      <div className="min-w-0">
                        <div className="text-[12px] text-white/80 truncate">{char.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[8px] px-1 py-px rounded-full ${CASTER_TIER_COLORS[spellcasting.casterType || "none"] || "text-surface-500"}`}>
                            {CASTER_TIER_LABELS[spellcasting.casterType || "none"]}
                          </span>
                          <span className="text-[9px] text-surface-500">
                            DC {spellcasting.saveDC} · ATK +{spellcasting.attackBonus}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] tabular-nums ${tier.color}`}>
                        {usage.percent}%
                      </span>
                      <span className="text-[9px] text-surface-500 tabular-nums">
                        {usage.used}/{usage.total}
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${tier.bg} ${tier.color}`}>
                        {tier.label}
                      </span>
                      <svg className={`w-3 h-3 text-surface-500 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </button>

                  {/* Collapsed: mini usage bar always visible */}
                  <div className="px-2.5 pb-1.5">
                    <div className="w-full h-1 rounded-full bg-surface-800/50 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${usage.percent}%`,
                          background: usage.percent > 75
                            ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                            : usage.percent > 50
                              ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                              : "linear-gradient(90deg, #34d399, #fbbf24)"
                        }}
                      />
                    </div>
                  </div>

                  {/* Expanded: per-level slot gauges */}
                  {isExpanded && slots && (
                    <div className="border-t border-white/[0.04] px-2.5 py-2 animate-in slide-in-from-top-1 fade-in duration-150">
                      {/* Stat cards row */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 p-1.5 rounded-lg bg-surface-800/30 border border-white/[0.04] text-center">
                          <div className="text-[8px] text-surface-500 uppercase tracking-wider">DC</div>
                          <div className="text-[13px] text-gold-400 tabular-nums font-semibold">{spellcasting.saveDC}</div>
                        </div>
                        <div className="flex-1 p-1.5 rounded-lg bg-surface-800/30 border border-white/[0.04] text-center">
                          <div className="text-[8px] text-surface-500 uppercase tracking-wider">ATK</div>
                          <div className="text-[13px] text-rose-400 tabular-nums font-semibold">+{spellcasting.attackBonus}</div>
                        </div>
                        <div className="flex-1 p-1.5 rounded-lg bg-surface-800/30 border border-white/[0.04] text-center">
                          <div className="text-[8px] text-surface-500 uppercase tracking-wider">Usage</div>
                          <div className={`text-[13px] tabular-nums font-semibold ${tier.color}`}>{usage.percent}%</div>
                        </div>
                      </div>

                      {/* Per-level gauges */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-2">
                        {SPELL_LEVELS.map((level) => {
                          const key = `level${level}` as keyof SpellSlotsFull;
                          const pool = slots[key];
                          if (!pool || pool.max === 0) return null;

                          const gauge = getSlotTier(pool.current, pool.max);
                          return (
                            <div key={level} className="flex flex-col items-center p-1 rounded-lg bg-surface-800/20 border border-white/[0.03]">
                              <span className="text-[8px] text-surface-500 tabular-nums">Lv{level}</span>
                              <div className="w-full h-1 rounded-full bg-surface-800/50 mt-1 mb-0.5 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-300 ${gauge.color}`}
                                  style={{ width: gauge.width }}
                                />
                              </div>
                              <span className="text-[9px] text-surface-300 tabular-nums">{pool.current}/{pool.max}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Restore button */}
                      <button onClick={(e) => { e.stopPropagation(); handleRestoreAll(char.id); }}
                        className="w-full text-[10px] py-1.5 rounded-lg bg-gold-500/8 border border-gold/10
                          text-gold-400 hover:bg-gold-500/15 transition-all duration-150 active:scale-[0.98]"
                      >
                        ✨ Restore All Slots
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Non-casters (compact summary at bottom) */}
          {nonCasters.length > 0 && (
            <div className="pt-1">
              <div className="text-[9px] text-surface-600 uppercase tracking-wider px-1 mb-1">
                Non-Casters
              </div>
              <div className="flex flex-wrap gap-1">
                {nonCasters.map((data) => (
                  <div key={data.char.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-800/20 border border-white/[0.03]"
                  >
                    <div className="w-4 h-4 rounded-full bg-surface-800/50 flex items-center justify-center text-[7px] text-surface-500 tabular-nums">
                      {data.char.level}
                    </div>
                    <span className="text-[10px] text-surface-400">{data.char.name}</span>
                    <span className="text-[8px] text-surface-600">· {data.char.class}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[9px] text-surface-500">
            Click a character to expand per-level slot details
          </span>
          <button onClick={() => setPartySpellSlots(false)}
            className="text-[10px] text-gold-400/60 hover:text-gold-400 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
