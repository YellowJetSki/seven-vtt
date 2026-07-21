/**
 * ST VTT — DM Social Interaction & Monster Knowledge Popover
 *
 * A globally accessible tool for D&D 5.5e social encounter management.
 * Implements the DMG page 244-245 social interaction rules:
 *   - Creature attitude (Friendly / Indifferent / Hostile)
 *   - Starting attitude based on creature type
 *   - DC shifts for roleplaying (charms, aid, etc.)
 *   - Initial attitude reaction roll (d20 + CHA mod vs DC thresholds)
 *
 * Also serves as a Monster Knowledge Reference — when the party
 * encounters an unknown creature, the DM looks up its type/CR
 * and the Knowledge Check section shows what the party would know
 * based on their Arcana/Nature/Religion roll.
 *
 * Deployed: https://arkla.vercel.app
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUIStore } from "@/stores/uiStore";
import PremiumIcon from "@/components/ui/PremiumIcon";
import type { EnemyDoc, CreatureType } from "@/types/enemy";

// ── Creature Type → Starting Attitude (DMG pg. 244) ──
const TYPE_TO_ATTITUDE: Record<string, "friendly" | "indifferent" | "hostile"> = {
  Celestial: "friendly",
  Beast: "indifferent",
  Humanoid: "indifferent",
  Fey: "indifferent",
  Giant: "indifferent",
  Construct: "indifferent",
  Plant: "indifferent",
  Dragon: "hostile",
  Fiend: "hostile",
  Undead: "hostile",
  Aberration: "hostile",
  Monstrosity: "hostile",
  Ooze: "hostile",
  Elemental: "indifferent",
  Custom: "indifferent",
};

const ATTITUDE_LABELS: Record<string, string> = {
  friendly: "Friendly",
  indifferent: "Indifferent",
  hostile: "Hostile",
};

const ATTITUDE_COLORS: Record<string, string> = {
  friendly: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15",
  indifferent: "text-amber-400 bg-amber-500/10 border-amber-500/15",
  hostile: "text-rose-400 bg-rose-500/10 border-rose-500/15",
};

const ATTITUDE_ICONS: Record<string, string> = {
  friendly: "🤝",
  indifferent: "😐",
  hostile: "⚔️",
};

// ── DC Shifts (DMG pg. 245) ──
const DC_SHIFTS: Array<{
  label: string;
  friendlyDC: number;
  indifferentDC: number;
  hostileDC: number;
}> = [
  { label: "Willing to help", friendlyDC: 0, indifferentDC: 10, hostileDC: 20 },
  { label: "Give crucial info", friendlyDC: 10, indifferentDC: 20, hostileDC: 25 },
  { label: "Make major sacrifice", friendlyDC: 15, indifferentDC: 25, hostileDC: 30 },
];

// ── Knowledge Check Lore (CR-based tiers) ──
const KNOWLEDGE_TIERS = [
  { label: "Common Knowledge", minCR: 0, maxCR: 2, description: "Basic rumors and common tales" },
  { label: "Uncommon Lore", minCR: 3, maxCR: 5, description: "Known to scholars and sages" },
  { label: "Rare Knowledge", minCR: 6, maxCR: 10, description: "Ancient texts and hidden records" },
  { label: "Very Rare Lore", minCR: 11, maxCR: 15, description: "Forgotten secrets, only in myth" },
  { label: "Legendary Mystery", minCR: 16, maxCR: 30, description: "Beyond mortal understanding" },
];

const SKILL_TO_TYPE: Record<string, CreatureType[]> = {
  arcana: ["Aberration", "Construct", "Dragon", "Elemental"],
  nature: ["Beast", "Giant", "Monstrosity", "Ooze", "Plant"],
  religion: ["Celestial", "Fiend", "Undead"],
  history: ["Humanoid", "Fey", "Custom"],
};

function getKnowledgeDC(tierIndex: number): number {
  return 10 + tierIndex * 5; // 10, 15, 20, 25, 30
}

function getKnowledgeDescription(type: CreatureType, cr: number): string {
  const tier = KNOWLEDGE_TIERS.find((t) => cr >= t.minCR && cr <= t.maxCR) || KNOWLEDGE_TIERS[KNOWLEDGE_TIERS.length - 1];
  const tierIdx = KNOWLEDGE_TIERS.indexOf(tier);
  const dc = getKnowledgeDC(tierIdx);

  let skill = "Nature";
  for (const [s, types] of Object.entries(SKILL_TO_TYPE)) {
    if (types.includes(type)) { skill = capitalizeFirst(s); break; }
  }

  const tierName = tier.label;
  return `${skill} DC ${dc} (${tierName})`;
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Monster Lore snippets ──
function generateMonsterLore(type: CreatureType, name: string, cr: number): string[] {
  const tier = KNOWLEDGE_TIERS.find((t) => cr >= t.minCR && cr <= t.maxCR) || KNOWLEDGE_TIERS[KNOWLEDGE_TIERS.length - 1];
  const tierIdx = KNOWLEDGE_TIERS.indexOf(tier);
  const dc = getKnowledgeDC(tierIdx);

  const lores: string[] = [];

  // DC 10: basic info
  lores.push(`DC ${dc - 5 < 10 ? 10 : dc - 5}: "You recall basic tales of ${name} — a ${type.toLowerCase()} of considerable danger."`);

  // DC 10-15: abilities
  lores.push(`DC ${dc}: "${name} are known for their natural defenses — tough hide, keen senses, and a territorial nature."`);

  // Higher DCs for specialized knowledge
  if (tierIdx >= 1) {
    lores.push(`DC ${dc + 5}: "Rumored to have ${cr >= 10 ? "resistance to common weaponry" : "a vulnerability to certain elements"}, making them unpredictable."`);
  }
  if (tierIdx >= 2) {
    lores.push(`DC ${dc + 10}: "Ancient songs speak of their kind — their lairs hold ${cr >= 15 ? "priceless treasure" : "valuable hoards"}, but claiming them is death."`);
  }

  return lores;
}

function getModNumber(score: number): number {
  return Math.floor((score - 10) / 2);
}

function getKCSkillIcon(skill: string): string {
  const icons: Record<string, string> = { arcana: "🔮", nature: "🌿", religion: "⛪", history: "📜" };
  return icons[skill.toLowerCase()] || "❓";
}

export default function DmSocialInteractionPopover() {
  const showSocial = useUIStore((s) => s.showSocialInteraction);
  const setSocial = useUIStore((s) => s.setSocialInteraction);
  const enemies = useCampaignStore((s) => s.enemies);
  const characters = useCampaignStore((s) => s.characters);

  const [activeTab, setActiveTab] = useState<"social" | "knowledge">("social");

  // ── Social Interaction State ──
  const [attitude, setAttitude] = useState<"friendly" | "indifferent" | "hostile">("indifferent");
  const [selectedCreatureType, setSelectedCreatureType] = useState<string>("Humanoid");
  const [partyCharmMod, setPartyCharmMod] = useState<number>(0);
  const [hasOfferedBribe, setHasOfferedBribe] = useState(false);
  const [hasUsedThreat, setHasUsedThreat] = useState(false);
  const [rollResult, setRollResult] = useState<number | null>(null);

  // ── Knowledge Check State ──
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(null);
  const [kcRoll, setKcRoll] = useState<number | null>(null);
  const [kcBonus, setKcBonus] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [animPhase, setAnimPhase] = useState<"entering" | "visible" | "exiting">("entering");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSocial) {
      setAnimPhase("entering");
      requestAnimationFrame(() => setAnimPhase("visible"));
    } else {
      setAnimPhase("exiting");
    }
  }, [showSocial]);

  useEffect(() => {
    if (!showSocial) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showSocial]);

  const handleClose = useCallback(() => {
    setAnimPhase("exiting");
    setTimeout(() => {
      setSocial(false);
      setRollResult(null);
      setKcRoll(null);
    }, 150);
  }, [setSocial]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  }, [handleClose]);

  // ── Social Interaction ──
  const startingAttitude = useMemo(() => {
    return TYPE_TO_ATTITUDE[selectedCreatureType] || "indifferent";
  }, [selectedCreatureType]);

  const effectiveDC = useMemo(() => {
    let dc = 15; // base indifferent DC
    if (attitude === "friendly") dc = 10;
    else if (attitude === "hostile") dc = 20;

    if (hasOfferedBribe) dc -= 5;
    if (hasUsedThreat) dc += 5;

    return Math.max(5, Math.min(30, dc));
  }, [attitude, hasOfferedBribe, hasUsedThreat]);

  const handleRollSocial = useCallback(() => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + partyCharmMod;
    setRollResult(total);
  }, [partyCharmMod]);

  const socialPass = useMemo(() => {
    if (rollResult === null) return null;
    return rollResult >= effectiveDC;
  }, [rollResult, effectiveDC]);

  // ── Knowledge Check ──
  const selectedEnemy = useMemo(() => {
    if (!selectedEnemyId) return null;
    return enemies.find((e) => e.id === selectedEnemyId) || null;
  }, [selectedEnemyId, enemies]);

  const filteredEnemies = useMemo(() => {
    if (!searchQuery) return enemies;
    const q = searchQuery.toLowerCase();
    return enemies.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q)
    );
  }, [enemies, searchQuery]);

  const knowledgesForEnemy = useMemo(() => {
    if (!selectedEnemy) return [];
    return generateMonsterLore(selectedEnemy.type, selectedEnemy.name, selectedEnemy.challengeRating);
  }, [selectedEnemy]);

  const knowledgeDC = useMemo(() => {
    if (!selectedEnemy) return 0;
    const cr = selectedEnemy.challengeRating;
    const tier = KNOWLEDGE_TIERS.find((t) => cr >= t.minCR && cr <= t.maxCR) || KNOWLEDGE_TIERS[KNOWLEDGE_TIERS.length - 1];
    const tierIdx = KNOWLEDGE_TIERS.indexOf(tier);
    return getKnowledgeDC(tierIdx);
  }, [selectedEnemy]);

  const kcResult = useMemo(() => {
    if (kcRoll === null || !selectedEnemy) return null;
    return kcRoll + kcBonus;
  }, [kcRoll, kcBonus, selectedEnemy]);

  const kcPassed = useMemo(() => {
    if (kcResult === null) return null;
    return kcResult >= knowledgeDC;
  }, [kcResult, knowledgeDC]);

  const kcSkill = useMemo(() => {
    if (!selectedEnemy) return "Nature";
    for (const [s, types] of Object.entries(SKILL_TO_TYPE)) {
      if (types.includes(selectedEnemy.type)) return capitalizeFirst(s);
    }
    return "Nature";
  }, [selectedEnemy]);

  if (!showSocial && animPhase !== "entering") return null;

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        animPhase === "visible" ? "pointer-events-auto" : "pointer-events-none"
      }`}
      onClick={handleBackdropClick}
    >
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${animPhase === "visible" ? "opacity-100" : "opacity-0"}`} />

      <div className={`relative w-[680px] max-w-[95vw] max-h-[85vh] overflow-y-auto bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3)] ${
        animPhase === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <PremiumIcon name="heart" className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-50">Social Interaction & Knowledge</h2>
              <p className="text-[10px] text-surface-500">DMG social encounter rules + monster lore checks</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all duration-150" aria-label="Close">
            <PremiumIcon name="close" className="w-3.5 h-3.5 text-surface-500" />
          </button>
        </div>

        {/* ── TAB BAR ── */}
        <div className="flex gap-1 px-5 pt-3 pb-2 border-b border-white/[0.04]">
          <button
            onClick={() => setActiveTab("social")}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all duration-150 active:scale-90 ${
              activeTab === "social"
                ? "bg-gold-500/12 text-gold-300 border border-gold/20"
                : "text-surface-400 border border-white/[0.04] hover:border-white/[0.08]"
            }`}
          >
            💬 Social Interaction
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all duration-150 active:scale-90 ${
              activeTab === "knowledge"
                ? "bg-gold-500/12 text-gold-300 border border-gold/20"
                : "text-surface-400 border border-white/[0.04] hover:border-white/[0.08]"
            }`}
          >
            📖 Monster Knowledge
          </button>
        </div>

        <div className="p-5 space-y-4">
          {activeTab === "social" && (
            <>
              {/* ── Creature Type / Starting Attitude ── */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-surface-500 font-bold mb-1.5 block">Creature Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(TYPE_TO_ATTITUDE).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedCreatureType(t);
                        setAttitude(TYPE_TO_ATTITUDE[t]);
                        setRollResult(null);
                      }}
                      className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all duration-150 active:scale-90 ${
                        selectedCreatureType === t
                          ? "bg-gold-500/12 text-gold-300 border border-gold/20"
                          : "bg-white/[0.02] text-surface-400 border border-white/[0.04] hover:bg-white/[0.04]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Attitude Display ── */}
              <div className="flex items-center gap-3">
                <label className="text-[10px] uppercase tracking-wider text-surface-500 font-bold shrink-0">Attitude</label>
                {(["friendly", "indifferent", "hostile"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => { setAttitude(a); setRollResult(null); }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-150 active:scale-90 ${
                      attitude === a ? ATTITUDE_COLORS[a] : "text-surface-500 border border-white/[0.03] hover:border-white/[0.06]"
                    }`}
                  >
                    {ATTITUDE_ICONS[a]} {ATTITUDE_LABELS[a]}
                  </button>
                ))}
                <div className="text-[9px] text-surface-500 italic">
                  Starting: {ATTITUDE_ICONS[startingAttitude]} {ATTITUDE_LABELS[startingAttitude]}
                </div>
              </div>

              {/* ── DC Shifts ── */}
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-gold-400 font-bold">DC Shifts</span>
                  <span className="text-[8px] text-surface-600">(DMG pg. 245)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className="text-surface-600 uppercase tracking-wider">
                        <th className="text-left py-1 pr-2 font-medium">Request</th>
                        <th className="text-center px-1 py-1 font-medium text-emerald-400">Friendly</th>
                        <th className="text-center px-1 py-1 font-medium text-amber-400">Indifferent</th>
                        <th className="text-center px-1 py-1 font-medium text-rose-400">Hostile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DC_SHIFTS.map((shift) => {
                        let currentDC = attitude === "friendly" ? shift.friendlyDC : attitude === "indifferent" ? shift.indifferentDC : shift.hostileDC;
                        if (hasOfferedBribe) currentDC = Math.max(0, currentDC - 5);
                        if (hasUsedThreat) currentDC = Math.min(30, currentDC + 5);
                        return (
                          <tr key={shift.label} className="border-t border-white/[0.03]">
                            <td className="py-1 pr-2 text-white/70">{shift.label}</td>
                            <td className="text-center px-1 py-1 font-mono font-bold text-emerald-400">{shift.friendlyDC}</td>
                            <td className="text-center px-1 py-1 font-mono font-bold text-amber-400">{shift.indifferentDC}</td>
                            <td className="text-center px-1 py-1 font-mono font-bold text-rose-400">{shift.hostileDC}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Modifiers ── */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-surface-500">Party CHA mod:</label>
                  <input
                    type="number"
                    value={partyCharmMod}
                    onChange={(e) => setPartyCharmMod(parseInt(e.target.value) || 0)}
                    className="w-12 bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1 text-[11px] text-white/80 text-center focus:outline-none focus:border-gold-500/25"
                  />
                </div>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={hasOfferedBribe} onChange={(e) => setHasOfferedBribe(e.target.checked)} className="w-3 h-3 rounded border-white/[0.1] bg-surface-800/60 text-gold-500" />
                  <span className="text-[10px] text-surface-400">💰 Bribe offered (-5 DC)</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={hasUsedThreat} onChange={(e) => setHasUsedThreat(e.target.checked)} className="w-3 h-3 rounded border-white/[0.1] bg-surface-800/60 text-rose-500" />
                  <span className="text-[10px] text-surface-400">⚔️ Threat used (+5 DC)</span>
                </label>
              </div>

              {/* ── Current DC Display & Roll ── */}
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-surface-500 font-bold">Effective DC: </span>
                    <span className="text-lg font-bold font-mono text-amber-400">{effectiveDC}</span>
                    <span className="text-[9px] text-surface-500 ml-2 italic">
                      ({attitude === "friendly" ? "Willing to help" : attitude === "indifferent" ? "Neutral" : "Defensive"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRollSocial}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/12 text-gold-400 border border-gold/20 hover:bg-gold-500/18 active:scale-90 transition-all duration-150"
                    >
                      🎲 Roll Persuasion (d20 + {partyCharmMod >= 0 ? "+" : ""}{partyCharmMod})
                    </button>
                  </div>
                </div>
                {rollResult !== null && (
                  <div className={`mt-2 px-3 py-2 rounded-lg text-[11px] font-bold ${socialPass ? "bg-emerald-500/8 text-emerald-400 border border-emerald-500/10" : "bg-rose-500/8 text-rose-400 border border-rose-500/10"}`}>
                    <span className="font-mono">{rollResult}</span> vs DC {effectiveDC} →{" "}
                    {socialPass ? "✅ SUCCESS — The creature is receptive" : "❌ FAILURE — The creature is unmoved"}
                    {!socialPass && hasUsedThreat && <span className="text-[9px] text-rose-500 block mt-0.5">Threat may worsen attitude — consider a different approach</span>}
                  </div>
                )}
              </div>

              {/* ── Rules Reference ── */}
              <details className="text-[9px] text-surface-500">
                <summary className="cursor-pointer hover:text-surface-400 transition-colors">📖 Social Interaction Rules (DMG pg. 244-245)</summary>
                <div className="mt-1 pl-2 border-l border-white/[0.06] space-y-0.5">
                  <p><strong className="text-white/60">Starting Attitude:</strong> Determined by creature type or DM ruling.</p>
                  <p><strong className="text-white/60">Friendly:</strong> Wants to help. DC 0 for simple tasks, DC 10 for risky, DC 15 for major sacrifice.</p>
                  <p><strong className="text-white/60">Indifferent:</strong> Neutral. DC 10 for help, DC 20 for crucial info, DC 25 for sacrifice.</p>
                  <p><strong className="text-white/60">Hostile:</strong> Openly opposed. DC 20 for help, DC 25 for info, DC 30 for sacrifice.</p>
                  <p><strong className="text-white/60">Shifts:</strong> Charisma checks (Persuasion, Deception, Intimidation) can shift attitude. Success moves one step, failure may worsen. Bribes (-5 DC), Threats (+5 DC).</p>
                </div>
              </details>
            </>
          )}

          {activeTab === "knowledge" && (
            <>
              {/* ── Monster Selector ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-[10px] uppercase tracking-wider text-surface-500 font-bold">Monster</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search monsters..."
                    className="flex-1 bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1 text-[11px] text-white/80 placeholder:text-surface-600 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15"
                  />
                </div>
                {filteredEnemies.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 rounded-xl bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mx-auto mb-2">
                      <PremiumIcon name="search" className="w-5 h-5 text-surface-500" />
                    </div>
                    <p className="text-xs text-surface-500">No monsters in the campaign bestiary</p>
                    <p className="text-[9px] text-surface-600">Create monsters in the Bestiary & Encounters tab</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scrollbar-gold">
                    {filteredEnemies.map((enemy) => (
                      <button
                        key={enemy.id}
                        onClick={() => { setSelectedEnemyId(enemy.id); setKcRoll(null); }}
                        className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all duration-150 active:scale-90 ${
                          selectedEnemyId === enemy.id
                            ? "bg-gold-500/12 text-gold-300 border border-gold/20"
                            : "bg-white/[0.02] text-surface-400 border border-white/[0.04] hover:bg-white/[0.04]"
                        }`}
                      >
                        {enemy.name} <span className="text-[7px] text-surface-500">(CR {enemy.challengeRating} {enemy.type})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedEnemy && (
                <>
                  {/* ── Monster Stats ── */}
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white/[0.02] border border-white/[0.04] rounded-xl px-3 py-2">
                      <div className="text-[9px] text-surface-500">{selectedEnemy.name}</div>
                      <div className="text-[11px] text-white/80 font-bold">{selectedEnemy.type} · CR {selectedEnemy.challengeRating}</div>
                      <div className="text-[9px] text-surface-500 mt-0.5">AC {selectedEnemy.armorClass} · HP {selectedEnemy.hitPoints.max} · Speed {selectedEnemy.speed}ft</div>
                    </div>
                    <div className="flex-1 bg-white/[0.02] border border-white/[0.04] rounded-xl px-3 py-2">
                      <div className="text-[9px] text-surface-500">Knowledge Check</div>
                      <div className="text-[11px] text-white/80 font-bold">{getKCSkillIcon(kcSkill)} {kcSkill} · DC {knowledgeDC}</div>
                      <div className="text-[9px] text-surface-500 mt-0.5">{KNOWLEDGE_TIERS.find(t => selectedEnemy.challengeRating >= t.minCR && selectedEnemy.challengeRating <= t.maxCR)?.label || "Unknown"}</div>
                    </div>
                  </div>

                  {/* ── Roll Knowledge Check ── */}
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-surface-500">Bonus:</label>
                      <input
                        type="number"
                        value={kcBonus}
                        onChange={(e) => setKcBonus(parseInt(e.target.value) || 0)}
                        className="w-14 bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1 text-[11px] text-white/80 text-center focus:outline-none focus:border-gold-500/25"
                      />
                      <button
                        onClick={() => {
                          const roll = Math.floor(Math.random() * 20) + 1;
                          setKcRoll(roll);
                        }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/12 text-gold-400 border border-gold/20 hover:bg-gold-500/18 active:scale-90 transition-all duration-150"
                      >
                        🎲 Roll {kcSkill} (d20 + {kcBonus >= 0 ? "+" : ""}{kcBonus})
                      </button>
                    </div>

                    {kcRoll !== null && kcResult !== null && (
                      <div className={`mt-2 px-3 py-2 rounded-lg text-[11px] ${kcPassed ? "bg-emerald-500/8 border border-emerald-500/10" : "bg-rose-500/8 border border-rose-500/10"}`}>
                        <span className="font-bold font-mono">{kcResult}</span> vs DC {knowledgeDC} →{" "}
                        <span className={kcPassed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {kcPassed ? "✅ Known" : "❌ Unknown"}
                        </span>
                        {kcPassed && (
                          <div className="mt-1.5 space-y-0.5">
                            {knowledgesForEnemy.map((lore, i) => (
                              <p key={i} className="text-[10px] text-surface-400">{lore}</p>
                            ))}
                          </div>
                        )}
                        {!kcPassed && kcResult !== null && (
                          <p className="text-[9px] text-surface-500 mt-1">The party recalls nothing about this creature. Try a different skill or seek a sage.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Lore Tiers Reference ── */}
                  <details className="text-[9px] text-surface-500">
                    <summary className="cursor-pointer hover:text-surface-400 transition-colors">📖 Knowledge Check Tiers</summary>
                    <div className="mt-1 pl-2 border-l border-white/[0.06] space-y-0.5">
                      {KNOWLEDGE_TIERS.map((tier, i) => {
                        const dc = getKnowledgeDC(i);
                        return (
                          <p key={tier.label}>
                            <strong className="text-white/60">DC {dc} ({tier.label}):</strong> {tier.description}
                          </p>
                        );
                      })}
                    </div>
                  </details>
                </>
              )}
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-5 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[8px] text-surface-600">DMG pg. 244-245 Social Interaction · Monster Manual knowledge check rules</span>
          <span className="text-[7px] text-surface-700">Press Esc to close</span>
        </div>
      </div>
    </div>
  );
}
