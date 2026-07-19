/**
 * STᚱ VTT — Player List Header
 *
 * Header for the player list with character count and add button.
 */

interface PlayerListHeaderProps {
  characterCount: number;
  onAdd: () => void;
}

export default function PlayerListHeader({
  characterCount,
  onAdd,
}: PlayerListHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gradient-arcane">
          Player Characters
        </span>
        <span className="text-[10px] text-surface-500 bg-surface-800/50 px-1.5 py-0.5 rounded-full">
          {characterCount}
        </span>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-600/15 border border-accent-500/20 text-accent-300 text-xs font-semibold active:scale-95 transition-all hover:bg-accent-600/25"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Add PC</span>
      </button>
    </div>
  );
}
