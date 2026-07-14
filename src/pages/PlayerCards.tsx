/* ── Player Cards — Party Management ───────────────────────────
 * Full CRUD interface for player characters with grid/compendium
 * views, search, sort, character import/export, and detail modals.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PartyCompendium } from "@/components/player/PartyCompendium";
import { CharacterForm } from "@/components/player/CharacterForm";
import type { PlayerCharacter, Ability } from "@/types";

type ViewMode = "grid" | "compendium";
type SortKey = "name" | "level" | "class" | "race";

const ABILITY_ORDER: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABILITY_SHORT: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

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

export function PlayerCards() {
  const characters = useCampaignStore((s) => s.campaign?.playerCharacters ?? []);
  const addCharacter = useCampaignStore((s) => s.addCharacter);
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCharacter, setSelectedCharacter] = useState<PlayerCharacter | null>(null);
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<PlayerCharacter | undefined>();

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

  const handleAddCharacter = () => { setEditingCharacter(undefined); setShowCharacterForm(true); };
  const handleEditCharacter = (char: PlayerCharacter) => {
    setSelectedCharacter(null);
    setEditingCharacter(char);
    setShowCharacterForm(true);
    useUiStore.getState().closeModal();
  };
  const openCharacterDetail = (char: PlayerCharacter) => { setSelectedCharacter(char); useUiStore.getState().openModal("character-detail"); };

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
        if (!data.name || !data.class || !data.abilityScores) {
          useUiStore.getState().showToast({ message: "Invalid character file.", type: "error" });
          return;
        }
        data.id = `pc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        data.createdAt = Date.now();
        data.updatedAt = Date.now();
        addCharacter(data);
        useUiStore.getState().showToast({ message: `Imported "${data.name}"!`, type: "success" });
      } catch {
        useUiStore.getState().showToast({ message: "Failed to parse character file.", type: "error" });
      }
    };
    input.click();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">Player Characters</h2>
          <p className="mt-1 text-sm text-surface-400">
            {characters.length} hero{characters.length !== 1 ? "es" : ""} registered in the campaign
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-surface-700 bg-surface-850 p-0.5">
            <button onClick={() => setViewMode("grid")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${viewMode === "grid" ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"}`}>Grid</button>
            <button onClick={() => setViewMode("compendium")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${viewMode === "compendium" ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"}`}>Compendium</button>
          </div>
          <Button variant="ghost" size="xs" onClick={handleImportCharacter}>📥 Import</Button>
          <Button size="sm" onClick={handleAddCharacter}>+ Add Character</Button>
        </div>
      </div>

      {viewMode === "compendium" ? (
        <PartyCompendium />
      ) : (
        <>
          {/* Search & Sort Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, class, race, or player..."
                className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-surface-500 hover:bg-surface-700 hover:text-surface-300">✕</button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-500">Sort:</span>
              {(["name", "level", "class", "race"] as SortKey[]).map((key) => (
                <button key={key} onClick={() => setSortKey(key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${sortKey === key ? "bg-accent-500/15 text-accent-400" : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"}`}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Character Grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-700 bg-surface-850 py-16">
              <span className="text-4xl text-surface-600">{searchQuery ? "🔍" : "⚔"}</span>
              <p className="mt-3 text-sm text-surface-500">{searchQuery ? `No characters match "${searchQuery}".` : "No player characters yet. Add your first hero!"}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((char) => (
                <CharacterCard key={char.id} character={char} onClick={() => openCharacterDetail(char)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <Modal modalId="character-detail" title={selectedCharacter.name} size="xl">
          <CharacterDetail character={selectedCharacter} onEdit={() => handleEditCharacter(selectedCharacter)} onExport={() => exportCharacter(selectedCharacter)} />
        </Modal>
      )}

      {/* Character Form Modal */}
      {showCharacterForm && (
        <Modal modalId="character-form" title={editingCharacter ? `Edit: ${editingCharacter.name}` : "Add New Character"} size="lg">
          <CharacterForm initialData={editingCharacter} onSubmit={handleCharacterSubmit} onCancel={() => { setShowCharacterForm(false); setEditingCharacter(undefined); }} />
        </Modal>
      )}
    </div>
  );
}

/* ── Character Card ─────────────────────────────────────────── */

function CharacterCard({ character, onClick }: { character: PlayerCharacter; onClick: () => void }) {
  const hpPercent = (character.hitPoints.current / character.hitPoints.max) * 100;
  const hpColor = hpPercent > 50 ? "bg-rogue-500" : hpPercent > 25 ? "bg-divine-500" : "bg-warrior-500";
  return (
    <button onClick={onClick} className="group relative w-full text-left rounded-xl border border-surface-700 bg-surface-850 p-4 transition-all hover:border-surface-600 hover:bg-surface-800 focus-visible:outline-2 focus-visible:outline-accent-500">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-surface-100 truncate group-hover:text-accent-300 transition-colors">{character.name}</h3>
          <p className="text-xs text-surface-400 mt-0.5">{character.race} · {character.class}</p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-lg font-bold text-surface-100 leading-none">{character.level}</span>
          <span className="text-[10px] text-surface-500 uppercase tracking-wider">Level</span>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-surface-500 italic">Played by {character.playerName}</p>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-surface-400"><span>HP</span><span>{character.hitPoints.current}/{character.hitPoints.max}</span></div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-700"><div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPercent}%` }} /></div>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-1">
        {ABILITY_ORDER.map((abbr) => (
          <div key={abbr} className="rounded bg-surface-800 py-1 text-center">
            <p className="text-[10px] uppercase text-surface-500">{ABILITY_SHORT[abbr]}</p>
            <p className="text-xs font-bold text-surface-200">{character.abilityScores[abbr]}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-surface-500">
        <span>AC {character.armorClass}</span><span className="text-surface-600">|</span>
        <span>Speed {character.speed}ft</span><span className="text-surface-600">|</span>
        <span>Init {character.initiative >= 0 ? "+" : ""}{character.initiative}</span>
      </div>
    </button>
  );
}

/* ── Character Detail ───────────────────────────────────────── */

function CharacterDetail({ character, onEdit, onExport }: { character: PlayerCharacter; onEdit: () => void; onExport: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="h-24 w-24 shrink-0 rounded-xl bg-surface-800 flex items-center justify-center text-3xl border border-surface-700 overflow-hidden">
            {character.portraitUrl ? (
              <img src={character.portraitUrl} alt={character.name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              character.race.includes("Dwarf") ? "🪓" : character.race.includes("Elf") ? "🧝" : character.race.includes("Tabaxi") ? "🐱" : "✨"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-surface-100">{character.name}</h3>
            <p className="text-sm text-surface-400">{character.race} · {character.class}{character.subclass ? ` (${character.subclass})` : ""} · Level {character.level}</p>
            <p className="text-xs text-surface-500 mt-1">{character.background ? `${character.background} · ` : ""}{character.alignment ?? "Unaligned"}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="info">AC {character.armorClass}</Badge>
              <Badge variant="success">HP {character.hitPoints.current}/{character.hitPoints.max}</Badge>
              <Badge variant="accent">Speed {character.speed}ft</Badge>
              <Badge variant="neutral">Init {character.initiative >= 0 ? "+" : ""}{character.initiative}</Badge>
              <Badge variant="default">Prof +{character.proficiencyBonus}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="xs" variant="ghost" onClick={onExport}>📤 Export</Button>
          <Button size="xs" variant="secondary" onClick={onEdit}>Edit</Button>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Ability Scores</h4>
        <div className="grid grid-cols-6 gap-2">
          {ABILITY_ORDER.map((ability) => {
            const val = character.abilityScores[ability];
            const mod = Math.floor((val - 10) / 2);
            return (
              <div key={ability} className="rounded-lg border border-surface-700 bg-surface-800 p-2 text-center">
                <p className="text-[10px] uppercase text-surface-500">{ABILITY_SHORT[ability]}</p>
                <p className="text-lg font-bold text-surface-100">{val}</p>
                <p className={`text-xs font-medium ${mod >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{mod >= 0 ? "+" : ""}{mod}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Saving Throws</h4>
          <div className="space-y-1">{ABILITY_ORDER.map((ability) => { const bonus = character.savingThrows[ability]; if (bonus === undefined) return null; return (
            <div key={ability} className="flex items-center justify-between rounded bg-surface-800 px-3 py-1.5 text-sm"><span className="text-surface-400">{ABILITY_SHORT[ability]}</span><span className={`font-bold ${bonus >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{bonus >= 0 ? "+" : ""}{bonus}</span></div>
          ); })}</div>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Skills</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {(Object.entries(character.skills) as [string, number][]).map(([skill, bonus]) => (
              <div key={skill} className="flex items-center justify-between rounded bg-surface-800 px-3 py-1.5 text-sm">
                <span className="text-surface-400 truncate">{skill.replace(/([A-Z])/g, " $1").trim()}</span>
                <span className={`font-bold shrink-0 ml-2 ${bonus >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{bonus >= 0 ? "+" : ""}{bonus}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Features</h4>
          <ul className="space-y-1">{character.features.map((f, i) => <li key={i} className="text-sm text-surface-300 flex items-start gap-2"><span className="text-accent-400 mt-1">·</span>{f}</li>)}</ul>
        </div>
        <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Traits</h4>
          <ul className="space-y-1">{character.traits.map((t, i) => <li key={i} className="text-sm text-surface-300 flex items-start gap-2"><span className="text-mage-400 mt-1">·</span>{t}</li>)}</ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Equipment</h4>
          <ul className="space-y-1">{character.equipment.map((eq, i) => <li key={i} className="text-sm text-surface-300 flex items-start gap-2"><span className="text-divine-400">·</span>{eq}</li>)}</ul>
        </div>
        <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Currency</h4>
          <div className="space-y-1 rounded-lg bg-surface-800 p-3">
            <CurrencyRow label="Platinum" value={character.currency.pp} color="text-surface-200" />
            <CurrencyRow label="Gold" value={character.currency.gp} color="text-divine-400" />
            <CurrencyRow label="Electrum" value={character.currency.ep} color="text-mage-400" />
            <CurrencyRow label="Silver" value={character.currency.sp} color="text-surface-300" />
            <CurrencyRow label="Copper" value={character.currency.cp} color="text-divine-600" />
          </div>
        </div>
      </div>

      {character.backstory && <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Backstory</h4><p className="text-sm text-surface-300 leading-relaxed">{character.backstory}</p></div>}
      {character.notes && <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">DM Notes</h4><p className="text-sm italic text-surface-400 leading-relaxed">{character.notes}</p></div>}
    </div>
  );
}

function CurrencyRow({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="flex items-center justify-between"><span className="text-xs text-surface-500">{label}</span><span className={`text-sm font-bold ${color}`}>{value}</span></div>;
}
