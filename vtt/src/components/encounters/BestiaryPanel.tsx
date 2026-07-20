/**
 * STᚱ VTT — Bestiary Panel (Premium Monster Browser v3.0)
 *
 * Unified monster browser with premium Lusion-grade styling.
 * Features:
 *   - Gold-accented stats bar with CR distribution badges
 *   - Premium search with gold focus state + icon transition
 *   - Glass gradient monster list background
 *   - Staggered entrance animations
 *   - Gold edge light on container
 *   - Premium glass dark inputs
 *   - 0 dependencies on glass-gold / corner-ornament / depth-ring
 */

import { useState, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import EnemyList from "@/components/encounters/EnemyList";
import EnemyStatblock from "@/components/encounters/EnemyStatblock";
import EnemyCreator from "@/components/encounters/EnemyCreator";
import type { EnemyDoc } from "@/types";

interface BestiaryPanelProps {
  onAddToEncounter?: (enemyId: string) => void;
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
      setEnemies([...enemies, enemy]);
      setSelectedEnemy(enemy);
    },
    [enemies, setEnemies]
  );

  const handleSaveEnemy = useCallback(
    (updated: EnemyDoc) => {
      setEnemies(enemies.map((e) => (e.id === updated.id ? updated : e)));
      setSelectedEnemy(updated);
    },
    [enemies, setEnemies]
  );

  const handleDeleteEnemy = useCallback(
    (id: string) => {
      setEnemies(enemies.filter((e) => e.id !== id));
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
    <div className="flex flex-col" style={{ minHeight: "0", flex: 1 }}>
      {/* ── Premium Stats Bar ── */}
      <div className="shrink-0 flex items-center gap-2 mb-3 text-[9px] text-surface-500 px-1 border-b border-white/[0.03] pb-2">
        <span className="text-gold-400/60 font-semibold tabular-nums">{stats.total} monsters</span>
        <span className="text-surface-600">·</span>
        <span>📋 {stats.typeCount} types</span>
        {stats.total > 0 && (
          <>
            <span className="text-surface-600">·</span>
            <div className="flex items-center gap-1">
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 tabular-nums">🟢 {stats.crBuckets.low}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400 tabular-nums">🟡 {stats.crBuckets.mid}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/15 text-rose-400 tabular-nums">🔴 {stats.crBuckets.high}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/15 text-violet-400 tabular-nums">🟣 {stats.crBuckets.epic}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Premium Search + Actions ── */}
      <div className="shrink-0 flex items-center gap-2 mb-3">
        <div className="relative flex-1 group/search">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-surface-500 pointer-events-none group-focus-within/search:text-gold-400/60 transition-colors duration-200">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search monsters..."
            className="w-full py-1.5 pl-7 pr-2 rounded-lg text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-700 transition-all duration-200"
          />
        </div>
        <button
          onClick={() => setShowQuickCreate(true)}
          className="shrink-0 px-2.5 py-1.5 rounded text-[9px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 hover:border-gold-500/30 active:scale-95 transition-all duration-150 flex items-center gap-1"
        >
          <span>✦</span>
          <span>New</span>
        </button>
      </div>

      {/* ── Monster List ── */}
      <div className="flex-1 overflow-y-auto scrollbar-gold space-y-1 pr-1" style={{ minHeight: "0" }}>
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

      {/* ── Statblock Modal (premium glass backdrop) ── */}
      {selectedEnemy && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedEnemy(null)}
        >
          <div className="relative max-w-lg w-full mx-4" style={{ animation: "slide-in-up 0.3s ease-out 0.05s both" }} onClick={(e) => e.stopPropagation()}>
            <EnemyStatblock
              enemy={selectedEnemy}
              onSave={handleSaveEnemy}
              onDelete={handleDeleteEnemy}
              onClose={() => setSelectedEnemy(null)}
            />
          </div>
        </div>
      )}

      {/* ── Enemy Creator Modal ── */}
      <EnemyCreator
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
