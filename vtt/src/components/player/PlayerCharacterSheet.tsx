/* ── Player Character Sheet ────────────────────────────────────
 * Full character sheet orchestrating: header, stats, HP, XP,
 * abilities, rests, resources, inventory, currency, spells,
 * death saves, backstory, and level-up wizard.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback } from "react";
import type { PlayerCharacter } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { CharacterHeader } from "./CharacterHeader";
import { CharacterQuickStats } from "./CharacterQuickStats";
import { CharacterHpEditor } from "./CharacterHpEditor";
import { CharacterXpEditor } from "./CharacterXpEditor";
import { RestControls } from "./RestControls";
import { ResourcesSection } from "./ResourcesSection";
import { ResourceEditor } from "./ResourceEditor";
import { SpellSlotsDisplay } from "./SpellSlotsDisplay";
import { InventoryEditor } from "./InventoryEditor";
import { CurrencyEditor } from "./CurrencyEditor";
import { DeathSaveTracker } from "./DeathSaveTracker";
import { SpellcastingSheet } from "./SpellcastingSheet";
import { LevelUpWizard } from "./LevelUpWizard";

interface Props {
  character: PlayerCharacter;
}

export function PlayerCharacterSheet({ character }: Props) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const showToast = useUiStore((s) => s.showToast);

  const [showHpEditor, setShowHpEditor] = useState(false);
  const [showXpEditor, setShowXpEditor] = useState(false);
  const [showResourceEditor, setShowResourceEditor] = useState(false);
  const [showInventoryEditor, setShowInventoryEditor] = useState(false);
  const [showCurrencyEditor, setShowCurrencyEditor] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const characterResources: { id: string; name: string; current: number; max: number; recharge: string }[] =
    (character as any).resources ?? [];

  const hpPercent = useMemo(() => {
    if (character.hitPoints.max <= 0) return 0;
    return Math.max(0, Math.min(100, (character.hitPoints.current / character.hitPoints.max) * 100));
  }, [character.hitPoints.current, character.hitPoints.max]);

  const handleShortRest = useCallback(() => {
    const healAmt = Math.floor(character.hitPoints.max * 0.25);
    const newHp = Math.min(character.hitPoints.max, character.hitPoints.current + healAmt);
    updateCharacter(character.id, { hitPoints: { ...character.hitPoints, current: newHp }, updatedAt: Date.now() });
    const updatedResources = (characterResources).map((r: any) =>
      r.recharge === "short" ? { ...r, current: r.max } : r
    );
    if (updatedResources.length > 0) updateCharacter(character.id, { resources: updatedResources, updatedAt: Date.now() } as any);
    showToast({ message: `Short rest! Healed ${healAmt} HP. Short-rest resources restored.`, type: "success" });
  }, [character, characterResources, updateCharacter, showToast]);

  const handleLongRest = useCallback(() => {
    updateCharacter(character.id, { hitPoints: { ...character.hitPoints, current: character.hitPoints.max, temporary: 0 }, updatedAt: Date.now() });
    const updatedResources = characterResources.map((r: any) => ({ ...r, current: r.max }));
    if (updatedResources.length > 0) updateCharacter(character.id, { resources: updatedResources, updatedAt: Date.now() } as any);
    showToast({ message: `Long rest! Fully healed. All resources restored.`, type: "success" });
  }, [character, characterResources, updateCharacter, showToast]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <CharacterHeader character={character} />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill label="HP" value={`${character.hitPoints.current}/${character.hitPoints.max}`} color="warrior" />
        <StatPill label="AC" value={String(character.armorClass)} color="mage" />
        <StatPill label="Initiative" value={`+${character.initiative}`} color="rogue" />
      </div>

      {/* HP Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-surface-400 mb-1">
          <span>Hit Points</span>
          <button onClick={() => setShowHpEditor(true)} className="text-accent-400 hover:text-accent-300 transition-colors">
            {character.hitPoints.current} / {character.hitPoints.max}
            {character.hitPoints.temporary > 0 && ` (+${character.hitPoints.temporary} temp)`} ✏️
          </button>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-800 cursor-pointer" onClick={() => setShowHpEditor(true)}>
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${hpPercent}%`,
            background: hpPercent > 50 ? "var(--color-rogue-500)" : hpPercent > 25 ? "var(--color-divine-500)" : "var(--color-warrior-500)",
          }} />
        </div>
      </div>

      {/* XP */}
      <div className="flex items-center justify-between rounded-xl border border-surface-700 bg-surface-850 p-3">
        <span className="text-xs font-medium text-surface-400">Experience Points</span>
        <button onClick={() => setShowXpEditor(true)} className="text-sm font-bold text-surface-200 hover:text-accent-400 transition-colors">
          {character.experiencePoints ?? 0} XP ✏️
        </button>
      </div>

      {/* Ability Scores, Saves, Skills */}
      <CharacterQuickStats character={character} />

      {/* Rest & Level Up */}
      <RestControls character={character} onShortRest={handleShortRest} onLongRest={handleLongRest} onLevelUp={() => setShowLevelUp(true)} />

      {/* Resources & Spell Slots */}
      <div className="grid gap-4 md:grid-cols-2">
        <ResourcesSection resources={characterResources} onEdit={() => setShowResourceEditor(true)} />
        <SpellSlotsDisplay character={character} />
      </div>

      {/* Features */}
      {character.features.length > 0 && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Features and Traits</h2>
          <div className="flex flex-wrap gap-2">
            {character.features.map((feat, i) => (
              <span key={i} className="rounded-full bg-accent-500/10 px-3 py-1 text-xs text-accent-400 ring-1 ring-accent-500/20">
                {typeof feat === 'string' ? feat : feat.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Inventory */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-surface-400">🎒 Inventory</h2>
          <button onClick={() => setShowInventoryEditor(true)} className="text-xs text-accent-400 hover:text-accent-300">✏️ Edit</button>
        </div>
        {character.equipment.length === 0 ? (
          <p className="text-xs text-surface-500">No items in inventory.</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {character.equipment.map((item, i) => (
              <div key={`eq-${i}`} className="rounded-lg bg-surface-800 px-3 py-2 text-xs text-surface-300">
                {item.item}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Currency */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-surface-400">🪙 Currency</h2>
          <button onClick={() => setShowCurrencyEditor(true)} className="text-xs text-accent-400 hover:text-accent-300">✏️ Edit</button>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center">
          <CurrencyCell label="PP" value={character.currency?.platinum ?? 0} color="gold" />
          <CurrencyCell label="GP" value={character.currency?.gold ?? 0} color="gold" />
          <CurrencyCell label="EP" value={character.currency?.electrum ?? 0} color="surface" />
          <CurrencyCell label="SP" value={character.currency?.silver ?? 0} color="surface" />
          <CurrencyCell label="CP" value={character.currency?.copper ?? 0} color="surface" />
        </div>
        <p className="mt-2 text-center text-[9px] text-surface-500">50 Leptons = 1 Quadrans | 5 Quadrans = 1 Assarion</p>
      </section>

      {/* Death Saves & Spellcasting */}
      <DeathSaveTracker character={character} />
      <SpellcastingSheet character={character} />

      {/* Backstory */}
      {character.backstory && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-surface-400">Backstory</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-300">{character.backstory}</p>
        </section>
      )}

      {/* Notes */}
      {character.characterNotes && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-surface-400">Notes</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-300">{character.characterNotes}</p>
        </section>
      )}

      {/* Modals */}
      {showHpEditor && <CharacterHpEditor character={character} onSave={(current, temp) => { updateCharacter(character.id, { hitPoints: { ...character.hitPoints, current, temporary: temp }, updatedAt: Date.now() }); setShowHpEditor(false); showToast({ message: `HP updated`, type: "success" }); }} onClose={() => setShowHpEditor(false)} />}
      {showXpEditor && <CharacterXpEditor currentXp={character.experiencePoints ?? 0} onSave={(xp) => { updateCharacter(character.id, { experiencePoints: xp, updatedAt: Date.now() }); setShowXpEditor(false); showToast({ message: `XP set to ${xp}`, type: "success" }); }} onClose={() => setShowXpEditor(false)} />}
      {showResourceEditor && <ResourceEditor resources={characterResources} onSave={(resources) => { updateCharacter(character.id, { resources, updatedAt: Date.now() } as any); setShowResourceEditor(false); showToast({ message: `Resources updated`, type: "success" }); }} onClose={() => setShowResourceEditor(false)} />}
      {showInventoryEditor && <InventoryEditor equipment={character.equipment.map(e => ({ item: e.item, quantity: e.quantity }))} onSave={(equipment) => { updateCharacter(character.id, { equipment, updatedAt: Date.now() }); setShowInventoryEditor(false); showToast({ message: `Inventory updated (${equipment.length} items)`, type: "success" }); }} onClose={() => setShowInventoryEditor(false)} />}
      {showCurrencyEditor && <CurrencyEditor currency={{ platinum: character.currency?.platinum ?? 0, gold: character.currency?.gold ?? 0, electrum: character.currency?.electrum ?? 0, silver: character.currency?.silver ?? 0, copper: character.currency?.copper ?? 0 }} onSave={(currency) => { updateCharacter(character.id, { currency, updatedAt: Date.now() }); setShowCurrencyEditor(false); showToast({ message: "Currency updated", type: "success" }); }} onClose={() => setShowCurrencyEditor(false)} />}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowLevelUp(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <LevelUpWizard character={character} onClose={() => setShowLevelUp(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── StatPill (kept inline — small, pure display) ──────────── */

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    warrior: "border-warrior-500/30 bg-warrior-500/10 text-warrior-400",
    mage: "border-mage-500/30 bg-mage-500/10 text-mage-400",
    rogue: "border-rogue-500/30 bg-rogue-500/10 text-rogue-400",
    divine: "border-divine-500/30 bg-divine-500/10 text-divine-400",
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colorMap[color] ?? "border-surface-700 bg-surface-800 text-surface-300"}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}

function CurrencyCell({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = { gold: "text-amber-300", surface: "text-surface-300" };
  return (
    <div className="rounded-lg bg-surface-800 py-2">
      <p className={`text-xs font-bold ${colorMap[color] ?? "text-surface-300"}`}>{value}</p>
      <p className="text-[9px] text-surface-500">{label}</p>
    </div>
  );
}
