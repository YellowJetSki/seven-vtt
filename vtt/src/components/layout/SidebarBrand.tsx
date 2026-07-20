/**
 * STᚱ VTT — SidebarBrand
 *
 * Premium sidebar brand bar with:
 * - Ambient gold glow pocket behind the rune
 * - Smooth text fade on collapse
 * - Gold accent divider at bottom
 * - Responsive height (h-14 mobile, h-16 desktop)
 */

interface SidebarBrandProps {
  isOpen: boolean;
}

export default function SidebarBrand({ isOpen }: SidebarBrandProps) {
  return (
    <div className="flex items-center gap-3 px-4 h-14 sm:h-16 shrink-0 relative border-b border-white/[0.04]">
      {/* Gold accent strip at bottom */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

      {/* Ambient glow pocket behind rune */}
      <div
        className={`absolute transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none ${
          isOpen
            ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10"
            : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9"
        } bg-gold-500/5 rounded-full blur-[12px]`}
      />

      {/* Rune icon — always visible */}
      <span
        className={`font-serif select-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen
            ? "text-xl text-gold-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.25)]"
            : "text-xl text-gold-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.2)] mx-auto"
        }`}
        aria-hidden="true"
      >
        ᚱ
      </span>

      {/* Brand name — slides out on collapse */}
      <span
        className={`font-black text-gold text-base sm:text-lg tracking-tight whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-4 absolute pointer-events-none"
        }`}
      >
        STᚱ VTT
      </span>
    </div>
  );
}
