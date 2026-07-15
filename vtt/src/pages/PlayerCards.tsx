/* ── Player Cards — Party Management ───────────────────────────
 * Full CRUD interface for player characters with grid/compendium
 * views, search, sort, character import/export, bulk export,
 * detail modals with quick ability view, and full inventory UI.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PartyCompendium } from "@/components/player/PartyCompendium";
import { CharacterForm } from "@/components/player/CharacterForm";
import { PlayerInventory } from "@/components/player/PlayerInventory";
import type { PlayerCharacter, Ability, EquipmentSlot } from "@/types";

type ViewMode = "grid" | "compendium";
type SortKey = "name" | "level" | "class" | "race";

const ABILITY_ORDER: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABILITY_SHORT: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

/* ── Helpers ────────────────────────────────────────────────── */

function getAbilityScore(char: PlayerCharacter, ability: Ability): number {
  return char[ability] ?? 10;
}

function formatCurrency(char: PlayerCharacter, type: "cp" | "sp" | "ep" | "gp" | "pp"): number {
  // Backward compat: support old flat currency fields
  const c = char.currency ?? (char as any);
  switch (type) {
    case "cp": return c.copper ?? 0;
    case "sp": return c.silver ?? 0;
    case "ep": return c.electrum ?? 0;
    case "gp": return c.gold ?? (char as any).gold ?? 0;
    case "pp": return c.platinum ?? 0;
  }
}

function totalGoldValue(char: PlayerCharacter): number {
  // Backward compat: support old flat currency fields
  const c = char.currency ?? (char as any);
  return (c.gold ?? (char as any).gold ?? 0)
    + Math.floor((c.silver ?? 0) / 10)
    + Math.floor((c.copper ?? 0) / 100)
    + (c.electrum ?? 0) * 0.5
    + (c.platinum ?? 0) * 10;
}

/** Export a single character as a downloadable JSON file */
function exportCharacter(char: PlayerCharacter): void {
  const blob = new Blob([JSON.stringify(char, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${char.name.replace(/\s+/g, "-").toLowerCase()}-character.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export all characters as a JSON bundle */
function exportAllCharacters(chars: PlayerCharacter[]): void {
  const blob = new Blob([JSON.stringify(chars, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `party-export-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PlayerCards() {
  const characters = useCampaignStore((s) => s.campaign?.playerCharacters ?? []);
  const addCharacter = useCampaignStore((s) => s.addCharacter);
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const removeCharacter = useCampaignStore((s) => s.removeCharacter);
  const showToast = useUiStore((s) => s.showToast);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCharacter, setSelectedCharacter] = useState<PlayerCharacter | null>(null);
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<PlayerCharacter | undefined>();
  const [showInventoryId, setShowInventoryId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteCharacter = (charId: string, charName: string) => {
    removeCharacter(charId);
    setDeleteConfirmId(null);
    showToast({ message: `"${charName}" removed from the campaign.`, type: "success" });
  };

  const filtered = useMemo(() => {
    let list = [...characters];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.class.toLowerCase().includes(q) ||
          c.race.toLowerCase().includes(q) ||
          c.playerName.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case "name": return a.name.localeCompare(b.name);
        case "level": return b.level - a.level;
        case "class": return a.class.localeCompare(b.class);
        case "race": return a.race.localeCompare(b.race);
        default: return 0;
      }
    });
    return list;
  }, [characters, searchQuery, sortKey]);

  const partyStats = useMemo(() => {
    if (characters.length === 0) return null;
    const avgLevel = Math.round(characters.reduce((a, c) => a + c.level, 0) / characters.length);
    const classes = [...new Set(characters.map((c) => c.class))];
    const races = [...new Set(characters.map((c) => c.race))];
    return { avgLevel, classes, races, count: characters.length };
  }, [characters]);

  const handleAddCharacter = () => { setEditingCharacter(undefined); setShowCharacterForm(true); };
  const handleEditCharacter = (char: PlayerCharacter) => {
    setSelectedCharacter(null);
    setEditingCharacter(char);
    setShowCharacterForm(true);
  };
  const openCharacterDetail = (char: PlayerCharacter) => { setSelectedCharacter(char); };

  const handleCharacterSubmit = (char: PlayerCharacter) => {
    const existing = characters.find((c) => c.id === char.id);
    if (existing) {
      updateCharacter(char.id, char);
      useUiStore.getState().showToast({ message: `"${char.name}" updated.`, type: "success" });
    } else {
      addCharacter(char);
      useUiStore.getState().showToast({ message: `"${char.name}" added to the campaign!`, type: "success" });
    }
    setShowCharacterForm(false);
    setEditingCharacter(undefined);
  };

  const handleImportCharacter = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as PlayerCharacter;
        if (!data.name || !data.class) {
          // If the file uses the old abilityScores/currency structure, convert it
          if ((data as any).abilityScores) {
            throw new Error("Old format detected — use the export from this app");
          }
          useUiStore.getState().showToast({ message: "Invalid character file: missing name/class.", type: "error" });
          return;
        }
        data.id = `pc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        data.createdAt = Date.now();
        data.updatedAt = Date.now();
        // Ensure flat ability scores exist
        if (!data.strength) data.strength = 10;
        if (!data.dexterity) data.dexterity = 10;
        if (!data.constitution) data.constitution = 10;
        if (!data.intelligence) data.intelligence = 10;
        if (!data.wisdom) data.wisdom = 10;
        if (!data.charisma) data.charisma = 10;
        // Ensure flat currency exists (backward compat)
        if (!data.currency) {
          data.currency = {
            copper: (data as any).copper ?? 0,
            silver: (data as any).silver ?? 0,
            electrum: (data as any).electrum ?? 0,
            gold: (data as any).gold ?? 0,
            platinum: (data as any).platinum ?? 0,
          };
        }
        addCharacter(data);
        useUiStore.getState().showToast({ message: `Imported "${data.name}"!`, type: "success" });
      } catch (err) {
        useUiStore.getState().showToast({ message: err instanceof Error ? err.message : "Failed to parse character file.", type: "error" });
      }
    };
    input.click();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Player Characters"
        subtitle={
          characters.length > 0
            ? `${characters.length} hero${characters.length !== 1 ? "es" : ""} registered in the campaign`
            : "No characters yet"
        }
        icon="⚔"
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex rounded-lg border border-surface-700 bg-surface-850 p-0.5">
              <button onClick={() => setViewMode("grid")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${viewMode === "grid" ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"}`}>Grid</button>
              <button onClick={() => setViewMode("compendium")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${viewMode === "compendium" ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"}`}>Compendium</button>
            </div>
            {characters.length > 0 && (
              <Button variant="ghost" size="xs" onClick={() => exportAllCharacters(characters)}>
                📦 Export All
              </Button>
            )}
            <Button variant="ghost" size="xs" onClick={handleImportCharacter}>📥 Import</Button>
            <Button size="sm" onClick={handleAddCharacter}>+ Add Character</Button>
          </div>
        }
      />

      {/* Party Stats Bar */}
      {partyStats && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-700 bg-surface-850 px-4 py-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rogue-500" />
            <span className="text-surface-400">Party: <span className="text-surface-200 font-medium">{partyStats.count} PCs</span></span>
          </div>
          <span className="text-surface-600">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-surface-400">Avg Level: <span className="text-surface-200 font-medium">{partyStats.avgLevel}</span></span>
          </div>
          <span className="text-surface-600">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-surface-400">Classes: <span className="text-surface-200 font-medium">{partyStats.classes.join(", ")}</span></span>
          </div>
          <span className="text-surface-600">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-surface-400">Races: <span className="text-surface-200 font-medium">{partyStats.races.join(", ")}</span></span>
          </div>
        </div>
      )}

      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, class, race, or player..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">✕</button>
          )}
        </div>
        <div className="flex gap-1 rounded-lg bg-surface-850 p-0.5">
          {(["name", "level", "class", "race"] as SortKey[]).map((key) => (
            <button key={key} onClick={() => setSortKey(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${sortKey === key ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"}`}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Character List */}
      {characters.length === 0 ? (
        <EmptyState
          icon="⚔"
          title="No player characters yet"
          description="Create or import your first character to start tracking stats, HP, and abilities."
          action={{ label: "Add Character", onClick: handleAddCharacter }}
          secondaryAction={{ label: "Import from File", onClick: handleImportCharacter }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No matches found"
          description={`No characters match "${searchQuery}". Try a different search term.`}
          action={searchQuery ? { label: "Clear Search", onClick: () => setSearchQuery("") } : undefined}
        />
      ) : viewMode === "compendium" ? (
        <PartyCompendium />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((char, idx) => (
            <div key={char.id}
              className={`group relative rounded-xl border border-surface-700/60 bg-surface-850/80 overflow-hidden transition-all hover:border-accent-500/30 hover:-translate-y-1 active:translate-y-0 cursor-pointer animate-slide-up stagger-${Math.min(idx + 1, 8)}`}
              style={{ animationDelay: `${Math.min(idx * 60, 420)}ms` }}
              onClick={() => openCharacterDetail(char)}
            >
              {/* Header with class color */}
              <div className="h-2 bg-gradient-to-r from-rogue-500/40 to-warrior-500/40" />
              <div className="p-4 space-y-3">
                {/* Name + Level */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-surface-100 truncate group-hover:text-accent-300 transition-colors">{char.name}</h3>
                    <p className="text-xs text-surface-400 mt-0.5">{char.race} {char.class}</p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rogue-500/15 text-xs font-bold text-rogue-400">
                    {char.level}
                  </div>
                </div>

                {/* HP Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-surface-400">HP</span>
                    <span className={`font-medium ${char.hitPoints.current <= 0 ? "text-warrior-400" : char.hitPoints.current <= char.hitPoints.max * 0.25 ? "text-warrior-500" : "text-surface-200"}`}>
                      {char.hitPoints.current}/{char.hitPoints.max}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      char.hitPoints.current <= 0 ? "bg-warrior-500" :
                      char.hitPoints.current <= char.hitPoints.max * 0.25 ? "bg-warrior-400" :
                      "bg-rogue-500"
                    }`} style={{ width: `${Math.max(0, (char.hitPoints.current / char.hitPoints.max) * 100)}%` }} />
                  </div>
                </div>

                {/* Equipment count + gold badge */}
                <div className="flex items-center gap-2 text-[10px] text-surface-500">
                  <span>🎒 {(char.equipment ?? []).length} items</span>
                  <span>·</span>
                  <span>🪙 {formatCurrency(char, "gp")} gp</span>
                </div>

                {/* Ability Scores Quick View */}
                <div className="grid grid-cols-6 gap-1">
                  {ABILITY_ORDER.map((ability) => (
                    <div key={ability} className="text-center rounded bg-surface-800 py-1">
                      <p className="text-[9px] font-medium text-surface-500 uppercase">{ABILITY_SHORT[ability]}</p>
                      <p className="text-[11px] font-bold text-surface-200">{getAbilityScore(char, ability)}</p>
                    </div>
                  ))}
                </div>

                {/* Player Name */}
                <p className="text-[10px] text-surface-500">
                  Player: {char.playerName || "Unassigned"}
                </p>
              </div>
              {/* Quick actions overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setShowInventoryId(char.id); }} className="rounded bg-surface-900/70 px-2 py-1 text-[10px] text-surface-300 hover:text-surface-100 backdrop-blur-sm" title="Inventory">🎒</button>
                <button onClick={(e) => { e.stopPropagation(); handleEditCharacter(char); }} className="rounded bg-surface-900/70 px-2 py-1 text-[10px] text-surface-300 hover:text-surface-100 backdrop-blur-sm">✏️</button>
                <button onClick={(e) => { e.stopPropagation(); exportCharacter(char); }} className="rounded bg-surface-900/70 px-2 py-1 text-[10px] text-surface-300 hover:text-surface-100 backdrop-blur-sm">📤</button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(char.id); }} className="rounded bg-surface-900/70 px-2 py-1 text-[10px] text-warrior-400 hover:text-warrior-300 backdrop-blur-sm" title="Remove character">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCharacter(null)}>
          <div className="w-full max-w-2xl rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-surface-100">{selectedCharacter.name}</h3>
                  <p className="text-sm text-surface-400">{selectedCharacter.race} {selectedCharacter.class} · Level {selectedCharacter.level}</p>
                </div>
                <button onClick={() => setSelectedCharacter(null)} className="text-surface-500 hover:text-surface-200">✕</button>
              </div>

              {/* Overview */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <DetailItem label="Race" value={selectedCharacter.race} />
                <DetailItem label="Class" value={selectedCharacter.class} />
                <DetailItem label="Level" value={selectedCharacter.level.toString()} />
                <DetailItem label="Player" value={selectedCharacter.playerName || "—"} />
              </div>

              {/* Ability Scores */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Ability Scores</h4>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {ABILITY_ORDER.map((ability) => {
                    const score = getAbilityScore(selectedCharacter, ability);
                    const mod = Math.floor((score - 10) / 2);
                    return (
                      <div key={ability} className="text-center rounded-lg border border-surface-700 bg-surface-800 p-3">
                        <p className="text-[10px] font-medium text-surface-500 uppercase">{ABILITY_SHORT[ability]}</p>
                        <p className="text-xl font-bold text-surface-100">{score}</p>
                        <p className={`text-xs font-medium ${mod >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>
                          {mod >= 0 ? "+" : ""}{mod}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HP & AC */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <DetailItem label="HP" value={`${selectedCharacter.hitPoints.current}/${selectedCharacter.hitPoints.max}`} />
                <DetailItem label="Armor Class" value={selectedCharacter.armorClass.toString()} />
                <DetailItem label="Initiative" value={`+${selectedCharacter.initiative}`} />
                <DetailItem label="Speed" value={`${selectedCharacter.speed || 30} ft`} />
              </div>

              {/* Equipment Summary */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
                  Equipment ({(selectedCharacter.equipment ?? []).length} items)
                </h4>
                {(selectedCharacter.equipment ?? []).length === 0 ? (
                  <p className="text-xs text-surface-500">No equipment recorded.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {(selectedCharacter.equipment ?? []).map((item, i) => (
                      <Badge key={`eq-${i}`} size="xs" variant="neutral">
                        {item.item} {item.quantity > 1 ? `×${item.quantity}` : ""}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency Summary */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">Currency</h4>
                <div className="flex gap-3 text-xs text-surface-300">
                  <span>🟤 {formatCurrency(selectedCharacter, "cp")} CP</span>
                  <span>⚪ {formatCurrency(selectedCharacter, "sp")} SP</span>
                  <span>🔵 {formatCurrency(selectedCharacter, "ep")} EP</span>
                  <span>🟡 {formatCurrency(selectedCharacter, "gp")} GP</span>
                  <span>💠 {formatCurrency(selectedCharacter, "pp")} PP</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-surface-700 pt-4">
                <Button variant="secondary" size="sm" onClick={() => { setShowInventoryId(selectedCharacter.id); setSelectedCharacter(null); }}>
                  🎒 Inventory
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEditCharacter(selectedCharacter)}>
                  ✏️ Edit Character
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCharacter(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInventoryId(null)}>
          <div className="w-full max-w-lg rounded-xl border border-surface-700 bg-surface-850 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <PlayerInventory
              character={characters.find((c: any) => c.id === showInventoryId)!}
              onClose={() => setShowInventoryId(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}>
          <div className="w-full max-w-sm rounded-xl border border-warrior-500/30 bg-surface-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <span className="text-4xl text-warrior-400">⚠️</span>
              <h3 className="mt-3 text-lg font-semibold text-surface-100">Remove Character?</h3>
              <p className="mt-2 text-sm text-surface-400">
                This will permanently delete{" "}
                <span className="font-semibold text-surface-200">
                  {characters.find((c: any) => c.id === deleteConfirmId)?.name}
                </span>{" "}
                from the campaign. This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const char = characters.find((c: any) => c.id === deleteConfirmId);
                    if (char) handleDeleteCharacter(char.id, char.name);
                  }}
                >
                  🗑️ Remove Character
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Character Form Modal */}
      {showCharacterForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowCharacterForm(false); setEditingCharacter(undefined); }}>
          <div className="w-full max-w-2xl rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-surface-100">
                {editingCharacter ? `Edit: ${editingCharacter.name}` : "New Character"}
              </h3>
              <button onClick={() => { setShowCharacterForm(false); setEditingCharacter(undefined); }} className="text-surface-500 hover:text-surface-200">✕</button>
            </div>
            <CharacterForm
              initialData={editingCharacter}
              onSubmit={handleCharacterSubmit}
              onCancel={() => { setShowCharacterForm(false); setEditingCharacter(undefined); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-Components ─────────────────────────────────────────── */

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
      <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-sm font-semibold text-surface-100">{value}</p>
    </div>
  );
}
