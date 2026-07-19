/**
 * STᚱ VTT — Spellcasting Manager Component
 *
 * DM-facing unified spellcasting overview showing all caster
 * characters at a glance: slot levels, remaining spells,
 * concentration tracking, and quick-cast buttons.
 *
 * Features:
 *   - All caster characters in a horizontal scrollable grid
 *   - Per-caster: class/level, DC, ATK, slot gauges per level
 *   - Concentration tracking with active spell name
 *   - Quick-cast (decrement slot) and quick-restore
 *   - Spell Point toggle (DMG variant) per caster
 */

import { useState, useMemo, useCallback } from "react";
import type { PlayerCharacter } from "@/types/character";
import type { SpellLevel, SpellSlotsFull } from "@/types";
import { computeAllDerivations } from "@/lib/mechanics/character-derivations";
import { getSlotSummary } from "@/lib/mechanics/spell-slot-engine";
import {
  slotsToSpellPoints,
  spendSpellPoints,
  restoreSpellPoints,
  getAvailableSpellLevelsFromPoints,
  type SpellPointState,
} from "@/lib/mechanics/spell-point-engine";
import { useCampaignStore } from "@/stores/campaignStore";

interface SpellcastingManagerProps {
  characters: PlayerCharacter[];
  /** If true, shows spell points toggle per caster */
  showSpellPointsToggle?: boolean;
}

// ── Caster Card ──────────────────────────────────────────────

function CasterSpellCard({
  character,
  onCast,
  onRestore,
}: {
  character: PlayerCharacter;
  onCast: (id: string, level: SpellLevel) => void;
  onRestore: (id: string, level?: SpellLevel) => void;
}) {
  const derived = useMemo(() => computeAllDerivations(character), [character]);
  const [usePoints, setUsePoints] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const spellcasting = derived.spellcasting;
  if (!spellcasting.isCaster || !spellcasting.spellSlots) return null;

  const slots = spellcasting.spellSlots;
  const slotSummary = useMemo(() => getSlotSummary(slots), [slots]);

  const pointState = useMemo(
    () => slotsToSpellPoints(slots, character.level),
    [slots, character.level]
  );

  const availableLevels = useMemo(
    () => getAvailableSpellLevelsFromPoints(pointState),
    [pointState]
  );

  const totalSlots = slotSummary.reduce((a, s) => a + s.max, 0);
  const usedSlots = slotSummary.reduce((a, s) => a + (s.max - s.current), 0);
  const usagePct = totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 0;

  const doFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1500);
  };

  const handleCast = useCallback(
    (level: SpellLevel) => {
      if (usePoints) {
        const result = spendSpellPoints(pointState, level);
        if (result.success) {
          // For points, we deduct a slot of equivalent level
          onCast(character.id, level);
          doFlash(`✨ Cast (Lv.${level}) — ${pointState.current - result.cost}/${pointState.max} SP`);
        } else {
          doFlash(result.error || "Cannot cast");
        }
      } else {
        onCast(character.id, level);
        doFlash(`✨ Cast (Lv.${level})`);
      }
    },
    [usePoints, pointState, character.id, onCast]
  );

  return (
    <div className="min-w-[260px] max-w-[300px] flex-shrink-0 bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 rounded-2xl border border-white/[0.06] p-3 space-y-2.5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gold-400 truncate">
              {character.name}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
              spellcasting.casterType === "full"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : spellcasting.casterType === "half"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
            }`}>
              {spellcasting.casterType === "full" ? "Full" : spellcasting.casterType === "half" ? "Half" : "Third"}
            </span>
          </div>
          <p className="text-[9px] text-surface-500 truncate mt-0.5">
            {character.class} {character.level} · {character.race}
          </p>
        </div>

        {/* ── Spell Points Toggle ── */}
        {usePoints && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
            <span className="text-[8px] text-cyan-400 font-bold">SP</span>
          </div>
        )}
      </div>

      {/* ── DC / ATK / Spell Casting Ability ── */}
      <div className="flex items-center gap-2">
        <div className="px-2 py-1 rounded-lg bg-gold-500/5 border border-gold/10">
          <span className="text-[9px] text-surface-500">DC</span>
          <span className="text-xs font-bold text-gold-400 ml-1">{spellcasting.spellSaveDC}</span>
        </div>
        <div className="px-2 py-1 rounded-lg bg-gold-500/5 border border-gold/10">
          <span className="text-[9px] text-surface-500">ATK</span>
          <span className="text-xs font-bold text-gold-400 ml-1">
            {spellcasting.spellAttackBonus >= 0 ? "+" : ""}{spellcasting.spellAttackBonus}
          </span>
        </div>
        <div className="text-[9px] text-surface-500 ml-auto">
          {spellcasting.spellcastingAbility}
        </div>
      </div>

      {/* ── Usage Bar ── */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-[8px]">
          <span className="text-surface-500">
            {usePoints ? `${pointState.current}/${pointState.max} SP` : `${usedSlots}/${totalSlots} slots used`}
          </span>
          <span className={usagePct > 75 ? "text-rose-400" : usagePct > 50 ? "text-amber-400" : "text-surface-400"}>
            {Math.round(usagePct)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-obsidian/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(usagePct, 100)}%`,
              background: usagePct > 75
                ? "linear-gradient(90deg, #f43f5e, #e11d48)"
                : usagePct > 50
                ? "linear-gradient(90deg, #f59e0b, #d97706)"
                : "linear-gradient(90deg, #34d399, #10b981)",
            }}
          />
        </div>
      </div>

      {/* ── Slot Gauges ── */}
      <div className="grid grid-cols-5 gap-1">
        {slotSummary.slice(0, 5).map((slot) => (
          <button
            key={slot.level}
            onClick={() => slot.current > 0 && handleCast(slot.level as SpellLevel)}
            disabled={slot.current <= 0}
            title={`Lv.${slot.level}: ${slot.current}/${slot.max}`}
            className={`relative p-1 rounded-lg text-center transition-all duration-150 active:scale-90 ${
              slot.current > 0
                ? "bg-gold-500/8 border border-gold/15 hover:bg-gold-500/12 cursor-pointer"
                : "bg-obsidian-mid/40 border border-surface-700/15 opacity-40 cursor-not-allowed"
            }`}
          >
            <span className="text-[7px] text-surface-500 block">{slot.level}</span>
            <span className={`text-[9px] font-bold block ${
              slot.current === 0 ? "text-rose-500" : "text-gold-400"
            }`}>
              {slot.current}
            </span>
          </button>
        ))}
      </div>

      {/* ── Level 6-9 (if available) ── */}
      {slotSummary.length > 5 && (
        <div className="grid grid-cols-4 gap-1">
          {slotSummary.slice(5).map((slot) => (
            <button
              key={slot.level}
              onClick={() => slot.current > 0 && handleCast(slot.level as SpellLevel)}
              disabled={slot.current <= 0}
              className={`relative p-1 rounded-lg text-center transition-all duration-150 active:scale-90 ${
                slot.current > 0
                  ? "bg-rose-500/8 border border-rose-500/20 hover:bg-rose-500/12 cursor-pointer"
                  : "bg-obsidian-mid/40 border border-surface-700/15 opacity-40 cursor-not-allowed"
              }`}
            >
              <span className="text-[7px] text-surface-500 block">{slot.level}</span>
              <span className={`text-[9px] font-bold block ${
                slot.current === 0 ? "text-rose-500" : "text-rose-400"
              }`}>
                {slot.current}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-1 pt-0.5 border-t border-white/[0.04]">
        <button
          onClick={() => onRestore(character.id)}
          className="flex-1 py-1 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 text-[8px] font-bold uppercase tracking-wider hover:bg-emerald-500/12 transition-all active:scale-95"
          title="Restore all spell slots"
        >
          ↺ Restore All
        </button>
        <button
          onClick={() => setUsePoints(!usePoints)}
          className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
            usePoints
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              : "bg-white/[0.03] text-surface-500 border border-surface-700/20 hover:text-surface-300"
          }`}
          title="Toggle Spell Points variant (DMG 288)"
        >
          {usePoints ? "SP" : "♢"}
        </button>
      </div>

      {/* ── Flash Message ── */}
      {flash && (
        <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-obsidian/80 backdrop-blur-sm border border-gold/20 text-[9px] text-gold-400 text-center animate-fade-in">
          {flash}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function SpellcastingManager({
  characters,
  showSpellPointsToggle = true,
}: SpellcastingManagerProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [activeTab, setActiveTab] = useState<"all" | "full" | "half" | "third">("all");

  // ── Filter casters ──
  const casterCharacters = useMemo(() => {
    return characters.filter((c) => {
      const derived = computeAllDerivations(c);
      return derived.spellcasting.isCaster;
    });
  }, [characters]);

  // ── Tab filter ──
  const filtered = useMemo(() => {
    if (activeTab === "all") return casterCharacters;
    return casterCharacters.filter((c) => {
      const derived = computeAllDerivations(c);
      return derived.spellcasting.casterType === activeTab;
    });
  }, [casterCharacters, activeTab]);

  // ── Cast / Restore ──
  const handleCast = useCallback(
    (charId: string, level: SpellLevel) => {
      const char = characters.find((c) => c.id === charId);
      if (!char) return;
      if (!char.spellSlots) return;

      const key = `level${level}` as keyof typeof char.spellSlots;
      const pool = char.spellSlots[key];
      if (!pool || pool.current <= 0) return;

      updateCharacter(charId, {
        spellSlots: {
          ...char.spellSlots,
          [key]: { ...pool, current: pool.current - 1 },
        },
      } as any);
    },
    [characters, updateCharacter]
  );

  const handleRestore = useCallback(
    (charId: string, level?: SpellLevel) => {
      const char = characters.find((c) => c.id === charId);
      if (!char || !char.spellSlots) return;

      if (level) {
        const key = `level${level}` as keyof typeof char.spellSlots;
        const pool = char.spellSlots[key];
        if (!pool) return;
        updateCharacter(charId, {
          spellSlots: {
            ...char.spellSlots,
            [key]: { ...pool, current: pool.max },
          },
        } as any);
      } else {
        // Restore all
        const restored = { ...char.spellSlots };
        for (let i = 1; i <= 9; i++) {
          const k = `level${i}` as keyof typeof restored;
          if (restored[k]) {
            restored[k] = { ...restored[k], current: restored[k].max };
          }
        }
        updateCharacter(charId, { spellSlots: restored } as any);
      }
    },
    [characters, updateCharacter]
  );

  // ── Empty State ──
  if (casterCharacters.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-b from-[#14151f]/80 to-[#0f1019]/90 border border-white/[0.04] p-8 text-center">
        <div className="text-3xl mb-3 opacity-60">🔮</div>
        <h3 className="text-sm font-bold text-gold-400/80 mb-1">No Spellcasters</h3>
        <p className="text-xs text-surface-500 max-w-xs mx-auto">
          Characters with spellcasting classes (clerics, wizards, paladins, rangers, etc.)
          will appear here with their slot tracking and spellcasting stats.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-gold-400">🔮 Spellcasting</h3>
          <span className="text-[9px] text-surface-500 bg-white/[0.03] px-1.5 py-0.5 rounded-lg border border-white/[0.04]">
            {casterCharacters.length} caster{casterCharacters.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Type Filter ── */}
        <div className="flex gap-1">
          {(["all", "full", "half", "third"] as const).map((tab) => {
            const count = tab === "all"
              ? casterCharacters.length
              : casterCharacters.filter((c) => {
                  const d = computeAllDerivations(c);
                  return d.spellcasting.casterType === tab;
                }).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                  activeTab === tab
                    ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                    : "text-surface-500 border border-transparent hover:text-surface-300 hover:border-surface-700/20"
                }`}
              >
                {tab === "all" ? "All" : tab === "full" ? "Full" : tab === "half" ? "Half" : "Third"}
                <span className="ml-1 opacity-50 text-[7px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Caster Cards ── */}
      {filtered.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-gold -mx-1 px-1">
          {filtered.map((character) => (
            <CasterSpellCard
              key={character.id}
              character={character}
              onCast={handleCast}
              onRestore={handleRestore}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-obsidian-mid/30 border border-surface-700/10 p-4 text-center">
          <p className="text-[10px] text-surface-500">No {activeTab} casters found</p>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center gap-3 text-[8px] text-surface-600 pt-1 border-t border-white/[0.03]">
        <span>🔮 <span className="text-surface-500">Spellcasting Manager</span></span>
        <span className="w-px h-3 bg-white/[0.04]" />
        <span>Click slot to <span className="text-gold-400">cast</span></span>
        <span className="w-px h-3 bg-white/[0.04]" />
        <span>↺ to restore</span>
        <span className="w-px h-3 bg-white/[0.04]" />
        <span>♢ to toggle <span className="text-cyan-400">Spell Points</span> (DMG 288)</span>
      </div>
    </div>
  );
}
