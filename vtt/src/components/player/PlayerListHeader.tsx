/**
 * STᚱ VTT — Player List Header (Overrrides-Grade Premium DM Toolbar)
 *
 * Premium toolbar with Playfair Display title section, character count badge,
 * and DM utility toggles — Matrix, Loot, Status.
 *
 * Features:
 * - Gold-accented "Party Roster" section with OverrridesSectionHeader pattern
 * - Matrix / Loot / Status toggle buttons with active/inactive gold glow states
 * - Gradient "Add PC" button with hover shadow glow
 * - Premium Plus Jakarta Sans typography
 * - High-contrast text for accessibility
 */

interface PlayerListHeaderProps {
  characterCount: number;
  onAdd: () => void;
  onToggleMatrix: () => void;
  showMatrix: boolean;
  showLootPanel?: boolean;
  onToggleLootPanel?: () => void;
  showConditionsPanel?: boolean;
  onToggleConditionsPanel?: () => void;
}

interface ToggleButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ToggleButton({ icon, label, isActive, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold
        transition-all duration-200 active:scale-95
        ${isActive
          ? "bg-gold-500/10 border border-gold/15 text-gold-400 shadow-[0_0_8px_rgba(234,179,8,0.03)]"
          : "text-surface-500 border border-transparent hover:text-surface-300 hover:bg-white/[0.03]"
        }
      `}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function PlayerListHeader({
  characterCount,
  onAdd,
  onToggleMatrix,
  showMatrix,
  showLootPanel = false,
  onToggleLootPanel,
  showConditionsPanel = false,
  onToggleConditionsPanel,
}: PlayerListHeaderProps) {
  const hasCharacters = characterCount > 0;

  return (
    <div className="flex items-center justify-between mb-3 sm:mb-4">
      {/* Left: Title + count + toggles */}
      <div className="flex items-center gap-2.5">
        {/* Gold-accented icon container (matching OverrridesSectionHeader) */}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-500/10 to-amber-500/5 border border-gold-500/15 flex items-center justify-center shrink-0">
          <span className="text-xs">👥</span>
        </div>

        <h2 className="text-sm font-semibold text-white/85 uppercase tracking-[0.05em] font-sans">
          Party Roster
        </h2>

        {/* Count badge — premium glass */}
        {hasCharacters && (
          <span className="text-[9px] text-surface-400 bg-[#0c0d15] border border-white/[0.04] px-2 py-0.5 rounded-full font-mono tabular-nums font-medium">
            {characterCount}
          </span>
        )}

        {/* Toggle buttons — only when characters exist */}
        {hasCharacters && (
          <div className="flex items-center gap-1 ml-1">
            <ToggleButton
              icon="📊"
              label="Matrix"
              isActive={showMatrix}
              onClick={onToggleMatrix}
            />
            {onToggleLootPanel && (
              <ToggleButton
                icon="📦"
                label="Loot"
                isActive={showLootPanel}
                onClick={onToggleLootPanel}
              />
            )}
            {onToggleConditionsPanel && (
              <ToggleButton
                icon="💡"
                label="Status"
                isActive={showConditionsPanel}
                onClick={onToggleConditionsPanel}
              />
            )}
          </div>
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
