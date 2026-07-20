/**
 * STᚱ VTT — SpellcastingStatsHeader (Premium)
 *
 * Spotify/Duolingo-grade spellcasting stats:
 * - 3-card grid with tier-based color coding
 * - Lusion-style glow cards with depth rings
 * - Sophisticated typography with tracking
 * - Hover elevation with directional glow
 * - Class label with decorative divider
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

  const cards = [
    {
      label: "Save DC",
      value: spellSaveDC,
      valueColor: "text-cyan-300",
      glowColor: "rgba(6,182,212,0.08)",
      ringColor: "from-cyan-500/10 via-transparent to-transparent",
    },
    {
      label: "Spell ATK",
      value: `+${spellAttackBonus}`,
      valueColor: "text-gold-300",
      glowColor: "rgba(234,179,8,0.08)",
      ringColor: "from-gold-500/10 via-transparent to-transparent",
    },
    {
      label: "Modifier",
      value: modLabel,
      valueColor: spellcastingMod >= 0 ? "text-emerald-300" : "text-rose-300",
      glowColor: `rgba(${spellcastingMod >= 0 ? 52 : 244}, ${spellcastingMod >= 0 ? 211 : 63}, ${spellcastingMod >= 0 ? 153 : 94}, 0.06)`,
      ringColor: "from-emerald-500/10 via-transparent to-transparent",
    },
  ];

  return (
    <>
      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-2">
        {cards.map((card, idx) => (
          <div
            key={card.label}
            className="relative group flex flex-col items-center rounded-xl bg-gradient-to-b from-[#14151f]/80 to-[#0f1019]/90 border border-white/[0.04] py-3 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 overflow-hidden"
            style={{ animationDelay: `${idx * 50}ms`, animation: "slide-in-up 0.3s ease-out both" }}
          >
            {/* Conic depth ring */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl bg-gradient-to-br"
              style={{ background: `conic-gradient(from 0deg at 50% 50%, ${card.glowColor}, transparent 60%)` }}
            />
            {/* Hover directional glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
              style={{
                background: `radial-gradient(ellipse 100px 60px at 50% 20%, ${card.glowColor}, transparent)`,
              }}
            />
            {/* Edge light */}
            <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/[0.03] group-hover:via-white/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

            <span className="text-[8px] uppercase tracking-[0.15em] font-black text-gold-500/60 relative z-[1]">
              {card.label}
            </span>
            <span
              className={`text-2xl font-bold tabular-nums mt-0.5 relative z-[1] ${card.valueColor}`}
              style={{
                textShadow: `0 0 10px ${card.glowColor.replace("0.08", "0.15")}`,
              }}
            >
              {card.value}
            </span>
            {/* Bottom accent line on hover */}
            <div
              className="absolute bottom-0 left-[20%] right-[20%] h-[1.5px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `linear-gradient(90deg, transparent, ${card.glowColor.replace("0.08", "0.25")}, transparent)` }}
            />
          </div>
        ))}
      </div>

      {/* ── Class label with decorative dividers ── */}
      <div className="flex items-center gap-3 justify-center">
        <div className="w-6 h-px bg-gradient-to-r from-transparent to-gold-500/15" />
        <span className="text-[9px] uppercase tracking-[0.12em] text-surface-500 font-semibold">
          {spellcastingAbility.charAt(0).toUpperCase() + spellcastingAbility.slice(1)}
          <span className="text-surface-600 mx-1">·</span>
          {characterClass}
        </span>
        <div className="w-6 h-px bg-gradient-to-l from-transparent to-gold-500/15" />
      </div>
    </>
  );
}
