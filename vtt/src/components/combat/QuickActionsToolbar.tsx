/* ── Combatant QuickActions Toolbar ─────────────────────────────
 * Floating context toolbar that appears when clicking a combatant
 * in the initiative tracker. Provides one-click access to common
 * combat actions: damage, heal, temp HP, status effect, note, and
 * quick conditions (prone, stunned, blinded, unconscious).
 *
 * ── UX ─────────────────────────────────────────────────────────
 * • Click on a combatant row → toolbar anchors near it
 * • Click outside or press Esc → closes
 * • Quick-damage buttons: 1, 5, 10, custom input
 * • Status effect toggles: prone, stunned, blinded, unconscious
 * ─────────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useCallback } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useCombatHistory } from "@/hooks/useCombatHistory";
import { Button } from "@/components/ui/Button";
import type { StatusEffect, Combatant } from "@/types/combat";

interface QuickActionsProps {
  combatantId: string;
  combatant: Combatant;
  onClose: () => void;
  anchorRect: DOMRect | null;
}

const QUICK_DAMAGE_AMOUNTS = [1, 3, 5, 10, 25];
const QUICK_HEAL_AMOUNTS = [1, 5, 10, 25, 50];

/** Status effects best suited for quick-toggle in combat */
const QUICK_STATUS_EFFECTS: { effect: StatusEffect; label: string; icon: string }[] = [
  { effect: "prone", label: "Prone", icon: "⬇" },
  { effect: "stunned", label: "Stunned", icon: "💫" },
  { effect: "blinded", label: "Blinded", icon: "🙈" },
  { effect: "unconscious", label: "Unconscious", icon: "😴" },
  { effect: "restrained", label: "Restrained", icon: "🔗" },
  { effect: "paralyzed", label: "Paralyzed", icon: "🧊" },
  { effect: "poisoned", label: "Poisoned", icon: "☠️" },
  { effect: "frightened", label: "Frightened", icon: "😨" },
];

export function QuickActionsToolbar({ combatantId, combatant, onClose, anchorRect }: QuickActionsProps) {
  const damageCombatant = useCombatStore((s) => s.damageCombatant);
  const healCombatant = useCombatStore((s) => s.healCombatant);
  const setTempHp = useCombatStore((s) => s.setTempHp);
  const toggleStatus = useCombatStore((s) => s.toggleStatus);
  const toggleDead = useCombatStore((s) => s.toggleDead);
  const addNote = useCombatStore((s) => s.addNote);
  const { addSnapshot } = useCombatHistory();

  const [customDamage, setCustomDamage] = useState("");
  const [customHeal, setCustomHeal] = useState("");
  const [showDamage, setShowDamage] = useState(false);
  const [showHeal, setShowHeal] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Auto-focus damage input when opened
  useEffect(() => {
    if (showDamage || showHeal) {
      inputRef.current?.focus();
    }
  }, [showDamage, showHeal]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleDamage = useCallback((amount: number) => {
    addSnapshot();
    damageCombatant(combatantId, amount, "QuickActions");
    onClose();
  }, [addSnapshot, damageCombatant, combatantId, onClose]);

  const handleHeal = useCallback((amount: number) => {
    addSnapshot();
    healCombatant(combatantId, amount, "QuickActions");
    onClose();
  }, [addSnapshot, healCombatant, combatantId, onClose]);

  const handleCustomDamage = useCallback(() => {
    const amt = parseInt(customDamage, 10);
    if (isNaN(amt) || amt <= 0) return;
    handleDamage(amt);
  }, [customDamage, handleDamage]);

  const handleCustomHeal = useCallback(() => {
    const amt = parseInt(customHeal, 10);
    if (isNaN(amt) || amt <= 0) return;
    handleHeal(amt);
  }, [customHeal, handleHeal]);

  const handleStatusToggle = useCallback((effect: StatusEffect) => {
    addSnapshot();
    toggleStatus(combatantId, effect);
    onClose();
  }, [addSnapshot, toggleStatus, combatantId, onClose]);

  const handleToggleDead = useCallback(() => {
    addSnapshot();
    toggleDead(combatantId);
    onClose();
  }, [addSnapshot, toggleDead, combatantId, onClose]);

  const handleAddNote = useCallback(() => {
    if (!noteInput.trim()) return;
    addNote(`[${combatant.name}] ${noteInput.trim()}`);
    setNoteInput("");
    onClose();
  }, [noteInput, addNote, combatant.name, onClose]);

  // Calculate toolbar position
  const style: React.CSSProperties = {};
  if (anchorRect) {
    const toolbarWidth = 280;
    let left = anchorRect.left + anchorRect.width / 2 - toolbarWidth / 2;
    if (left < 8) left = 8;
    if (left + toolbarWidth > window.innerWidth - 8) left = window.innerWidth - toolbarWidth - 8;
    style.left = left;
    style.top = Math.max(8, anchorRect.top - 220);
    style.position = "fixed";
  }

  const hasTempHp = combatant.hitPoints.temporary > 0;

  return (
    <div
      ref={toolbarRef}
      className="z-50 w-[280px] rounded-xl border border-surface-700 bg-surface-850 shadow-2xl"
      style={style}
    >
      {/* Header */}
      <div className="border-b border-surface-700 px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-surface-200 truncate max-w-[180px]">
          {combatant.name}
        </span>
        <span className="text-[10px] text-surface-500">
          HP {combatant.hitPoints.current}/{combatant.hitPoints.max}
          {hasTempHp && ` (+${combatant.hitPoints.temporary})`}
        </span>
      </div>

      <div className="p-2.5 space-y-2">
        {/* Quick Damage */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-warrior-400 mb-1.5">Damage</p>
          <div className="flex gap-1 flex-wrap">
            {QUICK_DAMAGE_AMOUNTS.map((amt) => (
              <button key={`dmg-${amt}`} onClick={() => handleDamage(amt)}
                className="rounded-md bg-warrior-500/15 px-2.5 py-1 text-xs font-medium text-warrior-400 hover:bg-warrior-500/30 transition-colors">
                {amt}
              </button>
            ))}
            <button onClick={() => { setShowDamage(true); setShowHeal(false); }}
              className="rounded-md border border-dashed border-surface-600 px-2.5 py-1 text-xs text-surface-400 hover:border-surface-500 hover:text-surface-200 transition-colors">
              {showDamage ? "✕" : "✎"}
            </button>
          </div>
          {showDamage && (
            <div className="flex gap-1 mt-1">
              <input ref={inputRef} type="number" value={customDamage} onChange={(e) => setCustomDamage(e.target.value)}
                className="w-20 rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-surface-200 focus:border-warrior-500 focus:outline-none"
                placeholder="DMG" min={1} onKeyDown={(e) => e.key === "Enter" && handleCustomDamage()} />
              <Button size="xs" variant="secondary" onClick={handleCustomDamage}>Apply</Button>
            </div>
          )}
        </div>

        {/* Quick Heal */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-divine-400 mb-1.5">Heal</p>
          <div className="flex gap-1 flex-wrap">
            {QUICK_HEAL_AMOUNTS.map((amt) => (
              <button key={`heal-${amt}`} onClick={() => handleHeal(amt)}
                className="rounded-md bg-divine-500/15 px-2.5 py-1 text-xs font-medium text-divine-400 hover:bg-divine-500/30 transition-colors">
                {amt}
              </button>
            ))}
            <button onClick={() => { setShowHeal(true); setShowDamage(false); }}
              className="rounded-md border border-dashed border-surface-600 px-2.5 py-1 text-xs text-surface-400 hover:border-surface-500 hover:text-surface-200 transition-colors">
              {showHeal ? "✕" : "✎"}
            </button>
          </div>
          {showHeal && (
            <div className="flex gap-1 mt-1">
              <input ref={inputRef} type="number" value={customHeal} onChange={(e) => setCustomHeal(e.target.value)}
                className="w-20 rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-surface-200 focus:border-divine-500 focus:outline-none"
                placeholder="HEAL" min={1} onKeyDown={(e) => e.key === "Enter" && handleCustomHeal()} />
              <Button size="xs" variant="secondary" onClick={handleCustomHeal}>Apply</Button>
            </div>
          )}
        </div>

        {/* Temp HP */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-surface-500 font-medium">Temp HP</span>
          <Button size="xs" variant="secondary" onClick={() => {
            const t = prompt("Temporary HP:", "0");
            if (t) {
              addSnapshot();
              setTempHp(combatantId, parseInt(t, 10) || 0);
              onClose();
            }
          }}>
            {hasTempHp ? `Set (${combatant.hitPoints.temporary})` : "+ Set"}
          </Button>
        </div>

        {/* Divider */}
        <div className="border-t border-surface-700" />

        {/* Status Effects */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 mb-1.5">Conditions</p>
          <div className="grid grid-cols-4 gap-1">
            {QUICK_STATUS_EFFECTS.map(({ effect, label, icon }) => {
              const isActive = combatant.statusEffects.some((s) => s.effect === effect);
              return (
                <button key={effect} onClick={() => handleStatusToggle(effect)}
                  className={`flex flex-col items-center rounded-md px-1.5 py-1 text-[10px] transition-all ${
                    isActive
                      ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                      : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200"
                  }`}>
                  <span className="text-xs">{icon}</span>
                  <span className="truncate max-w-full">{isActive ? "✓" : label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dead Toggle */}
        <Button size="xs" variant={combatant.isDead ? "primary" : "danger"} onClick={handleToggleDead} className="w-full">
          {combatant.isDead ? "🔄 Revive" : "💀 Kill"}
        </Button>

        {/* Quick Note */}
        <div className="flex gap-1">
          <input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Quick note..." className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-surface-200 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()} />
          <Button size="xs" variant="secondary" onClick={handleAddNote} disabled={!noteInput.trim()}>Add</Button>
        </div>
      </div>
    </div>
  );
}
