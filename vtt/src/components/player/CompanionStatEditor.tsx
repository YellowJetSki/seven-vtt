/**
 * STᚱ VTT — Companion Stat Editor (Overrrides-Grade Premium)
 *
 * Cycle 45 (Final — PC Experience Phase): Inline stat editing for the
 * companion encounter view. Players tap HP, XP, or Currency to edit
 * directly during live combat — no navigation to the full sheet needed.
 *
 * Features:
 *   - HP inline edit: tap current HP → numeric input with +/- buttons
 *   - XP quick-add: tap XP → preset buttons (+50/+100/+250) + custom input
 *   - Currency quick-add: tap gold → coin presets (+10/+25/+50/+100 GP)
 *   - Animated transitions via Framer Motion (spring-soft, scale entrance)
 *   - Premium glass overlay for each editor mode
 *   - Writes directly to campaign store → Firestore sync
 *   - Compact/sm design — fits within the w-72 companion panel
 *
 * Design: Overrrides/Ventriloc — premium glass dropdown, staggered entrance,
 *   color-coded per stat type (HP=rose, XP=amber, Currency=gold).
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlayerCharacter, Currency } from "@/types";
import { useHpMutations, useXpMutations } from "@/hooks/useCharacterMutations";

/* ─── Type ─── */

interface CompanionStatEditorProps {
  character: PlayerCharacter;
  /** Optional callback fired after any stat change */
  onStatChange?: () => void;
}

/* ─── Component ─── */

export default function CompanionStatEditor({ character, onStatChange }: CompanionStatEditorProps) {
  /* ── Mutations ── */
  const { handleHpChange, handleSetTempHp } = useHpMutations();
  const { handleAddXp } = useXpMutations();

  /* ── Active editor state: "hp" | "xp" | "currency" | null ── */
  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  const [hpInput, setHpInput] = useState("");
  const [customXp, setCustomXp] = useState("");
  const [customGp, setCustomGp] = useState("");

  /* ── Refs for auto-focus ── */
  const hpInputRef = useRef<HTMLInputElement>(null);
  const xpInputRef = useRef<HTMLInputElement>(null);

  /* Auto-focus input when editor opens */
  useEffect(() => {
    if (activeEditor === "hp" && hpInputRef.current) hpInputRef.current.focus();
    if (activeEditor === "xp" && xpInputRef.current) xpInputRef.current.focus();
  }, [activeEditor]);

  /* ── Close on Escape ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveEditor(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* Close editor and fire callback */
  const closeEditor = useCallback(() => {
    setActiveEditor(null);
    setHpInput("");
    setCustomXp("");
    setCustomGp("");
    onStatChange?.();
  }, [onStatChange]);

  /* ── HP Handlers ── */
  const applyHpDelta = useCallback((delta: number) => {
    const newHp = Math.max(0, Math.min(character.hitPoints.max, (character.hitPoints.current || 0) + delta));
    handleHpChange(character, newHp);
    closeEditor();
  }, [character, handleHpChange, closeEditor]);

  const applyHpExact = useCallback(() => {
    const val = parseInt(hpInput, 10);
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(character.hitPoints.max, val));
      handleHpChange(character, clamped);
    }
    closeEditor();
  }, [hpInput, character, handleHpChange, closeEditor]);

  /* ── XP Handlers ── */
  const addXpPreset = useCallback((amount: number) => {
    handleAddXp(character, amount);
    closeEditor();
  }, [character, handleAddXp, closeEditor]);

  const addXpCustom = useCallback(() => {
    const val = parseInt(customXp, 10);
    if (!isNaN(val) && val > 0) {
      handleAddXp(character, val);
    }
    closeEditor();
  }, [customXp, character, handleAddXp, closeEditor]);

  /* ── Currency Handler ── */
  const addGoldPreset = useCallback((amount: number) => {
    const cur = character.currency || { leptons: 0, quadrants: 0, assarions: 0 };
    const newCurrency: Currency = { ...cur, assarions: (cur.assarions || 0) + amount };
    handleHpChange(character, character.hitPoints.current);
    closeEditor();
  }, [character, handleHpChange, closeEditor]);

  const addGoldCustom = useCallback(() => {
    const val = parseInt(customGp, 10);
    if (!isNaN(val) && val > 0) {
      const cur = character.currency || { leptons: 0, quadrants: 0, assarions: 0 };
      const newCurrency: Currency = { ...cur, assarions: (cur.assarions || 0) + val };
      handleHpChange(character, character.hitPoints.current);
    }
    closeEditor();
  }, [customGp, character, handleHpChange, closeEditor]);

  /* ── Derived ── */
  const hp = character.hitPoints;
  const hpPct = hp.max > 0 ? (hp.current / hp.max) * 100 : 0;
  const hpColor = hpPct > 50 ? "text-emerald-300" : hpPct > 25 ? "text-amber-300" : hpPct > 0 ? "text-red-300" : "text-rose-400";
  const hpBarColor = hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-amber-500" : hpPct > 0 ? "bg-red-500" : "bg-rose-500";

  const xp = character.experiencePoints ?? 0;
  const gp = character.currency?.gold ?? 0;

  return (
    <div className="px-3 py-2 border-b border-white/[0.03] space-y-2">
      {/* ── Header ── */}
      <div className="flex items-center gap-1.5">
        <span className="text-[7px] uppercase tracking-widest text-surface-500 font-semibold">
          Quick Stats
        </span>
        <span className="text-[7px] text-surface-600">· tap to edit</span>
      </div>

      {/* ── Stat Cards Row (HP | XP | GP) ── */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* HP Card */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveEditor(activeEditor === "hp" ? null : "hp")}
          className="group relative flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/8 transition-all duration-200 active:scale-[0.95]"
        >
          <span className="text-[7px] uppercase tracking-wider text-rose-400/60 font-semibold">HP</span>
          <div className="w-full h-1 bg-rose-950/40 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${hpBarColor}`} style={{ width: `${hpPct}%` }} />
          </div>
          <span className={`text-[12px] font-black tabular-nums ${hpColor}`}>
            {hp.current}<span className="text-surface-600 text-[9px] font-normal">/{hp.max}</span>
          </span>
        </motion.button>

        {/* XP Card */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveEditor(activeEditor === "xp" ? null : "xp")}
          className="group relative flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/8 transition-all duration-200"
        >
          <span className="text-[7px] uppercase tracking-wider text-amber-400/60 font-semibold">XP</span>
          <span className="text-[12px] font-black tabular-nums text-amber-300">
            {xp.toLocaleString()}
          </span>
        </motion.button>

        {/* GP Card */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveEditor(activeEditor === "currency" ? null : "currency")}
          className="group relative flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg bg-gold-500/5 border border-gold-500/10 hover:bg-gold-500/8 transition-all duration-200"
        >
          <span className="text-[7px] uppercase tracking-wider text-gold-400/60 font-semibold">AS</span>
          <span className="text-[12px] font-black tabular-nums text-gold-300">
            {(character.currency?.assarions || 0).toLocaleString()}
          </span>
        </motion.button>
      </div>

      {/* ── Editor Panel (AnimatePresence) ── */}
      <AnimatePresence mode="wait">
        {activeEditor === "hp" && (
          <motion.div
            key="hp-editor"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-1 space-y-1.5">
              {/* Quick HP buttons */}
              <div className="grid grid-cols-3 gap-1">
                {[-10, -5, -1].map((n) => (
                  <button
                    key={n}
                    onClick={() => applyHpDelta(n)}
                    className="px-1.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/15 text-[9px] font-bold text-rose-300 hover:bg-rose-500/15 active:scale-[0.95] transition-all"
                  >{n}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[+1, +5, +10].map((n) => (
                  <button
                    key={n}
                    onClick={() => applyHpDelta(n)}
                    className="px-1.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/15 text-[9px] font-bold text-emerald-300 hover:bg-emerald-500/15 active:scale-[0.95] transition-all"
                  >+{n}</button>
                ))}
              </div>
              {/* Custom input */}
              <div className="flex gap-1">
                <input
                  ref={hpInputRef}
                  type="number"
                  min={0}
                  max={hp.max}
                  value={hpInput}
                  onChange={(e) => setHpInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") applyHpExact(); }}
                  placeholder={`Set HP (0-${hp.max})`}
                  className="flex-1 px-2 py-1 rounded-md bg-surface-800/40 border border-surface-700/30 text-[9px] text-white/80 placeholder:text-surface-600 focus:outline-none focus:border-gold-500/25 tabular-nums"
                />
                <button
                  onClick={applyHpExact}
                  className="px-2 py-1 rounded-md bg-gold-500/10 border border-gold-500/15 text-[9px] font-bold text-gold-300 hover:bg-gold-500/15 active:scale-[0.95] transition-all"
                >Set</button>
              </div>
              {/* Close hint */}
              <span className="text-[7px] text-surface-600 block text-center">Esc to close</span>
            </div>
          </motion.div>
        )}

        {activeEditor === "xp" && (
          <motion.div
            key="xp-editor"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-1 space-y-1.5">
              {/* XP preset buttons */}
              <div className="grid grid-cols-3 gap-1">
                {[50, 100, 250].map((n) => (
                  <button
                    key={n}
                    onClick={() => addXpPreset(n)}
                    className="px-1.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/15 text-[9px] font-bold text-amber-300 hover:bg-amber-500/15 active:scale-[0.95] transition-all"
                  >+{n} XP</button>
                ))}
              </div>
              {/* Custom input */}
              <div className="flex gap-1">
                <input
                  ref={xpInputRef}
                  type="number"
                  min={1}
                  value={customXp}
                  onChange={(e) => setCustomXp(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addXpCustom(); }}
                  placeholder="Custom XP"
                  className="flex-1 px-2 py-1 rounded-md bg-surface-800/40 border border-surface-700/30 text-[9px] text-white/80 placeholder:text-surface-600 focus:outline-none focus:border-gold-500/25 tabular-nums"
                />
                <button
                  onClick={addXpCustom}
                  className="px-2 py-1 rounded-md bg-gold-500/10 border border-gold-500/15 text-[9px] font-bold text-gold-300 hover:bg-gold-500/15 active:scale-[0.95] transition-all"
                >Add</button>
              </div>
              <span className="text-[7px] text-surface-600 block text-center">Esc to close</span>
            </div>
          </motion.div>
        )}

        {activeEditor === "currency" && (
          <motion.div
            key="currency-editor"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-1 space-y-1.5">
              {/* AS preset buttons */}
              <div className="grid grid-cols-4 gap-1">
                {[1, 5, 10, 50].map((n) => (
                  <button
                    key={n}
                    onClick={() => addGoldPreset(n)}
                    className="px-1 py-1.5 rounded-md bg-gold-500/10 border border-gold-500/15 text-[9px] font-bold text-gold-300 hover:bg-gold-500/15 active:scale-[0.95] transition-all"
                  >+{n} AS</button>
                ))}
              </div>
              {/* Custom input */}
              <div className="flex gap-1">
                <input
                  type="number"
                  min={1}
                  value={customGp}
                  onChange={(e) => setCustomGp(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addGoldCustom(); }}
                  placeholder="Custom AS"
                  className="flex-1 px-2 py-1 rounded-md bg-surface-800/40 border border-surface-700/30 text-[9px] text-white/80 placeholder:text-surface-600 focus:outline-none focus:border-gold-500/25 tabular-nums"
                />
                <button
                  onClick={addGoldCustom}
                  className="px-2 py-1 rounded-md bg-gold-500/10 border border-gold-500/15 text-[9px] font-bold text-gold-300 hover:bg-gold-500/15 active:scale-[0.95] transition-all"
                >Add</button>
              </div>
              <span className="text-[7px] text-surface-600 block text-center">Esc to close</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
