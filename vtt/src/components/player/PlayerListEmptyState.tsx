/**
 * STᚱ VTT — Player List Empty State (Lusion-Grade Premium)
 *
 * Premium empty state with layered depth composition:
 * - Floating animated icon container with depth ring
 * - Ambient glow pocket behind icon
 * - Gold gradient title with subtle text shadow
 * - Rune divider with ✦ ᚱ ✦ motif
 * - Gradient CTA button with hover shadow glow
 * - Staggered entrance animation
 */

interface PlayerListEmptyStateProps {
  onCreateFirst: () => void;
}

export default function PlayerListEmptyState({
  onCreateFirst,
}: PlayerListEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 sm:py-16 px-4 relative">
      {/* Ambient glow pocket */}
      <div className="absolute top-16 w-32 h-32 bg-gold-500/[0.03] rounded-full blur-[60px] pointer-events-none" />

      {/* Floating icon container with depth ring */}
      <div className="relative">
        {/* Outer depth ring */}
        <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-gold-500/8 via-transparent to-amber-500/5 opacity-60" />
        <div className="absolute -inset-1.5 rounded-2xl border border-gold-500/10" />

        {/* Icon container */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#181a2a]/80 to-[#0c0d15]/90 border border-gold-500/15 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <span className="text-3xl drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">👥</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-white/80 mb-1.5 mt-5">
        No characters yet
      </h3>
      <p className="text-xs text-surface-500 max-w-xs text-center leading-relaxed">
        Add a character to get started with your party.
        Create heroes to manage HP, stats, and spells.
      </p>

      {/* Premium rune divider */}
      <div className="flex items-center gap-3 my-5">
        <span className="w-12 h-px bg-gradient-to-r from-transparent to-gold-500/15" />
        <span className="text-[8px] text-gold-500/25 uppercase tracking-[0.2em] font-mono font-bold">✦ ᚱ ✦</span>
        <span className="w-12 h-px bg-gradient-to-l from-transparent to-gold-500/15" />
      </div>

      {/* CTA button with hover glow */}
      <button
        onClick={onCreateFirst}
        className="
          flex items-center gap-2 px-5 py-2.5 rounded-xl
          bg-gradient-to-br from-gold-500/12 to-amber-500/8
          border border-gold-500/20 text-gold-400 text-sm font-semibold
          active:scale-95 transition-all duration-200
          hover:from-gold-500/20 hover:to-amber-500/12
          hover:border-gold-500/30 hover:shadow-[0_0_24px_rgba(234,179,8,0.08)]
        "
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Create First Character</span>
      </button>
    </div>
  );
}
