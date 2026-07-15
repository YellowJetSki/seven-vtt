import { useState } from "react";
import type { PlayerCharacter, Skill } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";

interface PlayerCharacterSheetProps {
  character: PlayerCharacter;
}

function modStr(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function mod(score: number): number {
  return Math.floor((score - 10) / 2);
}

const ABILITY_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
type AbilityKey = typeof ABILITY_KEYS[number];
const ABBR_MAP: Record<AbilityKey, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

const SKILL_ENTRIES: { key: Skill; label: string }[] = [
  { key: "acrobatics", label: "Acrobatics" },
  { key: "animalHandling", label: "Animal Handling" },
  { key: "arcana", label: "Arcana" },
  { key: "athletics", label: "Athletics" },
  { key: "deception", label: "Deception" },
  { key: "history", label: "History" },
  { key: "insight", label: "Insight" },
  { key: "intimidation", label: "Intimidation" },
  { key: "investigation", label: "Investigation" },
  { key: "medicine", label: "Medicine" },
  { key: "nature", label: "Nature" },
  { key: "perception", label: "Perception" },
  { key: "performance", label: "Performance" },
  { key: "persuasion", label: "Persuasion" },
  { key: "religion", label: "Religion" },
  { key: "sleightOfHand", label: "Sleight of Hand" },
  { key: "stealth", label: "Stealth" },
  { key: "survival", label: "Survival" },
];

export function PlayerCharacterSheet({ character }: PlayerCharacterSheetProps) {
  const updatePlayerCharacter = useCampaignStore((s) => s.updatePlayerCharacter);
  const showToast = useUiStore((s) => s.showToast);

  const hpPercent = Math.max(0, (character.hitPoints.current / character.hitPoints.max) * 100);

  const [activeTab, setActiveTab] = useState<"sheet" | "combat" | "notes">("sheet");
  const [hpDelta, setHpDelta] = useState("");
  const [notesText, setNotesText] = useState(character.notes ?? "");

  const handleDamage = () => {
    const amt = parseInt(hpDelta);
    if (isNaN(amt) || amt <= 0) return;
    const newHp = Math.max(0, character.hitPoints.current - amt);
    updatePlayerCharacter(character.id, { hitPoints: { ...character.hitPoints, current: newHp } });
    setHpDelta("");
    showToast({ message: `${character.name} takes ${amt} damage!`, type: "info" });
  };

  const handleHeal = () => {
    const amt = parseInt(hpDelta);
    if (isNaN(amt) || amt <= 0) return;
    const newHp = Math.min(character.hitPoints.max, character.hitPoints.current + amt);
    updatePlayerCharacter(character.id, { hitPoints: { ...character.hitPoints, current: newHp } });
    setHpDelta("");
    showToast({ message: `${character.name} heals ${amt} HP!`, type: "success" });
  };

  const handleSetTempHp = () => {
    const amt = parseInt(hpDelta);
    if (isNaN(amt) || amt < 0) return;
    updatePlayerCharacter(character.id, { hitPoints: { ...character.hitPoints, temporary: amt } });
    setHpDelta("");
    showToast({ message: `Temp HP set to ${amt}.`, type: "info" });
  };

  const handleShortRest = () => {
    updatePlayerCharacter(character.id, { hitPoints: { ...character.hitPoints, current: character.hitPoints.max } });
    showToast({ message: "Short rest complete! HP restored to full.", type: "success" });
  };

  const handleExpendSpellSlot = (level: number) => {
    const updated = character.spells.map((slot) => {
      if (slot.level === level && slot.expended < slot.total) {
        return { ...slot, expended: slot.expended + 1 };
      }
      return slot;
    });
    updatePlayerCharacter(character.id, { spells: updated });
    showToast({ message: `Level ${level} spell slot expended.`, type: "info" });
  };

  const handleRecoverSpellSlot = (level: number) => {
    const updated = character.spells.map((slot) => {
      if (slot.level === level && slot.expended > 0) {
        return { ...slot, expended: slot.expended - 1 };
      }
      return slot;
    });
    updatePlayerCharacter(character.id, { spells: updated });
    showToast({ message: `Level ${level} spell slot recovered.`, type: "success" });
  };

  const handleSaveNotes = () => {
    updatePlayerCharacter(character.id, { notes: notesText });
    showToast({ message: "Notes saved!", type: "success" });
  };

  const strMod = mod(character.abilityScores.strength);
  const dexMod = mod(character.abilityScores.dexterity);
  const proficiencyBonus = character.proficiencyBonus ?? 3;
  const passivePerception = 10 + mod(character.abilityScores.wisdom) + (character.skills.perception === 0 ? 0 : proficiencyBonus);

  const weaponAttacks: { name: string; bonus: string; damage: string }[] = [];
  for (const item of character.equipment) {
    const lower = item.toLowerCase();
    if (lower.includes("longsword") || lower.includes("warhammer") || lower.includes("battleaxe") || lower.includes("greatsword") || lower.includes("mace") || lower.includes("quarterstaff")) {
      weaponAttacks.push({ name: item, bonus: modStr(strMod + proficiencyBonus), damage: lower.includes("greatsword") ? "2d6+" + (strMod >= 0 ? strMod : 0) : "1d8+" + (strMod >= 0 ? strMod : 0) });
    } else if (lower.includes("shortsword") || lower.includes("rapier") || lower.includes("scimitar") || lower.includes("dagger")) {
      weaponAttacks.push({ name: item, bonus: modStr(dexMod + proficiencyBonus), damage: lower.includes("dagger") ? "1d4+" + (dexMod >= 0 ? dexMod : 0) : "1d6+" + (dexMod >= 0 ? dexMod : 0) });
    } else if (lower.includes("shortbow") || lower.includes("longbow") || lower.includes("crossbow")) {
      weaponAttacks.push({ name: item, bonus: modStr(dexMod + proficiencyBonus), damage: lower.includes("longbow") || lower.includes("heavy") ? "1d8+" + (dexMod >= 0 ? dexMod : 0) : "1d6+" + (dexMod >= 0 ? dexMod : 0) });
    }
  }

  const spellcastingAbility = character.class.toLowerCase().includes("cleric") || character.class.toLowerCase().includes("druid")
    ? mod(character.abilityScores.wisdom)
    : character.class.toLowerCase().includes("paladin") || character.class.toLowerCase().includes("bard") || character.class.toLowerCase().includes("sorcerer")
      ? mod(character.abilityScores.charisma)
      : character.class.toLowerCase().includes("artificer")
        ? mod(character.abilityScores.intelligence)
        : mod(character.abilityScores.wisdom);
  const spellAttackBonus = modStr(spellcastingAbility + proficiencyBonus);
  const spellSaveDC = 8 + spellcastingAbility + proficiencyBonus;

  const companion = character.companion;
  const resources = character.resources ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex gap-1 rounded-xl border border-surface-700 bg-surface-850 p-1 overflow-x-auto">
        {[
          { id: "sheet" as const, label: "Character Sheet", icon: "clipboard" },
          { id: "combat" as const, label: "Combat", icon: "sword" },
          { id: "notes" as const, label: "Notes", icon: "file-text" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? "bg-accent-500/15 text-accent-300" : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
            }`}
          >
            <span>{tab.id === "sheet" ? "clipboard" : tab.id === "combat" ? "sword" : "file-text"}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "sheet" && (
        <>
          <div className="relative overflow-hidden rounded-2xl border border-surface-700 bg-surface-850">
            <div className="h-1.5 bg-gradient-to-r from-accent-500 via-mage-500 to-rogue-500" />
            <div className="p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-800 ring-1 ring-surface-700 md:h-24 md:w-24">
                  <span className="text-3xl md:text-4xl">
                    {character.race.includes("Dragon") ? "dragon" : character.race.includes("Elf") ? "elf" : character.race.includes("Dwarf") ? "dwarf" : character.race.includes("Halfl") ? "halfling" : character.race.includes("Gnome") ? "gnome" : character.race.includes("Orc") ? "orc" : character.race.includes("Tief") ? "tiefling" : "person"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-surface-100 md:text-3xl">{character.name}</h1>
                  <p className="mt-0.5 text-sm text-surface-400">
                    {character.race}{character.subclass ? " - " + character.subclass + " " + character.class : " - " + character.class} - Level {character.level}
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

          <div className="grid grid-cols-3 gap-3">
            <StatPill label="HP" value={`${character.hitPoints.current}/${character.hitPoints.max}`} color="warrior" />
            <StatPill label="AC" value={String(character.armorClass)} color="mage" />
            <StatPill label="Initiative" value={`+${character.initiative}`} color="rogue" />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-surface-400 mb-1">
              <span>Hit Points</span>
              <span>
                {character.hitPoints.current} / {character.hitPoints.max}
                {character.hitPoints.temporary > 0 && " (+" + character.hitPoints.temporary + " temp)"}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-surface-800">
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${hpPercent}%`,
                background: hpPercent > 50 ? "var(--color-rogue-500)" : hpPercent > 25 ? "var(--color-divine-500)" : "var(--color-warrior-500)",
              }} />
            </div>
          </div>

          <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Ability Scores</h2>
            <div className="grid grid-cols-6 gap-2">
              {ABILITY_KEYS.map((name) => {
                const score = character.abilityScores[name];
                const m = Math.floor((score - 10) / 2);
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

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Saving Throws</h2>
              <div className="space-y-1.5">
                {ABILITY_KEYS.map((name) => {
                  const abbr = ABBR_MAP[name];
                  const val = character.savingThrows[name] ?? 0;
                  return (
                    <div key={name} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2">
                      <div className="flex items-center gap-2">
                        {val !== 0 && <span className="h-1.5 w-1.5 rounded-full bg-rogue-500" />}
                        <span className={`text-sm ${val !== 0 ? "font-semibold text-surface-100" : "text-surface-400"}`}>{abbr}</span>
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
                  const val = character.skills[entry.key] ?? 0;
                  return (
                    <div key={entry.key} className="flex items-center justify-between rounded-md px-2.5 py-1.5 hover:bg-surface-800">
                      <div className="flex items-center gap-2">
                        {val !== 0 && <span className="h-1 w-1 rounded-full bg-rogue-500" />}
                        <span className={`text-xs ${val !== 0 ? "font-medium text-surface-200" : "text-surface-400"}`}>{entry.label}</span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${val >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{val >= 0 ? "+" : ""}{val}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {character.features.length > 0 && (
            <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Features and Traits</h2>
              <div className="flex flex-wrap gap-2">
                {character.features.map((feat) => (
                  <span key={feat} className="rounded-full bg-accent-500/10 px-3 py-1 text-xs text-accent-400 ring-1 ring-accent-500/20">{feat}</span>
                ))}
              </div>
            </section>
          )}

          {character.equipment.length > 0 && (
            <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Equipment</h2>
              <div className="grid grid-cols-2 gap-1.5">
                {character.equipment.map((item, i) => (
                  <div key={"eq-" + i} className="rounded-lg bg-surface-800 px-3 py-2 text-xs text-surface-300">{item}</div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Currency</h2>
            <div className="grid grid-cols-5 gap-2 text-center">
              <CurrencyCell label="PP" value={character.currency.pp} color="gold" />
              <CurrencyCell label="GP (Assarion)" value={character.currency.gp} color="gold" />
              <CurrencyCell label="EP" value={character.currency.ep} color="surface" />
              <CurrencyCell label="SP (Quadrans)" value={character.currency.sp} color="surface" />
              <CurrencyCell label="CP (Lepton)" value={character.currency.cp} color="surface" />
            </div>
            <p className="mt-2 text-center text-[9px] text-surface-500">50 Leptons = 1 Quadrans | 5 Quadrans = 1 Assarion</p>
          </section>

          {character.backstory && (
            <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-surface-400">Backstory</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-300">{character.backstory}</p>
            </section>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 text-center">
              <p className="text-xs text-surface-400">Speed</p>
              <p className="text-lg font-bold text-surface-100">{character.speed} ft.</p>
            </div>
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 text-center">
              <p className="text-xs text-surface-400">Proficiency</p>
              <p className="text-lg font-bold text-surface-100">+{character.proficiencyBonus}</p>
            </div>
          </div>

          <p className="text-center text-[10px] text-surface-600 pb-8">
            Character Sheet - Updated {new Date(character.updatedAt).toLocaleDateString()}
          </p>
        </>
      )}

      {activeTab === "combat" && (
        <div className="space-y-4">
          <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">HP Management</h2>
            <div className="flex items-center gap-2 mb-3">
              <input type="number" min={0} value={hpDelta} onChange={(e) => setHpDelta(e.target.value)} placeholder="Amount"
                className="w-24 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-surface-100 text-center placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
              <button onClick={handleDamage} disabled={!hpDelta || parseInt(hpDelta) <= 0}
                className="rounded-lg bg-warrior-500/20 px-3 py-2 text-xs font-medium text-warrior-400 hover:bg-warrior-500/30 disabled:opacity-40 transition-colors">
                Damage
              </button>
              <button onClick={handleHeal} disabled={!hpDelta || parseInt(hpDelta) <= 0}
                className="rounded-lg bg-rogue-500/20 px-3 py-2 text-xs font-medium text-rogue-400 hover:bg-rogue-500/30 disabled:opacity-40 transition-colors">
                Heal
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSetTempHp} disabled={hpDelta === "" || parseInt(hpDelta) < 0}
                className="rounded-lg bg-mage-500/20 px-3 py-2 text-xs font-medium text-mage-400 hover:bg-mage-500/30 disabled:opacity-40 transition-colors">
                Set Temp HP
              </button>
              <button onClick={handleShortRest}
                className="rounded-lg bg-surface-700 px-3 py-2 text-xs font-medium text-surface-300 hover:bg-surface-600 transition-colors">
                Short Rest
              </button>
            </div>
            {character.hitPoints.temporary > 0 && (
              <p className="mt-2 text-xs text-mage-400">Currently {character.hitPoints.temporary} temporary HP</p>
            )}
          </section>

          <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Senses</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-800 p-3 text-center">
                <p className="text-[10px] text-surface-500">Passive Perception</p>
                <p className="text-lg font-bold text-surface-100">{passivePerception}</p>
              </div>
              <div className="rounded-lg bg-surface-800 p-3 text-center">
                <p className="text-[10px] text-surface-500">Proficiency Bonus</p>
                <p className="text-lg font-bold text-surface-100">+{proficiencyBonus}</p>
              </div>
            </div>
          </section>

          {weaponAttacks.length > 0 && (
            <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Weapon Attacks</h2>
              <div className="space-y-1">
                {weaponAttacks.map((wpn) => (
                  <div key={wpn.name} className="flex items-center justify-between rounded-lg bg-surface-800 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-surface-500">sword</span>
                      <span className="text-sm font-medium text-surface-200">{wpn.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-surface-400">Atk <span className="text-rogue-400 font-bold">{wpn.bonus}</span></span>
                      <span className="text-surface-400">Dmg <span className="text-warrior-400 font-bold">{wpn.damage}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {character.spells.length > 0 && (
            <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Spellcasting</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-surface-800 p-3 text-center">
                  <p className="text-[10px] text-surface-500">Spell Attack</p>
                  <p className="text-lg font-bold text-mage-400">{spellAttackBonus}</p>
                </div>
                <div className="rounded-lg bg-surface-800 p-3 text-center">
                  <p className="text-[10px] text-surface-500">Save DC</p>
                  <p className="text-lg font-bold text-rogue-400">{spellSaveDC}</p>
                </div>
              </div>

              <h3 className="mb-2 text-xs font-medium text-surface-400">Spell Slots</h3>
              <div className="space-y-2">
                {character.spells.map((slot) => {
                  const remaining = slot.total - slot.expended;
                  return (
                    <div key={"slot-" + slot.level} className="flex items-center justify-between rounded-lg bg-surface-800 px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-mage-500/20 text-[10px] font-bold text-mage-400">{slot.level}</span>
                        <span className="text-xs text-surface-300">Level {slot.level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: slot.total }).map((_, i) => (
                            <span key={i} className={"h-3 w-3 rounded-full border transition-all " + (i < slot.expended ? "border-surface-600 bg-surface-700" : "border-mage-500/50 bg-mage-500/20")} />
                          ))}
                        </div>
                        <span className="text-xs text-surface-500 mr-2">{remaining}/{slot.total}</span>
                        {remaining > 0 && (
                          <button onClick={() => handleExpendSpellSlot(slot.level)}
                            className="rounded bg-warrior-500/20 px-2 py-0.5 text-[10px] text-warrior-400 hover:bg-warrior-500/30 transition-colors">
                            Use
                          </button>
                        )}
                        {slot.expended > 0 && (
                          <button onClick={() => handleRecoverSpellSlot(slot.level)}
                            className="rounded bg-rogue-500/20 px-2 py-0.5 text-[10px] text-rogue-400 hover:bg-rogue-500/30 transition-colors">
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {resources.length > 0 && (
            <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Resources</h2>
              <div className="space-y-2">
                {resources.map((res, idx) => (
                  <div key={"res-" + idx} className="flex items-center justify-between rounded-lg bg-surface-800 px-4 py-2.5">
                    <span className="text-xs text-surface-300">{res.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-surface-100">{res.current}/{res.max}</span>
                      <span className="text-[9px] text-surface-500">{res.recharge === "long" ? "Long Rest" : res.recharge === "short" ? "Short Rest" : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {character.features.length > 0 && (
            <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Features and Traits</h2>
              <div className="space-y-1">
                {character.features.map((feat) => (
                  <div key={feat} className="rounded-lg bg-surface-800 px-4 py-2 text-xs text-surface-300">
                    <span className="text-surface-500 mr-2">-</span>{feat}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-4">
          <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Session Notes</h2>
            <textarea value={notesText} onChange={(e) => setNotesText(e.target.value)}
              placeholder="Write your session notes here... NPC names, clues, loot, plans, etc."
              rows={12}
              className="w-full resize-y rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-sm text-surface-200 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setNotesText(character.notes ?? "")}
                className="rounded-lg border border-surface-700 px-4 py-2 text-xs text-surface-400 hover:bg-surface-800 transition-colors">
                Reset
              </button>
              <button onClick={handleSaveNotes}
                className="rounded-lg bg-accent-600 px-4 py-2 text-xs font-medium text-white hover:bg-accent-500 transition-colors">
                Save Notes
              </button>
            </div>
          </section>

          {companion && (
            <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Companion: {companion.name}</h2>
              <div className="rounded-lg bg-surface-800 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-surface-500">Species:</span>
                  <span className="text-surface-200">{companion.species}</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-surface-500">HP: <span className="font-bold text-rogue-400">{companion.hp}</span></span>
                  <span className="text-surface-500">AC: <span className="font-bold text-mage-400">{companion.ac}</span></span>
                  <span className="text-surface-500">Speed: <span className="font-bold text-surface-200">{companion.speed}ft</span></span>
                </div>
                {companion.desc && (
                  <p className="text-xs text-surface-400 leading-relaxed mt-2">{companion.desc}</p>
                )}
                {companion.attacks && (
                  <div className="mt-2">
                    <p className="text-[10px] font-medium text-surface-500 mb-1">Attacks</p>
                    <p className="text-xs text-surface-300 whitespace-pre-wrap">{companion.attacks}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Quick Reference</h2>
            <div className="grid grid-cols-2 gap-3 text-xs text-surface-400">
              <div className="rounded-lg bg-surface-800 p-3">
                <p className="font-medium text-surface-300">AC</p>
                <p className="text-lg font-bold text-surface-100">{character.armorClass}</p>
              </div>
              <div className="rounded-lg bg-surface-800 p-3">
                <p className="font-medium text-surface-300">Speed</p>
                <p className="text-lg font-bold text-surface-100">{character.speed} ft</p>
              </div>
              <div className="rounded-lg bg-surface-800 p-3">
                <p className="font-medium text-surface-300">Initiative</p>
                <p className="text-lg font-bold text-surface-100">+{character.initiative}</p>
              </div>
              <div className="rounded-lg bg-surface-800 p-3">
                <p className="font-medium text-surface-300">Hit Dice</p>
                <p className="text-lg font-bold text-surface-100">{character.hitPoints.max > 30 ? "5d10" : "5d8"}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: "warrior" | "mage" | "rogue" }) {
  const colorMap = {
    warrior: "border-warrior-500/30 bg-warrior-500/10 text-warrior-400",
    mage: "border-mage-500/30 bg-mage-500/10 text-mage-400",
    rogue: "border-rogue-500/30 bg-rogue-500/10 text-rogue-400",
  };
  return (
    <div className={"rounded-xl border p-4 text-center " + colorMap[color]}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-0.5 text-xl font-bold">{value}</p>
    </div>
  );
}

function CurrencyCell({ label, value, color }: { label: string; value: number; color: "gold" | "surface" }) {
  const colorClass = color === "gold"
    ? "text-gold-400 bg-gold-500/10 border-gold-500/20"
    : "text-surface-300 bg-surface-800 border-surface-700";
  return (
    <div className={"rounded-lg border py-2 " + colorClass}>
      <p className="text-[10px] font-semibold uppercase opacity-60">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
