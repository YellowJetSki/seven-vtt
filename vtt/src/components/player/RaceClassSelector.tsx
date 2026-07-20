/**
 * STᚱ VTT — RaceClassSelector
 *
 * Race, subrace, class, and level selector group for character creation.
 * Includes race info badges, subrace conditional display, and level stepper.
 * Extracted from PlayerCreateModal.tsx monolith (Sprint 10 refactor).
 */

import type { RaceDefinition } from "@/types/race-class";
import { CLASSES, DEFAULT_STATS_BY_CLASS, type ClassAbilityDefaults } from "@/lib/character/class-defaults";

interface RaceClassSelectorProps {
  raceName: string;
  onRaceChange: (race: string) => void;
  subraceIndex: number | undefined;
  onSubraceChange: (idx: number | undefined) => void;
  className: string;
  onClassChange: (cls: string, stats: ClassAbilityDefaults) => void;
  level: number;
  onLevelChange: (lv: number) => void;
  allRaces: Array<{ name: string; race: RaceDefinition }>;
}

export default function RaceClassSelector({
  raceName,
  onRaceChange,
  subraceIndex,
  onSubraceChange,
  className,
  onClassChange,
  level,
  onLevelChange,
  allRaces,
}: RaceClassSelectorProps) {
  const raceDef = allRaces.find((r) => r.name === raceName)?.race;

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Race */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
          Race
        </label>
        <select
          value={raceName}
          onChange={(e) => onRaceChange(e.target.value)}
          className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
        >
          {allRaces.map(({ name, race: rd }) => (
            <option key={rd.id} value={name} className="bg-obsidian text-surface-200">
              {rd.icon} {name}{rd.isHomebrew ? " (HB)" : ""}
            </option>
          ))}
        </select>
        {/* Race info badge */}
        {raceDef && (
          <div className="mt-1 flex items-center gap-1.5 text-[8px] text-surface-500">
            <span>{raceDef.size}</span>
            <span className="text-surface-600">·</span>
            <span>{raceDef.baseSpeed}ft</span>
            {(raceDef.darkvision || 0) > 0 && (
              <>
                <span className="text-surface-600">·</span>
                <span className="text-cyan-400">DV {raceDef.darkvision}ft</span>
              </>
            )}
            {raceDef.isHomebrew && <span className="text-gold-400">✦ HB</span>}
          </div>
        )}
      </div>

      {/* Subrace (conditional) */}
      <div>
        {raceDef?.subraces && raceDef.subraces.length > 0 && (
          <>
            <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
              Subrace
            </label>
            <select
              value={subraceIndex ?? 0}
              onChange={(e) => onSubraceChange(parseInt(e.target.value))}
              className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
            >
              {raceDef.subraces.map((sub: any, i: number) => (
                <option key={i} value={i} className="bg-obsidian text-surface-200">
                  {sub.name}
                </option>
              ))}
            </select>
            {subraceIndex !== undefined && raceDef.subraces[subraceIndex] && (
              <p className="mt-1 text-[8px] text-surface-500 leading-tight">
                {raceDef.subraces[subraceIndex].description.substring(0, 60)}
              </p>
            )}
          </>
        )}
        {/* If no subrace, render placeholder to maintain grid */}
        {(!raceDef?.subraces || raceDef.subraces.length === 0) && (
          <div className="h-[72px]" />
        )}
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
            const def = DEFAULT_STATS_BY_CLASS[newClass] || {
              str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
            };
            onClassChange(newClass, def);
          }}
          className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
        >
          {CLASSES.map((c) => (
            <option key={c} value={c} className="bg-obsidian text-surface-200">
              {c}
            </option>
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
            onClick={() => onLevelChange(Math.max(1, level - 1))}
            className="w-9 h-9 rounded-xl bg-obsidian-mid/60 border border-surface-700/30 text-surface-300 hover:border-gold/20 hover:text-gold-400 active:scale-90 transition-all text-sm flex items-center justify-center"
          >
            −
          </button>
          <span className="text-base font-black tabular-nums text-gold-300 w-6 text-center">
            {level}
          </span>
          <button
            onClick={() => onLevelChange(Math.min(20, level + 1))}
            className="w-9 h-9 rounded-xl bg-obsidian-mid/60 border border-surface-700/30 text-surface-300 hover:border-gold/20 hover:text-gold-400 active:scale-90 transition-all text-sm flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
