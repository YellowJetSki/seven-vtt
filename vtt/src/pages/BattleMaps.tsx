import { useState, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import CanvasMapView from "@/components/maps/CanvasMapView";
import LightingControls from "@/components/maps/LightingControls";
import WallEditor from "@/components/maps/WallEditor";
import MapSelector from "@/components/maps/MapSelector";
import MapToolbar from "@/components/maps/MapToolbar";
import PlacementStatusBar from "@/components/maps/PlacementStatusBar";
import EmptyState from "@/components/ui/EmptyState";
import { useCampaignStore } from "@/stores/campaignStore";
import type { BattleMap, LightSource, WallSegment } from "@/types";

export default function BattleMapsPage() {
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const mapTokens = useCampaignStore((s) => s.mapTokens);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [lights, setLights] = useState<LightSource[]>([]);
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [placementMode, setPlacementMode] = useState<"none" | "light" | "wall" | "door">("none");
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);

  const selectedMap = battleMaps.find((m) => m.id === selectedMapId) ?? null;
  const tokens = selectedMapId ? (mapTokens[selectedMapId] ?? []) : [];

  const handleSelect = useCallback((map: BattleMap) => { setSelectedMapId(map.id); setLights([]); setWalls([]); }, []);
  const handleAddLight = useCallback((l: LightSource) => setLights((p) => [...p, l]), []);
  const handleRemoveLight = useCallback((id: string) => setLights((p) => p.filter((x) => x.id !== id)), []);
  const handleAddWall = useCallback((w: WallSegment) => setWalls((p) => [...p, w]), []);
  const handleRemoveWall = useCallback((id: string) => setWalls((p) => p.filter((x) => x.id !== id)), []);

  const handleToggleDoorState = useCallback((id: string, state: "open" | "closed" | "locked") => {
    setWalls((prev) => prev.map((w) => (w.id === id ? { ...w, doorState: state } : w)));
  }, []);

  const handleCellClick = useCallback((gridX: number, gridY: number) => {
    const gs = selectedMap?.gridSize ?? 50;
    if (placementMode === "light") {
      const last = lights[lights.length - 1];
      if (last) {
        setLights((p) => {
          const u = [...p];
          u[u.length - 1] = { ...last, x: gridX * gs + gs / 2, y: gridY * gs + gs / 2 };
          return u;
        });
      }
      setPlacementMode("none");
      return;
    }
    if (placementMode === "wall" || placementMode === "door") {
      if (!wallStart) { setWallStart({ x: gridX, y: gridY }); return; }
      const id = `wall_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      handleAddWall({
        id, x1: wallStart.x * gs, y1: wallStart.y * gs, x2: gridX * gs, y2: gridY * gs,
        blocksVision: true, blocksMovement: placementMode === "wall", blocksLight: placementMode !== "door", isDoor: placementMode === "door", isWindow: false, doorState: placementMode === "door" ? "closed" : undefined,
      });
      setWallStart(null);
      setPlacementMode("none");
    }
  }, [placementMode, wallStart, selectedMap, lights, handleAddWall]);

  if (battleMaps.length === 0) {
    return (
      <AppShell>
        <EmptyState
          icon="🗺"
          title="No Battle Maps Yet"
          description="Create your first battle map to start using the Canvas-based rendering engine with dynamic lighting, fog of war, and wall-based line-of-sight."
        />
      </AppShell>
    );
  }

  if (!selectedMap) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gradient-arcane">Battle Maps</h1>
            <div className="h-px flex-1 bg-gradient-to-r from-accent-500/20 to-transparent" />
          </div>
          <div className="animate-slide-in-up">
            <MapSelector maps={battleMaps} onSelect={handleSelect} />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <MapToolbar
          placementMode={placementMode}
          mapName={selectedMap.name}
          onBack={() => setSelectedMapId(null)}
          onSetPlacementMode={(m) => { setPlacementMode(m); setWallStart(null); }}
        />
        <div className="flex gap-4 flex-1 min-h-0 mt-4">
          <div className="flex-1 min-w-0 rounded-xl overflow-hidden border border-surface-700/20 premium-surface p-0.5">
            <CanvasMapView
              mapData={selectedMap}
              tokens={tokens}
              lights={lights}
              walls={walls}
              dmView={true}
              onCellClick={handleCellClick}
              onTokenClick={(t) => console.log("Token:", t)}
            />
          </div>
          <div className="w-64 flex-shrink-0 space-y-4 overflow-y-auto">
            <LightingControls lights={lights} onAddLight={handleAddLight} onRemoveLight={handleRemoveLight} />
            <WallEditor walls={walls} onAddWall={handleAddWall} onRemoveWall={handleRemoveWall} onToggleDoorState={handleToggleDoorState} />
          </div>
        </div>
        <PlacementStatusBar placementMode={placementMode} wallStart={wallStart} />
      </div>
    </AppShell>
  );
}
