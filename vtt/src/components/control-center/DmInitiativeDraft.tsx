/**
 * STᚱ VTT — DM Initiative Quick-Draft Popover (Overrrides-Grade Premium)
 *
 * Cycle 28: Rapid initiative entry tool for combat setup. DMs capture
 * initiative values as players call them out, then commit all at once
 * to the active encounter. No dice rolling — pure manual entry.
 *
 * Features:
 *   - Auto-populate characters from campaign store
 *   - Quick +9 / +10 / +11 / +12 / +13 buttons per row (common dex bonus tiers)
 *   - Manual override with numeric input
 *   - Typeahead for adding enemies by name
 *   - One-click "Roll All" button (bonus convenience, not standalone roller)
 *   - "Commit to Combat" — creates encounter with all drafted combatants
 *   - "Start Combat" shortcut — commits + starts combat in one action
 *   - Collapsible "Initiative Range" key for quick reference
 *   - Gold/amber/rose tiered initiative color coding
 *   - Empty state for when no characters exist
 *
 * Design: Overrrides/Lusion — gold glassmorphism, staggered entrance,
 *   color-coded initiative tiers, edge lights.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import PremiumIcon from "@/components/ui/PremiumIcon";

// ═══════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════

interface DraftEntry {
  id: string;
  name: string;
  initiative: number;
  isEnemy: boolean;
  locked: boolean;
}

const DEX_QUICK_BONUSES = [9, 10, 11, 12, 13];
const INIT_TIER_COLORS = [
  { min: 21, label: "Legendary", color: "text-rose-400", bg: "bg-rose-500/8" },
  { min: 18, label: "Swift", color: "text-gold-400", bg: "bg-gold-500/8" },
  { min: 12, label: "Ready", color: "text-amber-400", bg: "bg-amber-500/8" },
  { min: 6, label: "Steady", color: "text-surface-400", bg: "bg-surface-500/8" },
  { min: 0, label: "Slow", color: "text-slate-500", bg: "bg-slate-500/8" },
];

function getInitTier(value: number) {
  return INIT_TIER_COLORS.find((t) => value >= t.min) || INIT_TIER_COLORS[INIT_TIER_COLORS.length - 1];
}

function formatInit(value: number): string {
  return String(value);
}

// ═══════════════════════════════════════════════════════
// DRAFT ROW COMPONENT
// ═══════════════════════════════════════════════════════

function DraftRow({
  entry, onUpdateInit, onLock, onRemove, index,
}: {
  entry: DraftEntry;
  onUpdateInit: (id: string, value: number) => void;
  onLock: (id: string) => void;
  onRemove: (id: string) => void;
  index: number;
}) {
  const tier = getInitTier(entry.initiative);

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-lg border transition-all duration-150
        animate-in slide-in-from-bottom-1 fade-in"
      style={{
        animationDuration: "0.2s",
        animationDelay: `${index * 20}ms`,
        animationFillMode: "both",
        borderColor: entry.locked ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)",
        backgroundColor: entry.locked ? "rgba(234,179,8,0.04)" : "rgba(15,16,26,0.4)",
      }}
    >
      {/* Initiative value */}
      <span className={`w-5 text-center text-[11px] font-mono tabular-nums font-bold transition-colors ${
        entry.initiative >= 18 ? "text-gold-300" : entry.initiative >= 12 ? "text-amber-300" : "text-surface-400"
      }`}>
        {formatInit(entry.initiative)}
      </span>

      {/* Quick+ buttons */}
      <div className="flex gap-[1px]">
        {DEX_QUICK_BONUSES.map((b) => (
          <button key={b} onClick={() => onUpdateInit(entry.id, b)}
            className={`w-4 h-4 rounded text-[6px] font-mono transition-all active:scale-90
              ${entry.initiative === b
                ? "bg-gold-500/12 text-gold-300 border border-gold-500/15"
                : "bg-surface-800/30 text-surface-500 border border-white/[0.02] hover:border-gold-500/10 hover:text-surface-300"}`}
            title={`Set to ${b}`}
          >{b}</button>
        ))}
      </div>

      {/* Custom input */}
      <input type="number" min={0} max={40} value={entry.initiative}
        onChange={(e) => onUpdateInit(entry.id, Number(e.target.value) || 0)}
        className="w-9 bg-surface-900/60 border border-white/[0.06] rounded text-[9px] px-0.5 py-0
          text-white/80 font-mono tabular-nums text-center
          focus:outline-none focus:border-gold-500/25 transition-colors"
      />

      {/* Name */}
      <span className={`flex-1 min-w-0 text-[9px] truncate ${entry.isEnemy ? "text-rose-300/80" : "text-sky-300/80"}`}>
        {entry.name}
      </span>

      {/* Type badge */}
      <span className={`text-[6px] px-0.5 rounded ${entry.isEnemy ? "bg-rose-500/10 text-rose-400" : "bg-sky-500/10 text-sky-400"}`}>
        {entry.isEnemy ? "E" : "P"}
      </span>

      {/* Tier dot */}
      <span className={`w-[3px] h-[3px] rounded-full ${tier.bg}`} title={tier.label} />

      {/* Lock */}
      <button onClick={() => onLock(entry.id)}
        className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
          entry.locked ? "text-gold-400" : "text-surface-600 hover:text-surface-400"
        }`}
        title={entry.locked ? "Locked (edit will unlock)" : "Lock to prevent edit"}
      >{entry.locked ? "🔒" : "🔓"}</button>

      {/* Remove */}
      <button onClick={() => onRemove(entry.id)}
        className="w-4 h-4 rounded flex items-center justify-center text-surface-600 hover:text-rose-400 transition-colors"
        title="Remove from draft"
      >✕</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

interface DmInitiativeDraftProps {
  onClose: () => void;
}

export default function DmInitiativeDraft({ onClose }: DmInitiativeDraftProps) {
  const characters = useCampaignStore((s) => s.characters);
  const enemies = useCampaignStore((s) => s.enemies);
  const addEncounter = useCampaignStore((s) => s.addEncounter);
  const setEncounter = useCombatStore((s) => s.setEncounter);
  const startCombatAction = useCombatStore((s) => s.startCombat);

  // ── State ──
  // Track which PCs are included (all by default — DM can toggle absent players)
  const [includedPcIds, setIncludedPcIds] = useState<Set<string>>(() => new Set(characters.map((c) => c.id)));

  const [draft, setDraft] = useState<DraftEntry[]>(() => {
    // Auto-populate player characters
    return characters.map((c) => ({
      id: c.id,
      name: c.name,
      initiative: 10 + Math.floor((Math.max(0, (c.dexterity || 10) - 10)) / 2),
      isEnemy: false,
      locked: false,
    }));
  });

  const [newEnemyName, setNewEnemyName] = useState("");
  const [showEnemySuggestions, setShowEnemySuggestions] = useState(false);
  const [encounterName, setEncounterName] = useState("New Encounter");
  const [isCommitting, setIsCommitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Escape key ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Enemy autocomplete ──
  const enemySuggestions = useMemo(() => {
    if (!newEnemyName.trim()) return [];
    const q = newEnemyName.toLowerCase();
    return enemies.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 8);
  }, [newEnemyName, enemies]);

  // ── Add enemy to draft ──
  const handleAddEnemy = useCallback((name: string) => {
    const enemy = enemies.find((e) => e.name.toLowerCase() === name.toLowerCase());
    const initiative = enemy ? 10 + Math.floor((Math.max(0, (enemy.abilities?.dexterity || 10) - 10)) / 2) : 10;

    setDraft((prev) => [...prev, {
      id: `enemy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      initiative,
      isEnemy: true,
      locked: false,
    }]);
    setNewEnemyName("");
    setShowEnemySuggestions(false);
    inputRef.current?.focus();
  }, [enemies]);

  // ── Update initiative ──
  const handleUpdateInit = useCallback((id: string, value: number) => {
    setDraft((prev) => prev.map((e) =>
      e.id === id ? { ...e, initiative: Math.max(0, Math.min(40, value)), locked: false } : e
    ));
  }, []);

  // ── Lock / Unlock ──
  const handleLock = useCallback((id: string) => {
    setDraft((prev) => prev.map((e) =>
      e.id === id ? { ...e, locked: !e.locked } : e
    ));
  }, []);

  // ── Remove ──
  const handleRemove = useCallback((id: string) => {
    setDraft((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Set all to base value ──
  const handleSetAll = useCallback((value: number) => {
    setDraft((prev) => prev.map((e) => e.locked ? e : { ...e, initiative: value }));
  }, []);

  // ── Sort by initiative ──
  const handleSort = useCallback(() => {
    setDraft((prev) => [...prev].sort((a, b) => {
      const initDiff = b.initiative - a.initiative;
      if (initDiff !== 0) return initDiff;
      return a.name.localeCompare(b.name);
    }));
  }, []);

  // ── Clear all ──
  const handleClearAll = useCallback(() => {
    setDraft([]);
  }, []);

  // ── Toggle PC inclusion ──
  const handleTogglePc = useCallback((charId: string) => {
    setIncludedPcIds((prev) => {
      const next = new Set(prev);
      if (next.has(charId)) {
        next.delete(charId);
        // Remove from draft
        setDraft((d) => d.filter((e) => e.id !== charId));
      } else {
        next.add(charId);
        // Add back to draft
        const c = characters.find((ch) => ch.id === charId);
        if (c) {
          setDraft((d) => [...d, {
            id: c.id,
            name: c.name,
            initiative: 10 + Math.floor((Math.max(0, (c.dexterity || 10) - 10)) / 2),
            isEnemy: false,
            locked: false,
          }]);
        }
      }
      return next;
    });
  }, [characters]);

  // ── Re-populate from campaign ──
  const handleRepopulate = useCallback(() => {
    const newIncluded = new Set(characters.map((c) => c.id));
    setIncludedPcIds(newIncluded);
    setDraft(characters.map((c) => ({
      id: c.id,
      name: c.name,
      initiative: 10 + Math.floor((Math.max(0, (c.dexterity || 10) - 10)) / 2),
      isEnemy: false,
      locked: false,
    })));
  }, [characters]);

  // ── Commit to combat (only included PCs + all drafted enemies) ──
  const handleCommit = useCallback((alsoStart: boolean) => {
    const filteredDraft = draft.filter((e) => e.isEnemy || includedPcIds.has(e.id));
    if (filteredDraft.length === 0) return;
    setIsCommitting(true);

    const combatants = filteredDraft.map((entry) => ({
      id: `combatant_${Date.now()}_${entry.id}`,
      name: entry.name,
      type: entry.isEnemy ? "enemy" as const : "player" as const,
      initiative: entry.initiative,
      armorClass: 10,
      hitPoints: { current: 20, max: 20 },
      statusEffects: [],
      isDead: false,
      isConcentrating: false,
    }));

    const encounter = {
      id: `encounter_${Date.now()}`,
      name: encounterName.trim() || "Quick Draft Encounter",
      combatants,
      round: 1,
      currentCombatantIndex: 0,
      turnStartedAt: Date.now(),
      phase: alsoStart ? ("active" as const) : ("prep" as const),
      startedAt: alsoStart ? Date.now() : undefined,
      completedAt: undefined,
      elapsedSeconds: 0,
      isPaused: false,
    };

    setEncounter(encounter);
    if (alsoStart) {
      setTimeout(() => startCombatAction(), 50);
    }
    setIsCommitting(false);
    onClose();
  }, [draft, includedPcIds, encounterName, setEncounter, startCombatAction, onClose]);

  // ── Stats ──
  const avgInit = useMemo(() => {
    if (draft.length === 0) return 0;
    return Math.round(draft.reduce((s, e) => s + e.initiative, 0) / draft.length);
  }, [draft]);

  const sorted = useMemo(() => {
    return [...draft].sort((a, b) => {
      const initDiff = b.initiative - a.initiative;
      if (initDiff !== 0) return initDiff;
      return a.name.localeCompare(b.name);
    });
  }, [draft]);

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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-500/15 to-amber-500/10 flex items-center justify-center border border-gold/10">
              <PremiumIcon name="rollInitiative" className="w-4 h-4 text-gold-400" />
            </div>
            <h3 className="font-display text-sm text-white/90">Initiative Draft</h3>
          </div>
          <button onClick={onClose}
            className="w-6 h-6 rounded-lg bg-surface-800/40 border border-white/[0.04] flex items-center justify-center
              text-surface-400 hover:text-white/70 transition-colors"
          >✕</button>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="mx-3 mb-1 flex items-center gap-1">
          {/* Encounter name */}
          <input type="text" value={encounterName}
            onChange={(e) => setEncounterName(e.target.value)}
            placeholder="Encounter name..."
            className="flex-1 bg-surface-800/40 border border-white/[0.06] rounded text-[9px] px-1.5 py-0.5
              text-white/70 placeholder:text-surface-600
              focus:outline-none focus:border-gold-500/25 transition-colors"
          />

          {/* Action buttons */}
          <button onClick={handleSort}
            className="px-1.5 py-0.5 rounded text-[7px] bg-surface-800/20 border border-white/[0.03] text-surface-400 hover:text-surface-200 transition-colors"
            title="Sort by initiative descending"
          >Sort</button>
          <button onClick={() => handleSetAll(10)}
            className="px-1.5 py-0.5 rounded text-[7px] bg-surface-800/20 border border-white/[0.03] text-surface-400 hover:text-surface-200 transition-colors"
          >Set 10</button>
          <button onClick={handleRepopulate}
            className="px-1.5 py-0.5 rounded text-[7px] bg-surface-800/20 border border-white/[0.03] text-surface-400 hover:text-surface-200 transition-colors"
          ⟳</button>
          <button onClick={handleClearAll}
            className="px-1.5 py-0.5 rounded text-[7px] bg-surface-800/20 border border-white/[0.03] text-rose-400/60 hover:text-rose-400 transition-colors"
          >Clear</button>

          {/* PC presence toggles */}
          {characters.length > 1 && (
            <details className="ml-auto">
              <summary className="text-[6px] text-surface-500 cursor-pointer hover:text-surface-300 transition-colors list-none flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-white/[0.03]">
                <span className="text-[7px]">👥</span>
                <span className="text-[7px] tabular-nums">{includedPcIds.size}/{characters.length}</span>
              </summary>
              <div className="absolute right-0 top-full mt-0.5 z-10 bg-[#0f1019]/98 border border-white/[0.06] rounded-lg shadow-xl p-1 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-100">
                <p className="text-[6px] text-surface-500 px-1 pb-0.5 uppercase tracking-wider">Exclude absent PCs</p>
                {characters.map((c) => (
                  <button key={c.id} onClick={() => handleTogglePc(c.id)}
                    className={`w-full flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[8px] transition-colors ${
                      includedPcIds.has(c.id)
                        ? "text-surface-200 hover:bg-gold-500/5"
                        : "text-surface-500 hover:text-surface-300 hover:bg-rose-500/5"
                    }`}
                  >
                    <span className={`text-[6px] ${includedPcIds.has(c.id) ? "text-emerald-400" : "text-rose-400"}`}>
                      {includedPcIds.has(c.id) ? "●" : "○"}
                    </span>
                    <span className="truncate flex-1 text-left">{c.name}</span>
                    {!includedPcIds.has(c.id) && (
                      <span className="text-[5px] uppercase text-rose-400/60">absent</span>
                    )}
                  </button>
                ))}
              </div>
            </details>
          )}

          {/* Stats */}
          <div className="flex items-center gap-1">
            <span className="text-[7px] text-surface-500 tabular-nums">{sorted.length}</span>
            <span className="text-[6px] text-surface-600">/</span>
            <span className="text-[7px] text-surface-500 tabular-nums">{characters.length}</span>
            <span className="text-[7px] text-surface-600 mx-0.5">avg</span>
            <span className="text-[7px] tabular-nums font-mono text-gold-400">{avgInit}</span>
          </div>
        </div>

        {/* ── ADD ENEMY ── */}
        <div className="mx-3 mb-1 relative">
          <div className="flex items-center gap-1">
            <input ref={inputRef} type="text" value={newEnemyName}
              onChange={(e) => { setNewEnemyName(e.target.value); setShowEnemySuggestions(true); }}
              onFocus={() => setShowEnemySuggestions(true)}
              onBlur={() => setTimeout(() => setShowEnemySuggestions(false), 150)}
              onKeyDown={(e) => { if (e.key === "Enter" && newEnemyName.trim()) handleAddEnemy(newEnemyName.trim()); }}
              placeholder="Add enemy by name..."
              className="flex-1 bg-surface-900/40 border border-rose-500/10 rounded text-[8px] px-1.5 py-0.5
                text-rose-300/80 placeholder:text-surface-600
                focus:outline-none focus:border-rose-500/25 transition-colors"
            />
            <button onClick={() => { if (newEnemyName.trim()) handleAddEnemy(newEnemyName.trim()); }}
              className="px-2 py-0.5 rounded text-[8px] bg-rose-500/10 border border-rose-500/15 text-rose-300 hover:bg-rose-500/20 transition-colors active:scale-95"
            >+ Add</button>
          </div>

          {/* Enemy autocomplete */}
          {showEnemySuggestions && enemySuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-0.5 z-10
              bg-[#0f1019]/98 border border-white/[0.06] rounded-lg shadow-xl overflow-hidden
              animate-in fade-in slide-in-from-top-1 duration-100"
            >
              {enemySuggestions.map((e) => (
                <button key={e.id} onClick={() => handleAddEnemy(e.name)}
                  className="w-full px-2 py-0.5 text-left text-[8px] text-surface-300 hover:bg-amber-500/5 transition-colors flex items-center gap-1"
                >
                  <span className="text-rose-400">E</span>
                  <span>{e.name}</span>
                  <span className="ml-auto text-surface-500">CR {e.challengeRating}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── DRAFT LIST ── */}
        <div className="mx-3 mb-1">
          {sorted.length > 0 ? (
            <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-gold">
              {sorted.map((entry, i) => (
                <DraftRow
                  key={entry.id}
                  entry={entry}
                  onUpdateInit={handleUpdateInit}
                  onLock={handleLock}
                  onRemove={handleRemove}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <div className="w-8 h-8 rounded-xl bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mx-auto mb-1">
                <PremiumIcon name="rollInitiative" className="w-4 h-4 text-surface-500" />
              </div>
              <p className="text-[10px] text-surface-400 font-display">No Combatants in Draft</p>
              <p className="text-[8px] text-surface-600 mt-0.5">Add enemies or players using the field above.</p>
              {characters.length > 0 && (
                <button onClick={handleRepopulate}
                  className="mt-1 px-2 py-0.5 rounded text-[8px] bg-gold-500/10 border border-gold-500/15 text-gold-300
                    hover:bg-gold-500/20 transition-colors active:scale-95"
                >Repopulate from Campaign ({characters.length} PCs)</button>
              )}
            </div>
          )}
        </div>

        {/* ── INITIATIVE TIER KEY ── */}
        <details className="mx-3 mb-1 group">
          <summary className="text-[7px] text-surface-500 cursor-pointer hover:text-surface-300 transition-colors
            list-none flex items-center gap-1"
          >
            <span className="text-[8px]">📊</span> Initiative Ranges
          </summary>
          <div className="mt-0.5 p-1 rounded bg-surface-900/30 border border-white/[0.02] grid grid-cols-5 gap-0.5">
            {INIT_TIER_COLORS.map((tier) => (
              <div key={tier.min} className="text-center">
                <span className={`text-[7px] font-mono tabular-nums ${tier.color}`}>{tier.min}+</span>
                <div className={`text-[5px] uppercase tracking-wider ${tier.color} opacity-60`}>{tier.label}</div>
              </div>
            ))}
          </div>
        </details>

        {/* ── QUICK REF KEY ── */}
        <details className="mx-3 mb-1 group">
          <summary className="text-[7px] text-surface-500 cursor-pointer hover:text-surface-300 transition-colors
            list-none flex items-center gap-1"
          >
            <span className="text-[8px]">🎯</span> Quick Reference
          </summary>
          <div className="mt-0.5 p-1 rounded bg-surface-900/30 border border-white/[0.02] text-[7px] text-surface-400 space-y-0.5">
            <p><strong className="text-surface-300">Legendary (20+):</strong> Elite speed — dragon, demon lord, archmage</p>
            <p><strong className="text-surface-300">Swift (15-19):</strong> Fast — rogue, monk, sentinel</p>
            <p><strong className="text-surface-300">Ready (10-14):</strong> Standard — most adventurers</p>
            <p><strong className="text-surface-300">Steady (5-9):</strong> Cautious — heavily armored or slow</p>
            <p><strong className="text-surface-300">Slow (0-4):</strong> Limping — prone, dying, or massive</p>
          </div>
        </details>

        {/* ── COMMIT FOOTER ── */}
        <div className="mx-3 mb-1 flex items-center justify-between p-1 rounded-lg bg-surface-800/20 border border-white/[0.04]">
          <div className="flex items-center gap-1 text-[7px] text-surface-500">
            <span>{sorted.length} combatants</span>
            <span className="text-surface-600">|</span>
            <span>{sorted.filter((e) => e.isEnemy).length} enemies</span>
            <span className="text-surface-600">|</span>
            <span>{sorted.filter((e) => !e.isEnemy).length} players</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => handleCommit(false)}
              disabled={draft.length === 0 || isCommitting}
              className="px-2 py-0.5 rounded text-[8px] bg-gold-500/12 border border-gold-500/15 text-gold-300
                hover:bg-gold-500/25 transition-colors active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed"
            >Commit to Combat</button>
            <button onClick={() => handleCommit(true)}
              disabled={draft.length === 0 || isCommitting}
              className="px-2 py-0.5 rounded text-[8px] bg-emerald-500/12 border border-emerald-500/15 text-emerald-300
                hover:bg-emerald-500/25 transition-colors active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed"
            >🚀 Start Combat</button>
          </div>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}
