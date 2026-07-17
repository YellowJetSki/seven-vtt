/* ── Player Cards — Party Management ───────────────────────────
 * Full CRUD interface for player characters with grid/compendium
 * views, search, sort, import/export, detail modals.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PartyCompendium } from "@/components/player/PartyCompendium";
import { CharacterForm } from "@/components/player/CharacterForm";
import { PlayerInventory } from "@/components/player/PlayerInventory";
import { CharacterCard } from "@/components/player/CharacterCard";
import { CharacterDetailModal } from "@/components/player/CharacterDetailModal";
import { DeleteConfirmModal } from "@/components/player/DeleteConfirmModal";
import { exportCharacter, exportAllCharacters, importCharacterFromFile, formatCurrency } from "@/lib/character-export";
import type { PlayerCharacter } from "@/types";

type ViewMode = "grid" | "compendium";
type SortKey = "name" | "level" | "class" | "race";

export function PlayerCards() {
  const campaign = useCampaignStore((s) => s.campaign);
  const characters = useCampaignStore((s) => s.campaign?.playerCharacters ?? []);
  const addCharacter = useCampaignStore((s) => s.addCharacter);
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const removeCharacter = useCampaignStore((s) => s.removeCharacter);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCharacter, setSelectedCharacter] = useState<PlayerCharacter | null>(null);
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<PlayerCharacter | undefined>();
  const [showInventoryId, setShowInventoryId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...characters];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.class.toLowerCase().includes(q) || c.race.toLowerCase().includes(q) || c.playerName.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "level") return b.level - a.level;
      if (sortKey === "class") return a.class.localeCompare(b.class);
      return a.race.localeCompare(b.race);
    });
    return list;
  }, [characters, searchQuery, sortKey]);

  const partyStats = useMemo(() => {
    if (characters.length === 0) return null;
    return {
      avgLevel: Math.round(characters.reduce((a, c) => a + c.level, 0) / characters.length),
      classes: [...new Set(characters.map((c) => c.class))],
      races: [...new Set(characters.map((c) => c.race))],
      count: characters.length,
    };
  }, [characters]);

  const handleImport = async () => {
    try {
      const data = await importCharacterFromFile();
      addCharacter(data);
      useUiStore.getState().showToast({ message: `Imported "${data.name}"!`, type: "success" });
    } catch (err) {
      useUiStore.getState().showToast({ message: err instanceof Error ? err.message : "Import failed", type: "error" });
    }
  };

  if (!campaign) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <span className="text-6xl text-surface-600">⚔</span>
          <h2 className="mt-4 text-xl font-bold text-surface-100">No Campaign Active</h2>
          <p className="mt-2 text-sm text-surface-400">Create or import a campaign from the Dashboard first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Player Characters"
        subtitle={characters.length > 0 ? `${characters.length} hero${characters.length !== 1 ? "es" : ""} registered` : "No characters yet"} icon="⚔"
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex rounded-lg border border-surface-700 bg-surface-850 p-0.5">
              <button onClick={() => setViewMode("grid")} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${viewMode === "grid" ? "bg-accent-600 text-white" : "text-surface-400 hover:text-surface-200"}`}>Grid</button>
              <button onClick={() => setViewMode("compendium")} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${viewMode === "compendium" ? "bg-accent-600 text-white" : "text-surface-400 hover:text-surface-200"}`}>Compendium</button>
            </div>
            {characters.length > 0 && <Button variant="ghost" size="xs" onClick={() => exportAllCharacters(characters)}>📦 Export All</Button>}
            <Button variant="ghost" size="xs" onClick={handleImport}>📥 Import</Button>
            <Button size="sm" onClick={() => { setEditingCharacter(undefined); setShowCharacterForm(true); }}>+ Add Character</Button>
          </div>
        }
      />

      {partyStats && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-700 bg-surface-850 px-4 py-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rogue-500" /><span className="text-surface-400">Party: <span className="text-surface-200 font-medium">{partyStats.count} PCs</span></span></span>
          <span className="text-surface-600">·</span>
          <span className="text-surface-400">Avg Level: <span className="text-surface-200 font-medium">{partyStats.avgLevel}</span></span>
          <span className="text-surface-600">·</span>
          <span className="text-surface-400">Classes: <span className="text-surface-200 font-medium">{partyStats.classes.join(", ")}</span></span>
          <span className="text-surface-600">·</span>
          <span className="text-surface-400">Races: <span className="text-surface-200 font-medium">{partyStats.races.join(", ")}</span></span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, class, race, or player..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">✕</button>}
        </div>
        <div className="flex gap-1 rounded-lg bg-surface-850 p-0.5">
          {(["name", "level", "class", "race"] as SortKey[]).map((key) => (
            <button key={key} onClick={() => setSortKey(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${sortKey === key ? "bg-accent-600 text-white" : "text-surface-400 hover:text-surface-200"}`}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {characters.length === 0 ? (
        <EmptyState icon="⚔" title="No player characters yet"
          description="Create or import your first character."
          action={{ label: "Add Character", onClick: () => { setEditingCharacter(undefined); setShowCharacterForm(true); } }}
          secondaryAction={{ label: "Import from File", onClick: handleImport }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No matches found" description={`No characters match "${searchQuery}".`}
          action={searchQuery ? { label: "Clear Search", onClick: () => setSearchQuery("") } : undefined} />
      ) : viewMode === "compendium" ? (
        <PartyCompendium />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((char, idx) => (
            <CharacterCard key={char.id} character={char} index={idx}
              onOpen={() => setSelectedCharacter(char)}
              onEdit={() => { setSelectedCharacter(null); setEditingCharacter(char); setShowCharacterForm(true); }}
              onOpenInventory={() => setShowInventoryId(char.id)}
              onExport={() => exportCharacter(char)}
              onDelete={() => setDeleteConfirmId(char.id)} />
          ))}
        </div>
      )}

      {selectedCharacter && (
        <CharacterDetailModal character={selectedCharacter} onClose={() => setSelectedCharacter(null)}
          onEdit={() => { const c = selectedCharacter; setSelectedCharacter(null); setEditingCharacter(c); setShowCharacterForm(true); }}
          onOpenInventory={() => { setShowInventoryId(selectedCharacter.id); setSelectedCharacter(null); }} />
      )}

      {showInventoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInventoryId(null)}>
          <div className="w-full max-w-lg rounded-xl border border-surface-700 bg-surface-850 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <PlayerInventory character={characters.find((c) => c.id === showInventoryId)!} onClose={() => setShowInventoryId(null)} />
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <DeleteConfirmModal characterName={characters.find((c) => c.id === deleteConfirmId)?.name ?? ""}
          onConfirm={() => { removeCharacter(deleteConfirmId); setDeleteConfirmId(null); useUiStore.getState().showToast({ message: "Character removed.", type: "success" }); }}
          onCancel={() => setDeleteConfirmId(null)} />
      )}

      {showCharacterForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowCharacterForm(false); setEditingCharacter(undefined); }}>
          <div className="w-full max-w-2xl rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-surface-100">{editingCharacter ? `Edit: ${editingCharacter.name}` : "New Character"}</h3>
              <button onClick={() => { setShowCharacterForm(false); setEditingCharacter(undefined); }} className="text-surface-500 hover:text-surface-200">✕</button>
            </div>
            <CharacterForm initialData={editingCharacter}
              onSubmit={(char) => {
                if (editingCharacter) { updateCharacter(char.id, char); useUiStore.getState().showToast({ message: `"${char.name}" updated.`, type: "success" }); }
                else { addCharacter(char); useUiStore.getState().showToast({ message: `"${char.name}" added!`, type: "success" }); }
                setShowCharacterForm(false); setEditingCharacter(undefined);
              }}
              onCancel={() => { setShowCharacterForm(false); setEditingCharacter(undefined); }} />
          </div>
        </div>
      )}
    </div>
  );
}
