export default function StatusBar() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/30 border border-surface-700/30">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-rogue-500 animate-pulse-soft" />
        <span className="text-xs text-surface-400">System Online</span>
      </div>
      <div className="h-4 w-px bg-surface-700/50" />
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-soft" />
        <span className="text-xs text-surface-400">Local Storage Active</span>
      </div>
      <div className="h-4 w-px bg-surface-700/50" />
      <span className="text-xs text-surface-500">Physical Dice Only — No Digital RNG</span>
    </div>
  );
}
