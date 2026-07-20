/**
 * STᚱ VTT — Concentration Tracker (Premium Edition)
 *
 * Lusion/Spotify-grade concentration tracking with:
 * - Premium glass gradient card per caster with edge light
 * - At-a-glance concentrating status with Spotify ping ring
 * - Damage-based concentration save DC calculator (inline)
 * - One-click break concentration with confirmation feel
 * - Incapacitation detection with rose pulse indicator
 * - Stats header: concentrating count, incapacitated count
 * - Rules reference (collapsible) with 5e RAW formatting
 * - Staggered entrance per card
 *
 * 5e RAW Concentration Rules:
 *   - Only 1 concentration spell at a time
 *   - Taking damage: DC 10 or half damage (whichever higher)
 *   - Incapacitated/killed: ends automatically
 *   - Voluntary end: free action
 *   - Environmental effects: DC 10 CON save
 */

import { useState, useMemo, useCallback } from "react";
import type { PlayerCharacter } from "@/types/character";
import type { SpellLevel } from "@/types";
import { computeAllDerivations } from "@/lib/mechanics/character-derivations";
import { useCampaignStore } from "@/stores/campaignStore";

interface ConcentrationTrackerProps {
  characters: PlayerCharacter[];
  showDamageInput?: boolean;
}

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
  index,
}: {
  character: PlayerCharacter;
  onBreak: (id: string) => void;
  onSet: (id: string, spellName: string, level: SpellLevel) => void;
  index: number;
}) {
  const derived = useMemo(() => computeAllDerivations(character), [character]);
  const [showSetForm, setShowSetForm] = useState(false);
  const [spellName, setSpellName] = useState("");
  const [spellLevel, setSpellLevel] = useState<SpellLevel>(1);
  const [damageAmount, setDamageAmount] = useState<number | null>(null);

  const hasConcentration = character.conditions?.includes("concentration");
  const incapacitated = isIncapacitated(character.conditions || []);
  const conMod = Math.floor((character.constitution - 10) / 2);
  const concentrationSaveDC = damageAmount !== null
    ? Math.max(10, Math.floor(damageAmount / 2))
    : 10;

  const handleSet = useCallback(() => {
    if (!spellName.trim()) return;
    onSet(character.id, spellName.trim(), spellLevel);
    setShowSetForm(false);
    setSpellName("");
    setSpellLevel(1);
  }, [spellName, spellLevel, character.id, onSet]);

  return (
    <div
      className="relative rounded-xl bg-gradient-to-br from-[#14151f]/90 to-[#0f1019]/95 border transition-all duration-300 overflow-hidden group hover:-translate-y-0.5"
      style={{
        borderColor: hasConcentration
          ? "rgba(52, 211, 153, 0.2)"
          : incapacitated
            ? "rgba(244, 63, 94, 0.2)"
            : "rgba(255, 255, 255, 0.04)",
        animationDelay: `${index * 60}ms`,
        animation: "slide-in-up 0.3s ease-out both",
      }}
    >
      {/* Edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-white/[0.01] via-transparent to-transparent" />

      <div className="p-2.5 relative z-[1]">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gold-400">{character.name}</span>
            <span className="text-[8px] text-surface-500 bg-surface-800/40 px-1 rounded">{character.class}</span>
          </div>
          <div className="flex items-center gap-1">
            {hasConcentration && (
              <button
                onClick={() => onBreak(character.id)}
                className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-gradient-to-b from-rose-500/10 to-rose-500/3 text-rose-400 border border-rose-500/20 hover:from-rose-500/20 hover:to-rose-500/10 active:scale-90 transition-all duration-150"
                title="Break concentration"
              >
                ✕ Break
              </button>
            )}
            <button
              onClick={() => setShowSetForm(!showSetForm)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-90 ${
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
              <span className="relative w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                <span className="absolute inset-0 rounded-full bg-emerald-400" />
              </span>
              Concentrating
            </span>
          ) : incapacitated ? (
            <span className="flex items-center gap-1 text-rose-400">
              <span className="relative w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-60" />
                <span className="absolute inset-0 rounded-full bg-rose-400" />
              </span>
              Incapacitated
            </span>
          ) : (
            <span className="text-surface-500">Not concentrating</span>
          )}
          <span className="text-surface-600">·</span>
          <span className="text-surface-500">CON {conMod >= 0 ? "+" : ""}{conMod}</span>
          <span className="text-surface-600">·</span>
          <span className="text-surface-500">DC {concentrationSaveDC}</span>
        </div>

        {/* ── Set Form ── */}
        {showSetForm && (
          <div className="mt-2 space-y-1.5 p-2 rounded-lg bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04]">
            <input
              type="text"
              value={spellName}
              onChange={(e) => setSpellName(e.target.value)}
              placeholder="Spell name..."
              className="w-full py-1 px-2 text-[9px] bg-gradient-to-b from-[#0c0d15]/80 to-[#07080d]/90 border border-surface-700/30 rounded-lg text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15"
              onKeyDown={(e) => e.key === "Enter" && handleSet()}
            />
            <div className="flex items-center gap-1">
              <label className="text-[8px] text-surface-500">Lv.</label>
              <input
                type="number"
                min={1}
                max={9}
                value={spellLevel}
                onChange={(e) => setSpellLevel(Math.min(9, Math.max(1, Number(e.target.value))) as SpellLevel)}
                className="w-10 py-1 px-1.5 text-[9px] bg-gradient-to-b from-[#0c0d15]/80 to-[#07080d]/90 border border-surface-700/30 rounded-lg text-surface-200 text-center focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15"
              />
              <button
                onClick={handleSet}
                className="ml-auto px-2 py-1 rounded-lg bg-gradient-to-b from-emerald-500/10 to-emerald-500/3 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold uppercase tracking-wider hover:from-emerald-500/20 hover:to-emerald-500/10 active:scale-90 transition-all duration-150"
              >
                Set
              </button>
            </div>
          </div>
        )}

        {/* ── Damage Save Calculator ── */}
        {hasConcentration && (
          <div className="mt-1.5 flex items-center gap-1.5 pt-1.5 border-t border-white/[0.03]">
            <input
              type="number"
              placeholder="dmg"
              value={damageAmount ?? ""}
              onChange={(e) => setDamageAmount(e.target.value ? Number(e.target.value) : null)}
              className="w-12 py-0.5 px-1 text-[8px] bg-gradient-to-b from-[#0c0d15]/80 to-[#07080d]/90 border border-surface-700/30 rounded text-surface-200 placeholder:text-surface-600 text-center focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15"
            />
            <span className="text-[8px] text-surface-500">dmg →</span>
            <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/15">
              <span className="text-[9px] font-bold text-amber-400 tabular-nums">
                DC {concentrationSaveDC}
              </span>
            </div>
            <span className="text-[8px] text-surface-500">
              ({conMod >= 0 ? "+" : ""}{conMod} CON)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function ConcentrationTracker({
  characters,
  showDamageInput = true,
}: ConcentrationTrackerProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  const casterCharacters = useMemo(() => {
    return characters.filter((c) => {
      const derived = computeAllDerivations(c);
      return derived.spellcasting.isCaster;
    });
  }, [characters]);

  const concentratingCount = useMemo(
    () => casterCharacters.filter((c) => c.conditions?.includes("concentration")).length,
    [casterCharacters]
  );
  const incapacitatedCount = useMemo(
    () => casterCharacters.filter((c) => isIncapacitated(c.conditions || [])).length,
    [casterCharacters]
  );

  const handleBreakConcentration = useCallback(
    (charId: string) => {
      const char = characters.find((c) => c.id === charId);
      if (!char) return;
      const conditions = (char.conditions || []).filter((c) => c !== "concentration");
      updateCharacter(charId, { conditions } as any);
    },
    [characters, updateCharacter]
  );

  const handleSetConcentration = useCallback(
    (charId: string, _spellName: string, _level: SpellLevel) => {
      const char = characters.find((c) => c.id === charId);
      if (!char) return;
      const conditions = [...(char.conditions || []).filter((c) => c !== "concentration"), "concentration"];
      updateCharacter(charId, { conditions } as any);
    },
    [characters, updateCharacter]
  );

  if (casterCharacters.length === 0) {
    return (
      <div className="relative rounded-2xl bg-gradient-to-b from-[#14151f]/80 to-[#0f1019]/90 border border-white/[0.04] p-6 text-center overflow-hidden group hover:border-white/[0.07] transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        <div className="text-2xl mb-2 opacity-60 relative z-[1]">🧘</div>
        <h3 className="text-sm font-bold text-gold-400/80 mb-1 relative z-[1]">Concentration Tracker</h3>
        <p className="text-[10px] text-surface-500 relative z-[1]">
          No spellcasters in the party. Characters with spellcasting classes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-gold-500/40" />
          <h3 className="text-xs font-bold text-gold-400">🧘 Concentration</h3>
        </div>
        <div className="flex items-center gap-2 text-[8px]">
          {concentratingCount > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="relative w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                <span className="absolute inset-0 rounded-full bg-emerald-400" />
              </span>
              {concentratingCount} concentrating
            </span>
          )}
          {incapacitatedCount > 0 && (
            <span className="flex items-center gap-1 text-rose-400">
              <span className="relative w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-60" />
                <span className="absolute inset-0 rounded-full bg-rose-400" />
              </span>
              {incapacitatedCount} incapacitated
            </span>
          )}
          {concentratingCount === 0 && incapacitatedCount === 0 && (
            <span className="text-surface-500 bg-surface-800/40 px-1.5 py-0.5 rounded text-[8px]">No active concentration</span>
          )}
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="space-y-1.5">
        {casterCharacters.map((char, idx) => (
          <ConcentrationCard
            key={char.id}
            character={char}
            onBreak={handleBreakConcentration}
            onSet={handleSetConcentration}
            index={idx}
          />
        ))}
      </div>

      {/* ── Rules Reference ── */}
      <details className="group">
        <summary className="text-[8px] text-surface-600 cursor-pointer hover:text-surface-500 transition-colors select-none list-none flex items-center gap-1">
          <span className="inline-block transition-transform duration-150 group-open:rotate-90">▸</span>
          📖 Concentration rules (5e RAW)
        </summary>
        <div className="mt-1.5 p-2.5 rounded-lg bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04] space-y-0.5 text-[8px] text-surface-500 leading-relaxed">
          <p>• Only <strong className="text-surface-400">one concentration spell</strong> at a time</p>
          <p>• Taking damage: <strong className="text-amber-400">DC 10 or half damage</strong>, whichever is higher</p>
          <p>• <strong className="text-rose-400">Incapacitated</strong> or killed: concentration <strong className="text-rose-400">ends automatically</strong></p>
          <p>• Can <strong className="text-emerald-400">voluntarily end</strong> concentration (free action)</p>
          <p>• Casting another concentration spell: <strong className="text-rose-400">ends the first</strong></p>
          <p>• Environmental effects (DM discretion): DC 10 CON save</p>
        </div>
      </details>
    </div>
  );
}
