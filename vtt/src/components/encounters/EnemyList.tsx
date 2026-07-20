/**
 * STᚱ VTT — Enemy List (Premium NPC Library Browser v3.0)
 *
 * Searchable, filterable, sortable grid of all enemies in the campaign.
 * Premium glass dark inputs, gold gradient filter chips, staggered cards.
 * Shows name, type, CR, AC, HP, size at a glance.
 * Click to open full statblock.
 */

import { useMemo, useState } from "react";
import type { EnemyDoc } from "@/types";

interface EnemyListProps {
  enemies: EnemyDoc[];
  onSelect: (enemy: EnemyDoc) => void;
  onQuickCreate: () => void;
  onDuplicate: (enemy: EnemyDoc) => void;
  /** External search query from parent (e.g. BestiaryPanel search bar) */
  searchQuery?: string;
  /** If set, shows "Add to Encounter" button on each card */
  onAddToEncounter?: (enemyId: string) => void;
  /** Label for the encounter context (e.g. "Goblin Ambush") */
  encounterContextLabel?: string;
}

const CREATURE_TYPES = [
  "All", "Aberration", "Beast", "Celestial", "Construct", "Dragon",
  "Elemental", "Fey", "Fiend", "Giant", "Humanoid",
  "Monstrosity", "Ooze", "Plant", "Undead", "Custom",
];

function formatCr(cr: number): string {
  if (cr === 0) return "0";
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

function getCrSortValue(cr: number): number {
  return cr;
}

export default function EnemyList({ enemies, onSelect, onQuickCreate, onDuplicate, searchQuery, onAddToEncounter, encounterContextLabel }: EnemyListProps) {
  const [search, setSearch] = useState(searchQuery || "");

  // Sync external searchQuery with internal state
  if (searchQuery !== undefined && searchQuery !== search) {
    setSearch(searchQuery);
  }
  const [typeFilter, setTypeFilter] = useState("All");
  const [crMin, setCrMin] = useState<number>(0);
  const [crMax, setCrMax] = useState<number>(30);
  const [sortBy, setSortBy] = useState<"name" | "cr" | "hp" | "type">("cr");

  const filtered = useMemo(() => {
    let result = [...enemies];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q) ||
          e.senses?.toLowerCase().includes(q) ||
          e.languages?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== "All") {
      result = result.filter((e) => e.type === typeFilter);
    }

    // CR range
    result = result.filter((e) => e.challengeRating >= crMin && e.challengeRating <= crMax);

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "cr": return getCrSortValue(a.challengeRating) - getCrSortValue(b.challengeRating);
        case "hp": return b.hitPoints.max - a.hitPoints.max;
        case "type": return a.type.localeCompare(b.type);
        default: return 0;
      }
    });

    return result;
  }, [enemies, search, typeFilter, crMin, crMax, sortBy]);

  // CR distribution stats
  const stats = useMemo(() => {
    const total = enemies.length;
    const byType: Record<string, number> = {};
    enemies.forEach((e) => { byType[e.type] = (byType[e.type] || 0) + 1; });
    const avgCr = total > 0 ? enemies.reduce((s, e) => s + e.challengeRating, 0) / total : 0;
    return { total, avgCr, byType };
  }, [enemies]);

  // Extract unique types for quick-type badge filtering (top 6 most common)
  const topTypes = useMemo(() => {
    return Object.entries(stats.byType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([type]) => type);
  }, [stats.byType]);

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      Aberration: "text-violet-400 bg-violet-500/10 border-violet-500/15",
      Beast: "text-amber-400 bg-amber-500/10 border-amber-500/15",
      Celestial: "text-gold-400 bg-gold-500/10 border-gold/15",
      Construct: "text-cyan-400 bg-cyan-500/10 border-cyan-500/15",
      Dragon: "text-rose-400 bg-rose-500/10 border-rose-500/15",
      Elemental: "text-blue-400 bg-blue-500/10 border-blue-500/15",
      Fey: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15",
      Fiend: "text-red-400 bg-red-500/10 border-red-500/15",
      Giant: "text-orange-400 bg-orange-500/10 border-orange-500/15",
      Humanoid: "text-sky-400 bg-sky-500/10 border-sky-500/15",
      Monstrosity: "text-rose-400 bg-rose-500/10 border-rose-500/15",
      Ooze: "text-lime-400 bg-lime-500/10 border-lime-500/15",
      Plant: "text-green-400 bg-green-500/10 border-green-500/15",
      Undead: "text-indigo-400 bg-indigo-500/10 border-indigo-500/15",
      Custom: "text-surface-400 bg-surface-500/10 border-surface-500/15",
    };
    return colors[type] || "text-surface-400 bg-surface-500/10 border-surface-500/15";
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* ── Premium Filters Bar ── */}
      <div className="shrink-0 space-y-2.5 mb-4">
        {/* Search + Sort row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group/search">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search monsters by name, type..."
              className="w-full py-2 pl-8 pr-3 rounded-lg text-[11px] bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-600 transition-all duration-200"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-surface-600 group-focus-within/search:text-gold-400/60 transition-colors duration-200">🔍</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-2 py-2 rounded-lg text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-surface-400 focus:outline-none focus:border-gold/25 appearance-none cursor-pointer transition-all"
          >
            <option value="cr">Sort: CR</option>
            <option value="name">Sort: Name</option>
            <option value="hp">Sort: HP</option>
            <option value="type">Sort: Type</option>
          </select>
          <button
            onClick={onQuickCreate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-semibold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 transition-all duration-200 whitespace-nowrap"
          >
            <span>👾</span>
            <span>New Monster</span>
          </button>
        </div>

        {/* Type quick-filter chips + CR range */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setTypeFilter("All")}
              className={`text-[9px] px-2 py-0.5 rounded transition-all duration-150 ${typeFilter === "All" ? "bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400" : "text-surface-500 hover:text-surface-300 border border-transparent hover:border-white/[0.06]"}`}
            >
              All ({enemies.length})
            </button>
            {topTypes.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? "All" : type)}
                className={`text-[9px] px-2 py-0.5 rounded transition-all duration-150 ${typeFilter === type ? "bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400" : "text-surface-500 hover:text-surface-300 border border-transparent hover:border-white/[0.06]"}`}
              >
                {type}
              </button>
            ))}
            {typeFilter !== "All" && !topTypes.includes(typeFilter) && (
              <span className="text-[9px] px-2 py-0.5 rounded bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 flex items-center gap-1">
                {typeFilter}
                <button onClick={() => setTypeFilter("All")} className="text-gold-400/50 hover:text-gold-300">✕</button>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[8px] text-surface-600">CR:</span>
            <input
              type="number" value={crMin} min={0} max={30}
              onChange={(e) => setCrMin(Math.max(0, Math.min(30, parseFloat(e.target.value) || 0)))}
              className="w-10 bg-[#07080d]/70 border border-white/[0.06] rounded px-1 py-0.5 text-[9px] text-center text-surface-400 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
            />
            <span className="text-[8px] text-surface-700">—</span>
            <input
              type="number" value={crMax} min={0} max={30}
              onChange={(e) => setCrMax(Math.max(0, Math.min(30, parseFloat(e.target.value) || 30)))}
              className="w-10 bg-[#07080d]/70 border border-white/[0.06] rounded px-1 py-0.5 text-[9px] text-center text-surface-400 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Enemy Grid ── */}
      <div className="flex-1 overflow-y-auto scrollbar-gold">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-amber-500/5" />
              <div className="absolute inset-0 rounded-2xl border border-gold-500/20" />
              <div className="absolute inset-2 bg-gold-500/10 rounded-xl blur-[4px]" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                👾
              </span>
            </div>
            <h3 className="text-sm font-bold text-surface-300 mb-1">
              {enemies.length === 0 ? "No Monsters Yet" : "No Matches"}
            </h3>
            <p className="text-[11px] text-surface-500 max-w-sm leading-relaxed mb-4">
              {enemies.length === 0
                ? "Create your first NPC to build your campaign's monster library."
                : "Try adjusting your search or filters."}
            </p>
            {enemies.length === 0 && (
              <button
                onClick={onQuickCreate}
                className="px-4 py-2 rounded-lg text-[11px] font-semibold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 transition-all duration-200"
              >
                👾 Create First Monster
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filtered.map((enemy, idx) => (
              <button
                key={enemy.id}
                onClick={() => onSelect(enemy)}
                className="w-full text-left bg-gradient-to-b from-[#14151f]/70 to-[#0f101a]/85 border border-white/[0.04] rounded-xl p-3 hover:border-gold-500/15 hover:bg-gradient-to-br hover:from-gold-500/[0.02] hover:to-amber-500/[0.01] active:scale-[0.99] transition-all duration-200 group relative overflow-hidden"
                style={{ animation: `slide-in-up 0.4s ease-out ${idx * 40}ms both` }}
              >
                {/* Edge light on hover */}
                <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/20 to-transparent transition-all duration-500" />

                <div className="flex items-start gap-2.5 relative z-10">
                  {/* Type icon */}
                  <div className={`shrink-0 w-8 h-8 rounded-lg ${getTypeColor(enemy.type)} flex items-center justify-center text-xs`}>
                    {enemy.type === "Humanoid" ? "🧑" :
                     enemy.type === "Beast" ? "🐺" :
                     enemy.type === "Dragon" ? "🐉" :
                     enemy.type === "Undead" ? "💀" :
                     enemy.type === "Fiend" ? "👿" :
                     enemy.type === "Celestial" ? "😇" :
                     enemy.type === "Construct" ? "🤖" :
                     enemy.type === "Elemental" ? "🌪" :
                     enemy.type === "Fey" ? "🧚" :
                     enemy.type === "Giant" ? "🦶" :
                     enemy.type === "Monstrosity" ? "👹" :
                     enemy.type === "Ooze" ? "🟢" :
                     enemy.type === "Plant" ? "🌿" :
                     enemy.type === "Aberration" ? "👁" :
                     "❓"}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name row */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-surface-200 truncate group-hover:text-gold-200 transition-colors">
                        {enemy.name}
                      </span>
                      <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 font-semibold">
                        CR {formatCr(enemy.challengeRating)}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-surface-500">
                      <span>{enemy.size}</span>
                      <span>·</span>
                      <span className={`px-1 py-0 rounded text-[9px] ${getTypeColor(enemy.type)}`}>
                        {enemy.type}
                      </span>
                      <span>·</span>
                      <span className="text-cyan-300">{enemy.armorClass} AC</span>
                      <span>·</span>
                      <span className="text-green-400">{enemy.hitPoints.max} HP</span>
                    </div>

                    {/* Quick tags */}
                    {enemy.traits && (
                      <div className="mt-1.5 text-[9px] text-surface-600 truncate">
                        {enemy.traits.slice(0, 80)}{enemy.traits.length > 80 ? "..." : ""}
                      </div>
                    )}
                  </div>

                  {/* Add to Encounter button */}
                  {onAddToEncounter && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddToEncounter(enemy.id); }}
                      className="shrink-0 self-start mt-0.5 px-1.5 py-1 rounded text-[8px] font-semibold bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/12 active:scale-90 transition-all opacity-0 group-hover:opacity-100"
                      title={encounterContextLabel ? `Add to "${encounterContextLabel}"` : "Add to encounter"}
                    >
                      + Add
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Stats footer ── */}
      <div className="shrink-0 mt-3 pt-3 border-t border-white/[0.03] flex items-center justify-between text-[9px] text-surface-600">
        <span className="tabular-nums">
          Showing {filtered.length} of {enemies.length} monsters
        </span>
        <span className="tabular-nums">
          Avg CR {stats.avgCr.toFixed(1)} · {Object.keys(stats.byType).length} types
        </span>
      </div>
    </div>
  );
}
