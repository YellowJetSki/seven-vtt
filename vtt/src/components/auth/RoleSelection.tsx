/**
 * STᚱ VTT — Role Selection (Premium Gold)
 *
 * Gold-accented role selection cards with premium glass + hover-lift.
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
        className="w-full p-5 rounded-xl border border-gold/15 hover:border-gold/40 bg-gradient-to-b from-white/[0.02] to-transparent hover:bg-gold-500/8 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] group"
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
        className="w-full p-5 rounded-xl border border-surface-700/30 hover:border-amber-500/40 bg-gradient-to-b from-white/[0.02] to-transparent hover:bg-amber-500/8 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] group"
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

      <div className="flex items-center justify-center gap-3 pt-2">
        <span className="w-6 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
        <span className="text-[9px] text-gold-500/40 tracking-[0.3em] font-bold">ᚱ ᚱ ᚱ</span>
        <span className="w-6 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      </div>
    </div>
  );
}
