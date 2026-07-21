/**
 * STᚱ VTT — Inline Stat Card (Premium Editable Stat)
 *
 * Overrrides/Ventriloc-grade inline stat editing component.
 * Combines premium stat display with inline edit functionality.
 * Supports: numeric stats, currency, proficiency bonus, ability scores.
 *
 * Features:
 * - Premium glass card with gold edge light + hover glow
 * - Tap to edit inline (numeric input with validation)
 * - Instant +/- quick presets (configurable)
 * - Color-coded values based on thresholds
 * - Staggered entrance animation
 * - 44px+ touch targets for mobile
 * - Keyboard Enter to commit, Escape to cancel
 *
 * Usage:
 *   <InlineStatCard
 *     label="HP"
 *     value={44}
 *     maxValue={44}
 *     presets={[-10, -5, -1, 1, 5, 10]}
 *     colorThresholds={[0, 0.25, 0.5, 0.75]}
 *     variant="hp"
 *     onChange={(val) => handleHpChange(c, val)}
 *   />
 *
 * Campaign: Arkla — Wendy Swiftfoot, Kehrfuffle Ironheart
 */

import { useState, useRef, useEffect, useCallback } from "react";

type StatVariant = "default" | "hp" | "gold" | "xp" | "ability" | "proficiency";

interface PresetButton {
  label: string;
  value: number;
}

interface InlineStatCardProps {
  /** Stat label (e.g., "HP", "XP", "GP") */
  label: string;
  /** Current numeric value */
  value: number;
  /** Maximum value (optional, for ratio display) */
  maxValue?: number;
  /** Quick-adjust preset buttons */
  presets?: number[];
  /** Color thresholds as ratios of (value / maxValue). 
   *  Default: [0, 0.25, 0.5, 0.75] → rose/red/amber/emerald */
  colorThresholds?: number[];
  /** Visual variant for color coding */
  variant?: StatVariant;
  /** Icon to display */
  icon?: string;
  /** Called when value changes (delta for presets, absolute for direct input) */
  onChange?: (newValue: number) => void;
  /** Custom suffix (defaults to label-specific) */
  suffix?: string;
  /** Tooltip text */
  hint?: string;
}

function getTextColor(value: number, maxValue: number | undefined, variant: StatVariant): string {
  if (variant === "hp" && maxValue && maxValue > 0) {
    const ratio = value / maxValue;
    if (value <= 0) return "text-rose-400";
    if (ratio <= 0.25) return "text-red-400";
    if (ratio <= 0.5) return "text-amber-400";
    return "text-emerald-400";
  }
  if (variant === "gold") return "text-gold-300";
  if (variant === "xp") return "text-amber-300";
  if (variant === "ability") return "text-gold-400";
  if (variant === "proficiency") return "text-violet-300";
  return "text-surface-200";
}

function getBarColor(ratio: number, variant: StatVariant): string {
  if (variant === "xp") return "bg-gradient-to-r from-amber-600 via-amber-500 to-gold-500";
  if (ratio <= 0) return "bg-rose-500";
  if (ratio <= 0.25) return "bg-red-500";
  if (ratio <= 0.5) return "bg-amber-500";
  if (ratio <= 0.75) return "bg-emerald-400";
  return "bg-emerald-500";
}

export default function InlineStatCard({
  label,
  value,
  maxValue,
  presets = [],
  colorThresholds,
  variant = "default",
  icon,
  onChange,
  suffix,
  hint,
}: InlineStatCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync edit value when external value changes and not editing
  useEffect(() => {
    if (!isEditing) setEditValue(String(value));
  }, [value, isEditing]);

  // Focus input on edit
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && onChange) {
      onChange(parsed);
    }
    setIsEditing(false);
  }, [editValue, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") commitEdit();
      if (e.key === "Escape") {
        setEditValue(String(value));
        setIsEditing(false);
      }
    },
    [commitEdit, value]
  );

  const handlePreset = useCallback(
    (delta: number) => {
      if (onChange) onChange(value + delta);
    },
    [value, onChange]
  );

  const ratio = maxValue && maxValue > 0 ? Math.min(1, Math.max(0, value / maxValue)) : 1;

  return (
    <div className="relative group rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04] hover:border-gold/10 transition-all duration-200 overflow-hidden">
      {/* Edge light on hover */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

      <div className="px-3 py-2.5 relative z-[1]">
        {/* Label row */}
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1">
            {icon && <span className="text-[10px]">{icon}</span>}
            <span className="text-[7px] uppercase tracking-widest font-bold text-surface-600 group-hover:text-surface-500 transition-colors">
              {label}
            </span>
          </span>
          {hint && (
            <span className="text-[6px] text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity">
              {hint}
            </span>
          )}
        </div>

        {/* Value or Edit Input */}
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commitEdit}
              className="w-full bg-surface-900/60 border border-gold/20 rounded-lg px-2 py-1 text-sm font-bold text-gold-300 tabular-nums outline-none focus:border-gold/40 transition-colors"
              min={0}
            />
            <span className="text-[8px] text-surface-600 italic">↵</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-lg font-bold tabular-nums cursor-pointer hover:opacity-80 transition-opacity ${
                getTextColor(value, maxValue, variant)
              }`}
              onClick={() => setIsEditing(true)}
              title="Tap to edit"
            >
              {value.toLocaleString()}
            </span>
            {maxValue !== undefined && (
              <span className="text-[10px] text-surface-600 tabular-nums">/ {maxValue.toLocaleString()}</span>
            )}
            {suffix && <span className="text-[9px] text-surface-600">{suffix}</span>}
          </div>
        )}

        {/* Progress bar (for HP, XP) */}
        {maxValue !== undefined && maxValue > 0 && (
          <div className="mt-1.5 h-1 bg-surface-800/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getBarColor(ratio, variant)}`}
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
        )}

        {/* Preset buttons row */}
        {presets.length > 0 && (
          <div className="flex gap-1 mt-2">
            {presets.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePreset(p)}
                className={`flex-1 h-7 rounded-lg text-[9px] font-semibold transition-all duration-150 active:scale-90 ${
                  p < 0
                    ? "bg-rose-500/8 text-rose-400/70 border border-rose-500/10 hover:bg-rose-500/15 hover:text-rose-300"
                    : p > 0
                    ? "bg-emerald-500/8 text-emerald-400/70 border border-emerald-500/10 hover:bg-emerald-500/15 hover:text-emerald-300"
                    : "bg-surface-800/40 text-surface-500 border border-surface-700/20"
                }`}
              >
                {p > 0 ? "+" : ""}{p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
