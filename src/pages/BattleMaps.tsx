import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { BattleMap, MapToken } from "@/types";

const TOKEN_TYPE_LABELS: Record<MapToken["type"], string> = {
  player: "PC",
  enemy: "Enemy",
  npc: "NPC",
  custom: "Custom",
};

export function BattleMaps() {
  const maps = useCampaignStore((s) => s.campaign?.battleMaps ?? []);

  const [selectedMap, setSelectedMap] = useState<BattleMap | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMaps = useMemo(() => {
    if (!searchQuery.trim()) return maps;
    const q = searchQuery.toLowerCase();
    return maps.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.notes && m.notes.toLowerCase().includes(q)),
    );
  }, [maps, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">
            Battle Maps
          </h2>
          <p className="mt-1 text-sm text-surface-400">
            {maps.length} map{maps.length !== 1 ? "s" : ""} · Deploy tactical encounters
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            Secondary Display
          </Button>
          <Button size="sm">+ New Map</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">
          🔍
        </span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search maps..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
        />
      </div>

      {/* Map Grid */}
      {filteredMaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-700 bg-surface-850 py-16">
          <span className="text-4xl text-surface-600">
            {searchQuery ? "🔍" : "🗺"}
          </span>
          <p className="mt-3 text-sm text-surface-500">
            {searchQuery
              ? `No maps matching "${searchQuery}".`
              : "No battle maps yet. Create a map for your next encounter!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaps.map((map) => (
            <button
              key={map.id}
              onClick={() => setSelectedMap(map)}
              className="group relative overflow-hidden rounded-xl border border-surface-700 bg-surface-850 text-left transition-all hover:border-surface-600 hover:bg-surface-800 focus-visible:outline-2 focus-visible:outline-accent-500"
            >
              {/* Mini Preview Grid */}
              <div className="aspect-video bg-surface-800 p-2">
                <div className="relative h-full w-full">
                  <div
                    className="absolute inset-0 gap-px opacity-20"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${Math.min(map.gridWidth, 8)}, 1fr)`,
                      gridTemplateRows: `repeat(${Math.min(map.gridHeight, 6)}, 1fr)`,
                    }}
                  >
                    {Array.from({
                      length: Math.min(map.gridWidth * map.gridHeight, 48),
                    }).map((_, i) => (
                      <div key={i} className="bg-surface-500 rounded-sm" />
                    ))}
                  </div>
                  <div className="absolute inset-0 p-1">
                    {map.tokens.slice(0, 8).map((token) => (
                      <div
                        key={token.id}
                        className="absolute h-3 w-3 rounded-full border border-white/30"
                        style={{
                          left: `${(token.x / map.gridWidth) * 100}%`,
                          top: `${(token.y / map.gridHeight) * 100}%`,
                          backgroundColor: token.color || "#8b30ff",
                        }}
                        title={token.label}
                      />
                    ))}
                    {map.tokens.length > 8 && (
                      <span className="absolute bottom-1 right-1 rounded bg-surface-900/80 px-1.5 py-0.5 text-[10px] text-surface-400">
                        +{map.tokens.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3">
                <h3 className="font-semibold text-surface-100 group-hover:text-accent-300 transition-colors">
                  {map.name}
                </h3>
                <div className="flex gap-2 mt-1.5">
                  <Badge size="xs" variant="neutral">
                    {map.gridWidth}×{map.gridHeight}
                  </Badge>
                  <Badge size="xs" variant="neutral">
                    {map.tokens.length} token{map.tokens.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map Detail Modal */}
      {selectedMap && (
        <Modal
          modalId="map-detail"
          title={selectedMap.name}
          size="xl"
        >
          <MapDetail map={selectedMap} />
        </Modal>
      )}
    </div>
  );
}

/* ── Map Detail (Interactive Grid Preview) ──────────────────── */

function MapDetail({ map }: { map: BattleMap }) {
  const { gridWidth, gridHeight, tokens } = map;
  const previewWidth = Math.min(gridWidth * 12, 600);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
        <div
          className="relative mx-auto"
          style={{
            width: `${previewWidth}px`,
            maxWidth: "100%",
            aspectRatio: `${gridWidth}/${gridHeight}`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
              gridTemplateRows: `repeat(${gridHeight}, 1fr)`,
              gap: "1px",
            }}
          >
            {Array.from({ length: gridWidth * gridHeight }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-800 transition-colors hover:bg-surface-700"
                style={{ aspectRatio: "1" }}
              />
            ))}
          </div>

          {tokens.map((token) => (
            <div
              key={token.id}
              className="absolute flex items-center justify-center rounded-full border-2 border-white/40 text-[10px] font-bold text-white shadow-lg"
              style={{
                left: `${(token.x / gridWidth) * 100}%`,
                top: `${(token.y / gridHeight) * 100}%`,
                width: `${(token.size / gridWidth) * 100}%`,
                height: `${(token.size / gridHeight) * 100}%`,
                backgroundColor: token.color || "#8b30ff",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
              title={token.label}
            >
              {token.type === "player" ? "⚔" : token.type === "enemy" ? "💀" : token.type === "npc" ? "👤" : "?"}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-surface-800 p-3 text-center">
          <p className="text-xs text-surface-500">Dimensions</p>
          <p className="text-lg font-bold text-surface-100">{gridWidth}×{gridHeight}</p>
        </div>
        <div className="rounded-lg bg-surface-800 p-3 text-center">
          <p className="text-xs text-surface-500">Tokens</p>
          <p className="text-lg font-bold text-surface-100">{tokens.length}</p>
        </div>
        <div className="rounded-lg bg-surface-800 p-3 text-center">
          <p className="text-xs text-surface-500">Grid Size</p>
          <p className="text-lg font-bold text-surface-100">{map.gridSize}px</p>
        </div>
      </div>

      {tokens.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
            Tokens
          </h4>
          <div className="space-y-1.5">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center gap-3 rounded-lg bg-surface-800 px-3 py-2"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: token.color || "#8b30ff" }}
                />
                <span className="text-sm text-surface-200 flex-1">{token.label}</span>
                <Badge size="xs" variant="neutral">{TOKEN_TYPE_LABELS[token.type]}</Badge>
                <span className="text-xs text-surface-500">
                  ({token.x}, {token.y})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {map.notes && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
            DM Notes
          </h4>
          <p className="text-sm text-surface-400 leading-relaxed whitespace-pre-wrap">
            {map.notes}
          </p>
        </div>
      )}
    </div>
  );
}
