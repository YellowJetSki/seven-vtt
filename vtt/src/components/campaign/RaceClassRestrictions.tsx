/**
 * STᚱ VTT — Race & Class Restrictions (Premium Gold Version)
 *
 * Multi-select chip-based picker for allowed races and classes.
 * DM can restrict character creation options for campaign setting integrity.
 */

import { useState, useCallback, useEffect } from "react";
import type { CampaignSettings } from "@/types";
import SettingsSection from "./SettingsSection";

interface RaceClassRestrictionsProps {
  settings: CampaignSettings;
  onSave: (settings: Partial<CampaignSettings>) => void;
}

const ALL_RACES = [
  "Dwarf", "Elf", "Halfling", "Human", "Dragonborn",
  "Gnome", "Half-Elf", "Half-Orc", "Tiefling",
  "Aasimar", "Firbolg", "Goliath", "Tabaxi", "Kenku",
  "Tortle", "Lizardfolk", "Goblin", "Bugbear", "Hobgoblin",
  "Kobold", "Yuan-Ti", "Warforged", "Centaur", "Minotaur",
  "Satyr", "Owlin", "Harengon", "Fairy", "Aarakocra",
  "Genasi", "Changeling", "Shifter", "Kalashtar", "Verdan",
];

const ALL_CLASSES = [
  "Barbarian", "Bard", "Cleric", "Druid", "Fighter",
  "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer",
  "Warlock", "Wizard", "Artificer", "Blood Hunter",
];

export default function RaceClassRestrictions({ settings, onSave }: RaceClassRestrictionsProps) {
  const [allowedRaces, setAllowedRaces] = useState<string[]>(settings.allowedRaces || []);
  const [allowedClasses, setAllowedClasses] = useState<string[]>(settings.allowedClasses || []);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setAllowedRaces(settings.allowedRaces || []);
    setAllowedClasses(settings.allowedClasses || []);
    setHasChanges(false);
  }, [settings.allowedRaces, settings.allowedClasses]);

  const toggleRace = useCallback((race: string) => {
    setAllowedRaces((prev) => {
      const next = prev.includes(race) ? prev.filter((r) => r !== race) : [...prev, race];
      setHasChanges(true);
      return next;
    });
  }, []);

  const toggleClass = useCallback((cls: string) => {
    setAllowedClasses((prev) => {
      const next = prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls];
      setHasChanges(true);
      return next;
    });
  }, []);

  const selectAllRaces = useCallback(() => {
    setAllowedRaces([...ALL_RACES]);
    setHasChanges(true);
  }, []);

  const clearRaces = useCallback(() => {
    setAllowedRaces([]);
    setHasChanges(true);
  }, []);

  const selectAllClasses = useCallback(() => {
    setAllowedClasses([...ALL_CLASSES]);
    setHasChanges(true);
  }, []);

  const clearClasses = useCallback(() => {
    setAllowedClasses([]);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    onSave({ allowedRaces, allowedClasses });
    setHasChanges(false);
  }, [allowedRaces, allowedClasses, onSave]);

  const raceIcons: Record<string, string> = {
    Dwarf: "DM", Elf: "EL", Halfling: "HF", Human: "HU",
    Dragonborn: "DB", Gnome: "GN", "Half-Elf": "HE", "Half-Orc": "HO",
    Tiefling: "TI", Aasimar: "AA", Firbolg: "FB", Goliath: "GO",
    Tabaxi: "TB", Kenku: "KE", Tortle: "TO", Lizardfolk: "LI",
    Goblin: "GB", Bugbear: "BU", Hobgoblin: "HB", Kobold: "KO",
    "Yuan-Ti": "YT", Warforged: "WF", Centaur: "CE", Minotaur: "MI",
    Satyr: "SA", Owlin: "OW", Harengon: "HA", Fairy: "FA",
    Aarakocra: "AA", Genasi: "GE", Changeling: "CH", Shifter: "SH",
    Kalashtar: "KA", Verdan: "VE",
  };

  const classIcons: Record<string, string> = {
    Barbarian: "BA", Bard: "BR", Cleric: "CL", Druid: "DR",
    Fighter: "FI", Monk: "MO", Paladin: "PA", Ranger: "RA",
    Rogue: "RO", Sorcerer: "SO", Warlock: "WA", Wizard: "WI",
    Artificer: "AR", "Blood Hunter": "BH",
  };

  return (
    <SettingsSection icon="🧬" title="Character Creation" description="Restrict races and classes available to players">
      <div className="space-y-4">
        {/* Races */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-gold-400/60">Allowed Races</label>
            <div className="flex gap-1">
              <button onClick={selectAllRaces} className="text-[8px] px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400/60 hover:text-gold-300 active:scale-95 transition-all">All</button>
              <button onClick={clearRaces} className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/60 hover:text-red-300 active:scale-95 transition-all">Clear</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {ALL_RACES.map((race) => {
              const selected = allowedRaces.includes(race);
              return (
                <button
                  key={race}
                  onClick={() => toggleRace(race)}
                  className={`text-[10px] px-2 py-1 rounded-lg transition-all duration-150 active:scale-90 ${
                    selected
                      ? "bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-300 shadow-[0_0_6px_rgba(234,179,8,0.03)]"
                      : "bg-[#07080d]/70 border border-white/[0.04] text-surface-500 hover:text-surface-300 hover:border-white/[0.08]"
                  }`}
                >
                  {raceIcons[race] || "PC"} {race}
                </button>
              );
            })}
          </div>
        </div>

        {/* Classes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-gold-400/60">Allowed Classes</label>
            <div className="flex gap-1">
              <button onClick={selectAllClasses} className="text-[8px] px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400/60 hover:text-gold-300 active:scale-95 transition-all">All</button>
              <button onClick={clearClasses} className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/60 hover:text-red-300 active:scale-95 transition-all">Clear</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {ALL_CLASSES.map((cls) => {
              const selected = allowedClasses.includes(cls);
              return (
                <button
                  key={cls}
                  onClick={() => toggleClass(cls)}
                  className={`text-[10px] px-2 py-1 rounded-lg transition-all duration-150 active:scale-90 ${
                    selected
                      ? "bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-300 shadow-[0_0_6px_rgba(234,179,8,0.03)]"
                      : "bg-[#07080d]/70 border border-white/[0.04] text-surface-500 hover:text-surface-300 hover:border-white/[0.08]"
                  }`}
                >
                  {classIcons[cls] || "PC"} {cls}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[9px] text-surface-600">
            {allowedRaces.length}/{ALL_RACES.length} races &middot; {allowedClasses.length}/{ALL_CLASSES.length} classes
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            Save Restrictions
          </button>
        </div>
      </div>
    </SettingsSection>
  );
}
