/**
 * STᚱ VTT — Encounter Panel (DM Combat Command)
 *
 * DM's operational encounter builder with:
 * - Encounter creation with name + optional description
 * - Difficulty calculator (Easy → Deadly) based on party config
 * - XP totals, CR range, HP totals per encounter
 * - Enemy group breakdown with type icons
 * - Duplicate and delete actions
 * - Party configuration popover (size + avg level)
 * - Map population with token placement + combat tracker sync
 *
 * All mutations route through useCombatEncounterMutations hooks,
 * which write to BOTH Zustand (instant) and Firestore (real-time sync).
 */

import { useState, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatEncounterMutations } from "@/hooks/useCombatMutations";
import {
  analyzeEncounterDifficulty,
  DEFAULT_PARTY_CONFIG,
  type PartyConfig,
} from "@/lib/mechanics/encounter-cr";
import EncounterPanelHeader from "./EncounterPanelHeader";
import EncounterCard from "./EncounterCard";
import EncounterEmptyState from "./EncounterEmptyState";
import EncounterPopulateButton from "./EncounterPopulateButton";
import type { MapToken, Combatant, Encounter } from "@/types";

interface EncounterPanelProps {
  mapId: string;
  onTokensAdded?: (tokens: MapToken[]) => void;
}

export default function EncounterPanel({ mapId, onTokensAdded }: EncounterPanelProps) {
  const encounters = useCampaignStore((s) => s.encounters);
  const enemies = useCampaignStore((s) => s.enemies);
  const addEncounter = useCampaignStore((s) => s.addEncounter);
  const removeEncounter = useCampaignStore((s) => s.removeEncounter);
  const addMapToken = useCampaignStore((s) => s.addMapToken);

  // Centralized combat mutations — writes to Zustand + Firestore
  const { createEncounter: createCombatEncounter, addCombatant } = useCombatEncounterMutations();

  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEncounterName, setNewEncounterName] = useState("");
  const [partyConfig, setPartyConfig] = useState<PartyConfig>(DEFAULT_PARTY_CONFIG);

  const selectedEncounter = encounters.find((e) => e.id === selectedEncounterId);

  // Compute difficulty data for selected encounter
  const difficultyData = useMemo(() => {
    if (!selectedEncounter) return null;
    const crs = selectedEncounter.enemyGroups.flatMap((g) => {
      const enemy = enemies.find((e) => e.id === g.enemyId);
      return enemy ? Array(g.count || 1).fill(enemy.challengeRating) : [];
    });
    return analyzeEncounterDifficulty(crs, partyConfig);
  }, [selectedEncounter, enemies, partyConfig]);

  const totalUnits = useMemo(
    () =>
      selectedEncounter
        ? selectedEncounter.enemyGroups.reduce((sum, g) => sum + (g.count || 1), 0)
        : 0,
    [selectedEncounter]
  );

  const totalHp = useMemo(
    () =>
      selectedEncounter
        ? selectedEncounter.enemyGroups.reduce((sum, g) => {
            const enemy = enemies.find((e) => e.id === g.enemyId);
            return sum + (enemy ? (enemy.hitPoints.max || 10) * (g.count || 1) : 0);
          }, 0)
        : 0,
    [selectedEncounter, enemies]
  );

  // ── Create a new empty encounter ──
  const handleCreateEncounter = useCallback(() => {
    setShowCreateForm(true);
    setNewEncounterName(`Encounter ${encounters.length + 1}`);
  }, [encounters.length]);

  const handleSubmitNewEncounter = useCallback(() => {
    if (!newEncounterName.trim()) return;
    const newEnc: Encounter = {
      id: `enc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newEncounterName.trim(),
      description: "",
      environment: "",
      difficulty: "",
      isActive: false,
      enemyGroups: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addEncounter(newEnc);
    setSelectedEncounterId(newEnc.id);
    setShowCreateForm(false);
    setNewEncounterName("");
  }, [newEncounterName, addEncounter]);

  // ── Duplicate an encounter ──
  const handleDuplicate = useCallback(
    (id: string) => {
      const original = encounters.find((e) => e.id === id);
      if (!original) return;
      const dup: Encounter = {
        ...original,
        id: `enc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: `${original.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addEncounter(dup);
    },
    [encounters, addEncounter]
  );

  // ── Delete an encounter ──
  const handleDelete = useCallback(
    (id: string) => {
      removeEncounter(id);
      if (selectedEncounterId === id) {
        setSelectedEncounterId(null);
      }
    },
    [selectedEncounterId, removeEncounter]
  );

  // ── Populate the battle map ──
  const handlePopulateMap = useCallback(() => {
    if (!selectedEncounter) return;

    setIsPlacing(true);
    const newTokens: MapToken[] = [];

    const cols = Math.ceil(Math.sqrt(selectedEncounter.enemyGroups.length + 1));
    const startX = 5;
    const startY = 5;

    // Create combat encounter in Firestore + Zustand
    const encId = createCombatEncounter(selectedEncounter.name || "Combat Encounter");

    selectedEncounter.enemyGroups.forEach((group, idx) => {
      const enemy = enemies.find((e) => e.id === group.enemyId);
      if (!enemy) return;

      const col = idx % cols;
      const row = Math.floor(idx / cols);

      for (let i = 0; i < (group.count || 1); i++) {
        const tokenId = `token_${Date.now()}_${idx}_${i}`;
        const token: MapToken = {
          id: tokenId,
          type: "enemy",
          label: group.label ? `${group.label} ${i + 1}` : `${enemy.name} ${i + 1}`,
          x: startX + col * 3 + i,
          y: startY + row * 3,
          color: "#ef4444",
          size: 1,
          visible: true,
          icon: "👹",
          hp: { current: enemy.hitPoints.current, max: enemy.hitPoints.max },
          speed: enemy.speed || 30,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        addMapToken(mapId, token);
        newTokens.push(token);

        // Add to Firestore combat tracker
        const combatant: Combatant = {
          id: `combatant_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: group.label ? `${group.label} ${i + 1}` : `${enemy.name} ${i + 1}`,
          type: "enemy",
          initiative: Math.floor(Math.random() * 20) + 1,
          armorClass: enemy.armorClass || 12,
          hitPoints: {
            current: enemy.hitPoints.current,
            max: enemy.hitPoints.max,
            temporary: 0,
          },
          statusEffects: [],
          isDead: false,
          isConcentrating: false,
          notes: "",
        };

        addCombatant(combatant);
      }
    });

    onTokensAdded?.(newTokens);
    setIsPlacing(false);
  }, [selectedEncounter, enemies, mapId, addMapToken, createCombatEncounter, addCombatant, onTokensAdded]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <EncounterPanelHeader
        encounterCount={encounters.length}
        partyConfig={partyConfig}
        onPartyConfigChange={setPartyConfig}
        onCreateEncounter={handleCreateEncounter}
      />

      {/* ── Create Encounter Form ── */}
      {showCreateForm && (
        <div className="mx-2 mb-2 p-2.5 rounded-lg bg-obsidian-mid/90 border border-gold/15 shadow-xl">
          <p className="text-[9px] text-gold-400/60 mb-1.5 uppercase tracking-wider">New Encounter</p>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newEncounterName}
              onChange={(e) => setNewEncounterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmitNewEncounter();
                if (e.key === "Escape") setShowCreateForm(false);
              }}
              placeholder="Encounter name..."
              autoFocus
              className="flex-1 py-1 px-2 rounded text-[10px] bg-[#07080d] border border-white/[0.06] text-white/70 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-600"
            />
            <button
              onClick={handleSubmitNewEncounter}
              className="px-2 py-1 rounded text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-2 py-1 rounded text-[10px] border border-white/[0.06] text-surface-500 hover:text-surface-300 active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Encounter List ── */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {encounters.length === 0 && <EncounterEmptyState />}

        {encounters.map((enc) => (
          <EncounterCard
            key={enc.id}
            encounter={enc}
            enemies={enemies}
            isSelected={selectedEncounterId === enc.id}
            onSelect={setSelectedEncounterId}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            partyConfig={partyConfig}
          />
        ))}
      </div>

      {/* ── Populate Footer ── */}
      <EncounterPopulateButton
        isPlacing={isPlacing}
        hasSelection={!!selectedEncounter}
        onPopulate={handlePopulateMap}
        unitCount={totalUnits}
        totalHp={totalHp}
        totalXp={difficultyData?.totalXp}
        difficulty={difficultyData?.rating}
      />
    </div>
  );
}
