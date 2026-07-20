/**
 * STᚱ VTT — Battle Maps (Premium DM Map Management + Control Center)
 *
 * Complete battle map workflow with premium design:
 * - Lusion-grade 7-layer hero header matching Player Cards
 * - Premium empty state with getting started guide
 * - Extracted MapCard component (previously inline)
 * - Map list grid with hover depth, inline rename, delete confirmation
 * - Seamless transition into DmControlCenter
 *
 * Three states:
 * 1. Empty state — no maps created yet
 * 2. Map list — maps exist, user hasn't entered a map
 * 3. DM Control Center — user clicked "Open Map" on a card
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import AppShell from "@/components/layout/AppShell";
import DmControlCenter from "@/components/control-center/DmControlCenter";
import MapCreatorModal from "@/components/maps/MapCreatorModal";
import MapCard from "@/components/maps/MapCard";
import EmptyState from "@/components/ui/EmptyState";

export default function BattleMaps() {
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const removeBattleMap = useCampaignStore((s) => s.removeBattleMap);
  const updateBattleMap = useCampaignStore((s) => s.updateBattleMap);

  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  /* ── Empty state (no maps created yet) ── */
  if (battleMaps.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-col" style={{ minHeight: "0", flex: 1 }}>
          <div className="mx-4 mt-4 relative rounded-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#181a2a]/90 via-[#12131e]/90 to-[#0c0d15]/95" />
            <div
              className="absolute inset-0 opacity-[0.04] bg-[conic-gradient(from_0deg,transparent_0%,rgba(234,179,8,0.4)_15%,transparent_30%,rgba(234,179,8,0.2)_50%,transparent_70%,rgba(234,179,8,0.15)_85%,transparent_100%)]"
              style={{ animation: "spin 30s linear infinite" }}
            />
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 group-hover:via-gold-500/40 to-transparent transition-all duration-700" />
            <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/15 to-transparent transition-all duration-700 pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold-500/[0.06] rounded-full blur-[80px] pointer-events-none group-hover:bg-gold-500/[0.08] transition-all duration-700" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/[0.04] rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute inset-0 rounded-2xl border border-white/[0.06] pointer-events-none" />

            <div className="relative z-10 p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-amber-500/5" />
                  <div className="absolute inset-0 rounded-xl border border-gold-500/20" />
                  <div className="absolute inset-2 bg-gold-500/10 rounded-lg blur-[4px]" />
                  <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]">
                    🗺
                  </span>
                </div>

                <div className="min-w-0 pt-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white/95 tracking-tight leading-tight">
                    Battle Maps
                  </h1>
                  <p className="text-xs sm:text-sm text-surface-400 mt-1.5 leading-relaxed">
                    Tactical command center for your encounters
                  </p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-gold-400/60 bg-gold-500/10 border border-gold-500/15 px-2.5 py-1 rounded font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse-soft" />
                      Map Control
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 mx-4 mb-4 overflow-y-auto scrollbar-gold" style={{ minHeight: 0 }}>
            <div className="max-w-4xl mx-auto space-y-4 pb-8 pt-4">
              <EmptyState
                icon="🗺"
                title="No Battle Maps Yet"
                description="Create your first tactical map to unlock the DM Control Center with tokens, initiative tracking, and encounter tools."
              >
                <button
                  onClick={() => setShowCreator(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 text-sm font-semibold active:scale-95 transition-all duration-200 hover:from-gold-500/20 hover:to-amber-500/12 hover:border-gold-500/30 hover:shadow-[0_0_24px_rgba(234,179,8,0.08)]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Map</span>
                </button>
              </EmptyState>

              <div className="relative bg-gradient-to-b from-[#141520]/80 to-[#0f1019]/90 border border-white/[0.04] rounded-2xl p-4">
                <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
                <h3 className="text-[10px] uppercase tracking-widest text-gold-400/60 font-bold mb-3">
                  Getting Started
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#07080d] rounded-xl p-3 border border-white/[0.04]">
                    <div className="text-lg mb-1">1</div>
                    <div className="text-[10px] font-semibold text-surface-300">Create a Map</div>
                    <div className="text-[8px] text-surface-600 mt-0.5">Add a name, optional image, and set grid dimensions</div>
                  </div>
                  <div className="bg-[#07080d] rounded-xl p-3 border border-white/[0.04]">
                    <div className="text-lg mb-1">2</div>
                    <div className="text-[10px] font-semibold text-surface-300">Place Tokens</div>
                    <div className="text-[8px] text-surface-600 mt-0.5">Add player tokens and NPCs directly on the map</div>
                  </div>
                  <div className="bg-[#07080d] rounded-xl p-3 border border-white/[0.04]">
                    <div className="text-lg mb-1">3</div>
                    <div className="text-[10px] font-semibold text-surface-300">Run Encounters</div>
                    <div className="text-[8px] text-surface-600 mt-0.5">Track initiative, HP, and conditions in real-time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <MapCreatorModal isOpen={showCreator} onClose={() => setShowCreator(false)} />
      </AppShell>
    );
  }

  /* ── Map list (maps exist, user hasn't entered the control center) ── */
  if (!showControlCenter) {
    return (
      <AppShell>
        <div className="flex flex-col" style={{ minHeight: "0", flex: 1 }}>
          <div className="shrink-0 border-b border-white/[0.04] bg-gradient-to-r from-[#14151f]/90 to-[#0f1019]/95 px-4 py-2 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white/80 tracking-tight">Battle Maps</span>
              <span className="text-[10px] text-surface-500 px-1.5 py-0.5 rounded bg-[#07080d] border border-white/[0.04]">
                {battleMaps.length} map{battleMaps.length !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={() => setShowCreator(true)}
              className="px-3 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 hover:border-gold-500/30 active:scale-95 transition-all duration-150 flex items-center gap-1"
            >
              + New Map
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-gold" style={{ minHeight: 0 }}>
            <div className="max-w-6xl mx-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {battleMaps.map((map) => (
                  <MapCard
                    key={map.id}
                    map={map}
                    isEditing={editingMapId === map.id}
                    editName={editName}
                    isConfirmingDelete={confirmDelete === map.id}
                    onStartRename={() => {
                      setEditingMapId(map.id);
                      setEditName(map.name);
                    }}
                    onEditNameChange={setEditName}
                    onSaveRename={() => {
                      if (editName.trim()) {
                        updateBattleMap(map.id, { name: editName.trim() });
                      }
                      setEditingMapId(null);
                      setEditName("");
                    }}
                    onCancelRename={() => {
                      setEditingMapId(null);
                      setEditName("");
                    }}
                    onRequestDelete={() => setConfirmDelete(map.id)}
                    onCancelDelete={() => setConfirmDelete(null)}
                    onConfirmDelete={() => {
                      removeBattleMap(map.id);
                      setConfirmDelete(null);
                    }}
                    onSelect={() => setShowControlCenter(true)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <MapCreatorModal isOpen={showCreator} onClose={() => setShowCreator(false)} />
      </AppShell>
    );
  }

  /* ── DM Control Center (map selected, user entered the command bridge) ── */
  return (
    <AppShell>
      <div className="flex flex-col h-full" style={{ minHeight: "0", flex: 1 }}>
        <div className="shrink-0 border-b border-white/[0.04] bg-gradient-to-r from-[#14151f]/90 to-[#0f1019]/95 px-4 py-2 flex items-center z-10">
          <button
            onClick={() => setShowControlCenter(false)}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-surface-400 hover:text-gold-400 transition-all duration-200 active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Maps</span>
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <DmControlCenter />
        </div>
      </div>
    </AppShell>
  );
}
