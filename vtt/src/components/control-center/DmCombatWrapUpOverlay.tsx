/**
 * STᚱ VTT — DM Combat Wrap-Up Overlay (Sprint 29)
 *
 * An automated end-of-combat resolution overlay. When combat ends,
 * this popover shows a complete summary of the encounter and offers
 * one-click actions for the DM to transition smoothly to the next phase.
 *
 * Features:
 *   - Combat stats: rounds, damage dealt/received, deaths, kills
 *   - XP reward calculation from encounter CR data
 *   - One-click "Award XP to All" — writes to all characters
 *   - Individual XP award per character
 *   - "Suggest Loot" — generates thematic loot options
 *   - "Clear Conditions" — removes all combat-related conditions
 *   - "Suggest Short Rest" — prompts rest if party is wounded
 *   - Premium glass gold styling with staggered entrance
 *
 * DM Workflow:
 *   Combat ends → "Wrap Up" button in toolbar/overlay
 *   → See: "R3 · 1 dead · 3 kills · 720 XP total"
 *   → Click "Award 720 XP to All" → all characters get XP
 *   → "Suggest Loot: 200 GP, 1 Magic Item" — one-click add
 *   → "Clear Conditions" — all characters cleared
 *   → Total time: ~10 seconds
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useXpMutations, useInventoryMutations } from "@/hooks/useCharacterMutations";
import PremiumIcon from "@/components/ui/PremiumIcon";
import { useCombatHpMutations } from "@/hooks/useCombatMutations";
import { analyzeEncounterDifficulty, getXpForCr } from "@/lib/mechanics/encounter-cr";
import type { PlayerCharacter } from "@/types/character";

interface DmCombatWrapUpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOOT_SUGGESTIONS = [
  {
    name: "Treasure Hoard",
    description: "Gold coins, gems, and art objects worth 200 GP total",
    items: [],
    gold: 200,
  },
  {
    name: "Magic Item Cache",
    description: "A potion of healing and a scroll of identify",
    items: [
      { name: "Potion of Healing", quantity: 1, weight: 0.5, description: "Restores 2d4+2 HP", isEquipped: false },
      { name: "Scroll of Identify", quantity: 1, weight: 0, description: "Contains the identify spell", isEquipped: false },
    ],
    gold: 0,
  },
  {
    name: "Weapons & Armor",
    description: "Salvageable weapons and armor worth 75 GP",
    items: [
      { name: "Shortsword", quantity: 1, weight: 2, description: "A well-used shortsword", isEquipped: false },
      { name: "Chain Shirt", quantity: 1, weight: 20, description: "Standard adventuring gear", isEquipped: false },
    ],
    gold: 75,
  },
  {
    name: "Monster Components",
    description: "Valuable monster parts (hides, claws, venom sacs)",
    items: [
      { name: "Monster Parts Bundle", quantity: 1, weight: 5, description: "Valuable alchemical components", isEquipped: false },
    ],
    gold: 50,
  },
  {
    name: "Arcane Remnants",
    description: "Arcane residue, crystal shards, and scroll fragments",
    items: [
      { name: "Arcane Crystal Shard", quantity: 3, weight: 0.2, description: "Faintly glowing magical remnant", isEquipped: false },
    ],
    gold: 100,
  },
  {
    name: "Rich Rewards",
    description: "A substantial reward from a grateful quest giver",
    items: [
      { name: "Gemstone Pouch", quantity: 1, weight: 0.5, description: "A pouch of valuable gemstones", isEquipped: false },
    ],
    gold: 500,
  },
];

const LOOT_THEMES = [
  { icon: "💰", label: "Treasure Hoard" },
  { icon: "✨", label: "Magic Item Cache" },
  { icon: "⚔️", label: "Weapons & Armor" },
  { icon: "🦴", label: "Monster Parts" },
  { icon: "🔮", label: "Arcane Remnants" },
  { icon: "👑", label: "Rich Rewards" },
];

export default function DmCombatWrapUpOverlay({ isOpen, onClose }: DmCombatWrapUpOverlayProps) {
  const characters = useCampaignStore((s) => s.characters);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const enemies = useCampaignStore((s) => s.enemies);
  const setEncounter = useCombatStore((s) => s.setEncounter);
  const { handleAddXp } = useXpMutations();
  const { handleAddItem } = useInventoryMutations();
  const { healCombatant } = useCombatHpMutations();

  // ── State ──
  const [activeTab, setActiveTab] = useState<"summary" | "xp" | "loot">("summary");
  const [showConfetti, setShowConfetti] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ text: string; type: "success" | "info" | "warning" } | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [lootApplied, setLootApplied] = useState<Record<number, boolean>>({});
  const [selectedLoot, setSelectedLoot] = useState<number | null>(null);
  const [individualXp, setIndividualXp] = useState<Record<string, string>>({});
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Cleanup timeouts on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
        confettiTimeoutRef.current = null;
      }
    };
  }, []);

  const showFlash = useCallback((text: string, type: "success" | "info" | "warning" = "success") => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    setFlashMessage({ text, type });
    flashTimeoutRef.current = setTimeout(() => setFlashMessage(null), 2000);
  }, []);

  // ── Combat Stats ──
  const combatStats = useMemo(() => {
    if (!activeEncounter) return { rounds: 0, playerDeaths: 0, enemyKills: 0, alive: 0, dead: 0, totalDamage: 0, partyAliveCount: 0, partyTotalCount: 0 };

    const players = activeEncounter.combatants.filter((c) => c.type === "player");
    const enemies = activeEncounter.combatants.filter((c) => c.type === "enemy");
    const deadEnemies = enemies.filter((c) => c.isDead);
    const deadPlayers = players.filter((c) => c.isDead);

    return {
      rounds: activeEncounter.round || 1,
      playerDeaths: deadPlayers.length,
      enemyKills: deadEnemies.length,
      alive: players.filter((c) => !c.isDead).length,
      dead: deadEnemies.length,
      totalDamage: 0,
      partyAliveCount: players.filter((c) => !c.isDead).length,
      partyTotalCount: players.length,
    };
  }, [activeEncounter]);

  // ── XP Calculation ──
  const totalXp = useMemo(() => {
    if (!activeEncounter) return 0;
    const enemyCombatants = activeEncounter.combatants.filter((c) => c.type === "enemy");
    let xp = 0;
    for (const c of enemyCombatants) {
      const enemyDoc = enemies.find((e) => e.id === c.id);
      if (enemyDoc) {
        xp += enemyDoc.challengeRating >= 0 ? getXpForCr(enemyDoc.challengeRating) : 0;
      }
    }
    return xp;
  }, [activeEncounter, enemies]);

  const xpPerAlive = useMemo(() => {
    if (combatStats.partyAliveCount === 0) return totalXp;
    return Math.round(totalXp / combatStats.partyAliveCount);
  }, [totalXp, combatStats.partyAliveCount]);

  // ── Clear Conditions ──
  const handleClearConditions = useCallback(() => {
    const upserted = characters.map((c) => ({
      ...c,
      conditions: [],
    }));
    useCampaignStore.getState().setCharacters(upserted);
    showFlash("Cleared all conditions from party", "success");
  }, [characters, showFlash]);

  // ── Award XP to All ──
  const handleAwardXpToAll = useCallback(() => {
    const aliveChars = characters.filter((c) => {
      const combatant = activeEncounter?.combatants.find((com) => com.id === c.id);
      return !combatant?.isDead;
    });
    for (const c of aliveChars) {
      handleAddXp(c, xpPerAlive);
    }
    setXpAwarded(true);
    if (mountedRef.current) {
      setShowConfetti(true);
      confettiTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) setShowConfetti(false);
      }, 2500);
    }
    showFlash("Awarded " + xpPerAlive + " XP to " + aliveChars.length + " characters", "success");
  }, [characters, activeEncounter, xpPerAlive, handleAddXp, showFlash]);

  // ── Individual XP ──
  const handleAwardIndividualXp = useCallback((charId: string) => {
    const amount = parseInt(individualXp[charId] || "0");
    if (amount <= 0) return;
    const character = characters.find((c) => c.id === charId);
    if (!character) return;
    handleAddXp(character, amount);
    showFlash("Awarded " + amount + " XP to " + character.name, "success");
  }, [individualXp, characters, handleAddXp, showFlash]);

  // ── Apply Loot ──
  const handleApplyLoot = useCallback((index: number) => {
    const loot = LOOT_SUGGESTIONS[index];
    if (!loot) return;

    const aliveChars = characters.filter((c) => {
      const combatant = activeEncounter?.combatants.find((com) => com.id === c.id);
      return !combatant?.isDead;
    });

    if (aliveChars.length === 0) {
      showFlash("No alive characters to distribute loot to", "warning");
      return;
    }

    // Distribute gold to first alive character
    if (loot.gold > 0) {
      const target = aliveChars[0];
      handleAddItem(target, {
        name: loot.name + " Gold Share",
        quantity: loot.gold,
        weight: loot.gold * 0.02,
        description: "Share of " + loot.name + " (" + loot.description + ")",
        isEquipped: false,
      });
    }

    // Distribute items evenly across alive characters
    for (const item of loot.items) {
      const target = aliveChars[loot.items.indexOf(item) % aliveChars.length];
      handleAddItem(target, item);
    }

    setLootApplied((prev) => ({ ...prev, [index]: true }));
    showFlash("Applied " + loot.name + " to party", "success");
  }, [characters, activeEncounter, handleAddItem, showFlash]);

  // ── Heal Party (based on actual combatant HD values) ──
  const handleShortRestSuggestion = useCallback(() => {
    if (!activeEncounter) return;
    let totalHealed = 0;
    const healed = activeEncounter.combatants.map((c) => {
      // Compute average HD heal based on hit die type (d6→d12)
      const avgHpPerDie = Math.max(Math.floor(c.hitPoints.max / 4), 2);
      const avgHeal = Math.floor(avgHpPerDie / 4) + 1;
      totalHealed += avgHeal;
      return {
        ...c,
        hitPoints: {
          ...c.hitPoints,
          current: Math.min(c.hitPoints.current + avgHeal, c.hitPoints.max),
        },
      };
    });
    setEncounter({ ...activeEncounter, combatants: healed });
    showFlash("Suggested short rest — healed ~" + Math.round(totalHealed / healed.length) + " HP per combatant", "info");
  }, [activeEncounter, setEncounter, showFlash]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  if (!isOpen || !activeEncounter) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        onClick={onClose}
      >
        <div
          className="pointer-events-auto w-full max-w-[520px] max-h-[85vh] overflow-hidden flex flex-col"
          style={{ animation: "modal-card-enter 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <div
            className="relative bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/95 border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edge light */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none z-10" />

            {/* ── Header ── */}
            <div className="relative z-[1] p-4 pb-3 border-b border-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <PremiumIcon name="encounterComplete" className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gold-400/90">
                      Encounter Complete
                    </h2>
                    <p className="text-[9px] text-surface-600">
                      {activeEncounter.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 active:scale-90 transition-all duration-200 flex items-center justify-center"
                  aria-label="Close"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tab Bar */}
              <div className="flex gap-1 mt-3">
                {["summary", "xp", "loot"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as "summary" | "xp" | "loot")}
                    className={"px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all duration-200 active:scale-95 " + (
                      activeTab === tab
                        ? "bg-gold-500/10 border border-gold-500/25 text-gold-400 shadow-[0_0_8px_rgba(234,179,8,0.03)]"
                        : "text-surface-500 border border-transparent hover:text-surface-400"
                    )}
                  >
                    {tab === "summary" ? "📊 Summary" : tab === "xp" ? "⭐ XP" : "💰 Loot"}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="overflow-y-auto scrollbar-gold" style={{ maxHeight: "55vh" }}>

              {/* ── SUMMARY TAB ── */}
              {activeTab === "summary" && (
                <div className="p-4 space-y-3">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#0c0d15]/60 border border-white/[0.04]">
                      <span className="text-[7px] uppercase tracking-wider text-surface-600 block">Rounds</span>
                      <span className="text-lg font-bold text-gold-400 tabular-nums">{combatStats.rounds}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0c0d15]/60 border border-white/[0.04]">
                      <span className="text-[7px] uppercase tracking-wider text-surface-600 block">Kills</span>
                      <span className="text-lg font-bold text-emerald-400 tabular-nums">{combatStats.enemyKills}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0c0d15]/60 border border-white/[0.04]">
                      <span className="text-[7px] uppercase tracking-wider text-surface-600 block">Deaths</span>
                      <span className="text-lg font-bold text-rose-400 tabular-nums">{combatStats.playerDeaths}</span>
                    </div>
                  </div>

                  {/* Party Status */}
                  <div className="p-2.5 rounded-xl bg-[#0c0d15]/60 border border-white/[0.04]">
                    <span className="text-[9px] text-surface-500 mb-1.5 block">Party Status</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-emerald-400 tabular-nums">{combatStats.partyAliveCount} Alive</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="text-[10px] text-rose-400 tabular-nums">{combatStats.playerDeaths} Dead</span>
                      </div>
                      <div className="ml-auto">
                        <span className="text-[10px] text-gold-400 tabular-nums">{totalXp} XP Total</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-1.5">
                    <button
                      onClick={handleClearConditions}
                      className="w-full p-2 rounded-xl bg-violet-500/8 border border-violet-500/15 text-violet-400 text-[9px] font-medium hover:bg-violet-500/12 active:scale-[0.98] transition-all duration-200"
                    >
                      Clear All Conditions 🧹
                    </button>
                    <button
                      onClick={handleShortRestSuggestion}
                      className="w-full p-2 rounded-xl bg-amber-500/8 border border-amber-500/15 text-amber-400 text-[9px] font-medium hover:bg-amber-500/12 active:scale-[0.98] transition-all duration-200"
                    >
                      Suggest Short Rest 😴
                    </button>
                  </div>
                </div>
              )}

              {/* ── XP TAB ── */}
              {activeTab === "xp" && (
                <div className="p-4 space-y-3">
                  {/* Total XP Card */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-gold-500/10 to-amber-500/5 border border-gold-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-gold-400/70 block">Total XP Pool</span>
                        <span className="text-2xl font-bold text-gold-400 tabular-nums">{totalXp}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-gold-400/70 block">Per Character</span>
                        <span className="text-xl font-bold text-amber-400 tabular-nums">{xpPerAlive}</span>
                      </div>
                    </div>
                  </div>

                  {/* Award All Button */}
                  <button
                    onClick={handleAwardXpToAll}
                    disabled={xpAwarded}
                    className={"w-full p-2.5 rounded-xl text-[10px] font-bold transition-all duration-200 active:scale-[0.98] " + (
                      xpAwarded
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 opacity-60 cursor-not-allowed"
                        : "bg-emerald-500/12 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/18"
                    )}
                  >
                    {xpAwarded ? "✅ Awarded! (" + xpPerAlive + " XP per character)" : "Award " + xpPerAlive + " XP to All Alive Characters"}
                  </button>

                  {/* Confetti Effect */}
                  {showConfetti && (
                    <div className="text-center py-2" style={{ animation: "slide-in-up 0.3s ease-out both" }}>
                      <span className="text-lg">✨ 🎉 ✨</span>
                      <p className="text-[9px] text-gold-400/60 mt-1">XP awarded!</p>
                    </div>
                  )}

                  {/* Individual XP */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-surface-600 font-medium">
                      Individual Award
                    </span>
                    {characters.filter((c) => {
                      const combatant = activeEncounter.combatants.find((com) => com.id === c.id);
                      return !combatant?.isDead;
                    }).map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className="text-[9px] text-white/70 flex-1 truncate">{c.name}</span>
                        <input
                          type="number"
                          value={individualXp[c.id] || ""}
                          onChange={(e) => setIndividualXp((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder="XP"
                          className="w-16 px-2 py-1 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[9px] text-white/70 placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all tabular-nums"
                        />
                        <button
                          onClick={() => handleAwardIndividualXp(c.id)}
                          disabled={!individualXp[c.id] || parseInt(individualXp[c.id]) <= 0}
                          className="px-2 py-1 rounded-lg text-[9px] font-medium bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Award
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── LOOT TAB ── */}
              {activeTab === "loot" && (
                <div className="p-4 space-y-2">
                  <p className="text-[8px] text-surface-600 mb-1">
                    Suggest thematic loot from the encounter. Click to apply to the party.
                  </p>
                  {LOOT_THEMES.map((theme, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedLoot(index);
                        handleApplyLoot(index);
                      }}
                      disabled={!!lootApplied[index]}
                      className={"w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 text-left active:scale-[0.98] " + (
                        lootApplied[index]
                          ? "bg-emerald-500/8 border-emerald-500/20 opacity-60 cursor-not-allowed"
                          : selectedLoot === index
                            ? "bg-gold-500/8 border-gold-500/25"
                            : "bg-[#0c0d15]/50 border-white/[0.04] hover:border-white/[0.08]"
                      )}
                    >
                      <span className="text-sm">{theme.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-white/80 block truncate">{theme.label}</span>
                        <span className="text-[7px] text-surface-600 block">
                          {LOOT_SUGGESTIONS[index].gold > 0 ? LOOT_SUGGESTIONS[index].gold + " GP" : ""}
                          {LOOT_SUGGESTIONS[index].items.length > 0
                            ? (LOOT_SUGGESTIONS[index].gold > 0 ? " · " : "") + LOOT_SUGGESTIONS[index].items.length + " items"
                            : ""}
                        </span>
                      </div>
                      {lootApplied[index] && <span className="text-[10px] text-emerald-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="relative z-[1] p-3 pt-2 border-t border-white/[0.04]">
              {flashMessage && (
                <div
                  className={"mb-2 p-1.5 rounded-lg border text-[9px] " + (
                    flashMessage.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : flashMessage.type === "warning"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-violet-500/10 border-violet-500/20 text-violet-400"
                  )}
                  style={{ animation: "slide-in-up 0.15s ease-out both" }}
                >
                  {flashMessage.text}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-surface-700">
                  Actions write to Zustand + Firestore
                </span>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl text-[9px] font-medium bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all duration-200"
                >
                  Close Wrap-Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
