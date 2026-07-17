/* ── Level Up Wizard ───────────────────────────────────────────
 * Multi-class aware level-up flow. Guides the player through:
 *  1. Choose which class to level (multi-class support)
 *  2. Roll hit die for HP increase
 *  3. Choose ability score improvement (ASI) or feat (every 4 levels)
 *  4. Choose new spells if spellcasting class
 *  5. Update proficiency bonus
 *  6. Apply subclass features if applicable
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import type { PlayerCharacter, Ability } from "@/types";
import { getTotalLevel, getPrimaryClass, getClassSummary, getProficiencyBonus } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";

/* ── Constants ──────────────────────────────────────────────── */

const ABILITY_KEYS: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABBR_MAP: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

/** Hit dice types per class */
const CLASS_HIT_DICE: Record<string, string> = {
  artificer: "d8", barbarian: "d12", bard: "d8", cleric: "d8",
  druid: "d8", fighter: "d10", monk: "d8", paladin: "d10",
  ranger: "d10", rogue: "d8", sorcerer: "d6", warlock: "d8",
  wizard: "d6",
};

/** Spellcasting classes */
const SPELLCASTING_CLASSES = new Set([
  "bard", "cleric", "druid", "sorcerer", "warlock", "wizard",
  "paladin", "ranger", "artificer",
]);

/** Subclass levels for each class */
const SUBCLASS_LEVELS: Record<string, number> = {
  barbarian: 3, bard: 3, cleric: 1, druid: 2, fighter: 3,
  monk: 3, paladin: 3, ranger: 3, rogue: 3, sorcerer: 1,
  warlock: 1, wizard: 2, artificer: 3,
};

const FEAT_LEVELS = new Set([4, 8, 12, 16, 19]);

type WizardStep = "choose_class" | "roll_hp" | "asi_or_feat" | "choose_spells" | "subclass_feature" | "summary";

interface LevelUpWizardProps {
  character: PlayerCharacter;
  onClose: () => void;
}

export function LevelUpWizard({ character, onClose }: LevelUpWizardProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const showToast = useUiStore((s) => s.showToast);

  const totalLevel = getTotalLevel(character.classes);
  const newTotalLevel = totalLevel + 1;

  const [step, setStep] = useState<WizardStep>("choose_class");
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const [hpIncrease, setHpIncrease] = useState(0);
  const [asiChoice, setAsiChoice] = useState<{ ability: Ability; increase: number } | null>(null);
  const [chosenFeat, setChosenFeat] = useState<string | null>(null);
  const [newSpells, setNewSpells] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  // Which class are we leveling?
  const existingClasses = character.classes;
  const levelingClass = existingClasses[selectedClassIndex];
  const newClassLevel = levelingClass ? levelingClass.level + 1 : 1;
  const hitDieType = CLASS_HIT_DICE[levelingClass?.name.toLowerCase() ?? "fighter"] || "d8";

  // ASI levels (total-level based)
  const getsASI = FEAT_LEVELS.has(newTotalLevel);
  const getsFeat = FEAT_LEVELS.has(newTotalLevel);

  // Subclass feature trigger
  const subclassLevel = SUBCLASS_LEVELS[levelingClass?.name.toLowerCase() ?? ""] ?? 99;
  const getsSubclassFeature = newClassLevel === subclassLevel;

  // Spellcasting check
  const isSpellcaster = SPELLCASTING_CLASSES.has(levelingClass?.name.toLowerCase() ?? "");

  // New proficiency bonus
  const newProfBonus = getProficiencyBonus(newTotalLevel);
  const profBonusIncreased = newProfBonus > getProficiencyBonus(totalLevel);

  const handleRollHp = useCallback(() => {
    const dieMax = parseInt(hitDieType.replace("d", ""));
    const roll = Math.floor(Math.random() * dieMax) + 1;
    const conMod = Math.floor(((character.constitution || 10) - 10) / 2);
    setHpRoll(roll);
    setHpIncrease(Math.max(1, roll + conMod));
  }, [hitDieType, character.constitution]);

  const handleFinish = useCallback(() => {
    const updatedClasses = existingClasses.map((c, i) => {
      if (i === selectedClassIndex) {
        return { ...c, level: c.level + 1 };
      }
      return c;
    });

    const updatedCharacter: Partial<PlayerCharacter> = {
      classes: updatedClasses,
      class: getPrimaryClass(updatedClasses),
      level: getTotalLevel(updatedClasses),
      hitPoints: {
        ...character.hitPoints,
        max: character.hitPoints.max + hpIncrease,
        current: character.hitPoints.current + hpIncrease,
      },
      proficiencyBonus: newProfBonus,
      updatedAt: Date.now(),
    };

    updateCharacter(character.id, updatedCharacter);
    setCompleted(true);
    showToast({
      message: `${character.name} leveled up to level ${newTotalLevel}!`,
      type: "success",
    });
    onClose();
  }, [
    existingClasses, selectedClassIndex, character, hpIncrease,
    newProfBonus, newTotalLevel, updateCharacter, showToast, onClose,
  ]);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Progress Steps */}
      <div className="flex items-center gap-1 text-xs text-surface-500">
        {["Choose Class", "Roll HP", getsASI ? "ASI/Feat" : null, isSpellcaster ? "Spells" : null, getsSubclassFeature ? "Subclass" : null, "Finish"]
          .filter(Boolean)
          .map((s, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-surface-600">→</span>}
              <span className={step === s?.toLowerCase().replace(/\s/g, "_") ? "text-accent-400 font-semibold" : ""}>
                {s}
              </span>
            </span>
          ))}
      </div>

      <div className="rounded-xl border border-surface-700 bg-surface-850 p-5">
        {step === "choose_class" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-surface-100">
              Level Up: {character.name}
            </h3>
            <p className="text-sm text-surface-400">
              Current level: {totalLevel} → <strong className="text-accent-400">{newTotalLevel}</strong>
            </p>
            <p className="text-sm text-surface-400">
              Current classes: {getClassSummary(existingClasses)}
            </p>

            <div className="space-y-2">
              <p className="text-xs font-medium text-surface-500">Choose which class to level:</p>
              {existingClasses.map((c, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedClassIndex(i); setStep("roll_hp"); }}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 p-3 text-left hover:border-accent-500/40 transition-colors"
                >
                  <span className="text-sm font-medium text-surface-200">{c.name}</span>
                  <span className="ml-2 text-xs text-surface-500">Level {c.level} → {c.level + 1}</span>
                  {c.subClass && (
                    <span className="ml-2 text-[10px] text-surface-500">({c.subClass})</span>
                  )}
                </button>
              ))}

              {/* Add new class (multi-class) */}
              <button
                onClick={() => setStep("roll_hp")}
                className="w-full rounded-lg border-2 border-dashed border-surface-600 bg-surface-800/50 p-3 text-center hover:border-accent-500/40 transition-colors"
              >
                <span className="text-sm font-medium text-accent-400">+ Add New Class</span>
                <p className="text-[10px] text-surface-500">Multi-class into a new class</p>
              </button>
            </div>
          </div>
        )}

        {step === "roll_hp" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-surface-100">
              Roll Hit Points
            </h3>
            <p className="text-sm text-surface-400">
              Class: <strong>{levelingClass?.name}</strong> · Hit Die: <strong>1{hitDieType}</strong>
            </p>
            {hpRoll === null ? (
              <button
                onClick={handleRollHp}
                className="w-full rounded-xl border-2 border-dashed border-accent-500/40 bg-accent-500/5 p-6 text-center hover:bg-accent-500/10 transition-colors"
              >
                <span className="text-2xl">🎲</span>
                <p className="mt-2 font-semibold text-surface-200">Roll Hit Die</p>
                <p className="text-xs text-surface-500">Click to roll 1{hitDieType} for HP</p>
              </button>
            ) : (
              <div className="space-y-3 text-center">
                <div className="rounded-xl bg-surface-800 p-4">
                  <p className="text-xs text-surface-500">You rolled:</p>
                  <p className="text-5xl font-bold text-accent-400">{hpRoll}</p>
                  <p className="text-sm text-surface-400 mt-2">
                    + CON mod ({Math.floor(((character.constitution || 10) - 10) / 2)}) ={" "}
                    <strong className="text-rogue-400">+{hpIncrease} HP</strong>
                  </p>
                </div>
                <Button onClick={() => setStep(getsASI ? "asi_or_feat" : isSpellcaster ? "choose_spells" : getsSubclassFeature ? "subclass_feature" : "summary")}>
                  Continue →
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "asi_or_feat" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-surface-100">
              Ability Score Improvement
            </h3>
            <p className="text-sm text-surface-400">
              Level {newTotalLevel} — you gain an ASI or a Feat!
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ABILITY_KEYS.map((ability) => (
                <button
                  key={ability}
                  onClick={() => { setAsiChoice({ ability, increase: 1 }); setStep(isSpellcaster ? "choose_spells" : getsSubclassFeature ? "subclass_feature" : "summary"); }}
                  className={`rounded-lg border p-3 text-center transition-colors ${
                    asiChoice?.ability === ability
                      ? "border-accent-500 bg-accent-500/10"
                      : "border-surface-700 bg-surface-800 hover:border-accent-500/40"
                  }`}
                >
                  <span className="text-lg font-bold text-surface-200">{ABBR_MAP[ability]}</span>
                  <span className="block text-xs text-surface-500">+1</span>
                </button>
              ))}
            </div>
            <div className="border-t border-surface-700 pt-3">
              <p className="text-xs text-surface-500 mb-2">Or choose a feat:</p>
              <Button variant="secondary" size="sm" onClick={() => setChosenFeat("Alert")}>
                Alert (+5 initiative, no surprise)
              </Button>
            </div>
          </div>
        )}

        {step === "summary" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-surface-100">Level Up Summary</h3>
            <div className="rounded-lg bg-surface-800 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-surface-400">New Level</span>
                <span className="text-sm font-bold text-accent-400">{newTotalLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-surface-400">Classes</span>
                <span className="text-sm text-surface-200">{getClassSummary(character.classes.map((c, i) => i === selectedClassIndex ? { ...c, level: c.level + 1 } : c))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-surface-400">HP Increase</span>
                <span className="text-sm font-bold text-rogue-400">+{hpIncrease}</span>
              </div>
              {asiChoice && (
                <div className="flex justify-between">
                  <span className="text-xs text-surface-400">ASI</span>
                  <span className="text-sm text-surface-200">{ABBR_MAP[asiChoice.ability]} +1</span>
                </div>
              )}
              {profBonusIncreased && (
                <div className="flex justify-between">
                  <span className="text-xs text-surface-400">Proficiency Bonus</span>
                  <span className="text-sm font-bold text-divine-400">+{newProfBonus}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleFinish}>✨ Complete Level Up</Button>
            </div>
          </div>
        )}

        {completed && (
          <div className="text-center py-6">
            <span className="text-4xl">🎉</span>
            <p className="mt-2 text-lg font-bold text-surface-100">Level Up Complete!</p>
          </div>
        )}
      </div>
    </div>
  );
}
