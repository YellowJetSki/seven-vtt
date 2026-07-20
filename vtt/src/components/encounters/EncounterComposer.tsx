/**
 * STᚱ VTT — Encounter Composer
 *
 * Unified encounter builder that sits alongside the BestiaryPanel.
 * DM can:
 *   - View all encounters in a compact list
 *   - Create new encounters
 *   - Select an encounter to manage its enemy groups
 *   - Add monsters from the bestiary to the selected encounter
 *   - Remove monsters from encounter groups
 *   - See live difficulty rating, XP, CR range
 *   - Launch encounter → navigates to Battle Maps
 *
 * Data flow:
 *   encounters[] ← entitySlice (Zustand)
 *   enemies[]    ← entitySlice (for resolving enemy IDs)
 *   characters[] ← characterSlice (for party CR calcs)
 *
 * This replaces the standalone EncounterBuilder modal with
 * an always-visible sidebar panel.
 */

import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import { analyzeEncounterDifficulty, getDifficultyLabel, getDifficultyColor } from "@/lib/mechanics/encounter-cr";
import { getXpForCr, parseCr } from "@/lib/mechanics/encounter-cr";
import type { Encounter, EnemyDoc } from "@/types";

interface EncounterComposerProps {
  /** Called when a monster is added so the bestiary can update */
  onEncounterChanged?: () => void;
}

const ENV_OPTIONS = [
  { value: "dungeon", label: "🏚 Dungeon" },
  { value: "forest", label: "🌲 Forest" },
  { value: "city", label: "🏛 City" },
  { value: "cave", label: "🕳 Cave" },
  { value: "swamp", label: "🌿 Swamp" },
  { value: "mountain", label: "⛰ Mountain" },
  { value: "desert", label: "🏜 Desert" },
  { value: "water", label: "🌊 Water" },
  { value: "planar", label: "🌀 Planar" },
  { value: "ruins", label: "🏗 Ruins" },
  { value: "castle", label: "🏰 Castle" },
  { value: "temple", label: "⛩ Temple" },
  { value: "wilderness", label: "🌄 Wilderness" },
  { value: "underdark", label: "🕸 Underdark" },
  { value: "custom", label: "✦ Custom" },
];

function generateId(): string {
  return `enc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export default function EncounterComposer({ onEncounterChanged }: EncounterComposerProps) {
  const navigate = useNavigate();
  const encounters = useCampaignStore((s) => s.encounters);
  const enemies = useCampaignStore((s) => s.enemies);
  const characters = useCampaignStore((s) => s.characters);
  const addEncounter = useCampaignStore((s) => s.addEncounter);
  const updateEncounter = useCampaignStore((s) => s.updateEncounter);
  const removeEncounter = useCampaignStore((s) => s.removeEncounter);

  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(
    encounters.length > 0 ? encounters[0].id : null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEnv, setNewEnv] = useState("dungeon");
  const [newDesc, setNewDesc] = useState("");

  // ── Derived ──
  const selectedEncounter = useMemo(
    () => encounters.find((e) => e.id === selectedEncounterId) ?? null,
    [encounters, selectedEncounterId]
  );

  const partySize = characters.length > 0 ? characters.length : 4;
  const avgLevel = characters.length > 0
    ? Math.round(characters.reduce((sum, c) => sum + c.level, 0) / characters.length)
    : 3;

  // ── Difficulty calculation for selected encounter ──
  const difficulty = useMemo(() => {
    if (!selectedEncounter) return null;
    const crs: number[] = [];
    selectedEncounter.enemyGroups.forEach((g) => {
      const doc = enemies.find((e) => e.id === g.enemyId);
      const cr = doc ? parseCr(doc.challengeRating) : 0;
      for (let i = 0; i < g.count; i++) crs.push(cr);
    });
    return analyzeEncounterDifficulty(crs, { size: partySize, level: avgLevel });
  }, [selectedEncounter, enemies, partySize, avgLevel]);

  // ── Add a monster to selected encounter ──
  const handleAddMonster = useCallback(
    (enemyId: string) => {
      if (!selectedEncounterId) return;
      const encounter = encounters.find((e) => e.id === selectedEncounterId);
      if (!encounter) return;

      const existingGroup = encounter.enemyGroups.find((g) => g.enemyId === enemyId);
      const newGroups = existingGroup
        ? encounter.enemyGroups.map((g) =>
            g.enemyId === enemyId ? { ...g, count: g.count + 1 } : g
          )
        : [...encounter.enemyGroups, { enemyId, count: 1 }];

      updateEncounter(selectedEncounterId, { enemyGroups: newGroups });
      onEncounterChanged?.();
    },
    [encounters, selectedEncounterId, updateEncounter, onEncounterChanged]
  );

  // ── Remove a monster from encounter ──
  const handleRemoveGroup = useCallback(
    (enemyId: string) => {
      if (!selectedEncounter || !selectedEncounterId) return;
      const newGroups = selectedEncounter.enemyGroups
        .map((g) => (g.enemyId === enemyId ? { ...g, count: g.count - 1 } : g))
        .filter((g) => g.count > 0);
      updateEncounter(selectedEncounterId, { enemyGroups: newGroups });
      onEncounterChanged?.();
    },
    [selectedEncounter, selectedEncounterId, updateEncounter, onEncounterChanged]
  );

  // ── Create new encounter ──
  const handleCreateNew = useCallback(() => {
    if (!newName.trim()) return;
    const enc: Encounter = {
      id: generateId(),
      name: newName.trim(),
      description: newDesc.trim(),
      environment: newEnv,
      difficulty: "easy",
      isActive: false,
      enemyGroups: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addEncounter(enc);
    setSelectedEncounterId(enc.id);
    setIsCreating(false);
    setNewName("");
    setNewDesc("");
    setNewEnv("dungeon");
    onEncounterChanged?.();
  }, [newName, newDesc, newEnv, addEncounter, onEncounterChanged]);

  // ── Launch encounter ──
  const handleLaunch = useCallback(() => {
    if (!selectedEncounterId || !selectedEncounter) return;
    updateEncounter(selectedEncounterId, { isActive: true });
    navigate("/campaign/maps");
  }, [selectedEncounterId, selectedEncounter, updateEncounter, navigate]);

  // ── Delete encounter ──
  const handleDelete = useCallback(
    (id: string) => {
      removeEncounter(id);
      if (selectedEncounterId === id) {
        setSelectedEncounterId(
          encounters.length > 1
            ? encounters.find((e) => e.id !== id)?.id ?? null
            : null
        );
      }
    },
    [removeEncounter, selectedEncounterId, encounters]
  );

  return (
    <div className="flex flex-col h-full">
      {/* ── Encounter Selector Header ── */}
      <div className="shrink-0 flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/60">Encounters</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-surface-500 tabular-nums">{encounters.length}</span>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="w-6 h-6 rounded-lg bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 text-[10px] flex items-center justify-center active:scale-90 transition-all"
            title="New Encounter"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Create Encounter Form ── */}
      {isCreating && (
        <div className="shrink-0 mb-3 p-3 rounded-xl bg-[#0c0d15] border border-gold/10 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Encounter name..."
            className="w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#07080d] border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold-500/25 placeholder:text-surface-700"
            onKeyDown={(e) => e.key === "Enter" && handleCreateNew()}
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 placeholder:text-surface-700"
          />
          <select
            value={newEnv}
            onChange={(e) => setNewEnv(e.target.value)}
            className="w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#07080d] border border-white/[0.06] text-surface-400 focus:outline-none focus:border-gold/25 appearance-none cursor-pointer"
          >
            {ENV_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNew}
              disabled={!newName.trim()}
              className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              Create Encounter
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-lg text-[9px] text-surface-500 hover:text-surface-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Encounter List ── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-gold space-y-1.5 pr-1">
        {encounters.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[10px] text-surface-500 mb-2">No encounters yet</p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-[9px] text-gold-400 underline underline-offset-2 hover:text-gold-300"
            >
              Create one
            </button>
          </div>
        ) : (
          encounters.map((enc) => {
            const isSelected = enc.id === selectedEncounterId;
            const totalEnemies = enc.enemyGroups.reduce((s, g) => s + g.count, 0);

            return (
              <div
                key={enc.id}
                onClick={() => setSelectedEncounterId(enc.id)}
                className={`relative rounded-xl p-2.5 cursor-pointer transition-all duration-150 group ${
                  isSelected
                    ? "bg-gold-500/8 border border-gold/20 shadow-[0_0_8px_rgba(234,179,8,0.05)]"
                    : "bg-[#0c0d15] border border-white/[0.04] hover:border-white/[0.10]"
                }`}
              >
                {/* Top gold edge for selected */}
                {isSelected && (
                  <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent" />
                )}

                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold truncate ${isSelected ? "text-gold-400" : "text-surface-200"}`}>
                        {enc.name}
                      </span>
                      {enc.isActive && (
                        <span className="text-[7px] px-1 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 font-semibold">●</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[9px] text-surface-500">
                      <span>{totalEnemies} enemies</span>
                      <span>·</span>
                      <span>{enc.environment}</span>
                      {enc.isActive && <span className="text-emerald-400">Active</span>}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(enc.id); }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-[8px] text-surface-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Delete encounter"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Selected Encounter Detail Panel ── */}
      {selectedEncounter && (
        <div className="shrink-0 mt-3 pt-3 border-t border-white/[0.04] space-y-3">
          {/* Difficulty + Stats Bar */}
          {difficulty && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${getDifficultyColor(difficulty.rating)}`}>
                {getDifficultyLabel(difficulty.rating)}
              </span>
              <span className="text-[9px] text-gold-400/60">{difficulty.totalXp} XP</span>
              <span className="text-[9px] text-surface-500">Adj: {difficulty.adjustedXp}</span>
              {difficulty.crRange.min > 0 && (
                <span className="text-[9px] text-rose-400">CR {difficulty.crRange.min}–{difficulty.crRange.max}</span>
              )}
              <span className="text-[9px] text-surface-500">· Party: {partySize}×Lv.{avgLevel}</span>
            </div>
          )}

          {/* Enemy group list */}
          <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-gold">
            {selectedEncounter.enemyGroups.length === 0 ? (
              <p className="text-[9px] text-surface-600 italic px-1 py-2 text-center">
                Add monsters from the Bestiary above
              </p>
            ) : (
              selectedEncounter.enemyGroups.map((group) => {
                const doc = enemies.find((e) => e.id === group.enemyId);
                const crDisplay = doc ? `CR ${doc.challengeRating}` : "";
                return (
                  <div
                    key={group.enemyId}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#0c0d15] border border-white/[0.04]"
                  >
                    <span className="flex-1 text-[10px] text-surface-300 truncate">
                      {doc?.name ?? "Unknown"} <span className="text-surface-600">{crDisplay}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddMonster(group.enemyId)}
                        className="w-5 h-5 rounded flex items-center justify-center text-[9px] text-surface-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-gold-400/80 tabular-nums min-w-[1.2em] text-center">
                        {group.count}
                      </span>
                      <button
                        onClick={() => handleRemoveGroup(group.enemyId)}
                        className="w-5 h-5 rounded flex items-center justify-center text-[9px] text-surface-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        −
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Launch Button */}
          <button
            onClick={handleLaunch}
            disabled={selectedEncounter.enemyGroups.length === 0}
            className="w-full py-2 rounded-xl text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:shadow-[0_0_12px_rgba(52,211,153,0.06)] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>▶</span>
            <span>Launch Encounter</span>
          </button>
        </div>
      )}
    </div>
  );
}
