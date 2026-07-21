/**
 * STᚱ VTT — Encounter Composer (Premium v3.0 Glass Command Center)
 *
 * Unified encounter builder with premium Lusion-grade styling.
 * Features:
 *   - Premium glass gradient encounter cards with hover elevation
 *   - Gold-accented selected state with edge light
 *   - Difficulty badge with color-coded styling
 *   - Inline create/populate form with staggered entrance
 *   - Live XP, CR, and party difficulty calculations
 *   - Launch encounter button with emerald gradient glow
 *   - Gold gradient tab bar with pill indicator
 *   - 0 dependencies on glass-gold / corner-ornament / depth-ring
 *
 * Sits alongside BestiaryPanel inside UnifiedEncounterHub.
 */

import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import { analyzeEncounterDifficulty, getDifficultyLabel, getDifficultyColor } from "@/lib/mechanics/encounter-cr";
import { getXpForCr, parseCr } from "@/lib/mechanics/encounter-cr";
import EncounterLaunchModal from "./EncounterLaunchModal";
import type { Encounter, EnemyDoc } from "@/types";

interface EncounterComposerProps {
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
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const battleMaps = useCampaignStore((s) => s.battleMaps);

  // ── Derived ──
  const selectedEncounter = useMemo(
    () => encounters.find((e) => e.id === selectedEncounterId) ?? null,
    [encounters, selectedEncounterId]
  );

  const partySize = characters.length > 0 ? characters.length : 4;
  const avgLevel = characters.length > 0
    ? Math.round(characters.reduce((sum, c) => sum + c.level, 0) / characters.length)
    : 3;

  // ── Difficulty calculation ──
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

  const handleCreateNew = useCallback(() => {
    if (!newName.trim()) return;
    const enc: Encounter = {
      id: generateId(),
      name: newName.trim(),
      description: newDesc.trim() || "",
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

  const handleLaunch = useCallback(() => {
    if (!selectedEncounterId || !selectedEncounter) return;
    // If there are no battle maps, navigate directly to create one
    if (battleMaps.length === 0) {
      updateEncounter(selectedEncounterId, { isActive: true, updatedAt: Date.now() });
      navigate("/campaign/maps");
      return;
    }
    // Show the launch modal for map selection
    setShowLaunchModal(true);
  }, [selectedEncounterId, selectedEncounter, updateEncounter, navigate, battleMaps.length]);

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
    <div className="flex flex-col" style={{ minHeight: "0", flex: 1 }}>
      {/* ═══════════════════════════════════════════════════
          HEADER: Encounter Selector
          ═══════════════════════════════════════════════════ */}
      <div className="shrink-0 flex items-center justify-between mb-3 pb-2 border-b border-white/[0.03]">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/80">Encounters</h3>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-surface-400 tabular-nums">{encounters.length}</span>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="w-6 h-6 rounded-lg bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 text-[10px] flex items-center justify-center active:scale-90 transition-all duration-150"
            title="New Encounter"
          >
            +
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          CREATE ENCOUNTER FORM (Expanding)
          ═══════════════════════════════════════════════════ */}
      {isCreating && (
        <div
          className="shrink-0 relative mb-3 p-3 rounded-xl bg-gradient-to-b from-[#14151f]/80 to-[#0f1019]/90 border border-gold-500/15 space-y-2 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Encounter name..."
            className="w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-700 transition-all"
            onKeyDown={(e) => e.key === "Enter" && handleCreateNew()}
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-700 transition-all"
          />
          <select
            value={newEnv}
            onChange={(e) => setNewEnv(e.target.value)}
            className="w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-surface-400 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 appearance-none cursor-pointer transition-all"
          >
            {ENV_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCreateNew}
              disabled={!newName.trim()}
              className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all duration-150"
            >
              Create Encounter
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-lg text-[9px] text-surface-500 hover:text-surface-300 active:scale-95 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          ENCOUNTER LIST (Scrollable)
          ═══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto scrollbar-gold space-y-1.5 pr-1" style={{ minHeight: "0" }}>
        {encounters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden mb-3">
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-amber-500/5" />
              <div className="absolute inset-0 rounded-2xl border border-gold-500/20" />
              <span className="absolute inset-0 flex items-center justify-center text-lg drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">⚔</span>
            </div>
            <p className="text-[10px] text-surface-400 mb-2">No encounters yet</p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-[9px] text-gold-400 hover:text-gold-300 transition-colors underline underline-offset-4 decoration-gold-500/30 hover:decoration-gold-500/60"
            >
              Create one
            </button>
          </div>
        ) : (
          encounters.map((enc, idx) => {
            const isSelected = enc.id === selectedEncounterId;
            const totalEnemies = enc.enemyGroups.reduce((s, g) => s + g.count, 0);

            return (
              <div
                key={enc.id}
                onClick={() => setSelectedEncounterId(enc.id)}
                className={`relative rounded-xl p-2.5 cursor-pointer transition-all duration-200 group ${
                  isSelected
                    ? "bg-gradient-to-b from-gold-500/10 to-gold-500/5 border border-gold-500/25 shadow-[0_0_12px_rgba(234,179,8,0.04)]"
                    : "bg-gradient-to-b from-[#14151f]/60 to-[#0f1019]/70 border border-white/[0.04] hover:border-white/[0.10] hover:-translate-y-0.5"
                }`}
                style={{ animation: `slide-in-up 0.35s ease-out ${idx * 60}ms both` }}
              >
                {/* Gold edge light for selected */}
                <div className={`absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent transition-all duration-300 ${
                  isSelected ? "via-gold-500/25" : ""
                }`} />

                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold truncate ${isSelected ? "text-gold-400" : "text-surface-200 group-hover:text-gold-200 transition-colors"}`}>
                        {enc.name}
                      </span>
                      {enc.isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.4)] animate-pulse-soft" title="Active" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[9px] text-surface-500">
                      <span className="tabular-nums">{totalEnemies} enemy{totalEnemies !== 1 ? "ies" : "y"}</span>
                      <span>·</span>
                      <span>{enc.environment}</span>
                      {enc.isActive && <span className="text-emerald-400 text-[8px]">Active</span>}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(enc.id); }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-[8px] text-surface-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition-all"
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

      {/* ═══════════════════════════════════════════════════
          SELECTED ENCOUNTER DETAIL PANEL
          ═══════════════════════════════════════════════════ */}
      {selectedEncounter && (
        <div className="shrink-0 mt-3 pt-3 border-t border-white/[0.04] space-y-3">
          {/* Difficulty + Stats Bar */}
          {difficulty && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${getDifficultyColor(difficulty.rating)}`}>
                {getDifficultyLabel(difficulty.rating)}
              </span>
              <span className="text-[9px] text-gold-400/60 tabular-nums">{difficulty.totalXp.toLocaleString()} XP</span>
              <span className="text-[9px] text-surface-400 tabular-nums">Adj: {difficulty.adjustedXp.toLocaleString()}</span>
              {difficulty.crRange.min > 0 && (
                <span className="text-[9px] text-rose-400 tabular-nums">CR {difficulty.crRange.min}–{difficulty.crRange.max}</span>
              )}
              <span className="text-[9px] text-surface-400 tabular-nums">· Party: {partySize}×Lv.{avgLevel}</span>
            </div>
          )}

          {/* Enemy group list */}
          <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-gold">
            {selectedEncounter.enemyGroups.length === 0 ? (
              <p className="text-[9px] text-surface-500 italic px-1 py-2 text-center">
                Add monsters from the Bestiary above
              </p>
            ) : (
              selectedEncounter.enemyGroups.map((group) => {
                const doc = enemies.find((e) => e.id === group.enemyId);
                const crDisplay = doc ? `CR ${doc.challengeRating}` : "";
                return (
                  <div
                    key={group.enemyId}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gradient-to-b from-[#14151f]/50 to-[#0f1019]/60 border border-white/[0.04]"
                    style={{ animation: "slide-in-up 0.25s ease-out both" }}
                  >
                    <span className="flex-1 text-[10px] text-surface-300 truncate">
                      {doc?.name ?? "Unknown"} <span className="text-surface-500">{crDisplay}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddMonster(group.enemyId)}
                        className="w-5 h-5 rounded flex items-center justify-center text-[9px] text-surface-500 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90 transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-gold-400/80 tabular-nums min-w-[1.2em] text-center font-semibold">
                        {group.count}
                      </span>
                      <button
                        onClick={() => handleRemoveGroup(group.enemyId)}
                        className="w-5 h-5 rounded flex items-center justify-center text-[9px] text-surface-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition-all"
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
            className="w-full py-2.5 rounded-xl text-[10px] font-bold bg-gradient-to-br from-emerald-500/15 to-green-500/10 border border-emerald-500/25 text-emerald-400 hover:from-emerald-500/25 hover:to-green-500/15 hover:border-emerald-500/35 hover:shadow-[0_0_24px_rgba(52,211,153,0.08)] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
          >
            <span>▶</span>
            <span>Launch Encounter</span>
          </button>
        </div>
      )}

      {/* ── Encounter Launch Modal ── */}
      <EncounterLaunchModal
        encounter={selectedEncounter}
        isOpen={showLaunchModal}
        onClose={() => setShowLaunchModal(false)}
      />
    </div>
  );
}
