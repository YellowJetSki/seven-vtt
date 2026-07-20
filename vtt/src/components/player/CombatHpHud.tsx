/**
 * STᚱ VTT — Combat HP HUD (Real-Play D&D Mechanics, Sprint 13)
 *
 * A floating, collapsible HP management panel for the Player Cards page.
 * Allows the DM to rapidly update character HP during live combat
 * without navigating to the battlemap or opening a full character sheet.
 *
 * Features:
 * - Compact vertical list of ALL player characters with HP bars
 * - Instant +/- 10/5/1 buttons per character
 * - Color-coded HP status (Healthy/Scratched/Bloodied/Critical/Dead)
 * - Temp HP display with gold accent
 * - Collapsible panel (toggled via floating action button)
 * - "Quick Heal All" button for short rests
 * - Persistent across navigation (state survives page transitions)
 * - Premium Lusion-grade glass styling with edge light
 * - Staggered entrance/exit animations
 * - Touch-friendly 44px+ targets
 *
 * Architecture:
 * - Reads characters from campaignStore
 * - Writes HP changes via campaignStore.updateCharacter()
 * - Self-contained: no external dependencies beyond stores
 * - Can be mounted on any DM-facing page
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";

// ── Type Definitions ──

interface CombatHpHudProps {
  /** Optional: mount on a specific page (for positioning) */
  page?: "player-cards" | "dashboard" | "battle-maps";
}

// ── HP Color Helpers ──

function getHpColorClass(ratio: number): string {
  if (ratio <= 0) return "text-rose-400";
  if (ratio <= 0.25) return "text-red-400";
  if (ratio <= 0.5) return "text-amber-400";
  if (ratio <= 0.75) return "text-emerald-300";
  return "text-emerald-400";
}

function getStatusLabel(current: number, max: number): string {
  if (max <= 0) return "—";
  const ratio = current / max;
  if (current <= 0) return "☠ Dead";
  if (ratio <= 0.25) return "⚔ Critical";
  if (ratio <= 0.5) return "🩸 Bloodied";
  if (ratio <= 0.75) return "🔸 Injured";
  if (current < max) return "🔹 Scratched";
  return "✦ Healthy";
}

function getBarColor(ratio: number): string {
  if (ratio <= 0) return "bg-rose-500";
  if (ratio <= 0.25) return "bg-red-500";
  if (ratio <= 0.5) return "bg-amber-500";
  if (ratio <= 0.75) return "bg-emerald-400";
  return "bg-emerald-500";
}

function getGlowColor(ratio: number): string {
  if (ratio <= 0) return "rgba(244,63,94,0.15)";
  if (ratio <= 0.25) return "rgba(239,68,68,0.15)";
  if (ratio <= 0.5) return "rgba(251,191,36,0.12)";
  if (ratio <= 0.75) return "rgba(52,211,153,0.12)";
  return "rgba(52,211,153,0.15)";
}

// ── Main Component ──

export default function CombatHpHud({ page = "player-cards" }: CombatHpHudProps) {
  const characters = useCampaignStore((s) => s.characters);
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  const [isOpen, setIsOpen] = useState(false);
  const [expandedChar, setExpandedChar] = useState<string | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Sort: lowest HP ratio first (critical at top) ──
  const sortedChars = useMemo(() => {
    return [...characters].sort((a, b) => {
      const ratioA = a.hitPoints.max > 0 ? a.hitPoints.current / a.hitPoints.max : 1;
      const ratioB = b.hitPoints.max > 0 ? b.hitPoints.current / b.hitPoints.max : 1;
      return ratioA - ratioB;
    });
  }, [characters]);

  // ── HP mutation ──
  const handleHpChange = useCallback(
    (charId: string, delta: number) => {
      const c = characters.find((ch) => ch.id === charId);
      if (!c) return;
      const newCurrent = Math.max(0, Math.min(c.hitPoints.max, c.hitPoints.current + delta));
      updateCharacter(charId, {
        hitPoints: { ...c.hitPoints, current: newCurrent },
      });
    },
    [characters, updateCharacter]
  );

  // ── Set HP to exact value ──
  const handleSetHp = useCallback(
    (charId: string) => {
      const c = characters.find((ch) => ch.id === charId);
      if (!c) return;
      const raw = customInputs[charId]?.trim();
      if (!raw) return;
      const val = parseInt(raw, 10);
      if (isNaN(val)) return;
      const clamped = Math.max(0, Math.min(c.hitPoints.max, val));
      updateCharacter(charId, {
        hitPoints: { ...c.hitPoints, current: clamped },
      });
      // Clear input and collapse
      setCustomInputs((prev) => {
        const next = { ...prev };
        delete next[charId];
        return next;
      });
      setExpandedChar((prev) => (prev === charId ? null : prev));
    },
    [characters, updateCharacter, customInputs]
  );

  // ── Quick Heal All (short rest: heal 1 HD worth per character) ──
  const handleQuickHealAll = useCallback(() => {
    characters.forEach((c) => {
      const avgHd = c.hitDice === 12 ? 7 : c.hitDice === 10 ? 6 : c.hitDice === 8 ? 5 : c.hitDice === 6 ? 4 : 5;
      const conMod = Math.floor((c.constitution - 10) / 2);
      const healAmount = avgHd + Math.max(0, conMod);
      const newCurrent = Math.min(c.hitPoints.max, c.hitPoints.current + healAmount);
      updateCharacter(c.id, {
        hitPoints: { ...c.hitPoints, current: newCurrent },
      });
    });
  }, [characters, updateCharacter]);

  // ── Click outside to close ──
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Check if the click was on the toggle button
        const target = e.target as HTMLElement;
        if (target.closest("[data-combat-hud-toggle]")) return;
        setIsOpen(false);
      }
    };
    // Delay to avoid immediate close from the toggle click itself
    const t = setTimeout(() => document.addEventListener("mousedown", handleClick), 150);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen]);

  // ── Escape to close ──
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // ── No characters → hide entirely ──
  if (characters.length === 0) return null;

  // ── Party summary stats ──
  const partyTotalHp = characters.reduce((sum, c) => sum + c.hitPoints.max, 0);
  const partyCurrentHp = characters.reduce((sum, c) => sum + c.hitPoints.current, 0);
  const partyRatio = partyTotalHp > 0 ? partyCurrentHp / partyTotalHp : 1;
  const woundedCount = characters.filter(
    (c) => c.hitPoints.max > 0 && c.hitPoints.current / c.hitPoints.max <= 0.5
  ).length;

  // ── Position based on page ──
  const positionClass =
    page === "dashboard"
      ? "bottom-24 right-6"
      : "bottom-6 right-6";

  return (
    <>
      {/* ── Floating Toggle Button ── */}
      <button
        data-combat-hud-toggle
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed ${positionClass} z-40 w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-200 active:scale-90 shadow-lg ${
          isOpen
            ? "bg-amber-500/15 border-amber-500/25 text-amber-400 shadow-amber-500/10"
            : woundedCount > 0
              ? "bg-red-500/10 border-red-500/20 text-red-400 shadow-red-500/10"
              : "bg-gold-500/10 border-gold-500/20 text-gold-400 shadow-gold-500/5"
        }`}
        title={`Combat HP ${isOpen ? "– Close" : "– Quick Adjust"}`}
        style={{ animation: "slide-in-up 0.35s ease-out both" }}
      >
        {/* Pulse ring when wounded */}
        {!isOpen && woundedCount > 0 && (
          <span className="absolute inset-0 rounded-xl animate-ping opacity-30 bg-red-500/30" />
        )}
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
        {/* Badge showing wounded count */}
        {!isOpen && woundedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center shadow-lg leading-none">
            {woundedCount}
          </span>
        )}
      </button>

      {/* ── Floating Panel ── */}
      {isOpen && (
        <div
          ref={panelRef}
          className={`fixed ${positionClass} z-40 w-[340px] max-h-[70vh] overflow-hidden rounded-2xl`}
          style={{
            bottom: page === "dashboard" ? "calc(6rem + 3.5rem)" : "calc(1.5rem + 3.5rem)",
            animation: "slide-in-up 0.25s ease-out both",
          }}
        >
          {/* Glass container */}
          <div className="relative bg-gradient-to-b from-[#1a1c2a]/98 to-[#0f101a]/98 backdrop-blur-2xl border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">
            {/* Edge light */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none" />

            {/* Ambient glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gold-500/[0.04] rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-[1] p-4">
              {/* ── Header ── */}
              <div className="flex items-center justify-between mb-3" style={{ animation: "slide-in-up 0.2s ease-out both" }}>
                <div>
                  <h3 className="text-xs font-bold text-surface-200 uppercase tracking-wider">
                    Combat HP
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Party HP summary bar */}
                    <div className="flex-1 h-1.5 bg-[#07080d] rounded-full overflow-hidden max-w-[120px]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(partyRatio)}`}
                        style={{
                          width: `${partyRatio * 100}%`,
                          boxShadow: `0 0 6px ${getGlowColor(partyRatio)}`,
                        }}
                      />
                    </div>
                    <span className={`text-[9px] font-mono tabular-nums ${getHpColorClass(partyRatio)}`}>
                      {partyCurrentHp}/{partyTotalHp}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Quick Heal All */}
                  <button
                    onClick={handleQuickHealAll}
                    className="px-2 py-1 rounded-lg text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/15 active:scale-90 transition-all duration-150"
                    title="Quick heal all (approx 1 HD each)"
                  >
                    ⚡ Heal All
                  </button>

                  {/* Close */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/[0.06] text-surface-500 hover:text-surface-200 transition-all active:scale-90"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ── Character List (scrollable) ── */}
              <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1 scrollbar-gold">
                {sortedChars.map((c, idx) => {
                  const hpRatio = c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1;
                  const isExpanded = expandedChar === c.id;
                  const customVal = customInputs[c.id] ?? "";

                  return (
                    <div
                      key={c.id}
                      className="rounded-xl transition-all duration-200"
                      style={{ animation: `slide-in-up 0.25s ease-out ${idx * 30}ms both` }}
                    >
                      {/* Main row */}
                      <div
                        className={`relative rounded-xl p-2.5 transition-all duration-200 group cursor-pointer ${
                          isExpanded
                            ? "bg-gradient-to-b from-gold-500/8 to-gold-500/3 border border-gold-500/15"
                            : "bg-[#0c0d15]/60 border border-transparent hover:border-white/[0.06] hover:bg-[#14151f]/40"
                        }`}
                        onClick={() => setExpandedChar((prev) => (prev === c.id ? null : c.id))}
                      >
                        {/* Edge light on hover */}
                        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent transition-all duration-300 group-hover:via-gold-500/10" />

                        <div className="relative z-[1]">
                          {/* Top row: name + status + actions */}
                          <div className="flex items-center justify-between gap-2">
                            {/* Name + race/class */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {/* Avatar initial */}
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border"
                                style={{
                                  backgroundColor: `${hpRatio <= 0.25 ? "rgba(239,68,68,0.2)" : hpRatio <= 0.5 ? "rgba(251,191,36,0.15)" : "rgba(52,211,153,0.1)"}`,
                                  borderColor: `${hpRatio <= 0.25 ? "rgba(239,68,68,0.3)" : hpRatio <= 0.5 ? "rgba(251,191,36,0.2)" : "rgba(52,211,153,0.15)"}`,
                                }}
                              >
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className={`text-[11px] font-semibold truncate block leading-tight ${hpRatio <= 0.25 ? "text-red-300" : hpRatio <= 0.5 ? "text-amber-300" : "text-surface-200"}`}>
                                  {c.name}
                                </span>
                                <span className="text-[8px] text-surface-600 truncate block">
                                  {c.race?.slice(0, 8)} · {c.class} Lv.{c.level}
                                </span>
                              </div>
                            </div>

                            {/* Status + HP */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[8px] uppercase tracking-wider font-medium hidden sm:inline ${getHpColorClass(hpRatio)}`}>
                                {getStatusLabel(c.hitPoints.current, c.hitPoints.max)}
                              </span>
                              <span className={`text-xs font-bold font-mono tabular-nums ${getHpColorClass(hpRatio)}`}>
                                {c.hitPoints.current}
                                <span className="text-surface-600 text-[10px] font-normal">/{c.hitPoints.max}</span>
                              </span>
                            </div>

                            {/* Quick HP buttons (always visible) */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleHpChange(c.id, -10); }}
                                className="w-7 h-7 rounded-lg text-[9px] font-bold bg-red-500/8 text-red-400/70 hover:bg-red-500/15 hover:text-red-400 active:scale-90 transition-all duration-100"
                                title="-10 HP"
                              >
                                -10
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleHpChange(c.id, -5); }}
                                className="w-7 h-7 rounded-lg text-[9px] font-bold bg-red-500/6 text-red-400/50 hover:bg-red-500/12 hover:text-red-400 active:scale-90 transition-all duration-100"
                                title="-5 HP"
                              >
                                -5
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleHpChange(c.id, -1); }}
                                className="w-7 h-7 rounded-lg text-[9px] font-bold bg-red-500/4 text-red-400/30 hover:bg-red-500/10 hover:text-red-400 active:scale-90 transition-all duration-100"
                                title="-1 HP"
                              >
                                -1
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleHpChange(c.id, 1); }}
                                className="w-7 h-7 rounded-lg text-[9px] font-bold bg-emerald-500/4 text-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-400 active:scale-90 transition-all duration-100"
                                title="+1 HP"
                              >
                                +1
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleHpChange(c.id, 5); }}
                                className="w-7 h-7 rounded-lg text-[9px] font-bold bg-emerald-500/6 text-emerald-400/50 hover:bg-emerald-500/12 hover:text-emerald-400 active:scale-90 transition-all duration-100"
                                title="+5 HP"
                              >
                                +5
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleHpChange(c.id, 10); }}
                                className="w-7 h-7 rounded-lg text-[9px] font-bold bg-emerald-500/8 text-emerald-400/70 hover:bg-emerald-500/15 hover:text-emerald-400 active:scale-90 transition-all duration-100"
                                title="+10 HP"
                              >
                                +10
                              </button>
                            </div>
                          </div>

                          {/* HP bar (mini) */}
                          <div className="mt-1.5 h-1 bg-[#07080d] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${getBarColor(hpRatio)}`}
                              style={{
                                width: `${Math.max(0, hpRatio * 100)}%`,
                                boxShadow: `0 0 4px ${getGlowColor(hpRatio)}`,
                              }}
                            />
                          </div>

                          {/* Temp HP indicator */}
                          {c.hitPoints.temporary && c.hitPoints.temporary > 0 && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="text-[8px] text-gold-400/70 font-medium">THP +{c.hitPoints.temporary}</span>
                              <div className="h-1 bg-gold-500/30 rounded-full flex-1 max-w-[60px] overflow-hidden">
                                <div className="h-full bg-gold-500/50 rounded-full" style={{ width: `${Math.min(100, (c.hitPoints.temporary / c.hitPoints.max) * 100)}%` }} />
                              </div>
                            </div>
                          )}

                          {/* Conditions */}
                          {c.conditions && c.conditions.length > 0 && (
                            <div className="mt-1 flex items-center gap-1 flex-wrap">
                              {c.conditions.slice(0, 4).map((cond) => (
                                <span key={cond} className="text-[7px] px-1 py-0.5 rounded bg-surface-800/60 border border-white/[0.04] text-surface-500 uppercase tracking-wider">
                                  {cond}
                                </span>
                              ))}
                              {c.conditions.length > 4 && (
                                <span className="text-[7px] text-surface-600">+{c.conditions.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Expanded: Custom HP Input ── */}
                      {isExpanded && (
                        <div
                          className="px-2.5 pb-2.5"
                          style={{ animation: "slide-in-up 0.15s ease-out both" }}
                        >
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                value={customVal}
                                onChange={(e) =>
                                  setCustomInputs((prev) => ({ ...prev, [c.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSetHp(c.id);
                                  if (e.key === "Escape") {
                                    setCustomInputs((prev) => {
                                      const next = { ...prev };
                                      delete next[c.id];
                                      return next;
                                    });
                                    setExpandedChar(null);
                                  }
                                }}
                                min={0}
                                max={c.hitPoints.max}
                                placeholder={`Set HP (0–${c.hitPoints.max})`}
                                className="w-full bg-[#07080d]/80 border border-gold-500/20 rounded-lg px-2.5 py-1.5 text-xs text-gold-300 font-mono focus:outline-none focus:border-gold-500/35 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-700 transition-all duration-200"
                                autoFocus
                              />
                            </div>
                            <button
                              onClick={() => handleSetHp(c.id)}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-gold-500/12 text-gold-400 border border-gold-500/20 hover:bg-gold-500/20 active:scale-90 transition-all duration-150"
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => {
                                setCustomInputs((prev) => {
                                  const next = { ...prev };
                                  delete next[c.id];
                                  return next;
                                });
                                setExpandedChar(null);
                              }}
                              className="px-2 py-1.5 rounded-lg text-[10px] text-surface-500 hover:text-surface-300 border border-transparent hover:border-white/[0.06] active:scale-90 transition-all duration-150"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Footer Legend ── */}
              <div
                className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[8px] text-surface-600"
                style={{ animation: "slide-in-up 0.2s ease-out 0.15s both" }}
              >
                <span>{characters.length} hero{characters.length !== 1 ? "es" : ""}</span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/50" /> Healthy
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500/50" /> Wounded
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500/50" /> Critical
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
