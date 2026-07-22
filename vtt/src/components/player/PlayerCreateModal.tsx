/**
 * STᚱ VTT — Player Create Modal (Refactored Orchestrator)
 *
 * REFACTOR (Sprint 10): Monolith of 524 lines → 260-line orchestrator.
 *
 * EXTRACTED (NEW):
 *   - lib/character/class-defaults.ts     — Pure data: CLASSES, stats, HIT_DIE, calcHp, calcAc
 *   - CharacterFormFields.tsx             — Name + Player Name inputs
 *   - RaceClassSelector.tsx                — Race/Subrace/Class/Level selectors
 *   - PortraitPicker.tsx                  — Image URL, gallery toggle, live preview
 *
 * KEPT (Existing):
 *   - AbilityScoreRoller / DerivedStatsPreview
 *   - AssetBrowser
 *   - Modal
 *   - setCharacter (Firestore)
 */

import { useState, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { setCharacter } from "@/lib/firestore-service";
import { FALLBACK_CAMPAIGN_ID } from "@/hooks/useFirestoreSync";
import Modal from "@/components/ui/Modal";
import AbilityScoreRoller from "@/components/player/AbilityScoreRoller";
import DerivedStatsPreview from "@/components/player/DerivedStatsPreview";
import CharacterFormFields from "@/components/player/CharacterFormFields";
import RaceClassSelector from "@/components/player/RaceClassSelector";
import PortraitPicker from "@/components/player/PortraitPicker";
import BackgroundSelector from "@/components/player/BackgroundSelector";
import type { PlayerCharacter } from "@/types";
import { SRD_RACES } from "@/data/srd-races";
import type { RaceDefinition } from "@/types/race-class";
import {
  DEFAULT_STATS_BY_CLASS,
  HIT_DIE_BY_CLASS,
  SPELLCASTING_CLASSES,
  calcHp,
  calcAc,
  type ClassAbilityDefaults,
} from "@/lib/character/class-defaults";

interface PlayerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  homebrewRaces?: RaceDefinition[];
}

function createBlankCharacter(): PlayerCharacter {
  return {
    id: "",
    name: "",
    playerName: "Player",
    race: "Human",
    class: "Fighter",
    level: 1,
    classes: [{ name: "Fighter", level: 1 }],
    experiencePoints: 0,
    background: "Custom",
    alignment: "Lawful Good",
    inspiration: false,
    strength: 10, dexterity: 10, constitution: 10,
    intelligence: 10, wisdom: 10, charisma: 10,
    savingThrows: {
      strength: { proficient: false, bonus: 0 },
      dexterity: { proficient: false, bonus: 0 },
      constitution: { proficient: false, bonus: 0 },
      intelligence: { proficient: false, bonus: 0 },
      wisdom: { proficient: false, bonus: 0 },
      charisma: { proficient: false, bonus: 0 },
    },
    skills: {},
    hitPoints: { current: 10, max: 10, temporary: 0 },
    armorClass: 10,
    initiative: 0,
    speed: { walk: 30 },
    hitDice: "1d10",
    proficiencyBonus: 2,
    conditions: [],
    preparedSpells: [],
    activeFeats: [],
    deathSaves: { successes: 0, failures: 0 },
    temporaryHitPoints: 0,
    traits: [],
    proficiencies: [],
    languages: ["Common"],
    features: [],
    equipment: [],
    inventory: [],
    currency: { leptons: 0, quadrants: 0, assarions: 0 },
    appearance: "",
    backstory: "",
    allies: "",
    characterNotes: "",
    isHomebrew: false,
    spentHitDice: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function PlayerCreateModal({ isOpen, onClose, homebrewRaces = [] }: PlayerCreateModalProps) {
  const addCharacter = useCampaignStore((s) => s.addCharacter);

  // Merge SRD + homebrew races
  const allRaces = useMemo(() => {
    const names = new Set<string>();
    const merged: { name: string; race: RaceDefinition }[] = [];
    for (const r of [...SRD_RACES, ...homebrewRaces]) {
      if (!names.has(r.name)) {
        names.add(r.name);
        merged.push({ name: r.name, race: r });
      }
    }
    return merged;
  }, [homebrewRaces]);

  // ── Form State ──
  const [name, setName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [raceName, setRaceName] = useState("Human");
  const [subraceIndex, setSubraceIndex] = useState<number | undefined>(undefined);
  const [className, setClassName] = useState("Fighter");
  const [alias, setAlias] = useState("");
  const [level, setLevel] = useState(1);
  const [imageUrl, setImageUrl] = useState("");
  const [backgroundName, setBackgroundName] = useState("Custom");

  const [abilityScores, setAbilityScores] = useState({
    strength: DEFAULT_STATS_BY_CLASS.Fighter.str,
    dexterity: DEFAULT_STATS_BY_CLASS.Fighter.dex,
    constitution: DEFAULT_STATS_BY_CLASS.Fighter.con,
    intelligence: DEFAULT_STATS_BY_CLASS.Fighter.int,
    wisdom: DEFAULT_STATS_BY_CLASS.Fighter.wis,
    charisma: DEFAULT_STATS_BY_CLASS.Fighter.cha,
  });

  // ── Handlers ──
  const handleReset = useCallback(() => {
    setName("");
    setAlias("");
    setPlayerName("");
    setRaceName("Human");
    setSubraceIndex(undefined);
    setClassName("Fighter");
    setLevel(1);
    setImageUrl("");
    setBackgroundName("Custom");
    const def = DEFAULT_STATS_BY_CLASS.Fighter;
    setAbilityScores({
      strength: def.str, dexterity: def.dex, constitution: def.con,
      intelligence: def.int, wisdom: def.wis, charisma: def.cha,
    });
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleRaceChange = useCallback((newRace: string) => {
    setRaceName(newRace);
    setSubraceIndex(undefined);
    const rd = allRaces.find((r) => r.name === newRace)?.race;
    if (rd && rd.abilityBonuses.length > 0) {
      setAbilityScores((prev) => {
        const next = { ...prev };
        for (const b of rd.abilityBonuses) {
          const key = b.ability as keyof typeof next;
          next[key] = Math.min(20, Math.max(3, next[key] + b.bonus));
        }
        return next;
      });
    }
  }, [allRaces]);

  const handleClassChange = useCallback((newClass: string, stats: ClassAbilityDefaults) => {
    setClassName(newClass);
    setAbilityScores({
      strength: stats.str, dexterity: stats.dex, constitution: stats.con,
      intelligence: stats.int, wisdom: stats.wis, charisma: stats.cha,
    });
  }, []);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;

    const hp = calcHp(className, abilityScores.constitution, level);
    const ac = calcAc(className, abilityScores.dexterity);
    const pb = Math.ceil(level / 4) + 1;
    const hitDie = HIT_DIE_BY_CLASS[className] || "1d8";

    const raceDef = allRaces.find((r) => r.name === raceName)?.race;
    const walkSpeed = raceDef?.baseSpeed || 30;
    const darkvision = raceDef?.darkvision || 0;
    const raceTraits = raceDef?.traits || [];
    const subraceTraits =
      subraceIndex !== undefined && raceDef?.subraces?.[subraceIndex]
        ? raceDef.subraces[subraceIndex].traits
        : [];

    const char = createBlankCharacter();
    char.id = `pc_${Date.now()}`;
    char.name = name.trim();
    char.alias = alias.trim() || undefined;
    char.playerName = playerName.trim() || "Player";
    char.race = raceName;
    char.class = className;
    char.level = level;
    char.classes = [{ name: className, level }];
    char.strength = abilityScores.strength;
    char.dexterity = abilityScores.dexterity;
    char.constitution = abilityScores.constitution;
    char.intelligence = abilityScores.intelligence;
    char.wisdom = abilityScores.wisdom;
    char.charisma = abilityScores.charisma;
    char.hitPoints = { current: hp, max: hp, temporary: 0 };
    char.armorClass = ac;
    char.initiative = Math.floor((abilityScores.dexterity - 10) / 2);
    char.speed = { walk: walkSpeed };
    char.hitDice = hitDie;
    char.proficiencyBonus = pb;
    char.traits = [
      ...raceTraits.map((t: string) => ({ name: t.split(":")[0].trim(), description: t, source: "Racial Trait" })),
      ...subraceTraits.map((t: string) => ({ name: t.split(":")[0].trim(), description: t, source: "Subrace" })),
    ];
    char.features = [...char.traits];
    char.languages = ["Common", ...(raceDef?.languages.filter((l) => l !== "Common") || [])];
    char.background = backgroundName;
    char.imageUrl = imageUrl.trim() || undefined;

    addCharacter(char);
    setCharacter(FALLBACK_CAMPAIGN_ID, char.id, char).catch((err) => {
      console.warn("[Firestore] Failed to write new character:", err);
    });
    handleClose();
  }, [name, playerName, raceName, className, level, imageUrl, abilityScores, addCharacter, handleClose, allRaces, subraceIndex, backgroundName]);

  const isValid = name.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Player Character" size="lg" showOrnaments>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-gold px-1">
        {/* Name Fields */}
        <CharacterFormFields
          name={name}
          onNameChange={setName}
          alias={alias}
          onAliasChange={setAlias}
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
        />

        {/* Background */}
        <BackgroundSelector value={backgroundName} onChange={(name) => setBackgroundName(name)} />

        {/* Race / Class / Level */}
        <RaceClassSelector
          raceName={raceName}
          onRaceChange={handleRaceChange}
          subraceIndex={subraceIndex}
          onSubraceChange={setSubraceIndex}
          className={className}
          onClassChange={handleClassChange}
          level={level}
          onLevelChange={setLevel}
          allRaces={allRaces}
        />

        {/* Ability Scores */}
        <div className="bg-gradient-to-b from-[#14151f]/80 to-[#0c0d15]/90 border border-white/[0.04] rounded-xl p-3 space-y-3">
          <AbilityScoreRoller scores={abilityScores} onChange={setAbilityScores} />
          <div className="border-t border-white/[0.04] pt-3">
            <DerivedStatsPreview
              strength={abilityScores.strength}
              dexterity={abilityScores.dexterity}
              constitution={abilityScores.constitution}
              intelligence={abilityScores.intelligence}
              wisdom={abilityScores.wisdom}
              charisma={abilityScores.charisma}
              level={level}
              hitDie={HIT_DIE_BY_CLASS[className] || "1d8"}
              showSpellcasting={SPELLCASTING_CLASSES.has(className)}
              primaryClass={className}
            />
          </div>
        </div>

        {/* Race Info Card */}
        {(() => {
          const rd = allRaces.find((r) => r.name === raceName)?.race;
          if (!rd) return null;
          return (
            <div className="bg-gradient-to-br from-[#14151f]/60 to-[#0c0d15]/80 border border-white/[0.04] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{rd.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">
                  Race Features
                </span>
                {rd.isHomebrew && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-gold-500/10 text-gold-400 border border-gold/15">
                    Homebrew
                  </span>
                )}
              </div>
              <p className="text-[10px] text-surface-500 mb-2">{rd.description}</p>
              <div className="flex flex-wrap gap-1">
                {rd.traits.slice(0, 2).map((t: string, i: number) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded text-[8px] bg-cyan-500/8 text-cyan-400 border border-cyan-500/10"
                  >
                    {t.split(":")[0]}
                  </span>
                ))}
                {rd.traits.length > 2 && (
                  <span className="text-[8px] text-surface-600">+{rd.traits.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Portrait Picker */}
        <PortraitPicker imageUrl={imageUrl} onImageUrlChange={setImageUrl} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gold/8 mt-4">
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-xl text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/30 active:scale-95 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!isValid}
          className="px-5 py-2.5 rounded-xl bg-gold-500/15 border border-gold/25 text-gold-400 text-sm font-semibold hover:bg-gold-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Create Character
        </button>
      </div>
    </Modal>
  );
}
