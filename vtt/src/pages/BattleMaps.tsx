/**
 * STᚱ VTT — Battle Maps (DM Control Center)
 *
 * The DM's primary battle map command center.
 * Integrates CanvasMapView with DM tools, token inspector,
 * initiative tracker, and encounter population.
 *
 * All state changes sync to the Theatric Display via shared stores.
 */

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import DmControlCenter from "@/components/control-center/DmControlCenter";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { useCampaignStore } from "@/stores/campaignStore";

export default function BattleMaps() {
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const [showControlCenter, setShowControlCenter] = useState(battleMaps.length > 0);

  useEffect(() => {
    if (battleMaps.length > 0) {
      setShowControlCenter(true);
    }
  }, [battleMaps.length]);

  if (!showControlCenter || battleMaps.length === 0) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="glass-crystal rounded-2xl p-6">
            <h1 className="text-2xl font-black text-gradient-arcane">Battle Maps</h1>
            <p className="text-surface-400 text-sm mt-1">Tactical command center for your encounters</p>
            <div className="rune-divider mt-2">✦ ✦ ✦</div>
          </div>
          <EmptyState
            icon="🗺"
            title="No Battle Maps"
            description="Create your first tactical map to unlock the DM Control Center."
          >
            <Button variant="arcane" size="lg" className="mt-4">✦ Create Map</Button>
          </EmptyState>
        </div>
      </AppShell>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface-950">
      {/* Full-control DM layout - no AppShell wrapper (uses its own sidebar) */}
      <DmControlCenter />
    </div>
  );
}
