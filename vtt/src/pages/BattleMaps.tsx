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
          <div className="glass-gold rounded-2xl p-6 relative overflow-hidden">
            <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
            <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
            <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
            <div className="corner-ornament corner-br corner-gold corner-gold-glow" />
            <div className="depth-ring absolute inset-0 opacity-20" />
            <div className="relative z-10">
              <h1 className="text-2xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
                Battle Maps
              </h1>
              <p className="text-surface-400 text-sm mt-1">Tactical command center for your encounters</p>
              <div className="rune-gold mt-3 w-full max-w-md">✦ ✦ ✦</div>
            </div>
          </div>
          <EmptyState
            icon="🗺"
            title="No Battle Maps"
            description="Create your first tactical map to unlock the DM Control Center."
          >
            <Button variant="gold" size="lg" className="mt-4">✦ Create Map</Button>
          </EmptyState>
        </div>
      </AppShell>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-obsidian">
      <DmControlCenter />
    </div>
  );
}
