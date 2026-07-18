/* ── Loot Generator Controls ────────────────────────────────────
 * Button bar for generating different types of loot.
 * Extracted from LootGenerator.tsx to keep files under 150 lines.
 * ─────────────────────────────────────────────────────────────── */

import { Button } from "@/components/ui/Button";

interface Props {
  coinAmount: number;
  onCoinAmountChange: (amount: number) => void;
  onGenerateCoin: () => void;
  onGenerateArt: () => void;
  onGenerateMagic: () => void;
  onGenerateMundane: () => void;
  onClearAll: () => void;
  hasEntries: boolean;
}

export function LootGeneratorControls({
  coinAmount,
  onCoinAmountChange,
  onGenerateCoin,
  onGenerateArt,
  onGenerateMagic,
  onGenerateMundane,
  onClearAll,
  hasEntries,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center gap-1 rounded-lg bg-surface-800 px-2 py-1.5">
        <input
          type="number"
          value={coinAmount}
          onChange={(e) => onCoinAmountChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-16 rounded border border-surface-700 bg-surface-900 px-1.5 py-0.5 text-center text-xs text-surface-100"
        />
        <Button size="xs" variant="ghost" onClick={onGenerateCoin}>
          Coins
        </Button>
      </div>
      <Button size="xs" variant="ghost" onClick={onGenerateArt}>
        Art
      </Button>
      <Button size="xs" variant="ghost" onClick={onGenerateMagic}>
        Magic
      </Button>
      <Button size="xs" variant="ghost" onClick={onGenerateMundane}>
        Mundane
      </Button>
      {hasEntries && (
        <Button size="xs" variant="ghost" onClick={onClearAll}>
          Clear
        </Button>
      )}
    </div>
  );
}
