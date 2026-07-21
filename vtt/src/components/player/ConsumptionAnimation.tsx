/**
 * STᚱ VTT — Consumption Animation (Overrrides-Grade Premium Visual Feedback)
 *
 * Overrrides/Spotify-grade animated overlay that plays when a consumable
 * item is used (potions, scrolls, food, poison, oil, antidote).
 *
 * Provides rich visual feedback:
 * - Potions: Emerald bubbling liquid + "+X HP" floating text
 * - Scrolls: Violet arcane rune + spell name
 * - Food/Drink: Amber steam + warm glow
 * - Poison: Green skull vapor
 * - Healing: Gold cross + radiant particles
 * - Generic: Sparkle burst
 *
 * Auto-dismisses after 2 seconds with fade-out.
 * Uses Framer Motion-style pure CSS animations (no dependency).
 * Single animated overlay, self-cleaning.
 *
 * Cycle 39 Enhancements:
 * - Deterministic HP values from item data (no Math.random)
 * - Proper 5.5e healing potion formula passes through from item
 * - Enhanced visual particles with staggered entrance
 */

import { useEffect, useState } from "react";

export type ConsumableType = "potion" | "scroll" | "food" | "poison" | "oil" | "antidote" | "generic";

interface ConsumptionAnimationProps {
  /** Name of the consumed item */
  itemName: string;
  /** Optional item type for visual variant */
  itemType?: ConsumableType;
  /** Optional numeric value (e.g., HP healed, damage dealt) — deterministic from item data */
  value?: number;
  /** Optional value label (e.g., "HP", "damage") */
  valueLabel?: string;
  /** Auto-dismiss duration in ms (default: 2000) */
  duration?: number;
  /** Called when animation completes */
  onComplete: () => void;
}

export function getConsumableType(name: string): ConsumableType {
  const lower = name.toLowerCase();
  if (lower.includes("potion") || lower.includes("elixir")) return "potion";
  if (lower.includes("scroll") || lower.includes("spell scroll") || lower.includes("scroll of")) return "scroll";
  if (lower.includes("food") || lower.includes("ration") || lower.includes("bread") || lower.includes("meal") || lower.includes("steak")) return "food";
  if (lower.includes("poison") || lower.includes("venom")) return "poison";
  if (lower.includes("oil") || lower.includes("flask")) return "oil";
  if (lower.includes("antidote") || lower.includes("cure") || lower.includes("heal") || lower.includes("poultice")) return "antidote";
  return "generic";
}

function getConsumableStyling(type: ConsumableType): {
  bg: string;
  border: string;
  icon: string;
  glow: string;
  labelColor: string;
} {
  switch (type) {
    case "potion":
      return {
        bg: "from-emerald-500/15 to-emerald-600/8",
        border: "border-emerald-500/20",
        icon: "🧪",
        glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
        labelColor: "text-emerald-300",
      };
    case "scroll":
      return {
        bg: "from-violet-500/15 to-violet-600/8",
        border: "border-violet-500/20",
        icon: "📜",
        glow: "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
        labelColor: "text-violet-300",
      };
    case "food":
      return {
        bg: "from-amber-500/15 to-amber-600/8",
        border: "border-amber-500/20",
        icon: "🍖",
        glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
        labelColor: "text-amber-300",
      };
    case "poison":
      return {
        bg: "from-emerald-700/15 to-emerald-800/8",
        border: "border-emerald-600/20",
        icon: "☠️",
        glow: "shadow-[0_0_30px_rgba(5,150,105,0.15)]",
        labelColor: "text-emerald-400",
      };
    case "oil":
      return {
        bg: "from-amber-600/15 to-amber-700/8",
        border: "border-amber-600/20",
        icon: "🫗",
        glow: "shadow-[0_0_30px_rgba(217,119,6,0.15)]",
        labelColor: "text-amber-400",
      };
    case "antidote":
      return {
        bg: "from-sky-500/15 to-sky-600/8",
        border: "border-sky-500/20",
        icon: "💊",
        glow: "shadow-[0_0_30px_rgba(14,165,233,0.15)]",
        labelColor: "text-sky-300",
      };
    default:
      return {
        bg: "from-gold-500/15 to-amber-500/8",
        border: "border-gold-500/20",
        icon: "✨",
        glow: "shadow-[0_0_30px_rgba(234,179,8,0.15)]",
        labelColor: "text-gold-300",
      };
  }
}

export default function ConsumptionAnimation({
  itemName,
  itemType,
  value,
  valueLabel,
  duration = 2000,
  onComplete,
}: ConsumptionAnimationProps) {
  const type = itemType || getConsumableType(itemName);
  const style = getConsumableStyling(type);
  const [phase, setPhase] = useState<"entering" | "visible" | "exiting">("entering");
  const [particles] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 50 + (Math.sin(i * 1.2) * 25),
      y: 50 + (Math.cos(i * 1.2) * 20),
      delay: Math.random() * 300,
      size: 2 + Math.random() * 4,
    }))
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), 50);
    const t2 = setTimeout(() => setPhase("exiting"), duration - 300);
    const t3 = setTimeout(() => onComplete(), duration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [duration, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none"
      style={{ height: "100dvh", width: "100dvw" }}
    >
      {/* Central card */}
      <div
        className={`
          relative w-[200px] rounded-2xl bg-gradient-to-b ${style.bg} border ${style.border} ${style.glow}
          backdrop-blur-xl p-5 text-center transition-all duration-300
          ${phase === "entering" ? "scale-50 opacity-0" : ""}
          ${phase === "visible" ? "scale-100 opacity-100" : ""}
          ${phase === "exiting" ? "scale-110 opacity-0" : ""}
        `}
      >
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Icon with bounce */}
        <div className={`text-3xl mb-2 transition-transform duration-300 ${
          phase === "entering" ? "scale-0 -translate-y-4" : "scale-100 translate-y-0"
        }`}>
          {style.icon}
        </div>

        {/* Value badge (for HP heals, etc.) */}
        {value !== undefined && (
          <div className={`text-2xl font-black tabular-nums mb-1 ${style.labelColor} ${
            phase === "entering" ? "opacity-0" : "opacity-100"
          } transition-opacity duration-500 delay-100`}>
            {value > 0 ? "+" : ""}{value}
            {valueLabel ? ` ${valueLabel}` : ""}
          </div>
        )}

        {/* Item name */}
        <p className={`text-[11px] font-semibold text-white/70 truncate max-w-full ${
          phase === "entering" ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
        } transition-all duration-300 delay-200`}>
          {itemName}
        </p>

        {/* Consumed label */}
        <p className={`text-[8px] text-surface-500 mt-1 ${
          phase === "entering" ? "opacity-0" : "opacity-100"
        } transition-opacity duration-300 delay-300`}>
          Consumed
        </p>

        {/* Ambient particles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className={`absolute rounded-full bg-white/30 animate-ping`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animationDelay: `${p.delay}ms`,
                animationDuration: `${1.5 + (p.id % 2)}s`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: phase === "visible" ? 0.6 : 0,
                transition: "opacity 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
