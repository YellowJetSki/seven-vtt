/**
 * STᚱ VTT — SpellcastingStatsHeader
 *
 * 3-card grid showing Spell Save DC, Spell Attack Bonus,
 * and Spellcasting Ability Modifier.
 *
 * Extracted from PlayerSheetSpellsTab.tsx monolith (Sprint 7 refactor).
 */

interface SpellcastingStatsHeaderProps {
  spellSaveDC: number;
  spellAttackBonus: number;
  spellcastingMod: number;
  spellcastingAbility: string;
  characterClass: string;
}

export default function SpellcastingStatsHeader({
  spellSaveDC,
  spellAttackBonus,
  spellcastingMod,
  spellcastingAbility,
  characterClass,
}: SpellcastingStatsHeaderProps) {
  const modLabel = spellcastingMod > 0 ? `+${spellcastingMod}` : `${spellcastingMod}`;

  return (
    <>
      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">DC</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5 text-cyan-300 drop-shadow-[0_0_4px_rgba(6,182,212,0.1)]">
            {spellSaveDC}
          </span>
        </div>
        <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">ATK</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5 text-gold-300 drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">
            +{spellAttackBonus}
          </span>
        </div>
        <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">Mod</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5 text-gold-300 drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">
            {modLabel}
          </span>
        </div>
      </div>

      {/* ── Class label ── */}
      <div className="text-center">
        <span className="text-[10px] uppercase tracking-wider text-surface-500">
          {spellcastingAbility.charAt(0).toUpperCase() + spellcastingAbility.slice(1)} · {characterClass}
        </span>
      </div>
    </>
  );
}
