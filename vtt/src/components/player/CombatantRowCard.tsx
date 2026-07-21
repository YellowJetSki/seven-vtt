/**
 * STᚱ VTT — Combatant Row Card (Overrrides-Grade Premium)
 *
 * Cycle 41: Reusable combatant row extracted from PlayerLiveEncounterView.
 * Shows: initiative, type icon, name, status effects, compact HP bar with fraction,
 * current turn indicator with gold pulse, dead/defeated opacity.
 *
 * All 5.5e HP tiers: Healthy (emerald), Scratched (emerald-400),
 * Bloodied (amber), Critical (red), Down (rose).
 *
 * Campaign: Arkla — Wendy Swiftfoot, Kehrfuffle Ironheart
 */

import type { Combatant } from "@/types/combat";

// ── 5-tier HP status ──
export function getHpTier(current: number, max: number): { label: string; color: string; bar: string } {
  if (current <= 0 || max <= 0) return { label: "Down", color: "text-rose-400", bar: "bg-rose-500/40" };
  const r = current / max;
  if (r <= 0.25) return { label: "Critical", color: "text-red-400", bar: "bg-red-500" };
  if (r <= 0.5) return { label: "Bloodied", color: "text-amber-400", bar: "bg-amber-500" };
  if (r <= 0.75) return { label: "Scratched", color: "text-emerald-400", bar: "bg-emerald-400" };
  return { label: "Healthy", color: "text-emerald-400", bar: "bg-emerald-500" };
}

interface CombatantRowCardProps {
  /** The combatant data */
  combatant: Combatant;
  /** Whether this combatant is the current turn */
  isCurrent: boolean;
  /** Whether this combatant is the current player's character */
  isPlayer: boolean;
  /** Whether it's the player's turn */
  isPlayerTurn: boolean;
  /** Optional callback when clicked */
  onClick?: () => void;
}

export default function CombatantRowCard({
  combatant,
  isCurrent,
  isPlayer,
  isPlayerTurn,
  onClick,
}: CombatantRowCardProps) {
  const hpRatio = combatant.hitPoints.max > 0
    ? combatant.hitPoints.current / combatant.hitPoints.max
    : 0;
  const tier = getHpTier(combatant.hitPoints.current, combatant.hitPoints.max);
  const isDead = combatant.hitPoints.current <= 0;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" && onClick) onClick(); }}
      className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
        isCurrent
          ? "bg-gold-500/10 border border-gold-500/20 shadow-[0_0_8px_rgba(234,179,8,0.04)]"
          : isDead
          ? "opacity-50"
          : "hover:bg-white/[0.02] cursor-pointer"
      } ${isCurrent && isPlayerTurn ? "ring-1 ring-gold-500/30" : ""}`}
    >
      {/* Current turn indicator bar */}
      {isCurrent && (
        <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r-full bg-gold-500" />
      )}

      {/* Initiative badge */}
      <span className="w-6 text-[10px] font-mono tabular-nums text-surface-400 text-right shrink-0">
        {combatant.initiative}
      </span>

      {/* Creature type icon */}
      <span className="text-[10px] shrink-0">
        {combatant.type === "player" ? "🛡" : combatant.type === "ally" ? "🧙" : "👹"}
      </span>

      {/* Name and type */}
      <span
        className={`flex-1 text-[12px] truncate ${
          isPlayer
            ? "text-gold-300 font-bold"
            : isCurrent
            ? "text-gold-400 font-semibold"
            : "text-surface-300"
        }`}
      >
        {isPlayer && <span className="text-gold-400">✦ </span>}
        {combatant.name}
      </span>

      {/* Status effects count badge */}
      {combatant.statusEffects && combatant.statusEffects.length > 0 && (
        <span className="text-[9px] text-surface-500 shrink-0">
          +{combatant.statusEffects.length}
        </span>
      )}

      {/* Status condition dots */}
      {combatant.statusEffects && combatant.statusEffects.length > 0 && (
        <div className="flex items-center gap-0.5 shrink-0">
          {combatant.statusEffects.slice(0, 3).map((se, i) => {
            const effectName = typeof se === "string" ? se : se.effect || "status";
            const colorMap: Record<string, string> = {
              poisoned: "bg-emerald-500",
                  paralyzed: "bg-amber-500",
                  prone: "bg-sky-500",
                  restrained: "bg-amber-500",
                  stunned: "bg-pink-500",
                  unconscious: "bg-red-500",
                  blinded: "bg-slate-500",
                  frightened: "bg-violet-500",
                  concentration: "bg-violet-500",
            };
            return (
              <span
                key={i}
                className={`w-1 h-1 rounded-full ${colorMap[effectName.toLowerCase()] || "bg-surface-500"}`}
                title={effectName}
              />
            );
          })}
          {combatant.statusEffects.length > 3 && (
            <span className="text-[6px] text-surface-600">+{combatant.statusEffects.length - 3}</span>
          )}
        </div>
      )}

      {/* Compact HP bar with fraction */}
      <div className="w-20 shrink-0">
        <div className="h-1.5 bg-surface-800/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${tier.bar}`}
            style={{ width: `${Math.max(0, Math.min(100, hpRatio * 100))}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className={`text-[8px] font-mono tabular-nums ${tier.color}`}>
            {combatant.hitPoints.current}
          </span>
          <span className="text-[8px] font-mono tabular-nums text-surface-600">
            {combatant.hitPoints.max}
          </span>
        </div>
      </div>

      {/* Current turn dot */}
      {isCurrent && (
        <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.5)] shrink-0 animate-pulse" />
      )}
    </div>
  );
}
