/**
 * STᚱ VTT — NPC / Monster Library (DM Enemy Manager)
 *
 * Full campaign monster management hub:
 * - Searchable, filterable, sortable NPC library grid
 * - Full 5e-style statblock viewer with read/edit toggle
 * - Quick-create modal for rapid NPC generation
 * - Duplicate enemies for variant creation
 * - Delete with confirmation
 * - Type-based filtering by CR range
 *
 * Data flow:
 *   enemies[] ← entitySlice (Zustand persist + Firestore)
 *   QuickCreate + Statblock ← local state
 *
 * This is the DM's central monster reference — browse, create,
 * edit, and study NPCs before placing them in encounters.
 */

import { useState, useCallback, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { useCampaignStore } from "@/stores/campaignStore";
import EnemyList from "@/components/encounters/EnemyList";
import EnemyStatblock from "@/components/encounters/EnemyStatblock";
import EnemyQuickCreate from "@/components/encounters/EnemyQuickCreate";
import type { EnemyDoc } from "@/types";

export default function DmEnemies() {
  const enemies = useCampaignStore((s) => s.enemies);
  const setEnemies = useCampaignStore((s) => s.setEnemies);

  const [selectedEnemy, setSelectedEnemy] = useState<EnemyDoc | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

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

  const handleQuickCreateClose = useCallback(() => {
    setShowQuickCreate(false);
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
      const updated = [...enemies, dup];
      setEnemies(updated);
    },
    [enemies, setEnemies]
  );

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* ── Page Header ── */}
        <div className="shrink-0 glass-gold rounded-2xl m-4 p-4 relative overflow-hidden">
          <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-br corner-gold corner-gold-glow" />
          <div className="depth-ring absolute inset-0 opacity-20" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
                NPC Library
              </h1>
              <p className="text-[11px] text-surface-500 mt-1">
                Campaign monster compendium — browse, create, and manage NPCs
              </p>
            </div>

            {/* Quick-creature stats */}
            <div className="flex items-center gap-2">
              {stats.total > 0 && (
                <>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-400">
                    🟢 {stats.crBuckets.low}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400">
                    🟡 {stats.crBuckets.mid}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/15 text-rose-400">
                    🔴 {stats.crBuckets.high}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/15 text-purple-400">
                    🟣 {stats.crBuckets.epic}
                  </span>
                </>
              )}
              <button
                onClick={() => setShowQuickCreate(true)}
                className="px-3 py-1.5 rounded text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all"
              >
                ✦ New Monster
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="shrink-0 mx-4 mb-4 flex items-center gap-3 text-[9px] text-surface-500">
          <span className="text-gold-400/60 font-semibold">{stats.total} monsters</span>
          <span>📋 {stats.typeCount} types</span>
          <span>🐉 CR {enemies.length > 0 ? (enemies.reduce((s, e) => s + e.challengeRating, 0) / enemies.length).toFixed(1) : "—"} avg</span>
          <span>🛡 {enemies.reduce((s, e) => s + e.armorClass, 0) / Math.max(1, enemies.length) || 0} avg AC</span>
          <span>❤️ {enemies.reduce((s, e) => s + e.hitPoints.max, 0)} total HP</span>
        </div>

        {/* ── Main content: Enemy List ── */}
        <div className="flex-1 mx-4 mb-4">
          <EnemyList
            enemies={enemies}
            onSelect={handleSelectEnemy}
            onQuickCreate={() => setShowQuickCreate(true)}
            onDuplicate={handleDuplicate}
          />
        </div>

        {/* ── Statblock Modal ── */}
        {selectedEnemy && (
          <EnemyStatblock
            enemy={selectedEnemy}
            onSave={handleSaveEnemy}
            onDelete={handleDeleteEnemy}
            onClose={() => setSelectedEnemy(null)}
          />
        )}

        {/* ── Quick Create Modal ── */}
        <EnemyQuickCreate
          isOpen={showQuickCreate}
          onClose={handleQuickCreateClose}
          onCreated={handleCreated}
        />
      </div>
    </AppShell>
  );
}
