/* ── Player Character Sheet ────────────────────────────────────
 * Full character sheet view for players showing stats, abilities,
 * equipment, currency, features, and backstory.
 *
 * Uses the flat PlayerCharacter type with direct ability score fields.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback } from "react";
import type { PlayerCharacter, Ability } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const ABILITY_KEYS: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABBR_MAP: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

interface SkillEntry {
  key: string;
  label: string;
  ability: Ability;
}

const SKILL_ENTRIES: SkillEntry[] = [
  { key: "acrobatics", label: "Acrobatics", ability: "dexterity" },
  { key: "athletics", label: "Athletics", ability: "strength" },
  { key: "deception", label: "Deception", ability: "charisma" },
  { key: "history", label: "History", ability: "intelligence" },
  { key: "insight", label: "Insight", ability: "wisdom" },
  { key: "intimidation", label: "Intimidation", ability: "charisma" },
  { key: "investigation", label: "Investigation", ability: "intelligence" },
  { key: "nature", label: "Nature", ability: "intelligence" },
  { key: "perception", label: "Perception", ability: "wisdom" },
  { key: "performance", label: "Performance", ability: "charisma" },
  { key: "persuasion", label: "Persuasion", ability: "charisma" },
  { key: "religion", label: "Religion", ability: "intelligence" },
  { key: "sleightOfHand", label: "Sleight of Hand", ability: "dexterity" },
  { key: "stealth", label: "Stealth", ability: "dexterity" },
  { key: "survival", label: "Survival", ability: "wisdom" },
];

/* ── Helper ─────────────────────────────────────────────────── */

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function skillBonus(skillKey: string, char: PlayerCharacter, profSkills: Set<string>, profBonus: number): number {
  const entry = SKILL_ENTRIES.find((s) => s.key === skillKey);
  if (!entry) return 0;
  const base = abilityMod(char[entry.ability]);
  if (profSkills.has(skillKey)) return base + profBonus;
  return base;
}

/* ── Props ──────────────────────────────────────────────────── */

interface PlayerCharacterSheetProps {
  character: PlayerCharacter;
}

export function PlayerCharacterSheet({ character }: PlayerCharacterSheetProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const showToast = useUiStore((s) => s.showToast);

  // Editable state
  const [editHp, setEditHp] = useState(false);
  const [hpInput, setHpInput] = useState(String(character.hitPoints.current));
  const [tempHpInput, setTempHpInput] = useState(String(character.hitPoints.temporary || 0));
  const [editXp, setEditXp] = useState(false);
  const [xpInput, setXpInput] = useState(String(character.experiencePoints ?? 0));
  const [showHpEditor, setShowHpEditor] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showSpellSlots, setShowSpellSlots] = useState(false);

  // Resource editing
  const [resources, setResources] = useState<{ id: string; name: string; current: number; max: number; recharge: string }[]>(
    (character as any).resources ?? []
  );
  const [showResourceEditor, setShowResourceEditor] = useState(false);

  // Inventory editing
  const [showInventoryEditor, setShowInventoryEditor] = useState(false);
  const [equipmentDraft, setEquipmentDraft] = useState<{ item: string; quantity: number }[]>(
    character.equipment.map(e => ({ item: e.item, quantity: e.quantity }))
  );

  // Currency editing
  const [showCurrencyEditor, setShowCurrencyEditor] = useState(false);
  const [draftCurrency, setDraftCurrency] = useState({
    platinum: character.currency?.platinum ?? 0,
    gold: character.currency?.gold ?? 0,
    electrum: character.currency?.electrum ?? 0,
    silver: character.currency?.silver ?? 0,
    copper: character.currency?.copper ?? 0,
  });

  const handleHpSave = useCallback(() => {
    const val = parseInt(hpInput, 10);
    if (isNaN(val)) return;
    const temp = parseInt(tempHpInput, 10);
    updateCharacter(character.id, {
      hitPoints: {
        ...character.hitPoints,
        current: Math.max(0, Math.min(val, character.hitPoints.max)),
        temporary: isNaN(temp) ? 0 : Math.max(0, temp),
      },
      updatedAt: Date.now(),
    });
    setShowHpEditor(false);
    showToast({ message: `HP updated to ${val}/${character.hitPoints.max}`, type: "success" });
  }, [hpInput, tempHpInput, character.id, character.hitPoints, updateCharacter, showToast]);

  const handleXpSave = useCallback(() => {
    const val = parseInt(xpInput, 10);
    if (isNaN(val)) return;
    updateCharacter(character.id, {
      experiencePoints: Math.max(0, val),
      updatedAt: Date.now(),
    });
    setEditXp(false);
    showToast({ message: `XP set to ${val}`, type: "success" });
  }, [xpInput, character.id, updateCharacter, showToast]);

  const handleResourceSave = useCallback(() => {
    // Filter empty resources
    const validResources = resources.filter(r => r.name.trim());
    updateCharacter(character.id, {
      resources: validResources,
      updatedAt: Date.now(),
    } as any);
    setShowResourceEditor(false);
    showToast({ message: `Resources updated`, type: "success" });
  }, [resources, character.id, updateCharacter, showToast]);

  const addResource = useCallback(() => {
    setResources(prev => [...prev, {
      id: `res_${Date.now()}`,
      name: "",
      current: 0,
      max: 0,
      recharge: "long",
    }]);
  }, []);

  const updateResource = useCallback((index: number, field: string, value: any) => {
    setResources(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }, []);

  // Extract resources from character with fallback
  const characterResources: { id: string; name: string; current: number; max: number; recharge: string }[] =
    (character as any).resources ?? [];

  const hpPercent = useMemo(() => {
    if (character.hitPoints.max <= 0) return 0;
    return Math.max(0, Math.min(100, (character.hitPoints.current / character.hitPoints.max) * 100));
  }, [character.hitPoints.current, character.hitPoints.max]);

  // Parse proficiency list — supports both string[] and Proficiency[] formats
  const profSkills = useMemo(() => {
    const set = new Set<string>();
    const profs: unknown[] = character.proficiencies ?? [];
    for (const p of profs) {
      const lower = typeof p === 'string' ? p.toLowerCase().trim() : (p as { name: string }).name?.toLowerCase().trim() ?? '';
      for (const entry of SKILL_ENTRIES) {
        if (lower.includes(entry.key) || lower.includes(entry.label.toLowerCase())) {
          set.add(entry.key);
        }
      }
    }
    return set;
  }, [character.proficiencies]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header Card */}
      <div className="rounded-xl border border-surface-700 bg-surface-850 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-rogue-500/60 via-accent-500/60 to-warrior-500/60" />
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-800 ring-1 ring-surface-700 md:h-24 md:w-24">
              <span className="text-3xl md:text-4xl">
                {character.race.includes("Dragon") ? "🐉" : character.race.includes("Elf") ? "🧝" : character.race.includes("Dwarf") ? "⛰️" : character.race.includes("Halfl") ? "🏠" : character.race.includes("Gnome") ? "🪄" : character.race.includes("Orc") ? "💪" : character.race.includes("Tief") ? "🔮" : "🧙"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-surface-100 md:text-3xl">{character.name}</h1>
              <p className="mt-0.5 text-sm text-surface-400">
                {character.race} - {character.class} - Level {character.level}
              </p>
              <p className="mt-0.5 text-xs text-surface-500">
                {character.alignment ?? "Unaligned"} - {character.background ?? "No Background"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-surface-500">
            Played by <span className="text-surface-400">{character.playerName}</span>
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill label="HP" value={`${character.hitPoints.current}/${character.hitPoints.max}`} color="warrior" />
        <StatPill label="AC" value={String(character.armorClass)} color="mage" />
        <StatPill label="Initiative" value={`+${character.initiative}`} color="rogue" />
      </div>

      {/* HP Bar — Clickable to edit */}
      <div>
        <div className="flex items-center justify-between text-xs text-surface-400 mb-1">
          <span>Hit Points</span>
          <button onClick={() => { setHpInput(String(character.hitPoints.current)); setTempHpInput(String(character.hitPoints.temporary || 0)); setShowHpEditor(true); }} className="text-accent-400 hover:text-accent-300 transition-colors">
            {character.hitPoints.current} / {character.hitPoints.max}
            {character.hitPoints.temporary > 0 && " (+" + character.hitPoints.temporary + " temp)"} ✏️
          </button>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-800 cursor-pointer" onClick={() => { setHpInput(String(character.hitPoints.current)); setTempHpInput(String(character.hitPoints.temporary || 0)); setShowHpEditor(true); }}>
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${hpPercent}%`,
            background: hpPercent > 50 ? "var(--color-rogue-500)" : hpPercent > 25 ? "var(--color-divine-500)" : "var(--color-warrior-500)",
          }} />
        </div>
      </div>

      {/* HP Editor Modal */}
      {showHpEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowHpEditor(false)}>
          <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-surface-100 mb-4">Update Hit Points</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-surface-400">Current HP (max: {character.hitPoints.max})</label>
                <input type="number" value={hpInput} onChange={(e) => setHpInput(e.target.value)}
                  min={0} max={character.hitPoints.max}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 mt-1 focus:border-accent-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-surface-400">Temporary HP</label>
                <input type="number" value={tempHpInput} onChange={(e) => setTempHpInput(e.target.value)}
                  min={0}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 mt-1 focus:border-accent-500 focus:outline-none" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowHpEditor(false)}>Cancel</Button>
                <Button size="sm" onClick={handleHpSave}>Save HP</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XP — Clickable to edit */}
      <div className="flex items-center justify-between rounded-xl border border-surface-700 bg-surface-850 p-3">
        <span className="text-xs font-medium text-surface-400">Experience Points</span>
        <button onClick={() => { setXpInput(String(character.experiencePoints ?? 0)); setEditXp(true); }} className="text-sm font-bold text-surface-200 hover:text-accent-400 transition-colors">
          {character.experiencePoints ?? 0} XP ✏️
        </button>
      </div>

      {/* XP Editor Modal */}
      {editXp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditXp(false)}>
          <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-surface-100 mb-4">Update Experience Points</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-surface-400">Current XP</label>
                <input type="number" value={xpInput} onChange={(e) => setXpInput(e.target.value)}
                  min={0}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 mt-1 focus:border-accent-500 focus:outline-none" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setEditXp(false)}>Cancel</Button>
                <Button size="sm" onClick={handleXpSave}>Save XP</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ability Scores */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Ability Scores</h2>
        <div className="grid grid-cols-6 gap-2">
          {ABILITY_KEYS.map((name) => {
            const score = character[name];
            const m = abilityMod(score);
            return (
              <div key={name} className="rounded-lg bg-surface-800 py-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase text-surface-500">{ABBR_MAP[name]}</p>
                <p className="mt-0.5 text-lg font-bold text-surface-100">{score}</p>
                <p className={`text-xs font-medium ${m >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{m >= 0 ? "+" : ""}{m}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rest & Level Up Controls */}
      <div className="flex gap-2">
        <button onClick={() => {
          // Short rest: restore some HP, refresh short-rest resources
          const healAmt = Math.floor(character.hitPoints.max * 0.25);
          const newHp = Math.min(character.hitPoints.max, character.hitPoints.current + healAmt);
          updateCharacter(character.id, {
            hitPoints: { ...character.hitPoints, current: newHp },
            updatedAt: Date.now(),
          } as any);
          // Reset short-rest resources
          const updatedResources = ((character as any).resources ?? []).map((r: any) =>
            r.recharge === "short" ? { ...r, current: r.max } : r
          );
          if (updatedResources.length > 0) {
            updateCharacter(character.id, { resources: updatedResources, updatedAt: Date.now() } as any);
          }
          showToast({ message: `Short rest! Healed ${healAmt} HP. Short-rest resources restored.`, type: "success" });
        }}
          className="flex-1 rounded-xl border border-divine-500/30 bg-divine-500/10 p-3 text-center hover:bg-divine-500/20 transition-colors">
          <span className="text-lg">🏕️</span>
          <p className="text-xs font-medium text-divine-400 mt-1">Short Rest</p>
          <p className="text-[9px] text-divine-500/70">Heal 25% HP + recharge</p>
        </button>
        <button onClick={() => {
          // Long rest: full heal, restore all resources
          updateCharacter(character.id, {
            hitPoints: { ...character.hitPoints, current: character.hitPoints.max, temporary: 0 },
            updatedAt: Date.now(),
          } as any);
          const updatedResources = ((character as any).resources ?? []).map((r: any) =>
            ({ ...r, current: r.max })
          );
          if (updatedResources.length > 0) {
            updateCharacter(character.id, { resources: updatedResources, updatedAt: Date.now() } as any);
          }
          showToast({ message: `Long rest! Fully healed. All resources restored.`, type: "success" });
        }}
          className="flex-1 rounded-xl border border-rogue-500/30 bg-rogue-500/10 p-3 text-center hover:bg-rogue-500/20 transition-colors">
          <span className="text-lg">🛌</span>
          <p className="text-xs font-medium text-rogue-400 mt-1">Long Rest</p>
          <p className="text-[9px] text-rogue-500/70">Full heal + all resources</p>
        </button>
        <button onClick={() => {
          const newLevel = (character.level ?? 1) + 1;
          updateCharacter(character.id, {
            level: newLevel,
            updatedAt: Date.now(),
          } as any);
          showToast({ message: `Level up! ${character.name} is now level ${newLevel}! 🎉`, type: "success" });
        }}
          className="flex-1 rounded-xl border border-accent-500/30 bg-accent-500/10 p-3 text-center hover:bg-accent-500/20 transition-colors">
          <span className="text-lg">⬆️</span>
          <p className="text-xs font-medium text-accent-400 mt-1">Level Up</p>
          <p className="text-[9px] text-accent-500/70">Current: Level {character.level ?? 1}</p>
        </button>
      </div>

      {/* Resources & Spell Slots */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Custom Resources */}
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-surface-400">⚡ Resources</h2>
            <button onClick={() => { setResources([...characterResources]); setShowResourceEditor(true); }} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">✏️ Edit</button>
          </div>
          {characterResources.length === 0 ? (
            <p className="text-xs text-surface-500">No resources tracked yet. Click edit to add abilities like Kol points, Bardic Inspiration, etc.</p>
          ) : (
            <div className="space-y-2">
              {characterResources.map((res) => (
                <div key={res.id} className="rounded-lg bg-surface-800 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-surface-200">{res.name}</span>
                    <span className="text-xs font-bold text-accent-400">{res.current}/{res.max}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface-700 overflow-hidden">
                    <div className="h-full rounded-full bg-accent-500" style={{
                      width: `${Math.max(0, Math.min(100, (res.current / (res.max || 1)) * 100))}%`
                    }} />
                  </div>
                  <p className="text-[9px] text-surface-500 mt-0.5">Recharges: {res.recharge === "long" ? "Long Rest" : res.recharge === "short" ? "Short Rest" : res.recharge}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Spell Slots */}
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">📖 Spell Slots</h2>
          {!character.class?.toLowerCase().includes("bard") && !character.class?.toLowerCase().includes("cleric") &&
           !character.class?.toLowerCase().includes("druid") && !character.class?.toLowerCase().includes("sorcerer") &&
           !character.class?.toLowerCase().includes("warlock") && !character.class?.toLowerCase().includes("wizard") &&
           !character.class?.toLowerCase().includes("paladin") && !character.class?.toLowerCase().includes("ranger") &&
           !character.class?.toLowerCase().includes("artificer") && !character.class?.toLowerCase().includes("bard") ? (
            <p className="text-xs text-surface-500">No spell slots needed for this class.</p>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, Math.min(9, Math.ceil((character.level ?? 1) / 2) + 1)).map((lvl) => {
                const slotsKey = `spellSlots${lvl}`;
                const totalSlots = (character as any).spellSlots?.[lvl] ?? 0;
                const usedSlots = (character as any).spellSlots?.[`used${lvl}`] ?? 0;
                if (totalSlots === 0 && lvl > 2) return null;
                return (
                  <div key={lvl} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-1.5">
                    <span className="text-xs text-surface-400">Level {lvl}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalSlots }, (_, i) => (
                        <span key={i} className={`h-3 w-3 rounded-full ${i < usedSlots ? 'bg-surface-600' : 'bg-accent-500'}`} />
                      ))}
                      {totalSlots === 0 && <span className="text-xs text-surface-600">—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Resource Editor Modal */}
      {showResourceEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowResourceEditor(false)}>
          <div className="w-full max-w-md rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-surface-100">Edit Resources</h3>
              <Button size="xs" variant="ghost" onClick={addResource}>+ Add</Button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {resources.map((res, index) => (
                <div key={res.id} className="rounded-lg border border-surface-700 bg-surface-800 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={res.name} onChange={(e) => updateResource(index, "name", e.target.value)}
                      placeholder="Resource name..."
                      className="flex-1 rounded border border-surface-700 bg-surface-900 px-2 py-1 text-xs text-surface-100 focus:border-accent-500 focus:outline-none" />
                    <button onClick={() => setResources(prev => prev.filter((_, i) => i !== index))}
                      className="text-warrior-400 hover:text-warrior-300 text-xs">🗑️</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-surface-400">Current</span>
                      <input type="number" value={res.current} onChange={(e) => updateResource(index, "current", parseInt(e.target.value) || 0)}
                        min={0} className="w-14 rounded border border-surface-700 bg-surface-900 px-1 py-0.5 text-xs text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
                    </div>
                    <span className="text-surface-600">/</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-surface-400">Max</span>
                      <input type="number" value={res.max} onChange={(e) => updateResource(index, "max", parseInt(e.target.value) || 0)}
                        min={0} className="w-14 rounded border border-surface-700 bg-surface-900 px-1 py-0.5 text-xs text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
                    </div>
                    <select value={res.recharge} onChange={(e) => updateResource(index, "recharge", e.target.value)}
                      className="rounded border border-surface-700 bg-surface-900 px-1 py-0.5 text-[10px] text-surface-100 focus:border-accent-500 focus:outline-none">
                      <option value="long">Long Rest</option>
                      <option value="short">Short Rest</option>
                      <option value="none">No Recharge</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setShowResourceEditor(false)}>Cancel</Button>
              <Button size="sm" onClick={handleResourceSave}>Save Resources</Button>
            </div>
          </div>
        </div>
      )}

      {/* Saving Throws & Skills */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Saving Throws</h2>
          <div className="space-y-1.5">
            {ABILITY_KEYS.map((name) => {
              const abbr = ABBR_MAP[name];
              const mod = abilityMod(character[name]);
              const st = character.savingThrows?.[name];
              const isProficient = st?.proficient ?? (character.proficiencies ?? []).some((p: unknown) => typeof p === 'string' ? p.toLowerCase().includes(name) : false) ?? false;
              const profBonus = character.proficiencyBonus ?? 2;
              const val = isProficient ? mod + profBonus : mod;
              return (
                <div key={name} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2">
                  <div className="flex items-center gap-2">
                    {isProficient && <span className="h-1.5 w-1.5 rounded-full bg-rogue-500" />}
                    <span className={`text-sm ${isProficient ? "font-semibold text-surface-100" : "text-surface-400"}`}>{abbr}</span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${val >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{val >= 0 ? "+" : ""}{val}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Skills</h2>
          <div className="grid grid-cols-1 gap-1">
            {SKILL_ENTRIES.map((entry) => {
              const val = skillBonus(entry.key, character, profSkills, character.proficiencyBonus ?? 2);
              return (
                <div key={entry.key} className="flex items-center justify-between rounded-md px-2.5 py-1.5 hover:bg-surface-800">
                  <div className="flex items-center gap-2">
                    {profSkills.has(entry.key) && <span className="h-1 w-1 rounded-full bg-rogue-500" />}
                    <span className={`text-xs ${profSkills.has(entry.key) ? "font-medium text-surface-200" : "text-surface-400"}`}>{entry.label}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${val >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{val >= 0 ? "+" : ""}{val}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Features */}
      {character.features.length > 0 && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Features and Traits</h2>
          <div className="flex flex-wrap gap-2">
            {character.features.map((feat, i) => {
              const name = typeof feat === 'string' ? feat : feat.name;
              return (
                <span key={i} className="rounded-full bg-accent-500/10 px-3 py-1 text-xs text-accent-400 ring-1 ring-accent-500/20">{name}</span>
              );
            })}
          </div>
        </section>
      )}

      {/* Inventory Management */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-surface-400">🎒 Inventory</h2>
          <button onClick={() => setShowInventoryEditor(true)} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">✏️ Edit</button>
        </div>
        {character.equipment.length === 0 ? (
          <p className="text-xs text-surface-500">No items in inventory.</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {character.equipment.map((item, i) => (
              <div key={"eq-" + i} className="rounded-lg bg-surface-800 px-3 py-2 text-xs text-surface-300">
                {item.item}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Inventory Editor Modal */}
      {showInventoryEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInventoryEditor(false)}>
          <div className="w-full max-w-md rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-sm font-semibold text-surface-100">Edit Inventory</h3>
              <Button size="xs" variant="ghost" onClick={() => {
                setEquipmentDraft([...equipmentDraft, { item: "", quantity: 1 }]);
              }}>+ Add Item</Button>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1">
              {equipmentDraft.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg bg-surface-800 p-2">
                  <input value={item.item} onChange={(e) => {
                    const newDraft = [...equipmentDraft];
                    newDraft[idx] = { ...newDraft[idx], item: e.target.value };
                    setEquipmentDraft(newDraft);
                  }} placeholder="Item name"
                    className="flex-1 rounded border border-surface-700 bg-surface-900 px-2 py-1 text-xs text-surface-100 focus:border-accent-500 focus:outline-none" />
                  <input type="number" value={item.quantity} onChange={(e) => {
                    const newDraft = [...equipmentDraft];
                    newDraft[idx] = { ...newDraft[idx], quantity: parseInt(e.target.value) || 1 };
                    setEquipmentDraft(newDraft);
                  }} min={1} className="w-14 rounded border border-surface-700 bg-surface-900 px-1 py-1 text-xs text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
                  <button onClick={() => setEquipmentDraft(prev => prev.filter((_, i) => i !== idx))}
                    className="text-warrior-400 hover:text-warrior-300 text-xs shrink-0">🗑️</button>
                </div>
              ))}
              {equipmentDraft.length === 0 && (
                <p className="text-xs text-surface-500 text-center py-4">No items. Click "+ Add Item" to start.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-3 shrink-0 border-t border-surface-700 pt-3">
              <Button variant="ghost" size="sm" onClick={() => setShowInventoryEditor(false)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                const validEquipment = equipmentDraft.filter(e => e.item.trim());
                updateCharacter(character.id, {
                  equipment: validEquipment,
                  updatedAt: Date.now(),
                });
                setShowInventoryEditor(false);
                showToast({ message: `Inventory updated (${validEquipment.length} items)`, type: "success" });
              }}>Save Inventory</Button>
            </div>
          </div>
        </div>
      )}

      {/* Currency */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-surface-400">🪙 Currency</h2>
          <button onClick={() => setShowCurrencyEditor(true)} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">✏️ Edit</button>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center">
          <CurrencyCell label="PP" value={character.currency?.platinum ?? 0} color="gold" />
          <CurrencyCell label="GP (Assarion)" value={character.currency?.gold ?? 0} color="gold" />
          <CurrencyCell label="EP" value={character.currency?.electrum ?? 0} color="surface" />
          <CurrencyCell label="SP (Quadrans)" value={character.currency?.silver ?? 0} color="surface" />
          <CurrencyCell label="CP (Lepton)" value={character.currency?.copper ?? 0} color="surface" />
        </div>
        <p className="mt-2 text-center text-[9px] text-surface-500">50 Leptons = 1 Quadrans | 5 Quadrans = 1 Assarion</p>
      </section>

      {/* Currency Editor Modal */}
      {showCurrencyEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCurrencyEditor(false)}>
          <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-surface-100 mb-4">Edit Currency</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {(["platinum", "gold", "electrum", "silver", "copper"] as const).map((coin) => (
                <div key={coin} className="text-center">
                  <label className="text-[10px] text-surface-400 uppercase block mb-1">
                    {coin === "platinum" ? "PP" : coin === "gold" ? "GP" : coin === "electrum" ? "EP" : coin === "silver" ? "SP" : "CP"}
                  </label>
                  <input type="number" min={0} value={draftCurrency[coin]}
                    onChange={(e) => setDraftCurrency(prev => ({ ...prev, [coin]: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded border border-surface-700 bg-surface-900 px-1 py-1 text-xs text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCurrencyEditor(false)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                updateCharacter(character.id, {
                  currency: draftCurrency,
                  updatedAt: Date.now(),
                });
                setShowCurrencyEditor(false);
                showToast({ message: "Currency updated", type: "success" });
              }}>Save Currency</Button>
            </div>
          </div>
        </div>
      )}

      {/* Backstory */}
      {character.backstory && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-surface-400">Backstory</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-300">{character.backstory}</p>
        </section>
      )}

      {/* Character Notes */}
      {character.characterNotes && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-surface-400">Notes</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-300">{character.characterNotes}</p>
        </section>
      )}
    </div>
  );
}

/* ── Sub-Components ─────────────────────────────────────────── */

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    warrior: "border-warrior-500/30 bg-warrior-500/10 text-warrior-400",
    mage: "border-mage-500/30 bg-mage-500/10 text-mage-400",
    rogue: "border-rogue-500/30 bg-rogue-500/10 text-rogue-400",
    divine: "border-divine-500/30 bg-divine-500/10 text-divine-400",
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colorMap[color] ?? "border-surface-700 bg-surface-800 text-surface-300"}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}

function CurrencyCell({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    gold: "text-amber-300",
    surface: "text-surface-300",
  };
  return (
    <div className="rounded-lg bg-surface-800 py-2">
      <p className={`text-xs font-bold ${colorMap[color] ?? "text-surface-300"}`}>{value}</p>
      <p className="text-[9px] text-surface-500">{label}</p>
    </div>
  );
}
