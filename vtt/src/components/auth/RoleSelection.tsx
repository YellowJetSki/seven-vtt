type LoginStep = "role" | "dm" | "player";

interface RoleSelectionProps {
  onSelect: (step: LoginStep) => void;
}

export default function RoleSelection({ onSelect }: RoleSelectionProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={() => onSelect("dm")}
        className="w-full p-4 rounded-xl border border-surface-700/50 hover:border-accent-500/50 bg-surface-800/30 hover:bg-accent-600/10 transition-all duration-200 group"
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl">👑</span>
          <div className="text-left">
            <div className="font-bold text-white group-hover:text-accent-300 transition-colors">Dungeon Master</div>
            <div className="text-sm text-surface-400">Campaign management & controls</div>
          </div>
        </div>
      </button>

      <button
        onClick={() => onSelect("player")}
        className="w-full p-4 rounded-xl border border-surface-700/50 hover:border-rogue-500/50 bg-surface-800/30 hover:bg-rogue-500/10 transition-all duration-200 group"
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl">⚔</span>
          <div className="text-left">
            <div className="font-bold text-white group-hover:text-rogue-300 transition-colors">Player</div>
            <div className="text-sm text-surface-400">Character sheet & session view</div>
          </div>
        </div>
      </button>
    </div>
  );
}
