import { calculateEncumbrance, encumbranceToSpeed, formatEncumbranceLevel } from "@/lib/mechanics/encumbrance-engine";
import type { EncumbranceState } from "@/types";

interface EncumbranceDisplayProps {
  strength: number;
  equipment: { item: string; quantity: number; weight: number }[];
  inventory: { name: string; quantity: number; weight: number }[];
  currency: { copper: number; silver: number; electrum: number; gold: number; platinum: number };
  baseSpeed?: number;
  variant?: "standard" | "variant";
}

export default function EncumbranceDisplay({
  strength, equipment, inventory, currency,
  baseSpeed = 30, variant = "variant",
}: EncumbranceDisplayProps) {
  const result = calculateEncumbrance(strength, equipment, inventory, currency, variant);
  const modifiedSpeed = encumbranceToSpeed(baseSpeed, result.encumbrance);
  const pct = (result.encumbrance.totalWeight / result.encumbrance.carryingCapacity) * 100;

  const getBarColor = (level: EncumbranceState["encumbranceLevel"]) => {
    switch (level) {
      case "unencumbered": return "bg-rogue-500";
      case "lightly_encumbered": return "bg-mage-500";
      case "heavily_encumbered": return "bg-warrior-500";
      case "overencumbered": return "bg-warrior-400";
    }
  };

  return (
    <div className="space-y-2 p-3 rounded-xl bg-obsidian-mid/40 border border-surface-700/20 hover:border-gold/10 transition-all duration-200">
      <h3 className="text-[10px] uppercase tracking-widest text-gold-500/60 font-black">Encumbrance</h3>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-surface-400">Carrying Capacity</span>
          <span className="text-surface-200 font-medium">{result.encumbrance.carryingCapacity} lbs</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-surface-400">Current Load</span>
          <span className="text-surface-200 font-medium">{result.weight.total.toFixed(1)} lbs</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-surface-800 rounded-full overflow-hidden border border-surface-700/30">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${getBarColor(result.encumbrance.encumbranceLevel)}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white drop-shadow-md">{Math.round(pct)}%</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-surface-400">Status</span>
        <span className={`font-medium ${
          result.encumbrance.encumbranceLevel === "unencumbered" ? "text-rogue-400" :
          result.encumbrance.encumbranceLevel === "lightly_encumbered" ? "text-mage-400" :
          result.encumbrance.encumbranceLevel === "heavily_encumbered" ? "text-warrior-400" :
          "text-warrior-300"
        }`}>
          {formatEncumbranceLevel(result.encumbrance.encumbranceLevel)}
        </span>
      </div>

      {/* Speed impact */}
      {modifiedSpeed !== baseSpeed && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-surface-400">Speed</span>
          <span className="text-warrior-400 font-medium">{modifiedSpeed}ft (was {baseSpeed}ft)</span>
        </div>
      )}

      {/* Weight breakdown */}
      <details className="text-xs">
        <summary className="text-surface-500 cursor-pointer hover:text-surface-300 transition-colors">Weight Breakdown</summary>
        <div className="mt-1 space-y-0.5 pl-2 border-l border-surface-700/30">
          <div className="flex justify-between text-surface-400">
            <span>Equipment</span>
            <span>{result.weight.baseItems.toFixed(1)} lbs</span>
          </div>
          <div className="flex justify-between text-surface-400">
            <span>Inventory</span>
            <span>{result.weight.inventory.toFixed(1)} lbs</span>
          </div>
          <div className="flex justify-between text-surface-400">
            <span>Currency</span>
            <span>{result.weight.currency.toFixed(2)} lbs</span>
          </div>
          <div className="flex justify-between text-surface-200 font-medium pt-1 border-t border-surface-700/20 mt-1">
            <span>Total</span>
            <span>{result.weight.total.toFixed(1)} lbs</span>
          </div>
        </div>
      </details>
    </div>
  );
}
