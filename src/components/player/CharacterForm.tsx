/* ── Character Form ────────────────────────────────────────────
 * Modal form for creating or editing a player character.
 * Supports full character creation with ability scores, HP, AC,
 * initiative (auto-calculated from Dex), and image selection.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PlayerCharacter, Ability } from "@/types";

const ABILITY_KEYS: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABILITY_LABELS: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface CharacterFormProps {
  initialData?: PlayerCharacter;
  onSubmit: (character: PlayerCharacter) => void;
  onCancel: () => void;
}

export function CharacterForm({ initialData, onSubmit, onCancel }: CharacterFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [playerName, setPlayerName] = useState(initialData?.playerName ?? "");
  const [race, setRace] = useState(initialData?.race ?? "");
  const [charClass, setCharClass] = useState(initialData?.class ?? "");
  const [subclass, setSubclass] = useState(initialData?.subclass ?? "");
  const [background, setBackground] = useState(initialData?.background ?? "");
  const [alignment, setAlignment] = useState(initialData?.alignment ?? "");
  const [level, setLevel] = useState(initialData?.level ?? 1);
  const [ac, setAc] = useState(initialData?.armorClass ?? 10);
  const [hpMax, setHpMax] = useState(initialData?.hitPoints.max ?? 10);
  const [hpCurrent, setHpCurrent] = useState(initialData?.hitPoints.current ?? 10);
  const [speed, setSpeed] = useState(initialData?.speed ?? 30);
  const [portraitUrl, setPortraitUrl] = useState(initialData?.portraitUrl);
  const [tokenUrl, setTokenUrl] = useState(initialData?.tokenUrl);
  const [abilityScores, setAbilityScores] = useState<Record<Ability, number>>(
    initialData?.abilityScores ?? {
      strength: 10, dexterity: 10, constitution: 10,
      intelligence: 10, wisdom: 10, charisma: 10,
    }
  );

  // Auto-calculate initiative modifier from Dexterity
  const dexMod = Math.floor((abilityScores.dexterity - 10) / 2);
  const calculatedInit = dexMod;

  const handleSubmit = () => {
    if (!name.trim()) return;

    const character: PlayerCharacter = {
      id: initialData?.id ?? uid("pc"),
      name: name.trim(),
      playerName: playerName.trim() || "Unknown",
      race: race.trim() || "Unknown",
      class: charClass.trim() || "Unknown",
      subclass: subclass.trim() || undefined,
      background: background.trim() || undefined,
      alignment: alignment.trim() || undefined,
      level: Math.max(1, Math.min(20, level)),
      experience: initialData?.experience ?? level * 1000,
      abilityScores,
      savingThrows: initialData?.savingThrows ?? {},
      skills: initialData?.skills ?? {},
      hitPoints: { current: Math.min(hpCurrent, hpMax), max: hpMax, temporary: 0 },
      armorClass: ac,
      initiative: calculatedInit,
      speed,
      proficiencyBonus: Math.ceil(1 + level / 4),
      features: initialData?.features ?? [],
      traits: initialData?.traits ?? [],
      spells: initialData?.spells ?? [],
      equipment: initialData?.equipment ?? [],
      currency: initialData?.currency ?? { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      backstory: initialData?.backstory,
      notes: initialData?.notes,
      portraitUrl,
      tokenUrl,
      createdAt: initialData?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    onSubmit(character);
  };

  const updateAbility = (ability: Ability, value: number) => {
    setAbilityScores((prev) => ({ ...prev, [ability]: Math.max(1, Math.min(30, value)) }));
  };

  return (
    <div className="space-y-5">
      {/* Core Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-surface-400">Character Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Torvin Ironmantle"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-surface-400">Player Name</label>
          <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="e.g. Mike"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Race</label>
          <input value={race} onChange={(e) => setRace(e.target.value)} placeholder="e.g. Dwarf"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Class</label>
          <input value={charClass} onChange={(e) => setCharClass(e.target.value)} placeholder="e.g. Paladin"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Subclass</label>
          <input value={subclass} onChange={(e) => setSubclass(e.target.value)} placeholder="e.g. Oath of Devotion"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Level (1-20)</label>
          <input type="number" min={1} max={20} value={level} onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Background</label>
          <input value={background} onChange={(e) => setBackground(e.target.value)} placeholder="e.g. Soldier"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Alignment</label>
          <input value={alignment} onChange={(e) => setAlignment(e.target.value)} placeholder="e.g. Lawful Good"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
      </div>

      {/* Combat Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Armor Class</label>
          <input type="number" value={ac} onChange={(e) => setAc(parseInt(e.target.value) || 10)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">HP Max</label>
          <input type="number" value={hpMax} onChange={(e) => setHpMax(parseInt(e.target.value) || 10)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Speed (ft)</label>
          <input type="number" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value) || 30)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>

      {/* Initiative (auto-calc) */}
      <div className="rounded-lg border border-surface-700 bg-surface-800/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-400">Initiative Modifier</span>
            <span className={`text-lg font-bold ${calculatedInit >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>
              {calculatedInit >= 0 ? "+" : ""}{calculatedInit}
            </span>
          </div>
          <span className="text-[10px] text-surface-500">Auto-calculated from Dexterity ({abilityScores.dexterity})</span>
        </div>
      </div>

      {/* Ability Scores */}
      <div>
        <label className="mb-2 block text-xs font-medium text-surface-400">Ability Scores</label>
        <div className="grid grid-cols-6 gap-2">
          {ABILITY_KEYS.map((ability) => {
            const val = abilityScores[ability];
            const mod = Math.floor((val - 10) / 2);
            return (
              <div key={ability} className="text-center">
                <p className="text-[10px] font-semibold uppercase text-surface-500 mb-1">{ABILITY_LABELS[ability]}</p>
                <input type="number" min={1} max={30} value={val}
                  onChange={(e) => updateAbility(ability, parseInt(e.target.value) || 10)}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-2 py-1.5 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
                <p className={`text-[10px] mt-0.5 font-medium ${mod >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>
                  {mod >= 0 ? "+" : ""}{mod}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Portrait & Token URL */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Portrait URL</label>
          <input value={portraitUrl ?? ""} onChange={(e) => setPortraitUrl(e.target.value || undefined)}
            placeholder="https://... or /images/portrait/..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Token URL</label>
          <input value={tokenUrl ?? ""} onChange={(e) => setTokenUrl(e.target.value || undefined)}
            placeholder="https://... or /images/tokens/..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-700">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!name.trim()}>
          {initialData ? "Update Character" : "Create Character"}
        </Button>
      </div>
    </div>
  );
}
