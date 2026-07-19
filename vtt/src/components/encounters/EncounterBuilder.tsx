/**
 * ST R VTT - Encounter Builder
 *
 * Full encounter creation/editing form with:
 * - Name, description, environment selection
 * - Monster browser from saved enemies
 * - Enemy group management (add/remove groups, set count)
 * - Auto-calculated difficulty rating (live as groups are added)
 * - Party config for CR calculation
 */

import { useState, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { analyzeEncounterDifficulty, getDifficultyLabel, getDifficultyColor } from "@/lib/mechanics/encounter-cr";
import { parseCr } from "@/lib/mechanics/encounter-cr";
import type { Encounter, EnemyGroup, EnemyDoc } from "@/types";

interface EncounterBuilderProps {
  onSave: (encounter: Encounter) => void;
  onClose: () => void;
  initialEncounter?: Encounter;
}

const ENVIRONMENTS = [
  { value: "dungeon", label: "Dungeon", icon: "🏚" },
  { value: "forest", label: "Forest", icon: "🌲" },
  { value: "city", label: "City", icon: "🏛" },
  { value: "cave", label: "Cave", icon: "🕳" },
  { value: "swamp", label: "Swamp", icon: "🌿" },
  { value: "mountain", label: "Mountain", icon: "⛰" },
  { value: "desert", label: "Desert", icon: "🏜" },
  { value: "water", label: "Water", icon: "🌊" },
  { value: "planar", label: "Planar", icon: "🌀" },
  { value: "ruins", label: "Ruins", icon: "🏗" },
  { value: "temple", label: "Temple", icon: "⛩" },
  { value: "castle", label: "Castle", icon: "🏰" },
  { value: "wilderness", label: "Wilderness", icon: "🌄" },
  { value: "underdark", label: "Underdark", icon: "🕸" },
  { value: "custom", label: "Custom", icon: "✦" },
];

const SIZE_ORDER: Record<string, number> = {
  Tiny: 1, Small: 2, Medium: 3, Large: 4, Huge: 5, Gargantuan: 6,
};

export default function EncounterBuilder({
  onSave,
  onClose,
  initialEncounter,
}: EncounterBuilderProps) {
  const enemies = useCampaignStore((s) => s.enemies);
  const characters = useCampaignStore((s) => s.characters);

  const [name, setName] = useState(initialEncounter?.name || "");
  const [description, setDescription] = useState(initialEncounter?.description || "");
  const [environment, setEnvironment] = useState(initialEncounter?.environment || "dungeon");
  const [enemyGroups, setEnemyGroups] = useState<EnemyGroup[]>(
    initialEncounter?.enemyGroups || []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Party config for CR calculation
  const partySize = characters.length > 0 ? characters.length : 4;
  const avgLevel = characters.length > 0
    ? Math.round(characters.reduce((sum, c) => sum + c.level, 0) / characters.length)
    : 3;

  // Compute difficulty live
  const difficultyResult = useMemo(() => {
    const crs: number[] = [];
    enemyGroups.forEach((group) => {
      const enemyDoc = enemies.find((e) => e.id === group.enemyId);
      const cr = enemyDoc ? parseCr(enemyDoc.challengeRating) : 0;
      for (let i = 0; i < group.count; i++) crs.push(cr);
    });
    return analyzeEncounterDifficulty(crs, { size: partySize, level: avgLevel });
  }, [enemyGroups, enemies, partySize, avgLevel]);

  // Filtered enemy list
  const filteredEnemies = useMemo(() => {
    let list = enemies;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      list = list.filter((e) => e.type === typeFilter);
    }
    return list.sort((a, b) => {
      const sizeDiff = (SIZE_ORDER[a.size] || 3) - (SIZE_ORDER[b.size] || 3);
      if (sizeDiff !== 0) return sizeDiff;
      return parseCr(a.challengeRating) - parseCr(b.challengeRating);
    });
  }, [enemies, searchQuery, typeFilter]);

  // Unique creature types for filter
  const creatureTypes = useMemo(() => {
    const types = new Set(enemies.map((e) => e.type));
    return Array.from(types).sort();
  }, [enemies]);

  const addEnemyToGroup = useCallback((enemy: EnemyDoc) => {
    const existingGroup = enemyGroups.find((g) => g.enemyId === enemy.id);
    if (existingGroup) {
      setEnemyGroups((prev) =>
        prev.map((g) =>
          g.enemyId === enemy.id ? { ...g, count: g.count + 1 } : g
        )
      );
    } else {
      setEnemyGroups((prev) => [
        ...prev,
        { enemyId: enemy.id, count: 1, label: enemy.name },
      ]);
    }
  }, [enemyGroups]);

  const removeEnemyGroup = useCallback((enemyId: string) => {
    setEnemyGroups((prev) => prev.filter((g) => g.enemyId !== enemyId));
  }, []);

  const updateGroupCount = useCallback((enemyId: string, delta: number) => {
    setEnemyGroups((prev) =>
      prev.map((g) =>
        g.enemyId === enemyId
          ? { ...g, count: Math.max(1, g.count + delta) }
          : g
      )
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;

    const encounter: Encounter = {
      id: initialEncounter?.id || `enc_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      environment,
      difficulty: getDifficultyLabel(difficultyResult.rating),
      isActive: initialEncounter?.isActive || false,
      enemyGroups,
      createdAt: initialEncounter?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(encounter);
  }, [name, description, environment, difficultyResult, enemyGroups, initialEncounter, onSave]);

  const isValid = name.trim().length > 0;

  // Get enemy doc from ID
  const getEnemy = useCallback(
    (id: string) => enemies.find((e) => e.id === id),
    [enemies]
  );

  // Total enemy count
  const totalEnemyCount = enemyGroups.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="glass-gold rounded-2xl w-full max-w-2xl mx-4 border border-gold/10 shadow-2xl shadow-gold-500/5 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-br corner-gold corner-gold-glow" />

        {/* Header */}
        <div className="shrink-0 px-5 py-3.5 border-b border-gold/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚔</span>
              <h2 className="text-sm font-black text-gold tracking-tight">
                {initialEncounter ? "Edit Encounter" : "New Encounter"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-gold px-5 py-4 space-y-4">
          {/* ── Name + Description ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">
                Name <span className="text-rose-400">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Goblin Ambush"
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-2 text-xs text-surface-200 focus:outline-none focus:border-gold/25 appearance-none cursor-pointer"
              >
                {ENVIRONMENTS.map((env) => (
                  <option key={env.value} value={env.value}>{env.icon} {env.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">
              Description <span className="text-surface-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the encounter setup, terrain, or tactical notes..."
              rows={2}
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15 resize-none"
            />
          </div>

          {/* ── Difficulty Preview ── */}
          <div className={`rounded-xl border p-3 ${getDifficultyColor(difficultyResult.rating)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-black ${difficultyResult.rating === "deadly" || difficultyResult.rating === "impossible" ? "text-red-400" : ""}`}>
                  {getDifficultyLabel(difficultyResult.rating)}
                </span>
                <span className="text-[10px] text-surface-500">
                  Party: Lv.{avgLevel} · {partySize} PCs
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-surface-500">Enemies: {totalEnemyCount}</span>
                <span className="text-[10px] text-gold-400">{difficultyResult.totalXp} XP</span>
              </div>
            </div>
          </div>

          {/* ── Enemy Groups (selected) ── */}
          {enemyGroups.length > 0 && (
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-2">
                Enemy Groups ({totalEnemyCount} total)
              </label>
              <div className="space-y-1.5">
                {enemyGroups.map((group) => {
                  const enemy = getEnemy(group.enemyId);
                  if (!enemy) return null;
                  return (
                    <div
                      key={group.enemyId}
                      className="flex items-center gap-3 bg-[#07080d]/50 border border-white/[0.04] rounded-lg px-3 py-2"
                    >
                      <span className="text-sm">{enemy.size === "Large" ? "🦎" : enemy.size === "Huge" ? "🐉" : enemy.size === "Gargantuan" ? "🐲" : "👾"}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-surface-200">{enemy.name}</span>
                        <span className="text-[10px] text-surface-500 ml-2">
                          CR {enemy.challengeRating} · AC {enemy.armorClass} · HP {enemy.hitPoints.max}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateGroupCount(group.enemyId, -1)}
                          className="w-6 h-6 rounded-lg bg-[#07080d] border border-white/[0.06] text-surface-500 hover:text-surface-200 active:scale-90 text-xs flex items-center justify-center"
                        >−</button>
                        <span className="text-xs font-bold tabular-nums text-gold-300 w-4 text-center">{group.count}</span>
                        <button
                          onClick={() => updateGroupCount(group.enemyId, 1)}
                          className="w-6 h-6 rounded-lg bg-[#07080d] border border-white/[0.06] text-surface-500 hover:text-surface-200 active:scale-90 text-xs flex items-center justify-center"
                        >+</button>
                        <button
                          onClick={() => removeEnemyGroup(group.enemyId)}
                          className="w-6 h-6 rounded-lg text-surface-600 hover:text-rose-400 active:scale-90 text-xs flex items-center justify-center"
                        >✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Monster Browser ── */}
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-2">
              Add Monsters
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search enemies..."
                className="flex-1 bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15"
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-surface-300 focus:outline-none focus:border-gold/25 appearance-none cursor-pointer [&>option]:bg-[#0a0b12]"
              >
                <option value="all">All Types</option>
                {creatureTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Enemy list */}
            <div className="max-h-40 overflow-y-auto scrollbar-gold space-y-1">
              {filteredEnemies.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-[10px] text-surface-600">No enemies found. Add some in the Enemies panel.</p>
                </div>
              ) : (
                filteredEnemies.map((enemy) => {
                  const inGroup = enemyGroups.some((g) => g.enemyId === enemy.id);
                  return (
                    <div
                      key={enemy.id}
                      onClick={() => addEnemyToGroup(enemy)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 cursor-pointer transition-all active:scale-[0.98] ${
                        inGroup
                          ? "bg-gold-500/8 border border-gold/10"
                          : "hover:bg-white/[0.03] border border-transparent hover:border-gold/5"
                      }`}
                    >
                      <span className="text-sm">{enemy.size === "Large" ? "🦎" : enemy.size === "Huge" ? "🐉" : enemy.size === "Gargantuan" ? "🐲" : "👾"}</span>
                      <span className="text-[11px] font-medium text-surface-300 flex-1 truncate">{enemy.name}</span>
                      <span className="text-[10px] text-surface-500">CR {enemy.challengeRating}</span>
                      <span className="text-[10px] text-surface-600">{enemy.type}</span>
                      {inGroup && <span className="text-[9px] text-gold-400">✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3.5 border-t border-gold/10 flex items-center justify-between">
          <div className="text-[10px] text-surface-600">
            {enemyGroups.length} group{enemyGroups.length !== 1 ? "s" : ""} · {totalEnemyCount} total enemies
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {initialEncounter ? "Save Changes" : "Create Encounter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
