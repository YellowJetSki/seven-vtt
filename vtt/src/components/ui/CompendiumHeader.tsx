/**
 * STᚱ VTT — CompendiumHeader
 *
 * Premium drawer header with:
 * - Staggered entrance animation (slide-in from top)
 * - Gold accent line at bottom
 * - Close button with rotate-90-on-hover animation
 * - Gold title with drop-shadow glow
 */

interface CompendiumHeaderProps {
  onClose: () => void;
}

export default function CompendiumHeader({ onClose }: CompendiumHeaderProps) {
  return (
    <div className="relative mb-4 pb-4 border-b border-gold/10">
      {/* Gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent" />

      <div className="flex items-center justify-between animate-slide-in-from-right">
        <div className="flex items-center gap-2.5">
          {/* Icon container */}
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold/15 flex items-center justify-center">
            <span className="text-base">📚</span>
          </div>

          {/* Title with glow */}
          <div>
            <h2 className="text-sm font-black text-gold drop-shadow-[0_0_8px_rgba(234,179,8,0.12)] leading-tight">
              Compendium
            </h2>
            <p className="text-[9px] text-surface-500 uppercase tracking-[0.15em] font-medium leading-tight mt-0.5">
              Reference Library
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-all duration-200 active:scale-90 group"
          aria-label="Close compendium"
        >
          <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
