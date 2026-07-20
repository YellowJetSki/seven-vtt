/**
 * STᚱ VTT — Role Selection (Premium Gold)
 *
 * Gold-accented role selection cards with hover-lift effects.
 * DM button uses gold accent, Player button uses amber accent.
 */

type LoginStep = "role" | "dm" | "player";

interface RoleSelectionProps {
  onSelect: (step: LoginStep) => void;
}

export default function RoleSelection({ onSelect }: RoleSelectionProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={() => onSelect("dm")}
        className="w-full p-5 rounded-xl border border-gold/15 hover:border-gold/40 bg-premium-surface hover:bg-gold-500/8 transition-all duration-300 group hover-lift"
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl float-arcane" aria-hidden="true">👑</span>
          <div className="text-left">
            <div className="font-bold text-white group-hover:text-gold transition-all duration-300 text-lg">
              Dungeon Master
            </div>
            <div className="text-sm text-surface-500 mt-0.5">Campaign management, encounters & world-building</div>
          </div>
          <div className="ml-auto text-gold-500/0 group-hover:text-gold-500/40 transition-all duration-300">→</div>
        </div>
      </button>

      <button
        onClick={() => onSelect("player")}
        className="w-full p-5 rounded-xl border border-surface-700/30 hover:border-amber-500/40 bg-premium-surface hover:bg-amber-500/8 transition-all duration-300 group hover-lift"
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl float-delayed" aria-hidden="true">⚔</span>
          <div className="text-left">
            <div className="font-bold text-white group-hover:text-amber-400 transition-all duration-300 text-lg">
              Player
            </div>
            <div className="text-sm text-surface-500 mt-0.5">Character sheet, spells & session view</div>
          </div>
          <div className="ml-auto text-amber-500/0 group-hover:text-amber-500/40 transition-all duration-300">→</div>
        </div>
      </button>

      <div className="rune-gold pt-2 justify-center">ᚱ ᚱ ᚱ</div>
    </div>
  );
}
