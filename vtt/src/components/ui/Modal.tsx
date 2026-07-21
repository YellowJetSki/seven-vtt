/**
 * STᚱ VTT — Premium Modal (Lusion/Ventriloc-Grade)
 *
 * Multi-depth glass modal with:
 * - 3-layer depth: backdrop → overlay glow → glass card with gold edge
 * - Staggered entrance animation (overlay → card → header → content)
 * - Premium close button with rotate and X-morph animation
 * - Rune ornament corners with gold ambient gradient
 * - Optional size modes (sm/md/lg/xl/full)
 * - Scrollable content with gold scrollbar
 * - Escape key + backdrop click dismissal
 * - Body scroll lock during open
 */

import { type ReactNode, useEffect, useCallback, useState } from "react";

// ── Types ──────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Show gold corner rune ornaments */
  showOrnaments?: boolean;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Custom header action element (right side, next to close) */
  headerAction?: ReactNode;
}

const sizeStyles: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-3xl",
};

// ── Sub-Component: Modal Backdrop ────────────────────────────
function ModalBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 animate-slide-in-fade"
      onClick={onClose}
    >
      {/* Layer 1: Deep base blur */}
      <div className="absolute inset-0 bg-[#05060a]/90 backdrop-blur-sm" />
      {/* Layer 2: Ambient gold glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gold-500/[0.015] blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-amber-500/[0.01] blur-[60px]" />
      </div>
    </div>
  );
}

// ── Sub-Component: Modal Close Button ────────────────────────
function ModalCloseButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="
        relative p-1.5 rounded-xl
        bg-white/[0.02] hover:bg-gold-500/10
        border border-transparent hover:border-gold-500/20
        text-surface-400 hover:text-gold-400
        transition-all duration-200 ease-out
        active:scale-90 active:bg-gold-500/15
        group
      "
      aria-label="Close modal"
    >
      {/* Hover glow ring */}
      {hovered && (
        <div className="absolute inset-0 rounded-xl bg-gold-500/5 blur-[8px]" />
      )}

      <svg
        className="w-4 h-4 relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-90"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {hovered ? (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        ) : (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        )}
      </svg>
    </button>
  );
}

// ── Sub-Component: Modal Rune Ornaments ──────────────────────
function ModalOrnaments() {
  return (
    <>
      {(["top-0 left-0 rotate-0", "top-0 right-0 rotate-90", "bottom-0 left-0 -rotate-90", "bottom-0 right-0 rotate-180"] as const).map(
        (pos, i) => (
          <div
            key={i}
            className={`absolute ${pos} w-8 h-8 pointer-events-none`}
          >
            <div className="w-full h-full opacity-40">
              <svg viewBox="0 0 32 32" fill="none">
                <path
                  d="M0 0h8v2H2v6H0V0z"
                  fill="rgba(234,179,8,0.15)"
                />
                <path
                  d="M2 2h4v4H2V2z"
                  fill="rgba(234,179,8,0.08)"
                />
              </svg>
            </div>
          </div>
        )
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showOrnaments = true,
  subtitle,
  headerAction,
}: ModalProps) {
  // ── Keyboard handler ──────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // ── Body scroll lock + event listener ─────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ height: '100dvh' }}>
      {/* ── Backdrop ── */}
      <ModalBackdrop onClose={onClose} />

      {/* ── Modal Card ── */}
      <div
        className={`relative w-full ${sizeStyles[size]} animate-scale-in`}
        style={{ animation: "modal-card-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        {/* Outer glow halo */}
        <div className="absolute -inset-4 rounded-3xl bg-gold-500/[0.02] blur-[40px] pointer-events-none" />

        {/* Glass card body */}
        <div
          className="glass-premium rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-gold/15 relative"
          style={{
            animation: "modal-content-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both",
          }}
        >
          {/* Gold edge light (top) */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

          {/* Corner ornaments */}
          {showOrnaments && <ModalOrnaments />}

          {/* Ambient gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gold-500/[0.015] to-transparent pointer-events-none" />

          {/* ── Header ── */}
          <div
            className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-gold/10 bg-gradient-to-r from-[#14151f]/60 to-[#0f101a]/60"
            style={{
              animation: "modal-content-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
            }}
          >
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black text-gold truncate drop-shadow-[0_0_8px_rgba(234,179,8,0.08)]">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[10px] text-surface-500 uppercase tracking-[0.12em] font-medium mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 ml-3 shrink-0">
              {headerAction}
              <ModalCloseButton onClick={onClose} />
            </div>
          </div>

          {/* ── Content ── */}
          <div
            className="relative z-10 px-5 py-5 max-h-[65vh] overflow-y-auto scrollbar-gold"
            style={{
              animation: "modal-content-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
