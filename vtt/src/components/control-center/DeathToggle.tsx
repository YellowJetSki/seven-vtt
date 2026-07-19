/**
 * STᚱ VTT — Death Toggle (Premium Gold)
 *
 * Gold-accented button to toggle a combatant between alive and dead.
 * Red styling when dead, subtle gold hover when alive.
 */

interface DeathToggleProps {
  isDead: boolean;
  onToggle: (id: string) => void;
  combatantId: string;
}

export default function DeathToggle({
  isDead,
  onToggle,
  combatantId,
}: DeathToggleProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(combatantId);
      }}
      className={`px-1.5 py-0.5 rounded text-[10px] transition-all duration-150 border ${
        isDead
          ? "bg-red-500/20 border-red-500/15 text-red-400 hover:bg-red-500/30 hover:border-red-500/25"
          : "bg-obsidian-mid/40 border-surface-700/20 text-surface-500 hover:border-gold/15 hover:text-gold-400 hover:bg-gold-500/8"
      }`}
      title={isDead ? "Revive" : "Kill"}
    >
      {isDead ? "♻" : "💀"}
    </button>
  );
}
