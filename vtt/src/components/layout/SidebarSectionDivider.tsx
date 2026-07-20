/**
 * STᚱ VTT — Sidebar Section Divider (Premium)
 *
 * Visual section divider for sidebar navigation groups.
 * Renders a subtle label + gradient line when sidebar is open,
 * and a minimal dot when collapsed.
 *
 * Inspiration: Ventriloc sidebar spacing — grouped by function
 * rather than a flat list, reducing cognitive load.
 *
 * Features:
 *   - Open state: gold gradient line + uppercase label text
 *   - Collapsed state: minimal dot indicator (w-1 h-1)
 *   - Both states have consistent spacing for the 44px grid
 *   - Smooth cross-fade transition between states
 */

interface SidebarSectionDividerProps {
  label: string;
  isOpen: boolean;
}

export default function SidebarSectionDivider({ label, isOpen }: SidebarSectionDividerProps) {
  return (
    <div
      className="flex items-center select-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{
        height: isOpen ? "28px" : "12px",
        paddingLeft: isOpen ? "0.75rem" : "0",
        justifyContent: isOpen ? "flex-start" : "center",
      }}
    >
      {isOpen ? (
        /* ── OPEN STATE: Gradient line + Label ── */
        <div className="flex items-center gap-2 w-full">
          <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-surface-600 whitespace-nowrap">
            {label}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-white/[0.04] to-transparent" />
        </div>
      ) : (
        /* ── COLLAPSED STATE: Minimal dot ── */
        <div className="w-0.5 h-0.5 rounded-full bg-gold-500/30" />
      )}
    </div>
  );
}
