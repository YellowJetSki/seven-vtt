/**
 * STᚱ VTT — CompendiumToggleButton
 *
 * Floating book icon button with animated gold pulse dot.
 * Extracted from monolithic CompendiumDrawer for reusability.
 *
 * Features:
 * - 44px+ touch target (w-11 h-11)
 * - Animated SVG book icon with opening/closing path morph
 * - Gold pulse dot indicator (bottom-right corner)
 * - Hover: gold glow + subtle scale feedback
 * - Active: scale-90 press feedback
 */

interface CompendiumToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function CompendiumToggleButton({ isOpen, onClick }: CompendiumToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-11 h-11 rounded-xl
        hover:bg-gold-500/10 text-surface-400 hover:text-gold-400
        transition-all duration-200 group active:scale-90"
      aria-label={isOpen ? "Close compendium" : "Open compendium"}
    >
      {/* Book icon — switches between closed/open book */}
      <svg
        className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        {isOpen ? (
          // Open book (pages visible)
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13" strokeWidth={2} />
          </>
        ) : (
          // Closed book
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        )}
      </svg>

      {/* Gold pulse notification dot */}
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gold-500 rounded-full animate-pulse-soft shadow-[0_0_6px_rgba(234,179,8,0.4)]" />
    </button>
  );
}
