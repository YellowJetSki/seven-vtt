/* ── Global Compendium Search ──────────────────────────────────
 * A centralized search overlay that finds results across all data
 * types: spells, items, feats, conditions, monsters, and rules.
 *
 * ── Features ─────────────────────────────────────────────────
 * • Fuzzy search across all content types
 * • Tabbed results by category
 * • Quick-view details panel
 * • Keyboard shortcut: Ctrl+Shift+F to open
 * • Responsive: full-screen on mobile, modal on desktop
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { STATUS_EFFECTS } from "@/data/statusEffects";

interface SearchResult {
  id: string;
  type: "spell" | "item" | "feat" | "condition" | "monster" | "player";
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  source: string;
}

type ResultTab = "all" | "spell" | "item" | "feat" | "condition" | "monster";

const TAB_ORDER: ResultTab[] = ["all", "spell", "item", "feat", "condition", "monster"];
const TAB_LABELS: Record<ResultTab, string> = {
  all: "All",
  spell: "Spells",
  item: "Items",
  feat: "Feats",
  condition: "Conditions",
  monster: "Monsters",
};

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return false;
  // Direct substring match (fast)
  if (t.includes(q)) return true;
  // Word-by-word prefix match
  const words = q.split(/\s+/);
  return words.every((word) =>
    word.split("").every((char, i) => {
      const idx = t.indexOf(char, i === 0 ? 0 : t.indexOf(words[words.indexOf(word)][i - 1]) + 1);
      return idx !== -1;
    }),
  );
}

// Convert STATUS_EFFECTS record to an array for iteration
const CONDITION_ENTRIES = Object.entries(STATUS_EFFECTS).map(([key, def]) => ({
  id: key,
  name: def.label,
  description: def.description,
  icon: def.icon,
}));

export function GlobalCompendium() {
  const homebrewItems = useHomebrewStore((s) => s.items);
  const homebrewSpells = useHomebrewStore((s) => s.spells);
  const homebrewFeats = useHomebrewStore((s) => s.feats);
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const campaign = meta ? { id: meta.id, name: meta.name, playerCharacters: characters } : null;
  const showToast = useUiStore((s) => s.showToast);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ResultTab>("all");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+Shift+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
      setSelectedResult(null);
      setActiveTab("all");
    }
  }, [isOpen]);

  // Build search index from all data sources
  const allResults = useMemo(() => {
    const results: SearchResult[] = [];

    // Homebrew items
    homebrewItems.forEach((item) => {
      results.push({
        id: `item_${item.id}`,
        type: "item",
        name: item.name,
        subtitle: item.category ?? "Item",
        description: item.description ?? "",
        icon: "⚗️",
        source: "Homebrew",
      });
    });

    // Homebrew spells
    homebrewSpells.forEach((spell) => {
      results.push({
        id: `spell_${spell.id}`,
        type: "spell",
        name: spell.name,
        subtitle: `${spell.level === 0 ? "Cantrip" : `Level ${spell.level}`} · ${spell.school}`,
        description: spell.description ?? "",
        icon: "🔮",
        source: "Homebrew",
      });
    });

    // Homebrew feats
    homebrewFeats.forEach((feat) => {
      results.push({
        id: `feat_${feat.id}`,
        type: "feat",
        name: feat.name,
        subtitle: feat.prerequisites.length > 0
          ? `Requires: ${feat.prerequisites.map((p) => p.description).join(", ")}`
          : "Feat",
        description: feat.description ?? "",
        icon: "💪",
        source: "Homebrew",
      });
    });

    // Conditions (from status effects data)
    CONDITION_ENTRIES.forEach((cond) => {
      results.push({
        id: `condition_${cond.id}`,
        type: "condition",
        name: cond.name,
        subtitle: "Condition",
        description: cond.description,
        icon: cond.icon ?? "⚠️",
        source: "SRD",
      });
    });

    // Player characters
    campaign?.playerCharacters.forEach((pc) => {
      results.push({
        id: `player_${pc.id}`,
        type: "monster",
        name: pc.name,
        subtitle: `${pc.race} ${pc.class} (Level ${pc.level})`,
        description: `HP ${pc.hitPoints.current}/${pc.hitPoints.max} · AC ${pc.armorClass} · ${pc.alignment ?? "Unaligned"}`,
        icon: "⚔️",
        source: "Party",
      });
    });

    return results;
  }, [homebrewItems, homebrewSpells, homebrewFeats, campaign]);

  // Filtered results
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const results = activeTab === "all"
      ? allResults
      : allResults.filter((r) => r.type === activeTab);
    return results.filter((r) => fuzzyMatch(r.name, searchQuery) || fuzzyMatch(r.description, searchQuery));
  }, [allResults, searchQuery, activeTab]);

  // Group results by type for display
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    filteredResults.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [filteredResults]);

  const handleSelect = useCallback((result: SearchResult) => {
    setSelectedResult(result);
  }, []);

  const handleCopyName = useCallback((name: string) => {
    navigator.clipboard.writeText(name).then(() => {
      showToast({ message: `Copied "${name}" to clipboard`, type: "success" });
    }).catch(() => {
      showToast({ message: "Failed to copy", type: "error" });
    });
  }, [showToast]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal — full screen on mobile, max-w-2xl on desktop */}
      <div className="fixed left-1/2 top-1/2 z-[201] flex h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-surface-700 bg-surface-850 shadow-2xl animate-in fade-in zoom-in-95 duration-150 md:h-auto md:max-h-[80vh]">
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-surface-700 px-4 py-3">
          <span className="text-surface-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedResult(null);
            }}
            placeholder="Search spells, items, feats, conditions..."
            className="flex-1 bg-transparent text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-surface-500 hover:text-surface-300"
            >
              ✕
            </button>
          )}
          <span className="hidden text-[10px] text-surface-600 sm:inline">Ctrl+Shift+F</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-surface-700/50 px-3 py-2 overflow-x-auto">
          {TAB_ORDER.map((tab) => {
            const count = tab === "all"
              ? filteredResults.length
              : filteredResults.filter((r) => r.type === tab).length;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedResult(null); }}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-accent-600 text-white"
                    : "text-surface-400 hover:bg-surface-700 hover:text-surface-200"
                }`}
              >
                <span>{TAB_LABELS[tab]}</span>
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                    activeTab === tab ? "bg-white/15" : "bg-surface-700"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results Area */}
        <div className="flex flex-1 overflow-hidden md:flex-1">
          {/* Results List */}
          <div className={`w-full overflow-y-auto ${selectedResult ? "hidden md:w-1/2 md:block" : ""}`}>
            {searchQuery.trim() === "" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="mb-3 text-4xl text-surface-600">🔎</span>
                <p className="text-sm text-surface-500">Type to search across all compendium data</p>
                <p className="mt-1 text-xs text-surface-600">
                  {allResults.length} indexed entries
                </p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="mb-3 text-3xl text-surface-600">🔍</span>
                <p className="text-sm text-surface-500">No results found</p>
                <p className="text-xs text-surface-600">Try a different search term or check your spelling</p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {/* Grouped by type */}
                {Object.entries(groupedResults).map(([type, results]) => (
                  <div key={type}>
                    {activeTab === "all" && (
                      <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                        {TAB_LABELS[type as ResultTab] ?? type}
                        <span className="ml-1.5 text-surface-600">({results.length})</span>
                      </h4>
                    )}
                    <div className="space-y-1">
                      {results.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                            selectedResult?.id === result.id
                              ? "bg-accent-500/10"
                              : "hover:bg-surface-800"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{result.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-surface-200">
                                {result.name}
                              </p>
                              <p className="truncate text-[11px] text-surface-500">{result.subtitle}</p>
                            </div>
                            <span className="shrink-0 rounded bg-surface-800 px-1.5 py-0.5 text-[9px] text-surface-500">
                              {result.source}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedResult && (
            <div className="hidden border-l border-surface-700 p-4 md:block md:w-1/2">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedResult.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-surface-100">{selectedResult.name}</h3>
                      <p className="text-xs text-surface-500">{selectedResult.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="rounded bg-accent-500/10 px-2 py-0.5 text-[10px] font-medium text-accent-400">
                    {selectedResult.type}
                  </span>
                  <span className="rounded bg-surface-800 px-2 py-0.5 text-[10px] text-surface-400">
                    {selectedResult.source}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-surface-300">
                  {selectedResult.description || "No description available."}
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleCopyName(selectedResult.name)}
                    className="rounded-md bg-surface-800 px-3 py-1.5 text-xs font-medium text-surface-300 hover:bg-surface-700 transition-colors"
                  >
                    📋 Copy Name
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-surface-700 px-4 py-2">
          <span className="text-[10px] text-surface-600">
            {searchQuery.trim() ? `${filteredResults.length} result${filteredResults.length !== 1 ? "s" : ""}` : `${allResults.length} indexed`}
          </span>
          <div className="flex gap-3 text-[10px] text-surface-600">
            <span>↑↓ Navigate</span>
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </>
  );
}
