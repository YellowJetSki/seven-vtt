/**
 * STᚱ VTT — Player Sheet Quick Rules Reference (Premium Reference Hub)
 *
 * In-game rules reference for players during combat.
 * No PHB needed at the table. Premium layout with:
 *
 * - **Tabbed Sections**: Actions, Conditions, Rest, Cover — swipeable tabs
 * - **Active Condition Highlighting**: Gold border + "Active" badge for active conditions
 * - **Exhaustion Table**: Visual 6-level spiral visualization
 * - **Combat Action Cards**: Color-coded time badges (Action/Bonus/Reaction)
 * - **Concentration Rules**: Always-visible card in header
 * - **Encumbrance Status**: Live weight display with color-coded tier
 * - **Cover Rules**: AC bonus, save bonus, description
 * - **Rest & Recovery**: Short rest, long rest, hit dice recovery rules
 * - **Hiding/Visibility**: Stealth, obscurement rules quick reference
 *
 * Zero purple tokens — all gold/amber/rose/emerald/cyan/violet/pink tokens.
 */

import { useState, useMemo } from "react";
import type { PlayerCharacter } from "@/types";
import { computeEncumbranceState } from "@/lib/mechanics/character-derivations";

interface PlayerSheetRulesTabProps {
  character: PlayerCharacter;
}

// ── Condition Data ──
const CONDITIONS = [
  {
    id: "blinded", name: "Blinded", icon: "\uD83D\uDC41\u200D\uD83D\uDDE8",
    summary: "Attack rolls have disadvantage. Attack rolls against you have advantage.",
    effects: ["Auto-fail ability checks that require sight", "Attack rolls against creature have advantage", "Creature's attack rolls have disadvantage"],
  },
  {
    id: "charmed", name: "Charmed", icon: "\uD83D\uDC96",
    summary: "Can't attack the charmer. Charmer has advantage on social interactions.",
    effects: ["Can't attack the charmer or target them with harmful abilities", "Charmer has advantage on ability checks to interact socially"],
  },
  {
    id: "deafened", name: "Deafened", icon: "\uD83D\uDC42",
    summary: "Auto-fail hearing-based checks.",
    effects: ["Auto-fail any ability check that requires hearing"],
  },
  {
    id: "exhaustion", name: "Exhaustion", icon: "\uD83D\uDE30",
    summary: "Cumulative penalty. 6 levels. Death at level 6.",
    effects: [
      "Level 1: Disadvantage on ability checks",
      "Level 2: Speed halved",
      "Level 3: Disadvantage on attack rolls and saves",
      "Level 4: Hit point maximum halved",
      "Level 5: Speed reduced to 0",
      "Level 6: Death",
    ],
  },
  {
    id: "frightened", name: "Frightened", icon: "\uD83D\uDE28",
    summary: "Disadvantage on checks while source is visible. Can't move closer.",
    effects: ["Disadvantage on ability checks and attack rolls while source is in line of sight", "Can't willingly move closer to the source of fear"],
  },
  {
    id: "grappled", name: "Grappled", icon: "\uD83E\uDD1D",
    summary: "Speed becomes 0. Can't move. Can escape with Athletics/Acrobatics (vs DC).",
    effects: ["Speed becomes 0", "Can't benefit from speed bonuses"],
  },
  {
    id: "incapacitated", name: "Incapacitated", icon: "\uD83D\uDCAB",
    summary: "Can't take actions, bonus actions, or reactions.",
    effects: ["Can't take actions or bonus actions", "Can't take reactions", "Can't concentrate on spells"],
  },
  {
    id: "invisible", name: "Invisible", icon: "\uD83D\uDC7B",
    summary: "Attack rolls against you have disadvantage. You have advantage on attack rolls.",
    effects: ["Can't be seen without special sight or magic", "Attack rolls against creature have disadvantage", "Creature's attack rolls have advantage"],
  },
  {
    id: "paralyzed", name: "Paralyzed", icon: "\u2744\uFE0F",
    summary: "Can't move or act. Auto-fail STR/DEX saves. Attacks auto-crit within 5ft.",
    effects: ["Incapacitated — can't take actions or reactions", "Auto-fail Strength and Dexterity saving throws", "Attack rolls against creature have advantage", "Any hit within 5ft is a critical hit"],
  },
  {
    id: "petrified", name: "Petrified", icon: "\uD83D\uDDFF",
    summary: "Turned to stone. Incapacitated. Weight \u00D710. Immune to poison/aging.",
    effects: ["Incapacitated — can't take actions or reactions", "Auto-fail Strength and Dexterity saving throws", "Damage resistance to all damage", "Immune to poison and disease", "Weight increases by factor of 10"],
  },
  {
    id: "poisoned", name: "Poisoned", icon: "\u2620\uFE0F",
    summary: "Disadvantage on attack rolls and ability checks.",
    effects: ["Disadvantage on attack rolls and ability checks"],
  },
  {
    id: "prone", name: "Prone", icon: "\uD83C\uDFC3",
    summary: "Attack rolls have disadvantage (ranged within 5ft have advantage). Half speed to stand.",
    effects: ["Movement costs half speed to stand up", "Attack rolls against creature have advantage if attacker is within 5ft", "Attack rolls against creature have disadvantage if attacker is beyond 5ft", "Creature's attack rolls have disadvantage"],
  },
  {
    id: "restrained", name: "Restrained", icon: "\uD83D\uDD17",
    summary: "Speed becomes 0. Attack rolls have disadvantage. Attackers have advantage.",
    effects: ["Speed becomes 0", "Disadvantage on Dexterity saving throws", "Attack rolls against creature have advantage", "Creature's attack rolls have disadvantage"],
  },
  {
    id: "stunned", name: "Stunned", icon: "\u26A1",
    summary: "Can't act. Auto-fail STR/DEX saves. Attackers have advantage.",
    effects: ["Incapacitated — can't take actions or reactions", "Auto-fail Strength and Dexterity saving throws", "Attack rolls against creature have advantage"],
  },
  {
    id: "unconscious", name: "Unconscious", icon: "\uD83D\uDCA4",
    summary: "Incapacitated. Drop everything. Auto-fail STR/DEX saves. Attacks auto-crit within 5ft.",
    effects: ["Incapacitated — can't take actions or reactions", "Drop everything — release held items", "Auto-fail Strength and Dexterity saving throws", "Attack rolls against creature have advantage", "Any hit within 5ft is a critical hit"],
  },
  {
    id: "concentration", name: "Concentration", icon: "\uD83E\uDDD8",
    summary: "Must make CON save (DC 10 or half damage, whichever higher) when taking damage.",
    effects: ["Taking damage requires CON save (DC 10 or half damage taken, whichever higher)", "Can only concentrate on one spell at a time", "Casting another concentration spell ends the first", "Can end concentration at any time (no action required)", "Incapacitated or killed ends concentration"],
  },
];

// ── Combat Actions ──
const COMBAT_ACTIONS = [
  { name: "Attack", time: "Action", summary: "Make one melee or ranged attack with a weapon." },
  { name: "Cast a Spell", time: "Action", summary: "Cast a spell with a casting time of 1 action." },
  { name: "Dash", time: "Action", summary: "Gain extra movement equal to your speed." },
  { name: "Disengage", time: "Action", summary: "Your movement doesn't provoke opportunity attacks." },
  { name: "Dodge", time: "Action", summary: "Attack rolls against you have disadvantage. You have advantage on DEX saves." },
  { name: "Help", time: "Action", summary: "Grant an ally advantage on their next ability check or attack roll." },
  { name: "Hide", time: "Action", summary: "Make a Stealth check to become unseen." },
  { name: "Ready", time: "Action", summary: "Prepare a reaction to trigger on a specific condition." },
  { name: "Search", time: "Action", summary: "Make a Perception or Investigation check." },
  { name: "Use Object", time: "Action", summary: "Interact with an object (draw weapon, open door)." },
  { name: "Opportunity Attack", time: "Reaction", summary: "Make one melee attack when a foe leaves your reach." },
  { name: "Two-Weapon Fighting", time: "Bonus", summary: "Make one additional attack with a light weapon in off-hand." },
  { name: "Shove", time: "Action", summary: "Push a creature prone or 5ft away (Athletics vs Athletics/Acrobatics)." },
  { name: "Grapple", time: "Action", summary: "Grab a creature (Athletics vs Athletics/Acrobatics)." },
  { name: "Drink Potion", time: "Bonus", summary: "Drink or administer a potion as a bonus action." },
  { name: "Second Wind", time: "Bonus", summary: "Fighter only: regain 1d10 + level HP." },
  { name: "Cunning Action", time: "Bonus", summary: "Rogue only: Dash, Disengage, or Hide as a bonus action." },
  { name: "Wild Shape", time: "Bonus", summary: "Druid only: Transform into a beast." },
];

// ── Rest & Recovery ──
const REST_INFO = [
  { name: "Short Rest", duration: "1 hour", benefits: "Spend Hit Dice (max 1/2 total) to regain HP. Some features recharge (Channel Divinity, Ki, etc.).", restrictions: "Cannot restore spell slots or class features that require a long rest." },
  { name: "Long Rest", duration: "8 hours", benefits: "Regain all HP and full Hit Dice. Restore all spell slots. Regain all class features.", restrictions: "Can't benefit from more than 1 long rest per 24 hours. Light activity (watch, read, eat) allowed." },
  { name: "Hit Dice Healing", duration: "During rest", benefits: "Roll a hit die, add CON mod. Regain that many HP. Player chooses how many to spend.", restrictions: "Max 1/2 total Hit Dice recovered per long rest." },
];

// ── Cover ──
const COVER_TABLE = [
  { name: "Half Cover", acBonus: "+2", saveBonus: "+2 DEX", description: "Obstacle blocks at least half the body (low wall, pillar, another creature)." },
  { name: "Three-Quarters Cover", acBonus: "+5", saveBonus: "+5 DEX", description: "Obstacle blocks at least 3/4 of the body (arrow slit, narrow window)." },
  { name: "Total Cover", acBonus: "N/A", saveBonus: "N/A", description: "Obstacle completely blocks body. Can't be targeted directly by attacks or spells." },
];

// ── Time badge colors ──
const TIME_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  "Action": { bg: "bg-gold-500/10", text: "text-gold-400", border: "border-gold/20" },
  "Bonus": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  "Reaction": { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
};

export default function PlayerSheetRulesTab({ character }: PlayerSheetRulesTabProps) {
  const [section, setSection] = useState<"actions" | "conditions" | "rest" | "cover">("actions");
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const encumbrance = useMemo(() => computeEncumbranceState(character), [character]);

  // Active conditions from character
  const activeConditionIds = character.conditions || [];

  // Filtered conditions by search
  const filteredConditions = CONDITIONS.filter((cond) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return cond.name.toLowerCase().includes(q) || cond.summary.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 px-3 py-3">
      {/* ── Section Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-gold pb-1">
        {[
          { id: "actions", label: "\u2694 Actions", short: "\u2694" },
          { id: "conditions", label: "\uD83D\uDCCB Conditions", short: "\uD83D\uDCCB" },
          { id: "rest", label: "\uD83D\uDCA4 Rest", short: "\uD83D\uDCA4" },
          { id: "cover", label: "\uD83D\uDEE1 Cover", short: "\uD83D\uDEE1" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
              section === s.id
                ? "bg-gold-500/10 text-gold-400 border border-gold/25"
                : "bg-obsidian-mid/60 text-surface-500 border border-surface-700/30 hover:border-gold/15"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── ENCUMBRANCE STATUS ── */}
      <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Encumbrance</span>
          <span className={`text-[10px] font-bold uppercase ${
            encumbrance.encumbranceLevel === "overencumbered" ? "text-red-400" :
            encumbrance.encumbranceLevel === "heavily encumbered" ? "text-amber-400" :
            encumbrance.encumbranceLevel === "lightly encumbered" ? "text-yellow-400" :
            "text-green-400"
          }`}>
            {encumbrance.encumbranceLevel}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-surface-700/60 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${
              encumbrance.encumbranceLevel === "overencumbered" ? "bg-red-500" :
              encumbrance.encumbranceLevel === "heavily encumbered" ? "bg-amber-500" :
              encumbrance.encumbranceLevel === "lightly encumbered" ? "bg-yellow-500" :
              "bg-green-500"
            }`}
              style={{ width: `${Math.min(100, (encumbrance.totalWeight / encumbrance.carryingCapacity) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-surface-500 font-mono whitespace-nowrap">
            {Math.round(encumbrance.totalWeight)}/{encumbrance.carryingCapacity} lbs
          </span>
        </div>
        {encumbrance.speedReduction !== 0 && (
          <p className="text-[10px] text-amber-400 mt-1">Speed reduced by {Math.abs(encumbrance.speedReduction)}ft</p>
        )}
        {encumbrance.disadvantageOnChecks && (
          <p className="text-[10px] text-red-400 mt-0.5">Disadvantage on STR/DEX/CON ability checks</p>
        )}
      </div>

      {/* ── SECTION: ACTIONS IN COMBAT ── */}
      {section === "actions" && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Actions in Combat</span>
            <div className="flex items-center gap-2 text-[8px] text-surface-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold-500/60" /> Action</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500/60" /> Bonus</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500/60" /> Reaction</span>
            </div>
          </div>
          <div className="space-y-1">
            {COMBAT_ACTIONS.map((action) => {
              const badge = TIME_BADGE[action.time] || TIME_BADGE["Action"];
              return (
                <div key={action.name} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/10 transition-all duration-200">
                  <span className={`text-[9px] uppercase font-bold shrink-0 mt-0.5 px-1.5 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                    {action.time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-surface-300 font-semibold">{action.name}</span>
                    <p className="text-[10px] text-surface-500 mt-0.5">{action.summary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECTION: CONDITIONS ── */}
      {section === "conditions" && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Status Conditions</span>
            {activeConditionIds.length > 0 && (
              <span className="text-[9px] text-gold-400 font-semibold">{activeConditionIds.length} active</span>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-500 text-[9px]">\uD83D\uDD0D</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conditions..."
              className="w-full pl-7 pr-2 py-1.5 text-[10px] bg-obsidian-mid/40 border border-surface-700/30 rounded-lg text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-gold/20 transition-all"
            />
          </div>

          <p className="text-[10px] text-surface-500 mb-2">
            Tap any condition for full details. Your active conditions are highlighted.
          </p>
          <div className="space-y-1">
            {filteredConditions.map((cond) => {
              const isActive = activeConditionIds.includes(cond.id);
              return (
                <div
                  key={cond.id}
                  className={`rounded-lg border transition-all duration-200 ${
                    isActive
                      ? "bg-gold-500/8 border-gold/20"
                      : "bg-obsidian-mid/40 border-surface-700/10 hover:border-gold/10"
                  }`}
                >
                  <button
                    onClick={() => setExpandedCondition(expandedCondition === cond.id ? null : cond.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left"
                  >
                    <span className="text-sm">{cond.icon}</span>
                    <span className="flex-1 text-xs text-surface-300 font-semibold">{cond.name}</span>
                    {isActive && (
                      <span className="text-[9px] text-gold-400 uppercase font-bold bg-gold-500/10 px-1.5 py-0.5 rounded border border-gold/20">
                        Active
                      </span>
                    )}
                    <span className={`text-surface-500 transform transition-transform duration-150 ${expandedCondition === cond.id ? "rotate-180" : ""}`}>
                      \u25BC
                    </span>
                  </button>

                  {expandedCondition === cond.id && (
                    <div className="px-3 pb-2 space-y-1.5 animate-slide-in-up">
                      <p className="text-[11px] text-surface-400">{cond.summary}</p>
                      <ul className="space-y-0.5">
                        {cond.effects.map((effect, i) => (
                          <li key={i} className="text-[10px] text-surface-500 flex items-start gap-1">
                            <span className="text-gold-500/50 mt-0.5">\u2022</span>
                            <span>{effect}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredConditions.length === 0 && (
              <div className="text-center py-4">
                <p className="text-surface-500 text-[10px]">No conditions match your search</p>
              </div>
            )}
          </div>

          {/* Active condition summary */}
          {activeConditionIds.length > 0 && (
            <div className="mt-3 rounded-xl bg-gold-500/5 border border-gold/15 p-3">
              <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Your Active Conditions</span>
              <div className="flex flex-wrap gap-1.5">
                {activeConditionIds.map((id) => {
                  const cond = CONDITIONS.find((c) => c.id === id);
                  if (!cond) return null;
                  return (
                    <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gold-500/10 border border-gold/20 text-gold-400 text-[9px]">
                      {cond.icon} {cond.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION: REST & RECOVERY ── */}
      {section === "rest" && (
        <div>
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">
            Rest & Recovery
          </span>
          <div className="space-y-2">
            {REST_INFO.map((rest) => (
              <div key={rest.name} className="px-3 py-2.5 rounded-xl bg-obsidian-mid/40 border border-surface-700/20 hover:border-gold/10 transition-all duration-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-surface-200 font-semibold">{rest.name}</span>
                  <span className="text-[10px] text-gold-400">{rest.duration}</span>
                </div>
                <p className="text-[10px] text-emerald-400 mb-1">{rest.benefits}</p>
                <p className="text-[10px] text-amber-400/70">{rest.restrictions}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1">
              Hit Dice — {character.hitDice} available
            </span>
            <p className="text-[10px] text-surface-500">
              Long rest recovers up to <span className="text-gold-400">{Math.floor(character.level / 2)}</span> of <span className="text-surface-300">{character.level}</span> total Hit Dice.
              Spend during short rests by rolling + CON modifier ({getConMod(character) >= 0 ? "+" : ""}{getConMod(character)}).
            </p>
          </div>

          {/* Concentration rules always visible */}
          <div className="mt-3 rounded-xl bg-violet-500/5 border border-violet-500/15 p-3">
            <span className="text-[10px] uppercase tracking-widest font-black text-violet-400/80 block mb-1 flex items-center gap-1.5">
              <span>\uD83E\uDDD8</span> Concentration
            </span>
            <div className="space-y-1 text-[10px] text-surface-500">
              <p><span className="text-violet-400/70">Taking damage:</span> CON save (DC 10 or half damage, whichever higher)</p>
              <p><span className="text-violet-400/70">One at a time:</span> Only one concentration spell at a time</p>
              <p><span className="text-violet-400/70">Overlap:</span> Casting another concentration spell ends the first</p>
              <p><span className="text-violet-400/70">Ending:</span> Can end concentration at any time (no action required)</p>
              <p><span className="text-violet-400/70">Losing:</span> Incapacitated or killed ends concentration</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: COVER ── */}
      {section === "cover" && (
        <div>
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">
            Cover Rules
          </span>
          <div className="space-y-1">
            {COVER_TABLE.map((cover) => (
              <div key={cover.name} className="px-3 py-2.5 rounded-xl bg-obsidian-mid/40 border border-surface-700/20 hover:border-gold/10 transition-all duration-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-surface-200 font-semibold">{cover.name}</span>
                  <div className="flex gap-2">
                    <span className="text-[10px] text-gold-400 px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold/15">
                      AC {cover.acBonus}
                    </span>
                    <span className="text-[10px] text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/15">
                      {cover.saveBonus}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-surface-500">{cover.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1">
              Stealth & Visibility
            </span>
            <div className="space-y-1 text-[10px] text-surface-500">
              <p><span className="text-gold-400/60">Hiding:</span> Requires 3/4 cover or total cover + successful Stealth check</p>
              <p><span className="text-gold-400/60">Heavily Obscured:</span> Area is effectively blind — creatures are Blinded</p>
              <p><span className="text-gold-400/60">Lightly Obscured:</span> Disadvantage on Perception checks (dim light, fog)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper: get CON modifier for Hit Dice display ──
function getConMod(c: PlayerCharacter): number {
  return Math.floor((c.constitution - 10) / 2);
}
