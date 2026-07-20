/**
 * STᚱ VTT — Spell Prepare Toggle (Premium)
 *
 * An inline toggle button on each spell row marking the spell
 * as "prepared" or "unprepared". Premium micro-interaction:
 * - Gold dot with glow shadow when prepared
 * - Dim dot when unprepared
 * - Smooth opacity transition
 * - Scale feedback on click
 * - Cantrips shown as always-prepared (disabled state)
 *
 * Prepared spells automatically inject into the Combat Tab.
 */

interface SpellPrepareToggleProps {
  isPrepared: boolean;
  onChange: (prepared: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export default function SpellPrepareToggle({
  isPrepared,
  onChange,
  disabled = false,
  size = "sm",
}: SpellPrepareToggleProps) {
  const sizeClasses = size === "sm" ? "w-5 h-5 text-[10px]" : "w-7 h-7 text-xs";

  if (disabled) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full ${sizeClasses} bg-surface-700/30 text-surface-500 cursor-not-allowed`}
        title="Cantrips are always prepared"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-surface-500/40" />
      </span>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!isPrepared);
      }}
      className={`inline-flex items-center justify-center rounded-full ${sizeClasses} transition-all duration-200 active:scale-90 ${
        isPrepared
          ? "bg-gold-500/15 border border-gold-500/25 shadow-[0_0_6px_rgba(234,179,8,0.15)]"
          : "bg-surface-800/40 border border-transparent hover:bg-surface-700/50 hover:border-surface-600/30"
      }`}
      title={isPrepared ? "Unprepare spell" : "Prepare spell"}
      aria-label={isPrepared ? "Unprepare" : "Prepare"}
    >
      <span
        className={`rounded-full transition-all duration-200 ${
          isPrepared
            ? "w-2 h-2 bg-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.4)]"
            : "w-1.5 h-1.5 bg-surface-500/40"
        }`}
      />
    </button>
  );
}
