/* ── Hazard Timeline Footer ────────────────────────────────────
 * Summary bar at the bottom of HazardTimeline showing
 * concentration count, altitude breakdown, and urgent alert.
 * ─────────────────────────────────────────────────────────────── */

import type { HazardZone } from "@/types/hazard-zones";

interface Props {
  hazards: HazardZone[];
  concentrationCount: number;
  urgentCount: number;
}

export function HazardTimelineFooter({ hazards, concentrationCount, urgentCount }: Props) {
  return (
    <div className="border-t border-surface-700/40 px-4 py-1.5 bg-gradient-to-r from-surface-800/30 to-transparent">
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 text-[8px] text-surface-600">
        <span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-500 mr-1" />
          Conc.: {concentrationCount}
        </span>
        <span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-mage-400 mr-1" />
          GND: {hazards.filter((h) => h.altitude === "ground").length}
        </span>
        <span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-rogue-400 mr-1" />
          Air: {hazards.filter((h) => h.altitude === "aerial").length}
        </span>
        {urgentCount > 0 && (
          <span className="text-warrior-500 font-semibold">
            ⚠ {urgentCount} urgent
          </span>
        )}
      </div>
    </div>
  );
}
