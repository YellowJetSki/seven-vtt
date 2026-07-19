/**
 * STᚱ VTT — Condition Banner (Premium Conversion)
 *
 * A premium floating condition hub with:
 * - Color-coded condition badges with icons
 * - Dismiss/apply functionality for editable mode
 * - Compact inline mode for DM cards
 * - Animated entrance/exit for each condition
 * - Mechanical effect summary panel
 * - All-conditions quick reference (expandable)
 */

import { useState, useCallback } from "react";
import type { ConditionId } from "@/types";
import { CONDITIONS } from "@/types";

// ── Condition effect styles (replacing old rogue/mage/warrior tokens) ──
const EFFECT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  attacks_down: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/20" },
  attacks_up: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/20" },
  saves_down: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/20" },
  checks_down: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/20" },
  speed_down: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/15" },
  incapacitated: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
};

// ── Condition Data ─────────────────────────────────────────────
interface ConditionBannerProps {
  conditions: string[];
  onToggle?: (conditionId: ConditionId) => void;
  editable?: boolean;
  compact?: boolean;
  showEffects?: boolean;
}

export default function ConditionBanner({
  conditions, onToggle, editable = false,
  compact = false, showEffects = false,
}: ConditionBannerProps) {
  const [showAllConditions, setShowAllConditions] = useState(false);
  const [showEffectPanel, setShowEffectPanel] = useState(false);

  const activeConditions = conditions
    .map((id) => CONDITIONS[id as ConditionId])
    .filter(Boolean);

  // Empty state
  if (activeConditions.length === 0 && !compact) {
    return (
      <div className="px-3 py-2 rounded-lg bg-obsidian-mid/40 border border-surface-700/20 text-xs text-surface-500 text-center italic">
        No active conditions
      </div>
    );
  }

  if (compact && activeConditions.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {/* ── Condition Badge Row ── */}
      <div className="flex flex-wrap gap-1.5">
        {activeConditions.map((c) => (
          <div
            key={c.id}
            className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all duration-200 ${
              editable ? "cursor-pointer hover:scale-105 hover:shadow-[0_0_6px_rgba(234,179,8,0.08)]" : ""
            }`}
            style={{
              backgroundColor: `${c.color}18`,
              borderColor: `${c.color}35`,
              color: c.color,
            }}
            title={`${c.name}: ${c.description}`}
            onClick={() => editable && onToggle?.(c.id)}
            role={editable ? "button" : undefined}
            aria-label={`${c.name} condition`}
          >
            <span className="drop-shadow-[0_0_2px_currentColor]">{c.icon}</span>
            <span>{c.name}</span>

            {/* Remove indicator on hover (editable mode) */}
            {editable && (
              <span className="opacity-0 group-hover:opacity-60 transition-opacity ml-0.5 text-[9px]">
                ✕
              </span>
            )}
          </div>
        ))}

        {/* Mechanical effects toggle */}
        {activeConditions.length > 0 && !compact && (
          <button
            onClick={() => setShowEffectPanel(!showEffectPanel)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all ${
              showEffectPanel
                ? "bg-gold-500/10 border-gold/20 text-gold-400"
                : "bg-obsidian-mid/40 border-surface-700/20 text-surface-500 hover:border-gold/15 hover:text-gold-400"
            }`}
          >
            <span>📊</span>
            <span>Effects</span>
          </button>
        )}

        {/* All conditions quick reference toggle */}
        {editable && !compact && (
          <button
            onClick={() => setShowAllConditions(!showAllConditions)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all ${
              showAllConditions
                ? "bg-gold-500/10 border-gold/20 text-gold-400"
                : "bg-obsidian-mid/40 border-surface-700/20 text-surface-500 hover:border-gold/15 hover:text-gold-400"
            }`}
          >
            <span>📋</span>
            <span>All ({Object.keys(CONDITIONS).length})</span>
          </button>
        )}
      </div>

      {/* ── Mechanical Effect Summary Panel ── */}
      {showEffectPanel && activeConditions.length > 0 && (
        <ConditionEffectSummaryPanel conditions={conditions} />
      )}

      {/* ── All Conditions Reference (editable mode) ── */}
      {showAllConditions && editable && (
        <div className="p-2 rounded-lg bg-obsidian-mid/60 border border-surface-700/30 animate-in slide-in-from-top-1 duration-150">
          <div className="flex flex-wrap gap-1">
            {(Object.keys(CONDITIONS) as ConditionId[]).map((id) => {
              const c = CONDITIONS[id];
              const isActive = conditions.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => onToggle?.(id)}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border transition-all ${
                    isActive
                      ? "shadow-[0_0_4px_rgba(234,179,8,0.06)]"
                      : "hover:border-surface-600/30"
                  }`}
                  style={{
                    backgroundColor: isActive ? `${c.color}20` : "rgba(255,255,255,0.03)",
                    borderColor: isActive ? `${c.color}40` : "rgba(255,255,255,0.06)",
                    color: isActive ? c.color : "#6b6e8a",
                  }}
                  title={c.description}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Condition Effect Summary Panel ─────────────────────────────
function ConditionEffectSummaryPanel({ conditions }: { conditions: string[] }) {
  const effects = computeConditionEffects(conditions);

  const hasAny = effects.hasDisadvantageOnAttacks || effects.hasAdvantageOnAttacks ||
    effects.hasDisadvantageOnSaves || effects.hasDisadvantageOnChecks ||
    effects.isIncapacitated || effects.speedMod !== 0 ||
    effects.autoFailsSaves.length > 0 || effects.autoFailsChecks.length > 0 ||
    effects.preventsActions || effects.preventsBonusActions ||
    effects.preventsReactions || effects.preventsMovement;

  if (!hasAny) return null;

  return (
    <div className="p-2 rounded-lg bg-obsidian-mid/60 border border-surface-700/30 animate-in slide-in-from-top-1 duration-150">
      <div className="flex flex-wrap gap-1">
        {/* Incapacitated — strongest effect first */}
        {effects.isIncapacitated && (
          <EffectBadge label="Incapacitated" style={EFFECT_STYLES.incapacitated} icon="⛓️" />
        )}

        {/* Action denial */}
        {effects.preventsActions && !effects.isIncapacitated && (
          <EffectBadge label="No Actions" style={EFFECT_STYLES.incapacitated} icon="🚫" />
        )}
        {effects.preventsBonusActions && !effects.isIncapacitated && (
          <EffectBadge label="No Bonus" style={EFFECT_STYLES.incapacitated} icon="🚫" />
        )}
        {effects.preventsReactions && (
          <EffectBadge label="No Reactions" style={EFFECT_STYLES.incapacitated} icon="🚫" />
        )}

        {/* Movement */}
        {effects.preventsMovement && (
          <EffectBadge label="No Movement" style={EFFECT_STYLES.incapacitated} icon="🛑" />
        )}

        {/* Advantage / Disadvantage */}
        {effects.hasAdvantageOnAttacks && (
          <EffectBadge label="⬆ Attacks vs You" style={EFFECT_STYLES.attacks_up} />
        )}
        {effects.hasDisadvantageOnAttacks && (
          <EffectBadge label="⬇ Your Attacks" style={EFFECT_STYLES.attacks_down} />
        )}
        {effects.hasDisadvantageOnSaves && (
          <EffectBadge label="⬇ Saves" style={EFFECT_STYLES.saves_down} />
        )}
        {effects.hasDisadvantageOnChecks && (
          <EffectBadge label="⬇ Checks" style={EFFECT_STYLES.checks_down} />
        )}

        {/* Speed */}
        {effects.speedMod < 0 && (
          <EffectBadge
            label={`Speed −${Math.abs(effects.speedMod) * 50}%`}
            style={EFFECT_STYLES.speed_down}
            icon="🐢"
          />
        )}

        {/* Auto-fail saves */}
        {effects.autoFailsSaves.length > 0 && (
          <EffectBadge
            label={`Auto-fail: ${effects.autoFailsSaves.map(s => s.slice(0, 3)).join("/")}`}
            style={EFFECT_STYLES.saves_down}
            icon="❌"
          />
        )}

        {/* Auto-fail checks */}
        {effects.autoFailsChecks.length > 0 && (
          <EffectBadge
            label={`Auto-fail: ${effects.autoFailsChecks.map(s => s.slice(0, 3)).join("/")}`}
            style={EFFECT_STYLES.checks_down}
            icon="❌"
          />
        )}
      </div>
    </div>
  );
}

// ── Small sub-component for each effect badge ──────────────────
function EffectBadge({
  label, style, icon,
}: {
  label: string;
  style: { bg: string; text: string; border: string };
  icon?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );
}

// ── Pure function: compute all mechanical effects from conditions ──
export function computeConditionEffects(conditions: string[]) {
  const ids = conditions.filter((c) => !!CONDITIONS[c as ConditionId]) as ConditionId[];
  const result = {
    speedMod: 0,
    hasDisadvantageOnAttacks: false,
    hasAdvantageOnAttacks: false,
    hasDisadvantageOnSaves: false,
    hasDisadvantageOnChecks: false,
    isIncapacitated: false,
    preventsActions: false,
    preventsBonusActions: false,
    preventsReactions: false,
    preventsMovement: false,
    autoFailsSaves: [] as string[],
    autoFailsChecks: [] as string[],
  };

  for (const id of ids) {
    const c = CONDITIONS[id];
    if (!c) continue;

    // Speed
    if (c.setsSpeed !== null) result.speedMod = Math.min(result.speedMod, 0);
    if (c.halvesSpeed) result.speedMod -= 1;
    if (c.preventsMovement) result.preventsMovement = true;

    // Actions
    if (c.preventsActions) result.preventsActions = true;
    if (c.preventsBonusActions) result.preventsBonusActions = true;
    if (c.preventsReactions) result.preventsReactions = true;

    // Checks
    if (c.autoFailsAbilityChecks) {
      result.autoFailsChecks = [...result.autoFailsChecks, ...c.autoFailsAbilityChecks];
    }

    // Auto-fail saves
    if (c.autoFailsSaves) {
      result.autoFailsSaves = [...result.autoFailsSaves, ...c.autoFailsSaves];
    }

    // Advantage/Disadvantage
    if (c.appliesDisadvantageTo.includes("attack_rolls")) result.hasDisadvantageOnAttacks = true;
    if (c.appliesAdvantageTo.includes("attack_rolls")) result.hasAdvantageOnAttacks = true;
    if (c.appliesDisadvantageTo.includes("saving_throws")) result.hasDisadvantageOnSaves = true;
    if (c.appliesDisadvantageTo.includes("ability_checks")) result.hasDisadvantageOnChecks = true;

    // Incapacitated = no actions + no bonus + no reactions
    if (c.preventsActions && c.preventsBonusActions && c.preventsReactions) {
      result.isIncapacitated = true;
    }
  }

  return result;
}

// ── Exported legacy ConditionEffectSummary (kept for API compat) ──
export function ConditionEffectSummary({ conditions }: { conditions: string[] }) {
  const effects = computeConditionEffects(conditions);

  const hasAny = effects.hasDisadvantageOnAttacks || effects.hasAdvantageOnAttacks ||
    effects.hasDisadvantageOnSaves || effects.hasDisadvantageOnChecks ||
    effects.isIncapacitated || effects.speedMod !== 0;

  if (!hasAny) return null;

  return (
    <div className="space-y-1 p-2 rounded-lg bg-obsidian-mid/40 border border-surface-700/20">
      <h4 className="text-[10px] uppercase tracking-widest text-gold-500/60 font-black">Mechanical Effects</h4>
      <div className="flex flex-wrap gap-1">
        {/* All tokens now use gold/amber/rose/emerald system — no purple */}
        {effects.isIncapacitated && (
          <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-[9px] text-red-400 border border-red-500/20">Incapacitated</span>
        )}
        {effects.hasDisadvantageOnAttacks && (
          <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-[9px] text-rose-400 border border-rose-500/20">⬇ Attacks</span>
        )}
        {effects.hasAdvantageOnAttacks && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-[9px] text-emerald-400 border border-emerald-500/20">⬆ Attacks</span>
        )}
        {effects.hasDisadvantageOnSaves && (
          <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-[9px] text-rose-400 border border-rose-500/20">⬇ Saves</span>
        )}
        {effects.hasDisadvantageOnChecks && (
          <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-[9px] text-rose-400 border border-rose-500/20">⬇ Checks</span>
        )}
        {effects.speedMod < 0 && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] text-amber-400 border border-amber-500/15">
            Speed −{Math.abs(effects.speedMod) * 50}%
          </span>
        )}
        {effects.preventsActions && !effects.isIncapacitated && (
          <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-[9px] text-red-400 border border-red-500/20">No Actions</span>
        )}
        {effects.preventsMovement && (
          <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-[9px] text-red-400 border border-red-500/20">No Movement</span>
        )}
      </div>
    </div>
  );
}
