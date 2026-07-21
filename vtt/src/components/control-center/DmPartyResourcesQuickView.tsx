/**
 * STᚱ VTT — DM Party Resources Quick-View (Overrrides-Grade Premium)
 *
 * Cycle 30: At-a-glance resource overview for ALL player characters.
 * DMs can see spell slots, class resources, hit dice, concentration,
 * and conditions for every PC without opening individual sheets.
 *
 * Features:
 *   - Per-character cards with AC/HP/initiative/speed header
 *   - Spell slot grid (9-level mini gauges per caster)
 *   - Class resources progress bars (rage, ki, channel, etc.)
 *   - Hit dice remaining display
 *   - Concentration tracking badge
 *   - Active conditions chips
 *   - Status summary footer (total HD, total slots, etc.)
 *   - Character picker: All / Casters / Martials filter
 *   - Resource color coding matching PlayerCompanionResources
 *
 * Design: Overrrides/Lusion — gold glassmorphism, staggered entrance,
 *   per-character progressive reveal, edge lights, tier-colored gauges.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import PremiumIcon from "@/components/ui/PremiumIcon";
import { computeSpellcasting } from "@/lib/mechanics/character-derivations";
import { getAbilityMod } from "@/lib/mechanics/character-core";

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

const RESOURCE_COLORS: Record<string, string> = {
  rage: "text-rose-400 bg-rose-500/15",
  "action surge": "text-amber-400 bg-amber-500/15",
  "second wind": "text-emerald-400 bg-emerald-500/15",
  "channel divinity": "text-gold-400 bg-gold-500/15",
  "wild shape": "text-emerald-400 bg-emerald-500/15",
  "ki": "text-indigo-400 bg-indigo-500/15",
  "bardic inspiration": "text-pink-400 bg-pink-500/15",
  "sorcery points": "text-violet-400 bg-violet-500/15",
  "lay on hands": "text-emerald-400 bg-emerald-500/15",
  default: "text-surface-400 bg-surface-500/15",
};

function getResourceStyle(name: string) {
  const key = Object.keys(RESOURCE_COLORS).find(
    (k) => name.toLowerCase().includes(k)
  );
  return RESOURCE_COLORS[key || "default"];
}

function getGaugeColor(pct: number): string {
  if (pct <= 0) return "bg-rose-600";
  if (pct <= 0.25) return "bg-rose-500";
  if (pct <= 0.5) return "bg-amber-500";
  if (pct < 1) return "bg-gold-500";
  return "bg-emerald-500";
}

function getGaugeLabel(current: number, max: number): string {
  return max > 0 ? `${Math.round((current / max) * 100)}%` : "0%";
}

// ═══════════════════════════════════════════════════════

interface DmPartyResourcesQuickViewProps {
  onClose: () => void;
}

export default function DmPartyResourcesQuickView({
  onClose,
}: DmPartyResourcesQuickViewProps) {
  const characters = useCampaignStore((s) => s.characters);

  // ── Filter state ──
  const [filter, setFilter] = useState<"all" | "casters" | "martials">("all");
  const [expandedChar, setExpandedChar] = useState<string | null>(null);

  // ── Escape key ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Filter logic ──
  const filteredChars = useMemo(() => {
    switch (filter) {
      case "casters":
        return characters.filter((c) => {
          const spell = computeSpellcasting(c);
          return (
            (spell.spellSlots &&
              Object.values(spell.spellSlots).some(
                (s) => (s as { max: number }).max > 0
              )) ||
            false
          );
        });
      case "martials":
        return characters.filter((c) => {
          const spell = computeSpellcasting(c);
          return (
            !spell.spellSlots ||
            !Object.values(spell.spellSlots).some(
              (s) => (s as { max: number }).max > 0
            )
          );
        });
      default:
        return characters;
    }
  }, [characters, filter]);

  // ── Aggregate stats ──
  const aggregate = useMemo(() => {
    let totalHD = 0;
    let maxHD = 0;
    let totalSlots = 0;
    let maxSlots = 0;
    let activeConditions = 0;
    let aliveCount = 0;
    let downCount = 0;

    characters.forEach((c) => {
      const hd = (c as { hitDice?: string }).hitDice || "1d8";
      const dieSize = parseInt(hd.replace(/[^\d]/g, "")) || 8;
      const spent = (c as { spentHitDice?: number }).spentHitDice || 0;
      totalHD += c.level - spent;
      maxHD += c.level;

      const spell = computeSpellcasting(c);
      if (spell.spellSlots) {
        Object.values(spell.spellSlots).forEach((s) => {
          const slot = s as { current: number; max: number };
          if (slot.max > 0) {
            totalSlots += slot.current;
            maxSlots += slot.max;
          }
        });
      }

      const conds = (c.conditions || []) as string[];
      activeConditions += conds.filter((x) => x !== "concentration").length;
      if ((c.hitPoints?.current || 0) > 0) aliveCount++;
      else downCount++;
    });

    return { totalHD, maxHD, totalSlots, maxSlots, activeConditions, aliveCount, downCount };
  }, [characters]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden
        bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
        border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]
        animate-in slide-in-from-bottom-2 fade-in duration-300"
        style={{ animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-500/15 to-amber-500/10 flex items-center justify-center border border-gold/10">
              <PremiumIcon name="hud" className="w-4 h-4 text-gold-400" />
            </div>
            <h3 className="font-display text-sm text-white/90">Party Resources</h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-surface-800/40 border border-white/[0.04] flex items-center justify-center
              text-surface-400 hover:text-white/70 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── FILTER CHIPS ── */}
        <div className="mx-3 pb-1 flex items-center gap-1 flex-wrap">
          {(["all", "casters", "martials"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-1.5 py-0.5 rounded text-[7px] uppercase tracking-wider transition-colors
                ${
                  filter === f
                    ? "bg-gold-500/12 text-gold-300 border border-gold-500/15"
                    : "bg-surface-800/30 text-surface-400 border border-white/[0.03] hover:border-surface-500/30"
                }`}
            >
              {f === "all" ? "All" : f === "casters" ? "🧙 Casters" : "⚔️ Martials"}
            </button>
          ))}
        </div>

        {/* ── AGGREGATE STATS BAR ── */}
        <div className="mx-3 mb-1 p-1 rounded-lg bg-surface-800/20 border border-white/[0.03]">
          <div className="flex items-center justify-between text-[7px]">
            <span className="text-surface-400">
              {filteredChars.length} of {characters.length} shown
            </span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 tabular-nums">
                {aggregate.aliveCount} alive
              </span>
              {aggregate.downCount > 0 && (
                <span className="text-rose-400 tabular-nums">
                  {aggregate.downCount} down
                </span>
              )}
              <span className="text-surface-500">
                HD{" "}
                <span className="text-gold-300 tabular-nums">
                  {aggregate.totalHD}/{aggregate.maxHD}
                </span>
              </span>
              <span className="text-surface-500">
                Slots{" "}
                <span className="text-gold-300 tabular-nums">
                  {aggregate.totalSlots}/{aggregate.maxSlots}
                </span>
              </span>
              {aggregate.activeConditions > 0 && (
                <span className="text-amber-400 tabular-nums">
                  {aggregate.activeConditions} cond.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── CHARACTER LIST (scrollable) ── */}
        <div className="mx-3 mb-1 overflow-y-auto max-h-[60vh] space-y-1 scrollbar-gold">
          {filteredChars.length > 0 ? (
            filteredChars.map((char, idx) => {
              const spell = computeSpellcasting(char);
              const hp = char.hitPoints || { current: 0, max: 0, temporary: 0 };
              const hpPct = hp.max > 0 ? hp.current / hp.max : 0;
              const conds = (char.conditions || []) as string[];
              const hasConc = conds.includes("concentration");
              const visibleConds = conds.filter(
                (c) => c !== "concentration"
              );
              const isExpanded = expandedChar === char.id;

              const resources = (
                char as { resources?: Array<{ name: string; current: number; max: number }> }
              ).resources;
              const spentHd = (char as { spentHitDice?: number }).spentHitDice || 0;
              const hdRemaining = char.level - spentHd;

              return (
                <div
                  key={char.id}
                  className={`rounded-lg border transition-all duration-200 animate-in slide-in-from-bottom-1 fade-in opacity-0`}
                  style={{
                    animationDelay: `${idx * 30}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  {/* ── COLLAPSED HEADER ── */}
                  <button
                    onClick={() =>
                      setExpandedChar(isExpanded ? null : char.id)
                    }
                    className={`w-full flex items-center gap-1 px-1.5 py-1 rounded-lg border transition-all text-left
                      ${
                        isExpanded
                          ? "bg-surface-800/40 border-surface-600/30"
                          : "bg-surface-900/30 border-white/[0.03] hover:border-white/[0.06]"
                      }`}
                  >
                    {/* HP status dot */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        hp.current <= 0
                          ? "bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.4)]"
                          : hpPct <= 0.25
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />

                    {/* Name */}
                    <span className="text-white/90 text-[10px] font-display min-w-0 truncate">
                      {char.name}
                    </span>

                    {/* AC/HP stats */}
                    <span className="text-[7px] text-surface-500 tabular-nums ml-1">
                      AC{" "}
                      <span className="text-amber-300">
                        {computeSpellcasting(char).armorClass || char.armorClass || 10}
                      </span>
                    </span>
                    <span className="text-[7px] text-surface-500 tabular-nums">
                      HP{" "}
                      <span
                        className={`${
                          hp.current <= 0
                            ? "text-rose-400"
                            : hpPct <= 0.25
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {hp.current}
                      </span>
                      <span className="text-surface-600">/{hp.max}</span>
                    </span>

                    {/* Conditions badge */}
                    {visibleConds.length > 0 && (
                      <span className="ml-auto text-[6px] px-0.5 py-px rounded bg-amber-500/10 text-amber-300 border border-amber-500/10">
                        {visibleConds.length} cond.
                      </span>
                    )}

                    {/* Concentration indicator */}
                    {hasConc && (
                      <span className="text-[8px] animate-pulse-soft">🕯️</span>
                    )}

                    {/* Expand arrow */}
                    <span
                      className={`text-surface-500 transition-transform duration-200 text-[7px] ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    >
                      ▸
                    </span>
                  </button>

                  {/* ── EXPANDED CONTENT ── */}
                  {isExpanded && (
                    <div className="p-1.5 space-y-1 animate-in slide-in-from-top-1 fade-in duration-200">
                      {/* Spell slots */}
                      {spell.spellSlots &&
                        Object.values(spell.spellSlots).some(
                          (s) => (s as { max: number }).max > 0
                        ) && (
                          <div>
                            <span className="text-[7px] uppercase tracking-wider text-surface-500">
                              Spell Slots
                            </span>
                            <div className="grid grid-cols-9 gap-0.5 mt-0.5">
                              {Object.entries(spell.spellSlots).map(
                                ([key, slot]) => {
                                  const s = slot as {
                                    current: number;
                                    max: number;
                                  };
                                  if (s.max <= 0) return null;
                                  const pct = s.max > 0 ? s.current / s.max : 0;
                                  return (
                                    <div
                                      key={key}
                                      className="flex flex-col items-center gap-px"
                                    >
                                      <span className="text-[6px] text-surface-500 font-mono">
                                        {key.replace("level", "L")}
                                      </span>
                                      <div className="w-full h-1 rounded-full bg-surface-800/60 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-300 ${getGaugeColor(
                                            pct
                                          )}`}
                                          style={{
                                            width: `${Math.round(pct * 100)}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-[6px] font-mono tabular-nums text-surface-400">
                                        {s.current}
                                      </span>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[7px] text-surface-500">
                                DC{" "}
                                <span className="text-gold-300 tabular-nums">
                                  {spell.spellSaveDC || "N/A"}
                                </span>
                              </span>
                              <span className="text-surface-600">·</span>
                              <span className="text-[7px] text-surface-500">
                                ATK{" "}
                                <span className="text-gold-300 tabular-nums">
                                  +{spell.spellAttackBonus || 0}
                                </span>
                              </span>
                            </div>
                          </div>
                        )}

                      {/* Class resources */}
                      {resources && resources.length > 0 && (
                        <div>
                          <span className="text-[7px] uppercase tracking-wider text-surface-500">
                            Resources
                          </span>
                          <div className="space-y-0.5 mt-0.5">
                            {resources.map((r, i) => {
                              const pct =
                                r.max > 0 ? r.current / r.max : 0;
                              const style = getResourceStyle(r.name);
                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-1"
                                >
                                  <span
                                    className={`text-[7px] px-0.5 py-px rounded ${style}`}
                                  >
                                    {r.name}
                                  </span>
                                  <div className="flex-1 h-1 rounded-full bg-surface-800/60 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${getGaugeColor(
                                        pct
                                      )}`}
                                      style={{
                                        width: `${Math.round(pct * 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[7px] font-mono tabular-nums text-surface-400 w-8 text-right">
                                    {r.current}/{r.max}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Hit dice */}
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] uppercase tracking-wider text-surface-500">
                          Hit Dice
                        </span>
                        <div className="flex-1 h-1 rounded-full bg-surface-800/60 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              hdRemaining <= 0
                                ? "bg-rose-500"
                                : hdRemaining <= char.level * 0.25
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.round(
                                (hdRemaining / Math.max(char.level, 1)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[7px] font-mono tabular-nums text-surface-400">
                          {hdRemaining}/{char.level}
                        </span>
                      </div>

                      {/* Conditions */}
                      {visibleConds.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                          <span className="text-[7px] uppercase tracking-wider text-surface-500 mr-0.5">
                            Conditions:
                          </span>
                          {visibleConds.map((cond) => (
                            <span
                              key={cond}
                              className="text-[6px] px-0.5 py-px rounded bg-rose-500/10 text-rose-300 border border-rose-500/10"
                            >
                              {cond}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-4 flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mb-1">
                <PremiumIcon name="hud" className="w-4 h-4 text-surface-500" />
              </div>
              <p className="text-[10px] text-surface-400 font-display mt-1">
                No characters match this filter
              </p>
              <p className="text-[7px] text-surface-600 text-center mt-0.5">
                {filter === "casters"
                  ? "No spellcasters in the party"
                  : "No martial characters in the party"}
              </p>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="mx-3 mb-1 p-1 rounded-lg bg-surface-800/20 border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[7px] text-surface-500">
              <span>{characters.length} characters</span>
            </div>
            <span className="text-[6px] text-surface-600">
              Tap a character to expand
            </span>
          </div>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}
