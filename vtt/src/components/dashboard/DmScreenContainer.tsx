/**
 * STᚱ VTT — DM Screen Container (Lusion-Grade Premium)
 *
 * A premium layout container that emulates a physical DM screen.
 * Multi-layered cinematic depth with:
 * - Table surface glow at bottom
 * - DM screen "hood" at top
 * - Bookend depth shadows on sides
 * - Ambient gold particle pockets
 * - Staggered entrance animation container
 *
 * The result feels like a physical DM screen sitting on a game table,
 * with depth layers suggesting the screen frame, table, and ambient light.
 */

import type { ReactNode } from "react";

interface DmScreenContainerProps {
  children: ReactNode;
}

export default function DmScreenContainer({ children }: DmScreenContainerProps) {
  return (
    <div className="relative min-h-full">
      {/* ── Layer 1: Deep void ambient glow ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold-500/[0.005] to-transparent pointer-events-none" />

      {/* ── Layer 2: Table surface glow ── */}
      <div className="absolute bottom-0 left-[15%] right-[15%] h-48 bg-gradient-to-t from-gold-500/[0.025] via-gold-500/[0.01] to-transparent pointer-events-none" />

      {/* ── Layer 3: Secondary gold pocket (upper left) ── */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-gold-500/[0.015] rounded-full blur-[100px] pointer-events-none" />

      {/* ── Layer 4: Secondary gold pocket (lower right) ── */}
      <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-500/[0.01] rounded-full blur-[80px] pointer-events-none" />

      {/* ── Layer 5: DM Screen "hood" — suggests a physical screen rim ── */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-obsidian/60 via-obsidian/20 to-transparent pointer-events-none" />

      {/* ── Layer 6: Bookend depth shadows ── */}
      <div className="absolute top-24 bottom-24 left-0 w-6 bg-gradient-to-r from-obsidian/40 via-obsidian/10 to-transparent pointer-events-none" />
      <div className="absolute top-24 bottom-24 right-0 w-6 bg-gradient-to-l from-obsidian/40 via-obsidian/10 to-transparent pointer-events-none" />

      {/* ── Layer 7: Content ── */}
      <div
        className="relative z-10 max-w-6xl mx-auto"
        style={{ padding: "1rem 1.5rem" }}
      >
        {children}
      </div>
    </div>
  );
}
