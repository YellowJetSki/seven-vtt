/**
 * STᚱ VTT — Combatant Type Indicator
 *
 * Small visual indicator showing the combatant type via a colored left border.
 */

interface CombatantTypeIndicatorProps {
  type: string;
}

function getBorderClass(type: string): string {
  switch (type) {
    case "player":
      return "border-l-4 border-l-warrior-500";
    case "enemy":
      return "border-l-4 border-l-rogue-500";
    case "ally":
      return "border-l-4 border-l-divine-500";
    default:
      return "border-l-4 border-l-surface-500";
  }
}

export default function CombatantTypeIndicator({
  type,
}: CombatantTypeIndicatorProps) {
  return <div className={getBorderClass(type)} />;
}
