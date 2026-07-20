/**
 * STᚱ VTT — Encounter Launch Modal (Real-Play D&D Mechanics, Sprint 17)
 *
 * A premium modal that bridges the gap between the Encounters page and
 * Battle Maps. When the DM clicks "Launch Encounter", this modal appears
 * (if multiple maps exist) asking which map to deploy to. It then:
 *   1. Populates enemy tokens on the selected map
 *   2. Creates token entries for each enemy group (spread across grid)
 *   3. Sets the encounter as active
 *   4. Navigates to the Battle Maps control center
 *
 * Flow:
 *   Encounter Page → Launch Button → EncounterLaunchModal
 *     ├─ No maps exist → Redirect to Battle Maps to create one
 *     ├─ Exactly 1 map → Auto-deploy directly
 *     └─ Multiple maps → Show map selector modal
 *
 * Token placement strategy:
 *   - Enemies are placed in the upper-right quadrant of the map
 *   - Each enemy group gets a small cluster (3-cell spread per group)
 *   - Groups are spaced 4 cells apart horizontally
 *   - Color coded by creature type (Humanoid=amber, Beast=red, Dragon=rose, etc.)
 *   - Token label = enemy name, HP = creature's max HP
 */

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import InitiativeRollOverlay from "./InitiativeRollOverlay";
import type { Encounter, EnemyDoc, BattleMap } from "@/types";

interface EncounterLaunchModalProps {
  /** The encounter to launch */
  encounter: Encounter | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
}

// ── Color map by creature type ──
function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    Humanoid: "#f59e0b",     // amber
    Beast: "#ef4444",        // red
    Dragon: "#e11d48",       // rose
    Undead: "#8b5cf6",       // violet
    Fiend: "#dc2626",        // red-600
    Celestial: "#fde047",    // gold
    Fey: "#a78bfa",          // violet
    Giant: "#f97316",        // orange
    Monstrosity: "#84cc16",  // lime
    Construct: "#94a3b8",    // slate
    Elemental: "#06b6d4",    // cyan
    Ooze: "#22c55e",         // green
    Plant: "#15803d",        // emerald
    Aberration: "#a855f7",   // purple
    Custom: "#78716c",       // stone
  };
  return colors[type] || "#78716c";
}

// ── Size to token size mapping ──
function getSizeValue(size: string): number {
  const sizes: Record<string, number> = {
    Tiny: 1,
    Small: 2,
    Medium: 2,
    Large: 3,
    Huge: 4,
    Gargantuan: 5,
  };
  return sizes[size] || 2;
}

// ── Helper: spread-enemy placement algorithm ──
function calculateTokenPlacements(
  enemyGroups: Encounter["enemyGroups"],
  enemies: EnemyDoc[],
  map: BattleMap
): { enemyId: string; tokens: Array<{ x: number; y: number }> }[] {
  const placements: Array<{ enemyId: string; tokens: Array<{ x: number; y: number }> }> = [];

  // Place enemies in upper-right quadrant (leaving lower-left for player tokens)
  const gridW = map.gridWidth || 20;
  const gridH = map.gridHeight || 15;
  const startX = Math.floor(gridW * 0.5);  // Start at 50% across
  const startY = Math.floor(gridH * 0.1);  // Start at 10% down
  const groupSpacingX = 4;
  const groupSpacingY = 3;

  let groupIndex = 0;
  for (const group of enemyGroups) {
    const doc = enemies.find((e) => e.id === group.enemyId);
    if (!doc) continue;

    const sizeVal = getSizeValue(doc.size);
    const tokens: Array<{ x: number; y: number }> = [];

    // Spread tokens in a small cluster
    const clusterWidth = Math.min(group.count, 3);
    const clusterHeight = Math.ceil(group.count / 3);

    for (let i = 0; i < group.count; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const px = startX + groupIndex * groupSpacingX + col * (sizeVal + 1);
      const py = startY + row * groupSpacingY;
      tokens.push({
        x: Math.min(px, gridW - sizeVal),
        y: Math.min(py, gridH - sizeVal),
      });
    }

    if (tokens.length > 0) {
      placements.push({ enemyId: group.enemyId, tokens });
    }
    groupIndex++;
  }

  return placements;
}

// ── Generate a unique token ID ──
function generateTokenId(): string {
  return `tok_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ── Player token colors (for potential future use) ──
const PLAYER_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#06b6d4", "#f97316", "#ec4899", "#14b8a6"];

export default function EncounterLaunchModal({
  encounter,
  isOpen,
  onClose,
}: EncounterLaunchModalProps) {
  const navigate = useNavigate();
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const enemies = useCampaignStore((s) => s.enemies);
  const updateEncounter = useCampaignStore((s) => s.updateEncounter);
  const addMapToken = useCampaignStore((s) => s.addMapToken);

  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [launchStatus, setLaunchStatus] = useState<"select" | "deploying" | "deployed" | "error">("select");
  const [deployProgress, setDeployProgress] = useState(0);
  const [showInitiativeRoll, setShowInitiativeRoll] = useState(false);
  // Store deployed token info for initiative roll
  const [deployedTokenSources, setDeployedTokenSources] = useState<Array<{ id: string; name: string; type: "player" | "enemy" | "npc" | "custom" }>>([]);

  // ── Reset state when modal opens ──
  const resetState = useCallback(() => {
    setSelectedMapId(null);
    setLaunchStatus("select");
    setDeployProgress(0);
  }, []);

  // ── Maps that are available for deployment ──
  const availableMaps = useMemo(() => {
    return battleMaps.filter((m) => m.gridWidth > 0 && m.gridHeight > 0);
  }, [battleMaps]);

  // ── Token placement preview ──
  const placementPreview = useMemo(() => {
    if (!encounter || !selectedMapId) return null;
    const map = battleMaps.find((m) => m.id === selectedMapId);
    if (!map) return null;
    return calculateTokenPlacements(encounter.enemyGroups, enemies, map);
  }, [encounter, selectedMapId, battleMaps, enemies]);

  // ── Deploy encounter to map ──
  const handleDeploy = useCallback(() => {
    if (!encounter || !selectedMapId) return;

    const map = battleMaps.find((m) => m.id === selectedMapId);
    if (!map) return;

    setLaunchStatus("deploying");
    setDeployProgress(0);

    // Use setTimeout to let the UI update before heavy computation
    setTimeout(() => {
      try {
        const placements = calculateTokenPlacements(encounter.enemyGroups, enemies, map);
        const totalTokens = placements.reduce((s, p) => s + p.tokens.length, 0);
        let deployedCount = 0;
        const tokenSources: Array<{ id: string; name: string; type: "enemy" | "npc" | "custom" }> = [];

        for (const placement of placements) {
          const doc = enemies.find((e) => e.id === placement.enemyId);
          const typeColor = doc ? getTypeColor(doc.type) : "#78716c";
          const tokenSize = doc ? getSizeValue(doc.size) : 2;

          for (const pos of placement.tokens) {
            const token = {
              id: generateTokenId(),
              type: "enemy" as const,
              label: doc?.name || "Unknown",
              x: pos.x,
              y: pos.y,
              color: typeColor,
              size: tokenSize,
              visible: true,
              hp: doc ? { current: doc.hitPoints.max, max: doc.hitPoints.max } : undefined,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              statusMarkers: [],
            };
            addMapToken(selectedMapId, token);
            tokenSources.push({ id: token.id, name: token.label, type: "enemy" });
            deployedCount++;
            setDeployProgress(Math.round((deployedCount / totalTokens) * 100));
          }
        }

        // Mark encounter as active
        updateEncounter(encounter.id, { isActive: true, updatedAt: Date.now() });

        setDeployProgress(100);
        setDeployedTokenSources(tokenSources);
        setLaunchStatus("deployed");

        // Don't auto-navigate — let DM choose what to do next
      } catch (err) {
        console.error("Encounter deploy failed:", err);
        setLaunchStatus("error");
      }
    }, 100);
  }, [encounter, selectedMapId, battleMaps, enemies, addMapToken, updateEncounter, navigate, onClose, resetState]);

  // ── Quick-launch: auto-select the first map and deploy ──
  const handleQuickLaunch = useCallback(() => {
    if (availableMaps.length === 1) {
      setSelectedMapId(availableMaps[0].id);
      setTimeout(() => handleDeploy(), 50);
    }
  }, [availableMaps, handleDeploy]);

  if (!isOpen || !encounter) return null;

  const totalEnemies = encounter.enemyGroups.reduce((s, g) => s + g.count, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: "fade-in 0.15s ease-out both" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={launchStatus === "select" ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5),0_0_40px_rgba(234,179,8,0.02)] overflow-hidden"
        style={{ animation: "slide-in-up 0.25s ease-out both" }}
        role="dialog"
        aria-modal="true"
        aria-label="Launch Encounter"
      >
        {/* Top edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none z-10" />

        {/* ── HEADER ── */}
        <div className="relative z-[1] p-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-sm">
                ⚔
              </div>
              <div>
                <h2 className="text-[11px] font-bold text-white/80 uppercase tracking-[0.08em]">
                  Launch Encounter
                </h2>
                <p className="text-[8px] text-surface-500 mt-0.5">
                  Deploy <span className="text-gold-400/80">{encounter.name}</span> to a battle map
                </p>
              </div>
            </div>
            {launchStatus === "select" && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 hover:bg-gold-500/8 active:scale-90 transition-all duration-200 flex items-center justify-center"
                aria-label="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Encounter summary */}
          <div className="flex items-center gap-2 mt-2.5 text-[8px] text-surface-500">
            <span className="tabular-nums">{totalEnemies} enemy{totalEnemies !== 1 ? "ies" : ""}</span>
            <span className="text-surface-700">·</span>
            <span className="tabular-nums">{encounter.enemyGroups.length} group{encounter.enemyGroups.length !== 1 ? "s" : ""}</span>
            {encounter.environment && (
              <>
                <span className="text-surface-700">·</span>
                <span>{encounter.environment}</span>
              </>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="relative z-[1] p-4 space-y-3">
          {launchStatus === "select" && (
            <>
              {/* No maps warning */}
              {availableMaps.length === 0 && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center space-y-2">
                  <span className="text-lg">🗺</span>
                  <p className="text-[10px] text-amber-400/80">
                    No battle maps found. Create a map first to deploy this encounter.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      resetState();
                      navigate("/campaign/maps");
                    }}
                    className="px-4 py-1.5 rounded-lg text-[9px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 transition-all duration-150"
                  >
                    Go to Battle Maps
                  </button>
                </div>
              )}

              {/* Map selector */}
              {availableMaps.length > 0 && (
                <>
                  <p className="text-[9px] text-surface-500 uppercase tracking-wider font-bold">
                    Select Target Map
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-gold">
                    {availableMaps.map((map, idx) => {
                      const isSelected = selectedMapId === map.id;
                      return (
                        <button
                          key={map.id}
                          onClick={() => setSelectedMapId(map.id)}
                          className={`w-full text-left relative rounded-xl p-2.5 transition-all duration-200 ${
                            isSelected
                              ? "bg-gradient-to-b from-gold-500/10 to-gold-500/5 border border-gold-500/25 shadow-[0_0_12px_rgba(234,179,8,0.04)]"
                              : "bg-gradient-to-b from-[#14151f]/60 to-[#0f1019]/70 border border-white/[0.04] hover:border-white/[0.10] hover:-translate-y-0.5"
                          }`}
                          style={{ animation: `slide-in-up 0.2s ease-out ${idx * 0.04}s both` }}
                        >
                          <div className={`absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent transition-all duration-300 ${
                            isSelected ? "via-gold-500/25" : ""
                          }`} />

                          <div className="flex items-center gap-2">
                            <span className="text-lg">🗺</span>
                            <div className="flex-1 min-w-0">
                              <div className={`text-[10px] font-semibold truncate ${isSelected ? "text-gold-400" : "text-surface-200"}`}>
                                {map.name}
                              </div>
                              <div className="text-[8px] text-surface-500 mt-0.5">
                                {map.gridWidth}×{map.gridHeight} · {map.gridSize}px cells
                              </div>
                            </div>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_6px_rgba(234,179,8,0.4)]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Token placement preview */}
                  {placementPreview && placementPreview.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#07080d]/70 border border-white/[0.04]">
                      <p className="text-[8px] text-surface-600 uppercase tracking-wider mb-1.5 font-bold">
                        Token Placement Preview
                      </p>
                      <div className="space-y-1">
                        {placementPreview.map((p) => {
                          const doc = enemies.find((e) => e.id === p.enemyId);
                          return (
                            <div key={p.enemyId} className="flex items-center gap-2 text-[9px]">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: doc ? getTypeColor(doc.type) : "#78716c" }}
                              />
                              <span className="text-surface-400 flex-1 truncate">{doc?.name || "Unknown"}</span>
                              <span className="text-surface-600 tabular-nums">{p.tokens.length} token{p.tokens.length !== 1 ? "s" : ""}</span>
                              <span className="text-surface-700">·</span>
                              <span className="text-surface-600 tabular-nums">({p.tokens[0]?.x ?? 0},{p.tokens[0]?.y ?? 0})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Deploy button */}
                  <button
                    onClick={handleDeploy}
                    disabled={!selectedMapId}
                    className="w-full py-2.5 rounded-xl text-[10px] font-bold bg-gradient-to-br from-emerald-500/15 to-green-500/10 border border-emerald-500/25 text-emerald-400 hover:from-emerald-500/25 hover:to-green-500/15 hover:border-emerald-500/35 hover:shadow-[0_0_24px_rgba(52,211,153,0.08)] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <span>▶</span>
                    <span>Deploy {totalEnemies} Enemy{totalEnemies !== 1 ? "ies" : ""}</span>
                  </button>
                </>
              )}
            </>
          )}

          {/* ── DEPLOYING STATUS ── */}
          {launchStatus === "deploying" && (
            <div className="py-6 space-y-4 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-gold-500/20" />
                <div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold-500"
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-lg">⚔</span>
              </div>
              <p className="text-[11px] text-white/60 font-medium">Deploying to Battle Map...</p>
              <div className="w-full max-w-[200px] mx-auto h-1.5 rounded-full bg-[#07080d] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-gold-500 transition-all duration-300 ease-out"
                  style={{ width: `${deployProgress}%` }}
                />
              </div>
              <p className="text-[8px] text-surface-600">{deployProgress}% complete</p>
            </div>
          )}

          {/* ── DEPLOYED SUCCESS ── */}
          {launchStatus === "deployed" && (
            <div className="py-4 space-y-4 text-center">
              <div
                className="relative w-14 h-14 mx-auto"
                style={{ animation: "slide-in-up 0.3s ease-out both" }}
              >
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-emerald-500/15" />
                <span className="absolute inset-0 flex items-center justify-center text-xl">✨</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-bold">Enemy tokens deployed!</p>
              <p className="text-[8px] text-surface-500">
                {deployedTokenSources.length} tokens placed on map
              </p>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowInitiativeRoll(true)}
                  className="w-full py-2.5 rounded-xl text-[10px] font-bold bg-gradient-to-br from-gold-500/15 to-amber-500/10 border border-gold-500/25 text-gold-400 hover:from-gold-500/25 hover:to-amber-500/15 hover:border-gold-500/35 hover:shadow-[0_0_24px_rgba(234,179,8,0.06)] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
                >
                  <span>🎲</span>
                  <span>Roll Initiative</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    resetState();
                    navigate("/campaign/maps");
                  }}
                  className="w-full py-2 rounded-xl text-[9px] font-bold bg-gradient-to-br from-blue-500/10 to-indigo-500/8 border border-blue-500/20 text-blue-400 hover:from-blue-500/20 hover:to-indigo-500/12 hover:border-blue-500/30 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
                >
                  <span>🗺</span>
                  <span>Go to Battle Maps</span>
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {launchStatus === "error" && (
            <div className="py-4 space-y-3 text-center">
              <span className="text-2xl">⚠️</span>
              <p className="text-[10px] text-rose-400">Failed to deploy encounter</p>
              <p className="text-[8px] text-surface-500">Check the console for details and try again.</p>
              <button
                onClick={() => setLaunchStatus("select")}
                className="px-4 py-1.5 rounded-lg text-[9px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 transition-all duration-150"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Initiative Roll Overlay ── */}
      {deployedTokenSources.length > 0 && (
        <InitiativeRollOverlay
          tokens={deployedTokenSources}
          isOpen={showInitiativeRoll}
          onClose={() => setShowInitiativeRoll(false)}
          onConfirmed={() => {
            onClose();
            resetState();
          }}
          encounterName={encounter?.name || "Encounter"}
        />
      )}
    </div>
  );
}
