/* ── Character Form ────────────────────────────────────────────
 * Form for creating/editing player characters.
 * Uses the flat PlayerCharacter type with direct ability score and currency fields.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import type { PlayerCharacter, Ability } from "@/types";

interface CharacterFormProps {
  initialData?: PlayerCharacter;
  onSubmit: (character: PlayerCharacter) => void;
  onCancel: () => void;
}

export function CharacterForm({ initialData, onSubmit, onCancel }: CharacterFormProps) {
  const isEditing = !!initialData;

  const [name, setName] = useState(initialData?.name ?? "");
  const [playerName, setPlayerName] = useState(initialData?.playerName ?? "");
  const [race, setRace] = useState(initialData?.race ?? "");
  const [charClass, setCharClass] = useState(initialData?.class ?? "");
  const [level, setLevel] = useState(initialData?.level ?? 1);
  const [exp, setExp] = useState(initialData?.experiencePoints ?? 0);
  const [background, setBackground] = useState(initialData?.background ?? "");
  const [alignment, setAlignment] = useState(initialData?.alignment ?? "");

  // Ability scores
  const [strength, setStrength] = useState(initialData?.strength ?? 10);
  const [dexterity, setDexterity] = useState(initialData?.dexterity ?? 10);
  const [constitution, setConstitution] = useState(initialData?.constitution ?? 10);
  const [intelligence, setIntelligence] = useState(initialData?.intelligence ?? 10);
  const [wisdom, setWisdom] = useState(initialData?.wisdom ?? 10);
  const [charisma, setCharisma] = useState(initialData?.charisma ?? 10);

  // HP
  const [hpCurrent, setHpCurrent] = useState(initialData?.hitPoints?.current ?? 10);
  const [hpMax, setHpMax] = useState(initialData?.hitPoints?.max ?? 10);
  const [ac, setAc] = useState(initialData?.armorClass ?? 10);

  // Currency
  const [copper, setCopper] = useState(initialData?.copper ?? 0);
  const [silver, setSilver] = useState(initialData?.silver ?? 0);
  const [electrum, setElectrum] = useState(initialData?.electrum ?? 0);
  const [gold, setGold] = useState(initialData?.gold ?? 0);
  const [platinum, setPlatinum] = useState(initialData?.platinum ?? 0);

  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");

  const handleSubmit = useCallback(() => {
    const character: PlayerCharacter = {
      id: initialData?.id ?? `pc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      playerName,
      race,
      class: charClass,
      level,
      experiencePoints: exp,
      background,
      alignment,
      inspiration: initialData?.inspiration ?? false,
      strength,
      dexterity,
      constitution,
      intelligence,
      wisdom,
      charisma,
      hitPoints: { current: hpCurrent, max: hpMax, temporary: 0 },
      armorClass: ac,
      initiative: initialData?.initiative ?? Math.floor((dexterity - 10) / 2),
      speed: initialData?.speed ?? 30,
      hitDice: initialData?.hitDice ?? "d10",
      proficiencyBonus: initialData?.proficiencyBonus ?? 2,
      conditions: initialData?.conditions ?? [],
      deathSaves: initialData?.deathSaves ?? { successes: 0, failures: 0 },
      temporaryHitPoints: 0,
      traits: initialData?.traits ?? [],
      proficiencies: initialData?.proficiencies ?? [],
      languages: initialData?.languages ?? [],
      features: initialData?.features ?? [],
      equipment: initialData?.equipment ?? [],
      inventory: initialData?.inventory ?? [],
      copper,
      silver,
      electrum,
      gold,
      platinum,
      appearance: initialData?.appearance ?? "",
      backstory: initialData?.backstory ?? "",
      allies: initialData?.allies ?? "",
      characterNotes: initialData?.characterNotes ?? "",
      imageUrl: imageUrl || undefined,
      isHomebrew: initialData?.isHomebrew ?? false,
      createdAt: initialData?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    onSubmit(character);
  }, [
    name, playerName, race, charClass, level, exp, background, alignment,
    strength, dexterity, constitution, intelligence, wisdom, charisma,
    hpCurrent, hpMax, ac, copper, silver, electrum, gold, platinum,
    imageUrl, initialData, onSubmit,
  ]);

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Player" value={playerName} onChange={setPlayerName} />
        <Field label="Race" value={race} onChange={setRace} />
        <Field label="Class" value={charClass} onChange={setCharClass} />
        <NumberField label="Level" value={level} onChange={setLevel} min={1} max={20} />
        <NumberField label="Experience" value={exp} onChange={setExp} min={0} />
        <Field label="Background" value={background} onChange={setBackground} />
        <Field label="Alignment" value={alignment} onChange={setAlignment} />
      </div>

      {/* Ability Scores */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Ability Scores</h3>
        <div className="grid grid-cols-6 gap-2">
          <NumberField label="STR" value={strength} onChange={setStrength} min={1} max={30} />
          <NumberField label="DEX" value={dexterity} onChange={setDexterity} min={1} max={30} />
          <NumberField label="CON" value={constitution} onChange={setConstitution} min={1} max={30} />
          <NumberField label="INT" value={intelligence} onChange={setIntelligence} min={1} max={30} />
          <NumberField label="WIS" value={wisdom} onChange={setWisdom} min={1} max={30} />
          <NumberField label="CHA" value={charisma} onChange={setCharisma} min={1} max={30} />
        </div>
      </div>

      {/* Combat Stats */}
      <div className="grid grid-cols-3 gap-4">
        <NumberField label="HP Current" value={hpCurrent} onChange={setHpCurrent} min={0} />
        <NumberField label="HP Max" value={hpMax} onChange={setHpMax} min={1} />
        <NumberField label="Armor Class" value={ac} onChange={setAc} min={0} max={30} />
      </div>

      {/* Currency */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Currency</h3>
        <div className="grid grid-cols-5 gap-2">
          <NumberField label="CP" value={copper} onChange={setCopper} min={0} />
          <NumberField label="SP" value={silver} onChange={setSilver} min={0} />
          <NumberField label="EP" value={electrum} onChange={setElectrum} min={0} />
          <NumberField label="GP" value={gold} onChange={setGold} min={0} />
          <NumberField label="PP" value={platinum} onChange={setPlatinum} min={0} />
        </div>
      </div>

      {/* Image URL */}
      <Field label="Image URL (optional)" value={imageUrl} onChange={setImageUrl} />

      {/* Actions */}
      <div className="flex justify-end gap-2 border-t border-surface-700 pt-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || !charClass.trim()}>
          {isEditing ? "Save" : "Create Character"}
        </Button>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-surface-400">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-surface-400">{label}</label>
      <input type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
    </div>
  );
}
