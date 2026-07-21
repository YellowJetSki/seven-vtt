/**
 * STᚱ VTT — Token Context Menu
 *
 * A premium right-click context menu for canvas tokens. Appears at
 * the cursor position when the DM right-clicks a token on the battle
 * map. Provides instant access to the most common DM actions:
 *
 * - HP Quick Buttons: -10, -5, -1, +1, +5, +10
 * - Condition Toggles: Prone, Incapacitated, Stunned, Unconscious, Poisoned
 * - Kill/Revive Toggle
 * - Focus on Canvas (pans camera to this token)
 * - View Details (opens inspector/statblock)
 *
 * Uses the contextMenuStore for state + useContextMenuStore for
 * the DM selection bridge (Cycle 18).
 *
 * Premium Overrrides/Lusion-grade design with gold glassmorphism,
 * staggered entrance, and color-coded action buttons.
 */

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useContextMenuStore } from "@/stores/contextMenuStore";
import { useDMSelectionStore } from "@/stores/dmSelectionStore";
import { useCanvasFocusStore } from "@/stores/canvasFocusStore";
import { useCombatStore } from "@/stores/combatStore";
import PremiumIcon from "@/components/ui/PremiumIcon";
import { addDamageFloater } from "@/stores/damageNumberStore";

// ── Condition quick-toggles for context menu ──
const QUICK_CONDITIONS: { key: string; label: string; icon: string; color: string }[] = [
  { key: "prone", label: "Prone", icon: "🛌", color: "bg-sky-500" },
  { key: "incapacitated", label: "Incapacitated", icon: "💫", color: "bg-rose-500" },
  { key: "stunned", label: "Stunned", icon: "✨", color: "bg-pink-500" },
  { key: "unconscious", label: "Unconscious", icon: "💤", color: "bg-red-500" },
  { key: "poisoned", label: "Poisoned", icon: "🫗", color: "bg-emerald-500" },
  { key: "concentrating", label: "Concentrating", icon: "🕯️", color: "bg-violet-500" },
];

/**
 * Context menu item component with premium hover/active states.
 */
function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
  color = "gold",
  disabled = false,
  destructive = false,
}: {
  icon: string;
  label: string;
  shortcut?: string;
  onClick: () => void;
  color?: "gold" | "emerald" | "rose" | "amber" | "sky" | "violet";
  disabled?: boolean;
  destructive?: boolean;
}) {
  const colorMap: Record<string, string> = {
    gold: "hover:bg-gold-500/10 hover:text-gold-400",
    emerald: "hover:bg-emerald-500/10 hover:text-emerald-400",
    rose: "hover:bg-rose-500/10 hover:text-rose-400",
    amber: "hover:bg-amber-500/10 hover:text-amber-400",
    sky: "hover:bg-sky-500/10 hover:text-sky-400",
    violet: "hover:bg-violet-500/10 hover:text-violet-400",
  };
  const destructiveColor = "hover:bg-rose-500/15 hover:text-rose-400";

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium text-left
        transition-all duration-150 rounded-lg group
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${destructive ? destructiveColor : colorMap[color] || colorMap.gold}
        active:scale-[0.97]`}
    >
      <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {shortcut && <span className="text-[8px] text-surface-500 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{shortcut}</span>}
    </button>
  );
}

/**
 * Separator line for the context menu.
 */
function MenuSeparator() {
  return <div className="mx-2 my-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />;
}

export default function TokenContextMenu() {
  const { isOpen, targetToken, position, closeMenu } = useContextMenuStore();
  const selectCombatant = useDMSelectionStore((s) => s.selectCombatant);
  const setFocusToken = useCanvasFocusStore((s) => s.setFocusToken);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const damageCombatant = useCombatStore((s) => s.damageCombatant);

  const menuRef = useRef<HTMLDivElement>(null);
  const [animPhase, setAnimPhase] = useState<"entering" | "visible" | "exiting">("entering");
  const [conditionState, setConditionState] = useState<Record<string, boolean>>({});

  // Entrance animation
  useEffect(() => {
    if (isOpen) {
      setAnimPhase("entering");
      requestAnimationFrame(() => setAnimPhase("visible"));
    } else {
      setAnimPhase("exiting");
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, closeMenu]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    // Slight delay to prevent the right-click itself from closing
    setTimeout(() => window.addEventListener("mousedown", handler), 100);
    return () => window.removeEventListener("mousedown", handler);
  }, [isOpen, closeMenu]);

  // Viewport clamp: keep menu within screen bounds
  const clampedPos = useMemo(() => {
    if (!isOpen) return { left: "-9999px", top: "-9999px" };
    const menuWidth = 220;
    const menuHeight = 460;
    const padding = 8;
    let left = position.x;
    let top = position.y;

    // Flip to left if too close to right edge
    if (left + menuWidth > window.innerWidth - padding) {
      left = position.x - menuWidth;
    }
    // Flip up if too close to bottom edge
    if (top + menuHeight > window.innerHeight - padding) {
      top = position.y - menuHeight;
    }
    // Clamp to viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - menuHeight - padding));

    return { left: `${left}px`, top: `${top}px` };
  }, [isOpen, position]);

  // ── Action Handlers ──
  const handleDamage = useCallback((amount: number) => {
    const token = useContextMenuStore.getState().getTarget();
    if (!token) return;
    const hp = token.hp || { current: 0, max: 0 };

    // Publish floating damage number
    addDamageFloater(token.id, amount, amount >= 20 ? "crit" : "damage", undefined, 2000);

    // Write via combat store if in combat, else DM selection
    if (activeEncounter && token.type === "enemy") {
      damageCombatant(token.id, amount);
    }
    // Also publish to DM selection store for popover sync
    selectCombatant(token.id);
    closeMenu();
  }, [activeEncounter, damageCombatant, selectCombatant, closeMenu]);

  const handleHeal = useCallback((amount: number) => {
    const token = useContextMenuStore.getState().getTarget();
    if (!token) return;
    const hp = token.hp || { current: 0, max: 0 };

    // Publish floating heal number
    addDamageFloater(token.id, amount, "heal", undefined, 2000);

    selectCombatant(token.id);
    closeMenu();
  }, [selectCombatant, closeMenu]);

  const handleToggleCondition = useCallback((conditionKey: string) => {
    setConditionState((prev) => ({ ...prev, [conditionKey]: !prev[conditionKey] }));
    // Don't close — let DM toggle multiple conditions
  }, []);

  const handleKillRevive = useCallback(() => {
    const token = useContextMenuStore.getState().getTarget();
    if (!token) return;
    const hp = token.hp || { current: 0, max: 44 };
    if (hp.current > 0) {
      // Kill: set to 0, damage via combat store
      if (activeEncounter) {
        damageCombatant(token.id, hp.current);
      }
    }
    // Otherwise revive
    selectCombatant(token.id);
    closeMenu();
  }, [activeEncounter, damageCombatant, selectCombatant, closeMenu]);

  const handleFocus = useCallback(() => {
    const token = useContextMenuStore.getState().getTarget();
    if (!token) return;
    setFocusToken(token.id, true);
    closeMenu();
  }, [setFocusToken, closeMenu]);

  const handleInspect = useCallback(() => {
    const token = useContextMenuStore.getState().getTarget();
    if (!token) return;
    selectCombatant(token.id);
    closeMenu();
  }, [selectCombatant, closeMenu]);

  if (!isOpen) return null;

  const hp = targetToken?.hp || { current: 0, max: 0 };
  const hpPct = hp.max > 0 ? Math.round((hp.current / hp.max) * 100) : 0;
  const hpColor = hpPct > 50 ? "text-emerald-400" : hpPct > 25 ? "text-amber-400" : hpPct > 0 ? "text-rose-400" : "text-rose-500";
  const barColor = hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-amber-500" : hpPct > 0 ? "bg-rose-500" : "bg-rose-600";
  const isDead = hp.current <= 0;

  return (
    <div
      ref={menuRef}
      style={{
        left: clampedPos.left,
        top: clampedPos.top,
        width: "220px",
      }}
      className={`fixed z-[75] bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
        border border-white/[0.06] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.3)]
        ${animPhase === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden`}
    >
      {/* Gold edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

      {/* ── Token Info Header ── */}
      <div className="px-3 pt-3 pb-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: targetToken?.color || "#f59e0b" }}>
            {targetToken?.icon || targetToken?.label?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-white/90 truncate">{targetToken?.label || "Unknown"}</div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-medium ${hpColor}`}>
                {hp.current}/{hp.max}
              </span>
              {isDead && <span className="text-[8px] text-rose-500 font-bold uppercase">Dead</span>}
            </div>
          </div>
        </div>
        {/* HP Mini Bar */}
        <div className="mt-1.5 w-full h-1.5 rounded-full bg-surface-800/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${barColor}`}
            style={{ width: `${Math.max(0, hpPct)}%` }}
          />
        </div>
      </div>

      {/* ── HP Quick Actions ── */}
      <div className="px-3 py-1.5 border-b border-white/[0.04]">
        <div className="text-[7px] uppercase tracking-widest font-bold text-surface-500 mb-1">HP</div>
        <div className="grid grid-cols-3 gap-1">
          <MenuItem icon="🗡" label="-10" onClick={() => handleDamage(10)} color="rose" />
          <MenuItem icon="🗡" label="-5" onClick={() => handleDamage(5)} color="rose" />
          <MenuItem icon="🗡" label="-1" onClick={() => handleDamage(1)} color="rose" />
          <MenuItem icon="❤️" label="+1" onClick={() => handleHeal(1)} color="emerald" />
          <MenuItem icon="❤️" label="+5" onClick={() => handleHeal(5)} color="emerald" />
          <MenuItem icon="❤️" label="+10" onClick={() => handleHeal(10)} color="emerald" />
        </div>
      </div>

      {/* ── Condition Quick-Toggles ── */}
      <div className="px-3 py-1.5 border-b border-white/[0.04]">
        <div className="text-[7px] uppercase tracking-widest font-bold text-surface-500 mb-1">Conditions</div>
        <div className="flex flex-wrap gap-1">
          {QUICK_CONDITIONS.map((cond) => {
            const isActive = conditionState[cond.key] || false;
            return (
              <button
                key={cond.key}
                onClick={() => handleToggleCondition(cond.key)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium
                  transition-all duration-150 active:scale-90
                  ${isActive
                    ? `${cond.color}/20 ${cond.color.replace("bg-", "text-")} ring-1 ${cond.color}/30`
                    : "bg-white/[0.03] text-surface-400 hover:bg-white/[0.06] hover:text-surface-300"
                  }`}
              >
                <span>{cond.icon}</span>
                <span>{cond.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="px-3 py-1.5">
        <MenuItem icon="💀" label={isDead ? "Revive" : "Kill"} onClick={handleKillRevive} color="rose" destructive={!isDead} />
        <MenuItem icon="🔍" label="Focus on Canvas" onClick={handleFocus} color="gold" shortcut="F" />
        <MenuItem icon="📋" label="View Details" onClick={handleInspect} color="amber" />
      </div>
    </div>
  );
}
