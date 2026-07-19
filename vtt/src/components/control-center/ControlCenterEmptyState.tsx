/**
 * STᚱ VTT — Control Center Empty State
 *
 * Premium empty state shown when no map is selected.
 * Features a floating map icon, descriptive text, and gold accents.
 */

export default function ControlCenterEmptyState() {
  return (
    <div className="h-full flex items-center justify-center bg-obsidian">
      <div className="flex flex-col items-center text-center px-6 py-10">
        {/* Floating map icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500/8 to-amber-500/5 border border-gold-500/15 flex items-center justify-center mb-6 float-arcane">
          <span className="text-4xl drop-shadow-[0_0_10px_rgba(234,179,8,0.15)]">🗺</span>
        </div>

        <h2 className="text-lg font-bold text-white/85 mb-2">
          Select a Battle Map
        </h2>
        <p className="text-sm text-surface-500 max-w-xs leading-relaxed mb-6">
          Choose a map from the sidebar to begin your session.
          Create new maps from the Battle Maps page.
        </p>

        {/* Gold rune divider */}
        <div className="flex items-center gap-3">
          <span className="w-12 h-px bg-gradient-to-r from-transparent to-gold-500/15" />
          <span className="text-[8px] text-gold-500/25 uppercase tracking-[0.2em]">✦ ᚱ ✦</span>
          <span className="w-12 h-px bg-gradient-to-l from-transparent to-gold-500/15" />
        </div>

        <p className="text-[10px] text-surface-600 mt-4 font-mono">
          DM Command Bridge
        </p>
      </div>
    </div>
  );
}
