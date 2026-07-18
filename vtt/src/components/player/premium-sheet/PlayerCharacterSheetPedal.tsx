/* ══════════════════════════════════════════════════════════════
   STᚱ VTT — Player Character Sheet (Pedal-Sheet Edition)
   Complete re-skin of the premium player sheet with the 
   chunky physical card aesthetic inspired by pedal-sheet:
   • Thick 3px borders with 4px hard shadows
   • Press-animated buttons (active:translate-y-[2px])
   • Uppercase tracking-widest labels throughout
   • Per-class color themes
   • Inline HP +/- controls with color-coded bar
   ══════════════════════════════════════════════════════════════ */

import type { PlayerCharacter } from "@/types";
import { getThemeForClass } from "./character-theme";
import { HpBarPedal } from "./HpBarPedal";
import { PrimaryStatsPedal } from "./PrimaryStatsPedal";
import { AbilityGridPedal } from "./AbilityGridPedal";
import { ConditionsPedal } from "./ConditionsPedal";
import { XpBarPedal } from "./XpBarPedal";
import { WeaponsPedal } from "./WeaponsPedal";
import { SpellcastingPedal } from "./SpellcastingPedal";
import "./pedal-styles.css";

interface Props {
  character: PlayerCharacter;
  onHpChange?: (delta: number) => void;
}

export function PlayerCharacterSheetPedal({ character, onHpChange }: Props) {
  const theme = getThemeForClass(character.classes?.[0]?.name || character.class || "");
  const hpPercent = character.hitPoints.max > 0
    ? (character.hitPoints.current / character.hitPoints.max) * 100
    : 0;

  const handleHpChange = (delta: number) => {
    if (onHpChange) onHpChange(delta);
  };

  const conditionList = character.conditions || [];

  return (
    <div className="max-w-2xl mx-auto space-y-3 p-3">
      {/* ── Portrait + Identity Header ─────────────────── */}
      <div className="pedal-card bg-surface-900 p-4 flex items-center gap-4">
        {/* Portrait */}
        <div className="relative w-16 h-16 shrink-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden border-[3px] border-surface-950 shadow-[4px_4px_0px_rgba(15,16,22,0.8)]">
            <img
              src={character.imageUrl || `/images/portraits/${character.name?.toLowerCase().replace(/\s+/g, "_")}.png`}
              alt={character.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/AppIcon.png";
              }}
            />
          </div>
          {/* Level badge */}
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black shadow-[2px_2px_0px_rgba(15,16,22,0.8)] border-2 border-surface-950"
            style={{ background: theme.hexBg, color: "#0f1016" }}
          >
            {character.level}
          </div>
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-white truncate pedal-text-shadow">
            {character.name}
          </h2>
          <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest truncate">
            {character.race} · {character.classes?.map((c) => `${c.name} ${c.level}`).join(" / ") || `${character.class || "Adventurer"} ${character.level}`}
          </p>
          <p className="text-[9px] text-surface-600 mt-0.5">
            {character.playerName ? `Player: ${character.playerName}` : character.background || ""}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 shrink-0">
          <button className="pedal-btn bg-surface-800 text-surface-300 hover:bg-surface-700 px-2 py-1" title="View Sheet">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </button>
          <button className="pedal-btn bg-surface-800 text-surface-300 hover:bg-surface-700 px-2 py-1" title="Edit">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── HP Bar ──────────────────────────────────────── */}
      <HpBarPedal character={character} hpPercent={hpPercent} onHpChange={handleHpChange} />

      {/* ── Primary Stats ───────────────────────────────── */}
      <PrimaryStatsPedal character={character} />

      {/* ── Ability Scores ──────────────────────────────── */}
      <AbilityGridPedal character={character} />

      {/* ── XP Bar ─────────────────────────────────────────── */}
      <XpBarPedal character={character} />

      {/* ── Conditions ──────────────────────────────────── */}
      <ConditionsPedal conditions={conditionList} />

      {/* ── Weapon Attacks ──────────────────────────────── */}
      <WeaponsPedal character={character} />

      {/* ── Spellcasting ────────────────────────────────── */}
      <SpellcastingPedal character={character} />
    </div>
  );
}
