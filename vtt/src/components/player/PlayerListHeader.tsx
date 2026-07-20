/**
 * STᚱ VTT — Player List Header (Premium DM Toolbar)
 *
 * Premium toolbar with character count badge, Matrix toggle,
 * and "Add PC" call-to-action button.
 *
 * Features:
 * - Gold-accented "Party Roster" title with count badge
 * - Matrix toggle with active/inactive states and icon
 * - Gradient "Add PC" button with hover shadow glow
 * - Responsive spacing (mobile/desktop)
 */

interface PlayerListHeaderProps {
  characterCount: number;
  onAdd: () => void;
  onToggleMatrix: () => void;
  showMatrix: boolean;
}

export default function PlayerListHeader({
  characterCount,
  onAdd,
  onToggleMatrix,
  showMatrix,
}: PlayerListHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3 sm:mb-4">
      {/* Left: Title + count */}
      <div className="flex items-center gap-2.5">
        <h2 className="text-sm font-bold text-white/80 uppercase tracking-[0.05em]">
          Party Roster
        </h2>
        <span className="text-[9px] text-surface-500 bg-[#0c0d15] border border-white/[0.04] px-2 py-0.5 rounded-full font-medium tabular-nums">
          {characterCount}
        </span>

        {/* Matrix toggle — only show when characters exist */}
        {characterCount > 0 && (
          <button
            onClick={onToggleMatrix}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold
              transition-all duration-200 active:scale-95
              ${showMatrix
                ? "bg-gold-500/10 border border-gold/15 text-gold-400 shadow-[0_0_8px_rgba(234,179,8,0.03)]"
                : "text-surface-500 border border-transparent hover:text-surface-300 hover:bg-white/[0.03]"
              }
            `}
          >
            <span>📊</span>
            <span>Matrix</span>
          </button>
        )}
      </div>

      {/* Right: Add PC button */}
      <button
        onClick={onAdd}
        className="
          flex items-center gap-1.5 px-3.5 py-2 rounded-xl
          bg-gradient-to-br from-gold-500/12 to-amber-500/8
          border border-gold-500/20 text-gold-400 text-[11px] font-semibold
          active:scale-95 transition-all duration-200
          hover:from-gold-500/20 hover:to-amber-500/12
          hover:border-gold-500/30 hover:shadow-[0_0_16px_rgba(234,179,8,0.08)]
        "
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Add PC</span>
      </button>
    </div>
  );
}
