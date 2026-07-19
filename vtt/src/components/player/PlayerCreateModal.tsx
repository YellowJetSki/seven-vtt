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

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { setCharacter } from "@/lib/firestore-service";
import { FALLBACK_CAMPAIGN_ID } from "@/hooks/useFirestoreSync";
import Modal from "@/components/ui/Modal";
import AssetBrowser from "@/components/ui/AssetBrowser";
import { getAssetById, type AssetEntry } from "@/images/assetCatalog";
import type { PlayerCharacter } from "@/types";

interface PlayerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RACES = [
  "Dragonborn", "Dwarf", "Elf", "Gnome", "Half-Elf",
  "Half-Orc", "Halfling", "Human", "Tiefling", "Aasimar",
  "Firbolg", "Goliath", "Kenku", "Tabaxi", "Tortle",
];

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

export default function PlayerCreateModal({ isOpen, onClose }: PlayerCreateModalProps) {
  const addCharacter = useCampaignStore((s) => s.addCharacter);

  const [name, setName] = useState("");
  const [race, setRace] = useState("Human");
  const [className, setClassName] = useState("Fighter");
  const [level, setLevel] = useState(1);
  const [imageUrl, setImageUrl] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setName("");
    setRace("Human");
    setClassName("Fighter");
    setLevel(1);
    setImageUrl("");
    setPlayerName("");
    setImagePreviewError(false);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;

    const stats = DEFAULT_STATS_BY_CLASS[className] || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const hp = calcHp(className, stats.con, level);
    const ac = calcAc(className, stats.dex);
    const pb = Math.ceil(level / 4) + 1;
    const hitDie = HIT_DIE_BY_CLASS[className] || "1d8";

    const newChar: PlayerCharacter = {
      id: `pc_${Date.now()}`,
      name: name.trim(),
      playerName: playerName.trim() || "Player",
      race,
      class: className,
      level,
      classes: [{ name: className, level }],
      experiencePoints: 0,
      background: "Custom",
      alignment: "Lawful Good",
      inspiration: false,
      strength: stats.str,
      dexterity: stats.dex,
      constitution: stats.con,
      intelligence: stats.int,
      wisdom: stats.wis,
      charisma: stats.cha,
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
      initiative: Math.floor((stats.dex - 10) / 2),
      speed: { walk: 30 },
      hitDice: hitDie,
      proficiencyBonus: pb,
      conditions: [],
      deathSaves: { successes: 0, failures: 0 },
      temporaryHitPoints: 0,
      traits: [],
      proficiencies: [],
      languages: ["Common"],
      features: [],
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
  }, [name, playerName, race, className, level, imageUrl, addCharacter, handleClose]);

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
              value={race}
              onChange={(e) => setRace(e.target.value)}
              className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
            >
              {RACES.map((r) => (
                <option key={r} value={r} className="bg-obsidian text-surface-200">{r}</option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
              Class
            </label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
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

        {/* ── Auto-computed summary ── */}
        <div className="rounded-xl bg-gold-500/5 border border-gold/10 p-3">
          <h4 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-2">Auto-Computed Stats</h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <span className="text-[8px] uppercase text-surface-500 block">AC</span>
              <span className="text-sm font-bold tabular-nums text-cyan-300">{calcAc(className, DEFAULT_STATS_BY_CLASS[className]?.dex || 10)}</span>
            </div>
            <div>
              <span className="text-[8px] uppercase text-surface-500 block">HP</span>
              <span className="text-sm font-bold tabular-nums text-green-400">{calcHp(className, DEFAULT_STATS_BY_CLASS[className]?.con || 14, level)}</span>
            </div>
            <div>
              <span className="text-[8px] uppercase text-surface-500 block">PB</span>
              <span className="text-sm font-bold tabular-nums text-gold-400">{Math.ceil(level / 4) + 1}</span>
            </div>
            <div>
              <span className="text-[8px] uppercase text-surface-500 block">HD</span>
              <span className="text-sm font-bold tabular-nums text-surface-300">{HIT_DIE_BY_CLASS[className] || "1d8"}</span>
            </div>
          </div>
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
