/**
 * STᚱ VTT — Player List Grid
 *
 * Responsive grid layout for player character cards.
 */

import type { ReactNode } from "react";

interface PlayerListGridProps {
  children: ReactNode;
}

export default function PlayerListGrid({ children }: PlayerListGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {children}
    </div>
  );
}
