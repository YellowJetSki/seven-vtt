/**
 * STᚱ VTT — DM Screen Container
 *
 * A premium layout container that emulates a physical DM screen.
 * Multi-panel, staggered entrance animations, gold-accented depth.
 *
 * The DM screen has a "hood" effect — a slight top gradient suggesting
 * a physical screen frame, with panels that feel like they're resting
 * on a game table surface.
 */

import type { ReactNode } from "react";

interface DmScreenContainerProps {
  children: ReactNode;
}

export default function DmScreenContainer({ children }: DmScreenContainerProps) {
  return (
    <div className="relative min-h-full">
      {/* Ambient table surface glow */}
      <div className="absolute bottom-0 left-1/3 right-1/3 h-40 bg-gradient-to-t from-gold-500/[0.015] to-transparent pointer-events-none" />

      {/* DM Screen "hood" — subtle dark gradient suggesting a physical screen rim */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-obsidian/50 to-transparent pointer-events-none" />

      {/* Depth shadow on the sides — like bookends */}
      <div className="absolute top-20 bottom-20 left-0 w-4 bg-gradient-to-r from-obsidian/30 to-transparent pointer-events-none" />
      <div className="absolute top-20 bottom-20 right-0 w-4 bg-gradient-to-l from-obsidian/30 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto space-y-4 sm:space-y-5 px-4 py-4 sm:px-6">
        {children}
      </div>
    </div>
  );
}
