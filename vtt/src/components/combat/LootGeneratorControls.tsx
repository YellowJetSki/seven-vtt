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

const LOOT_BUTTONS = [
  { label: "🪙 Coins", icon: "🪙", action: "coin" as const },
  { label: "🖼️ Art", icon: "🎨", action: "art" as const },
  { label: "🔮 Magic", icon: "✨", action: "magic" as const },
  { label: "📦 Mundane", icon: "📦", action: "mundane" as const },
];

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
  const generators: Record<string, () => void> = {
    coin: onGenerateCoin,
    art: onGenerateArt,
    magic: onGenerateMagic,
    mundane: onGenerateMundane,
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* ── Coin Amount Input ── */}
      <div className="flex items-center gap-1.5 rounded-xl border border-surface-700/40 bg-surface-850/70 px-2.5 py-1.5">
        <span className="text-xs text-surface-500">🪙</span>
        <input
          type="number"
          value={coinAmount}
          onChange={(e) => onCoinAmountChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-14 rounded-lg border border-surface-700/50 bg-surface-900/80 px-2 py-1 text-center text-xs text-surface-100 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/20 transition-all"
        />
        <span className="text-[9px] text-surface-500">gp</span>
      </div>

      {/* ── Generation Buttons ── */}
      {LOOT_BUTTONS.map((btn) => (
        <Button
          key={btn.action}
          size="xs"
          variant="ghost"
          onClick={generators[btn.action]}
          className="rounded-lg border border-surface-700/30 bg-surface-850/50 hover:bg-surface-800/80 hover:border-accent-500/20 transition-all"
        >
          {btn.label}
        </Button>
      ))}

      {hasEntries && (
        <Button
          size="xs"
          variant="ghost"
          onClick={onClearAll}
          className="text-warrior-400/70 hover:text-warrior-400 hover:bg-warrior-500/10 rounded-lg transition-all"
        >
          ✕ Clear
        </Button>
      )}
    </div>
  );
}
