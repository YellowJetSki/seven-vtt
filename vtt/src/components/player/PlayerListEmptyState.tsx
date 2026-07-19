/**
 * STᚱ VTT — Player List Empty State (Premium)
 *
 * Rich empty state with floating icon, description,
 * and gold-accented action button with hover glow.
 */

interface PlayerListEmptyStateProps {
  onCreateFirst: () => void;
}

export default function PlayerListEmptyState({
  onCreateFirst,
}: PlayerListEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 sm:py-16 px-4">
      {/* Floating icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500/8 to-amber-500/5 border border-gold-500/15 flex items-center justify-center mb-5 float-arcane">
        <span className="text-3xl drop-shadow-[0_0_8px_rgba(234,179,8,0.15)]">👥</span>
      </div>

      <h3 className="text-base font-bold text-white/80 mb-1.5">
        No characters yet
      </h3>
      <p className="text-xs text-surface-500 max-w-xs text-center leading-relaxed">
        Add a character to get started with your party.
        Create heroes to manage HP, stats, and spells.
      </p>

      {/* Rune divider */}
      <div className="flex items-center gap-3 my-5">
        <span className="w-8 h-px bg-gradient-to-r from-transparent to-gold-500/15" />
        <span className="text-[8px] text-gold-500/25 uppercase tracking-[0.2em]">✦ ᚱ ✦</span>
        <span className="w-8 h-px bg-gradient-to-l from-transparent to-gold-500/15" />
      </div>

      <button
        onClick={onCreateFirst}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 text-sm font-semibold active:scale-95 transition-all duration-200 hover:from-gold-500/20 hover:to-amber-500/12 hover:border-gold-500/30 hover:shadow-[0_0_20px_rgba(234,179,8,0.08)]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Create First Character</span>
      </button>
    </div>
  );
}
