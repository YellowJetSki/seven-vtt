/**
 * STᚱ VTT — Background Selector Component
 *
 * Premium glassmorphism background picker for character creation.
 * Reads from the SRD_BACKGROUNDS data library.
 * Shows icon, skill/tool proficiencies, languages, feature, gear.
 */
import { useState, useMemo } from "react";
import { SRD_BACKGROUNDS, type BackgroundDef } from "@/data/srd-backgrounds";

interface BackgroundSelectorProps {
  value: string;
  onChange: (name: string, bg: BackgroundDef | null) => void;
}

export default function BackgroundSelector({ value, onChange }: BackgroundSelectorProps) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return SRD_BACKGROUNDS;
    const q = search.toLowerCase();
    return SRD_BACKGROUNDS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.tags.some((t) => t.includes(q)) ||
        b.skillProficiencies.some((s) => s.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-wider font-bold text-surface-400">Background</label>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search backgrounds..."
        className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/80 placeholder-surface-500 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
      />

      {/* Grid */}
      <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto scrollbar-gold">
        {filtered.map((bg) => {
          const isSelected = value === bg.name;
          return (
            <button
              key={bg.id}
              type="button"
              onClick={() => {
                onChange(bg.name, bg);
                setExpandedId(expandedId === bg.id ? null : bg.id);
              }}
              className={`relative text-left px-2.5 py-2 rounded-lg border text-[11px] transition-all duration-150 ${
                isSelected
                  ? "bg-gold-500/10 border-gold/25 text-gold-300"
                  : "bg-white/[0.02] border-white/[0.04] text-surface-300 hover:border-white/[0.08] hover:bg-white/[0.03]"
              }`}
            >
              <span className="mr-1">{bg.icon}</span>
              {bg.name}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center text-surface-500 text-[10px] py-4">
            No backgrounds match "{search}"
          </div>
        )}
      </div>

      {/* Expanded Detail */}
      {expandedId && (() => {
        const bg = SRD_BACKGROUNDS.find((b) => b.id === expandedId);
        if (!bg) return null;
        return (
          <div className="bg-gradient-to-b from-[#14151f]/80 to-[#0c0d15]/90 border border-white/[0.04] rounded-xl p-3 text-[11px] space-y-1.5 animate-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-base">{bg.icon}</span>
              <span className="font-semibold text-white/90">{bg.name}</span>
              <span className="text-surface-500 ml-auto">{bg.source}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {bg.skillProficiencies.map((s) => (
                <span key={s} className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/15 text-cyan-300 text-[9px]">
                  {s}
                </span>
              ))}
              {bg.toolProficiencies.map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-300 text-[9px]">
                  {t}
                </span>
              ))}
              {bg.languages > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/15 text-violet-300 text-[9px]">
                  +{bg.languages} Languages
                </span>
              )}
            </div>
            <div className="text-surface-400">{bg.featureName}: {bg.featureDescription}</div>
            <div className="text-surface-500 text-[9px]">Equipment: {bg.equipment.join(", ")}</div>
          </div>
        );
      })()}
    </div>
  );
}
