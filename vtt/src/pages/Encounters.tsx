/**
 * ST R VTT - Encounters Page (DM Encounter Builder)
 *
 * Complete encounter management hub:
 * - Encounter list with live CR analysis, difficulty badges, environment icons
 * - Encounter Builder modal (name, description, environment, enemy groups)
 * - Enemy Quick-Create for adding new monsters on the fly
 * - Empty state with getting-started guidance
 * - Launch encounter → navigates to Battle Maps with encounter active
 *
 * Data flows:
 *   encounters[] ← entitySlice (Zustand persist)
 *   enemies[] ← entitySlice
 *   characters[] ← characterSlice (for party CR calculation)
 *
 * CR calculation engine: lib/mechanics/encounter-cr.ts
 *   - DMG pg. 82-83 XP thresholds
 *   - Encounter multiplier by group size
 *   - Party size adjustment
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useCampaignStore } from "@/stores/campaignStore";
// Firestore writes for enemies would go here via entity service
// For now, we rely on Zustand persist (localStorage)
import EncounterList from "@/components/encounters/EncounterList";
import EncounterBuilder from "@/components/encounters/EncounterBuilder";
import EnemyQuickCreate from "@/components/encounters/EnemyQuickCreate";
import type { Encounter, EnemyDoc } from "@/types";

export default function Encounters() {
  const navigate = useNavigate();
  const encounters = useCampaignStore((s) => s.encounters);
  const enemies = useCampaignStore((s) => s.enemies);
  const addEncounter = useCampaignStore((s) => s.addEncounter);
  const updateEncounter = useCampaignStore((s) => s.updateEncounter);
  const removeEncounter = useCampaignStore((s) => s.removeEncounter);
  const addEnemy = useCampaignStore((s) => s.setEnemies);

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState<Encounter | undefined>(undefined);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const handleSaveEncounter = useCallback(
    (encounter: Encounter) => {
      const isNew = !encounters.some((e) => e.id === encounter.id);
      if (isNew) {
        addEncounter(encounter);
      } else {
        updateEncounter(encounter.id, encounter);
      }
      setShowBuilder(false);
      setEditingEncounter(undefined);
    },
    [encounters, addEncounter, updateEncounter]
  );

  const handleDeleteEncounter = useCallback(
    (id: string) => {
      removeEncounter(id);
    },
    [removeEncounter]
  );

  const handleSelectEncounter = useCallback(
    (encounter: Encounter) => {
      setEditingEncounter(encounter);
      setShowBuilder(true);
    },
    []
  );

  const handleLaunchEncounter = useCallback(
    (encounter: Encounter) => {
      // Mark as active and navigate to battle maps
      updateEncounter(encounter.id, { isActive: true });
      navigate("/campaign/maps");
    },
    [updateEncounter, navigate]
  );

  const handleCreateEnemy = useCallback(
    (enemy: EnemyDoc) => {
      const updatedEnemies = [...enemies, enemy];
      addEnemy(updatedEnemies);
      // Firestore write would go here: setEnemy(campaignId, enemy.id, enemy)
    },
    [enemies, addEnemy]
  );

  // Quick reference stats for the header
  const totalEnemyCount = enemies.length;
  const activeEncounters = encounters.filter((e) => e.isActive).length;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto pb-24 sm:pb-8">
        {/* ── Page Header ── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#181a2a]/80 via-[#12131e]/85 to-[#0c0d15]/90 border border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.02)]">
          <div className="absolute inset-0 opacity-[0.04] bg-[conic-gradient(from_0deg,transparent_0%,rgba(234,179,8,0.3)_20%,transparent_40%,rgba(234,179,8,0.15)_60%,transparent_80%)] animate-depth-rotate pointer-events-none" style={{ animationDuration: '30s' }} />
          <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/5 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10 p-5 sm:p-7">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-gold-500/8 to-amber-500/5 border border-gold-500/15 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gold-500/15 to-transparent opacity-40" />
                <span className="text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">⚔</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white/95 tracking-tight leading-tight">
                  Encounters
                </h1>
                <p className="text-xs sm:text-sm text-surface-400 mt-1.5 leading-relaxed">
                  Design combat encounters · Manage your campaign's threats
                </p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="text-[9px] uppercase tracking-widest text-gold-400/60 bg-gold-500/8 border border-gold-500/15 px-2 py-1 rounded font-medium">✦ Encounter Builder</span>
                  {totalEnemyCount > 0 && (
                    <span className="text-[9px] text-surface-500">{totalEnemyCount} monsters in compendium</span>
                  )}
                  {activeEncounters > 0 && (
                    <span className="text-[9px] text-emerald-400">● {activeEncounters} active</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between mt-4 mb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-[0.05em]">
              Saved Encounters
            </h2>
            <span className="text-[9px] text-surface-500 bg-surface-800/40 border border-white/[0.04] px-2 py-0.5 rounded-full font-medium tabular-nums">
              {encounters.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {enemies.length > 0 && (
              <button
                onClick={() => setShowQuickCreate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-gold/15 hover:bg-gold-500/5 active:scale-95 transition-all duration-200"
              >
                <span>👾</span>
                <span>Quick Monster</span>
              </button>
            )}
            <button
              onClick={() => { setEditingEncounter(undefined); setShowBuilder(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 text-[11px] font-semibold active:scale-95 transition-all duration-200 hover:from-gold-500/20 hover:to-amber-500/12 hover:border-gold-500/30 hover:shadow-[0_0_12px_rgba(234,179,8,0.06)]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Encounter</span>
            </button>
          </div>
        </div>

        {/* ── Encounter List or Empty State ── */}
        {encounters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gold-500/8 border border-gold/10 flex items-center justify-center mb-4">
              <span className="text-2xl">⚔</span>
            </div>
            <h3 className="text-base font-bold text-surface-300 mb-2">No Encounters Yet</h3>
            <p className="text-xs text-surface-500 max-w-md leading-relaxed mb-6">
              Design combat encounters by adding monsters, tracking difficulty ratings,
              and managing your campaign's threats — all in one place.
            </p>

            {/* Getting Started Guide */}
            <div className="relative bg-gradient-to-b from-[#14151f]/85 to-[#0f1019]/90 border border-white/[0.04] rounded-2xl p-5 max-w-lg w-full text-left shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
              <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />
              <h4 className="text-[10px] uppercase tracking-widest font-black text-gold-500/50 mb-4">
                Getting Started
              </h4>
              <div className="space-y-3">
                <Step number={1} title="Add Monsters" desc="Create NPCs with CR, AC, HP, and type stats so you can reference them in encounters." />
                <Step number={2} title="Build Encounter" desc="Click 'New Encounter' to combine monster groups. The CR calculator shows difficulty live." />
                <Step number={3} title="Launch" desc="Launch an encounter from the list to pre-populate the Battle Maps initiative tracker." />
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => { if (enemies.length === 0) setShowQuickCreate(true); else { setEditingEncounter(undefined); setShowBuilder(true); } }}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500/12 border border-gold/20 text-gold-400 text-sm font-semibold active:scale-95 transition-all duration-200 hover:bg-gold-500/20 hover:shadow-[0_0_16px_rgba(234,179,8,0.08)]"
            >
              <span>{enemies.length === 0 ? "👾 Create First Monster" : "⚔ Create First Encounter"}</span>
            </button>
          </div>
        ) : (
          <EncounterList
            onSelectEncounter={handleSelectEncounter}
            onDeleteEncounter={handleDeleteEncounter}
            onLaunchEncounter={handleLaunchEncounter}
          />
        )}

        {/* ── Encounter Builder Modal ── */}
        {showBuilder && (
          <EncounterBuilder
            onSave={handleSaveEncounter}
            onClose={() => { setShowBuilder(false); setEditingEncounter(undefined); }}
            initialEncounter={editingEncounter}
          />
        )}

        {/* ── Enemy Quick Create ── */}
        <EnemyQuickCreate
          isOpen={showQuickCreate}
          onClose={() => setShowQuickCreate(false)}
          onCreated={handleCreateEnemy}
        />
      </div>
    </AppShell>
  );
}

function Step({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-gold-500/10 border border-gold/15 flex items-center justify-center">
        <span className="text-[10px] font-black text-gold-400">{number}</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-surface-200">{title}</p>
        <p className="text-[10px] text-surface-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
