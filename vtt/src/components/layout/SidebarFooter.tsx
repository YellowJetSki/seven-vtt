/**
 * STᚱ VTT — SidebarFooter
 *
 * Premium footer anchor for the sidebar with:
 * - Gradient dividers flanking the rune
 * - "Premium VTT" label
 * - Responsive: only renders when sidebar is open
 */

interface SidebarFooterProps {
  isOpen: boolean;
}

export default function SidebarFooter({ isOpen }: SidebarFooterProps) {
  if (!isOpen) return null;

  return (
    <div className="shrink-0 border-t border-white/[0.04] px-4 py-3">
      {/* Divider + Rune + Divider */}
      <div className="flex items-center gap-2 text-[7px] text-gold-500/25 uppercase tracking-[0.15em] justify-center">
        <span className="w-6 h-px bg-gradient-to-r from-transparent to-gold-500/15" />
        <span className="font-mono">✦ ᚱ ✦</span>
        <span className="w-6 h-px bg-gradient-to-l from-transparent to-gold-500/15" />
      </div>

      <p className="text-[8px] text-surface-700 text-center mt-1.5 uppercase tracking-[0.12em] font-medium">
        Premium VTT
      </p>
    </div>
  );
}
