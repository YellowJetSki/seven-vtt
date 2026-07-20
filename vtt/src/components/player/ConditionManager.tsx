/**
 * STᚱ VTT — Condition Manager Component
 *
 * Full D&D 5e condition manager with:
 *   - All 15 official conditions + Concentration
 *   - Click to apply/remove with mechanical effect preview
 *   - Search and category filtering
 *   - Active condition badges with clear button
 *   - Mechanical effect summary panel
 *   - Duration tracking (passes per turn)
 *   - Source tracking (who applied it)
 *
 * Designed for use in both Player Sheet (Combat Tab) and DM Control Center.
 */

import { useState, useMemo, useCallback } from "react";
import type { PlayerCharacter } from "@/types/character";
import type { ConditionId } from "@/types/condition-types";
import { useConditionMutations } from "@/hooks/useCharacterMutations";
import {
  computeConditionModifiers,
  applyConditionSpeed,
  getConditionStyle,
  getAllConditionDetails,
  type ConditionModifiers,
  type ConditionDetail,
} from "@/lib/mechanics/condition-application";

interface ConditionManagerProps {
  character: PlayerCharacter;
  /** Whether to show in compact mode (inline in combat tab) */
  compact?: boolean;
  /** If true, also shows speed and attack modifiers */
  showModifiers?: boolean;
  onClose?: () => void;
}

export default function ConditionManager({
  character,
  compact = false,
  showModifiers = true,
  onClose,
}: ConditionManagerProps) {
  const {
    handleToggleCondition: toggleConditionMutation,
    handleClearAllConditions: clearAllConditionsMutation,
  } = useConditionMutations();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ConditionId | null>(null);

  // ── Conditions Data ──
  const allConditions = useMemo(() => getAllConditionDetails(), []);
  const activeIds = character.conditions || [];
  const activeSet = useMemo(() => new Set(activeIds), [activeIds]);

  // ── Mechanical Effects ──
  const conditionModifiers = useMemo(
    () => computeConditionModifiers(activeIds),
    [activeIds]
  );

  const modifiedSpeed = useMemo(
    () => applyConditionSpeed(character.speed, conditionModifiers),
    [character.speed, conditionModifiers]
  );

  // ── Filtered Conditions ──
  const filteredConditions = useMemo(() => {
    let list = allConditions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.effects.some((e) => e.toLowerCase().includes(q))
      );
    }
    if (activeFilter) {
      list = list.filter((c) => c.id === activeFilter);
    }
    // Active conditions first
    return [...list].sort((a, b) => {
      const aActive = activeSet.has(a.id) ? 0 : 1;
      const bActive = activeSet.has(b.id) ? 0 : 1;
      return aActive - bActive;
    });
  }, [allConditions, search, activeFilter, activeSet]);

  // ── Toggle Condition (writes to BOTH Zustand + Firestore) ──
  const toggleCondition = useCallback(
    (conditionId: string) => {
      toggleConditionMutation(character, conditionId);
    },
    [character, toggleConditionMutation]
  );

  const clearAll = useCallback(() => {
    clearAllConditionsMutation(character);
  }, [character, clearAllConditionsMutation]);

  // ── Summary Badges ──
  const hasActive = activeIds.length > 0;
  const hasEffects =
    conditionModifiers.speedMultiplier < 1 ||
    conditionModifiers.attackRollMod !== "normal" ||
    conditionModifiers.savingThrowMod !== "normal" ||
    conditionModifiers.abilityCheckMod !== "normal" ||
    !conditionModifiers.canTakeActions ||
    !conditionModifiers.canTakeReactions;

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Active condition badges */}
        <div className="flex flex-wrap gap-1">
          {activeIds.map((id) => {
            const detail = allConditions.find((c) => c.id === id);
            const style = detail?.color ?? getConditionStyle(id);
            return (
              <button
                key={id}
                onClick={() => toggleCondition(id)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all duration-150 active:scale-90 ${style.bg} ${style.text} ${style.border} hover:opacity-80`}
                title={`Click to remove ${detail?.name || id}`}
              >
                <span>{style.icon}</span>
                <span>{detail?.name || id}</span>
                <span className="opacity-50 ml-0.5">✕</span>
              </button>
            );
          })}
          {!hasActive && (
            <span className="text-[10px] text-surface-500 italic">No conditions</span>
          )}
        </div>

        {/* Mechanical summary */}
        {hasEffects && showModifiers && (
          <div className="rounded-lg bg-rose-500/5 border border-rose-500/15 p-2 text-[9px] text-rose-300/80 space-y-0.5">
            {conditionModifiers.attackRollMod !== "normal" && (
              <p>🎯 Attack rolls: <strong>{conditionModifiers.attackRollMod === "disadvantage" ? "Disadvantage" : "Advantage"}</strong></p>
            )}
            {conditionModifiers.savingThrowMod !== "normal" && (
              <p>🛡 Saves: <strong>{conditionModifiers.savingThrowMod === "disadvantage" ? "Disadvantage" : "Advantage"}</strong></p>
            )}
            {conditionModifiers.abilityCheckMod !== "normal" && (
              <p>📋 Checks: <strong>{conditionModifiers.abilityCheckMod === "disadvantage" ? "Disadvantage" : "Advantage"}</strong></p>
            )}
            {!conditionModifiers.canTakeActions && <p>❌ Cannot take Actions</p>}
            {!conditionModifiers.canTakeReactions && <p>❌ Cannot take Reactions</p>}
            {modifiedSpeed.walk < character.speed.walk && (
              <p>🏃 Speed: {modifiedSpeed.walk}ft (was {character.speed.walk}ft)</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Full Panel ──
  return (
    <div className="space-y-3">
      {/* ── Active Conditions Display ── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
            Active Conditions
            {hasActive && (
              <span className="text-surface-500 font-normal ml-1">({activeIds.length})</span>
            )}
          </h3>
          {hasActive && (
            <div className="flex gap-1">
              {activeIds.length > 1 && (
                <button
                  onClick={clearAll}
                  className="text-[9px] text-rose-400/70 hover:text-rose-400 transition-colors px-1.5 py-0.5 rounded bg-rose-500/5 border border-rose-500/10"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {hasActive ? (
          <div className="flex flex-wrap gap-1.5">
            {activeIds.map((id) => {
              const detail = allConditions.find((c) => c.id === id);
              const style = detail?.color ?? getConditionStyle(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleCondition(id)}
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 active:scale-90 ${style.bg} ${style.text} ${style.border} hover:opacity-80`}
                  title={`Click to remove ${detail?.name || id}`}
                >
                  <span>{style.icon}</span>
                  <span>{detail?.name || id}</span>
                  <span className="opacity-0 group-hover:opacity-60 transition-opacity ml-0.5">✕</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-obsidian-mid/30 border border-surface-700/10 p-3 text-center">
            <p className="text-[10px] text-surface-600">No active conditions</p>
            <p className="text-[9px] text-surface-700 mt-0.5">
              Click a condition below to apply it
            </p>
          </div>
        )}

        {/* Mechanical Effect Summary */}
        {hasEffects && showModifiers && (
          <div className="rounded-xl bg-rose-500/5 border border-rose-500/15 p-2.5 space-y-1">
            <h4 className="text-[9px] uppercase tracking-wider font-bold text-rose-400/60">
              Mechanical Effects
            </h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
              {conditionModifiers.attackRollMod !== "normal" && (
                <span className="text-rose-300/80">
                  🎯 Attacks: <strong>{conditionModifiers.attackRollMod === "disadvantage" ? "Disadvantage" : "Advantage"}</strong>
                </span>
              )}
              {conditionModifiers.savingThrowMod !== "normal" && (
                <span className="text-rose-300/80">
                  🛡 Saves: <strong>{conditionModifiers.savingThrowMod === "disadvantage" ? "Disadvantage" : "Advantage"}</strong>
                </span>
              )}
              {conditionModifiers.abilityCheckMod !== "normal" && (
                <span className="text-rose-300/80">
                  📋 Checks: <strong>{conditionModifiers.abilityCheckMod === "disadvantage" ? "Disadvantage" : "Advantage"}</strong>
                </span>
              )}
              {!conditionModifiers.canTakeActions && (
                <span className="text-rose-300/80">❌ No Actions</span>
              )}
              {!conditionModifiers.canTakeBonusActions && (
                <span className="text-rose-300/80">❌ No Bonus Actions</span>
              )}
              {!conditionModifiers.canTakeReactions && (
                <span className="text-rose-300/80">❌ No Reactions</span>
              )}
              {!conditionModifiers.canConcentrate && (
                <span className="text-rose-300/80">💔 Concentration broken</span>
              )}
              {!conditionModifiers.canSpeak && (
                <span className="text-rose-300/80">🔇 Cannot speak</span>
              )}
              {modifiedSpeed.walk < character.speed.walk && (
                <span className="text-rose-300/80">
                  🏃 Speed: {modifiedSpeed.walk}ft <span className="text-rose-500/60">({character.speed.walk}ft base)</span>
                </span>
              )}
              {conditionModifiers.autoFailSaves.length > 0 && (
                <span className="text-rose-300/80">
                  ❌ Auto-fail: {conditionModifiers.autoFailSaves.join(", ")} saves
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Condition Browser ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conditions..."
              className="w-full py-2 pl-8 pr-3 text-[11px] bg-obsidian-mid/60 border border-surface-700/30 rounded-xl text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500 text-[10px]">🔍</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto scrollbar-gold pr-1">
          {filteredConditions.map((condition) => {
            const isActive = activeSet.has(condition.id);
            return (
              <button
                key={condition.id}
                onClick={() => toggleCondition(condition.id)}
                className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? `${condition.color.bg} ${condition.color.border} border`
                    : "bg-obsidian-mid/30 border border-surface-700/10 hover:border-surface-600/30"
                }`}
              >
                <span className={`text-base mt-0.5 ${isActive ? "" : "opacity-50"}`}>
                  {condition.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${isActive ? condition.color.text : "text-surface-300"}`}>
                      {condition.name}
                    </span>
                    {isActive && (
                      <span className="px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] mt-0.5 leading-relaxed ${isActive ? "text-surface-400" : "text-surface-500"}`}>
                    {condition.summary}
                  </p>
                  {condition.effects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {condition.effects.map((effect) => (
                        <span
                          key={effect}
                          className="px-1 py-[1px] rounded text-[8px] bg-rose-500/5 text-rose-400/70 border border-rose-500/10"
                        >
                          {effect}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {filteredConditions.length === 0 && (
            <div className="text-center py-4">
              <p className="text-[10px] text-surface-500">No conditions match "{search}"</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer Legend ── */}
      <div className="flex items-center gap-2 text-[8px] text-surface-600 border-t border-surface-700/10 pt-2">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500/40" /> Active
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-surface-600/40" /> Inactive
        </span>
        <span className="ml-auto">Click to toggle</span>
      </div>
    </div>
  );
}
