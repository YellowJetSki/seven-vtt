/**
 * STᚱ VTT — Concentration Tracker Component
 *
 * Tracks concentration status for all caster characters.
 * 5e RAW:
 *   - Only 1 concentration spell at a time
 *   - Concentration broken by: taking damage (DC 10 or half damage, min 10)
 *   - Concentration broken by: being incapacitated, stunned, petrified,
 *     paralyzed, unconscious, or killed
 *   - Concentration ends automatically at spell's duration
 *   - Can voluntarily end concentration (free action)
 *
 * This component provides:
 *   - At-a-glance view of who's concentrating on what
 *   - Damage-based concentration save DC calculator
 *   - One-click break concentration
 *   - Active condition check for incapacitating conditions
 */

import { useState, useMemo } from "react";
import type { PlayerCharacter } from "@/types/character";
import type { SpellLevel } from "@/types";
import { computeAllDerivations } from "@/lib/mechanics/character-derivations";
import { useCampaignStore } from "@/stores/campaignStore";

interface ConcentrationTrackerProps {
  characters: PlayerCharacter[];
  /** If true, shows concentration save DC calculator input */
  showDamageInput?: boolean;
}

// ── Helper: check if character is incapacitated ──────────────

const INCAPACITATING_CONDITIONS = new Set([
  "incapacitated",
  "stunned",
  "petrified",
  "paralyzed",
  "unconscious",
]);

function isIncapacitated(conditions: string[]): boolean {
  return conditions.some((c) => INCAPACITATING_CONDITIONS.has(c));
}

// ── Individual Concentration Card ────────────────────────────

function ConcentrationCard({
  character,
  onBreak,
  onSet,
}: {
  character: PlayerCharacter;
  onBreak: (id: string) => void;
  onSet: (id: string, spellName: string, level: SpellLevel) => void;
}) {
  const derived = useMemo(() => computeAllDerivations(character), [character]);
  const [showSetForm, setShowSetForm] = useState(false);
  const [spellName, setSpellName] = useState("");
  const [spellLevel, setSpellLevel] = useState<SpellLevel>(1);
  const [damageAmount, setDamageAmount] = useState<number | null>(null);

  // The character's "concentration" is tracked as a condition in their conditions list
  const hasConcentration = character.conditions?.includes("concentration");

  // Check if incapacitated
  const incapacitated = isIncapacitated(character.conditions || []);

  // Compute concentration save DC
  // Per 5e RAW: DC 10 or half damage taken (whichever is higher)
  const concentrationSaveDC = damageAmount !== null
    ? Math.max(10, Math.floor(damageAmount / 2))
    : 10;

  // Compute CON save bonus
  const conMod = Math.floor((character.constitution - 10) / 2);
  const conSaveBonus = conMod + (derived.proficiencyBonus > 0 ? 0 : 0); // Characters don't add PB to CON saves unless proficient

  const handleSetConcentration = () => {
    if (!spellName.trim()) return;
    onSet(character.id, spellName.trim(), spellLevel);
    setShowSetForm(false);
    setSpellName("");
    setSpellLevel(1);
  };

  return (
    <div
      className={`rounded-xl border p-2.5 transition-all duration-200 ${
        hasConcentration
          ? "bg-emerald-500/5 border-emerald-500/20"
          : incapacitated
          ? "bg-rose-500/5 border-rose-500/15"
          : "bg-obsidian-mid/30 border-surface-700/10"
      }`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gold-400">{character.name}</span>
          <span className="text-[8px] text-surface-500">{character.class}</span>
        </div>
        <div className="flex items-center gap-1">
          {hasConcentration && (
            <button
              onClick={() => onBreak(character.id)}
              className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/15 active:scale-95 transition-all"
              title="Break concentration"
            >
              ✕ Break
            </button>
          )}
          <button
            onClick={() => setShowSetForm(!showSetForm)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
              showSetForm
                ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                : "bg-white/[0.03] text-surface-500 border border-surface-700/20 hover:text-surface-300"
            }`}
            title="Set concentration spell"
          >
            {showSetForm ? "✕" : "⚡"}
          </button>
        </div>
      </div>

      {/* ── Status ── */}
      <div className="flex items-center gap-2 text-[9px]">
        {hasConcentration ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
            Concentrating
          </span>
        ) : incapacitated ? (
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Incapacitated
          </span>
        ) : (
          <span className="text-surface-500">Not concentrating</span>
        )}
        <span className="text-surface-600">·</span>
        <span className="text-surface-500">CON {conMod >= 0 ? "+" : ""}{conMod}</span>
        <span className="text-surface-600">·</span>
        <span className="text-surface-500">DC {concentrationSaveDC} save</span>
      </div>

      {/* ── Set Form ── */}
      {showSetForm && (
        <div className="mt-2 space-y-1.5 p-2 rounded-lg bg-obsidian-mid/40 border border-surface-700/10">
          <input
            type="text"
            value={spellName}
            onChange={(e) => setSpellName(e.target.value)}
            placeholder="Spell name..."
            className="w-full py-1 px-2 text-[9px] bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-gold/30"
            onKeyDown={(e) => e.key === "Enter" && handleSetConcentration()}
          />
          <div className="flex items-center gap-1">
            <label className="text-[8px] text-surface-500">Lv.</label>
            <input
              type="number"
              min={1}
              max={9}
              value={spellLevel}
              onChange={(e) => setSpellLevel(Math.min(9, Math.max(1, Number(e.target.value))) as SpellLevel)}
              className="w-10 py-1 px-1.5 text-[9px] bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 text-center focus:outline-none focus:border-gold/30"
            />
            <button
              onClick={handleSetConcentration}
              className="ml-auto px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold uppercase tracking-wider hover:bg-emerald-500/15 active:scale-95 transition-all"
            >
              Set
            </button>
          </div>
        </div>
      )}

      {/* ── Damage Save Calculator ── */}
      {hasConcentration && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <input
            type="number"
            placeholder="dmg"
            value={damageAmount ?? ""}
            onChange={(e) => setDamageAmount(e.target.value ? Number(e.target.value) : null)}
            className="w-12 py-0.5 px-1 text-[8px] bg-obsidian-mid/60 border border-surface-700/30 rounded text-surface-200 placeholder:text-surface-600 text-center focus:outline-none focus:border-gold/30"
          />
          <span className="text-[8px] text-surface-500">dmg →</span>
          <span className="text-[9px] font-bold text-amber-400">
            DC {concentrationSaveDC}
          </span>
          <span className="text-[8px] text-surface-500">
            ({conMod >= 0 ? "+" : ""}{conMod} CON save)
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function ConcentrationTracker({
  characters,
  showDamageInput = true,
}: ConcentrationTrackerProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  // ── Filter to only caster characters ──
  const casterCharacters = useMemo(() => {
    return characters.filter((c) => {
      const derived = computeAllDerivations(c);
      return derived.spellcasting.isCaster;
    });
  }, [characters]);

  // ── Stats ──
  const concentratingCount = useMemo(
    () => casterCharacters.filter((c) => c.conditions?.includes("concentration")).length,
    [casterCharacters]
  );
  const incapacitatedCount = useMemo(
    () => casterCharacters.filter((c) => isIncapacitated(c.conditions || [])).length,
    [casterCharacters]
  );

  // ── Actions ──
  const handleBreakConcentration = (charId: string) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return;
    const conditions = (char.conditions || []).filter((c) => c !== "concentration");
    updateCharacter(charId, { conditions } as any);
  };

  const handleSetConcentration = (charId: string, spellName: string, level: SpellLevel) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return;
    const conditions = [...(char.conditions || []).filter((c) => c !== "concentration"), "concentration"];
    updateCharacter(charId, { conditions } as any);
  };

  if (casterCharacters.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-b from-[#14151f]/80 to-[#0f1019]/90 border border-white/[0.04] p-6 text-center">
        <div className="text-2xl mb-2 opacity-60">🧘</div>
        <h3 className="text-sm font-bold text-gold-400/80 mb-1">Concentration Tracker</h3>
        <p className="text-[10px] text-surface-500">
          No spellcasters in the party. Characters with spellcasting classes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gold-400">🧘 Concentration</h3>
        <div className="flex items-center gap-2 text-[8px]">
          {concentratingCount > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
              {concentratingCount} concentrating
            </span>
          )}
          {incapacitatedCount > 0 && (
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              {incapacitatedCount} incapacitated
            </span>
          )}
          {concentratingCount === 0 && incapacitatedCount === 0 && (
            <span className="text-surface-500">No active concentration</span>
          )}
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="space-y-1.5">
        {casterCharacters.map((char) => (
          <ConcentrationCard
            key={char.id}
            character={char}
            onBreak={handleBreakConcentration}
            onSet={handleSetConcentration}
          />
        ))}
      </div>

      {/* ── Rules Reference ── */}
      <details className="group">
        <summary className="text-[8px] text-surface-600 cursor-pointer hover:text-surface-500 transition-colors select-none">
          📖 Concentration rules (5e RAW)
        </summary>
        <div className="mt-1.5 p-2 rounded-lg bg-obsidian-mid/30 border border-surface-700/10 space-y-0.5 text-[8px] text-surface-500 leading-relaxed">
          <p>• Only <strong className="text-surface-400">one concentration spell</strong> at a time</p>
          <p>• Taking damage: <strong className="text-amber-400">DC 10 or half damage</strong>, whichever is higher</p>
          <p>• <strong className="text-rose-400">Incapacitated</strong> or killed: concentration <strong>ends automatically</strong></p>
          <p>• Can <strong className="text-emerald-400">voluntarily end</strong> concentration (free action, no action required)</p>
          <p>• Casting another concentration spell: <strong className="text-rose-400">ends the first</strong></p>
          <p>• Environmental effects (DM discretion): DC 10 CON save to maintain</p>
        </div>
      </details>
    </div>
  );
}
