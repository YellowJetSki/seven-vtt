/**
 * STᚱ VTT — HamburgerButton
 *
 * Animated hamburger menu button with smooth morphing bars.
 * On open: top bar rotates 45°, middle bar fades out, bottom bar -45°
 * On closed: all three bars return to horizontal ===
 *
 * Extracted from Header.tsx for reusability.
 * Pure presentational — receives isOpen + onClick as props.
 */

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function HamburgerButton({ isOpen, onClick }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-11 h-11 rounded-xl
        hover:bg-white/[0.04] text-surface-400 hover:text-gold-400
        transition-all duration-200 active:scale-90 group"
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      <div className="flex flex-col items-center justify-center w-5 h-5 gap-[3px]">
        {/* Top bar — rotates 45° down-right when open */}
        <span
          className={`block w-5 h-px bg-current transition-all duration-300 ease-in-out origin-center ${
            isOpen ? "rotate-45 translate-y-[3.5px]" : ""
          }`}
        />
        {/* Middle bar — fades and shrinks when open */}
        <span
          className={`block w-5 h-px bg-current transition-all duration-200 ease-in-out ${
            isOpen ? "opacity-0 scale-x-0" : ""
          }`}
        />
        {/* Bottom bar — rotates -45° up-right when open */}
        <span
          className={`block w-5 h-px bg-current transition-all duration-300 ease-in-out origin-center ${
            isOpen ? "-rotate-45 -translate-y-[3.5px]" : ""
          }`}
        />
      </div>
    </button>
  );
}
