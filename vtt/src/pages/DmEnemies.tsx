/**
 * STᚱ VTT — NPC / Monster Library (Premium 7-Layer Cinema Header)
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
 * This is the DM's central monster reference.
 * Replaced glass-gold + corner-ornament + depth-ring with 7-layer cinema header.
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
        {/* ── 7-Layer Cinematic Hero Header ── */}
        <div className="relative rounded-2xl overflow-hidden group mx-4 mt-4">
          {/* Layer 1: Gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#181a2a]/90 via-[#12131e]/90 to-[#0c0d15]/95" />
          {/* Layer 2: Conic depth ring */}
          <div
            className="absolute inset-0 opacity-[0.04] bg-[conic-gradient(from_0deg,transparent_0%,rgba(234,179,8,0.4)_15%,transparent_30%,rgba(234,179,8,0.2)_50%,transparent_70%,rgba(234,179,8,0.15)_85%,transparent_100%)]"
            style={{ animation: "spin 30s linear infinite" }}
          />
          {/* Layer 3: Top edge light */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 group-hover:via-gold-500/40 to-transparent transition-all duration-700" />
          {/* Layer 4: Bottom edge light */}
          <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/15 to-transparent transition-all duration-700 pointer-events-none" />
          {/* Layer 5: Ambient glow pockets */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold-500/[0.06] rounded-full blur-[80px] pointer-events-none group-hover:bg-gold-500/[0.08] transition-all duration-700" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/[0.04] rounded-full blur-[60px] pointer-events-none" />
          {/* Layer 6: Border */}
          <div className="absolute inset-0 rounded-2xl border border-white/[0.06] pointer-events-none" />

          {/* Layer 7: Content */}
          <div className="relative z-10 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Icon container */}
              <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-amber-500/5" />
                <div className="absolute inset-0 rounded-xl border border-gold-500/20" />
                <div className="absolute inset-2 bg-gold-500/10 rounded-lg blur-[4px]" />
                <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]">
                  👾
                </span>
              </div>

              <div className="min-w-0 pt-1 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white/95 tracking-tight leading-tight">
                      NPC Library
                    </h1>
                    <p className="text-xs sm:text-sm text-surface-400 mt-1.5 leading-relaxed">
                      Campaign monster compendium — browse, create, and manage NPCs
                    </p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {/* CR distribution badges */}
                      {stats.total > 0 && (
                        <>
                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-400">
                            🟢 {stats.crBuckets.low}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400">
                            🟡 {stats.crBuckets.mid}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/15 text-rose-400">
                            🔴 {stats.crBuckets.high}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/15 text-violet-400">
                            🟣 {stats.crBuckets.epic}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-gold-400/60 bg-gold-500/10 border border-gold-500/15 px-2.5 py-1 rounded font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse-soft" />
                            {stats.total} monsters
                          </span>
                        </>
                      )}
                      {stats.total === 0 && (
                        <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-gold-400/60 bg-gold-500/10 border border-gold-500/15 px-2.5 py-1 rounded font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse-soft" />
                          No monsters
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQuickCreate(true)}
                    className="shrink-0 ml-4 px-3 py-1.5 rounded text-[10px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 transition-all duration-200"
                  >
                    ✦ New Monster
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="shrink-0 mx-4 mt-3 mb-4 flex items-center gap-3 text-[9px] text-surface-500">
          <span className="text-gold-400/60 font-semibold tabular-nums">{stats.total} monsters</span>
          <span className="text-surface-600">·</span>
          <span>📋 {stats.typeCount} types</span>
          <span className="text-surface-600">·</span>
          <span>🐉 CR {enemies.length > 0 ? (enemies.reduce((s, e) => s + e.challengeRating, 0) / enemies.length).toFixed(1) : "—"} avg</span>
          <span className="text-surface-600">·</span>
          <span className="text-cyan-400/80">🛡 {(enemies.reduce((s, e) => s + e.armorClass, 0) / Math.max(1, enemies.length)).toFixed(1) || "—"} avg AC</span>
          <span className="text-surface-600">·</span>
          <span className="text-green-400/80">❤️ {enemies.reduce((s, e) => s + e.hitPoints.max, 0).toLocaleString()} total HP</span>
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
