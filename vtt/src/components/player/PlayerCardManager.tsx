/**
 * ST R VTT - Player Card Manager
 *
 * DM-facing overlay for managing characters from the party roster.
 * Provides: delete character, duplicate character, quick edit of race/class/level,
 * and a "Level Up" all shortcut.
 *
 * Accessed via a [Manage] gear icon on each card.
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { setCharacter } from "@/lib/firestore-service";
import { FALLBACK_CAMPAIGN_ID } from "@/hooks/useFirestoreSync";
import LevelUpPanel from "./LevelUpPanel";
import type { PlayerCharacter } from "@/types";

interface PlayerCardManagerProps {
  isOpen: boolean;
  character: PlayerCharacter;
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

export default function PlayerCardManager({ isOpen, character, onClose }: PlayerCardManagerProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const removeCharacter = useCampaignStore((s) => s.removeCharacter);
  const addCharacter = useCampaignStore((s) => s.addCharacter);

  const [race, setRace] = useState(character.race);
  const [className, setClassName] = useState(character.class);
  const [level, setLevel] = useState(character.level);
  const [playerName, setPlayerName] = useState(character.playerName || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLevelUpPanel, setShowLevelUpPanel] = useState(false);

  const handleSave = useCallback(() => {
    updateCharacter(character.id, {
      race,
      class: className,
      level,
      playerName: playerName.trim() || character.playerName,
    });
    onClose();
  }, [character.id, character.playerName, race, className, level, playerName, updateCharacter, onClose]);

  const handleDuplicate = useCallback(() => {
    const clone: PlayerCharacter = {
      ...character,
      id: `pc_${Date.now()}`,
      name: `${character.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addCharacter(clone);
    setCharacter(FALLBACK_CAMPAIGN_ID, clone.id, clone).catch(() => {});
    onClose();
  }, [character, addCharacter, onClose]);

  const handleDelete = useCallback(() => {
    removeCharacter(character.id);
    onClose();
  }, [character.id, removeCharacter, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="glass-gold rounded-2xl w-full max-w-md mx-4 border border-gold/10 shadow-2xl shadow-gold-500/5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner ornaments */}
        <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-br corner-gold corner-gold-glow" />

        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-gold/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙</span>
              <h2 className="text-sm font-black text-gold tracking-tight">
                Manage: {character.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all duration-150"
            >
              ✕
            </button>
          </div>
          <p className="text-[10px] text-surface-500 mt-0.5">
            {character.race} {character.class} · Level {character.level}
          </p>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Player Name */}
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">
              Player Name
            </label>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-[#07080d] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-surface-200 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15"
            />
          </div>

          {/* Race / Class / Level */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Race</label>
              <select
                value={race}
                onChange={(e) => setRace(e.target.value)}
                className="w-full bg-[#07080d] border border-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-surface-200 focus:outline-none focus:border-gold/25 appearance-none cursor-pointer"
              >
                {RACES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Class</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-[#07080d] border border-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-surface-200 focus:outline-none focus:border-gold/25 appearance-none cursor-pointer"
              >
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Level</label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLevel(Math.max(1, level - 1))}
                  className="w-7 h-7 rounded-lg bg-[#07080d] border border-white/[0.06] text-surface-400 hover:text-gold-400 active:scale-90 text-xs flex items-center justify-center"
                >−</button>
                <span className="text-sm font-bold tabular-nums text-gold-300 w-5 text-center">{level}</span>
                <button
                  onClick={() => setLevel(Math.min(20, level + 1))}
                  className="w-7 h-7 rounded-lg bg-[#07080d] border border-white/[0.06] text-surface-400 hover:text-gold-400 active:scale-90 text-xs flex items-center justify-center"
                >+</button>
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowLevelUpPanel(true)}
              disabled={character.level >= 20}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/12 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ⬆ Level Up Details
            </button>
            <button
              onClick={handleDuplicate}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-gold-500/8 border border-gold/15 text-gold-400 hover:bg-gold-500/12 active:scale-95 transition-all duration-150"
            >
              Duplicate
            </button>
          </div>

          {/* Danger Zone */}
          {showDeleteConfirm ? (
            <div className="rounded-xl bg-rose-500/5 border border-rose-500/15 p-3">
              <p className="text-[10px] text-rose-400 mb-2">
                Are you sure? This permanently removes <strong>{character.name}</strong> from the campaign.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] text-surface-400 border border-white/[0.06] hover:text-surface-200 active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2 rounded-lg text-[10px] font-bold text-rose-400/60 border border-rose-500/8 hover:bg-rose-500/8 hover:text-rose-400 active:scale-95 transition-all duration-150"
            >
              Delete Character
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3 border-t border-gold/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all"
          >
            Save Changes
          </button>
        </div>

        {/* Level-Up Panel */}
        {showLevelUpPanel && (
          <LevelUpPanel
            character={character}
            onClose={() => setShowLevelUpPanel(false)}
          />
        )}
      </div>
    </div>
  );
}
