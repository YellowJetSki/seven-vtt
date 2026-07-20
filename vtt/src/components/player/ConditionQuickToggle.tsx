/**
 * STᚱ VTT — Condition Quick-Toggle Overlay (Real-Play D&D Mechanics, Sprint 15)
 *
 * A DM-facing rapid condition management tool for the Player Cards page.
 * Allows the DM to apply/remove conditions on any character in 1-2 clicks.
 *
 * Features:
 * - All 16 standard 5e conditions with unique colors and icons
 * - Per-character selection via chip picker
 * - Click-to-toggle with instant visual feedback
 * - Bulk "Clear All" per character
 * - Concentration tracking (set/break with damage-based DC)
 * - Active conditions summary bar
 * - "Temporary buff/debuff" custom input (for custom effects)
 * - Premium glass card styling with staggered animations
 *
 * Architecture:
 * - Reads characters + conditions from campaignStore
 * - Writes condition state via campaignStore.updateCharacter()
 * - Uses the shared CONDITION data from condition-data for styling
 * - Mounted on PlayerCards page via PlayerList
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { CONDITIONS } from "@/types";
import type { ConditionId } from "@/types";
import ConditionDots from "./ConditionDots";

// ── All 16 conditions as a display-oriented array ──

interface ConditionToggleProps {
  /** Optional className */
  className?: string;
}

interface CustomBuff {
  charId: string;
  label: string;
  description: string;
  duration: string;
  timestamp: number;
}

// ── Group conditions by category for the UI ──

const CONDITION_CATEGORIES: { label: string; ids: ConditionId[] }[] = [
  {
    label: "Debilitating",
    ids: ["incapacitated", "paralyzed", "petrified", "stunned", "unconscious"],
  },
  {
    label: "Motion",
    ids: ["grappled", "prone", "restrained"],
  },
  {
    label: "Senses & Mind",
    ids: ["blinded", "charmed", "deafened", "frightened", "invisible"],
  },
  {
    label: "Other",
    ids: ["exhaustion", "poisoned", "concentration"],
  },
];

// ── Helper: get condition color as Tailwind class ──

function getConditionBg(conditionId: ConditionId): string {
  const colorMap: Partial<Record<ConditionId, string>> = {
    paralyzed: "bg-amber-500/12 border-amber-500/25 text-amber-400",
    petrified: "bg-surface-500/12 border-surface-500/25 text-surface-400",
    stunned: "bg-pink-500/12 border-pink-500/25 text-pink-400",
    unconscious: "bg-red-500/12 border-red-500/25 text-red-400",
    incapacitated: "bg-rose-500/12 border-rose-500/25 text-rose-400",
    grappled: "bg-amber-500/8 border-amber-500/20 text-amber-400",
    prone: "bg-sky-500/8 border-sky-500/20 text-sky-400",
    restrained: "bg-amber-500/12 border-amber-500/25 text-amber-400",
    blinded: "bg-slate-500/12 border-slate-500/25 text-slate-400",
    charmed: "bg-pink-500/8 border-pink-500/20 text-pink-400",
    deafened: "bg-cyan-500/8 border-cyan-500/20 text-cyan-400",
    frightened: "bg-violet-500/12 border-violet-500/25 text-violet-400",
    invisible: "bg-indigo-500/8 border-indigo-500/20 text-indigo-300",
    exhaustion: "bg-amber-500/12 border-amber-500/25 text-amber-400",
    poisoned: "bg-emerald-500/12 border-emerald-500/25 text-emerald-400",
    concentration: "bg-violet-500/12 border-violet-500/25 text-violet-400",
  };
  return colorMap[conditionId] || "bg-surface-500/8 border-surface-500/20 text-surface-400";
}

export default function ConditionQuickToggle({ className = "" }: ConditionToggleProps) {
  const characters = useCampaignStore((s) => s.characters);
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  // ── State ──
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [customBuffs, setCustomBuffs] = useState<CustomBuff[]>([]);
  const [showBuffForm, setShowBuffForm] = useState(false);
  const [buffLabel, setBuffLabel] = useState("");
  const [buffDesc, setBuffDesc] = useState("");
  const [buffDuration, setBuffDuration] = useState("");
  const [flashMessage, setFlashMessage] = useState<{
    text: string;
    type: "success" | "info" | "warning";
  } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showFlash = useCallback((text: string, type: "success" | "info" | "warning" = "success") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setFlashMessage({ text, type });
    timeoutRef.current = setTimeout(() => setFlashMessage(null), 1500);
  }, []);

  // ── Selected character ──
  const selectedChar = useMemo(
    () => characters.find((c) => c.id === selectedCharId) ?? null,
    [characters, selectedCharId]
  );

  const activeConditions = useMemo(
    () => (selectedChar?.conditions ?? []) as ConditionId[],
    [selectedChar]
  );

  // ── Toggle a condition on the selected character ──
  const handleToggleCondition = useCallback(
    (conditionId: ConditionId) => {
      if (!selectedCharId || !selectedChar) return;

      const current = selectedChar.conditions as ConditionId[];
      const isActive = current.includes(conditionId);
      const next = isActive
        ? current.filter((c) => c !== conditionId)
        : [...current, conditionId];

      updateCharacter(selectedCharId, { conditions: next });
      showFlash(
        isActive
          ? `\u2716 Removed ${CONDITIONS[conditionId]?.name || conditionId}`
          : `\u2714 Applied ${CONDITIONS[conditionId]?.name || conditionId}`,
        isActive ? "info" : "success"
      );
    },
    [selectedCharId, selectedChar, updateCharacter, showFlash]
  );

  // ── Clear all conditions on the selected character ──
  const handleClearAll = useCallback(() => {
    if (!selectedCharId || !selectedChar) return;
    const count = selectedChar.conditions.length;
    if (count === 0) return;
    updateCharacter(selectedCharId, { conditions: [] });
    showFlash(`\u2728 Cleared ${count} condition${count > 1 ? "s" : ""}`, "warning");
  }, [selectedCharId, selectedChar, updateCharacter, showFlash]);

  // ── Set concentration ──
  const handleSetConcentration = useCallback(
    (spellName?: string) => {
      if (!selectedCharId || !selectedChar) return;
      const current = (selectedChar.conditions as ConditionId[]).filter(
        (c) => c !== "concentration"
      );
      const next = [...current, "concentration"];
      updateCharacter(selectedCharId, { conditions: next });
      showFlash(
        `\uD83D\uDD11 ${selectedChar.name.split(" ")[0]} concentrating${spellName ? `: ${spellName}` : ""}`,
        "success"
      );
    },
    [selectedCharId, selectedChar, updateCharacter, showFlash]
  );

  // ── Break concentration ──
  const handleBreakConcentration = useCallback(() => {
    if (!selectedCharId || !selectedChar) return;
    const next = (selectedChar.conditions as ConditionId[]).filter(
      (c) => c !== "concentration"
    );
    updateCharacter(selectedCharId, { conditions: next });
    showFlash(`\u26A0 Concentration broken on ${selectedChar.name.split(" ")[0]}`, "warning");
  }, [selectedCharId, selectedChar, updateCharacter, showFlash]);

  // ── Add custom buff ──
  const handleAddBuff = useCallback(() => {
    if (!selectedCharId || !buffLabel.trim()) return;
    const newBuff: CustomBuff = {
      charId: selectedCharId,
      label: buffLabel.trim(),
      description: buffDesc.trim() || "No details.",
      duration: buffDuration.trim() || "Ongoing",
      timestamp: Date.now(),
    };
    setCustomBuffs((prev) => [...prev, newBuff]);
    setBuffLabel("");
    setBuffDesc("");
    setBuffDuration("");
    setShowBuffForm(false);
    showFlash(`\u2728 Added buff: ${newBuff.label}`, "success");
  }, [selectedCharId, buffLabel, buffDesc, buffDuration, showFlash]);

  // ── Remove custom buff ──
  const handleRemoveBuff = useCallback(
    (timestamp: number) => {
      setCustomBuffs((prev) => prev.filter((b) => b.timestamp !== timestamp));
      showFlash("\u2716 Removed buff", "info");
    },
    [showFlash]
  );

  // ── Get character's concentration status ──
  const isConcentrating = activeConditions.includes("concentration");

  // ── No characters → hide ──
  if (characters.length === 0) return null;

  // ── Count of total active conditions across party ──
  const totalConditions = characters.reduce(
    (sum, c) => sum + (c.conditions?.length ?? 0),
    0
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Flash Message ── */}
      {flashMessage && (
        <div
          className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
            flashMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : flashMessage.type === "info"
                ? "bg-gold-500/10 border-gold-500/20 text-gold-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}
          style={{ animation: "slide-in-up 0.15s ease-out both" }}
        >
          <span className="flex items-center gap-2">
            {flashMessage.text}
            <button
              onClick={() => setFlashMessage(null)}
              className="ml-auto text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
      )}

      {/* ── Main Panel ── */}
      <div className="relative bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] rounded-xl overflow-hidden">
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none" />

        <div className="relative z-[1] p-3 sm:p-4">
          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm" aria-hidden="true">\uD83D\uDCA1</span>
              <h3 className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                Conditions
              </h3>
              <span className="text-[8px] text-surface-600 bg-[#0c0d15] border border-white/[0.04] px-1.5 py-0.5 rounded-full">
                {totalConditions} active
              </span>
            </div>
          </div>

          {/* ── Character Target Picker ── */}
          <div
            className="flex flex-wrap gap-1.5 mb-3"
            style={{ animation: "slide-in-up 0.2s ease-out both" }}
          >
            {characters.map((c, idx) => {
              const isSelected = selectedCharId === c.id;
              const charConditions = (c.conditions ?? []) as ConditionId[];
              const hpRatio =
                c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCharId(isSelected ? null : c.id)}
                  className={`relative px-2.5 py-1.5 rounded-xl text-[10px] font-medium border transition-all duration-150 active:scale-90 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-gold-500/12 border-gold-500/25 text-gold-300 shadow-[0_0_10px_rgba(234,179,8,0.05)]"
                      : "bg-[#0c0d15]/60 border-white/[0.04] text-surface-400 hover:text-surface-200 hover:border-white/[0.08]"
                  }`}
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  {/* HP indicator */}
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      hpRatio <= 0.25
                        ? "bg-red-500"
                        : hpRatio <= 0.5
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                  />

                  <span className="truncate max-w-[70px]">
                    {c.name.split(" ")[0]}
                  </span>

                  {/* Condition dot summary */}
                  {charConditions.length > 0 && (
                    <span className="flex" onClick={(e) => e.stopPropagation()}>
                      <ConditionDots conditionIds={charConditions} size={5} maxDots={2} />
                    </span>
                  )}

                  {isSelected && (
                    <span className="text-[8px] text-gold-500/60 shrink-0">\u2713</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── No character selected state ── */}
          {!selectedCharId && (
            <div className="text-center py-2">
              <p className="text-[10px] text-surface-600 italic">
                Select a character to manage conditions
              </p>
            </div>
          )}

          {/* ── Selected Character: Condition Toggles ── */}
          {selectedCharId && selectedChar && (
            <div style={{ animation: "slide-in-up 0.2s ease-out 0.05s both" }}>
              {/* Character badge + Clear All */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-surface-200">
                    {selectedChar.name}
                  </span>
                  {activeConditions.length > 0 && (
                    <span className="text-[9px] text-surface-500">
                      {activeConditions.length} active
                    </span>
                  )}
                </div>
                {activeConditions.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="px-2 py-1 rounded-lg text-[8px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/15 hover:bg-amber-500/15 active:scale-90 transition-all duration-150"
                  >
                    \u2716 Clear All
                  </button>
                )}
              </div>

              {/* ── Condition Groups ── */}
              <div className="space-y-2.5">
                {CONDITION_CATEGORIES.map((category) => {
                  const activeInCategory = category.ids.filter((id) =>
                    activeConditions.includes(id)
                  );

                  return (
                    <div key={category.label}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[8px] uppercase tracking-wider text-surface-600 font-medium">
                          {category.label}
                        </span>
                        {activeInCategory.length > 0 && (
                          <span className="text-[8px] text-gold-500/60">
                            {activeInCategory.map((id) => CONDITIONS[id]?.icon).join(" ")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {category.ids.map((conditionId) => {
                          const cond = CONDITIONS[conditionId];
                          if (!cond) return null;
                          const isActive = activeConditions.includes(conditionId);

                          return (
                            <button
                              key={conditionId}
                              onClick={() => handleToggleCondition(conditionId)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-medium border transition-all duration-150 active:scale-90 ${
                                isActive
                                  ? `${getConditionBg(conditionId)} shadow-[0_0_8px_rgba(0,0,0,0.1)]`
                                  : "bg-[#0c0d15]/50 border-white/[0.03] text-surface-500 hover:text-surface-300 hover:border-white/[0.08]"
                              }`}
                              title={cond.description}
                              style={{ animationDelay: `0.1s` }}
                            >
                              <span className="text-[11px]" aria-hidden="true">
                                {cond.icon}
                              </span>
                              <span>{cond.name}</span>
                              {isActive && (
                                <span className="text-current ml-0.5 opacity-80">\u2713</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Concentration Section ── */}
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-wider text-surface-600 font-medium">
                      \uD83D\uDD11 Concentration
                    </span>
                    {isConcentrating && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold bg-violet-500/12 text-violet-400 border border-violet-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!isConcentrating ? (
                      <button
                        onClick={() => handleSetConcentration()}
                        className="px-2 py-1 rounded-lg text-[8px] font-bold text-violet-400 bg-violet-500/8 border border-violet-500/15 hover:bg-violet-500/15 active:scale-90 transition-all duration-150"
                      >
                        + Focus
                      </button>
                    ) : (
                      <button
                        onClick={handleBreakConcentration}
                        className="px-2 py-1 rounded-lg text-[8px] font-bold text-red-400 bg-red-500/8 border border-red-500/15 hover:bg-red-500/15 active:scale-90 transition-all duration-150"
                      >
                        \u26A0 Break
                      </button>
                    )}
                  </div>
                </div>

                {isConcentrating && (
                  <div className="mt-1.5 text-[9px] text-surface-500 italic">
                    \uD83D\uDCA1 Concentration active — damage triggers Constitution save (DC 10 or half damage taken, whichever is higher)
                  </div>
                )}
              </div>

              {/* ── Custom Buff Section ── */}
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase tracking-wider text-surface-600 font-medium">
                    \u2728 Custom Buffs / Debuffs
                  </span>
                  <button
                    onClick={() => setShowBuffForm((p) => !p)}
                    className={`px-2 py-1 rounded-lg text-[8px] font-bold border transition-all duration-150 active:scale-90 ${
                      showBuffForm
                        ? "bg-gold-500/12 border-gold-500/20 text-gold-400"
                        : "bg-[#0c0d15]/50 border-white/[0.04] text-surface-500 hover:text-surface-300 hover:border-white/[0.08]"
                    }`}
                  >
                    {showBuffForm ? "Cancel" : "+ Add"}
                  </button>
                </div>

                {/* Buff Form */}
                {showBuffForm && (
                  <div
                    className="space-y-2 mb-2.5 p-2.5 rounded-xl bg-[#0c0d15]/60 border border-white/[0.04]"
                    style={{ animation: "slide-in-up 0.15s ease-out both" }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[7px] uppercase tracking-wider text-surface-600 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={buffLabel}
                          onChange={(e) => setBuffLabel(e.target.value)}
                          placeholder="e.g., Bless, Haste"
                          className="w-full bg-[#0c0d15] border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-surface-200 placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[7px] uppercase tracking-wider text-surface-600 mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={buffDuration}
                          onChange={(e) => setBuffDuration(e.target.value)}
                          placeholder="e.g., 1 min, 1 hour"
                          className="w-full bg-[#0c0d15] border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-surface-200 placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[7px] uppercase tracking-wider text-surface-600 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={buffDesc}
                        onChange={(e) => setBuffDesc(e.target.value)}
                        placeholder="Effects or notes..."
                        className="w-full bg-[#0c0d15] border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-surface-200 placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-200"
                      />
                    </div>
                    <button
                      onClick={handleAddBuff}
                      disabled={!buffLabel.trim()}
                      className="px-3 py-1.5 rounded-xl text-[9px] font-semibold bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      \u2795 Add Buff
                    </button>
                  </div>
                )}

                {/* Active Custom Buffs */}
                {customBuffs.filter((b) => b.charId === selectedCharId).length > 0 && (
                  <div className="space-y-1">
                    {customBuffs
                      .filter((b) => b.charId === selectedCharId)
                      .map((buff) => (
                        <div
                          key={buff.timestamp}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#0c0d15]/50 border border-white/[0.03] group/buff"
                          style={{ animation: "slide-in-up 0.15s ease-out both" }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[9px] font-medium text-surface-300 truncate">
                              {buff.label}
                            </span>
                            <span className="text-[8px] text-surface-600 shrink-0">
                              {buff.duration}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveBuff(buff.timestamp)}
                            className="opacity-0 group-hover/buff:opacity-100 px-1.5 py-0.5 rounded text-[8px] text-red-400 bg-red-500/8 border border-red-500/15 hover:bg-red-500/15 active:scale-90 transition-all duration-150 shrink-0"
                          >
                            \u2716
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {customBuffs.filter((b) => b.charId === selectedCharId).length === 0 && (
                  <p className="text-[9px] text-surface-600 italic">
                    No custom buffs for {selectedChar.name.split(" ")[0]}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
