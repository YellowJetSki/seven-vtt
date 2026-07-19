/**
 * STᚱ VTT — Launch Theatric Display Button (Premium Gold)
 *
 * Gold-accented button that opens the cinematic Theatric View
 * in a new browser tab. All changes sync in real-time.
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
    const targetMap = battleMaps[0];
    setActiveMap(targetMap.id);
    const url = `${window.location.origin}/theatric?map=${targetMap.id}`;
    window.open(url, "st-theatric-display", "noopener,noreferrer");
    setTimeout(() => setIsLaunching(false), 1000);
  }, [battleMaps, setActiveMap]);

  if (battleMaps.length === 0) {
    return (
      <Button variant="secondary" size="sm" disabled title="Create a battle map first">
        🎬 Launch Theatric
      </Button>
    );
  }

  return (
    <Button
      variant="gold"
      size="sm"
      onClick={handleLaunch}
      isLoading={isLaunching}
      className="hover-lift relative group"
    >
      <span className="mr-1">🎬</span>
      <span>Launch Theatric</span>
      <span className="ml-1 text-gold-500/50 group-hover:text-gold-300 transition-colors">↗</span>
    </Button>
  );
}
