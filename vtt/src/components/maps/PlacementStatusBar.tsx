interface PlacementStatusBarProps {
  placementMode: "none" | "light" | "wall" | "door";
  wallStart: { x: number; y: number } | null;
}

export default function PlacementStatusBar({ placementMode, wallStart }: PlacementStatusBarProps) {
  if (placementMode === "none") return null;

  const messages: Record<string, string> = {
    light: "Click on the map to place the light source at that grid cell.",
    wall: wallStart ? "Now click the second cell to place a wall segment." : "Click first grid cell, then click a second cell to place a wall segment between them.",
    door: wallStart ? "Now click the second cell for the door." : "Click first grid cell to place a door between two cells.",
  };

  return (
    <div className="mt-2 px-3 py-2 rounded-lg bg-gold-500/8 border border-gold/20 text-xs text-gold-400 flex items-center gap-2 flex-shrink-0">
      <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse-soft" />
      {messages[placementMode]}
    </div>
  );
}
