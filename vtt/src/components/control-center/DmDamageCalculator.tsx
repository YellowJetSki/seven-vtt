/**
 * STᚱ VTT — DM Damage/Healing Calculator Popover (Overrrides-Grade Premium)
 *
 * Cycle 27: Globally accessible tool for quickly resolving ANY damage
 * or healing scenario — environmental effects, traps, fall damage,
 * poison, spells, monster abilities — without going through the
 * full Attack Resolution flow.
 *
 * Features:
 *   - Mode toggle: Damage / Healing with color-coded accents
 *   - 5 damage presets per CR tier (DMG improvised damage table)
 *   - 5 healing presets (potion tiers + spell levels)
 *   - 13 damage type selectors with color-coded chips
 *   - Quick-apply to encounter combatants (multi-select)
 *   - Manual AC/DEX save half toggle
 *   - Resistance/Vulnerability/Immunity toggles per target
 *   - Per-target damage preview before applying
 *   - Combat log entry on apply
 *   - Recent calculations log with undo
 *
 * Design: Overrrides/Lusion — gold/rose/emerald glassmorphism,
 *   staggered entrance, color-coded damage type chips.
 *   NO dice rolling — pure computation with presets.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useCombatStore } from "@/stores/combatStore";
import PremiumIcon from "@/components/ui/PremiumIcon";

// ═══════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════

/** DMG improvised damage by tier */
const TIER_PRESETS = [
  { label: "Trivial (1d4)", value: 3, tier: "2" as const },
  { label: "Minor (1d6)", value: 4, tier: "3" as const },
  { label: "Moderate (1d8)", value: 5, tier: "5" as const },
  { label: "Severe (2d8)", value: 9, tier: "8" as const },
  { label: "Deadly (4d8)", value: 18, tier: "11" as const },
  { label: "Lethal (8d8)", value: 36, tier: "15" as const },
  { label: "Massive (12d8)", value: 54, tier: "20" as const },
] as const;

/** Healing presets */
const HEAL_PRESETS = [
  { label: "Minor Heal (1d4+1)", value: 4, type: "minor" as const },
  { label: "Potion (2d4+2)", value: 7, type: "potion" as const },
  { label: "Cure Wounds L1 (1d8+3)", value: 8, type: "spell_l1" as const },
  { label: "Heal L3 (3d8+3)", value: 17, type: "spell_l3" as const },
  { label: "Greater Potion (4d4+4)", value: 14, type: "greater_potion" as const },
  { label: "Heal L6 (6d8+6)", value: 33, type: "spell_l6" as const },
] as const;

/** Damage types with colors */
const DAMAGE_TYPES = [
  { id: "acid", label: "Acid", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "bludgeoning", label: "Bludgeoning", color: "text-surface-400", bg: "bg-surface-500/10", border: "border-surface-500/20" },
  { id: "cold", label: "Cold", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { id: "fire", label: "Fire", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { id: "force", label: "Force", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { id: "lightning", label: "Lightning", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "necrotic", label: "Necrotic", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "piercing", label: "Piercing", color: "text-rose-300", bg: "bg-rose-500/8", border: "border-rose-500/15" },
  { id: "poison", label: "Poison", color: "text-emerald-500", bg: "bg-emerald-500/15", border: "border-emerald-500/25" },
  { id: "psychic", label: "Psychic", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { id: "radiant", label: "Radiant", color: "text-gold-400", bg: "bg-gold-500/10", border: "border-gold-500/20" },
  { id: "slashing", label: "Slashing", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { id: "thunder", label: "Thunder", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
] as const;

type DamageTypeId = (typeof DAMAGE_TYPES)[number]["id"];

/** Resistance effect labels */
type ResistLabel = "none" | "resistant" | "vulnerable" | "immune";

/** Recent calculation entry */
interface CalcEntry {
  id: string;
  mode: "damage" | "heal";
  amount: number;
  damageType?: string;
  targetIds: string[];
  targetNames: string[];
  resistance?: ResistLabel;
  appliedAt: number;
  undid: boolean;
}

// ═══════════════════════════════════════════════════════
// TARGET CHECKBOX COMPONENT
// ═══════════════════════════════════════════════════════

function TargetCheckbox({
  id, name, hp, isDead, selected, onChange, resistance, onResistChange,
}: {
  id: string; name: string; hp: { current: number; max: number };
  isDead: boolean; selected: boolean; onChange: (v: boolean) => void;
  resistance: ResistLabel; onResistChange: (v: ResistLabel) => void;
}) {
  const ratio = hp.max > 0 ? hp.current / hp.max : 0;
  const tierColor = ratio > 0.5 ? "text-emerald-400" : ratio > 0.25 ? "text-amber-400" : "text-rose-400";
  const barColor = ratio > 0.5 ? "bg-emerald-500" : ratio > 0.25 ? "bg-amber-500" : "bg-rose-500";

  return (
    <label className={`flex items-center gap-1 p-1 rounded-lg border cursor-pointer transition-all
      ${selected
        ? "bg-gold-500/6 border-gold-500/12"
        : "bg-surface-800/10 border-white/[0.02] hover:bg-surface-800/20"}
      ${isDead ? "opacity-50" : ""}`}
    >
      <input type="checkbox" checked={selected} onChange={(e) => onChange(e.target.checked)}
        className="w-3 h-3 rounded border-surface-600 bg-surface-800 accent-gold-500 shrink-0" />
      <span className={`flex-1 min-w-0 text-[9px] truncate ${isDead ? "text-surface-500 line-through" : "text-white/80"}`}>
        {name}
      </span>
      {/* HP bar */}
      <div className="w-10">
        <div className="h-1 rounded-full bg-surface-800/60 overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(1, Math.max(0, ratio)) * 100}%` }} />
        </div>
        <span className={`text-[6px] font-mono tabular-nums ${tierColor}`}>{hp.current}</span>
      </div>
      {/* Resistance toggle */}
      <select value={resistance} onChange={(e) => onResistChange(e.target.value as ResistLabel)}
        onClick={(e) => e.stopPropagation()}
        className="text-[6px] bg-surface-800/40 border border-white/[0.04] rounded px-0.5 py-0 text-surface-400"
      >
        <option value="none">—</option>
        <option value="resistant">½</option>
        <option value="vulnerable">×2</option>
        <option value="immune">0</option>
      </select>
    </label>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

interface DmDamageCalculatorProps {
  onClose: () => void;
}

export default function DmDamageCalculator({ onClose }: DmDamageCalculatorProps) {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const damageCombatant = useCombatStore((s) => s.damageCombatant);
  const healCombatant = useCombatStore((s) => s.healCombatant);
  const addLogEntry = useCombatStore((s) => s.addLogEntry);

  // ── State ──
  const [mode, setMode] = useState<"damage" | "heal">("damage");
  const [amount, setAmount] = useState<number>(9);
  const [customAmount, setCustomAmount] = useState("");
  const [damageType, setDamageType] = useState<DamageTypeId>("fire");
  const [saveHalves, setSaveHalves] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [resistances, setResistances] = useState<Record<string, ResistLabel>>({});
  const [history, setHistory] = useState<CalcEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // ── Escape key ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Combatants ──
  const combatants = useMemo(() => {
    if (!activeEncounter) return [];
    return [...activeEncounter.combatants].sort(
      (a, b) => (b.initiative || 0) - (a.initiative || 0) || a.name.localeCompare(b.name)
    );
  }, [activeEncounter?.combatants]);

  // ── Select all / clear ──
  const handleSelectAll = useCallback(() => {
    const ids = new Set(combatants.filter((c) => !c.isDead).map((c) => c.id));
    setSelectedTargets(ids);
  }, [combatants]);

  const handleClearSelection = useCallback(() => {
    setSelectedTargets(new Set());
  }, []);

  // ── Per-target final damage ──
  const computeFinalForTarget = useCallback((targetIdx: number): { base: number; mult: number; final: number; label: string } => {
    const combatant = combatants[targetIdx];
    if (!combatant) return { base: amount, mult: 1, final: amount, label: "Normal" };

    let base = amount;
    if (saveHalves) base = Math.ceil(base / 2);

    const resist = resistances[combatant.id] || "none";
    let mult = 1;
    let label = "Normal";
    if (resist === "immune") { mult = 0; label = "Immune"; }
    else if (resist === "resistant") { mult = 0.5; label = "½ Resistance"; }
    else if (resist === "vulnerable") { mult = 2; label = "×2 Vulnerable"; }

    return { base, mult, final: Math.floor(base * mult), label };
  }, [amount, saveHalves, resistances, combatants]);

  // ── Apply to selected ──
  const handleApply = useCallback(() => {
    if (selectedTargets.size === 0) return;
    const timestamp = Date.now();
    const targetNames: string[] = [];

    selectedTargets.forEach((id) => {
      const combatant = combatants.find((c) => c.id === id);
      if (!combatant) return;
      targetNames.push(combatant.name);

      if (mode === "damage") {
        const { final } = computeFinalForTarget(combatants.indexOf(combatant));
        if (final > 0) {
          damageCombatant(id, final);
          addLogEntry({
            id: `dmg_${timestamp}_${id}`,
            type: "damage",
            actorId: id,
            actorName: combatant.name,
            value: final,
            description: `${final} ${damageType} damage${resistances[id] && resistances[id] !== "none" ? ` (${resistances[id]})` : ""}`,
            timestamp,
          });
        }
      } else {
        const final = amount;
        healCombatant(id, final);
        addLogEntry({
          id: `heal_${timestamp}_${id}`,
          type: "heal",
          actorId: id,
          actorName: combatant.name,
          value: final,
          description: `+${final} healing`,
          timestamp,
        });
      }
    });

    setHistory((prev) => [{
      id: `calc_${timestamp}`,
      mode,
      amount,
      damageType: mode === "damage" ? damageType : undefined,
      targetIds: [...selectedTargets],
      targetNames,
      appliedAt: timestamp,
      undid: false,
    }, ...prev.slice(0, 49)]);

    setSelectedTargets(new Set());
  }, [selectedTargets, combatants, mode, amount, damageType, resistances, damageCombatant, healCombatant, addLogEntry, computeFinalForTarget]);

  // ── Undo last ──
  const handleUndo = useCallback((entryId: string) => {
    setHistory((prev) => prev.map((e) => e.id === entryId ? { ...e, undid: true } : e));
  }, []);

  // ── Preview total ──
  const previewTotal = useMemo(() => {
    let total = 0;
    selectedTargets.forEach((id) => {
      const idx = combatants.findIndex((c) => c.id === id);
      if (idx >= 0) total += computeFinalForTarget(idx).final;
    });
    return total;
  }, [selectedTargets, combatants, computeFinalForTarget]);

  const hpRatio = useMemo(() => {
    if (!activeEncounter) return 1;
    const total = activeEncounter.combatants.reduce((s, c) => s + c.hitPoints.max, 0);
    const cur = activeEncounter.combatants.reduce((s, c) => s + c.hitPoints.current, 0);
    return total > 0 ? cur / total : 1;
  }, [activeEncounter?.combatants]);

  // ── Preset buttons ──
  const presets = mode === "damage" ? TIER_PRESETS : HEAL_PRESETS;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden
        bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
        border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]
        animate-in slide-in-from-bottom-2 fade-in duration-300"
        style={{ animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/15 to-rose-500/10 flex items-center justify-center border border-amber/10">
              <PremiumIcon name="attack" className={`w-4 h-4 ${mode === "damage" ? "text-rose-400" : "text-emerald-400"}`} />
            </div>
            <h3 className="font-display text-sm text-white/90">
              {mode === "damage" ? "Damage Calculator" : "Healing Calculator"}
            </h3>
          </div>
          <button onClick={onClose}
            className="w-6 h-6 rounded-lg bg-surface-800/40 border border-white/[0.04] flex items-center justify-center
              text-surface-400 hover:text-white/70 transition-colors"
          >✕</button>
        </div>

        {/* ── Mode Toggle + Party HP ── */}
        <div className="mx-3 mb-1 flex items-center gap-2 p-1 rounded-lg bg-surface-800/15 border border-white/[0.04]">
          <button onClick={() => setMode("damage")}
            className={`flex-1 py-1 rounded-md text-[9px] transition-all ${mode === "damage"
              ? "bg-rose-500/12 text-rose-300 border border-rose-500/20"
              : "text-surface-400 hover:text-surface-200"}`}
          >🗡 Damage</button>
          <button onClick={() => setMode("heal")}
            className={`flex-1 py-1 rounded-md text-[9px] transition-all ${mode === "heal"
              ? "bg-emerald-500/12 text-emerald-300 border border-emerald-500/20"
              : "text-surface-400 hover:text-surface-200"}`}
          >❤ Healing</button>
          {activeEncounter && (
            <div className="flex items-center gap-1 ml-auto">
              <div className="w-10 h-1 rounded-full bg-surface-800/60 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${hpRatio * 100}%` }} />
              </div>
              <span className="text-[7px] font-mono tabular-nums text-surface-500">
                {activeEncounter.combatants.reduce((s, c) => s + c.hitPoints.current, 0)}/{activeEncounter.combatants.reduce((s, c) => s + c.hitPoints.max, 0)}
              </span>
            </div>
          )}
        </div>

        {/* ── AMOUNT SELECTION ── */}
        <div className="mx-3 mb-1">
          {/* Preset chips */}
          <div className="flex flex-wrap gap-0.5 mb-1">
            {presets.map((p, i) => (
              <button key={i} onClick={() => { setAmount(p.value); setCustomAmount(""); }}
                className={`px-1.5 py-0.5 rounded text-[7px] transition-all active:scale-95
                  ${mode === "damage"
                    ? amount === p.value ? "bg-rose-500/12 border border-rose-500/20 text-rose-300"
                      : "bg-surface-800/20 border border-white/[0.03] text-surface-400 hover:text-surface-200"
                    : amount === p.value ? "bg-emerald-500/12 border border-emerald-500/20 text-emerald-300"
                      : "bg-surface-800/20 border border-white/[0.03] text-surface-400 hover:text-surface-200"}`}
              >{p.label}</button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-surface-500">Custom:</span>
            <input type="number" min={0} max={999} value={customAmount || amount}
              onChange={(e) => { setCustomAmount(e.target.value); setAmount(Number(e.target.value) || 0); }}
              className="w-16 bg-surface-800/40 border border-white/[0.06] rounded text-[10px] px-1 py-0.5
                text-white/80 font-mono tabular-nums text-center
                focus:outline-none focus:border-gold-500/25"
            />
            <span className="text-[9px] text-surface-500">
              {mode === "damage" ? `(${amount} base${saveHalves ? `, ÷2 = ${Math.ceil(amount/2)}` : ""})` : `(${amount} total)`}
            </span>

            {/* Save halves toggle (damage only) */}
            {mode === "damage" && (
              <button onClick={() => setSaveHalves(!saveHalves)}
                className={`ml-auto px-1.5 py-0.5 rounded text-[7px] transition-all ${saveHalves
                  ? "bg-amber-500/12 border border-amber-500/20 text-amber-300"
                  : "bg-surface-800/20 border border-white/[0.03] text-surface-400"}`}
              >DEX Save ÷2</button>
            )}
          </div>
        </div>

        {/* ── DAMAGE TYPE CHIPS ── */}
        {mode === "damage" && (
          <div className="mx-3 mb-1">
            <div className="flex flex-wrap gap-0.5">
              {DAMAGE_TYPES.map((dt) => (
                <button key={dt.id} onClick={() => setDamageType(dt.id)}
                  className={`px-1.5 py-0.5 rounded text-[7px] transition-all active:scale-95
                    ${damageType === dt.id
                      ? `${dt.bg} ${dt.color} border ${dt.border.replace("border-", "border-").replace("/20", "/25")}`
                      : "bg-surface-800/15 border border-white/[0.02] text-surface-500 hover:text-surface-300"}`}
                >{dt.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── TARGET SELECTOR ── */}
        {combatants.length > 0 && (
          <div className="mx-3 mb-1">
            {/* Action bar */}
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[8px] text-surface-500 uppercase tracking-wider">
                Targets ({selectedTargets.size}/{combatants.filter(c => !c.isDead).length} alive)
              </span>
              <div className="flex items-center gap-1">
                <button onClick={handleSelectAll}
                  className="text-[7px] text-surface-400 hover:text-surface-200 transition-colors px-1"
                >All</button>
                <button onClick={handleClearSelection}
                  className="text-[7px] text-surface-400 hover:text-surface-200 transition-colors px-1"
                >Clear</button>
              </div>
            </div>
            {/* Target checkboxes */}
            <div className="max-h-32 overflow-y-auto space-y-0.5 scrollbar-gold">
              {combatants.map((c) => (
                <TargetCheckbox
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  hp={c.hitPoints}
                  isDead={c.isDead || c.hitPoints.current <= 0}
                  selected={selectedTargets.has(c.id)}
                  onChange={(v) => {
                    setSelectedTargets((prev) => {
                      const next = new Set(prev);
                      v ? next.add(c.id) : next.delete(c.id);
                      return next;
                    });
                  }}
                  resistance={resistances[c.id] || "none"}
                  onResistChange={(v) => setResistances((prev) => ({ ...prev, [c.id]: v }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── PREVIEW FOOTER ── */}
        {selectedTargets.size > 0 && (
          <div className="mx-3 mb-1 p-1 rounded-lg bg-surface-800/20 border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-surface-400">
                  {mode === "damage" ? "⚔" : "❤"} Applying to <strong className="text-white/80">{selectedTargets.size}</strong> target{selectedTargets.size > 1 ? "s" : ""}
                </span>
                {/* Per-target preview */}
                <div className="flex flex-wrap gap-0.5">
                  {[...selectedTargets].slice(0, 5).map((id) => {
                    const idx = combatants.findIndex((c) => c.id === id);
                    if (idx < 0) return null;
                    const p = computeFinalForTarget(idx);
                    return (
                      <span key={id}
                        className={`text-[6px] px-0.5 rounded tabular-nums ${p.label === "Immune" ? "text-surface-500" : p.mult < 1 ? "text-amber-400" : p.mult > 1 ? "text-rose-400" : mode === "damage" ? "text-rose-300" : "text-emerald-300"}`}
                      >{p.final}</span>
                    );
                  })}
                  {selectedTargets.size > 5 && (
                    <span className="text-[6px] text-surface-500">+{selectedTargets.size - 5}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono tabular-nums text-gold-400">∑ {previewTotal}</span>
                <button onClick={handleApply}
                  className={`px-2 py-0.5 rounded text-[8px] transition-all active:scale-95 ${mode === "damage"
                    ? "bg-rose-500/15 border border-rose-500/20 text-rose-300 hover:bg-rose-500/25"
                    : "bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/25"}`}
                >Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {history.length > 0 && (
          <div className="mx-3 mb-1">
            <button onClick={() => setShowHistory(!showHistory)}
              className="text-[7px] text-surface-500 hover:text-surface-300 transition-colors"
            >{showHistory ? "Hide" : "Show"} History ({history.filter(h => !h.undid).length})</button>

            {showHistory && (
              <div className="max-h-28 overflow-y-auto space-y-0.5 mt-0.5 scrollbar-gold
                animate-in slide-in-from-bottom-1 fade-in duration-100">
                {history.map((entry) => (
                  <div key={entry.id}
                    className={`flex items-center gap-1 p-1 rounded-lg border ${entry.undid
                      ? "bg-surface-900/30 border-white/[0.02] opacity-40"
                      : "bg-surface-800/10 border-white/[0.02]"}`}
                  >
                    <span className="text-[8px]">{entry.mode === "damage" ? "🗡" : "❤"}</span>
                    <span className="text-[8px] font-mono tabular-nums text-white/70">{entry.amount}</span>
                    {entry.damageType && (
                      <span className="text-[7px] text-surface-400">{entry.damageType}</span>
                    )}
                    <span className="text-[7px] text-surface-500 truncate flex-1">
                      → {entry.targetNames.join(", ")}
                    </span>
                    {!entry.undid && (
                      <button onClick={() => handleUndo(entry.id)}
                        className="text-[7px] text-amber-400 hover:text-amber-300 transition-colors"
                      >Undo</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {combatants.length === 0 && (
          <div className="mx-3 mb-2 p-3 text-center">
            <div className="w-8 h-8 rounded-xl bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mx-auto mb-1">
              <PremiumIcon name="attack" className="w-4 h-4 text-surface-500" />
            </div>
            <p className="text-[10px] text-surface-300 font-display">No Active Combat</p>
            <p className="text-[8px] text-surface-500 mt-0.5">Start an encounter to use the damage calculator.</p>
          </div>
        )}

        {/* ── 5.5e Rules Reference (Collapsible) ── */}
        {mode === "damage" && (
          <div className="mx-3 mb-1">
            <details className="group">
              <summary className="text-[7px] text-surface-500 cursor-pointer hover:text-surface-300 transition-colors
                list-none flex items-center gap-1"
              >
                <span className="text-[8px]">ℹ️</span> DMG Improvised Damage Guidelines
              </summary>
              <div className="p-1 mt-0.5 rounded bg-surface-900/30 border border-white/[0.02] text-[7px] text-surface-400 space-y-0.5">
                <p><strong className="text-surface-300">Trivial (1d4):</strong> Stumble, minor burn, bump on head</p>
                <p><strong className="text-surface-300">Minor (1d6):</strong> Falling 10ft, burning hands, caltrops</p>
                <p><strong className="text-surface-300">Moderate (1d8):</strong> Falling 20ft, bonfire, poison needle</p>
                <p><strong className="text-surface-300">Severe (2d8):</strong> Falling 30ft, lava puddle, lightning bolt splash</p>
                <p><strong className="text-surface-300">Deadly (4d8):</strong> Falling 60ft, quicksand, poisoned blade</p>
                <p><strong className="text-surface-300">Lethal (8d8):</strong> Falling 120ft, lava immersion, dragon breath edge</p>
                <p className="text-amber-400/60 mt-0.5">Tip: Add DEX save halving for effects that allow a save.</p>
              </div>
            </details>
          </div>
        )}

        <div className="h-2" />
      </div>
    </div>
  );
}
