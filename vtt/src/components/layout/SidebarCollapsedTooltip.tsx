/**
 * STᚱ VTT — Sidebar Collapsed Tooltip (Premium)
 *
 * Premium tooltip that appears when hovering over a collapsed nav item.
 * Shows the nav label with gold glass styling, positioned to the right
 * of the icon. Only visible when sidebar is collapsed (isOpen === false).
 *
 * Features:
 *   - Arrow pointer on the left edge connecting to the icon
 *   - Gold glass background with backdrop blur
 *   - Smooth fade-in/out with 100ms delay for unintentional hovers
 *   - Matches the premium design system
 *
 * Architecture:
 *   ┌─────────────────────┐
 *   │ ◄ Dashboard         │  ← Tooltip with arrow pointing to icon
 *   └──│──────────────────┘
 *       ▼
 *      [📊]  ← Nav icon
 *
 * Cycle 1 (Premium UI/UX Phase):
 *   - Eliminates confusion when sidebar is collapsed
 *   - Premium gold-accented design
 */

interface SidebarCollapsedTooltipProps {
  label: string;
}

export default function SidebarCollapsedTooltip({ label }: SidebarCollapsedTooltipProps) {
  return (
    <div
      className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
      style={{
        opacity: 0,
        transition: "opacity 0.15s ease-in-out 0.1s",
      }}
      // The parent group handles visibility via group-hover
    >
      <div
        className="flex items-center py-1.5 px-2.5 rounded-lg whitespace-nowrap"
        style={{
          background: "rgba(20, 21, 31, 0.92)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(234, 179, 8, 0.12)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(234, 179, 8, 0.04)",
        }}
      >
        {/* Arrow indicator */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[5px] w-2 h-2 rotate-45"
          style={{
            background: "rgba(20, 21, 31, 0.92)",
            borderLeft: "1px solid rgba(234, 179, 8, 0.12)",
            borderBottom: "1px solid rgba(234, 179, 8, 0.12)",
          }}
        />
        <span className="text-[11px] font-semibold text-gold-400 whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
}
