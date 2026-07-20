/**
 * STᚱ VTT — Bestiary Panel
 *
 * Unified monster browser that replaces the standalone NPC Library.
 * DMs can:
 *   - Browse/search/filter monsters
 *   - View statblocks
 *   - Quick-create new NPCs
 *   - Drag/assign monsters to the currently-selected encounter
 *   - Create encounters inline
 *
 * This panel lives inside the UnifiedEncounterHub alongside the
 * EncounterComposer, enabling seamless monster → encounter workflow.
 */

import { useState, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import EnemyList from "@/components/encounters/EnemyList";
import EnemyStatblock from "@/components/encounters/EnemyStatblock";
import EnemyQuickCreate from "@/components/encounters/EnemyQuickCreate";
import type { EnemyDoc } from "@/types";

interface BestiaryPanelProps {
  /** Called when DM wants to add a monster to the active encounter */
  onAddToEncounter?: (enemyId: string) => void;
  /** If set, the "Add to Encounter" button uses this encounter label */
  encounterContextLabel?: string;
}

export default function BestiaryPanel({ onAddToEncounter, encounterContextLabel }: BestiaryPanelProps) {
  const enemies = useCampaignStore((s) => s.enemies);
  const setEnemies = useCampaignStore((s) => s.setEnemies);

  const [selectedEnemy, setSelectedEnemy] = useState<EnemyDoc | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [search, setSearch] = useState("");

  // ── Stats ──
  const stats = useMemo(() => {
    const total = enemies.length;
    const byType: Record<string, number> = {};
    const crBuckets = { low: 0, mid: 0, high: 0, epic: 0 };
    enemies.forEach((e) => {
      byType[e.type] = (byType[e.type] || 0) + 1;
      if (e.challengeRating <= 2) crBuckets.low++;
      else if (e.challengeRating <= 8) crBuckets.mid++;
      else if (e.challengeRating <= 16) crBuckets.high++;
      else crBuckets.epic++;
    });
    return { total, byType, crBuckets, typeCount: Object.keys(byType).length };
  }, [enemies]);

  const handleSelectEnemy = useCallback((enemy: EnemyDoc) => {
    setSelectedEnemy(enemy);
  }, []);

  const handleCreated = useCallback(
    (enemy: EnemyDoc) => {
      const updated = [...enemies, enemy];
      setEnemies(updated);
      setSelectedEnemy(enemy);
    },
    [enemies, setEnemies]
  );

  const handleSaveEnemy = useCallback(
    (updated: EnemyDoc) => {
      const updatedEnemies = enemies.map((e) => (e.id === updated.id ? updated : e));
      setEnemies(updatedEnemies);
      setSelectedEnemy(updated);
    },
    [enemies, setEnemies]
  );

  const handleDeleteEnemy = useCallback(
    (id: string) => {
      const updated = enemies.filter((e) => e.id !== id);
      setEnemies(updated);
      setSelectedEnemy(null);
    },
    [enemies, setEnemies]
  );

  const handleDuplicate = useCallback(
    (enemy: EnemyDoc) => {
      const dup: EnemyDoc = {
        ...enemy,
        id: `enemy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: `${enemy.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setEnemies([...enemies, dup]);
    },
    [enemies, setEnemies]
  );

  return (
    <div className="flex flex-col h-full">
      {/* ── Stats Bar ── */}
      <div className="shrink-0 flex items-center gap-2 mb-3 text-[9px] text-surface-500 px-1">
        <span className="text-gold-400/60 font-semibold">{stats.total} monsters</span>
        <span>📋 {stats.typeCount} types</span>
        {stats.total > 0 && (
          <>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-400">🟢 {stats.crBuckets.low}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400">🟡 {stats.crBuckets.mid}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/15 text-rose-400">🔴 {stats.crBuckets.high}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/15 text-violet-400">🟣 {stats.crBuckets.epic}</span>
          </>
        )}
      </div>

      {/* ── Search + Actions ── */}
      <div className="shrink-0 flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-surface-500 pointer-events-none">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search monsters..."
            className="w-full py-1.5 pl-6 pr-2 rounded-lg text-[10px] bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 placeholder:text-surface-700"
          />
        </div>
        <button
          onClick={() => setShowQuickCreate(true)}
          className="shrink-0 px-2 py-1.5 rounded text-[9px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all"
        >
          ✦ New
        </button>
      </div>

      {/* ── Monster List ── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-gold space-y-1 pr-1">
        <EnemyList
          enemies={enemies}
          onSelect={handleSelectEnemy}
          onQuickCreate={() => setShowQuickCreate(true)}
          onDuplicate={handleDuplicate}
          searchQuery={search}
          onAddToEncounter={onAddToEncounter}
          encounterContextLabel={encounterContextLabel}
        />
      </div>

      {/* ── Statblock Modal ── */}
      {selectedEnemy && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEnemy(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <EnemyStatblock
              enemy={selectedEnemy}
              onSave={handleSaveEnemy}
              onDelete={handleDeleteEnemy}
              onClose={() => setSelectedEnemy(null)}
            />
          </div>
        </div>
      )}

      {/* ── Quick Create Modal ── */}
      <EnemyQuickCreate
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
