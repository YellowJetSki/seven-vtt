/* ── DM Quick Reference Panel ──────────────────────────────────
 * Quick-access reference for conditions, actions, and common
 * DM rules. Collapsible panel on the Encounters page.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";

/* ── Common 5e Conditions ──────────────────────────────────── */
interface ConditionEntry {
  name: string;
  icon: string;
  effect: string;
}

interface ActionEntry {
  name: string;
  icon: string;
  desc: string;
}

const CONDITIONS: ConditionEntry[] = [
  { name: "Blinded", icon: "👁️‍🗨️", effect: "Attack rolls against creature have advantage. Creature's attack rolls have disadvantage." },
  { name: "Charmed", icon: "💖", effect: "Can't attack the charmer. Charmer has advantage on social interactions." },
  { name: "Deafened", icon: "🔇", effect: "Can't hear — automatically fails hearing-based checks." },
  { name: "Frightened", icon: "😱", effect: "Disadvantage on ability checks and attack rolls while source is in line of sight. Can't willingly move closer." },
  { name: "Grappled", icon: "🤝", effect: "Speed becomes 0. Ends if grappler is incapacitated or moved out of range." },
  { name: "Incapacitated", icon: "💫", effect: "Can't take actions or reactions." },
  { name: "Invisible", icon: "👻", effect: "Unseeable by normal sight. Attack rolls against creature have disadvantage. Creature's attacks have advantage." },
  { name: "Paralyzed", icon: "🧊", effect: "Incapacitated. Auto-fail STR/DEX saves. Attacks within 5ft are crits." },
  { name: "Petrified", icon: "🪨", effect: "Turned to stone. Incapacitated. Resistance to all damage. Immune to poison/disease." },
  { name: "Poisoned", icon: "☠️", effect: "Disadvantage on attack rolls and ability checks." },
  { name: "Prone", icon: "🙇", effect: "Disadvantage on attacks. Attacks within 5ft have advantage, ranged attacks have disadvantage." },
  { name: "Restrained", icon: "⛓️", effect: "Speed 0. Attacks have disadvantage. Attacks against creature have advantage. DEX saves have disadvantage." },
  { name: "Stunned", icon: "⚡", effect: "Incapacitated. Auto-fail STR/DEX saves. Attacks against creature have advantage." },
  { name: "Unconscious", icon: "💤", effect: "Incapacitated. Prone. Auto-fail STR/DEX saves. Attacks within 5ft are crits." },
  { name: "Exhaustion 1", icon: "💪", effect: "Disadvantage on ability checks." },
  { name: "Exhaustion 2", icon: "🏃", effect: "Speed halved." },
  { name: "Exhaustion 3", icon: "🛌", effect: "Disadvantage on attack rolls and saving throws." },
  { name: "Exhaustion 4", icon: "🫀", effect: "Hit point maximum halved." },
  { name: "Exhaustion 5", icon: "🚶", effect: "Speed reduced to 0." },
  { name: "Exhaustion 6", icon: "⚰️", effect: "Death." },
];

/* ── Common Actions ─────────────────────────────────────────── */
const ACTIONS: ActionEntry[] = [
  { name: "Attack", icon: "⚔️", desc: "Make a weapon or spell attack." },
  { name: "Cast a Spell", icon: "🔮", desc: "Cast a spell (1 action casting time)." },
  { name: "Dash", icon: "🏃", desc: "Double your movement speed." },
  { name: "Disengage", icon: "↩️", desc: "Movement doesn't provoke opportunity attacks." },
  { name: "Dodge", icon: "🛡️", desc: "Attacks against you have disadvantage. DEX saves have advantage." },
  { name: "Help", icon: "🤲", desc: "Give ally advantage on next ability check or attack." },
  { name: "Hide", icon: "🕵️", desc: "Make a DEX (Stealth) check to become unseen." },
  { name: "Ready", icon: "⏱️", desc: "Prepare a reaction to trigger on a specific condition." },
  { name: "Search", icon: "🔍", desc: "Make a WIS (Perception) or INT (Investigation) check." },
  { name: "Use Object", icon: "📦", desc: "Interact with an object (can also be a free interaction)." },
  { name: "Grapple", icon: "🤼", desc: "Athletics vs. Athletics/Acrobatics. Restrains target." },
  { name: "Shove", icon: "💥", desc: "Push target prone or 5ft away. Athletics vs. Athletics/Acrobatics." },
  { name: "Improvised Action", icon: "🎭", desc: "Anything creative — DM determines DC/outcome." },
];

type Tab = "conditions" | "actions";

export function DmQuickReferencePanel() {
  const [activeTab, setActiveTab] = useState<Tab>("conditions");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredConditions = useMemo(() => {
    if (!searchQuery.trim()) return CONDITIONS;
    const q = searchQuery.toLowerCase();
    return CONDITIONS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.effect.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredActions = useMemo(() => {
    if (!searchQuery.trim()) return ACTIONS;
    const q = searchQuery.toLowerCase();
    return ACTIONS.filter(
      (a) => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const isCondition = activeTab === "conditions";
  const items = isCondition ? filteredConditions : filteredActions;

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-surface-200 hover:bg-surface-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>📖</span>
          <span>Quick Reference</span>
        </span>
        <span className={`text-xs text-surface-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="border-t border-surface-700">
          {/* Tab Bar */}
          <div className="flex gap-1 border-b border-surface-700/50 px-3 py-2">
            <button onClick={() => setActiveTab("conditions")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "conditions" ? "bg-accent-600 text-white" : "text-surface-400 hover:text-surface-200"}`}>
              Conditions
            </button>
            <button onClick={() => setActiveTab("actions")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "actions" ? "bg-accent-600 text-white" : "text-surface-400 hover:text-surface-200"}`}>
              Actions
            </button>
            <div className="flex-1" />
          </div>

          {/* Search */}
          <div className="px-3 py-2">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search ${activeTab}...`}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
          </div>

          {/* Items */}
          <div className="max-h-[400px] overflow-y-auto space-y-1 px-3 pb-3">
            {items.length === 0 ? (
              <p className="text-center text-xs text-surface-500 py-6">No matches.</p>
            ) : (
              items.map((item) => (
                <div key={item.name} className="rounded-lg bg-surface-800/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span className="text-xs font-semibold text-surface-200">{item.name}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-surface-400 leading-relaxed">
                    {isCondition ? (item as ConditionEntry).effect : (item as ActionEntry).desc}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
