/**
 * STᚱ VTT — SidebarNavLink
 *
 * Reusable nav link for the sidebar with:
 * - Active state: gold pill indicator, gold background glow, subtle gold border
 * - Inactive: gold-tinted hover gradient glow + border reveal
 * - Icon scales 1.1x on hover (group)
 * - Press feedback with active:scale-[0.97]
 * - Accepts icon + label as props
 * - Handles collapsed mode by centering icon, hiding label
 */

import { NavLink } from "react-router-dom";

interface SidebarNavLinkProps {
  path: string;
  label: string;
  icon: string;
  isOpen: boolean;
}

export default function SidebarNavLink({ path, label, icon, isOpen }: SidebarNavLinkProps) {
  return (
    <NavLink
      to={path}
      className={({ isActive: active }) =>
        `relative flex items-center min-h-[44px] rounded-xl transition-all duration-200 active:scale-[0.97] group ${
          isOpen ? "gap-3" : "gap-0 justify-center"
        } ${
          active
            ? "bg-gradient-to-r from-gold-500/10 to-gold-500/5 text-gold-400 shadow-[inset_0_1px_0_rgba(255,215,0,0.04)]"
            : "text-surface-500 hover:text-surface-200"
        }`
      }
      style={{ padding: isOpen ? "0.625rem 0.75rem" : "0.625rem 0" }}
    >
      {({ isActive }) => (
        <>
          {/* Active pill indicator — left-aligned */}
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-200 ${
              isActive
                ? "w-1 h-6 rounded-r-full bg-gold-500 shadow-[0_0_6px_rgba(234,179,8,0.3)]"
                : "w-0 h-0"
            }`}
          />

          {/* Hover background glow (non-active only) */}
          <div
            className={`absolute inset-0 rounded-xl transition-all duration-200 ${
              isActive
                ? "opacity-0"
                : "opacity-0 group-hover:opacity-100 bg-gradient-to-r from-gold-500/[0.03] to-transparent"
            }`}
          />

          {/* Hover border glow (non-active only) */}
          <div
            className={`absolute inset-x-1 top-0 bottom-0 rounded-[10px] transition-all duration-200 border pointer-events-none ${
              isActive
                ? "border-gold-500/8"
                : "border-transparent group-hover:border-white/[0.04]"
            }`}
          />

          {/* Icon */}
          <span className="relative z-10 text-lg flex-shrink-0 leading-none transition-transform duration-200 group-hover:scale-110">
            {icon}
          </span>

          {/* Label — only shown when sidebar is open */}
          {isOpen && (
            <span
              className={`relative z-10 text-sm font-semibold whitespace-nowrap tracking-wide truncate transition-colors duration-200 ${
                isActive ? "text-gold-400" : ""
              }`}
            >
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
