/**
 * STᚱ VTT — Ability Score Roller
 *
 * Premium manual ability score entry component for character creation.
 * Players enter their rolled (or point-buy) scores, and see modifiers
 * auto-calculated in real-time.
 *
 * Features:
 * - 6 stat cards (STR/DEX/CON/INT/WIS/CHA) with icon, label, score input
 * - Auto-computed modifier display with color coding (positive gold, negative rose)
 * - Score description label (Feeble → Mythic)
 * - Point-buy validation mode (toggleable)
 * - Standard Array presets (15/14/13/12/10/8)
 * - Roll simulation buttons (4d6 drop lowest)
 * - Total modifier sum + highest/lowest indicators
 *
 * Usage:
 *   <AbilityScoreRoller
 *     scores={{ strength: 10, dexterity: 10, ... }}
 *     onChange={(scores) => setScores(scores)}
 *   />
 */

import { useState, useCallback, useMemo } from "react";
import { getAbilityMod } from "@/lib/mechanics/character-derivations";

interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

interface AbilityScoreRollerProps {
  scores: AbilityScores;
  onChange: (scores: AbilityScores) => void;
  /** Lock certain scores from editing (e.g., during level-up) */
  locked?: boolean;
  /** Enable point-buy validation mode */
  pointBuy?: boolean;
  className?: string;
}

export type AbilityKey = keyof AbilityScores;

const ABILITIES: { key: AbilityKey; label: string; icon: string; color: string }[] = [
  { key: "strength", label: "Strength", icon: "💪", color: "text-rose-400" },
  { key: "dexterity", label: "Dexterity", icon: "🎯", color: "text-emerald-400" },
  { key: "constitution", label: "Constitution", icon: "❤️", color: "text-amber-400" },
  { key: "intelligence", label: "Intelligence", icon: "🧠", color: "text-cyan-400" },
  { key: "wisdom", label: "Wisdom", icon: "👁️", color: "text-violet-400" },
  { key: "charisma", label: "Charisma", icon: "💬", color: "text-pink-400" },
];

const SCORE_DESCRIPTIONS: { min: number; max: number; label: string }[] = [
  { min: 1, max: 3, label: "Feeble" },
  { min: 4, max: 5, label: "Weak" },
  { min: 6, max: 8, label: "Below Avg" },
  { min: 9, max: 12, label: "Average" },
  { min: 13, max: 15, label: "Above Avg" },
  { min: 16, max: 17, label: "Exceptional" },
  { min: 18, max: 19, label: "Heroic" },
  { min: 20, max: 24, label: "Legendary" },
  { min: 25, max: 30, label: "Mythic" },
];

function getScoreDescriptor(score: number): string {
  for (const d of SCORE_DESCRIPTIONS) {
    if (score >= d.min && score <= d.max) return d.label;
  }
  return "Unknown";
}

/** Standard Array (5e PHB) */
const STANDARD_ARRAY: AbilityScores = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8,
};

/** Point-buy cost table (5e PHB) */
const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

const POINT_BUY_MAX = 27;

/** Simulate 4d6 drop lowest */
function rollAbility(): number {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls.slice(1).reduce((sum, r) => sum + r, 0);
}

export default function AbilityScoreRoller({
  scores,
  onChange,
  locked = false,
  pointBuy = false,
  className = "",
}: AbilityScoreRollerProps) {
  const [editingKey, setEditingKey] = useState<AbilityKey | null>(null);
  const [editValue, setEditValue] = useState("");

  // Point-buy calculations
  const pointBuyTotal = useMemo(() => {
    if (!pointBuy) return 0;
    return ABILITIES.reduce((total, { key }) => {
      const score = Math.min(Math.max(scores[key], 8), 15);
      return total + (POINT_BUY_COSTS[score] || 0);
    }, 0);
  }, [scores, pointBuy]);

  const pointBuyRemaining = POINT_BUY_MAX - pointBuyTotal;
  const isValidPointBuy = pointBuy ? pointBuyRemaining >= 0 : true;

  // Total modifier sum
  const totalMod = ABILITIES.reduce((sum, { key }) => sum + getAbilityMod(scores[key]), 0);

  const handleScoreChange = useCallback(
    (key: AbilityKey, value: number) => {
      const clamped = Math.max(1, Math.min(30, value));
      onChange({ ...scores, [key]: clamped });
    },
    [scores, onChange]
  );

  const handleRollAll = useCallback(() => {
    if (locked) return;
    onChange({
      strength: rollAbility(),
      dexterity: rollAbility(),
      constitution: rollAbility(),
      intelligence: rollAbility(),
      wisdom: rollAbility(),
      charisma: rollAbility(),
    });
  }, [locked, onChange]);

  const handleStandardArray = useCallback(() => {
    if (locked) return;
    const shuffledKeys: AbilityKey[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    const values = [15, 14, 13, 12, 10, 8];
    const newScores = { ...STANDARD_ARRAY };
    shuffledKeys.forEach((key, i) => {
      newScores[key] = values[i];
    });
    onChange(newScores);
  }, [locked, onChange]);

  const startEdit = (key: AbilityKey) => {
    if (locked) return;
    setEditingKey(key);
    setEditValue(String(scores[key]));
  };

  const commitEdit = () => {
    if (editingKey) {
      const val = parseInt(editValue, 10);
      if (!isNaN(val)) {
        handleScoreChange(editingKey, val);
      }
    }
    setEditingKey(null);
  };

  const commitOnKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditingKey(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
          Ability Scores
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleStandardArray}
            disabled={locked}
            className="px-2 py-1 rounded-lg text-[9px] font-semibold bg-white/[0.04] border border-white/[0.06] text-surface-500 hover:text-surface-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            title="Standard Array: 15, 14, 13, 12, 10, 8"
          >
            📐 Standard
          </button>
          <button
            onClick={handleRollAll}
            disabled={locked}
            className="px-2 py-1 rounded-lg text-[9px] font-semibold bg-amber-500/10 border border-amber-500/15 text-amber-400 hover:bg-amber-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            title="4d6 drop lowest (x6)"
          >
            🎲 Roll
          </button>
        </div>
      </div>

      {/* 6 ability score cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {ABILITIES.map(({ key, label, icon, color }) => {
          const score = scores[key];
          const mod = getAbilityMod(score);
          const descriptor = getScoreDescriptor(score);
          const isEditing = editingKey === key;

          // Point-buy restrictions
          const isMaxedOut = pointBuy && score >= 15;
          const isMinedOut = pointBuy && score <= 8;
          const noPointsLeft = pointBuy && pointBuyRemaining <= 0 && !isMinedOut;
          const canIncrementPointBuy = pointBuy && !isMaxedOut && pointBuyRemaining > 0;
          const canDecrementPointBuy = pointBuy && !isMinedOut;

          return (
            <div
              key={key}
              className={`
                relative group flex flex-col items-center gap-1.5 p-2.5 rounded-xl
                transition-all duration-150
                ${isEditing ? "bg-gold-500/8 ring-1 ring-gold-500/25" : "bg-[#0c0d15] border border-white/[0.04] hover:border-white/[0.12]"}
              `}
            >
              {/* Icon + Label */}
              <span className={`text-[16px] ${color}`}>{icon}</span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-surface-500">
                {label.substring(0, 3)}
              </span>

              {/* Score (editable) */}
              {isEditing ? (
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={commitOnKeyDown}
                  min={1}
                  max={30}
                  autoFocus
                  className="w-12 h-8 text-center text-sm font-black bg-[#07080d] border border-gold-500/30 rounded-lg text-gold-300 focus:outline-none focus:ring-1 focus:ring-gold-500/25"
                />
              ) : (
                <button
                  onClick={() => startEdit(key)}
                  disabled={locked}
                  className={`w-12 h-8 text-center text-sm font-black rounded-lg transition-all ${
                    locked ? "text-white/80 cursor-default" : "text-white/80 hover:bg-white/[0.04] hover:border hover:border-gold/20 cursor-pointer"
                  }`}
                >
                  {score}
                </button>
              )}

              {/* Modifier */}
              <div
                className={`
                  text-[10px] font-black tabular-nums transition-colors duration-200
                  ${mod > 0 ? "text-gold-400" : mod < 0 ? "text-rose-400" : "text-surface-500"}
                `}
              >
                {mod >= 0 ? "+" : ""}{mod}
              </div>

              {/* Descriptor */}
              <span className="text-[6px] text-surface-600 uppercase tracking-widest leading-tight text-center">
                {descriptor}
              </span>

              {/* Point-buy indicator */}
              {pointBuy && (
                <div className="absolute -top-1 -right-1">
                  <span
                    className={`text-[7px] font-bold tabular-nums ${
                      !isValidPointBuy ? "text-rose-400" : "text-surface-500"
                    }`}
                  >
                    {POINT_BUY_COSTS[Math.min(Math.max(score, 8), 15)] || 0}pts
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-[9px] text-surface-500 pt-1 border-t border-white/[0.04]">
        <span>
          Total Modifier:{" "}
          <span
            className={`font-bold tabular-nums ${
              totalMod > 0 ? "text-gold-400" : totalMod < 0 ? "text-rose-400" : "text-surface-400"
            }`}
          >
            {totalMod >= 0 ? "+" : ""}{totalMod}
          </span>
        </span>
        {pointBuy && (
          <span className={isValidPointBuy ? "text-surface-500" : "text-rose-400"}>
            {pointBuyTotal}/{POINT_BUY_MAX} points
            {!isValidPointBuy && ` (${pointBuyRemaining} over)`}
          </span>
        )}
      </div>
    </div>
  );
}
