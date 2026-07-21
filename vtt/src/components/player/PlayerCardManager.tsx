/**
 * STᚱ VTT — Player Card Manager (Premium Glass Modal)
 *
 * Premium DM-facing overlay for managing characters from the party roster.
 * Features:
 * - Glass gradient card with multi-layer depth
 * - Corner ornaments and gold edge light
 * - Staggered entrance animation
 * - Quick edit of race/class/level, player name
 * - Duplicate, Level Up, and Delete with confirmation
 * - Premium form controls (glass inputs, gold select, +/- stepper)
 * - Danger zone with two-step delete confirmation
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { setCharacter, deleteCharacter } from "@/lib/firestore-service";
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
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = useCallback(async () => {
    if (isDeleting) return; // Prevent double-clicks during async delete
    setIsDeleting(true);
    try {
      // Delete from Firestore FIRST to prevent race condition where
      // onSnapshot could re-add the character before Firestore delete propagates
      await deleteCharacter(FALLBACK_CAMPAIGN_ID, character.id);
      // Only remove from local Zustand after Firestore confirms deletion
      removeCharacter(character.id);
    } catch (err) {
      console.warn("[PlayerCardManager] Firestore deletion failed:", err);
      // Still remove locally even if Firestore fails
      removeCharacter(character.id);
    }
    onClose();
  }, [character.id, isDeleting, removeCharacter, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {showLevelUpPanel && (
        <LevelUpPanel
          character={character}
          onClose={() => setShowLevelUpPanel(false)}
        />
      )}

      <div
        className="relative bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/90 border border-gold-500/15 rounded-2xl w-full max-w-md mx-4 shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-4 duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold edge light */}
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

        {/* Corner ornaments */}
        <div className="corner-ornament corner-tl corner-gold" />
        <div className="corner-ornament corner-tr corner-gold" />
        <div className="corner-ornament corner-bl corner-gold" />
        <div className="corner-ornament corner-br corner-gold" />

        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-gold-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙</span>
              <h2 className="text-sm font-black text-gold-400 tracking-tight">
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
            <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
              Player Name
            </label>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-[#07080d] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-surface-200 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15 transition-all"
              placeholder="Enter player name..."
            />
          </div>

          {/* Race / Class / Level */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">Race</label>
              <select
                value={race}
                onChange={(e) => setRace(e.target.value)}
                className="w-full bg-[#07080d] border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-surface-200 focus:outline-none focus:border-gold/25 appearance-none cursor-pointer"
              >
                {RACES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">Class</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-[#07080d] border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-surface-200 focus:outline-none focus:border-gold/25 appearance-none cursor-pointer"
              >
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">Level</label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLevel(Math.max(1, level - 1))}
                  className="w-8 h-8 rounded-lg bg-[#07080d] border border-white/[0.06] text-surface-400 hover:text-gold-400 hover:border-gold-500/20 active:scale-90 text-xs flex items-center justify-center transition-all"
                >
                  −
                </button>
                <span className="text-sm font-bold tabular-nums text-gold-300 w-6 text-center">{level}</span>
                <button
                  onClick={() => setLevel(Math.min(20, level + 1))}
                  className="w-8 h-8 rounded-lg bg-[#07080d] border border-white/[0.06] text-surface-400 hover:text-gold-400 hover:border-gold-500/20 active:scale-90 text-xs flex items-center justify-center transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowLevelUpPanel(true)}
              disabled={character.level >= 20}
              className="
                flex-1 py-2 rounded-lg text-[10px] font-bold
                bg-emerald-500/8 border border-emerald-500/15 text-emerald-400
                hover:bg-emerald-500/12 hover:shadow-[0_0_8px_rgba(52,211,153,0.04)]
                active:scale-95 transition-all duration-150
                disabled:opacity-30 disabled:cursor-not-allowed
              "
            >
              ⬆ Level Up Details
            </button>
            <button
              onClick={handleDuplicate}
              className="
                flex-1 py-2 rounded-lg text-[10px] font-bold
                bg-gold-500/8 border border-gold/15 text-gold-400
                hover:bg-gold-500/12 hover:shadow-[0_0_8px_rgba(234,179,8,0.04)]
                active:scale-95 transition-all duration-150
              "
            >
              📋 Duplicate
            </button>
          </div>

          {/* Danger Zone */}
          {showDeleteConfirm ? (
            <div className="rounded-xl bg-rose-500/5 border border-rose-500/15 p-3">
              <p className="text-[10px] text-rose-400 mb-2 leading-relaxed">
                Are you sure? This permanently removes <strong>{character.name}</strong> from the campaign and all associated data.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-1.5 rounded-lg text-[10px] text-surface-400 border border-white/[0.06] hover:text-surface-200 hover:border-white/[0.10] active:scale-95 transition-all disabled:opacity-40"
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
              🗑 Delete Character
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3 border-t border-gold-500/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 hover:shadow-[0_0_8px_rgba(234,179,8,0.04)] active:scale-95 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
