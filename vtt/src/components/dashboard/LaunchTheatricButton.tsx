/**
 * STᚱ VTT — Launch Theatric Display Button
 *
 * Opens the cinematic Theatric View in a new browser tab/window.
 * The new tab auto-syncs via Firebase, showing a pure canvas display
 * with no grid, no HUD, no UI elements.
 *
 * Architecture:
 *   1. Sets the active map ID in theatricStore
 *   2. Opens a new tab at /theatric?map=<activeMapId>
 *   3. The new tab reads from Firestore via onSnapshot
 *
 * Designed for the DM dashboard Quick Actions bar.
 */

import { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import { useCampaignStore } from "@/stores/campaignStore";
import { useTheatricStore } from "@/stores/theatricStore";

export default function LaunchTheatricButton() {
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const setActiveMap = useTheatricStore((s) => s.setActiveMap);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = useCallback(() => {
    if (battleMaps.length === 0) return;

    setIsLaunching(true);

    // Use the first available map, or let the DM select
    const targetMap = battleMaps[0];
    setActiveMap(targetMap.id);

    // Open theatric display in a new tab
    const url = `${window.location.origin}/theatric?map=${targetMap.id}`;
    window.open(url, "st-theatric-display", "noopener,noreferrer");

    // Reset launch state after a moment
    setTimeout(() => setIsLaunching(false), 1000);
  }, [battleMaps, setActiveMap]);

  if (battleMaps.length === 0) {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled
        title="Create a battle map first"
      >
        🎬 Launch Theatric
      </Button>
    );
  }

  return (
    <Button
      variant="arcane"
      size="sm"
      onClick={handleLaunch}
      isLoading={isLaunching}
      className="hover-lift relative group"
    >
      <span className="mr-1">🎬</span>
      <span>Launch Theatric</span>
      <span className="ml-1 text-accent-500/50 group-hover:text-accent-300 transition-colors">↗</span>
    </Button>
  );
}
