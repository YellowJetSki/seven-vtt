/**
 * STᚱ VTT — Spell Prepare Toggle
 *
 * A small inline toggle button on each spell row that marks
 * the spell as "prepared" or "unprepared". Prepared spells
 * automatically inject into the Combat Tab's spell list.
 *
 * Persists to character state → Zustand + Firestore.
 *
 * Usage:
 *   <SpellPrepareToggle
 *     isPrepared={isPrepared}
 *     onChange={(next) => handlePrepare(spellName, next)}
 *   />
 */

interface SpellPrepareToggleProps {
  /** Whether the spell is currently prepared */
  isPrepared: boolean;
  /** Called with the new prepared state */
  onChange: (prepared: boolean) => void;
  /** Optional disabled state (cantrips are always prepared) */
  disabled?: boolean;
  /** Optional size variant */
  size?: "sm" | "md";
}

export default function SpellPrepareToggle({
  isPrepared,
  onChange,
  disabled = false,
  size = "sm",
}: SpellPrepareToggleProps) {
  const sizeClasses = size === "sm" ? "w-5 h-5 text-[10px]" : "w-7 h-7 text-xs";
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  if (disabled) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded ${sizeClasses} bg-surface-700/30 text-surface-500 cursor-not-allowed`}
        title="Cantrips are always prepared"
      >
        <span className={`${dotSize} rounded-full bg-surface-500/40`} />
      </span>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!isPrepared);
      }}
      className={`inline-flex items-center justify-center rounded ${sizeClasses} transition-all duration-200 ${
        isPrepared
          ? "bg-gold-500/15 text-gold-400 border border-gold-500/25 shadow-[0_0_4px_rgba(234,179,8,0.15)]"
          : "bg-surface-700/30 text-surface-500 border border-transparent hover:bg-surface-700/50 hover:text-surface-400"
      }`}
      title={isPrepared ? "Unprepare spell" : "Prepare spell"}
      aria-label={isPrepared ? "Unprepare" : "Prepare"}
    >
      {isPrepared ? (
        <span className={`${dotSize} rounded-full bg-gold-400 shadow-[0_0_3px_rgba(234,179,8,0.3)]`} />
      ) : (
        <span className={`${dotSize} rounded-full bg-surface-500/40`} />
      )}
    </button>
  );
}
