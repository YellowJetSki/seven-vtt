/**
 * STᚱ VTT — Player Sheet (Full Mobile-First Modal)
 *
 * A full-screen, touch-optimized player character sheet designed
 * for split-second tabletop decisions on phones/tablets.
 *
 * Features:
 *   - Horizontal tab bar (Stats | Combat | Inventory)
 *   - Swipeable content panels
 *   - Large touch targets (44px+)
 *   - No pinching/zooming required
 *   - Real-time synced via campaignStore
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Lock, Shield, Swords, Backpack, X, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import type { PlayerCharacter } from "@/types";

type TabId = "stats" | "combat" | "inventory";

interface PlayerSheetProps {
  character: PlayerCharacter;
  onClose: () => void;
}

const TABS: { id: TabId; label: string; icon: typeof Shield }[] = [
  { id: "stats", label: "Stats", icon: Shield },
  { id: "combat", label: "Combat", icon: Swords },
  { id: "inventory", label: "Items", icon: Backpack },
];

// ── Ability score modifier ──
function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ── Skill to ability mapping ──
const SKILL_ABILITIES: Record<string, string> = {
  acrobatics: "dexterity", animal_handling: "wisdom", arcana: "intelligence",
  athletics: "strength", deception: "charisma", history: "intelligence",
  insight: "wisdom", intimidation: "charisma", investigation: "intelligence",
  medicine: "wisdom", nature: "intelligence", perception: "wisdom",
  performance: "charisma", persuasion: "charisma", religion: "intelligence",
  sleight_of_hand: "dexterity", stealth: "dexterity", survival: "wisdom",
};

function skillAbility(name: string): string {
  return SKILL_ABILITIES[name] || "wisdom";
}

export default function PlayerSheet({ character, onClose }: PlayerSheetProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [activeTab, setActiveTab] = useState<TabId>("stats");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [hpInput, setHpInput] = useState("");
  const tabContentRef = useRef<HTMLDivElement>(null);

  const c = character;
  const tabOrder: TabId[] = ["stats", "combat", "inventory"];

  // ── Swipe handling ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX;
      const threshold = 50;
      const idx = tabOrder.indexOf(activeTab);

      if (diff > threshold && idx > 0) {
        setActiveTab(tabOrder[idx - 1]);
      } else if (diff < -threshold && idx < tabOrder.length - 1) {
        setActiveTab(tabOrder[idx + 1]);
      }
      setTouchStartX(null);
    },
    [touchStartX, activeTab]
  );

  // ── HP management ──
  const handleHpChange = useCallback(
    (delta: number) => {
      const newHp = Math.max(0, Math.min(c.hitPoints.max, c.hitPoints.current + delta));
      updateCharacter(c.id, {
        hitPoints: { ...c.hitPoints, current: newHp },
      });
    },
    [c, updateCharacter]
  );

  const handleHpInput = useCallback(() => {
    const val = parseInt(hpInput, 10);
    if (isNaN(val)) return;
    handleHpChange(val);
    setHpInput("");
  }, [hpInput, handleHpChange]);

  // ── Temp HP ──
  const handleTempHp = useCallback(
    (amount: number) => {
      updateCharacter(c.id, {
        temporaryHitPoints: Math.max(0, (c.temporaryHitPoints || 0) + amount),
      });
    },
    [c, updateCharacter]
  );

  // ── Death save ──
  const handleDeathSave = useCallback(
    (type: "success" | "failure") => {
      const ds = { ...c.deathSaves };
      if (type === "success") {
        ds.successes = Math.min(3, ds.successes + 1);
        if (ds.successes >= 3) { ds.successes = 0; ds.failures = 0; }
      } else {
        ds.failures = Math.min(3, ds.failures + 1);
        if (ds.failures >= 3) { ds.successes = 0; ds.failures = 0; }
      }
      updateCharacter(c.id, { deathSaves: ds });
    },
    [c, updateCharacter]
  );

  // ── Inspiration toggle ──
  const toggleInspiration = useCallback(() => {
    updateCharacter(c.id, { inspiration: !c.inspiration });
  }, [c, updateCharacter]);

  // ── Render ability scores (Stats tab) ──
  const renderAbilities = () => {
    const abilities = [
      { name: "STR", key: "strength", value: c.strength },
      { name: "DEX", key: "dexterity", value: c.dexterity },
      { name: "CON", key: "constitution", value: c.constitution },
      { name: "INT", key: "intelligence", value: c.intelligence },
      { name: "WIS", key: "wisdom", value: c.wisdom },
      { name: "CHA", key: "charisma", value: c.charisma },
    ] as const;

    return (
      <div className="grid grid-cols-3 gap-2">
        {abilities.map((a) => (
          <div
            key={a.key}
            className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2.5"
          >
            <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">
              {a.name}
            </span>
            <span className="text-2xl font-bold tabular-nums leading-none mt-0.5">
              {a.value}
            </span>
            <span className="text-xs font-medium text-surface-400 tabular-nums">
              {modStr(abilityMod(a.value))}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // ── Render skills (Stats tab) ──
  const renderSkills = () => {
    const skillNames = Object.entries(c.skills);
    if (skillNames.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-surface-500 text-xs">No skill proficiencies set</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-1">
        {skillNames.map(([skill, prof]) => {
          const abilKey = skillAbility(skill) as keyof typeof c;
          const abilVal = typeof c[abilKey] === "number" ? (c[abilKey] as number) : 10;
          const mod = abilityMod(abilVal);
          const profBonus = prof === "proficient" ? c.proficiencyBonus : prof === "expertise" ? c.proficiencyBonus * 2 : 0;
          const total = mod + profBonus;
          return (
            <div key={skill} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-800/20">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] w-4 text-center ${prof === "none" ? "text-surface-600" : "text-accent-400"}`}>
                  {prof === "expertise" ? "⨁" : prof === "proficient" ? "●" : "○"}
                </span>
                <span className="text-xs text-surface-300 capitalize">
                  {skill.replace(/_/g, " ")}
                </span>
              </div>
              <span className="text-xs font-mono font-bold tabular-nums">
                {modStr(total)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Render HP (Combat tab) ──
  const renderHP = () => {
    const hpRatio = c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1;
    const hpColor = hpRatio > 0.5 ? "bg-green-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500";
    const hasTemp = (c.temporaryHitPoints || 0) > 0;

    return (
      <div className="space-y-3">
        {/* HP Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-widest font-black text-surface-400">
              Hit Points
            </span>
            <span className="text-sm font-mono font-bold tabular-nums">
              {c.hitPoints.current}
              <span className="text-surface-500 font-normal">/{c.hitPoints.max}</span>
              {hasTemp && (
                <span className="text-mage-400 text-xs ml-1">
                  +{c.temporaryHitPoints} tmp
                </span>
              )}
            </span>
          </div>
          <div className="h-4 bg-surface-700/60 rounded-full overflow-hidden relative">
            <div
              className={`h-full ${hpColor} rounded-full transition-all duration-300`}
              style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
            />
            {hasTemp && (
              <div
                className="absolute top-0 h-full bg-mage-500/40 rounded-full"
                style={{
                  left: `${Math.min(100, hpRatio * 100)}%`,
                  width: `${Math.min(100 - hpRatio * 100, ((c.temporaryHitPoints || 0) / c.hitPoints.max) * 100)}%`,
                }}
              />
            )}
          </div>
        </div>

        {/* Quick HP buttons — LARGE touch targets */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleHpChange(-10)}
            className="py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-lg font-bold active:scale-95 transition-transform"
          >
            -10
          </button>
          <button
            onClick={() => handleHpChange(-5)}
            className="py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-lg font-bold active:scale-95 transition-transform"
          >
            -5
          </button>
          <button
            onClick={() => handleHpChange(5)}
            className="py-3 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-lg font-bold active:scale-95 transition-transform"
          >
            +5
          </button>
          <button
            onClick={() => handleHpChange(10)}
            className="py-3 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-lg font-bold active:scale-95 transition-transform"
          >
            +10
          </button>
        </div>

        {/* Custom HP input */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={hpInput}
            onChange={(e) => setHpInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleHpInput();
            }}
            placeholder="Custom amount (+/-)"
            className="flex-1 py-3 px-3 text-sm bg-surface-800/50 border border-surface-700/30 rounded-xl text-surface-200 placeholder-surface-500 focus:outline-none focus:border-accent-500/40"
          />
          <button
            onClick={handleHpInput}
            className="px-5 py-3 bg-accent-600/20 border border-accent-500/20 text-accent-300 text-sm font-semibold rounded-xl active:scale-95 transition-transform"
          >
            Apply
          </button>
        </div>

        {/* Temp HP */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest font-black text-mage-400">
            Temp HP
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTempHp(-5)}
              className="px-3 py-1.5 rounded-lg bg-surface-800/40 border border-surface-700/20 text-surface-400 text-sm active:scale-95 transition-transform"
            >
              -5
            </button>
            <span className="text-sm font-mono font-bold text-mage-400 w-8 text-center tabular-nums">
              {c.temporaryHitPoints || 0}
            </span>
            <button
              onClick={() => handleTempHp(5)}
              className="px-3 py-1.5 rounded-lg bg-mage-500/15 border border-mage-500/20 text-mage-400 text-sm active:scale-95 transition-transform"
            >
              +5
            </button>
          </div>
        </div>

        {/* Death Saves */}
        <div className="rounded-xl bg-surface-800/30 border border-surface-700/20 p-3">
          <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-2">
            Death Saves
          </span>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-green-400 uppercase font-semibold">Saved</span>
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => handleDeathSave("success")}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold active:scale-90 transition-transform ${
                    c.deathSaves.successes > i
                      ? "bg-green-500/20 border-green-500/50 text-green-400"
                      : "border-surface-600/30 text-surface-500"
                  }`}
                >
                  {c.deathSaves.successes > i ? "✓" : "○"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-red-400 uppercase font-semibold">Failed</span>
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => handleDeathSave("failure")}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold active:scale-90 transition-transform ${
                    c.deathSaves.failures > i
                      ? "bg-red-500/20 border-red-500/50 text-red-400"
                      : "border-surface-600/30 text-surface-500"
                  }`}
                >
                  {c.deathSaves.failures > i ? "✕" : "○"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Render AC/Init (Combat tab) ──
  const renderCombatStats = () => {
    return (
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2.5">
          <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">AC</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5">{c.armorClass}</span>
        </div>
        <div className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2.5">
          <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">Init</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5">{modStr(c.initiative)}</span>
        </div>
        <div className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2.5">
          <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">Speed</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5">{c.speed.walk}</span>
        </div>
      </div>
    );
  };

  // ── Render conditions (Combat tab) ──
  const renderConditions = () => {
    const allConditions = [
      "Blinded", "Charmed", "Deafened", "Frightened", "Grappled",
      "Incapacitated", "Invisible", "Paralyzed", "Petrified",
      "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious",
    ];

    return (
      <div>
        <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1.5">
          Conditions
        </span>
        <div className="flex flex-wrap gap-1.5">
          {allConditions.map((cond) => {
            const isActive = c.conditions.includes(cond.toLowerCase());
            return (
              <button
                key={cond}
                onClick={() => {
                  const updated = isActive
                    ? c.conditions.filter((x) => x !== cond.toLowerCase())
                    : [...c.conditions, cond.toLowerCase()];
                  updateCharacter(c.id, { conditions: updated });
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all duration-150 border ${
                  isActive
                    ? "bg-accent-600/20 border-accent-500/30 text-accent-300"
                    : "bg-surface-800/30 border-surface-700/20 text-surface-400 hover:bg-surface-700/40"
                }`}
              >
                {cond}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Render hit dice (Combat tab) ──
  const renderHitDice = () => {
    return (
      <div className="flex items-center justify-between rounded-xl bg-surface-800/30 border border-surface-700/20 p-3">
        <span className="text-[10px] uppercase tracking-widest font-black text-surface-400">
          Hit Dice
        </span>
        <span className="text-sm font-mono font-bold tabular-nums text-surface-200">
          {c.hitDice}
        </span>
      </div>
    );
  };

  // ── Render inventory (Inventory tab) ──
  const renderInventory = () => {
    const equipment = c.equipment || [];
    const inventory = c.inventory || [];
    const currency = c.currency || { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 };

    return (
      <div className="space-y-4">
        {/* Currency — large touchable */}
        <div>
          <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1.5">
            Currency
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { label: "PP", key: "platinum", value: currency.platinum, color: "text-cyan-300" },
              { label: "GP", key: "gold", value: currency.gold, color: "text-amber-400" },
              { label: "EP", key: "electrum", value: currency.electrum, color: "text-purple-400" },
              { label: "SP", key: "silver", value: currency.silver, color: "text-surface-300" },
              { label: "CP", key: "copper", value: currency.copper, color: "text-amber-600" },
            ].map((coin) => (
              <div
                key={coin.key}
                className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2"
              >
                <span className="text-[9px] uppercase font-black text-surface-500">{coin.label}</span>
                <span className={`text-base font-bold tabular-nums ${coin.color}`}>
                  {coin.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment slots */}
        {equipment.length > 0 && (
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1.5">
              Equipment
            </span>
            <div className="space-y-1">
              {equipment.map((eq, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-800/20 border border-surface-700/20"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase text-surface-500 font-semibold w-16 shrink-0">
                      {eq.slot}
                    </span>
                    <span className="text-xs text-surface-300">{eq.item}</span>
                  </div>
                  {eq.quantity > 1 && (
                    <span className="text-[10px] text-surface-500">×{eq.quantity}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory items */}
        {inventory.length > 0 ? (
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1.5">
              Inventory
            </span>
            <div className="space-y-1">
              {inventory.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-800/20 border border-surface-700/20"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs ${item.isEquipped ? "text-accent-400 font-semibold" : "text-surface-300"} truncate`}>
                      {item.name}
                    </span>
                    {item.isEquipped && (
                      <span className="text-[8px] uppercase bg-accent-500/10 text-accent-400 px-1 py-0.5 rounded">
                        Equipped
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-surface-500">{item.weight} lb</span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-surface-500">×{item.quantity}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-surface-500 text-xs">No items in inventory</p>
          </div>
        )}
      </div>
    );
  };

  // ── Render character header ──
  const renderHeader = () => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/20">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-accent-600/20 flex items-center justify-center text-lg shrink-0">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            "⚔"
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-surface-200 truncate">{c.name}</h2>
          <p className="text-[10px] text-surface-500 truncate">
            {c.race} · {c.class} {c.level}
            {c.subClass && ` · ${c.subClass}`}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-xl hover:bg-surface-700/50 text-surface-400 active:scale-90 transition-all"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  // ── Render tab bar with swipe indicators ──
  const renderTabBar = () => {
    const currentIdx = tabOrder.indexOf(activeTab);

    return (
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-surface-700/20 shrink-0">
        {/* Left arrow */}
        <button
          onClick={() => currentIdx > 0 && setActiveTab(tabOrder[currentIdx - 1])}
          className={`p-1.5 rounded-lg transition-colors ${
            currentIdx > 0
              ? "text-surface-400 hover:bg-surface-700/50 active:scale-90"
              : "text-surface-700"
          }`}
          disabled={currentIdx === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {TABS.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                  isActive
                    ? "bg-accent-600/15 text-accent-300"
                    : "text-surface-500 hover:text-surface-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => currentIdx < tabOrder.length - 1 && setActiveTab(tabOrder[currentIdx + 1])}
          className={`p-1.5 rounded-lg transition-colors ${
            currentIdx < tabOrder.length - 1
              ? "text-surface-400 hover:bg-surface-700/50 active:scale-90"
              : "text-surface-700"
          }`}
          disabled={currentIdx === tabOrder.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // ── Tab content ──
  const renderTabContent = () => {
    switch (activeTab) {
      case "stats":
        return (
          <div className="space-y-4 px-3 py-3">
            {/* Inspiration badge */}
            <button
              onClick={toggleInspiration}
              className={`w-full py-2 rounded-xl text-center text-xs font-semibold border active:scale-[0.98] transition-all ${
                c.inspiration
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-surface-800/30 border-surface-700/20 text-surface-500"
              }`}
            >
              {c.inspiration ? "✦ Inspiration (Active)" : "✦ No Inspiration"}
            </button>

            {/* Experience Points & Level */}
            <div className="rounded-xl bg-surface-800/30 border border-surface-700/20 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-widest font-black text-surface-400">
                  Experience Points
                </span>
                <span className="text-xs font-mono font-bold text-surface-200 tabular-nums">
                  {c.experiencePoints.toLocaleString()} XP
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-surface-500">
                  Level {c.level} · Next level: {(c.level * 1000).toLocaleString()} XP needed
                </span>
                <span className="text-[10px] text-surface-500">
                  {c.level < 20 ? "▲ " + ((c.level * 1000) - c.experiencePoints).toLocaleString() + " to go" : "✦ MAX"}
                </span>
              </div>
              <div className="h-1.5 bg-surface-700/60 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-accent-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${c.level < 20 ? Math.min(100, (c.experiencePoints / (c.level * 1000)) * 100) : 100}%`,
                  }}
                />
              </div>
            </div>

            {renderAbilities()}

            {/* Saving Throws */}
            <div>
              <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1.5">
                Saving Throws
              </span>
              <div className="space-y-1">
                {["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map(
                  (s) => {
                    const save = c.savingThrows[s];
                    const mod = abilityMod(
                      c[s as keyof typeof c] as number
                    );
                    const total = mod + (save?.proficient ? c.proficiencyBonus : 0) + (save?.bonus || 0);
                    return (
                      <div
                        key={s}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-800/20"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${save?.proficient ? "text-accent-400" : "text-surface-600"}`}>
                            {save?.proficient ? "●" : "○"}
                          </span>
                          <span className="text-xs text-surface-300 capitalize">{s}</span>
                        </div>
                        <span className="text-xs font-mono font-bold tabular-nums">
                          {modStr(total)}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Skills */}
            <div>
              <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1.5">
                Skills
              </span>
              {renderSkills()}
            </div>
          </div>
        );

      case "combat":
        return (
          <div className="space-y-4 px-3 py-3">
            {renderHP()}
            {renderCombatStats()}
            {renderConditions()}
            {renderHitDice()}
          </div>
        );

      case "inventory":
        return (
          <div className="px-3 py-3">
            {renderInventory()}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-950/95 backdrop-blur-md animate-in slide-in-from-bottom duration-300">
      {renderHeader()}
      {renderTabBar()}

      {/* Swipeable content */}
      <div
        ref={tabContentRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {renderTabContent()}
      </div>

      {/* Bottom safe area spacer */}
      <div className="h-4 shrink-0" />
    </div>
  );
}
