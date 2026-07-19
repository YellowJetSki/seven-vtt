/**
 * STᚱ VTT — Player Create Modal
 *
 * DM-facing character creation form with image URL support.
 * Opens when DM clicks "Add PC" — replaces one-click demo creation.
 *
 * Fields: Name, Race, Class, Level, Image URL (optional)
 * All other fields get sensible defaults for a level-appropriate character.
 * Image URL renders a live preview so the DM can confirm the art.
 */

import { useState, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { setCharacter } from "@/lib/firestore-service";
import { FALLBACK_CAMPAIGN_ID } from "@/hooks/useFirestoreSync";
import Modal from "@/components/ui/Modal";
import AssetBrowser from "@/components/ui/AssetBrowser";
import { type AssetEntry } from "@/images/assetCatalog";
import AbilityScoreRoller from "@/components/player/AbilityScoreRoller";
import DerivedStatsPreview from "@/components/player/DerivedStatsPreview";
import type { PlayerCharacter } from "@/types";
import { SRD_RACES, getRaceByName } from "@/data/srd-races";
import type { RaceDefinition, SubraceDefinition } from "@/types/race-class";

interface PlayerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Homebrew races from the compendium store */
  homebrewRaces?: RaceDefinition[];
}

const CLASSES = [
  "Barbarian", "Bard", "Cleric", "Druid", "Fighter",
  "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer",
  "Warlock", "Wizard", "Artificer", "Blood Hunter",
];

const DEFAULT_STATS_BY_CLASS: Record<string, { str: number; dex: number; con: number; int: number; wis: number; cha: number }> = {
  Barbarian: { str: 16, dex: 14, con: 16, int: 8, wis: 10, cha: 10 },
  Bard: { str: 8, dex: 14, con: 14, int: 12, wis: 10, cha: 16 },
  Cleric: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 8 },
  Druid: { str: 8, dex: 14, con: 14, int: 12, wis: 16, cha: 10 },
  Fighter: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
  Monk: { str: 10, dex: 16, con: 14, int: 10, wis: 16, cha: 8 },
  Paladin: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 16 },
  Ranger: { str: 10, dex: 16, con: 14, int: 12, wis: 14, cha: 8 },
  Rogue: { str: 8, dex: 16, con: 14, int: 14, wis: 10, cha: 12 },
  Sorcerer: { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 },
  Warlock: { str: 8, dex: 14, con: 14, int: 12, wis: 10, cha: 16 },
  Wizard: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 },
  Artificer: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 },
  "Blood Hunter": { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
};

const HIT_DIE_BY_CLASS: Record<string, string> = {
  Barbarian: "1d12", Fighter: "1d10", Paladin: "1d10", Ranger: "1d10",
  Artificer: "1d8", Bard: "1d8", Cleric: "1d8", Druid: "1d8", Monk: "1d8",
  Rogue: "1d8", Warlock: "1d8", "Blood Hunter": "1d10",
  Sorcerer: "1d6", Wizard: "1d6",
};

function calcHp(className: string, con: number, level: number): number {
  const die = HIT_DIE_BY_CLASS[className] || "1d8";
  const dieMax = parseInt(die.replace("1d", ""), 10) || 8;
  const conMod = Math.floor((con - 10) / 2);
  return dieMax + conMod + (level - 1) * (Math.floor(dieMax / 2) + 1 + conMod);
}

function calcAc(className: string, dex: number): number {
  if (className === "Barbarian") return 10 + Math.floor((dex - 10) / 2) + Math.floor((16 - 10) / 2);
  if (className === "Monk") return 10 + Math.floor((dex - 10) / 2) + Math.floor((16 - 10) / 2);
  return 10 + Math.floor((dex - 10) / 2);
}

export default function PlayerCreateModal({ isOpen, onClose, homebrewRaces = [] }: PlayerCreateModalProps) {
  const addCharacter = useCampaignStore((s) => s.addCharacter);

  // Merge SRD races + homebrew races
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

  const [name, setName] = useState("");
  const [raceName, setRaceName] = useState("Human");
  const [subraceIndex, setSubraceIndex] = useState<number | undefined>(undefined);
  const [className, setClassName] = useState("Fighter");
  const [level, setLevel] = useState(1);
  const [imageUrl, setImageUrl] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Interactive ability scores (editable)
  const [abilityScores, setAbilityScores] = useState({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });

  const handleReset = useCallback(() => {
    setName("");
    setRaceName("Human");
    setSubraceIndex(undefined);
    setClassName("Fighter");
    setLevel(1);
    setImageUrl("");
    setPlayerName("");
    setImagePreviewError(false);
    const cls = "Fighter";
    const def = DEFAULT_STATS_BY_CLASS[cls] || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    setAbilityScores({
      strength: def.str,
      dexterity: def.dex,
      constitution: def.con,
      intelligence: def.int,
      wisdom: def.wis,
      charisma: def.cha,
    });
    setShowGallery(false);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;

    const stats = abilityScores;
    const hp = calcHp(className, stats.constitution, level);
    const ac = calcAc(className, stats.dexterity);
    const pb = Math.ceil(level / 4) + 1;
    const hitDie = HIT_DIE_BY_CLASS[className] || "1d8";

    // Get race data for speed/darkvision
    const raceDef = allRaces.find(r => r.name === raceName)?.race;
    const walkSpeed = raceDef?.baseSpeed || 30;
    const raceIcon = raceDef?.icon || "✦";
    const darkvision = raceDef?.darkvision || 0;
    const raceTraits = raceDef?.traits || [];
    const subraceTraits = (subraceIndex !== undefined && raceDef?.subraces?.[subraceIndex])
      ? raceDef.subraces[subraceIndex].traits
      : [];

    const newChar: PlayerCharacter = {
      id: `pc_${Date.now()}`,
      name: name.trim(),
      playerName: playerName.trim() || "Player",
      race: raceName,
      class: className,
      level,
      classes: [{ name: className, level }],
      experiencePoints: 0,
      background: "Custom",
      alignment: "Lawful Good",
      inspiration: false,
      strength: abilityScores.strength,
      dexterity: abilityScores.dexterity,
      constitution: abilityScores.constitution,
      intelligence: abilityScores.intelligence,
      wisdom: abilityScores.wisdom,
      charisma: abilityScores.charisma,
      savingThrows: {
        strength: { proficient: false, bonus: 0 },
        dexterity: { proficient: false, bonus: 0 },
        constitution: { proficient: false, bonus: 0 },
        intelligence: { proficient: false, bonus: 0 },
        wisdom: { proficient: false, bonus: 0 },
        charisma: { proficient: false, bonus: 0 },
      },
      skills: {},
      hitPoints: { current: hp, max: hp, temporary: 0 },
      armorClass: ac,
      initiative: Math.floor((abilityScores.dexterity - 10) / 2),
      speed: { walk: walkSpeed },
      hitDice: hitDie,
      proficiencyBonus: pb,
      conditions: [],
      deathSaves: { successes: 0, failures: 0 },
      temporaryHitPoints: 0,
      traits: [...raceTraits.map(t => ({ name: t.split(":")[0].trim(), description: t, source: "Racial Trait" })), ...subraceTraits.map(t => ({ name: t.split(":")[0].trim(), description: t, source: "Subrace" }))],
      proficiencies: [],
      languages: ["Common", ...(raceDef?.languages.filter(l => l !== "Common") || [])],
      features: [...raceTraits.map(t => ({ name: t.split(":")[0].trim(), description: t, source: "Racial Trait" })), ...subraceTraits.map(t => ({ name: t.split(":")[0].trim(), description: t, source: "Subrace" }))],
      equipment: [],
      inventory: [],
      currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
      appearance: "",
      backstory: "",
      allies: "",
      characterNotes: "",
      imageUrl: imageUrl.trim() || undefined,
      isHomebrew: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Write to both Zustand (instant) and Firestore (real-time sync)
    addCharacter(newChar);
    setCharacter(FALLBACK_CAMPAIGN_ID, newChar.id, newChar).catch((err) => {
      console.warn("[Firestore] Failed to write new character:", err);
    });
    handleClose();
  }, [name, playerName, raceName, className, level, imageUrl, abilityScores, addCharacter, handleClose, allRaces, subraceIndex]);

  const isValid = name.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Player Character" size="lg" showRune>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-gold px-1">
        {/* ── Name ── */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
            Character Name <span className="text-rose-400">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aldric Stormwind"
            className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3.5 py-2.5 text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
            autoFocus
          />
        </div>

        {/* ── Player Name ── */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
            Player Name
          </label>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="e.g. Alice (optional)"
            className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3.5 py-2.5 text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
          />
        </div>

        {/* ── Race / Class / Level row ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Race */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
              Race
            </label>
            <select
              value={raceName}
              onChange={(e) => {
                setRaceName(e.target.value);
                setSubraceIndex(undefined);
                // Default ability scores for this race
                const rd = allRaces.find(r => r.name === e.target.value)?.race;
                if (rd && rd.abilityBonuses.length > 0) {
                  setAbilityScores(prev => {
                    const next = { ...prev };
                    for (const b of rd.abilityBonuses) {
                      const key = b.ability as keyof typeof prev;
                      next[key] = Math.min(20, Math.max(3, next[key] + b.bonus));
                    }
                    return next;
                  });
                }
              }}
              className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
            >
              {allRaces.map(({ name, race: rd }) => (
                <option key={rd.id} value={name} className="bg-obsidian text-surface-200">
                  {rd.icon} {name}{rd.isHomebrew ? " (HB)" : ""}
                </option>
              ))}
            </select>
            {/* Race info badge */}
            {(() => {
              const rd = allRaces.find(r => r.name === raceName)?.race;
              if (!rd) return null;
              return (
                <div className="mt-1 flex items-center gap-1.5 text-[8px] text-surface-500">
                  <span>{rd.size}</span>
                  <span className="text-surface-600">·</span>
                  <span>{rd.baseSpeed}ft</span>
                  {rd.darkvision > 0 && (
                    <><span className="text-surface-600">·</span><span className="text-cyan-400">DV {rd.darkvision}ft</span></>
                  )}
                  {rd.isHomebrew && <span className="text-gold-400">✦ HB</span>}
                </div>
              );
            })()}
          </div>

          {/* Subrace (conditional) */}
          <div>
            {(() => {
              const rd = allRaces.find(r => r.name === raceName)?.race;
              if (!rd?.subraces || rd.subraces.length === 0) return null;
              return (
                <>
                  <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
                    Subrace
                  </label>
                  <select
                    value={subraceIndex ?? 0}
                    onChange={(e) => setSubraceIndex(parseInt(e.target.value))}
                    className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
                  >
                    {rd.subraces.map((sub: SubraceDefinition, i: number) => (
                      <option key={i} value={i} className="bg-obsidian text-surface-200">{sub.name}</option>
                    ))}
                  </select>
                  {subraceIndex !== undefined && rd.subraces[subraceIndex] && (
                    <p className="mt-1 text-[8px] text-surface-500 leading-tight">
                      {rd.subraces[subraceIndex].description.substring(0, 60)}
                    </p>
                  )}
                </>
              );
            })()}
          </div>

          {/* Class */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
              Class
            </label>
            <select
              value={className}
              onChange={(e) => {
                const newClass = e.target.value;
                setClassName(newClass);
                const nd = DEFAULT_STATS_BY_CLASS[newClass] || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
                setAbilityScores({ strength: nd.str, dexterity: nd.dex, constitution: nd.con, intelligence: nd.int, wisdom: nd.wis, charisma: nd.cha });
              }}  className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c} className="bg-obsidian text-surface-200">{c}</option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
              Level
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLevel(Math.max(1, level - 1))}
                className="w-9 h-9 rounded-xl bg-obsidian-mid/60 border border-surface-700/30 text-surface-300 hover:border-gold/20 hover:text-gold-400 active:scale-90 transition-all text-sm flex items-center justify-center"
              >−</button>
              <span className="text-base font-black tabular-nums text-gold-300 w-6 text-center">{level}</span>
              <button
                onClick={() => setLevel(Math.min(20, level + 1))}
                className="w-9 h-9 rounded-xl bg-obsidian-mid/60 border border-surface-700/30 text-surface-300 hover:border-gold/20 hover:text-gold-400 active:scale-90 transition-all text-sm flex items-center justify-center"
              >+</button>
            </div>
          </div>
        </div>

        {/* ── Ability Scores (Interactive) ── */}
        <div className="bg-gradient-to-b from-[#14151f]/80 to-[#0c0d15]/90 border border-white/[0.04] rounded-xl p-3 space-y-3">
          <AbilityScoreRoller
            scores={abilityScores}
            onChange={setAbilityScores}
          />
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
              showSpellcasting={["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard", "Artificer"].includes(className)}
              primaryClass={className}
            />
          </div>
        </div>

        {/* ── RACE INFO CARD (when available) ── */}
        {(() => {
          const rd = allRaces.find(r => r.name === raceName)?.race;
          if (!rd) return null;
          return (
            <div className="bg-gradient-to-br from-[#14151f]/60 to-[#0c0d15]/80 border border-white/[0.04] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{rd.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">
                  Race Features
                </span>
                {rd.isHomebrew && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-gold-500/10 text-gold-400 border border-gold/15">Homebrew</span>
                )}
              </div>
              <p className="text-[10px] text-surface-500 mb-2">{rd.description}</p>
              <div className="flex flex-wrap gap-1">
                {rd.traits.slice(0, 2).map((t, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[8px] bg-cyan-500/8 text-cyan-400 border border-cyan-500/10">
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

        {/* ── Image URL / Gallery toggle ── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60">
              Portrait <span className="text-surface-600">(optional)</span>
            </label>
            <button
              onClick={() => setShowGallery(!showGallery)}
              className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition-all ${
                showGallery
                  ? "bg-gold-500/10 border border-gold-500/20 text-gold-400"
                  : "bg-white/[0.04] border border-white/[0.06] text-surface-500 hover:text-surface-300"
              }`}
            >
              {showGallery ? "✕ Close Gallery" : "🎨 Browse Art"}
            </button>
          </div>

          {/* Gallery mode */}
          {showGallery ? (
            <div className="bg-[#0c0d15] border border-white/[0.04] rounded-xl p-3">
              <AssetBrowser
                category="portrait"
                currentId={selectedAssetId ?? undefined}
                onSelect={(asset: AssetEntry) => {
                  setSelectedAssetId(asset.id);
                  setImageUrl(asset.svg);
                  setImagePreviewError(false);
                  setShowGallery(false);
                }}
                showUrlMode
                onUrlSubmit={(url: string) => {
                  setImageUrl(url);
                  setImagePreviewError(false);
                  setShowGallery(false);
                }}
              />
            </div>
          ) : (
            <>
              <input
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setImagePreviewError(false); setSelectedAssetId(null); }}
                placeholder="https://i.imgur.com/example.jpg"
                className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3.5 py-2.5 text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all font-mono text-[11px]"
              />

              {/* Live preview */}
              {imageUrl.trim() && (
                <div className="mt-2 relative w-full h-24 rounded-xl overflow-hidden border border-surface-700/30">
                  {imageUrl.trim().startsWith("<svg") ? (
                    <div className="w-full h-full flex items-center justify-center bg-obsidian-mid/40">
                      <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: imageUrl.trim() }} />
                    </div>
                  ) : (
                    <>
                      <img
                        src={imageUrl.trim()}
                        alt="Preview"
                        onError={() => setImagePreviewError(true)}
                        onLoad={() => setImagePreviewError(false)}
                        className={`w-full h-full object-cover ${imagePreviewError ? "hidden" : ""}`}
                      />
                      {imagePreviewError && (
                        <div className="w-full h-full flex items-center justify-center bg-obsidian-mid/60">
                          <span className="text-[10px] text-rose-400">Could not load image</span>
                        </div>
                      )}
                      {!imagePreviewError && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-obsidian/80 to-transparent h-8" />
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* ── Footer actions ── */}
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
