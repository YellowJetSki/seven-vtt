/**
 * STᚱ VTT — Death Toggle
 *
 * Small button to toggle a combatant between alive and dead.
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
      className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
        isDead
          ? "bg-red-500/20 text-red-400"
          : "bg-surface-700/30 text-surface-500 hover:bg-surface-600/30"
      }`}
      title={isDead ? "Revive" : "Kill"}
    >
      {isDead ? "♻" : "💀"}
    </button>
  );
}
